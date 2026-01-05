-- =====================================================
-- ORG MIGRATION - PHASE 1.4: Add NOT NULL Constraints
-- =====================================================
--
-- This migration adds NOT NULL constraints to org_id columns
-- AFTER all data has been migrated.
--
-- IMPORTANT: Only run this AFTER Phase 1.3 (data migration)
-- has completed successfully with 0 orphaned records.
--
-- EXCEPTION: expense_categories keeps org_id NULLABLE for
-- system default categories (where user_id is also NULL).
--
-- ROLLBACK: See bottom of file
--
-- =====================================================

-- ============================================
-- 1. Pre-flight check: Ensure no orphaned records
-- ============================================
DO $$
DECLARE
  orphan_count INT := 0;
  temp_count INT;
BEGIN
  RAISE NOTICE 'Pre-flight check: Verifying all records have org_id...';

  SELECT COUNT(*) INTO temp_count FROM properties WHERE org_id IS NULL;
  orphan_count := orphan_count + temp_count;

  SELECT COUNT(*) INTO temp_count FROM tenants WHERE org_id IS NULL;
  orphan_count := orphan_count + temp_count;

  SELECT COUNT(*) INTO temp_count FROM contracts WHERE org_id IS NULL;
  orphan_count := orphan_count + temp_count;

  SELECT COUNT(*) INTO temp_count FROM contract_details WHERE org_id IS NULL;
  orphan_count := orphan_count + temp_count;

  SELECT COUNT(*) INTO temp_count FROM property_owners WHERE org_id IS NULL;
  orphan_count := orphan_count + temp_count;

  SELECT COUNT(*) INTO temp_count FROM property_inquiries WHERE org_id IS NULL;
  orphan_count := orphan_count + temp_count;

  SELECT COUNT(*) INTO temp_count FROM inquiry_matches WHERE org_id IS NULL;
  orphan_count := orphan_count + temp_count;

  SELECT COUNT(*) INTO temp_count FROM meetings WHERE org_id IS NULL;
  orphan_count := orphan_count + temp_count;

  SELECT COUNT(*) INTO temp_count FROM financial_transactions WHERE org_id IS NULL;
  orphan_count := orphan_count + temp_count;

  SELECT COUNT(*) INTO temp_count FROM commissions WHERE org_id IS NULL;
  orphan_count := orphan_count + temp_count;

  SELECT COUNT(*) INTO temp_count FROM recurring_expenses WHERE org_id IS NULL;
  orphan_count := orphan_count + temp_count;

  -- expense_categories: Only check user-created (where user_id IS NOT NULL)
  SELECT COUNT(*) INTO temp_count FROM expense_categories WHERE org_id IS NULL AND user_id IS NOT NULL;
  orphan_count := orphan_count + temp_count;

  SELECT COUNT(*) INTO temp_count FROM contract_clause_templates WHERE org_id IS NULL;
  orphan_count := orphan_count + temp_count;

  SELECT COUNT(*) INTO temp_count FROM contract_clause_overrides WHERE org_id IS NULL;
  orphan_count := orphan_count + temp_count;

  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraints: % orphaned records found without org_id. Run Phase 1.3 data migration first.', orphan_count;
  END IF;

  RAISE NOTICE 'Pre-flight check passed: All records have org_id';
END $$;

-- ============================================
-- 2. Add NOT NULL constraints
-- ============================================

-- Core Business Tables
ALTER TABLE properties ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE tenants ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE contracts ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE contract_details ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE property_owners ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE property_inquiries ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE inquiry_matches ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE meetings ALTER COLUMN org_id SET NOT NULL;

-- Financial Tables
ALTER TABLE financial_transactions ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE commissions ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE recurring_expenses ALTER COLUMN org_id SET NOT NULL;
-- expense_categories: KEEP NULLABLE for system defaults

-- Contract Builder Tables
ALTER TABLE contract_clause_templates ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE contract_clause_overrides ALTER COLUMN org_id SET NOT NULL;

-- ============================================
-- 3. Validation
-- ============================================
DO $$
DECLARE
  not_null_count INT;
  expected_count INT := 13; -- All except expense_categories
BEGIN
  SELECT COUNT(*) INTO not_null_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'org_id'
    AND is_nullable = 'NO'
    AND table_name IN (
      'properties', 'tenants', 'contracts', 'contract_details',
      'property_owners', 'property_inquiries', 'inquiry_matches', 'meetings',
      'financial_transactions', 'commissions', 'recurring_expenses',
      'contract_clause_templates', 'contract_clause_overrides'
    );

  IF not_null_count < expected_count THEN
    RAISE WARNING 'Expected % NOT NULL constraints, found %. Some constraints may have failed.',
      expected_count, not_null_count;
  ELSE
    RAISE NOTICE '✅ Phase 1.4 Complete: NOT NULL constraints added to % tables', not_null_count;
  END IF;

  -- Verify expense_categories is still nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'expense_categories'
      AND column_name = 'org_id'
      AND is_nullable = 'YES'
  ) THEN
    RAISE NOTICE '✅ expense_categories.org_id correctly remains NULLABLE for system defaults';
  ELSE
    RAISE WARNING 'expense_categories.org_id should be NULLABLE but is NOT NULL';
  END IF;
END $$;

-- =====================================================
-- ROLLBACK SCRIPT (Run if needed)
-- =====================================================
/*
ALTER TABLE properties ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE tenants ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE contracts ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE contract_details ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE property_owners ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE property_inquiries ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE inquiry_matches ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE meetings ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE financial_transactions ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE commissions ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE recurring_expenses ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE contract_clause_templates ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE contract_clause_overrides ALTER COLUMN org_id DROP NOT NULL;
*/

-- =====================================================
-- END OF PHASE 1
-- =====================================================
-- At this point:
-- ✅ organizations and org_members tables exist
-- ✅ All 14 business tables have org_id column
-- ✅ All 14 business tables have deleted_at column
-- ✅ Each existing user has an organization
-- ✅ All existing data is linked to an organization
-- ✅ NOT NULL constraints are in place (except expense_categories)
--
-- Next: Phase 2 - Update RLS policies
-- =====================================================
