-- Migration: Backfill trial records for existing users
-- Purpose: Create user_billing records with 14-day trial for users who don't have one

-- Insert user_billing records for users who don't have one yet
-- This gives existing users a 14-day trial starting from now
INSERT INTO public.user_billing (
  user_id,
  billing_status,
  trial_start,
  trial_end,
  trial_used,
  created_at,
  updated_at
)
SELECT 
  u.id as user_id,
  'trial' as billing_status,
  NOW() as trial_start,
  NOW() + INTERVAL '14 days' as trial_end,
  false as trial_used,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.user_billing ub 
  WHERE ub.user_id = u.id
)
AND u.deleted_at IS NULL; -- Only active users

-- Log how many records were created
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Created % user_billing records for existing users', inserted_count;
END $$;
