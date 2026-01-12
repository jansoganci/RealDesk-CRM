-- =====================================================
-- Properties Data Issue Diagnostic Script
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose why properties aren't appearing
-- =====================================================

-- ============================================
-- 1. Check for Properties with NULL org_id
-- ============================================
DO $$
DECLARE
  null_count int;
  total_count int;
BEGIN
  SELECT COUNT(*) INTO total_count FROM properties WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO null_count FROM properties WHERE org_id IS NULL AND deleted_at IS NULL;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '1. PROPERTIES WITH NULL org_id';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Total properties (not deleted): %', total_count;
  RAISE NOTICE 'Properties with NULL org_id: %', null_count;
  
  IF null_count > 0 THEN
    RAISE WARNING '⚠️ ISSUE FOUND: % properties have NULL org_id', null_count;
    RAISE NOTICE '   These properties will be filtered out by RLS';
  ELSE
    RAISE NOTICE '✅ All properties have org_id set';
  END IF;
  RAISE NOTICE '';
END $$;

-- Show sample properties with NULL org_id
SELECT 
  id,
  user_id,
  org_id,
  address,
  city,
  created_at
FROM properties
WHERE org_id IS NULL 
  AND deleted_at IS NULL
LIMIT 5;

-- ============================================
-- 2. Check User's Org Membership
-- ============================================
DO $$
DECLARE
  membership_count int;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  SELECT COUNT(*) INTO membership_count
  FROM org_members
  WHERE user_id = current_user_id 
    AND status = 'active';
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '2. USER ORG MEMBERSHIP';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Current user ID: %', current_user_id;
  RAISE NOTICE 'Active org memberships: %', membership_count;
  
  IF membership_count = 0 THEN
    RAISE WARNING '⚠️ ISSUE FOUND: User has no active org membership';
    RAISE NOTICE '   RLS helper function will return empty';
  ELSE
    RAISE NOTICE '✅ User has active org membership';
  END IF;
  RAISE NOTICE '';
END $$;

-- Show user's org memberships
SELECT 
  om.id,
  om.org_id,
  om.role,
  om.status,
  o.name as org_name
FROM org_members om
JOIN organizations o ON o.id = om.org_id
WHERE om.user_id = auth.uid()
ORDER BY om.joined_at ASC;

-- ============================================
-- 3. Test RLS Helper Function
-- ============================================
DO $$
DECLARE
  org_ids_count int;
BEGIN
  SELECT COUNT(*) INTO org_ids_count
  FROM get_user_org_ids();
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '3. RLS HELPER FUNCTION TEST';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'get_user_org_ids() returns: % org_id(s)', org_ids_count;
  
  IF org_ids_count = 0 THEN
    RAISE WARNING '⚠️ ISSUE FOUND: Helper function returns empty';
    RAISE NOTICE '   RLS will filter out ALL properties';
  ELSE
    RAISE NOTICE '✅ Helper function returns org_id(s)';
  END IF;
  RAISE NOTICE '';
END $$;

-- Show what get_user_org_ids() returns
SELECT * FROM get_user_org_ids();

-- ============================================
-- 4. Check Properties Count by org_id
-- ============================================
DO $$
DECLARE
  total_properties int;
  properties_with_org int;
BEGIN
  SELECT COUNT(*) INTO total_properties 
  FROM properties 
  WHERE deleted_at IS NULL;
  
  SELECT COUNT(*) INTO properties_with_org
  FROM properties 
  WHERE deleted_at IS NULL 
    AND org_id IS NOT NULL;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '4. PROPERTIES DISTRIBUTION';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Total properties (not deleted): %', total_properties;
  RAISE NOTICE 'Properties with org_id: %', properties_with_org;
  RAISE NOTICE '';
END $$;

-- Show properties count per org
SELECT 
  COALESCE(org_id::text, 'NULL') as org_id,
  COUNT(*) as property_count
FROM properties
WHERE deleted_at IS NULL
GROUP BY org_id
ORDER BY property_count DESC;

-- ============================================
-- 5. Check Properties Visible to Current User (via RLS)
-- ============================================
DO $$
DECLARE
  visible_count int;
BEGIN
  SELECT COUNT(*) INTO visible_count
  FROM properties
  WHERE deleted_at IS NULL;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '5. PROPERTIES VISIBLE TO CURRENT USER (via RLS)';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Properties visible: %', visible_count;
  
  IF visible_count = 0 THEN
    RAISE WARNING '⚠️ ISSUE FOUND: No properties visible to user';
    RAISE NOTICE '   This matches the symptom (empty array)';
  ELSE
    RAISE NOTICE '✅ Properties are visible to user';
  END IF;
  RAISE NOTICE '';
END $$;

-- Show properties visible to current user
SELECT 
  id,
  org_id,
  address,
  city,
  status,
  created_at
FROM properties
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 6. Verify RLS Policies on Properties Table
-- ============================================
DO $$
DECLARE
  policy_count int;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'properties'
    AND policyname LIKE 'org_%';
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '6. RLS POLICIES CHECK';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Org-based policies on properties: %', policy_count;
  
  IF policy_count = 0 THEN
    RAISE WARNING '⚠️ ISSUE FOUND: No org-based RLS policies found';
  ELSIF policy_count > 4 THEN
    RAISE WARNING '⚠️ WARNING: Multiple policies may conflict';
  ELSE
    RAISE NOTICE '✅ RLS policies exist';
  END IF;
  RAISE NOTICE '';
END $$;

-- List all policies on properties table
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'properties'
ORDER BY policyname;

-- ============================================
-- 7. Compare with Tenants (Working Reference)
-- ============================================
DO $$
DECLARE
  tenant_count int;
  property_count int;
BEGIN
  SELECT COUNT(*) INTO tenant_count
  FROM tenants
  WHERE deleted_at IS NULL;
  
  SELECT COUNT(*) INTO property_count
  FROM properties
  WHERE deleted_at IS NULL;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '7. COMPARISON: TENANTS vs PROPERTIES';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Tenants visible: %', tenant_count;
  RAISE NOTICE 'Properties visible: %', property_count;
  
  IF tenant_count > 0 AND property_count = 0 THEN
    RAISE WARNING '⚠️ ISSUE CONFIRMED: Tenants work but properties don''t';
    RAISE NOTICE '   This suggests properties have NULL org_id';
  ELSIF tenant_count = 0 AND property_count = 0 THEN
    RAISE WARNING '⚠️ Both tenants and properties are empty';
    RAISE NOTICE '   Check org membership and RLS helper function';
  ELSE
    RAISE NOTICE '✅ Both tenants and properties are visible';
  END IF;
  RAISE NOTICE '';
END $$;

-- ============================================
-- SUMMARY
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'DIAGNOSTIC SUMMARY';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Review the results above to identify the issue:';
  RAISE NOTICE '';
  RAISE NOTICE '1. If properties have NULL org_id:';
  RAISE NOTICE '   → Run migration to set org_id for legacy properties';
  RAISE NOTICE '';
  RAISE NOTICE '2. If user has no org membership:';
  RAISE NOTICE '   → Check OrgContext and ensure user is added to org';
  RAISE NOTICE '';
  RAISE NOTICE '3. If RLS helper returns empty:';
  RAISE NOTICE '   → Verify org_members table has active record';
  RAISE NOTICE '';
  RAISE NOTICE '4. If tenants work but properties don''t:';
  RAISE NOTICE '   → Properties likely have NULL org_id (data issue)';
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
END $$;
