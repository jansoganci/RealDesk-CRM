-- =====================================================
-- ORG MIGRATION - PHASE 1.2: Add org_id + deleted_at Columns
-- =====================================================
--
-- Adds org_id and deleted_at columns to 14 business tables.
-- Columns are NULLABLE initially to allow gradual data migration.
--
-- Tables modified (14):
-- Core: properties, tenants, contracts, contract_details, property_owners,
--       property_inquiries, inquiry_matches, meetings
-- Financial: financial_transactions, commissions, recurring_expenses, expense_categories
-- Contract Builder: contract_clause_templates, contract_clause_overrides
--
-- NOT modified:
-- - property_photos (access via parent property join)
-- - exchange_rates (global data)
-- - user_billing, stripe_customers, subscriptions, user_preferences, consent_logs (billing)
-- - contract_templates_v2, contract_instances_v2 (deferred to V2)
--
-- ROLLBACK: See bottom of file
--
-- =====================================================

-- ============================================
-- 1. Core Business Tables
-- ============================================

-- properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- contract_details
ALTER TABLE contract_details ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE contract_details ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- property_owners
ALTER TABLE property_owners ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE property_owners ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- property_inquiries
ALTER TABLE property_inquiries ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE property_inquiries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- inquiry_matches
ALTER TABLE inquiry_matches ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE inquiry_matches ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- meetings
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================
-- 2. Financial Tables
-- ============================================

-- financial_transactions
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- commissions
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- recurring_expenses
ALTER TABLE recurring_expenses ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE recurring_expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- expense_categories (org_id stays NULLABLE for system default categories)
ALTER TABLE expense_categories ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE expense_categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================
-- 3. Contract Builder Tables
-- ============================================

-- contract_clause_templates
ALTER TABLE contract_clause_templates ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE contract_clause_templates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- contract_clause_overrides
ALTER TABLE contract_clause_overrides ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE contract_clause_overrides ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================
-- 4. Create Indexes for Performance
-- ============================================

-- org_id indexes (critical for RLS subquery performance)
CREATE INDEX IF NOT EXISTS idx_properties_org_id ON properties(org_id);
CREATE INDEX IF NOT EXISTS idx_tenants_org_id ON tenants(org_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org_id ON contracts(org_id);
CREATE INDEX IF NOT EXISTS idx_contract_details_org_id ON contract_details(org_id);
CREATE INDEX IF NOT EXISTS idx_property_owners_org_id ON property_owners(org_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_org_id ON property_inquiries(org_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_matches_org_id ON inquiry_matches(org_id);
CREATE INDEX IF NOT EXISTS idx_meetings_org_id ON meetings(org_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_org_id ON financial_transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_commissions_org_id ON commissions(org_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_org_id ON recurring_expenses(org_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_org_id ON expense_categories(org_id);
CREATE INDEX IF NOT EXISTS idx_contract_clause_templates_org_id ON contract_clause_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_contract_clause_overrides_org_id ON contract_clause_overrides(org_id);

-- deleted_at partial indexes (for soft delete filtering - only index non-deleted rows)
CREATE INDEX IF NOT EXISTS idx_properties_not_deleted ON properties(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_not_deleted ON tenants(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_not_deleted ON contracts(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contract_details_not_deleted ON contract_details(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_property_owners_not_deleted ON property_owners(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_property_inquiries_not_deleted ON property_inquiries(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inquiry_matches_not_deleted ON inquiry_matches(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_meetings_not_deleted ON meetings(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_financial_transactions_not_deleted ON financial_transactions(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_commissions_not_deleted ON commissions(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_not_deleted ON recurring_expenses(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_expense_categories_not_deleted ON expense_categories(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contract_clause_templates_not_deleted ON contract_clause_templates(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contract_clause_overrides_not_deleted ON contract_clause_overrides(id) WHERE deleted_at IS NULL;

-- ============================================
-- 5. Validation
-- ============================================
DO $$
DECLARE
  tables_with_org_id INT;
  expected_count INT := 14;
BEGIN
  SELECT COUNT(*) INTO tables_with_org_id
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'org_id'
    AND table_name IN (
      'properties', 'tenants', 'contracts', 'contract_details',
      'property_owners', 'property_inquiries', 'inquiry_matches', 'meetings',
      'financial_transactions', 'commissions', 'recurring_expenses', 'expense_categories',
      'contract_clause_templates', 'contract_clause_overrides'
    );

  IF tables_with_org_id < expected_count THEN
    RAISE WARNING 'Expected % tables with org_id, found %. Some tables may be missing.',
      expected_count, tables_with_org_id;
  ELSE
    RAISE NOTICE '✅ Phase 1.2 Complete: org_id and deleted_at columns added to % tables', tables_with_org_id;
  END IF;
END $$;

-- =====================================================
-- ROLLBACK SCRIPT (Run if needed)
-- =====================================================
/*
-- Drop indexes
DROP INDEX IF EXISTS idx_properties_org_id;
DROP INDEX IF EXISTS idx_tenants_org_id;
DROP INDEX IF EXISTS idx_contracts_org_id;
DROP INDEX IF EXISTS idx_contract_details_org_id;
DROP INDEX IF EXISTS idx_property_owners_org_id;
DROP INDEX IF EXISTS idx_property_inquiries_org_id;
DROP INDEX IF EXISTS idx_inquiry_matches_org_id;
DROP INDEX IF EXISTS idx_meetings_org_id;
DROP INDEX IF EXISTS idx_financial_transactions_org_id;
DROP INDEX IF EXISTS idx_commissions_org_id;
DROP INDEX IF EXISTS idx_recurring_expenses_org_id;
DROP INDEX IF EXISTS idx_expense_categories_org_id;
DROP INDEX IF EXISTS idx_contract_clause_templates_org_id;
DROP INDEX IF EXISTS idx_contract_clause_overrides_org_id;

DROP INDEX IF EXISTS idx_properties_not_deleted;
DROP INDEX IF EXISTS idx_tenants_not_deleted;
DROP INDEX IF EXISTS idx_contracts_not_deleted;
DROP INDEX IF EXISTS idx_contract_details_not_deleted;
DROP INDEX IF EXISTS idx_property_owners_not_deleted;
DROP INDEX IF EXISTS idx_property_inquiries_not_deleted;
DROP INDEX IF EXISTS idx_inquiry_matches_not_deleted;
DROP INDEX IF EXISTS idx_meetings_not_deleted;
DROP INDEX IF EXISTS idx_financial_transactions_not_deleted;
DROP INDEX IF EXISTS idx_commissions_not_deleted;
DROP INDEX IF EXISTS idx_recurring_expenses_not_deleted;
DROP INDEX IF EXISTS idx_expense_categories_not_deleted;
DROP INDEX IF EXISTS idx_contract_clause_templates_not_deleted;
DROP INDEX IF EXISTS idx_contract_clause_overrides_not_deleted;

-- Drop columns
ALTER TABLE properties DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE tenants DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE contracts DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE contract_details DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE property_owners DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE property_inquiries DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE inquiry_matches DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE meetings DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE financial_transactions DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE commissions DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE recurring_expenses DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE expense_categories DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE contract_clause_templates DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE contract_clause_overrides DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================
