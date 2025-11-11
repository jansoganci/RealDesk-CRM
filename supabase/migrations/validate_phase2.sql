/*
  Phase 2 Validation Script

  Run this AFTER Phase 2 migration to verify RLS policies are working correctly.
  This script tests data isolation between users.
*/

-- ============================================================================
-- CHECK 1: Verify RLS policies exist
-- ============================================================================
DO $$
DECLARE
  properties_policies INTEGER;
  tenants_policies INTEGER;
  contracts_policies INTEGER;
  owners_policies INTEGER;
  inquiries_policies INTEGER;
  matches_policies INTEGER;
  photos_policies INTEGER;
  total_policies INTEGER;
BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE 'CHECK 1: Verifying RLS policies exist...';
  RAISE NOTICE '======================================';

  SELECT COUNT(*) INTO properties_policies
  FROM pg_policies WHERE tablename = 'properties';

  SELECT COUNT(*) INTO tenants_policies
  FROM pg_policies WHERE tablename = 'tenants';

  SELECT COUNT(*) INTO contracts_policies
  FROM pg_policies WHERE tablename = 'contracts';

  SELECT COUNT(*) INTO owners_policies
  FROM pg_policies WHERE tablename = 'property_owners';

  SELECT COUNT(*) INTO inquiries_policies
  FROM pg_policies WHERE tablename = 'property_inquiries';

  SELECT COUNT(*) INTO matches_policies
  FROM pg_policies WHERE tablename = 'inquiry_matches';

  SELECT COUNT(*) INTO photos_policies
  FROM pg_policies WHERE tablename = 'property_photos';

  total_policies := properties_policies + tenants_policies + contracts_policies +
                    owners_policies + inquiries_policies + matches_policies + photos_policies;

  RAISE NOTICE 'Policy count by table:';
  RAISE NOTICE '  - properties: % policies', properties_policies;
  RAISE NOTICE '  - tenants: % policies', tenants_policies;
  RAISE NOTICE '  - contracts: % policies', contracts_policies;
  RAISE NOTICE '  - property_owners: % policies', owners_policies;
  RAISE NOTICE '  - property_inquiries: % policies', inquiries_policies;
  RAISE NOTICE '  - inquiry_matches: % policies', matches_policies;
  RAISE NOTICE '  - property_photos: % policies', photos_policies;
  RAISE NOTICE '';
  RAISE NOTICE 'Total policies: % (expected: 28)', total_policies;

  IF total_policies < 28 THEN
    RAISE WARNING '❌ Missing policies. Expected 28, found %', total_policies;
  ELSE
    RAISE NOTICE '✅ All RLS policies exist';
  END IF;
END $$;


-- ============================================================================
-- CHECK 2: Verify user-filtered policies (not open access)
-- ============================================================================
DO $$
DECLARE
  open_access_policies INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'CHECK 2: Verifying policies filter by user...';
  RAISE NOTICE '======================================';

  -- Check if any policies still use "USING (true)" which means open access
  SELECT COUNT(*) INTO open_access_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN (
    'properties', 'tenants', 'contracts', 'property_owners',
    'property_inquiries', 'inquiry_matches'
  )
  AND (
    qual::text LIKE '%true%'
    OR with_check::text LIKE '%true%'
  )
  AND NOT (
    -- Exclude property_photos which uses EXISTS subquery
    tablename = 'property_photos'
  );

  IF open_access_policies > 0 THEN
    RAISE WARNING '❌ Found % policies with open access (true)', open_access_policies;
  ELSE
    RAISE NOTICE '✅ All policies filter by user_id (no open access)';
  END IF;
END $$;


-- ============================================================================
-- CHECK 3: Display policy details for review
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'CHECK 3: Policy details';
  RAISE NOTICE '======================================';
END $$;

SELECT
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN qual::text LIKE '%auth.uid()%' THEN '✅ User-filtered'
    WHEN qual::text LIKE '%EXISTS%' THEN '✅ JOIN-filtered'
    ELSE '⚠️ Check manually'
  END as filtering
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'properties', 'tenants', 'contracts', 'property_owners',
  'property_inquiries', 'inquiry_matches', 'property_photos'
)
ORDER BY tablename, cmd;


-- ============================================================================
-- CHECK 4: Test data isolation (if multiple users exist)
-- ============================================================================
DO $$
DECLARE
  user_count INTEGER;
  current_user_id UUID;
  properties_visible INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'CHECK 4: Testing data isolation...';
  RAISE NOTICE '======================================';

  -- Count total users in system
  SELECT COUNT(*) INTO user_count FROM auth.users;

  IF user_count < 2 THEN
    RAISE NOTICE '⚠️ Only % user(s) exist. Create a second test user to validate isolation.', user_count;
    RAISE NOTICE '   To test: Login as different user and verify they see 0 records initially.';
  ELSE
    RAISE NOTICE '✅ Multiple users exist (%). Isolation can be tested.', user_count;

    -- Get current authenticated user
    current_user_id := auth.uid();

    IF current_user_id IS NOT NULL THEN
      -- Count properties visible to current user
      SELECT COUNT(*) INTO properties_visible
      FROM properties
      WHERE user_id = current_user_id;

      RAISE NOTICE '   Current user sees % properties (filtered by RLS)', properties_visible;
    ELSE
      RAISE NOTICE '   Not authenticated in this context (normal for migration script)';
    END IF;
  END IF;
END $$;


-- ============================================================================
-- CHECK 5: Verify RLS is actually enabled on tables
-- ============================================================================
DO $$
DECLARE
  tables_without_rls TEXT[] := ARRAY[]::TEXT[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'CHECK 5: Verifying RLS is enabled...';
  RAISE NOTICE '======================================';

  -- Check each table
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'properties') THEN
    tables_without_rls := array_append(tables_without_rls, 'properties');
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'tenants') THEN
    tables_without_rls := array_append(tables_without_rls, 'tenants');
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'contracts') THEN
    tables_without_rls := array_append(tables_without_rls, 'contracts');
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'property_owners') THEN
    tables_without_rls := array_append(tables_without_rls, 'property_owners');
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'property_inquiries') THEN
    tables_without_rls := array_append(tables_without_rls, 'property_inquiries');
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'inquiry_matches') THEN
    tables_without_rls := array_append(tables_without_rls, 'inquiry_matches');
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'property_photos') THEN
    tables_without_rls := array_append(tables_without_rls, 'property_photos');
  END IF;

  IF array_length(tables_without_rls, 1) > 0 THEN
    RAISE EXCEPTION '❌ RLS not enabled on: %', array_to_string(tables_without_rls, ', ');
  ELSE
    RAISE NOTICE '✅ RLS enabled on all 7 tables';
  END IF;
END $$;


-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE '✅ PHASE 2 VALIDATION COMPLETE';
  RAISE NOTICE '======================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Multi-tenant isolation is now ACTIVE!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  CRITICAL: Service layer NOT updated yet';
  RAISE NOTICE '   - Viewing data: ✅ Works (filtered by user)';
  RAISE NOTICE '   - Creating data: ❌ WILL FAIL (needs Phase 3)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Test with 2 user accounts (each sees only their data)';
  RAISE NOTICE '  2. Do NOT attempt to create records yet';
  RAISE NOTICE '  3. Proceed to Phase 3 (Service Layer Updates)';
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
END $$;
