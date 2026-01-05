-- =====================================================
-- COMPREHENSIVE FIX: Update ALL RLS Policies to Use get_user_org_ids()
-- =====================================================
--
-- ROOT CAUSE:
-- The hotfix (20260104000001) only updated org_members to use get_user_org_ids().
-- All other tables still use direct subqueries:
--   org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
--
-- This causes NESTED RLS evaluation:
-- 1. Query property_owners → RLS evaluates subquery
-- 2. Subquery hits org_members → org_members RLS evaluates
-- 3. org_members RLS calls get_user_org_ids()
-- 4. Nested evaluation causes 406 errors
--
-- SOLUTION:
-- Update ALL policies to use get_user_org_ids() directly.
-- This avoids nested RLS and ensures consistent behavior.
--
-- TABLES AFFECTED:
-- - properties
-- - tenants
-- - contracts
-- - contract_details
-- - property_owners
-- - property_inquiries
-- - inquiry_matches
-- - meetings
-- - financial_transactions
-- - commissions
-- - recurring_expenses
-- - expense_categories
-- - contract_clause_templates
-- - contract_clause_overrides
-- - property_photos (uses properties join)
-- - organizations
--
-- SAFE: Idempotent, can run multiple times
-- ROLLBACK: Re-run 20251231000006_org_phase2_create_new_rls.sql
--
-- =====================================================

-- ============================================
-- PREREQUISITE: Ensure get_user_org_ids() exists
-- ============================================
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

-- Helper function to check if user is org owner
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
-- 1. PROPERTIES
-- ============================================
DROP POLICY IF EXISTS "org_select_properties" ON properties;
DROP POLICY IF EXISTS "org_insert_properties" ON properties;
DROP POLICY IF EXISTS "org_update_properties" ON properties;
DROP POLICY IF EXISTS "org_delete_properties" ON properties;

CREATE POLICY "org_select_properties" ON properties
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
);

CREATE POLICY "org_insert_properties" ON properties
FOR INSERT WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_update_properties" ON properties
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_properties" ON properties
FOR DELETE USING (false);

-- ============================================
-- 2. TENANTS
-- ============================================
DROP POLICY IF EXISTS "org_select_tenants" ON tenants;
DROP POLICY IF EXISTS "org_insert_tenants" ON tenants;
DROP POLICY IF EXISTS "org_update_tenants" ON tenants;
DROP POLICY IF EXISTS "org_delete_tenants" ON tenants;

CREATE POLICY "org_select_tenants" ON tenants
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
);

CREATE POLICY "org_insert_tenants" ON tenants
FOR INSERT WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_update_tenants" ON tenants
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_tenants" ON tenants
FOR DELETE USING (false);

-- ============================================
-- 3. CONTRACTS
-- ============================================
DROP POLICY IF EXISTS "org_select_contracts" ON contracts;
DROP POLICY IF EXISTS "org_insert_contracts" ON contracts;
DROP POLICY IF EXISTS "org_update_contracts" ON contracts;
DROP POLICY IF EXISTS "org_delete_contracts" ON contracts;

CREATE POLICY "org_select_contracts" ON contracts
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
);

CREATE POLICY "org_insert_contracts" ON contracts
FOR INSERT WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_update_contracts" ON contracts
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_contracts" ON contracts
FOR DELETE USING (false);

-- ============================================
-- 4. CONTRACT_DETAILS
-- ============================================
DROP POLICY IF EXISTS "org_select_contract_details" ON contract_details;
DROP POLICY IF EXISTS "org_insert_contract_details" ON contract_details;
DROP POLICY IF EXISTS "org_update_contract_details" ON contract_details;
DROP POLICY IF EXISTS "org_delete_contract_details" ON contract_details;

CREATE POLICY "org_select_contract_details" ON contract_details
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
);

CREATE POLICY "org_insert_contract_details" ON contract_details
FOR INSERT WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_update_contract_details" ON contract_details
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_contract_details" ON contract_details
FOR DELETE USING (false);

