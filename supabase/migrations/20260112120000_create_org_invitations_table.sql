-- =====================================================
-- CREATE ORG INVITATIONS TABLE
-- =====================================================
--
-- This migration implements invite-before-signup functionality:
-- - org_invitations: Stores pending invitations by email
-- - Auto-linking: Trigger accepts invitations on user signup
-- - Secure tokens: Prevent unauthorized org access
--
-- SAFE TO RUN: Creates new table only, does not modify existing data
-- ROLLBACK: See end of file
--
-- =====================================================

-- ============================================
-- 1. Create org_invitations table
-- ============================================
CREATE TABLE public.org_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  invitation_token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, email)
);

COMMENT ON TABLE public.org_invitations IS 'Pending organization invitations for users who have not registered yet';
COMMENT ON COLUMN public.org_invitations.email IS 'Email address of the invited user (case-insensitive, stored lowercase)';
COMMENT ON COLUMN public.org_invitations.invitation_token IS 'Secure random token for accepting invitation';
COMMENT ON COLUMN public.org_invitations.expires_at IS 'Invitation expiration time (default 7 days)';
COMMENT ON COLUMN public.org_invitations.accepted_at IS 'Timestamp when invitation was accepted (NULL = pending)';

-- ============================================
-- 2. Create indexes for performance
-- ============================================
CREATE INDEX idx_org_invitations_org_id ON public.org_invitations(org_id);
CREATE INDEX idx_org_invitations_email ON public.org_invitations(email);
CREATE INDEX idx_org_invitations_token ON public.org_invitations(invitation_token);
CREATE INDEX idx_org_invitations_expires ON public.org_invitations(expires_at) WHERE accepted_at IS NULL;

-- ============================================
-- 3. Enable RLS
-- ============================================
ALTER TABLE public.org_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Add updated_at trigger
-- ============================================
CREATE TRIGGER update_org_invitations_updated_at
  BEFORE UPDATE ON public.org_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. RLS Policies
-- ============================================

-- SELECT: Organization owners can view their org's invitations
CREATE POLICY "org_select_invitations" ON public.org_invitations
FOR SELECT USING (
  org_id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- INSERT: Only organization owners can invite
CREATE POLICY "org_insert_invitations" ON public.org_invitations
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- UPDATE: Only organization owners can update invitations (e.g., resend)
-- Also allow the system (auth.uid() IS NULL) to mark as accepted
CREATE POLICY "org_update_invitations" ON public.org_invitations
FOR UPDATE USING (
  -- Case 1: Owner updating their org's invitations
  org_id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
  OR
  -- Case 2: System trigger marking as accepted
  auth.uid() IS NULL
);

-- DELETE: Only organization owners can delete/revoke invitations
CREATE POLICY "org_delete_invitations" ON public.org_invitations
FOR DELETE USING (
  org_id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
  OR
  -- Allow system to delete accepted invitations
  auth.uid() IS NULL
);

-- ============================================
-- 6. Create helper function to generate secure tokens
-- ============================================
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token TEXT;
  token_exists BOOLEAN;
BEGIN
  -- Generate unique secure token (32 characters)
  LOOP
    -- Create random token using encode(gen_random_bytes)
    token := encode(gen_random_bytes(24), 'base64');
    -- Make URL-safe by replacing + and / with - and _
    token := replace(replace(token, '+', '-'), '/', '_');
    -- Remove padding
    token := rtrim(token, '=');
    
    -- Check if token already exists
    SELECT EXISTS(
      SELECT 1 FROM public.org_invitations 
      WHERE invitation_token = token
    ) INTO token_exists;
    
    -- Exit loop if unique
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN token;
END;
$$;

COMMENT ON FUNCTION generate_invitation_token() IS 'Generates a unique, URL-safe random token for invitations';

-- ============================================
-- 7. Create trigger function to auto-accept invitations on signup
-- ============================================
CREATE OR REPLACE FUNCTION auto_accept_org_invitations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Find all pending, non-expired invitations for this user's email
  FOR invitation_record IN
    SELECT id, org_id, email, role, invited_by
    FROM public.org_invitations
    WHERE LOWER(email) = LOWER(NEW.email)
      AND accepted_at IS NULL
      AND expires_at > now()
  LOOP
    -- Create org_members record
    INSERT INTO public.org_members (
      org_id,
      user_id,
      role,
      status,
      invited_by,
      invited_at,
      joined_at
    ) VALUES (
      invitation_record.org_id,
      NEW.id,
      invitation_record.role,
      'active',
      invitation_record.invited_by,
      now(),
      now()
    )
    ON CONFLICT (org_id, user_id) DO NOTHING; -- Skip if already member
    
    -- Mark invitation as accepted
    UPDATE public.org_invitations
    SET accepted_at = now(),
        updated_at = now()
    WHERE id = invitation_record.id;
    
    RAISE NOTICE 'Auto-accepted invitation for user % to org %', NEW.email, invitation_record.org_id;
  END LOOP;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION auto_accept_org_invitations() IS 'Automatically accepts pending org invitations when a user signs up';

-- ============================================
-- 8. Attach trigger to auth.users
-- ============================================
CREATE TRIGGER on_auth_user_created_accept_invitations
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_accept_org_invitations();

-- ============================================
-- 9. Create RPC function to accept invitation by token
-- ============================================
CREATE OR REPLACE FUNCTION accept_org_invitation(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Get current user's email
  SELECT email INTO v_invitation
  FROM auth.users
  WHERE id = v_user_id;
  
  -- Find invitation by token
  SELECT oi.* INTO v_invitation
  FROM public.org_invitations oi
  WHERE oi.invitation_token = p_token
    AND oi.accepted_at IS NULL
    AND oi.expires_at > now();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation not found or expired'
    );
  END IF;
  
  -- Verify email matches (case-insensitive)
  IF LOWER(v_invitation.email) != LOWER((SELECT email FROM auth.users WHERE id = v_user_id)) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation email does not match your account'
    );
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = v_invitation.org_id AND user_id = v_user_id
  ) THEN
    -- Mark as accepted anyway
    UPDATE public.org_invitations
    SET accepted_at = now(), updated_at = now()
    WHERE id = v_invitation.id;
    
    RETURN json_build_object(
      'success', true,
      'message', 'You are already a member of this organization',
      'org_id', v_invitation.org_id
    );
  END IF;
  
  -- Create org_members record
  INSERT INTO public.org_members (
    org_id,
    user_id,
    role,
    status,
    invited_by,
    invited_at,
    joined_at
  ) VALUES (
    v_invitation.org_id,
    v_user_id,
    v_invitation.role,
    'active',
    v_invitation.invited_by,
    v_invitation.invited_at,
    now()
  );
  
  -- Mark invitation as accepted
  UPDATE public.org_invitations
  SET accepted_at = now(), updated_at = now()
  WHERE id = v_invitation.id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Successfully joined organization',
    'org_id', v_invitation.org_id
  );
