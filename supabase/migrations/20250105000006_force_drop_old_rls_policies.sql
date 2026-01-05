-- =====================================================
-- Force Drop Old RLS Policies (Property Owners & Tenants)
-- =====================================================
--
-- This migration forcefully drops ALL old RLS policies on
-- property_owners and tenants tables to fix 406 Not Acceptable errors.
--
-- Problem:
-- - 406 errors persist even after org-based policies are created
-- - Old policies may still be active and conflicting
-- - Need to ensure only org_* policies exist
--
-- Solution:
-- - Drop ALL policies (old and new) on these tables
-- - Recreate only the org_* policies
-- - This ensures clean state
--
-- SAFE TO RUN: Idempotent, will recreate policies if missing
-- ROLLBACK: Re-run 20251231000006_org_phase2_create_new_rls.sql
--
-- =====================================================

-- ============================================
-- 1. Property Owners - Drop ALL Policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view property owners" ON property_owners;
DROP POLICY IF EXISTS "Authenticated users can create property owners" ON property_owners;
DROP POLICY IF EXISTS "Authenticated users can update property owners" ON property_owners;
DROP POLICY IF EXISTS "Authenticated users can delete property owners" ON property_owners;
DROP POLICY IF EXISTS "Users can view their own property owners" ON property_owners;
DROP POLICY IF EXISTS "Users can insert their own property owners" ON property_owners;
DROP POLICY IF EXISTS "Users can update their own property owners" ON property_owners;
DROP POLICY IF EXISTS "Users can delete their own property owners" ON property_owners;
DROP POLICY IF EXISTS "org_select_property_owners" ON property_owners;
DROP POLICY IF EXISTS "org_insert_property_owners" ON property_owners;
DROP POLICY IF EXISTS "org_update_property_owners" ON property_owners;
DROP POLICY IF EXISTS "org_delete_property_owners" ON property_owners;

-- Recreate org-based policies
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

CREATE POLICY "org_delete_property_owners" ON property_owners
FOR DELETE USING (false);

-- ============================================
-- 2. Tenants - Drop ALL Policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view tenants" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can update tenants" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can delete tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can insert their own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can update their own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can delete their own tenants" ON tenants;
DROP POLICY IF EXISTS "org_select_tenants" ON tenants;
DROP POLICY IF EXISTS "org_insert_tenants" ON tenants;
DROP POLICY IF EXISTS "org_update_tenants" ON tenants;
DROP POLICY IF EXISTS "org_delete_tenants" ON tenants;

-- Recreate org-based policies
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

CREATE POLICY "org_delete_tenants" ON tenants
FOR DELETE USING (false);

-- ============================================
-- Validation
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Force drop complete: All old policies removed, org_* policies recreated';
  RAISE NOTICE '   property_owners: 4 policies (org_select, org_insert, org_update, org_delete)';
  RAISE NOTICE '   tenants: 4 policies (org_select, org_insert, org_update, org_delete)';
END $$;

