-- =====================================================
-- Add RPC for User Lookup by Email
-- =====================================================
--
-- Purpose: Allow organization owners to find users by email
--          when inviting team members.
--
-- Security:
-- - SECURITY DEFINER runs with function owner privileges
-- - Only returns user ID, not sensitive data
-- - Only accessible to authenticated users
--
-- =====================================================

-- Create RPC to lookup user by email
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input TEXT)
RETURNS TABLE (id UUID, email TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT id, email
  FROM auth.users
  WHERE LOWER(email) = LOWER(email_input)
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_user_id_by_email(TEXT) IS
  'Lookup user by email for team member invitations. Returns user ID and email if found.';

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO authenticated;

-- Revoke from public/anon for security
REVOKE EXECUTE ON FUNCTION get_user_id_by_email(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION get_user_id_by_email(TEXT) FROM public;

-- =====================================================
-- Validation
-- =====================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_user_id_by_email'
  ) THEN
    RAISE NOTICE '✅ RPC get_user_id_by_email created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create get_user_id_by_email function';
  END IF;
END $$;
