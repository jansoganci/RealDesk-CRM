-- CCPA public submit infrastructure
--
-- RLS on data_subject_requests is intentionally unchanged: public submit inserts
-- via service-role Edge Functions (bypass RLS). Org-member SELECT/UPDATE policies
-- from 0038 remain for the admin dashboard. No anon INSERT/SELECT policy is added.

-- ---------------------------------------------------------------------------
-- Org link validation (anon-callable, returns boolean only — no org PII)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ccpa_org_link_valid(p_org_id uuid)
RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = p_org_id
  );
$$;

REVOKE ALL ON FUNCTION public.ccpa_org_link_valid(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ccpa_org_link_valid(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Rate limits (service_role only; scope keys are hashes, never raw IP/email)
-- ---------------------------------------------------------------------------
CREATE TABLE public.ccpa_request_rate_limits (
  scope_kind text NOT NULL CHECK (scope_kind IN ('ip', 'email')),
  scope_key text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('submit', 'status_check')),
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope_kind, scope_key, operation, window_start)
);

CREATE INDEX idx_ccpa_request_rate_limits_window
  ON public.ccpa_request_rate_limits (window_start);

ALTER TABLE public.ccpa_request_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ccpa_request_rate_limits FROM anon, authenticated;
GRANT ALL ON public.ccpa_request_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_ccpa_rate_limit(
  p_scope_kind text,
  p_scope_key text,
  p_operation text,
  p_limit integer,
  p_window_seconds integer
) RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_count integer := 0;
  v_retry_after integer;
BEGIN
  IF p_scope_kind NOT IN ('ip', 'email') THEN
    RAISE EXCEPTION 'Invalid CCPA rate-limit scope_kind';
  END IF;

  IF p_operation NOT IN ('submit', 'status_check') THEN
    RAISE EXCEPTION 'Invalid CCPA rate-limit operation';
  END IF;

  IF p_scope_key IS NULL OR length(p_scope_key) < 8 OR length(p_scope_key) > 128 THEN
    RAISE EXCEPTION 'Invalid CCPA rate-limit scope_key';
  END IF;

  IF p_limit < 1 OR p_limit > 1000 THEN
    RAISE EXCEPTION 'Invalid CCPA rate-limit limit';
  END IF;

  IF p_window_seconds < 60 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid CCPA rate-limit window';
  END IF;

  -- Align window to epoch buckets of p_window_seconds
  v_window_start := to_timestamp(
    floor(extract(epoch FROM v_now) / p_window_seconds) * p_window_seconds
  );

  PERFORM pg_advisory_xact_lock(
    hashtextextended('ccpa:' || p_scope_kind || ':' || p_scope_key || ':' || p_operation, 0)
  );

  SELECT request_count INTO v_count
  FROM public.ccpa_request_rate_limits
  WHERE scope_kind = p_scope_kind
    AND scope_key = p_scope_key
    AND operation = p_operation
    AND window_start = v_window_start;

  v_count := COALESCE(v_count, 0);

  IF v_count + 1 > p_limit THEN
    v_retry_after := GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM (v_window_start + make_interval(secs => p_window_seconds) - v_now)))::integer
    );
    RETURN jsonb_build_object('allowed', false, 'retry_after', v_retry_after);
  END IF;

  INSERT INTO public.ccpa_request_rate_limits (
    scope_kind, scope_key, operation, window_start, request_count, updated_at
  ) VALUES (
    p_scope_kind, p_scope_key, p_operation, v_window_start, 1, v_now
  )
  ON CONFLICT (scope_kind, scope_key, operation, window_start)
  DO UPDATE SET
    request_count = public.ccpa_request_rate_limits.request_count + 1,
    updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object('allowed', true, 'retry_after', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ccpa_rate_limit(text, text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ccpa_rate_limit(text, text, text, integer, integer)
  TO service_role;

-- Optional cleanup of old rate-limit windows (best-effort; cron may be unavailable)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-ccpa-request-rate-limits') THEN
      PERFORM cron.unschedule('cleanup-ccpa-request-rate-limits');
    END IF;

    PERFORM cron.schedule(
      'cleanup-ccpa-request-rate-limits',
      '20 * * * *',
      $CRON$
      DELETE FROM public.ccpa_request_rate_limits
      WHERE window_start < now() - interval '24 hours';
      $CRON$
    );
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- cron.job missing; skip scheduling
  WHEN OTHERS THEN
    NULL; -- do not fail migration if cron is unavailable
END $$;

-- ---------------------------------------------------------------------------
-- Audit trail (service_role only; hashes only — no plaintext PII)
-- ---------------------------------------------------------------------------
CREATE TABLE public.ccpa_request_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  action text NOT NULL CHECK (action IN ('submit', 'status_check')),
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  request_id uuid,
  outcome text NOT NULL CHECK (outcome IN ('success', 'denied', 'failed')),
  error_code text,
  ip_hash text NOT NULL,
  email_hash text
);

CREATE INDEX idx_ccpa_request_audit_occurred_at
  ON public.ccpa_request_audit (occurred_at DESC);

CREATE INDEX idx_ccpa_request_audit_org_time
  ON public.ccpa_request_audit (org_id, occurred_at DESC)
  WHERE org_id IS NOT NULL;

ALTER TABLE public.ccpa_request_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ccpa_request_audit FROM anon, authenticated;
GRANT ALL ON public.ccpa_request_audit TO service_role;

-- REVERT:
-- DROP FUNCTION IF EXISTS public.consume_ccpa_rate_limit(text, text, text, integer, integer);
-- DROP FUNCTION IF EXISTS public.ccpa_org_link_valid(uuid);
-- DROP TABLE IF EXISTS public.ccpa_request_audit;
-- DROP TABLE IF EXISTS public.ccpa_request_rate_limits;
-- SELECT cron.unschedule('cleanup-ccpa-request-rate-limits') WHERE EXISTS (
--   SELECT 1 FROM cron.job WHERE jobname = 'cleanup-ccpa-request-rate-limits'
-- );
