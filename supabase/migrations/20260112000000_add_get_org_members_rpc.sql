-- =====================================================
-- Add RPC for Getting Organization Members with User Data
-- =====================================================
--
-- Problem: PostgREST cannot join public.org_members with auth.users
--          because they are in different schemas.
--
-- Solution: Create a SECURITY DEFINER function that can access
--           auth.users and return member data with user details.
--
-- =====================================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_org_members_with_users(UUID);

-- Create RPC to get org members with user data
CREATE OR REPLACE FUNCTION get_org_members_with_users(p_org_id UUID)
RETURNS TABLE (
  id UUID,
  org_id UUID,
  user_id UUID,
  role TEXT,
  status TEXT,
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_email TEXT,
  user_full_name TEXT,
  user_avatar_url TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT
    om.id,
    om.org_id,
    om.user_id,
    om.role,
    om.status,
    om.invited_by,
    om.invited_at,
    om.joined_at,
    om.created_at,
    om.updated_at,
    u.email AS user_email,
    u.raw_user_meta_data->>'full_name' AS user_full_name,
    u.raw_user_meta_data->>'avatar_url' AS user_avatar_url
  FROM org_members om
  LEFT JOIN auth.users u ON om.user_id = u.id
  WHERE om.org_id = p_org_id
    AND om.org_id IN (SELECT get_user_org_ids())  -- RLS check
  ORDER BY om.joined_at ASC;
$$;

COMMENT ON FUNCTION get_org_members_with_users(UUID) IS
  'Returns organization members with user details (email, name, avatar). SECURITY DEFINER to access auth.users.';

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION get_org_members_with_users(UUID) TO authenticated;

-- Revoke from public/anon for security
REVOKE EXECUTE ON FUNCTION get_org_members_with_users(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION get_org_members_with_users(UUID) FROM public;

-- =====================================================
-- Validation
-- =====================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_org_members_with_users'
  ) THEN
    RAISE NOTICE '✅ RPC get_org_members_with_users created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create get_org_members_with_users function';
  END IF;
END $$;