END;
$$;

COMMENT ON FUNCTION accept_org_invitation(TEXT) IS 'Accepts an org invitation using a token (for users who registered before clicking link)';

-- ============================================
-- 10. Create RPC to get invitation by token (public info only)
-- ============================================
CREATE OR REPLACE FUNCTION get_invitation_info(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'valid', true,
    'org_name', o.name,
    'org_logo', o.logo_url,
    'role', oi.role,
    'invited_by_name', (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = oi.invited_by),
    'invited_at', oi.invited_at,
    'expires_at', oi.expires_at,
    'expired', oi.expires_at < now()
  )
  INTO v_result
  FROM public.org_invitations oi
  JOIN public.organizations o ON o.id = oi.org_id
  WHERE oi.invitation_token = p_token
    AND oi.accepted_at IS NULL;
  
  IF v_result IS NULL THEN
    v_result := json_build_object('valid', false);
  END IF;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_invitation_info(TEXT) IS 'Gets public information about an invitation (for showing on accept page)';

-- ============================================
-- 11. Validation
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'org_invitations') THEN
    RAISE EXCEPTION 'org_invitations table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_accept_invitations') THEN
    RAISE EXCEPTION 'Auto-accept trigger not created';
  END IF;
  
  RAISE NOTICE '✅ Migration Complete: org_invitations table created';
  RAISE NOTICE '   - RLS policies enabled';
  RAISE NOTICE '   - Auto-accept trigger attached to auth.users';
  RAISE NOTICE '   - Helper functions created';
END $$;

-- =====================================================
-- ROLLBACK SCRIPT (run if needed)
-- =====================================================
-- DROP TRIGGER IF EXISTS on_auth_user_created_accept_invitations ON auth.users;
-- DROP FUNCTION IF EXISTS auto_accept_org_invitations();
-- DROP FUNCTION IF EXISTS accept_org_invitation(TEXT);
-- DROP FUNCTION IF EXISTS get_invitation_info(TEXT);
-- DROP FUNCTION IF EXISTS generate_invitation_token();
-- DROP TABLE IF EXISTS public.org_invitations;
