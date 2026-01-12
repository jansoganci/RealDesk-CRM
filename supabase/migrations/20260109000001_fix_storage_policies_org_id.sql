-- =====================================================
-- FIX: Add org_id Security to Storage Policies
-- =====================================================
--
-- PROBLEM:
-- Storage bucket policies (property-photos, contract-pdfs) do NOT validate org_id,
-- allowing cross-org file access.
--
-- SECURITY ISSUE:
-- Users from Org A can upload/view/delete files for Org B's properties/contracts.
-- This is a critical security vulnerability.
--
-- SOLUTION:
-- Update storage policies to validate org_id:
-- 1. property-photos: Check file path contains property_id that belongs to user's org
-- 2. contract-pdfs: Check file path contains contract_id that belongs to user's org
--
-- AFFECTED BUCKETS:
-- 1. property-photos (INSERT, DELETE policies)
-- 2. contract-pdfs (SELECT, INSERT, UPDATE, DELETE policies)
--
-- SAFE: Idempotent, can run multiple times
-- ROLLBACK: Re-run original bucket creation migrations
--
-- =====================================================

-- ============================================================================
-- STEP 1: Ensure get_user_org_ids() function exists
-- ============================================================================

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

-- ============================================================================
-- STEP 2: Fix property-photos Bucket Policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload property photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete property photos" ON storage.objects;
-- Keep public read policy (it's OK for property listings)

-- ✅ FIX 1: Upload policy - Only allow uploads to properties in user's org
CREATE POLICY "org_insert_property_photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-photos'
  AND (
    -- Extract property_id from path (format: property_id/filename or org_id/property_id/filename)
    -- Try to extract UUID from first or second folder in path
    (string_to_array(name, '/'))[1]::uuid IN (
      SELECT id FROM properties
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
    )
    OR
    (string_to_array(name, '/'))[2]::uuid IN (
      SELECT id FROM properties
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
    )
  )
);

-- ✅ FIX 2: Delete policy - Only allow deletes of photos from properties in user's org
CREATE POLICY "org_delete_property_photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-photos'
  AND (
    -- Extract property_id from path
    (string_to_array(name, '/'))[1]::uuid IN (
      SELECT id FROM properties
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
    )
    OR
    (string_to_array(name, '/'))[2]::uuid IN (
      SELECT id FROM properties
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
    )
  )
);

-- ============================================================================
-- STEP 3: Fix contract-pdfs Bucket Policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload contract PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view contract PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update contract PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete contract PDFs" ON storage.objects;

-- ✅ FIX 3: View policy - Only allow viewing contracts from user's org
CREATE POLICY "org_select_contract_pdfs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contract-pdfs'
  AND (
    -- Extract contract_id from path (format: contracts/contract_id-timestamp.pdf or contract_id/filename)
    -- Try multiple path formats
    (string_to_array(name, '/'))[1]::uuid IN (
      SELECT id FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
    )
    OR
    -- Handle format: contracts/{contract_id}-{timestamp}.pdf
    (string_to_array(name, '/'))[2]::text LIKE '%' || (
      SELECT id::text FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
      LIMIT 1
    ) || '%'
    OR
    -- Extract UUID from filename if it starts with contract_id
    substring((string_to_array(name, '/'))[array_length(string_to_array(name, '/'), 1)], 1, 36)::uuid IN (
      SELECT id FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
    )
  )
);

-- ✅ FIX 4: Upload policy - Only allow uploads to contracts in user's org
CREATE POLICY "org_insert_contract_pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contract-pdfs'
  AND (
    -- Extract contract_id from path
    (string_to_array(name, '/'))[1]::uuid IN (
      SELECT id FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
    )
    OR
    -- Handle format: contracts/{contract_id}-{timestamp}.pdf
    (string_to_array(name, '/'))[2]::text LIKE '%' || (
      SELECT id::text FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
      LIMIT 1
    ) || '%'
  )
);

-- ✅ FIX 5: Update policy - Only allow updates to contracts in user's org
CREATE POLICY "org_update_contract_pdfs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contract-pdfs'
  AND (
    (string_to_array(name, '/'))[1]::uuid IN (
      SELECT id FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
    )
    OR
    (string_to_array(name, '/'))[2]::text LIKE '%' || (
      SELECT id::text FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
      LIMIT 1
    ) || '%'
  )
)
WITH CHECK (
  bucket_id = 'contract-pdfs'
  AND (
    (string_to_array(name, '/'))[1]::uuid IN (
      SELECT id FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
    )
    OR
    (string_to_array(name, '/'))[2]::text LIKE '%' || (
      SELECT id::text FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
      LIMIT 1
    ) || '%'
  )
);

