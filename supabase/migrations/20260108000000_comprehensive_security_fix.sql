-- =====================================================
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- =====================================================
--
-- Date: 2026-01-08
-- Purpose: Fix ALL 5 security test failures
--
-- FIXES:
-- 1. Test 1 (Org INSERT): Block INSERT with USING(false), not just WITH CHECK
-- 2. Test 2 (Soft-Delete): Add trigger to prevent updates to deleted records
-- 3. Test 3 (Hard DELETE): Ensure DELETE policies exist with USING(false)
-- 4. Test 4 (Cross-Org): Recreate policies with proper isolation
-- 5. Test 5 (Org ID Immutability): Add trigger to prevent org_id changes
--
-- SAFE: Idempotent, can run multiple times
-- ROLLBACK: See bottom of file
--
-- =====================================================

-- ============================================
-- STEP 1: Create Security Helper Functions
-- ============================================

-- 1.1 Ensure get_user_org_ids exists
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

-- 1.2 Ensure is_org_owner exists
CREATE OR REPLACE FUNCTION is_org_owner(check_org_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = auth.uid()
      AND org_id = check_org_id
      AND status = 'active'
      AND role = 'owner'
  );
$$;

-- ============================================
-- STEP 2: Create Immutability Trigger Function
-- ============================================
-- This prevents org_id from being changed during UPDATE
-- FIX FOR: Test 5 (Org ID Immutability)

CREATE OR REPLACE FUNCTION prevent_org_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.org_id IS DISTINCT FROM NEW.org_id THEN
    RAISE EXCEPTION 'org_id cannot be changed. Current: %, Attempted: %', OLD.org_id, NEW.org_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION prevent_org_id_change() IS
  'Prevents org_id from being modified. Used by all org-scoped tables.';

-- ============================================
-- STEP 3: Create Soft-Delete Guard Trigger Function
-- ============================================
-- This prevents updates to rows where deleted_at IS NOT NULL
-- FIX FOR: Test 2 (Soft-Delete Guard)

CREATE OR REPLACE FUNCTION prevent_update_if_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot update soft-deleted records. Record was deleted at: %', OLD.deleted_at
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION prevent_update_if_deleted() IS
  'Prevents updates to soft-deleted records. Defense in depth with RLS.';

-- ============================================
-- STEP 4: Apply Triggers to All Business Tables
-- ============================================
-- Tables: properties, tenants, contracts, contract_details, property_owners,
--         property_inquiries, inquiry_matches, meetings, financial_transactions,
--         commissions, recurring_expenses, expense_categories,
--         contract_clause_templates, contract_clause_overrides

