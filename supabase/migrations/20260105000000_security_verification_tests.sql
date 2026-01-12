-- =====================================================
-- ⚠️  NOT A REAL MIGRATION - THIS IS A HELPER SCRIPT ⚠️
-- =====================================================
-- 
-- PURPOSE: Discovers your test users and shows you their UUIDs
--          This does NOT run any tests - it just finds users!
-- 
-- WHAT IT DOES:
-- 1. Finds owner users
-- 2. Finds member users  
-- 3. Finds users in different orgs
-- 4. Prints their UUIDs so you can use them in real tests
-- 
-- TO ACTUALLY RUN TESTS:
-- See: docs/SECURITY_TESTS_QUICK_START.md
-- 
-- This script will SUCCEED and just print information.
-- That's normal! It's not supposed to do anything else.
-- 
-- =====================================================

-- ============================================================================
-- STEP 1: Setup - Discover Test Users (Run as SERVICE ROLE)
-- ============================================================================
-- Run this section first to identify test users, or manually set the variables below

DO $$
DECLARE
  owner_user_id UUID;
  owner_org_id UUID;
  member_user_id UUID;
  other_org_user_id UUID;
  other_org_id UUID;
  test_property_id UUID;
  active_property_id UUID;
  test_results JSONB := '[]'::JSONB;
  test_name TEXT;
  test_passed BOOLEAN;
  test_error TEXT;
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'RLS SECURITY VERIFICATION TEST SUITE';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 1: Discovering test users and orgs...';
  RAISE NOTICE '';

  -- Find an owner user
  SELECT om.user_id, om.org_id INTO owner_user_id, owner_org_id
  FROM org_members om
  WHERE om.role = 'owner' AND om.status = 'active'
  LIMIT 1;

  IF owner_user_id IS NULL THEN
    RAISE EXCEPTION 'No owner user found. Please ensure at least one user with role=owner exists.';
  END IF;

  RAISE NOTICE '✅ Found owner user: %', owner_user_id;
  RAISE NOTICE '✅ Found owner org: %', owner_org_id;

  -- Find a member user (same org as owner)
  SELECT om.user_id INTO member_user_id
  FROM org_members om
  WHERE om.org_id = owner_org_id
    AND om.role = 'member'
    AND om.status = 'active'
    AND om.user_id != owner_user_id
  LIMIT 1;

  IF member_user_id IS NULL THEN
    RAISE WARNING '⚠️  No member user found in same org. Some tests will be skipped.';
    RAISE WARNING '   To test member permissions, create a member user:';
    RAISE WARNING '   INSERT INTO org_members (org_id, user_id, role, status, joined_at)';
    RAISE WARNING '   VALUES (%, [user_id], ''member'', ''active'', now());', owner_org_id;
  ELSE
    RAISE NOTICE '✅ Found member user: %', member_user_id;
  END IF;

  -- Find a user in a different org
  SELECT om.user_id, om.org_id INTO other_org_user_id, other_org_id
  FROM org_members om
  WHERE om.org_id != owner_org_id
    AND om.status = 'active'
  LIMIT 1;

  IF other_org_user_id IS NULL THEN
    RAISE WARNING '⚠️  No user found in different org. Cross-org isolation tests will be limited.';
    RAISE WARNING '   To test cross-org isolation, ensure at least 2 orgs exist.';
  ELSE
    RAISE NOTICE '✅ Found other org user: %', other_org_user_id;
    RAISE NOTICE '✅ Found other org: %', other_org_id;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'IMPORTANT: Manual Test Execution Required';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'This script has discovered your test users.';
  RAISE NOTICE 'However, RLS tests require running queries as specific users.';
  RAISE NOTICE '';
  RAISE NOTICE 'To run the tests:';
  RAISE NOTICE '1. Use Supabase Dashboard → SQL Editor';
  RAISE NOTICE '2. For each test, set the user context:';
  RAISE NOTICE '   SET LOCAL request.jwt.claims = ''{"sub": "USER_UUID"}'';';
  RAISE NOTICE '3. Then run the test query';
  RAISE NOTICE '';
  RAISE NOTICE 'Owner User UUID: %', owner_user_id;
  IF member_user_id IS NOT NULL THEN
    RAISE NOTICE 'Member User UUID: %', member_user_id;
  END IF;
  IF other_org_user_id IS NOT NULL THEN
    RAISE NOTICE 'Other Org User UUID: %', other_org_user_id;
  END IF;
  RAISE NOTICE 'Owner Org UUID: %', owner_org_id;
  IF other_org_id IS NOT NULL THEN
    RAISE NOTICE 'Other Org UUID: %', other_org_id;
  END IF;
  RAISE NOTICE '';
  RAISE NOTICE 'See ORG_SECURITY_VERIFICATION.md for detailed test queries.';
  RAISE NOTICE '=====================================================';

END $$;

