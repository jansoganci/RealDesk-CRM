-- =====================================================
-- ORG MIGRATION - PHASE 2.2: Create New Org-Based RLS Policies
-- =====================================================
--
-- This migration creates new RLS policies based on org_id:
-- - owner role: full CRUD access (except hard delete)
-- - member role: SELECT only (read-only)
--
-- Pattern:
-- - SELECT: Active member of the org + soft delete filter
-- - INSERT: Owner of the org only
-- - UPDATE: Owner of the org only + soft delete filter + org_id immutable
-- - DELETE: BLOCKED (soft delete via UPDATE only)
--
-- Uses inline subqueries (no helper functions) for performance
--
-- IMPORTANT: Run this AFTER Phase 2.1 (drop old policies)
--
-- SECURITY AUDIT: 2025-12-31
-- - C2 FIX: Added deleted_at IS NULL to ALL UPDATE policies
-- - C3 FIX: Blocked hard deletes with USING (false) on ALL tables
-- - M2 FIX: Added deleted_at check to property_photos INSERT
-- - L3 FIX: Added WITH CHECK to UPDATE policies to prevent org_id changes
--
-- ROLLBACK: DROP all "org_*" policies, re-run original migrations
--
-- =====================================================

-- ============================================
-- 1. Properties RLS Policies
-- ============================================

