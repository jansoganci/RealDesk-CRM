/*
  Phase 1 Validation Script

  Run this AFTER Phase 1 migration to verify everything is correct.
  This is a read-only script - it only checks, doesn't modify data.
*/

-- ============================================================================
-- CHECK 1: Verify user_id columns exist
-- ============================================================================
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE 'CHECK 1: Verifying user_id columns...';
  RAISE NOTICE '======================================';

  -- Check properties
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'user_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'properties.user_id');
  END IF;

  -- Check tenants
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'user_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'tenants.user_id');
  END IF;

  -- Check contracts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'user_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'contracts.user_id');
  END IF;

  -- Check property_owners
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_owners' AND column_name = 'user_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'property_owners.user_id');
  END IF;

  -- Check property_inquiries
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_inquiries' AND column_name = 'user_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'property_inquiries.user_id');
  END IF;

  -- Check inquiry_matches
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inquiry_matches' AND column_name = 'user_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'inquiry_matches.user_id');
  END IF;

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION '❌ Missing columns: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ All 6 tables have user_id column';
  END IF;
END $$;


-- ============================================================================
-- CHECK 2: Verify no NULL user_id values
-- ============================================================================
DO $$
DECLARE
  properties_nulls INTEGER;
  tenants_nulls INTEGER;
  contracts_nulls INTEGER;
  owners_nulls INTEGER;
  inquiries_nulls INTEGER;
  matches_nulls INTEGER;
  total_nulls INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'CHECK 2: Verifying no NULL user_id...';
  RAISE NOTICE '======================================';

  SELECT COUNT(*) INTO properties_nulls FROM properties WHERE user_id IS NULL;
  SELECT COUNT(*) INTO tenants_nulls FROM tenants WHERE user_id IS NULL;
  SELECT COUNT(*) INTO contracts_nulls FROM contracts WHERE user_id IS NULL;
  SELECT COUNT(*) INTO owners_nulls FROM property_owners WHERE user_id IS NULL;
  SELECT COUNT(*) INTO inquiries_nulls FROM property_inquiries WHERE user_id IS NULL;
  SELECT COUNT(*) INTO matches_nulls FROM inquiry_matches WHERE user_id IS NULL;

  total_nulls := properties_nulls + tenants_nulls + contracts_nulls +
                 owners_nulls + inquiries_nulls + matches_nulls;

  IF total_nulls > 0 THEN
    RAISE NOTICE '❌ Found NULL user_id values:';
    RAISE NOTICE '   properties: %', properties_nulls;
    RAISE NOTICE '   tenants: %', tenants_nulls;
    RAISE NOTICE '   contracts: %', contracts_nulls;
    RAISE NOTICE '   property_owners: %', owners_nulls;
    RAISE NOTICE '   property_inquiries: %', inquiries_nulls;
    RAISE NOTICE '   inquiry_matches: %', matches_nulls;
    RAISE EXCEPTION 'Validation failed: % NULL user_id values found', total_nulls;
  ELSE
    RAISE NOTICE '✅ No NULL user_id values found';
  END IF;
END $$;


-- ============================================================================
-- CHECK 3: Verify indexes were created
-- ============================================================================
DO $$
DECLARE
  missing_indexes TEXT[] := ARRAY[]::TEXT[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'CHECK 3: Verifying indexes...';
  RAISE NOTICE '======================================';

  -- Check single-column indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_properties_user_id') THEN
    missing_indexes := array_append(missing_indexes, 'idx_properties_user_id');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tenants_user_id') THEN
    missing_indexes := array_append(missing_indexes, 'idx_tenants_user_id');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_user_id') THEN
    missing_indexes := array_append(missing_indexes, 'idx_contracts_user_id');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_property_owners_user_id') THEN
    missing_indexes := array_append(missing_indexes, 'idx_property_owners_user_id');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_property_inquiries_user_id') THEN
    missing_indexes := array_append(missing_indexes, 'idx_property_inquiries_user_id');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inquiry_matches_user_id') THEN
    missing_indexes := array_append(missing_indexes, 'idx_inquiry_matches_user_id');
  END IF;

  -- Check composite indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_properties_user_status') THEN
    missing_indexes := array_append(missing_indexes, 'idx_properties_user_status');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_user_status') THEN
    missing_indexes := array_append(missing_indexes, 'idx_contracts_user_status');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inquiries_user_status') THEN
    missing_indexes := array_append(missing_indexes, 'idx_inquiries_user_status');
  END IF;

  IF array_length(missing_indexes, 1) > 0 THEN
    RAISE EXCEPTION '❌ Missing indexes: %', array_to_string(missing_indexes, ', ');
  ELSE
    RAISE NOTICE '✅ All 9 indexes created successfully';
  END IF;
END $$;


-- ============================================================================
-- CHECK 4: Verify tenants.property_id was dropped
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'CHECK 4: Verifying deprecated columns dropped...';
  RAISE NOTICE '======================================';

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'property_id'
  ) THEN
    RAISE EXCEPTION '❌ tenants.property_id still exists (should be dropped)';
  ELSE
    RAISE NOTICE '✅ tenants.property_id successfully dropped';
  END IF;
