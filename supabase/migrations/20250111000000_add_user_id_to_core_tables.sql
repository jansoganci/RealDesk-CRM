/*
  Multi-Agent Migration - Phase 1: Add user_id to Core Tables

  This migration transforms the single-user CRM into a multi-agent system by:
  1. Disabling triggers that depend on user_id
  2. Adding user_id columns to all core tables
  3. Backfilling existing data with first user
  4. Creating indexes for performance
  5. Dropping deprecated columns

  ⚠️ IMPORTANT: This is part of a multi-phase migration.
  After this runs, Phase 2 (RLS policies) MUST follow immediately.

  Rollback: See rollback script at end of file
*/

-- ============================================================================
-- STEP 1: DISABLE TRIGGERS (Safety First!)
-- ============================================================================
-- Disable rental commission trigger to prevent race conditions during migration
-- Note: Using DO block because DISABLE TRIGGER doesn't support IF EXISTS
DO $$
BEGIN
  -- Check if trigger exists before disabling
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_create_rental_commission'
  ) THEN
    EXECUTE 'ALTER TABLE contracts DISABLE TRIGGER trigger_create_rental_commission';
    RAISE NOTICE 'Trigger disabled: trigger_create_rental_commission';
  ELSE
    RAISE NOTICE 'Trigger not found (skipping): trigger_create_rental_commission';
  END IF;

  RAISE NOTICE 'Triggers check complete. Safe to proceed with schema changes.';
END $$;


-- ============================================================================
-- STEP 2: ADD user_id COLUMNS (Nullable First)
-- ============================================================================
-- Add user_id to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to contracts table
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to property_owners table
ALTER TABLE property_owners
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to property_inquiries table
ALTER TABLE property_inquiries
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to inquiry_matches table
ALTER TABLE inquiry_matches
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Log progress
DO $$
BEGIN
  RAISE NOTICE 'user_id columns added to 6 tables (nullable).';
END $$;


-- ============================================================================
-- STEP 3: BACKFILL EXISTING DATA
-- ============================================================================
-- Strategy: Assign all existing records to the first user in the system
-- (For production, you may want to assign to a specific user UUID)

DO $$
DECLARE
  first_user_id UUID;
  properties_updated INTEGER;
  tenants_updated INTEGER;
  contracts_updated INTEGER;
  owners_updated INTEGER;
  inquiries_updated INTEGER;
  matches_updated INTEGER;
BEGIN
  -- Get the first user (or use a specific UUID for production)
  SELECT id INTO first_user_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  -- If no users exist, raise error (system must have at least one user)
  IF first_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in auth.users table. Please create at least one user before running this migration.';
  END IF;

  RAISE NOTICE 'Backfilling data with user_id: %', first_user_id;

  -- Backfill properties
  UPDATE properties
  SET user_id = first_user_id
  WHERE user_id IS NULL;
  GET DIAGNOSTICS properties_updated = ROW_COUNT;

  -- Backfill tenants
  UPDATE tenants
  SET user_id = first_user_id
  WHERE user_id IS NULL;
  GET DIAGNOSTICS tenants_updated = ROW_COUNT;

  -- Backfill contracts
  UPDATE contracts
  SET user_id = first_user_id
  WHERE user_id IS NULL;
  GET DIAGNOSTICS contracts_updated = ROW_COUNT;

  -- Backfill property_owners
  UPDATE property_owners
  SET user_id = first_user_id
  WHERE user_id IS NULL;
  GET DIAGNOSTICS owners_updated = ROW_COUNT;

  -- Backfill property_inquiries
  UPDATE property_inquiries
  SET user_id = first_user_id
  WHERE user_id IS NULL;
  GET DIAGNOSTICS inquiries_updated = ROW_COUNT;

  -- Backfill inquiry_matches
  UPDATE inquiry_matches
  SET user_id = first_user_id
  WHERE user_id IS NULL;
  GET DIAGNOSTICS matches_updated = ROW_COUNT;

  -- Log summary
  RAISE NOTICE 'Backfill complete:';
  RAISE NOTICE '  - Properties: % records', properties_updated;
  RAISE NOTICE '  - Tenants: % records', tenants_updated;
  RAISE NOTICE '  - Contracts: % records', contracts_updated;
  RAISE NOTICE '  - Property Owners: % records', owners_updated;
  RAISE NOTICE '  - Property Inquiries: % records', inquiries_updated;
  RAISE NOTICE '  - Inquiry Matches: % records', matches_updated;
END $$;


-- ============================================================================
-- STEP 4: MAKE user_id NOT NULL
-- ============================================================================
-- Now that all records have user_id, enforce NOT NULL constraint