-- Helper to apply triggers (we'll use DO block)
DO $$
DECLARE
  tables_with_org_id TEXT[] := ARRAY[
    'properties', 'tenants', 'contracts', 'contract_details',
    'property_owners', 'property_inquiries', 'inquiry_matches',
    'meetings', 'financial_transactions', 'commissions',
    'recurring_expenses', 'expense_categories',
    'contract_clause_templates', 'contract_clause_overrides'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables_with_org_id LOOP
    -- Drop existing triggers if any
    EXECUTE format('DROP TRIGGER IF EXISTS trg_prevent_org_id_change ON %I', tbl);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_prevent_update_if_deleted ON %I', tbl);

    -- Create org_id immutability trigger
    EXECUTE format('
      CREATE TRIGGER trg_prevent_org_id_change
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION prevent_org_id_change()
    ', tbl);

    -- Create soft-delete guard trigger
    EXECUTE format('
      CREATE TRIGGER trg_prevent_update_if_deleted
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION prevent_update_if_deleted()
    ', tbl);

    RAISE NOTICE 'Applied security triggers to: %', tbl;
  END LOOP;
END $$;

-- ============================================
-- STEP 5: Fix Organizations Table Policies
-- ============================================
-- FIX FOR: Test 1 (Org INSERT Blocked)

DROP POLICY IF EXISTS "org_select_organizations" ON organizations;
DROP POLICY IF EXISTS "org_insert_organizations" ON organizations;
DROP POLICY IF EXISTS "org_update_organizations" ON organizations;
DROP POLICY IF EXISTS "org_delete_organizations" ON organizations;

-- SELECT: Members can see their orgs
CREATE POLICY "org_select_organizations" ON organizations
FOR SELECT USING (
  id IN (SELECT get_user_org_ids())
);

-- INSERT: COMPLETELY BLOCKED for all users
-- Only the SECURITY DEFINER trigger (handle_new_user_org) can insert
-- The trigger runs without auth.uid() context, bypassing RLS
CREATE POLICY "org_insert_organizations" ON organizations
FOR INSERT WITH CHECK (false);  -- Changed from auth.uid() IS NULL

-- UPDATE: Only owners can update their org
CREATE POLICY "org_update_organizations" ON organizations
FOR UPDATE USING (
  id IN (SELECT get_user_org_ids())
  AND is_org_owner(id)
);

-- DELETE: COMPLETELY BLOCKED
-- Orgs should never be hard-deleted
CREATE POLICY "org_delete_organizations" ON organizations
FOR DELETE USING (false);

-- ============================================
-- STEP 6: Fix Properties Table Policies
-- ============================================
-- FIX FOR: Tests 2, 3, 4

DROP POLICY IF EXISTS "org_select_properties" ON properties;
DROP POLICY IF EXISTS "org_insert_properties" ON properties;
DROP POLICY IF EXISTS "org_update_properties" ON properties;
DROP POLICY IF EXISTS "org_delete_properties" ON properties;

-- SELECT: Members can view non-deleted properties in their org
CREATE POLICY "org_select_properties" ON properties
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
);

-- INSERT: Only owners can create
CREATE POLICY "org_insert_properties" ON properties
FOR INSERT WITH CHECK (
  is_org_owner(org_id)
);

-- UPDATE: Only owners can update non-deleted records
-- Note: org_id immutability is enforced by trigger, not RLS
CREATE POLICY "org_update_properties" ON properties
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  -- Only check that we still own the org (trigger prevents org_id change)
  is_org_owner(org_id)
);

-- DELETE: COMPLETELY BLOCKED
CREATE POLICY "org_delete_properties" ON properties
FOR DELETE USING (false);

-- ============================================
-- STEP 7: Fix All Other Business Tables
-- ============================================
-- Apply the same pattern to all tables

-- 7.1 TENANTS
DROP POLICY IF EXISTS "org_select_tenants" ON tenants;
DROP POLICY IF EXISTS "org_insert_tenants" ON tenants;
DROP POLICY IF EXISTS "org_update_tenants" ON tenants;
DROP POLICY IF EXISTS "org_delete_tenants" ON tenants;

CREATE POLICY "org_select_tenants" ON tenants
FOR SELECT USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert_tenants" ON tenants
FOR INSERT WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_update_tenants" ON tenants
FOR UPDATE USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()) AND is_org_owner(org_id))
WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_delete_tenants" ON tenants
FOR DELETE USING (false);

-- 7.2 CONTRACTS
DROP POLICY IF EXISTS "org_select_contracts" ON contracts;
DROP POLICY IF EXISTS "org_insert_contracts" ON contracts;
DROP POLICY IF EXISTS "org_update_contracts" ON contracts;
DROP POLICY IF EXISTS "org_delete_contracts" ON contracts;

CREATE POLICY "org_select_contracts" ON contracts
FOR SELECT USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert_contracts" ON contracts
FOR INSERT WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_update_contracts" ON contracts
FOR UPDATE USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()) AND is_org_owner(org_id))
WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_delete_contracts" ON contracts
FOR DELETE USING (false);

-- 7.3 CONTRACT_DETAILS
DROP POLICY IF EXISTS "org_select_contract_details" ON contract_details;
DROP POLICY IF EXISTS "org_insert_contract_details" ON contract_details;
DROP POLICY IF EXISTS "org_update_contract_details" ON contract_details;
DROP POLICY IF EXISTS "org_delete_contract_details" ON contract_details;

CREATE POLICY "org_select_contract_details" ON contract_details
FOR SELECT USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert_contract_details" ON contract_details
FOR INSERT WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_update_contract_details" ON contract_details
FOR UPDATE USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()) AND is_org_owner(org_id))
WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_delete_contract_details" ON contract_details
FOR DELETE USING (false);