END $$;


-- ============================================================================
-- CHECK 5: Verify trigger is disabled
-- ============================================================================
DO $$
DECLARE
  trigger_status CHAR;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'CHECK 5: Verifying trigger status...';
  RAISE NOTICE '======================================';

  SELECT tgenabled INTO trigger_status
  FROM pg_trigger
  WHERE tgname = 'trigger_create_rental_commission'
  LIMIT 1;

  IF trigger_status IS NULL THEN
    RAISE NOTICE '⚠️  Trigger not found (might not exist yet)';
  ELSIF trigger_status = 'D' THEN
    RAISE NOTICE '✅ Trigger is DISABLED (correct state for Phase 1)';
  ELSIF trigger_status = 'O' THEN
    RAISE EXCEPTION '❌ Trigger is ENABLED (should be disabled until Phase 4)';
  ELSE
    RAISE NOTICE '⚠️  Trigger status unknown: %', trigger_status;
  END IF;
END $$;


-- ============================================================================
-- CHECK 6: Display data summary
-- ============================================================================
DO $$
DECLARE
  properties_count INTEGER;
  tenants_count INTEGER;
  contracts_count INTEGER;
  owners_count INTEGER;
  inquiries_count INTEGER;
  matches_count INTEGER;
  unique_users INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'CHECK 6: Data Summary';
  RAISE NOTICE '======================================';

  SELECT COUNT(*) INTO properties_count FROM properties;
  SELECT COUNT(*) INTO tenants_count FROM tenants;
  SELECT COUNT(*) INTO contracts_count FROM contracts;
  SELECT COUNT(*) INTO owners_count FROM property_owners;
  SELECT COUNT(*) INTO inquiries_count FROM property_inquiries;
  SELECT COUNT(*) INTO matches_count FROM inquiry_matches;

  SELECT COUNT(DISTINCT user_id) INTO unique_users FROM properties;

  RAISE NOTICE 'Records migrated:';
  RAISE NOTICE '  - Properties: %', properties_count;
  RAISE NOTICE '  - Tenants: %', tenants_count;
  RAISE NOTICE '  - Contracts: %', contracts_count;
  RAISE NOTICE '  - Property Owners: %', owners_count;
  RAISE NOTICE '  - Property Inquiries: %', inquiries_count;
  RAISE NOTICE '  - Inquiry Matches: %', matches_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Unique users assigned: %', unique_users;
  RAISE NOTICE '';
END $$;


-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE '✅ PHASE 1 VALIDATION COMPLETE';
  RAISE NOTICE '======================================';
  RAISE NOTICE '';
  RAISE NOTICE 'All checks passed! Ready for Phase 2.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Review the data summary above';
  RAISE NOTICE '  2. Proceed to Phase 2 (RLS Policies)';
  RAISE NOTICE '  3. Keep triggers disabled until Phase 4';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Current state:';
  RAISE NOTICE '  - user_id columns exist and populated';
  RAISE NOTICE '  - NO data isolation yet (RLS not enabled)';
  RAISE NOTICE '  - All agents can still see all data';
  RAISE NOTICE '  - Run Phase 2 IMMEDIATELY to enable isolation';
  RAISE NOTICE '======================================';
END $$;
