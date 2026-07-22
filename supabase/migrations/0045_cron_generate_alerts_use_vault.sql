-- Move the service_role JWT used by the hourly `generate-alerts-every-hour`
-- pg_cron job out of plaintext cron.job.command and into Supabase Vault.
--
-- Problem: cron.job.command previously embedded the raw service_role JWT
-- (Authorization: Bearer ...) as a literal string. service_role bypasses RLS
-- entirely; storing it in plaintext in a queryable system table (readable via
-- SQL Editor, pg_dump, cron.job_run_details history) is a secret-hygiene gap,
-- even though cron.job isn't reachable through the public REST API.
--
-- This migration extracts the token from the EXISTING job at apply time (no
-- literal JWT anywhere in this file, ever), stores it in vault.secrets, and
-- reschedules the same job (same name/schedule/URL) to read the token from
-- vault.decrypted_secrets at call time instead.
--
-- Out of scope (do not touch): pg_net extension/schema, API key rotation to
-- sb_secret_* format, generate-alerts edge function code, RLS, app tables.

DO $$
DECLARE
  v_old_command text;
  v_token text;
  v_secret_name text := 'generate_alerts_service_role_key';
  v_secret_id uuid;
  v_unscheduled boolean;
BEGIN
  SELECT command INTO v_old_command
  FROM cron.job
  WHERE jobname = 'generate-alerts-every-hour';

  IF v_old_command IS NULL THEN
    -- No-op rather than hard fail: keeps this migration replayable on fresh/
    -- local/staging databases that never had the legacy plaintext job. Still
    -- never fabricates a new job silently.
    RAISE NOTICE 'cron job "generate-alerts-every-hour" not found on this database - skipping (nothing to migrate)';
    RETURN;
  END IF;

  v_token := (regexp_match(v_old_command, 'Bearer\s+([A-Za-z0-9\-_\.]+)'))[1];
  IF v_token IS NULL THEN
    RAISE EXCEPTION 'Could not extract Bearer token from existing cron.job command - aborting without touching the job';
  END IF;

  SELECT id INTO v_secret_id FROM vault.secrets WHERE name = v_secret_name;
  IF v_secret_id IS NULL THEN
    PERFORM vault.create_secret(
      v_token,
      v_secret_name,
      'service_role key for generate-alerts hourly cron (migrated off plaintext cron.job.command in 0045)'
    );
  ELSE
    PERFORM vault.update_secret(v_secret_id, v_token);
  END IF;

  SELECT cron.unschedule('generate-alerts-every-hour') INTO v_unscheduled;
  IF NOT v_unscheduled THEN
    RAISE EXCEPTION 'Failed to unschedule existing cron job - vault secret was written but job left untouched, retry';
  END IF;

  PERFORM cron.schedule(
    'generate-alerts-every-hour',
    '0 * * * *',
    $CRON$
    SELECT net.http_post(
      url := 'https://esmldgmwahhhplswmkui.supabase.co/functions/v1/generate-alerts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'generate_alerts_service_role_key'
        )
      ),
      body := '{}'::jsonb
    ) AS request_id;
    $CRON$
  );

  RAISE NOTICE 'generate-alerts-every-hour re-pointed to Vault secret %', v_secret_name;
END $$;