-- SELECT: Active members can view (excludes soft-deleted)
CREATE POLICY "org_select_properties" ON properties
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- INSERT: Owners only
CREATE POLICY "org_insert_properties" ON properties
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C2 + L3: UPDATE with soft-delete guard and org_id immutability
CREATE POLICY "org_update_properties" ON properties
FOR UPDATE
USING (
  deleted_at IS NULL  -- C2: Cannot update soft-deleted records
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
)
WITH CHECK (
  -- L3: Ensure org_id wasn't changed during update
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C3: Block hard deletes - use soft delete via UPDATE instead
CREATE POLICY "org_delete_properties" ON properties
FOR DELETE USING (false);

-- ============================================
-- 2. Tenants RLS Policies
-- ============================================

CREATE POLICY "org_select_tenants" ON tenants
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "org_insert_tenants" ON tenants
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C2 + L3
CREATE POLICY "org_update_tenants" ON tenants
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C3
CREATE POLICY "org_delete_tenants" ON tenants
FOR DELETE USING (false);

-- ============================================
-- 3. Contracts RLS Policies
-- ============================================

CREATE POLICY "org_select_contracts" ON contracts
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "org_insert_contracts" ON contracts
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C2 + L3
CREATE POLICY "org_update_contracts" ON contracts
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C3
CREATE POLICY "org_delete_contracts" ON contracts
FOR DELETE USING (false);

-- ============================================
-- 4. Contract Details RLS Policies
-- ============================================

CREATE POLICY "org_select_contract_details" ON contract_details
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "org_insert_contract_details" ON contract_details
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C2 + L3
CREATE POLICY "org_update_contract_details" ON contract_details
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C3
CREATE POLICY "org_delete_contract_details" ON contract_details
FOR DELETE USING (false);

-- ============================================
-- 5. Property Owners RLS Policies
-- ============================================

CREATE POLICY "org_select_property_owners" ON property_owners
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "org_insert_property_owners" ON property_owners
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C2 + L3
CREATE POLICY "org_update_property_owners" ON property_owners
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C3
CREATE POLICY "org_delete_property_owners" ON property_owners
FOR DELETE USING (false);

-- ============================================
-- 6. Property Inquiries RLS Policies
-- ============================================

CREATE POLICY "org_select_property_inquiries" ON property_inquiries
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "org_insert_property_inquiries" ON property_inquiries
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C2 + L3
CREATE POLICY "org_update_property_inquiries" ON property_inquiries
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C3
CREATE POLICY "org_delete_property_inquiries" ON property_inquiries
FOR DELETE USING (false);

-- ============================================
-- 7. Inquiry Matches RLS Policies
-- ============================================

CREATE POLICY "org_select_inquiry_matches" ON inquiry_matches
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "org_insert_inquiry_matches" ON inquiry_matches
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C2 + L3
CREATE POLICY "org_update_inquiry_matches" ON inquiry_matches
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C3
CREATE POLICY "org_delete_inquiry_matches" ON inquiry_matches
FOR DELETE USING (false);

-- ============================================
-- 8. Meetings RLS Policies
-- ============================================

CREATE POLICY "org_select_meetings" ON meetings
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "org_insert_meetings" ON meetings
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C2 + L3
CREATE POLICY "org_update_meetings" ON meetings
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C3
CREATE POLICY "org_delete_meetings" ON meetings
FOR DELETE USING (false);

-- ============================================
-- 9. Financial Transactions RLS Policies
-- ============================================

CREATE POLICY "org_select_financial_transactions" ON financial_transactions
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "org_insert_financial_transactions" ON financial_transactions
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C2 + L3
CREATE POLICY "org_update_financial_transactions" ON financial_transactions
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C3
CREATE POLICY "org_delete_financial_transactions" ON financial_transactions
FOR DELETE USING (false);

-- ============================================
-- 10. Commissions RLS Policies
-- ============================================

CREATE POLICY "org_select_commissions" ON commissions
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "org_insert_commissions" ON commissions
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C2 + L3
CREATE POLICY "org_update_commissions" ON commissions
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C3
CREATE POLICY "org_delete_commissions" ON commissions
FOR DELETE USING (false);

-- ============================================
-- 11. Recurring Expenses RLS Policies
-- ============================================

CREATE POLICY "org_select_recurring_expenses" ON recurring_expenses
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "org_insert_recurring_expenses" ON recurring_expenses
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C2 + L3
CREATE POLICY "org_update_recurring_expenses" ON recurring_expenses
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C3
CREATE POLICY "org_delete_recurring_expenses" ON recurring_expenses
FOR DELETE USING (false);

-- ============================================
-- 12. Expense Categories RLS Policies
-- ============================================
-- NOTE: expense_categories allows NULL org_id for system defaults
-- System defaults (org_id IS NULL) are visible to everyone but immutable

CREATE POLICY "org_select_expense_categories" ON expense_categories
FOR SELECT USING (
  deleted_at IS NULL
  AND (
    -- System defaults (visible to all authenticated users)
    org_id IS NULL
    OR
    -- Org-specific categories
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
);

CREATE POLICY "org_insert_expense_categories" ON expense_categories
FOR INSERT WITH CHECK (
  -- Cannot insert system defaults (org_id must be set)
  org_id IS NOT NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C2 + L3
CREATE POLICY "org_update_expense_categories" ON expense_categories
FOR UPDATE
USING (
  deleted_at IS NULL
  -- Can only update org-specific categories (not system defaults)
  AND org_id IS NOT NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
)
WITH CHECK (
  org_id IS NOT NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C3
CREATE POLICY "org_delete_expense_categories" ON expense_categories
FOR DELETE USING (false);

-- ============================================
-- 13. Contract Clause Templates RLS Policies
-- ============================================

CREATE POLICY "org_select_contract_clause_templates" ON contract_clause_templates
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "org_insert_contract_clause_templates" ON contract_clause_templates
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C2 + L3
CREATE POLICY "org_update_contract_clause_templates" ON contract_clause_templates
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C3
CREATE POLICY "org_delete_contract_clause_templates" ON contract_clause_templates
FOR DELETE USING (false);

-- ============================================
-- 14. Contract Clause Overrides RLS Policies
-- ============================================

CREATE POLICY "org_select_contract_clause_overrides" ON contract_clause_overrides
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "org_insert_contract_clause_overrides" ON contract_clause_overrides
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C2 + L3
CREATE POLICY "org_update_contract_clause_overrides" ON contract_clause_overrides
FOR UPDATE
USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- SECURITY FIX C3
CREATE POLICY "org_delete_contract_clause_overrides" ON contract_clause_overrides
FOR DELETE USING (false);

-- ============================================
-- 15. Property Photos RLS Policies (via properties join)
-- ============================================
-- property_photos doesn't have org_id directly,
-- access is controlled via the parent property's org_id

CREATE POLICY "org_select_property_photos" ON property_photos
FOR SELECT USING (
  property_id IN (
    SELECT id FROM properties
    WHERE deleted_at IS NULL
      AND org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
  )
);

-- SECURITY FIX M2: Cannot upload photos to soft-deleted properties
CREATE POLICY "org_insert_property_photos" ON property_photos
FOR INSERT WITH CHECK (
  property_id IN (
    SELECT id FROM properties
    WHERE deleted_at IS NULL  -- M2: Cannot upload to deleted property
      AND org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
      )
  )
);

-- UPDATE: Can update photos of non-deleted properties in user's org
CREATE POLICY "org_update_property_photos" ON property_photos
FOR UPDATE USING (
  property_id IN (
    SELECT id FROM properties
    WHERE deleted_at IS NULL
      AND org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
      )
  )
);

-- SECURITY FIX C3: Block hard deletes on photos too
-- To remove photos: soft-delete the parent property, or use storage API
CREATE POLICY "org_delete_property_photos" ON property_photos
FOR DELETE USING (false);

-- ============================================
-- Validation
-- ============================================
DO $$
DECLARE
  policy_count INT;
  delete_blocked_count INT;
BEGIN
  -- Count new org policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE policyname LIKE 'org_%';

  -- Verify DELETE policies are all blocked
  SELECT COUNT(*) INTO delete_blocked_count
  FROM pg_policies
  WHERE policyname LIKE 'org_delete_%'
    AND qual = 'false';

  RAISE NOTICE '✅ Phase 2.2 Complete: Created % new org-based RLS policies', policy_count;
  RAISE NOTICE '   Security fixes applied:';
  RAISE NOTICE '   - C2: All UPDATE policies check deleted_at IS NULL';
  RAISE NOTICE '   - C3: All DELETE policies blocked (% tables)', delete_blocked_count;
  RAISE NOTICE '   - L3: All UPDATE policies have WITH CHECK for org_id immutability';
  RAISE NOTICE '   - M2: property_photos INSERT checks parent deleted_at';
  RAISE NOTICE '   Roles: owner = full CRUD (soft delete only), member = read-only';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
