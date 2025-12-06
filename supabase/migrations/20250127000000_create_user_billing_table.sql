/*
  Billing System Migration - Phase 1: User Billing Table

  This migration creates the billing infrastructure for Emlak CRM:
  1. Creates user_billing table to track subscriptions and trials
  2. Adds trigger to auto-create billing record with 14-day trial on user signup
  3. Creates RPC function to check if user has active access
  4. Sets up RLS policies for secure data access

  ⚠️ IMPORTANT: This is Phase 1 of the billing system.
  Future phases will add Stripe integration and webhook handlers.

  Rollback: See rollback script at end of file
*/

-- ============================================================================
-- STEP 1: CREATE user_billing TABLE
-- ============================================================================
CREATE TABLE public.user_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stripe Integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  
  -- Plan Information
  plan_id TEXT NOT NULL DEFAULT 'pro_monthly', -- 'pro_monthly' | 'pro_yearly'
  plan_name TEXT NOT NULL DEFAULT 'Pro Monthly',
  
  -- Billing Status
  billing_status TEXT NOT NULL DEFAULT 'trial', -- 'trial' | 'active' | 'canceled' | 'expired' | 'past_due'
  
  -- Trial Information
  trial_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  trial_used BOOLEAN DEFAULT false,
  
  -- Subscription Information
  subscription_start TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  
  -- Payment Information
  payment_method_type TEXT, -- 'card' | 'bank_account' | etc.
  last_payment_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.user_billing IS 'Tracks billing status, subscriptions, and trial periods for each user';
COMMENT ON COLUMN public.user_billing.user_id IS 'Foreign key to auth.users - one billing record per user';
COMMENT ON COLUMN public.user_billing.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN public.user_billing.stripe_subscription_id IS 'Stripe subscription ID for recurring billing';
COMMENT ON COLUMN public.user_billing.plan_id IS 'Current plan identifier: pro_monthly or pro_yearly';
COMMENT ON COLUMN public.user_billing.billing_status IS 'Current billing status: trial, active, canceled, expired, or past_due';
COMMENT ON COLUMN public.user_billing.trial_start IS 'When the 14-day free trial started';
COMMENT ON COLUMN public.user_billing.trial_end IS 'When the 14-day free trial ends';
COMMENT ON COLUMN public.user_billing.current_period_end IS 'When the current subscription period ends';

-- Log table creation
DO $$
BEGIN
  RAISE NOTICE '✅ user_billing table created';
END $$;


-- ============================================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_user_billing_user_id ON user_billing(user_id);
CREATE INDEX idx_user_billing_stripe_customer_id ON user_billing(stripe_customer_id);
CREATE INDEX idx_user_billing_stripe_subscription_id ON user_billing(stripe_subscription_id);
CREATE INDEX idx_user_billing_status ON user_billing(billing_status);
CREATE INDEX idx_user_billing_trial_end ON user_billing(trial_end);
CREATE INDEX idx_user_billing_period_end ON user_billing(current_period_end);

-- Log index creation
DO $$
BEGIN
  RAISE NOTICE '✅ 6 indexes created on user_billing table';
END $$;


-- ============================================================================
-- STEP 3: ENABLE RLS AND CREATE POLICIES
-- ============================================================================
ALTER TABLE user_billing ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own billing
CREATE POLICY "Users can view their own billing"
  ON user_billing FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own billing
-- (Mainly for cancel_at_period_end flag, other updates via webhook)
CREATE POLICY "Users can update their own billing"
  ON user_billing FOR UPDATE
  USING (auth.uid() = user_id);

-- Note: INSERT is handled by trigger/webhook, not directly by users
-- Webhook handler will use SECURITY DEFINER function to insert/update

-- Log RLS setup
DO $$
BEGIN
  RAISE NOTICE '✅ RLS enabled with SELECT and UPDATE policies';
END $$;


