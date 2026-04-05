-- Migration: Helper function to ensure user has trial billing record
-- Purpose: Create user_billing record with 14-day trial if it doesn't exist
-- Called from application code when needed

-- Function to ensure user has a billing record with trial
CREATE OR REPLACE FUNCTION public.ensure_user_trial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already has a billing record
  IF EXISTS (
    SELECT 1 FROM user_billing
    WHERE user_id = v_user_id
  ) THEN
    -- User already has billing record, nothing to do
    RETURN;
  END IF;

  -- Create billing record with 14-day trial
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
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_user_trial() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.ensure_user_trial IS 
  'Creates user_billing record with 14-day trial if user does not have one. Safe to call multiple times.';
