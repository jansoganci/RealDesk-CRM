-- =====================================================
-- ORG MIGRATION - PHASE 1.1: Create Organization Tables
-- =====================================================
--
-- This migration creates the foundation for multi-tenant architecture:
-- - organizations: Top-level tenant boundary (agencies)
-- - org_members: User membership with roles (owner/member)
--
-- SAFE TO RUN: Creates new tables only, does not modify existing data
-- ROLLBACK: DROP TABLE org_members; DROP TABLE organizations;
--
-- SECURITY AUDIT: 2025-12-31
-- - C1 FIX: Restricted org INSERT to SECURITY DEFINER trigger only
-- - M1 FIX: Added self-check to first member INSERT policy
--
-- =====================================================

-- ============================================
-- 1. Create organizations table
-- ============================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.organizations IS 'Top-level tenant - represents a real estate agency';
COMMENT ON COLUMN public.organizations.slug IS 'URL-friendly identifier, uses user UUID for auto-created orgs';

-- ============================================
-- 2. Create org_members table
-- ============================================
CREATE TABLE public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

COMMENT ON TABLE public.org_members IS 'User membership in organizations with role-based access';
COMMENT ON COLUMN public.org_members.role IS 'owner = full CRUD + invite, member = read-only';
COMMENT ON COLUMN public.org_members.status IS 'pending = invited, active = can access, suspended = blocked';

-- ============================================
-- 3. Create indexes for performance
-- ============================================
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_org_members_user_id ON public.org_members(user_id);
CREATE INDEX idx_org_members_org_id ON public.org_members(org_id);
CREATE INDEX idx_org_members_status ON public.org_members(status);
CREATE INDEX idx_org_members_user_status ON public.org_members(user_id, status);

-- SECURITY FIX L1: Add composite index for RLS subquery performance
CREATE INDEX idx_org_members_user_role_status ON public.org_members(user_id, role, status)
WHERE status = 'active';

-- ============================================
-- 4. Enable RLS on new tables
-- ============================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Add updated_at triggers (reuse existing function)
-- ============================================
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON public.org_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. RLS Policies for organizations table
-- ============================================

-- SELECT: Members can read their own org
CREATE POLICY "org_select_organizations" ON public.organizations
FOR SELECT USING (
  id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- SECURITY FIX C1: Restrict org INSERT to SECURITY DEFINER trigger only
-- Previously: WITH CHECK (true) - allowed any user to create unlimited orgs
-- Now: Only SECURITY DEFINER functions can insert (auth.uid() is NULL during trigger)
CREATE POLICY "org_insert_organizations" ON public.organizations
FOR INSERT WITH CHECK (
  -- Only allow via SECURITY DEFINER trigger (auth.uid() is NULL during trigger execution)
  auth.uid() IS NULL
);

-- UPDATE: Only owner can update org settings
CREATE POLICY "org_update_organizations" ON public.organizations
FOR UPDATE USING (
  id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- DELETE: Only owner can delete org (rare, usually soft delete)
CREATE POLICY "org_delete_organizations" ON public.organizations
FOR DELETE USING (
  id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- ============================================
-- 7. RLS Policies for org_members table
-- ============================================

-- SELECT: Members can see other members in their org
CREATE POLICY "org_select_org_members" ON public.org_members
FOR SELECT USING (
  org_id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- SECURITY FIX M1: Fix race condition in first member INSERT
-- Previously: Any user could claim to be first member of any org
-- Now: First member must be self (user_id = auth.uid()), OR owner inviting others
CREATE POLICY "org_insert_org_members" ON public.org_members
FOR INSERT WITH CHECK (
  -- Case 1: SECURITY DEFINER trigger creating first member (auth.uid() is NULL)
  auth.uid() IS NULL
  OR
  -- Case 2: First member must be adding themselves (prevents race condition)
  (
    NOT EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = org_members.org_id)
    AND org_members.user_id = auth.uid()
  )
  OR
  -- Case 3: Existing owner inviting new member
  org_id IN (
    SELECT om.org_id FROM public.org_members om
    WHERE om.user_id = auth.uid() AND om.status = 'active' AND om.role = 'owner'
  )
);

-- UPDATE: Owner can modify member status/role
CREATE POLICY "org_update_org_members" ON public.org_members
FOR UPDATE USING (
  org_id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- DELETE: Owner can remove members
CREATE POLICY "org_delete_org_members" ON public.org_members
FOR DELETE USING (
  org_id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- ============================================
-- 8. Validation
-- ============================================
DO $$
BEGIN
  -- Check tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    RAISE EXCEPTION 'organizations table not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'org_members') THEN
    RAISE EXCEPTION 'org_members table not created';
  END IF;

  RAISE NOTICE '✅ Phase 1.1 Complete: organizations and org_members tables created';
  RAISE NOTICE '   Security fixes applied: C1 (org INSERT), M1 (member INSERT race)';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