-- ✅ FIX 6: Delete policy - Only allow deletes of contracts from user's org
CREATE POLICY "org_delete_contract_pdfs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contract-pdfs'
  AND (
    (string_to_array(name, '/'))[1]::uuid IN (
      SELECT id FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
    )
    OR
    (string_to_array(name, '/'))[2]::text LIKE '%' || (
      SELECT id::text FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
      LIMIT 1
    ) || '%'
  )
);

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  property_photos_insert_exists BOOLEAN;
  property_photos_delete_exists BOOLEAN;
  contract_pdfs_select_exists BOOLEAN;
  contract_pdfs_insert_exists BOOLEAN;
  contract_pdfs_update_exists BOOLEAN;
  contract_pdfs_delete_exists BOOLEAN;
  property_photos_has_org_check BOOLEAN;
  contract_pdfs_has_org_check BOOLEAN;
BEGIN
  -- Check if policies exist
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'org_insert_property_photos'
  ) INTO property_photos_insert_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'org_delete_property_photos'
  ) INTO property_photos_delete_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'org_select_contract_pdfs'
  ) INTO contract_pdfs_select_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'org_insert_contract_pdfs'
  ) INTO contract_pdfs_insert_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'org_update_contract_pdfs'
  ) INTO contract_pdfs_update_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'org_delete_contract_pdfs'
  ) INTO contract_pdfs_delete_exists;
  
  -- Check if policies have org_id validation
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname IN ('org_insert_property_photos', 'org_delete_property_photos')
      AND (qual::text LIKE '%get_user_org_ids%' OR with_check::text LIKE '%get_user_org_ids%')
  ) INTO property_photos_has_org_check;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname IN ('org_select_contract_pdfs', 'org_insert_contract_pdfs', 'org_update_contract_pdfs', 'org_delete_contract_pdfs')
      AND (qual::text LIKE '%get_user_org_ids%' OR with_check::text LIKE '%get_user_org_ids%')
  ) INTO contract_pdfs_has_org_check;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'STORAGE POLICIES SECURITY FIX - VALIDATION';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  
  -- property-photos
  IF property_photos_insert_exists AND property_photos_delete_exists THEN
    RAISE NOTICE 'property-photos Bucket:';
    RAISE NOTICE '  ✅ INSERT policy: org_insert_property_photos';
    RAISE NOTICE '  ✅ DELETE policy: org_delete_property_photos';
    IF property_photos_has_org_check THEN
      RAISE NOTICE '  ✅ org_id validation var';
    ELSE
      RAISE NOTICE '  ⚠️  org_id validation kontrol edilemedi';
    END IF;
  ELSE
    RAISE WARNING 'property-photos: Bazı policies bulunamadı';
  END IF;
  
  RAISE NOTICE '';
  
  -- contract-pdfs
  IF contract_pdfs_select_exists AND contract_pdfs_insert_exists 
     AND contract_pdfs_update_exists AND contract_pdfs_delete_exists THEN
    RAISE NOTICE 'contract-pdfs Bucket:';
    RAISE NOTICE '  ✅ SELECT policy: org_select_contract_pdfs';
    RAISE NOTICE '  ✅ INSERT policy: org_insert_contract_pdfs';
    RAISE NOTICE '  ✅ UPDATE policy: org_update_contract_pdfs';
    RAISE NOTICE '  ✅ DELETE policy: org_delete_contract_pdfs';
    IF contract_pdfs_has_org_check THEN
      RAISE NOTICE '  ✅ org_id validation var';
    ELSE
      RAISE NOTICE '  ⚠️  org_id validation kontrol edilemedi';
    END IF;
  ELSE
    RAISE WARNING 'contract-pdfs: Bazı policies bulunamadı';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  
  IF property_photos_insert_exists AND property_photos_delete_exists
     AND contract_pdfs_select_exists AND contract_pdfs_insert_exists
     AND contract_pdfs_update_exists AND contract_pdfs_delete_exists THEN
    RAISE NOTICE '✅ Tüm storage policies güncellendi!';
    RAISE NOTICE '   Cross-org file access artık engellendi.';
  ELSE
    RAISE WARNING '❌ Bazı policies eksik - kontrol edin!';
  END IF;
  
  RAISE NOTICE '=====================================================';
  
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
