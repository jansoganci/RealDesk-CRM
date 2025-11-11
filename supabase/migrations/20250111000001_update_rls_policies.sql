/*
  Multi-Agent Migration - Phase 2: Update RLS Policies

  This migration enables multi-tenant data isolation by:
  1. Dropping old "open access" RLS policies
  2. Creating new user-filtered RLS policies
  3. Ensuring each agent sees only their own data
  4. Handling property_photos via JOIN to properties

  ⚠️ IMPORTANT: After this runs, data isolation is ACTIVE.
  Each user will only see records where user_id matches auth.uid()

  Prerequisites: Phase 1 must be complete (user_id columns exist)
*/

-- ============================================================================
-- STEP 1: UPDATE PROPERTIES TABLE RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can view properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can create properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can update properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can delete properties" ON properties;

-- Create new user-filtered policies
CREATE POLICY "Users can view their own properties"
  ON properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties"
  ON properties FOR DELETE
  USING (auth.uid() = user_id);

-- Log progress
DO $$
BEGIN
  RAISE NOTICE '✅ Properties table: RLS policies updated (4 policies)';
END $$;


-- ============================================================================
-- STEP 2: UPDATE TENANTS TABLE RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can view tenants" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can update tenants" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can delete tenants" ON tenants;

-- Create new user-filtered policies
CREATE POLICY "Users can view their own tenants"
  ON tenants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tenants"
  ON tenants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tenants"
  ON tenants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tenants"
  ON tenants FOR DELETE
  USING (auth.uid() = user_id);

-- Log progress
DO $$
BEGIN
  RAISE NOTICE '✅ Tenants table: RLS policies updated (4 policies)';
END $$;


-- ============================================================================
-- STEP 3: UPDATE CONTRACTS TABLE RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can create contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can update contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can delete contracts" ON contracts;

-- Create new user-filtered policies
CREATE POLICY "Users can view their own contracts"
  ON contracts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contracts"
  ON contracts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contracts"
  ON contracts FOR DELETE
  USING (auth.uid() = user_id);

-- Log progress
DO $$
BEGIN
  RAISE NOTICE '✅ Contracts table: RLS policies updated (4 policies)';
END $$;


-- ============================================================================
-- STEP 4: UPDATE PROPERTY_OWNERS TABLE RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can view property owners" ON property_owners;
DROP POLICY IF EXISTS "Authenticated users can create property owners" ON property_owners;
DROP POLICY IF EXISTS "Authenticated users can update property owners" ON property_owners;
DROP POLICY IF EXISTS "Authenticated users can delete property owners" ON property_owners;

-- Create new user-filtered policies
CREATE POLICY "Users can view their own property owners"
  ON property_owners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own property owners"
  ON property_owners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own property owners"
  ON property_owners FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own property owners"
  ON property_owners FOR DELETE
  USING (auth.uid() = user_id);

-- Log progress
DO $$
BEGIN
  RAISE NOTICE '✅ Property Owners table: RLS policies updated (4 policies)';
END $$;


-- ============================================================================
-- STEP 5: UPDATE PROPERTY_INQUIRIES TABLE RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can view inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "Authenticated users can update inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "Authenticated users can delete inquiries" ON property_inquiries;

-- Create new user-filtered policies
CREATE POLICY "Users can view their own inquiries"
  ON property_inquiries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inquiries"
  ON property_inquiries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inquiries"
  ON property_inquiries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inquiries"
  ON property_inquiries FOR DELETE
  USING (auth.uid() = user_id);

-- Log progress
DO $$
BEGIN
  RAISE NOTICE '✅ Property Inquiries table: RLS policies updated (4 policies)';
END $$;


-- ============================================================================
-- STEP 6: UPDATE INQUIRY_MATCHES TABLE RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can view matches" ON inquiry_matches;
DROP POLICY IF EXISTS "Authenticated users can create matches" ON inquiry_matches;
DROP POLICY IF EXISTS "Authenticated users can update matches" ON inquiry_matches;
DROP POLICY IF EXISTS "Authenticated users can delete matches" ON inquiry_matches;

