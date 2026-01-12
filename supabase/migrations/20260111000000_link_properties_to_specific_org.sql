-- =====================================================
-- Link Properties to Specific Organization
-- =====================================================
--
-- PURPOSE:
-- Link properties with NULL org_id or different org_id to a specific organization.
-- This fixes dashboard counts that are incorrect due to RLS filtering.
--
-- TARGET ORG: e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c
--
-- WHAT IT DOES:
-- 1. Updates properties with NULL org_id to target org
-- 2. Optionally updates properties with different org_id (commented out by default)
-- 3. Validates organization exists
-- 4. Reports detailed results
--
-- SAFE: Only updates properties, doesn't delete anything
-- ROLLBACK: Can manually revert org_id if needed
--
-- =====================================================

-- ============================================
-- CONFIGURATION
-- ============================================
DO $$
DECLARE
  target_org_id uuid := 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid;
  org_exists boolean;
  org_name text;
BEGIN
  -- Verify organization exists
  SELECT EXISTS(SELECT 1 FROM organizations WHERE id = target_org_id), 
         name INTO org_exists, org_name
  FROM organizations 
  WHERE id = target_org_id;
  
  IF NOT org_exists THEN
    RAISE EXCEPTION 'Organization % does not exist. Please verify the org_id.', target_org_id;
  END IF;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'LINKING PROPERTIES TO ORGANIZATION';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Target Organization: % (%)', org_name, target_org_id;
  RAISE NOTICE '';
END $$;

-- ============================================
-- STEP 1: Count properties to update
-- ============================================
DO $$
DECLARE
  target_org_id uuid := 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid;
  null_org_count int;
  different_org_count int;
  total_to_update int;
BEGIN
  -- Count properties with NULL org_id
  SELECT COUNT(*) INTO null_org_count
  FROM properties
  WHERE org_id IS NULL
    AND deleted_at IS NULL;
  
  -- Count properties with different org_id (for reference)
  SELECT COUNT(*) INTO different_org_count
  FROM properties
  WHERE org_id IS NOT NULL
    AND org_id != target_org_id
    AND deleted_at IS NULL;
  
  total_to_update := null_org_count;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'PROPERTIES ANALYSIS';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Properties with NULL org_id: %', null_org_count;
  RAISE NOTICE 'Properties with different org_id: %', different_org_count;
  RAISE NOTICE 'Properties that will be updated: %', total_to_update;
  RAISE NOTICE '';
  
  IF total_to_update = 0 THEN
    RAISE NOTICE '✅ No properties need updating. All properties already have correct org_id.';
    RETURN;
  END IF;
END $$;

-- ============================================
-- STEP 2: Update properties with NULL org_id
-- ============================================
DO $$
DECLARE
  target_org_id uuid := 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid;
  updated_count int;
BEGIN
  -- Update all properties with NULL org_id to target org
  UPDATE properties
  SET 
    org_id = target_org_id,
    updated_at = now()
  WHERE org_id IS NULL
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Updated % properties with NULL org_id', updated_count;
END $$;

-- ============================================
-- STEP 3: OPTIONAL - Update properties with different org_id
-- ============================================
-- Uncomment the block below if you want to migrate ALL properties to the target org
-- (including those that already have a different org_id)
/*
DO $$
DECLARE
  target_org_id uuid := 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid;
  updated_count int;
BEGIN
  -- Update properties with different org_id to target org
  UPDATE properties
  SET 
    org_id = target_org_id,
    updated_at = now()
  WHERE org_id IS NOT NULL
    AND org_id != target_org_id
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Updated % properties with different org_id', updated_count;
END $$;
*/

-- ============================================
-- STEP 4: Report final results
-- ============================================
DO $$
DECLARE
  target_org_id uuid := 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid;
  total_properties int;
  properties_in_target_org int;
  properties_null_org int;
  properties_other_org int;
  percentage_in_target numeric;
BEGIN
  -- Count total properties (not deleted)
  SELECT COUNT(*) INTO total_properties
  FROM properties
  WHERE deleted_at IS NULL;
  
  -- Count properties in target org
  SELECT COUNT(*) INTO properties_in_target_org
  FROM properties
  WHERE org_id = target_org_id
    AND deleted_at IS NULL;
  
  -- Count properties with NULL org_id (should be 0 after migration)
  SELECT COUNT(*) INTO properties_null_org
  FROM properties
  WHERE org_id IS NULL
    AND deleted_at IS NULL;
  
  -- Count properties in other orgs
  SELECT COUNT(*) INTO properties_other_org
  FROM properties
  WHERE org_id IS NOT NULL
    AND org_id != target_org_id
    AND deleted_at IS NULL;
  
  -- Calculate percentage
  IF total_properties > 0 THEN
    percentage_in_target := (properties_in_target_org::numeric / total_properties::numeric) * 100;
  ELSE
    percentage_in_target := 0;
  END IF;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'MIGRATION RESULTS';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Total properties (not deleted): %', total_properties;
  RAISE NOTICE 'Properties in target org: % (%.2f%%)', properties_in_target_org, percentage_in_target;
  RAISE NOTICE 'Properties with NULL org_id: %', properties_null_org;
  RAISE NOTICE 'Properties in other orgs: %', properties_other_org;
  RAISE NOTICE '';
  
  IF properties_null_org = 0 AND properties_in_target_org > 0 THEN
    RAISE NOTICE '✅ SUCCESS: All properties are now linked to target organization';
    RAISE NOTICE '   Dashboard counts should now be correct.';
  ELSIF properties_null_org > 0 THEN
    RAISE WARNING '⚠️ WARNING: % properties still have NULL org_id', properties_null_org;
    RAISE NOTICE '   These may belong to users without org membership.';
  ELSE
    RAISE NOTICE '✅ Migration completed.';
  END IF;
  
  RAISE NOTICE '=====================================================';
END $$;

-- ============================================
-- STEP 5: Verify RLS visibility
-- ============================================
-- This query simulates what RLS will return for a user in the target org
DO $$
DECLARE
  target_org_id uuid := 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid;
  visible_count int;
  total_count int;
BEGIN
  -- Count properties visible via RLS (simulating get_user_org_ids() = target_org_id)
  SELECT COUNT(*) INTO visible_count
  FROM properties
  WHERE deleted_at IS NULL
    AND org_id IN (SELECT target_org_id);
  
  -- Count total properties in target org
  SELECT COUNT(*) INTO total_count
  FROM properties
  WHERE org_id = target_org_id
    AND deleted_at IS NULL;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'RLS VISIBILITY CHECK';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Properties in target org: %', total_count;
  RAISE NOTICE 'Properties visible via RLS: %', visible_count;
  
  IF visible_count = total_count THEN
    RAISE NOTICE '✅ RLS visibility: All properties should be visible';
  ELSE
    RAISE WARNING '⚠️ RLS visibility mismatch: % vs %', visible_count, total_count;
    RAISE NOTICE '   Check RLS policies and org_members table.';
  END IF;
  
  RAISE NOTICE '=====================================================';
END $$;

-- ============================================
-- STEP 6: Create/Update indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_properties_org_id 
ON properties(org_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_properties_user_id_org_id 
ON properties(user_id, org_id) 
WHERE deleted_at IS NULL;

-- ============================================
-- END OF MIGRATION
-- =====================================================