-- ============================================================================
-- STEP 2: Automated Tests (Run as SERVICE ROLE with user context)
-- ============================================================================
-- These tests can be run programmatically by setting user context

-- ============================================================================
-- TEST C1: Organization INSERT Restriction
-- ============================================================================
-- Expected: INSERT should fail with RLS violation
-- Run this manually with: SET LOCAL request.jwt.claims = '{"sub": "OWNER_USER_UUID"}';

/*
DO $$
DECLARE
  test_passed BOOLEAN := false;
  test_error TEXT;
BEGIN
  BEGIN
    -- Try to create organization (should fail)
    INSERT INTO organizations (name, slug)
    VALUES ('Malicious Org', 'malicious-slug-' || gen_random_uuid()::text);
    
    -- If we get here, the test failed (INSERT succeeded when it shouldn't)
    test_passed := false;
    test_error := 'INSERT succeeded but should have been blocked by RLS';
  EXCEPTION
    WHEN OTHERS THEN
      -- Check if error is RLS-related
      IF SQLERRM LIKE '%row-level security%' OR SQLERRM LIKE '%policy%' THEN
        test_passed := true;
      ELSE
        test_error := SQLERRM;
      END IF;
  END;

  IF test_passed THEN
    RAISE NOTICE '✅ C1 PASSED: Organization INSERT blocked';
  ELSE
    RAISE WARNING '❌ C1 FAILED: %', COALESCE(test_error, 'Unknown error');
  END IF;
END $$;
*/

-- ============================================================================
-- TEST C2: Soft-Delete UPDATE Guard
-- ============================================================================
-- Expected: Cannot update soft-deleted records
-- Run this manually with: SET LOCAL request.jwt.claims = '{"sub": "OWNER_USER_UUID"}';

/*
DO $$
DECLARE
  owner_user_id UUID := 'OWNER_USER_UUID';  -- Replace with actual UUID
  owner_org_id UUID := 'OWNER_ORG_UUID';   -- Replace with actual UUID
  test_property_id UUID;
  rows_updated INT;
BEGIN
  -- Create a test property
  INSERT INTO properties (title, org_id, user_id, status, property_type, listing_type)
  VALUES ('Test Property C2', owner_org_id, owner_user_id, 'available', 'apartment', 'sale')
  RETURNING id INTO test_property_id;

  -- Soft-delete it
  UPDATE properties SET deleted_at = now() WHERE id = test_property_id;

  -- Try to update the soft-deleted record (should affect 0 rows)
  UPDATE properties 
  SET title = 'Resurrected Property' 
  WHERE id = test_property_id;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  IF rows_updated = 0 THEN
    RAISE NOTICE '✅ C2 PASSED: Soft-deleted records cannot be updated';
  ELSE
    RAISE WARNING '❌ C2 FAILED: Updated % rows (expected 0)', rows_updated;
  END IF;

  -- Cleanup
  DELETE FROM properties WHERE id = test_property_id;
END $$;
*/

-- ============================================================================
-- TEST C3: Hard DELETE Block
-- ============================================================================
-- Expected: DELETE should fail or return 0 rows
-- Run this manually with: SET LOCAL request.jwt.claims = '{"sub": "OWNER_USER_UUID"}';

/*
DO $$
DECLARE
  owner_org_id UUID := 'OWNER_ORG_UUID';  -- Replace with actual UUID
  rows_deleted INT;
  test_passed BOOLEAN := false;
BEGIN
  BEGIN
    -- Try to hard delete (should fail or return 0)
    DELETE FROM properties WHERE org_id = owner_org_id LIMIT 1;
    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    
    IF rows_deleted = 0 THEN
      test_passed := true;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%row-level security%' OR SQLERRM LIKE '%policy%' THEN
        test_passed := true;
      END IF;
  END;

  IF test_passed THEN
    RAISE NOTICE '✅ C3 PASSED: Hard DELETE blocked';
  ELSE
    RAISE WARNING '❌ C3 FAILED: Deleted % rows (expected 0 or error)', rows_deleted;
  END IF;
END $$;
*/

-- ============================================================================
-- TEST L3: Org ID Immutability
-- ============================================================================
-- Expected: Cannot change org_id during UPDATE
-- Run this manually with: SET LOCAL request.jwt.claims = '{"sub": "OWNER_USER_UUID"}';