-- Create new user-filtered policies
CREATE POLICY "Users can view their own matches"
  ON inquiry_matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own matches"
  ON inquiry_matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own matches"
  ON inquiry_matches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own matches"
  ON inquiry_matches FOR DELETE
  USING (auth.uid() = user_id);

-- Log progress
DO $$
BEGIN
  RAISE NOTICE '✅ Inquiry Matches table: RLS policies updated (4 policies)';
END $$;


-- ============================================================================
-- STEP 7: UPDATE PROPERTY_PHOTOS TABLE RLS POLICIES
-- ============================================================================
-- Note: property_photos doesn't have user_id, so we filter via properties JOIN

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can view property photos" ON property_photos;
DROP POLICY IF EXISTS "Authenticated users can upload property photos" ON property_photos;
DROP POLICY IF EXISTS "Authenticated users can update property photos" ON property_photos;
DROP POLICY IF EXISTS "Authenticated users can delete property photos" ON property_photos;

-- Create new policies with JOIN filtering
CREATE POLICY "Users can view photos of their properties"
  ON property_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload photos to their properties"
  ON property_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos of their properties"
  ON property_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
      AND properties.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos of their properties"
  ON property_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- Log progress
DO $$
BEGIN
  RAISE NOTICE '✅ Property Photos table: RLS policies updated (4 policies with JOIN)';
END $$;


-- ============================================================================
-- STEP 8: VALIDATION - VERIFY ALL POLICIES ARE ACTIVE
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
  expected_count INTEGER := 28; -- 7 tables × 4 policies each
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Validating RLS policies...';
  RAISE NOTICE '======================================';

  -- Count active policies for our tables
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN (
    'properties',
    'tenants',
    'contracts',
    'property_owners',
    'property_inquiries',
    'inquiry_matches',
    'property_photos'
  );

  RAISE NOTICE 'Found % RLS policies (expected %)', policy_count, expected_count;

  IF policy_count < expected_count THEN
    RAISE WARNING 'Some policies may be missing. Expected %, found %', expected_count, policy_count;
  ELSE
    RAISE NOTICE '✅ All RLS policies created successfully';
  END IF;
END $$;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PHASE 2 MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - Updated RLS policies on 7 tables';
  RAISE NOTICE '  - Created 28 user-filtered policies';
  RAISE NOTICE '  - Multi-tenant isolation is now ACTIVE';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT NOTES:';
  RAISE NOTICE '  - Each user now sees only their own data';
  RAISE NOTICE '  - Service layer still needs updates (Phase 3)';
  RAISE NOTICE '  - Creating new records will FAIL until Phase 3';
  RAISE NOTICE '  - Existing data remains accessible to original user';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEPS:';
  RAISE NOTICE '  1. Test data isolation with 2 users';
  RAISE NOTICE '  2. Proceed to Phase 3 (Service Layer) ASAP';
  RAISE NOTICE '  3. Do NOT attempt to create records until Phase 3';
  RAISE NOTICE '========================================';
END $$;


-- ============================================================================
-- ROLLBACK SCRIPT (Use only if migration fails)
-- ============================================================================
-- ⚠️ DANGER: This will revert to open-access policies
-- Only run if you need to completely revert Phase 2

/*
-- Revert properties policies
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;

CREATE POLICY "Authenticated users can view properties"
  ON properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create properties"
  ON properties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update properties"
  ON properties FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete properties"
  ON properties FOR DELETE TO authenticated USING (true);

-- Repeat for other tables (tenants, contracts, property_owners,
-- property_inquiries, inquiry_matches, property_photos)

-- Log rollback
DO $$
BEGIN
  RAISE NOTICE '❌ Phase 2 rolled back. RLS policies reverted to open access.';
END $$;
*/