ALTER TABLE properties ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tenants ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE contracts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE property_owners ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE property_inquiries ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE inquiry_matches ALTER COLUMN user_id SET NOT NULL;

-- Log progress
DO $$
BEGIN
  RAISE NOTICE 'user_id columns set to NOT NULL on all tables.';
END $$;


-- ============================================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
-- Single-column indexes for filtering by user_id
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_property_owners_user_id ON property_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_user_id ON property_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_matches_user_id ON inquiry_matches(user_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_properties_user_status ON properties(user_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_user_status ON contracts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_status ON property_inquiries(user_id, status);

-- Log progress
DO $$
BEGIN
  RAISE NOTICE 'Indexes created: 6 single-column + 3 composite indexes.';
END $$;


-- ============================================================================
-- STEP 6: DROP DEPRECATED COLUMNS
-- ============================================================================
-- Remove tenants.property_id (redundant with contracts.property_id)
ALTER TABLE tenants DROP COLUMN IF EXISTS property_id;

-- Log progress
DO $$
BEGIN
  RAISE NOTICE 'Deprecated column tenants.property_id dropped.';
END $$;


-- ============================================================================
-- STEP 7: VALIDATION CHECKS
-- ============================================================================
-- Verify no NULL user_id values remain
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM properties WHERE user_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % properties have NULL user_id', null_count;
  END IF;

  SELECT COUNT(*) INTO null_count FROM tenants WHERE user_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % tenants have NULL user_id', null_count;
  END IF;

  SELECT COUNT(*) INTO null_count FROM contracts WHERE user_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % contracts have NULL user_id', null_count;
  END IF;

  SELECT COUNT(*) INTO null_count FROM property_owners WHERE user_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % property_owners have NULL user_id', null_count;
  END IF;

  SELECT COUNT(*) INTO null_count FROM property_inquiries WHERE user_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % property_inquiries have NULL user_id', null_count;
  END IF;

  SELECT COUNT(*) INTO null_count FROM inquiry_matches WHERE user_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % inquiry_matches have NULL user_id', null_count;
  END IF;

  RAISE NOTICE '✅ Validation passed: All records have user_id';
END $$;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PHASE 1 MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - user_id columns added to 6 tables';
  RAISE NOTICE '  - All existing data backfilled';
  RAISE NOTICE '  - 9 indexes created';
  RAISE NOTICE '  - Deprecated columns removed';
  RAISE NOTICE '  - Triggers remain DISABLED';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEPS:';
  RAISE NOTICE '  1. Verify migration success in logs';
  RAISE NOTICE '  2. Run Phase 2 (RLS Policies) IMMEDIATELY';
  RAISE NOTICE '  3. Do NOT re-enable triggers until Phase 4';
  RAISE NOTICE '========================================';
END $$;


-- ============================================================================
-- ROLLBACK SCRIPT (Use only if migration fails)
-- ============================================================================
-- ⚠️ DANGER: This will remove all user_id columns and restore old state
-- Only run if you need to completely revert Phase 1

/*
-- Re-enable triggers
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_create_rental_commission'
  ) THEN
    EXECUTE 'ALTER TABLE contracts ENABLE TRIGGER trigger_create_rental_commission';
  END IF;
END $$;

-- Remove user_id columns
ALTER TABLE properties DROP COLUMN IF EXISTS user_id;
ALTER TABLE tenants DROP COLUMN IF EXISTS user_id;
ALTER TABLE contracts DROP COLUMN IF EXISTS user_id;
ALTER TABLE property_owners DROP COLUMN IF EXISTS user_id;
ALTER TABLE property_inquiries DROP COLUMN IF EXISTS user_id;
ALTER TABLE inquiry_matches DROP COLUMN IF EXISTS user_id;

-- Restore tenants.property_id
ALTER TABLE tenants ADD COLUMN property_id UUID REFERENCES properties(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS tenants_property_id_idx ON tenants(property_id);

-- Drop indexes
DROP INDEX IF EXISTS idx_properties_user_id;
DROP INDEX IF EXISTS idx_tenants_user_id;
DROP INDEX IF EXISTS idx_contracts_user_id;
DROP INDEX IF EXISTS idx_property_owners_user_id;
DROP INDEX IF EXISTS idx_property_inquiries_user_id;
DROP INDEX IF EXISTS idx_inquiry_matches_user_id;
DROP INDEX IF EXISTS idx_properties_user_status;
DROP INDEX IF EXISTS idx_contracts_user_status;
DROP INDEX IF EXISTS idx_inquiries_user_status;

-- Log rollback
DO $$
BEGIN
  RAISE NOTICE '❌ Phase 1 rolled back. System restored to pre-migration state.';
END $$;
*/
