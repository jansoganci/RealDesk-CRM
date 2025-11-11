-- =====================================================
-- Financial Transactions Table
-- Phase 1: Finance Database Foundation
-- =====================================================
-- Purpose: Store all income and expense transactions
-- for lightweight accounting in real estate CRM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction Core Details
  transaction_date DATE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),

  -- Amount Information
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'TRY',

  -- Description & Notes
  description TEXT NOT NULL,
  notes TEXT,

  -- Payment Information
  payment_method VARCHAR(50), -- cash, bank_transfer, credit_card, check
  payment_status VARCHAR(20) NOT NULL DEFAULT 'completed'
    CHECK (payment_status IN ('completed', 'pending', 'cancelled')),

  -- Optional References to Other Entities
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  commission_id UUID REFERENCES public.commissions(id) ON DELETE SET NULL,

  -- Attachment Support
  receipt_url TEXT,
  invoice_number VARCHAR(100),

  -- Recurring Transaction Support
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly')),
  recurring_day INTEGER CHECK (recurring_day BETWEEN 1 AND 31),
  recurring_end_date DATE,
  parent_transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_recurring_fields CHECK (
    (is_recurring = false) OR
    (is_recurring = true AND recurring_frequency IS NOT NULL)
  )
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX idx_financial_transactions_user_date
  ON public.financial_transactions(user_id, transaction_date DESC);

CREATE INDEX idx_financial_transactions_category
  ON public.financial_transactions(category, type);

CREATE INDEX idx_financial_transactions_type
  ON public.financial_transactions(type, payment_status);

CREATE INDEX idx_financial_transactions_property
  ON public.financial_transactions(property_id)
  WHERE property_id IS NOT NULL;

CREATE INDEX idx_financial_transactions_contract
  ON public.financial_transactions(contract_id)
  WHERE contract_id IS NOT NULL;

CREATE INDEX idx_financial_transactions_commission
  ON public.financial_transactions(commission_id)
  WHERE commission_id IS NOT NULL;

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view only their own transactions
CREATE POLICY "Users can view own financial transactions"
  ON public.financial_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert only their own transactions
CREATE POLICY "Users can insert own financial transactions"
  ON public.financial_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own transactions
CREATE POLICY "Users can update own financial transactions"
  ON public.financial_transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own transactions
CREATE POLICY "Users can delete own financial transactions"
  ON public.financial_transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Trigger for Updated Timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_financial_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_transactions_updated_at();

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE public.financial_transactions IS
  'Stores all income and expense transactions for lightweight accounting';

COMMENT ON COLUMN public.financial_transactions.type IS
  'Transaction type: income or expense';

COMMENT ON COLUMN public.financial_transactions.category IS
  'Main category (e.g., Rental Commissions, Office Rent, Marketing)';

COMMENT ON COLUMN public.financial_transactions.subcategory IS
  'Optional subcategory for detailed tracking';

COMMENT ON COLUMN public.financial_transactions.payment_status IS
  'Payment status: completed, pending, or cancelled';

COMMENT ON COLUMN public.financial_transactions.is_recurring IS
  'Whether this transaction repeats automatically';

COMMENT ON COLUMN public.financial_transactions.parent_transaction_id IS
  'References the original recurring transaction if this was auto-generated';