-- ============================================
-- 5. PROPERTY_OWNERS
-- ============================================
DROP POLICY IF EXISTS "org_select_property_owners" ON property_owners;
DROP POLICY IF EXISTS "org_insert_property_owners" ON property_owners;
DROP POLICY IF EXISTS "org_update_property_owners" ON property_owners;
DROP POLICY IF EXISTS "org_delete_property_owners" ON property_owners;

CREATE POLICY "org_select_property_owners" ON property_owners
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
);

CREATE POLICY "org_insert_property_owners" ON property_owners
FOR INSERT WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_update_property_owners" ON property_owners
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_property_owners" ON property_owners
FOR DELETE USING (false);

-- ============================================
-- 6. PROPERTY_INQUIRIES
-- ============================================
DROP POLICY IF EXISTS "org_select_property_inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "org_insert_property_inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "org_update_property_inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "org_delete_property_inquiries" ON property_inquiries;

CREATE POLICY "org_select_property_inquiries" ON property_inquiries
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
);

CREATE POLICY "org_insert_property_inquiries" ON property_inquiries
FOR INSERT WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_update_property_inquiries" ON property_inquiries
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_property_inquiries" ON property_inquiries
FOR DELETE USING (false);

-- ============================================
-- 7. INQUIRY_MATCHES
-- ============================================
DROP POLICY IF EXISTS "org_select_inquiry_matches" ON inquiry_matches;
DROP POLICY IF EXISTS "org_insert_inquiry_matches" ON inquiry_matches;
DROP POLICY IF EXISTS "org_update_inquiry_matches" ON inquiry_matches;
DROP POLICY IF EXISTS "org_delete_inquiry_matches" ON inquiry_matches;

CREATE POLICY "org_select_inquiry_matches" ON inquiry_matches
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
);

CREATE POLICY "org_insert_inquiry_matches" ON inquiry_matches
FOR INSERT WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_update_inquiry_matches" ON inquiry_matches
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_inquiry_matches" ON inquiry_matches
FOR DELETE USING (false);

-- ============================================
-- 8. MEETINGS
-- ============================================
DROP POLICY IF EXISTS "org_select_meetings" ON meetings;
DROP POLICY IF EXISTS "org_insert_meetings" ON meetings;
DROP POLICY IF EXISTS "org_update_meetings" ON meetings;
DROP POLICY IF EXISTS "org_delete_meetings" ON meetings;

CREATE POLICY "org_select_meetings" ON meetings
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
);

CREATE POLICY "org_insert_meetings" ON meetings
FOR INSERT WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_update_meetings" ON meetings
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_meetings" ON meetings
FOR DELETE USING (false);

-- ============================================
-- 9. FINANCIAL_TRANSACTIONS
-- ============================================
DROP POLICY IF EXISTS "org_select_financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "org_insert_financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "org_update_financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "org_delete_financial_transactions" ON financial_transactions;

CREATE POLICY "org_select_financial_transactions" ON financial_transactions
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
);

CREATE POLICY "org_insert_financial_transactions" ON financial_transactions
FOR INSERT WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_update_financial_transactions" ON financial_transactions
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_financial_transactions" ON financial_transactions
FOR DELETE USING (false);

-- ============================================
-- 10. COMMISSIONS
-- ============================================
DROP POLICY IF EXISTS "org_select_commissions" ON commissions;
DROP POLICY IF EXISTS "org_insert_commissions" ON commissions;
DROP POLICY IF EXISTS "org_update_commissions" ON commissions;
DROP POLICY IF EXISTS "org_delete_commissions" ON commissions;

CREATE POLICY "org_select_commissions" ON commissions
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
);

CREATE POLICY "org_insert_commissions" ON commissions
FOR INSERT WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_update_commissions" ON commissions
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_commissions" ON commissions
FOR DELETE USING (false);

-- ============================================
-- 11. RECURRING_EXPENSES
-- ============================================
DROP POLICY IF EXISTS "org_select_recurring_expenses" ON recurring_expenses;
DROP POLICY IF EXISTS "org_insert_recurring_expenses" ON recurring_expenses;
DROP POLICY IF EXISTS "org_update_recurring_expenses" ON recurring_expenses;
DROP POLICY IF EXISTS "org_delete_recurring_expenses" ON recurring_expenses;

CREATE POLICY "org_select_recurring_expenses" ON recurring_expenses
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
);

