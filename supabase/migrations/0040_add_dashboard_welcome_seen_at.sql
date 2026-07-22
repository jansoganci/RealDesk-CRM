-- Track whether a user has explicitly left the first-dashboard welcome experience.

ALTER TABLE public.user_preferences
  ADD COLUMN dashboard_welcome_seen_at timestamp with time zone;

COMMENT ON COLUMN public.user_preferences.dashboard_welcome_seen_at IS
  'When the user explicitly completed or dismissed the first-dashboard welcome experience; NULL means it has not been seen.';

-- Preserve the existing-user experience: everyone present when this migration runs
-- is considered to have already seen the welcome screen.
UPDATE public.user_preferences
SET dashboard_welcome_seen_at = now();

-- Some existing active users may not have a preferences row yet. Create the
-- minimal row required by the current schema and mark the welcome as seen.
INSERT INTO public.user_preferences (
  user_id,
  language,
  currency,
  meeting_reminder_minutes,
  commission_rate,
  dashboard_welcome_seen_at
)
SELECT
  users.id,
  'en',
  'USD',
  30,
  4.0,
  now()
FROM auth.users AS users
WHERE users.deleted_at IS NULL
ON CONFLICT (user_id) DO NOTHING;

--- REVERT
-- Existing preference rows created by the backfill are intentionally retained to
-- avoid deleting user-owned settings that may have been added after migration.
-- ALTER TABLE public.user_preferences
--   DROP COLUMN IF EXISTS dashboard_welcome_seen_at;