/*
DO $$
DECLARE
  owner_user_id UUID := 'OWNER_USER_UUID';  -- Replace with actual UUID
  owner_org_id UUID := 'OWNER_ORG_UUID';    -- Replace with actual UUID
  other_org_id UUID := 'OTHER_ORG_UUID';   -- Replace with actual UUID
  test_property_id UUID;
  test_passed BOOLEAN := false;
BEGIN
  -- Create a test property
  INSERT INTO properties (title, org_id, user_id, status, property_type, listing_type)
  VALUES ('Test Property L3', owner_org_id, owner_user_id, 'available', 'apartment', 'sale')
  RETURNING id INTO test_property_id;

  BEGIN
    -- Try to change org_id (should fail)
    UPDATE properties
    SET org_id = other_org_id
    WHERE id = test_property_id;
    
    -- If we get here, the test failed
    test_passed := false;
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%row-level security%' OR SQLERRM LIKE '%policy%' THEN
        test_passed := true;
      END IF;
  END;

  IF test_passed THEN
    RAISE NOTICE '✅ L3 PASSED: org_id cannot be changed';
  ELSE
    RAISE WARNING '❌ L3 FAILED: org_id was changed (security issue!)';
  END IF;

  -- Cleanup
  DELETE FROM properties WHERE id = test_property_id;
END $$;
*/

-- ============================================================================
-- TEST: Cross-Org Isolation
-- ============================================================================
-- Expected: Users cannot see other org's data
-- Run this manually with: SET LOCAL request.jwt.claims = '{"sub": "OWNER_USER_UUID"}';

/*
DO $$
DECLARE
  owner_org_id UUID := 'OWNER_ORG_UUID';   -- Replace with actual UUID
  other_org_id UUID := 'OTHER_ORG_UUID';  -- Replace with actual UUID
  visible_count INT;
BEGIN
  -- Count properties from other org (should be 0)
  SELECT COUNT(*) INTO visible_count
  FROM properties
  WHERE org_id = other_org_id;

  IF visible_count = 0 THEN
    RAISE NOTICE '✅ Cross-Org Isolation PASSED: Cannot see other org data';
  ELSE
    RAISE WARNING '❌ Cross-Org Isolation FAILED: Can see % properties from other org', visible_count;
  END IF;
END $$;
*/

-- ============================================================================
-- TEST: Member Read-Only Access
-- ============================================================================
-- Expected: Members can SELECT but not INSERT/UPDATE/DELETE
-- Run this manually with: SET LOCAL request.jwt.claims = '{"sub": "MEMBER_USER_UUID"}';

/*
DO $$
DECLARE
  member_user_id UUID := 'MEMBER_USER_UUID';  -- Replace with actual UUID
  owner_org_id UUID := 'OWNER_ORG_UUID';     -- Replace with actual UUID
  test_passed BOOLEAN := true;
  rows_affected INT;
BEGIN
  -- Test SELECT (should work)
  SELECT COUNT(*) INTO rows_affected
  FROM properties
  WHERE org_id = owner_org_id;
  
  RAISE NOTICE 'Member can SELECT: % properties visible', rows_affected;

  -- Test INSERT (should fail)
  BEGIN
    INSERT INTO properties (title, org_id, user_id, status, property_type, listing_type)
    VALUES ('Member Property', owner_org_id, member_user_id, 'available', 'apartment', 'sale');
    test_passed := false;
    RAISE WARNING '❌ Member INSERT test FAILED: INSERT succeeded (should be blocked)';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%row-level security%' OR SQLERRM LIKE '%policy%' THEN
        RAISE NOTICE '✅ Member INSERT test PASSED: INSERT blocked';
      ELSE
        RAISE WARNING '❌ Member INSERT test FAILED: Unexpected error: %', SQLERRM;
        test_passed := false;
      END IF;
  END;

  -- Test UPDATE (should affect 0 rows)
  UPDATE properties 
  SET title = 'Member Update' 
  WHERE org_id = owner_org_id
  LIMIT 1;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  IF rows_affected = 0 THEN
    RAISE NOTICE '✅ Member UPDATE test PASSED: UPDATE blocked';
  ELSE
    RAISE WARNING '❌ Member UPDATE test FAILED: Updated % rows (expected 0)', rows_affected;
    test_passed := false;
  END IF;

  IF test_passed THEN
    RAISE NOTICE '✅ Member Read-Only Access PASSED';
  ELSE
    RAISE WARNING '❌ Member Read-Only Access FAILED';
  END IF;
END $$;
*/

-- ============================================================================
-- SUMMARY: Test Execution Instructions
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'TEST EXECUTION INSTRUCTIONS';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Due to RLS requiring user context, these tests must be';
  RAISE NOTICE 'run manually in Supabase SQL Editor.';
  RAISE NOTICE '';
  RAISE NOTICE 'For each test:';
  RAISE NOTICE '1. Uncomment the test block (remove /* and */)';
  RAISE NOTICE '2. Replace placeholder UUIDs with actual values from Step 1';
  RAISE NOTICE '3. Set user context: SET LOCAL request.jwt.claims = ''{"sub": "UUID"}'';';
  RAISE NOTICE '4. Run the test';
  RAISE NOTICE '5. Check the output for PASSED/FAILED';
  RAISE NOTICE '';
  RAISE NOTICE 'Alternatively, use the interactive test script:';
  RAISE NOTICE 'See: docs/ORG_SECURITY_VERIFICATION.md';
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
END $$;