CREATE POLICY "org_insert_recurring_expenses" ON recurring_expenses
FOR INSERT WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_update_recurring_expenses" ON recurring_expenses
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_recurring_expenses" ON recurring_expenses
FOR DELETE USING (false);

-- ============================================
-- 12. EXPENSE_CATEGORIES (special: allows NULL org_id for system defaults)
-- ============================================
DROP POLICY IF EXISTS "org_select_expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "org_insert_expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "org_update_expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "org_delete_expense_categories" ON expense_categories;

CREATE POLICY "org_select_expense_categories" ON expense_categories
FOR SELECT USING (
  deleted_at IS NULL
  AND (
    org_id IS NULL  -- System defaults visible to all
    OR org_id IN (SELECT get_user_org_ids())
  )
);

CREATE POLICY "org_insert_expense_categories" ON expense_categories
FOR INSERT WITH CHECK (
  org_id IS NOT NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_update_expense_categories" ON expense_categories
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IS NOT NULL  -- Cannot update system defaults
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  org_id IS NOT NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_expense_categories" ON expense_categories
FOR DELETE USING (false);

-- ============================================
-- 13. CONTRACT_CLAUSE_TEMPLATES
-- ============================================
DROP POLICY IF EXISTS "org_select_contract_clause_templates" ON contract_clause_templates;
DROP POLICY IF EXISTS "org_insert_contract_clause_templates" ON contract_clause_templates;
DROP POLICY IF EXISTS "org_update_contract_clause_templates" ON contract_clause_templates;
DROP POLICY IF EXISTS "org_delete_contract_clause_templates" ON contract_clause_templates;

CREATE POLICY "org_select_contract_clause_templates" ON contract_clause_templates
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
);

CREATE POLICY "org_insert_contract_clause_templates" ON contract_clause_templates
FOR INSERT WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_update_contract_clause_templates" ON contract_clause_templates
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_contract_clause_templates" ON contract_clause_templates
FOR DELETE USING (false);

-- ============================================
-- 14. CONTRACT_CLAUSE_OVERRIDES
-- ============================================
DROP POLICY IF EXISTS "org_select_contract_clause_overrides" ON contract_clause_overrides;
DROP POLICY IF EXISTS "org_insert_contract_clause_overrides" ON contract_clause_overrides;
DROP POLICY IF EXISTS "org_update_contract_clause_overrides" ON contract_clause_overrides;
DROP POLICY IF EXISTS "org_delete_contract_clause_overrides" ON contract_clause_overrides;

CREATE POLICY "org_select_contract_clause_overrides" ON contract_clause_overrides
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
);

