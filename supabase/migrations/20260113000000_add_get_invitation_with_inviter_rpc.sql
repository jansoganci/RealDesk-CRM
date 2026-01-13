-- =====================================================
-- Add RPC for Getting Invitation with Inviter Data
-- =====================================================
--
-- Problem: PostgREST cannot join public.org_invitations with auth.users
--          because they are in different schemas (PGRST100 error).
--
-- Solution: Create a SECURITY DEFINER function that can access
--           auth.users and return invitation data with inviter details.
--
-- This follows the same pattern as get_org_members_with_users.
--
-- =====================================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_invitation_with_inviter(UUID);

-- Create RPC to get invitation with inviter data
CREATE OR REPLACE FUNCTION get_invitation_with_inviter(p_invitation_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'invitation', json_build_object(
      'id', oi.id,
      'email', oi.email,
      'role', oi.role,
      'invitation_token', oi.invitation_token,
      'expires_at', oi.expires_at,
      'org_id', oi.org_id,
      'invited_by', oi.invited_by,
      'invited_at', oi.invited_at,
      'accepted_at', oi.accepted_at
    ),
    'organization', json_build_object(
      'id', o.id,
      'name', o.name,
      'logo_url', o.logo_url
    ),
    'inviter', CASE
      WHEN oi.invited_by IS NULL THEN NULL
      ELSE json_build_object(
        'id', u.id,
        'email', u.email,
        'full_name', u.raw_user_meta_data->>'full_name'
      )
    END
  )
  INTO v_result
  FROM org_invitations oi
  JOIN organizations o ON o.id = oi.org_id
  LEFT JOIN auth.users u ON u.id = oi.invited_by
  WHERE oi.id = p_invitation_id;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_invitation_with_inviter(UUID) IS
  'Returns invitation with organization and inviter details. SECURITY DEFINER to access auth.users. Used by Edge Functions for sending invitation emails.';

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION get_invitation_with_inviter(UUID) TO authenticated;

-- Revoke from public/anon for security
REVOKE EXECUTE ON FUNCTION get_invitation_with_inviter(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION get_invitation_with_inviter(UUID) FROM public;

-- =====================================================
-- Validation
-- =====================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_invitation_with_inviter'
  ) THEN
    RAISE NOTICE '✅ RPC get_invitation_with_inviter created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create get_invitation_with_inviter function';
  END IF;
END $$;
