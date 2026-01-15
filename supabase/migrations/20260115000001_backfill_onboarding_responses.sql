-- =====================================================
-- BACKFILL ONBOARDING RESPONSES FROM ORGANIZATIONS TABLE
-- =====================================================
--
-- This migration backfills existing onboarding data from the
-- organizations table to the user_onboarding_responses table.
--
-- Only migrates data for organization OWNERS (not all members)
-- since onboarding responses are user-specific.
--
-- SAFE TO RUN: Uses ON CONFLICT DO NOTHING to avoid duplicates
-- ROLLBACK: 
--   DELETE FROM user_onboarding_responses 
--   WHERE question_key IN ('primary_use_case', 'team_size')
--   AND created_at >= '<timestamp when migration was run>';
--
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Backfill primary_use_case responses
-- =====================================================
-- Migrates primary_use_case from organizations table to
-- user_onboarding_responses table for organization owners
INSERT INTO public.user_onboarding_responses (
  user_id,
  org_id,
  question_key,
  answer,
  created_at,
  updated_at
)
SELECT 
  om.user_id,
  o.id as org_id,
  'primary_use_case' as question_key,
  to_jsonb(o.primary_use_case::text) as answer,
  o.created_at as created_at,
  o.updated_at as updated_at
FROM public.organizations o
INNER JOIN public.org_members om 
  ON om.org_id = o.id
WHERE o.primary_use_case IS NOT NULL
  AND om.role = 'owner'
  AND om.status = 'active'
ON CONFLICT (user_id, question_key) DO NOTHING;

-- =====================================================
-- 2. Backfill team_size responses
-- =====================================================
-- Migrates team_size_range from organizations table to
-- user_onboarding_responses table (as 'team_size' question_key)
-- for organization owners
INSERT INTO public.user_onboarding_responses (
  user_id,
  org_id,
  question_key,
  answer,
  created_at,
  updated_at
)
SELECT 
  om.user_id,
  o.id as org_id,
  'team_size' as question_key,
  to_jsonb(o.team_size_range::text) as answer,
  o.created_at as created_at,
  o.updated_at as updated_at
FROM public.organizations o
INNER JOIN public.org_members om 
  ON om.org_id = o.id
WHERE o.team_size_range IS NOT NULL
  AND om.role = 'owner'
  AND om.status = 'active'
ON CONFLICT (user_id, question_key) DO NOTHING;

-- =====================================================
-- 3. Summary statistics (for verification)
-- =====================================================
-- This query shows how many records were migrated
-- Note: ON CONFLICT DO NOTHING means actual inserts
-- may be less than the SELECT count if duplicates exist
DO $$
DECLARE
  primary_use_case_count INT;
  team_size_count INT;
BEGIN
  -- Count primary_use_case responses
  SELECT COUNT(*) INTO primary_use_case_count
  FROM public.user_onboarding_responses
  WHERE question_key = 'primary_use_case';
  
  -- Count team_size responses
  SELECT COUNT(*) INTO team_size_count
  FROM public.user_onboarding_responses
  WHERE question_key = 'team_size';
  
  -- Log summary (visible in migration logs)
  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  primary_use_case responses: %', primary_use_case_count;
  RAISE NOTICE '  team_size responses: %', team_size_count;
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (run manually after migration)
-- =====================================================
-- 
-- Check migration results:
-- SELECT 
--   question_key,
--   COUNT(*) as count
-- FROM user_onboarding_responses
-- WHERE question_key IN ('primary_use_case', 'team_size')
-- GROUP BY question_key;
--
-- Compare with source data:
-- SELECT 
--   COUNT(*) FILTER (WHERE primary_use_case IS NOT NULL) as orgs_with_use_case,
--   COUNT(*) FILTER (WHERE team_size_range IS NOT NULL) as orgs_with_team_size
-- FROM organizations o
-- INNER JOIN org_members om ON om.org_id = o.id
-- WHERE om.role = 'owner' AND om.status = 'active';
--
-- =====================================================
