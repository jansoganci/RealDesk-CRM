-- Stripe Billing Tables Migration
-- Created: 2025-12-12
-- Purpose: Add subscription management tables for Stripe integration

-- =============================================================================
-- TABLE: stripe_customers
-- Purpose: Track Stripe customer mapping separate from subscriptions
-- =============================================================================

CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT stripe_customers_user_id_key UNIQUE(user_id)
);

-- Indexes for stripe_customers
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_customer_id ON stripe_customers(stripe_customer_id);

-- =============================================================================
-- TABLE: subscriptions
-- Purpose: Store active and historical Stripe subscription data
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_product_id TEXT NOT NULL,        -- For feature checks
  stripe_price_id TEXT NOT NULL,          -- For display/analytics

  -- Subscription details
  status TEXT NOT NULL,                    -- active, canceled, past_due, trialing, etc.
  currency TEXT NOT NULL,                  -- try, usd
  interval TEXT NOT NULL,                  -- monthly, yearly
  amount INTEGER NOT NULL,                 -- Amount in smallest unit (kuruş/cents)

  -- Timestamps
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT subscriptions_user_id_key UNIQUE(user_id)  -- One subscription per user
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_product_id ON subscriptions(stripe_product_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS on stripe_customers
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Users can view their own customer record
CREATE POLICY "Users can view own customer record"
ON stripe_customers FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage all customer records (for webhooks)
-- No explicit policy needed - service role bypasses RLS

-- Enable RLS on subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for webhooks)
-- No explicit policy needed - service role bypasses RLS

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function: Check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = check_user_id
    AND status IN ('active', 'trialing')
    AND current_period_end > NOW()
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION has_active_subscription(UUID) TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE stripe_customers IS 'Tracks Stripe customer IDs mapped to Supabase users';
COMMENT ON TABLE subscriptions IS 'Stores Stripe subscription data for billing and access control';
COMMENT ON FUNCTION has_active_subscription(UUID) IS 'Returns true if user has an active subscription';

COMMENT ON COLUMN subscriptions.stripe_product_id IS 'Used for feature access checks (same across all currencies)';
COMMENT ON COLUMN subscriptions.stripe_price_id IS 'Specific price ID for the currency/interval combination';
COMMENT ON COLUMN subscriptions.status IS 'Stripe subscription status: active, canceled, past_due, trialing, incomplete, incomplete_expired, unpaid';
COMMENT ON COLUMN subscriptions.amount IS 'Price in smallest currency unit (kuruş for TRY, cents for USD)';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'True if user canceled but subscription still active until period end';