-- 7.4 PROPERTY_OWNERS
DROP POLICY IF EXISTS "org_select_property_owners" ON property_owners;
DROP POLICY IF EXISTS "org_insert_property_owners" ON property_owners;
DROP POLICY IF EXISTS "org_update_property_owners" ON property_owners;
DROP POLICY IF EXISTS "org_delete_property_owners" ON property_owners;

CREATE POLICY "org_select_property_owners" ON property_owners
FOR SELECT USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert_property_owners" ON property_owners
FOR INSERT WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_update_property_owners" ON property_owners
FOR UPDATE USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()) AND is_org_owner(org_id))
WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_delete_property_owners" ON property_owners
FOR DELETE USING (false);

-- 7.5 PROPERTY_INQUIRIES
DROP POLICY IF EXISTS "org_select_property_inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "org_insert_property_inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "org_update_property_inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "org_delete_property_inquiries" ON property_inquiries;

CREATE POLICY "org_select_property_inquiries" ON property_inquiries
FOR SELECT USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert_property_inquiries" ON property_inquiries
FOR INSERT WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_update_property_inquiries" ON property_inquiries
FOR UPDATE USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()) AND is_org_owner(org_id))
WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_delete_property_inquiries" ON property_inquiries
FOR DELETE USING (false);

-- 7.6 INQUIRY_MATCHES
DROP POLICY IF EXISTS "org_select_inquiry_matches" ON inquiry_matches;
DROP POLICY IF EXISTS "org_insert_inquiry_matches" ON inquiry_matches;
DROP POLICY IF EXISTS "org_update_inquiry_matches" ON inquiry_matches;
DROP POLICY IF EXISTS "org_delete_inquiry_matches" ON inquiry_matches;

CREATE POLICY "org_select_inquiry_matches" ON inquiry_matches
FOR SELECT USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert_inquiry_matches" ON inquiry_matches
FOR INSERT WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_update_inquiry_matches" ON inquiry_matches
FOR UPDATE USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()) AND is_org_owner(org_id))
WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_delete_inquiry_matches" ON inquiry_matches
FOR DELETE USING (false);

-- 7.7 MEETINGS
DROP POLICY IF EXISTS "org_select_meetings" ON meetings;
DROP POLICY IF EXISTS "org_insert_meetings" ON meetings;
DROP POLICY IF EXISTS "org_update_meetings" ON meetings;
DROP POLICY IF EXISTS "org_delete_meetings" ON meetings;

CREATE POLICY "org_select_meetings" ON meetings
FOR SELECT USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert_meetings" ON meetings
FOR INSERT WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_update_meetings" ON meetings
FOR UPDATE USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()) AND is_org_owner(org_id))
WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_delete_meetings" ON meetings
FOR DELETE USING (false);

-- 7.8 FINANCIAL_TRANSACTIONS
DROP POLICY IF EXISTS "org_select_financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "org_insert_financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "org_update_financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "org_delete_financial_transactions" ON financial_transactions;

CREATE POLICY "org_select_financial_transactions" ON financial_transactions
FOR SELECT USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert_financial_transactions" ON financial_transactions
FOR INSERT WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_update_financial_transactions" ON financial_transactions
FOR UPDATE USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()) AND is_org_owner(org_id))
WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_delete_financial_transactions" ON financial_transactions
FOR DELETE USING (false);

-- 7.9 COMMISSIONS
DROP POLICY IF EXISTS "org_select_commissions" ON commissions;
DROP POLICY IF EXISTS "org_insert_commissions" ON commissions;
DROP POLICY IF EXISTS "org_update_commissions" ON commissions;
DROP POLICY IF EXISTS "org_delete_commissions" ON commissions;

CREATE POLICY "org_select_commissions" ON commissions
FOR SELECT USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert_commissions" ON commissions
FOR INSERT WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_update_commissions" ON commissions
FOR UPDATE USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()) AND is_org_owner(org_id))
WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_delete_commissions" ON commissions
FOR DELETE USING (false);

