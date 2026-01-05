-- =====================================================
-- VERIFICATION: RLS Fix Verification Script
-- =====================================================
--
-- Run this AFTER applying the fix to verify everything works.
-- This script performs non-destructive checks.
--
-- =====================================================

DO $$
DECLARE
  func_count INT;
  policy_count INT;
  tables_checked INT := 0;
  tables_passed INT := 0;
  table_name TEXT;
  has_select BOOLEAN;
  uses_helper BOOLEAN;
  test_tables TEXT[] := ARRAY[
    'properties', 'tenants', 'contracts', 'contract_details',
    'property_owners', 'property_inquiries', 'inquiry_matches',
    'meetings', 'financial_transactions', 'commissions',
    'recurring_expenses', 'expense_categories',
    'contract_clause_templates', 'contract_clause_overrides',
    'property_photos', 'organizations', 'org_members'
  ];
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'RLS FIX VERIFICATION';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';

  -- ============================================
  -- 1. Check functions exist
  -- ============================================
  RAISE NOTICE '1. CHECKING HELPER FUNCTIONS';

  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname IN ('get_user_org_ids', 'is_org_owner')
    AND prosecdef = true;  -- SECURITY DEFINER

  IF func_count = 2 THEN
    RAISE NOTICE '   [PASS] get_user_org_ids() exists with SECURITY DEFINER';
    RAISE NOTICE '   [PASS] is_org_owner() exists with SECURITY DEFINER';
  ELSE
    RAISE WARNING '   [FAIL] Missing helper functions (found %/2)', func_count;
  END IF;
  RAISE NOTICE '';

  -- ============================================
  -- 2. Check each table has org_select policy
  -- ============================================
  RAISE NOTICE '2. CHECKING TABLE POLICIES';

  FOREACH table_name IN ARRAY test_tables LOOP
    tables_checked := tables_checked + 1;

    -- Check if SELECT policy exists
    SELECT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = table_name
        AND policyname = 'org_select_' || table_name
        AND cmd = 'SELECT'
    ) INTO has_select;

    -- Check if policy uses get_user_org_ids()
    SELECT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = table_name
        AND policyname = 'org_select_' || table_name
        AND qual LIKE '%get_user_org_ids%'
    ) INTO uses_helper;

    IF has_select AND uses_helper THEN
      RAISE NOTICE '   [PASS] %: SELECT policy uses get_user_org_ids()', table_name;
      tables_passed := tables_passed + 1;
    ELSIF has_select AND NOT uses_helper THEN
      RAISE WARNING '   [FAIL] %: SELECT policy exists but uses direct subquery!', table_name;
    ELSE
      RAISE WARNING '   [FAIL] %: SELECT policy missing!', table_name;
    END IF;
  END LOOP;
  RAISE NOTICE '';

  -- ============================================
  -- 3. Count total policies
  -- ============================================
  RAISE NOTICE '3. POLICY COUNTS';

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE policyname LIKE 'org_%';

  RAISE NOTICE '   Total org_* policies: %', policy_count;
  RAISE NOTICE '   Expected: 68 (17 tables x 4 policies each)';
  RAISE NOTICE '';

  -- ============================================
  -- 4. Check for old conflicting policies
  -- ============================================
  RAISE NOTICE '4. CHECKING FOR CONFLICTING POLICIES';

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE policyname NOT LIKE 'org_%'
    AND tablename IN (
      SELECT unnest(test_tables)
    );

  IF policy_count = 0 THEN
    RAISE NOTICE '   [PASS] No conflicting non-org policies found';
  ELSE
    RAISE WARNING '   [WARN] Found % non-org policies that may conflict', policy_count;
  END IF;
  RAISE NOTICE '';

  -- ============================================
  -- 5. Summary
  -- ============================================
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'VERIFICATION SUMMARY';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Tables checked: %', tables_checked;
  RAISE NOTICE 'Tables passed: %', tables_passed;

  IF tables_passed = tables_checked THEN
    RAISE NOTICE '';
    RAISE NOTICE '[SUCCESS] All RLS policies are correctly configured!';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now test in the browser:';
    RAISE NOTICE '1. Refresh the page';
    RAISE NOTICE '2. property_owners should load (no 406)';
    RAISE NOTICE '3. tenants should load (no 406)';
    RAISE NOTICE '4. All other pages should work';
  ELSE
    RAISE WARNING '';
    RAISE WARNING '[FAILED] Some policies need attention!';
    RAISE WARNING 'Review the warnings above and re-run the fix migration.';
  END IF;
  RAISE NOTICE '=====================================================';
END $$;

-- ============================================
-- Test queries (run these manually after verification)
-- ============================================
-- These queries test the actual RLS behavior.
-- Run them in SQL Editor with your user authenticated.

-- Test 1: Check get_user_org_ids() returns your org(s)
-- SELECT get_user_org_ids();

-- Test 2: Check property_owners is accessible
-- SELECT COUNT(*) FROM property_owners WHERE deleted_at IS NULL;

-- Test 3: Check tenants is accessible
-- SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL;

-- Test 4: Check contracts is accessible
-- SELECT COUNT(*) FROM contracts WHERE deleted_at IS NULL;

-- =====================================================
-- END OF VERIFICATION
-- =====================================================
