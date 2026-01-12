-- =====================================================
-- Check Properties Organization Linkage
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose property org_id issues
-- =====================================================

-- ============================================
-- 1. Check Properties by org_id
-- ============================================
DO $$
DECLARE
  target_org_id uuid := 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid;
  total_properties int;
  properties_in_target_org int;
  properties_null_org int;
  properties_other_org int;
BEGIN
  SELECT COUNT(*) INTO total_properties
  FROM properties
  WHERE deleted_at IS NULL;
  
  SELECT COUNT(*) INTO properties_in_target_org
  FROM properties
  WHERE org_id = target_org_id
    AND deleted_at IS NULL;
  
  SELECT COUNT(*) INTO properties_null_org
  FROM properties
  WHERE org_id IS NULL
    AND deleted_at IS NULL;
  
  SELECT COUNT(*) INTO properties_other_org
  FROM properties
  WHERE org_id IS NOT NULL
    AND org_id != target_org_id
    AND deleted_at IS NULL;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'PROPERTIES ORGANIZATION LINKAGE';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Target Organization: %', target_org_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Total properties (not deleted): %', total_properties;
  RAISE NOTICE 'Properties in target org: %', properties_in_target_org;
  RAISE NOTICE 'Properties with NULL org_id: %', properties_null_org;
  RAISE NOTICE 'Properties in other orgs: %', properties_other_org;
  RAISE NOTICE '';
  
  IF properties_null_org > 0 THEN
    RAISE WARNING '⚠️ ISSUE: % properties have NULL org_id', properties_null_org;
    RAISE NOTICE '   These will be filtered out by RLS policies.';
    RAISE NOTICE '   Dashboard counts will be incorrect.';
  END IF;
  
  IF properties_other_org > 0 THEN
    RAISE NOTICE 'ℹ️ INFO: % properties belong to other organizations', properties_other_org;
    RAISE NOTICE '   These will not be visible unless you migrate them.';
  END IF;
  
  RAISE NOTICE '=====================================================';
END $$;

-- Show properties with NULL org_id
SELECT 
  id,
  user_id,
  org_id,
  address,
  city,
  district,
  status,
  property_type,
  created_at
FROM properties
WHERE org_id IS NULL 
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Show properties in target org
SELECT 
  id,
  user_id,
  org_id,
  address,
  city,
  district,
  status,
  property_type,
  created_at
FROM properties
WHERE org_id = 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Show properties in other orgs
SELECT 
  p.id,
  p.user_id,
  p.org_id,
  o.name as org_name,
  p.address,
  p.city,
  p.status,
  p.created_at
FROM properties p
LEFT JOIN organizations o ON o.id = p.org_id
WHERE p.org_id IS NOT NULL
  AND p.org_id != 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid
  AND p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================
-- 2. Check Organization Details
-- ============================================
DO $$
DECLARE
  target_org_id uuid := 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid;
  org_exists boolean;
  org_name text;
  member_count int;
BEGIN
  SELECT EXISTS(SELECT 1 FROM organizations WHERE id = target_org_id),
         name INTO org_exists, org_name
  FROM organizations 
  WHERE id = target_org_id;
  
  IF NOT org_exists THEN
    RAISE WARNING '⚠️ Organization % does not exist!', target_org_id;
    RETURN;
  END IF;
  
  SELECT COUNT(*) INTO member_count
  FROM org_members
  WHERE org_id = target_org_id
    AND status = 'active';
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'ORGANIZATION DETAILS';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Organization ID: %', target_org_id;
  RAISE NOTICE 'Organization Name: %', org_name;
  RAISE NOTICE 'Active Members: %', member_count;
  RAISE NOTICE '=====================================================';
END $$;

-- Show organization details
SELECT 
  id,
  name,
  slug,
  created_at
FROM organizations
WHERE id = 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid;

-- ============================================
-- 3. Check User's Org Membership
-- ============================================
DO $$
DECLARE
  current_user_id uuid;
  membership_count int;
  target_org_id uuid := 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid;
  is_member boolean;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE WARNING '⚠️ No authenticated user. Run this as the user who needs access.';
    RETURN;
  END IF;
  
  SELECT COUNT(*) INTO membership_count
  FROM org_members
  WHERE user_id = current_user_id
    AND status = 'active';
  
  SELECT EXISTS(
    SELECT 1 FROM org_members
    WHERE user_id = current_user_id
      AND org_id = target_org_id
      AND status = 'active'
  ) INTO is_member;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'USER ORG MEMBERSHIP';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Current User ID: %', current_user_id;
  RAISE NOTICE 'Active org memberships: %', membership_count;
  RAISE NOTICE 'Is member of target org: %', CASE WHEN is_member THEN 'YES ✅' ELSE 'NO ❌' END;
  RAISE NOTICE '';
  
  IF NOT is_member THEN
    RAISE WARNING '⚠️ User is not a member of target organization!';
    RAISE NOTICE '   Properties in target org will not be visible via RLS.';
    RAISE NOTICE '   Add user to organization first.';
  END IF;
  
  RAISE NOTICE '=====================================================';
END $$;

-- Show user's org memberships
SELECT 
  om.id,
  om.org_id,
  om.role,
  om.status,
  o.name as org_name,
  om.joined_at
FROM org_members om
JOIN organizations o ON o.id = om.org_id
WHERE om.user_id = auth.uid()
ORDER BY om.joined_at ASC;

-- ============================================
-- 4. Simulate RLS Visibility
-- ============================================
DO $$
DECLARE
  target_org_id uuid := 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid;
  current_user_id uuid;
  visible_count int;
  total_in_org int;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE WARNING '⚠️ No authenticated user. Cannot simulate RLS.';
    RETURN;
  END IF;
  
  -- Count properties visible via RLS (simulating get_user_org_ids())
  SELECT COUNT(*) INTO visible_count
  FROM properties
  WHERE deleted_at IS NULL
    AND org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = current_user_id
        AND status = 'active'
    );
  
  -- Count total properties in target org
  SELECT COUNT(*) INTO total_in_org
  FROM properties
  WHERE org_id = target_org_id
    AND deleted_at IS NULL;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'RLS VISIBILITY SIMULATION';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Properties visible to current user (via RLS): %', visible_count;
  RAISE NOTICE 'Properties in target org: %', total_in_org;
  RAISE NOTICE '';
  
  IF visible_count < total_in_org THEN
    RAISE WARNING '⚠️ MISMATCH: User can see % properties, but % exist in target org', visible_count, total_in_org;
    RAISE NOTICE '   This explains why dashboard shows incorrect counts.';
    RAISE NOTICE '   Solution: Ensure user is member of target org, then run migration.';
  ELSIF visible_count = total_in_org AND total_in_org > 0 THEN
    RAISE NOTICE '✅ RLS is working correctly. All properties should be visible.';
  ELSE
    RAISE NOTICE 'ℹ️ No properties in target org yet.';
  END IF;
  
  RAISE NOTICE '=====================================================';
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
  RAISE NOTICE 'Review the results above:';
  RAISE NOTICE '';
  RAISE NOTICE '1. If properties have NULL org_id:';
  RAISE NOTICE '   → Run migration: 20260111000000_link_properties_to_specific_org.sql';
  RAISE NOTICE '';
  RAISE NOTICE '2. If user is not member of target org:';
  RAISE NOTICE '   → Add user to organization first';
  RAISE NOTICE '';
  RAISE NOTICE '3. If properties are in other orgs:';
  RAISE NOTICE '   → Uncomment optional migration step to migrate them';
  RAISE NOTICE '';
  RAISE NOTICE '4. After migration, refresh dashboard to see correct counts';
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
END $$;
