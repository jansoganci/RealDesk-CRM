# Sprint 4 — Batch H: generate-alerts Cron Schedule

> **Audit Source:** `docs/sprint-audits.md` → Sprint 4 (Gap #4)
> **Gap #4:** `generate-alerts` edge function exists at `supabase/functions/generate-alerts/index.ts` but has no cron trigger configured; alerts never fire automatically.
> **Project:** `/Users/jans/Projelerim/RealDesk-CRM/`

---

## Task H1: Add Cron Schedule for generate-alerts

### Problem
The `generate-alerts` edge function has all the logic to dispatch milestone deadline alerts, waiting-on-others nudges, and closing-soon reminders. But there's no scheduled trigger — it only runs when manually invoked.

### Approach
Supabase supports scheduling edge functions in two ways:

1. **SQL Migration** using `pg_cron` (recommended — version-controlled, survives redeploys)
2. **Supabase Dashboard** — requires manual click per environment

We'll use **SQL migration** since it matches the project's migration workflow.

### Files to Change

#### H1a. Create `supabase/migrations/0032_schedule_generate_alerts_cron.sql`

```sql
-- Schedule the generate-alerts edge function to run every hour
-- This dispatches:
--   - Overdue milestone alerts
--   - Due-today alerts (7 types)
--   - Waiting-on-others nudges
--   - Closing-soon reminders
--
-- The edge function itself is idempotent: it checks alert_sent_* flags
-- and only sends each alert once.

SELECT
  cron.schedule(
    'generate-alerts-every-hour',   -- unique job name
    '0 * * * *',                     -- every hour at :00
    $$
    SELECT
      net.http_post(
        url := current_setting('app.settings.edge_function_base_url') || '/generate-alerts',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $$
  );

COMMENT ON FUNCTION cron.schedule IS 'Generates milestone/notification alerts every hour via the generate-alerts edge function';
```

**Important:** Before applying, verify the last migration number:
```bash
ls supabase/migrations/ | tail -1
```

If the last migration is e.g. `0031_add_other_to_responsible_party.sql`, this should be `0032`.

**Also check:** The project needs `pg_cron` extension enabled on the Supabase database. If not already enabled, add this at the top of the migration:
```sql
-- Enable pg_cron extension (one-time setup)
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

#### H1b. (If env vars not set) Add settings to Supabase

The edge function URL and service role key need to be set as Supabase config settings. If they're not set, add to a migration or configure via Supabase dashboard:

```sql
-- Set required config values (if not already set)
-- These should match your Supabase project settings
-- ALTER DATABASE postgres SET app.settings.edge_function_base_url TO 'https://<project-ref>.supabase.co/functions/v1';
-- ALTER DATABASE postgres SET app.settings.service_role_key TO '<service-role-key>';
```

Due to security (service role key shouldn't be in git), the preferred approach is to set these in Supabase Dashboard → Database → Settings → `app.settings.*` parameters.

### Alternative (if pg_cron isn't available)

If `pg_cron` extension isn't available on the Supabase instance, configure via **Supabase Dashboard**:

1. Go to Supabase Dashboard → Edge Functions → `generate-alerts`
2. Click "Schedules" tab
3. Add schedule: `0 * * * *` (every hour)
4. Set HTTP method: POST
5. (Optional) Set request body: `{}`

This is the fallback if the SQL migration doesn't work with the project's Supabase plan.

### Verification

- Wait for the next :00 minute mark (or up to 1 hour)
- Check `notifications` table → new rows appear for triggered alerts
- Check edge function logs in Supabase Dashboard → no errors
- Manual test: Invoke via `supabase functions serve generate-alerts` locally or via dashboard
