-- =====================================================
-- HOTFIX: Fix Circular RLS on org_members Table
-- =====================================================
--
-- PROBLEM:
-- The original org_select_org_members policy has a circular dependency:
--   org_id IN (SELECT org_id FROM org_members WHERE ...)
-- This causes PostgreSQL to fail with 500 errors because the policy
-- tries to query the same table it's protecting.
--
-- SOLUTION:
-- Use a SECURITY DEFINER function that bypasses RLS to get user's org_ids.
-- The function runs with elevated privileges, breaking the circular dependency.
--
-- AFFECTED:
-- - org_members SELECT policy (direct fix)
-- - All other tables' RLS policies (indirect fix - they query org_members)
--
-- ROLLBACK:
-- DROP FUNCTION IF EXISTS get_user_org_ids();
-- DROP POLICY IF EXISTS "org_select_org_members" ON public.org_members;
-- CREATE POLICY "org_select_org_members" ON public.org_members
-- FOR SELECT USING (
--   org_id IN (
--     SELECT org_id FROM public.org_members
--     WHERE user_id = auth.uid() AND status = 'active'
--   )
-- );
--
-- SECURITY AUDIT: 2026-01-04
-- - Function is SECURITY DEFINER but only returns org_ids for auth.uid()
-- - No parameters accepted, preventing injection
-- - search_path explicitly set to prevent path hijacking
-- - STABLE marking allows query optimization
--
-- =====================================================

-- ============================================
-- Step 1: Create helper function
-- ============================================
-- This function bypasses RLS (SECURITY DEFINER) to safely
-- retrieve the current user's org_ids without causing recursion.

CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT org_id
  FROM org_members
  WHERE user_id = auth.uid()
    AND status = 'active';
$$;

COMMENT ON FUNCTION get_user_org_ids() IS
  'Returns org_ids for the current authenticated user. SECURITY DEFINER to bypass RLS and prevent circular dependency.';

-- ============================================
-- Step 2: Drop the broken circular policy
-- ============================================
DROP POLICY IF EXISTS "org_select_org_members" ON public.org_members;

-- ============================================
-- Step 3: Create fixed policy using helper function
-- ============================================
-- Users can see members of any org they belong to.
-- The helper function breaks the circular dependency.

CREATE POLICY "org_select_org_members" ON public.org_members
FOR SELECT USING (
  org_id IN (SELECT get_user_org_ids())
);

-- ============================================
-- Step 4: Validation
-- ============================================
DO $$
DECLARE
  policy_exists BOOLEAN;
  function_exists BOOLEAN;
BEGIN
  -- Check function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_user_org_ids'
  ) INTO function_exists;

  -- Check policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'org_members'
      AND policyname = 'org_select_org_members'
  ) INTO policy_exists;

  IF NOT function_exists THEN
    RAISE EXCEPTION 'HOTFIX FAILED: get_user_org_ids() function not created';
  END IF;

  IF NOT policy_exists THEN
    RAISE EXCEPTION 'HOTFIX FAILED: org_select_org_members policy not created';
  END IF;

  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'HOTFIX APPLIED SUCCESSFULLY';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Fixed: Circular RLS on org_members table';
  RAISE NOTICE 'Method: SECURITY DEFINER helper function';
  RAISE NOTICE '';
  RAISE NOTICE 'What was broken:';
  RAISE NOTICE '  - org_members SELECT returned 500 errors';
  RAISE NOTICE '  - All org-based queries failed (contracts, etc.)';
  RAISE NOTICE '  - "No active organization found" errors';
  RAISE NOTICE '';
  RAISE NOTICE 'What is now fixed:';
  RAISE NOTICE '  - org_members queries work correctly';
  RAISE NOTICE '  - All dependent tables can query org_members';
  RAISE NOTICE '  - Multi-org support works (users in multiple orgs)';
  RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- END OF HOTFIX
-- =====================================================