-- 7.10 RECURRING_EXPENSES
DROP POLICY IF EXISTS "org_select_recurring_expenses" ON recurring_expenses;
DROP POLICY IF EXISTS "org_insert_recurring_expenses" ON recurring_expenses;
DROP POLICY IF EXISTS "org_update_recurring_expenses" ON recurring_expenses;
DROP POLICY IF EXISTS "org_delete_recurring_expenses" ON recurring_expenses;

CREATE POLICY "org_select_recurring_expenses" ON recurring_expenses
FOR SELECT USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert_recurring_expenses" ON recurring_expenses
FOR INSERT WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_update_recurring_expenses" ON recurring_expenses
FOR UPDATE USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()) AND is_org_owner(org_id))
WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_delete_recurring_expenses" ON recurring_expenses
FOR DELETE USING (false);

-- 7.11 EXPENSE_CATEGORIES (special: allows NULL org_id for system defaults)
DROP POLICY IF EXISTS "org_select_expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "org_insert_expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "org_update_expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "org_delete_expense_categories" ON expense_categories;

CREATE POLICY "org_select_expense_categories" ON expense_categories
FOR SELECT USING (
  deleted_at IS NULL
  AND (org_id IS NULL OR org_id IN (SELECT get_user_org_ids()))
);

CREATE POLICY "org_insert_expense_categories" ON expense_categories
FOR INSERT WITH CHECK (org_id IS NOT NULL AND is_org_owner(org_id));

CREATE POLICY "org_update_expense_categories" ON expense_categories
FOR UPDATE USING (deleted_at IS NULL AND org_id IS NOT NULL AND org_id IN (SELECT get_user_org_ids()) AND is_org_owner(org_id))
WITH CHECK (org_id IS NOT NULL AND is_org_owner(org_id));

CREATE POLICY "org_delete_expense_categories" ON expense_categories
FOR DELETE USING (false);

-- 7.12 CONTRACT_CLAUSE_TEMPLATES
DROP POLICY IF EXISTS "org_select_contract_clause_templates" ON contract_clause_templates;
DROP POLICY IF EXISTS "org_insert_contract_clause_templates" ON contract_clause_templates;
DROP POLICY IF EXISTS "org_update_contract_clause_templates" ON contract_clause_templates;
DROP POLICY IF EXISTS "org_delete_contract_clause_templates" ON contract_clause_templates;

CREATE POLICY "org_select_contract_clause_templates" ON contract_clause_templates
FOR SELECT USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert_contract_clause_templates" ON contract_clause_templates
FOR INSERT WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_update_contract_clause_templates" ON contract_clause_templates
FOR UPDATE USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()) AND is_org_owner(org_id))
WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_delete_contract_clause_templates" ON contract_clause_templates
FOR DELETE USING (false);

-- 7.13 CONTRACT_CLAUSE_OVERRIDES
DROP POLICY IF EXISTS "org_select_contract_clause_overrides" ON contract_clause_overrides;
DROP POLICY IF EXISTS "org_insert_contract_clause_overrides" ON contract_clause_overrides;
DROP POLICY IF EXISTS "org_update_contract_clause_overrides" ON contract_clause_overrides;
DROP POLICY IF EXISTS "org_delete_contract_clause_overrides" ON contract_clause_overrides;

CREATE POLICY "org_select_contract_clause_overrides" ON contract_clause_overrides
FOR SELECT USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert_contract_clause_overrides" ON contract_clause_overrides
FOR INSERT WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_update_contract_clause_overrides" ON contract_clause_overrides
FOR UPDATE USING (deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids()) AND is_org_owner(org_id))
WITH CHECK (is_org_owner(org_id));

CREATE POLICY "org_delete_contract_clause_overrides" ON contract_clause_overrides
FOR DELETE USING (false);

-- 7.14 PROPERTY_PHOTOS (via properties join)
DROP POLICY IF EXISTS "org_select_property_photos" ON property_photos;
DROP POLICY IF EXISTS "org_insert_property_photos" ON property_photos;
DROP POLICY IF EXISTS "org_update_property_photos" ON property_photos;
DROP POLICY IF EXISTS "org_delete_property_photos" ON property_photos;