CREATE POLICY "org_insert_contract_clause_overrides" ON contract_clause_overrides
FOR INSERT WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_update_contract_clause_overrides" ON contract_clause_overrides
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
)
WITH CHECK (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_contract_clause_overrides" ON contract_clause_overrides
FOR DELETE USING (false);

-- ============================================
-- 15. PROPERTY_PHOTOS (via properties join)
-- ============================================
DROP POLICY IF EXISTS "org_select_property_photos" ON property_photos;
DROP POLICY IF EXISTS "org_insert_property_photos" ON property_photos;
DROP POLICY IF EXISTS "org_update_property_photos" ON property_photos;
DROP POLICY IF EXISTS "org_delete_property_photos" ON property_photos;

CREATE POLICY "org_select_property_photos" ON property_photos
FOR SELECT USING (
  property_id IN (
    SELECT id FROM properties
    WHERE deleted_at IS NULL
      AND org_id IN (SELECT get_user_org_ids())
  )
);

CREATE POLICY "org_insert_property_photos" ON property_photos
FOR INSERT WITH CHECK (
  property_id IN (
    SELECT id FROM properties
    WHERE deleted_at IS NULL
      AND org_id IN (SELECT get_user_org_ids())
      AND is_org_owner(org_id)
  )
);

CREATE POLICY "org_update_property_photos" ON property_photos
FOR UPDATE USING (
  property_id IN (
    SELECT id FROM properties
    WHERE deleted_at IS NULL
      AND org_id IN (SELECT get_user_org_ids())
      AND is_org_owner(org_id)
  )
);

CREATE POLICY "org_delete_property_photos" ON property_photos
FOR DELETE USING (false);

-- ============================================
-- 16. ORGANIZATIONS (keep existing pattern but use function)
-- ============================================
DROP POLICY IF EXISTS "org_select_organizations" ON organizations;
DROP POLICY IF EXISTS "org_insert_organizations" ON organizations;
DROP POLICY IF EXISTS "org_update_organizations" ON organizations;
DROP POLICY IF EXISTS "org_delete_organizations" ON organizations;

CREATE POLICY "org_select_organizations" ON organizations
FOR SELECT USING (
  id IN (SELECT get_user_org_ids())
);

-- Only SECURITY DEFINER trigger can insert (new user signup)
CREATE POLICY "org_insert_organizations" ON organizations
FOR INSERT WITH CHECK (
  auth.uid() IS NULL  -- Only via trigger
);

CREATE POLICY "org_update_organizations" ON organizations
FOR UPDATE USING (
  id IN (SELECT get_user_org_ids())
  AND is_org_owner(id)
);

CREATE POLICY "org_delete_organizations" ON organizations
FOR DELETE USING (
  id IN (SELECT get_user_org_ids())
  AND is_org_owner(id)
);

-- ============================================
-- 17. ORG_MEMBERS (already fixed, but ensure consistency)
-- ============================================
DROP POLICY IF EXISTS "org_select_org_members" ON org_members;
DROP POLICY IF EXISTS "org_insert_org_members" ON org_members;
DROP POLICY IF EXISTS "org_update_org_members" ON org_members;
DROP POLICY IF EXISTS "org_delete_org_members" ON org_members;

CREATE POLICY "org_select_org_members" ON org_members
FOR SELECT USING (
  org_id IN (SELECT get_user_org_ids())
);

CREATE POLICY "org_insert_org_members" ON org_members
FOR INSERT WITH CHECK (
  auth.uid() IS NULL  -- Only via trigger
  OR (
    NOT EXISTS (SELECT 1 FROM org_members om WHERE om.org_id = org_members.org_id)
    AND org_members.user_id = auth.uid()
  )
  OR (
    org_id IN (SELECT get_user_org_ids())
    AND is_org_owner(org_id)
  )
);

CREATE POLICY "org_update_org_members" ON org_members
FOR UPDATE USING (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

CREATE POLICY "org_delete_org_members" ON org_members
FOR DELETE USING (
  org_id IN (SELECT get_user_org_ids())
  AND is_org_owner(org_id)
);

-- ============================================
-- VALIDATION
-- ============================================
DO $$
DECLARE
  policy_count INT;
  tables_with_policies INT;
  function_exists BOOLEAN;
  helper_exists BOOLEAN;
BEGIN
  -- Check functions exist
  SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_org_ids') INTO function_exists;
  SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_org_owner') INTO helper_exists;

  IF NOT function_exists THEN
    RAISE EXCEPTION 'FAILED: get_user_org_ids() function not found';
  END IF;

  IF NOT helper_exists THEN
    RAISE EXCEPTION 'FAILED: is_org_owner() function not found';
  END IF;

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE policyname LIKE 'org_%';

  -- Count tables with org policies
  SELECT COUNT(DISTINCT tablename) INTO tables_with_policies
  FROM pg_policies
  WHERE policyname LIKE 'org_%';

  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'COMPREHENSIVE RLS FIX APPLIED SUCCESSFULLY';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  - get_user_org_ids() [SECURITY DEFINER]';
  RAISE NOTICE '  - is_org_owner(org_id) [SECURITY DEFINER]';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies updated: % across % tables', policy_count, tables_with_policies;
  RAISE NOTICE '';
  RAISE NOTICE 'All policies now use get_user_org_ids() instead of';
  RAISE NOTICE 'direct subqueries, preventing nested RLS evaluation.';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected behavior:';
  RAISE NOTICE '  - property_owners: 200 OK (was 406)';
  RAISE NOTICE '  - tenants: 200 OK (was 406)';
  RAISE NOTICE '  - contracts: 200 OK';
  RAISE NOTICE '  - All other org tables: 200 OK';
  RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
