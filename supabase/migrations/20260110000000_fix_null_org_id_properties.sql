-- =====================================================
-- Fix Properties with NULL org_id
-- =====================================================
--
-- PROBLEM:
-- Properties created before organization migration may have NULL org_id.
-- RLS policies filter out these properties, making them invisible.
--
-- SOLUTION:
-- Update properties with NULL org_id to user's active org_id.
-- Only updates properties where user has active org membership.
--
-- SAFE: Only updates NULL org_id, doesn't change existing org_id
-- ROLLBACK: Not applicable (fixes data issue)
--
-- =====================================================

-- ============================================
-- STEP 1: Count properties with NULL org_id
-- ============================================
DO $$
DECLARE
  null_count int;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM properties
  WHERE org_id IS NULL
    AND deleted_at IS NULL;
  
  IF null_count = 0 THEN
    RAISE NOTICE '✅ No properties with NULL org_id found. Migration not needed.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found % properties with NULL org_id', null_count;
  RAISE NOTICE 'Starting migration...';
END $$;

-- ============================================
-- STEP 2: Update properties with NULL org_id
-- ============================================
-- Only update properties where:
-- 1. org_id IS NULL
-- 2. user has active org membership
-- 3. property is not soft-deleted
UPDATE properties p
SET 
  org_id = (
    SELECT om.org_id 
    FROM org_members om 
    WHERE om.user_id = p.user_id 
      AND om.status = 'active' 
    ORDER BY om.joined_at ASC
    LIMIT 1
  ),
  updated_at = now()
WHERE p.org_id IS NULL
  AND p.deleted_at IS NULL
  AND EXISTS (
    SELECT 1 
    FROM org_members om 
    WHERE om.user_id = p.user_id 
      AND om.status = 'active'
  );

-- ============================================
-- STEP 3: Report results
-- ============================================
DO $$
DECLARE
  updated_count int;
  remaining_null int;
BEGIN
  -- Count how many were updated (check updated_at is recent)
  SELECT COUNT(*) INTO updated_count
  FROM properties
  WHERE org_id IS NOT NULL
    AND updated_at > now() - interval '1 minute';
  
  -- Count remaining NULL org_id
  SELECT COUNT(*) INTO remaining_null
  FROM properties
  WHERE org_id IS NULL
    AND deleted_at IS NULL;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'MIGRATION RESULTS';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Properties updated: %', updated_count;
  RAISE NOTICE 'Properties still NULL: %', remaining_null;
  
  IF remaining_null > 0 THEN
    RAISE WARNING '⚠️ % properties still have NULL org_id', remaining_null;
    RAISE NOTICE '   These properties belong to users with no active org membership';
    RAISE NOTICE '   They will remain invisible until user is added to an org';
  ELSE
    RAISE NOTICE '✅ All properties now have org_id set';
  END IF;
  
  RAISE NOTICE '=====================================================';
END $$;

-- ============================================
-- STEP 4: Validation
-- ============================================
DO $$
DECLARE
  null_count int;
  total_count int;
  percentage numeric;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM properties
  WHERE deleted_at IS NULL;
  
  SELECT COUNT(*) INTO null_count
  FROM properties
  WHERE org_id IS NULL
    AND deleted_at IS NULL;
  
  IF total_count > 0 THEN
    percentage := (null_count::numeric / total_count::numeric) * 100;
  ELSE
    percentage := 0;
  END IF;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'VALIDATION';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Total properties (not deleted): %', total_count;
  RAISE NOTICE 'Properties with NULL org_id: % (%.2f%%)', null_count, percentage;
  
  IF null_count = 0 THEN
    RAISE NOTICE '✅ VALIDATION PASSED: All properties have org_id';
  ELSIF percentage < 1 THEN
    RAISE NOTICE '⚠️ VALIDATION WARNING: %.2f%% properties still have NULL org_id', percentage;
    RAISE NOTICE '   These may belong to users without org membership';
  ELSE
    RAISE WARNING '❌ VALIDATION FAILED: %.2f%% properties still have NULL org_id', percentage;
  END IF;
  
  RAISE NOTICE '=====================================================';
END $$;

-- ============================================
-- STEP 5: Create index if not exists (performance)
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