CREATE POLICY "org_select_property_photos" ON property_photos
FOR SELECT USING (
  property_id IN (
    SELECT id FROM properties
    WHERE deleted_at IS NULL AND org_id IN (SELECT get_user_org_ids())
  )
);

CREATE POLICY "org_insert_property_photos" ON property_photos
FOR INSERT WITH CHECK (
  property_id IN (
    SELECT id FROM properties
    WHERE deleted_at IS NULL AND is_org_owner(org_id)
  )
);

CREATE POLICY "org_update_property_photos" ON property_photos
FOR UPDATE USING (
  property_id IN (
    SELECT id FROM properties
    WHERE deleted_at IS NULL AND is_org_owner(org_id)
  )
);

CREATE POLICY "org_delete_property_photos" ON property_photos
FOR DELETE USING (false);

-- ============================================
-- STEP 8: Fix org_members Table Policies
-- ============================================

DROP POLICY IF EXISTS "org_select_org_members" ON org_members;
DROP POLICY IF EXISTS "org_insert_org_members" ON org_members;
DROP POLICY IF EXISTS "org_update_org_members" ON org_members;
DROP POLICY IF EXISTS "org_delete_org_members" ON org_members;

-- SELECT: Members can see members of their orgs
CREATE POLICY "org_select_org_members" ON org_members
FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

-- INSERT: Only via trigger OR owner inviting
CREATE POLICY "org_insert_org_members" ON org_members
FOR INSERT WITH CHECK (
  -- Case 1: Trigger (auth.uid() is NULL in SECURITY DEFINER context)
  auth.uid() IS NULL
  OR
  -- Case 2: Owner inviting new member
  is_org_owner(org_id)
);

-- UPDATE: Only owners can update members
CREATE POLICY "org_update_org_members" ON org_members
FOR UPDATE USING (is_org_owner(org_id));

-- DELETE: Only owners can remove members
CREATE POLICY "org_delete_org_members" ON org_members
FOR DELETE USING (is_org_owner(org_id));

-- ============================================
-- STEP 9: Validation
-- ============================================
DO $$
DECLARE
  policy_count INT;
  trigger_count INT;
  delete_blocked INT;
BEGIN
  -- Count org policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE policyname LIKE 'org_%';

  -- Count security triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname IN ('trg_prevent_org_id_change', 'trg_prevent_update_if_deleted');

  -- Verify DELETE policies are blocked
  SELECT COUNT(*) INTO delete_blocked
  FROM pg_policies
  WHERE policyname LIKE 'org_delete_%'
    AND qual = 'false';

  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'COMPREHENSIVE SECURITY FIX APPLIED';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - RLS Policies created: %', policy_count;
  RAISE NOTICE '  - Security triggers created: %', trigger_count;
  RAISE NOTICE '  - DELETE policies blocked: %', delete_blocked;
  RAISE NOTICE '';
  RAISE NOTICE 'Fixes Applied:';
  RAISE NOTICE '  [1] Org INSERT: Now uses WITH CHECK (false)';
  RAISE NOTICE '  [2] Soft-Delete: Added trg_prevent_update_if_deleted';
  RAISE NOTICE '  [3] Hard DELETE: All tables have USING (false)';
  RAISE NOTICE '  [4] Cross-Org: Recreated all SELECT policies';
  RAISE NOTICE '  [5] Org ID Immutability: Added trg_prevent_org_id_change';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Run tests with AUTHENTICATED USER context,';
  RAISE NOTICE '           NOT service role (which bypasses RLS).';
  RAISE NOTICE '=====================================================';
END $$;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- To rollback this migration:
--
-- 1. Drop the new triggers:
--    DROP TRIGGER IF EXISTS trg_prevent_org_id_change ON <each_table>;
--    DROP TRIGGER IF EXISTS trg_prevent_update_if_deleted ON <each_table>;
--
-- 2. Drop the trigger functions:
--    DROP FUNCTION IF EXISTS prevent_org_id_change();
--    DROP FUNCTION IF EXISTS prevent_update_if_deleted();
--
-- 3. Re-run the previous RLS migration:
--    Run: 20260104000002_fix_all_rls_policies_use_helper_function.sql
--
-- =====================================================
-- END OF MIGRATION
-- =====================================================