-- ============================================================================
-- STEP 4: CREATE TRIGGER FUNCTION FOR AUTO-SIGNUP
-- ============================================================================
-- Function to auto-create billing record when user signs up
CREATE OR REPLACE FUNCTION create_user_billing_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_billing (user_id, trial_start, trial_end)
  VALUES (
    NEW.id,
    NOW(),
    NOW() + INTERVAL '14 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION create_user_billing_on_signup() IS
'Automatically creates a user_billing record with 14-day trial when a new user signs up.
Triggered by INSERT on auth.users table.';

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_create_user_billing ON auth.users;

-- Create trigger that fires AFTER INSERT on auth.users
CREATE TRIGGER trigger_create_user_billing
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_billing_on_signup();

-- Log trigger creation
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger created: trigger_create_user_billing on auth.users';
END $$;


-- ============================================================================
-- STEP 5: CREATE RPC FUNCTION FOR ACCESS CHECK
-- ============================================================================
-- Function to check if user has active access (trial or subscription)
CREATE OR REPLACE FUNCTION user_has_active_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  billing_record RECORD;
BEGIN
  SELECT * INTO billing_record
  FROM user_billing
  WHERE user_id = user_uuid;
  
  IF billing_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if trial is still active
  IF billing_record.billing_status = 'trial' AND billing_record.trial_end > NOW() THEN
    RETURN true;
  END IF;
  
  -- Check if subscription is active
  IF billing_record.billing_status = 'active' AND billing_record.current_period_end > NOW() THEN
    RETURN true;
  END IF;
  
  -- Check if canceled but still in period
  IF billing_record.billing_status = 'canceled' 
     AND billing_record.current_period_end > NOW() 
     AND billing_record.cancel_at_period_end = true THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION user_has_active_access(UUID) IS
'Checks if a user has active access based on trial period or subscription status.
Returns true if:
  - User is in trial and trial_end has not passed, OR
  - User has active subscription and current_period_end has not passed, OR
  - User canceled subscription but still has access until period_end.
Returns false otherwise.';

-- Log function creation
DO $$
BEGIN
  RAISE NOTICE '✅ RPC function created: user_has_active_access(UUID)';
END $$;


-- ============================================================================
-- STEP 6: VALIDATION CHECKS
-- ============================================================================
-- Verify table exists and has correct structure
DO $$
DECLARE
  table_exists BOOLEAN;
  column_count INTEGER;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_billing'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION 'Validation failed: user_billing table does not exist';
  END IF;
  
  -- Check column count (should be 20 columns)
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'user_billing';
  
  IF column_count < 20 THEN
    RAISE EXCEPTION 'Validation failed: user_billing table has incorrect number of columns (%)', column_count;
  END IF;
  
  -- Check if trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_create_user_billing'
  ) THEN
    RAISE EXCEPTION 'Validation failed: trigger_create_user_billing does not exist';
  END IF;
  
  -- Check if function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'user_has_active_access'
  ) THEN
    RAISE EXCEPTION 'Validation failed: user_has_active_access function does not exist';
  END IF;
  
  RAISE NOTICE '✅ Validation passed: All components created successfully';
END $$;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ BILLING MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - user_billing table created';
  RAISE NOTICE '  - 6 indexes created';
  RAISE NOTICE '  - RLS policies enabled (SELECT, UPDATE)';
  RAISE NOTICE '  - Auto-signup trigger created';
  RAISE NOTICE '  - Access check RPC function created';
  RAISE NOTICE '';
  RAISE NOTICE '📋 NEXT STEPS:';
  RAISE NOTICE '  1. Verify migration success in logs';
  RAISE NOTICE '  2. Test trigger by creating a new user';
  RAISE NOTICE '  3. Test RPC: SELECT user_has_active_access(user_id)';
  RAISE NOTICE '  4. Proceed with Phase 2: Stripe integration';
  RAISE NOTICE '========================================';
END $$;


-- ============================================================================
-- ROLLBACK SCRIPT (Use only if migration fails)
-- ============================================================================
-- ⚠️ DANGER: This will remove all billing infrastructure
-- Only run if you need to completely revert this migration

/*
-- Drop trigger
DROP TRIGGER IF EXISTS trigger_create_user_billing ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS create_user_billing_on_signup();
DROP FUNCTION IF EXISTS user_has_active_access(UUID);

-- Drop policies
DROP POLICY IF EXISTS "Users can view their own billing" ON user_billing;
DROP POLICY IF EXISTS "Users can update their own billing" ON user_billing;

-- Disable RLS
ALTER TABLE user_billing DISABLE ROW LEVEL SECURITY;

-- Drop indexes
DROP INDEX IF EXISTS idx_user_billing_user_id;
DROP INDEX IF EXISTS idx_user_billing_stripe_customer_id;
DROP INDEX IF EXISTS idx_user_billing_stripe_subscription_id;
DROP INDEX IF EXISTS idx_user_billing_status;
DROP INDEX IF EXISTS idx_user_billing_trial_end;
DROP INDEX IF EXISTS idx_user_billing_period_end;

-- Drop table
DROP TABLE IF EXISTS user_billing;

-- Log rollback
DO $$
BEGIN
  RAISE NOTICE '❌ Billing migration rolled back. All billing infrastructure removed.';
END $$;
*/

