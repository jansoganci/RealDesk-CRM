-- Migration: Create RPC function for first-time organization creation
-- Purpose: Allow new users to create their first organization during onboarding
-- Security: Only allows creation if user has no existing org membership

-- Function to create a user's first organization
CREATE OR REPLACE FUNCTION public.create_first_organization(
  p_org_name text DEFAULT 'My Organization'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_slug text;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already has an active organization
  IF EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = v_user_id
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'User already has an organization';
  END IF;

  -- Validate org name
  IF p_org_name IS NULL OR trim(p_org_name) = '' THEN
    p_org_name := 'My Organization';
  END IF;

  IF length(trim(p_org_name)) < 2 THEN
    RAISE EXCEPTION 'Organization name must be at least 2 characters';
  END IF;

  IF length(p_org_name) > 255 THEN
    RAISE EXCEPTION 'Organization name must not exceed 255 characters';
  END IF;

  -- Generate slug from user ID (ensures uniqueness)
  v_slug := v_user_id::text;

  -- Create organization
  INSERT INTO organizations (
    name,
    slug,
    onboarding_completed,
    onboarding_step,
    created_at,
    updated_at
  )
  VALUES (
    trim(p_org_name),
    v_slug,
    false,
    0,
    now(),
    now()
  )
  RETURNING id INTO v_org_id;

  -- Add user as owner
  INSERT INTO org_members (
    org_id,
    user_id,
    role,
    status,
    invited_by,
    invited_at,
    joined_at,
    created_at,
    updated_at
  )
  VALUES (
    v_org_id,
    v_user_id,
    'owner',
    'active',
    NULL, -- Self-created, no inviter
    now(),
    now(),
    now(),
    now()
  );

  -- Ensure user has a trial billing record
  -- This is safe to call even if user already has billing
  IF NOT EXISTS (
    SELECT 1 FROM user_billing WHERE user_id = v_user_id
  ) THEN
    INSERT INTO user_billing (
      user_id,
      billing_status,
      trial_start,
      trial_end,
      trial_used,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      'trial',
      NOW(),
      NOW() + INTERVAL '14 days',
      false,
      NOW(),
      NOW()
    );
  END IF;

  RETURN v_org_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_first_organization(text) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_first_organization IS 
  'Creates a user''s first organization during onboarding. Only works if user has no existing org membership.';
