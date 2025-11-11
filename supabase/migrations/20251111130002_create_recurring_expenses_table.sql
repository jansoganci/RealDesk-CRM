-- =====================================================
-- Recurring Expenses Table
-- Phase 1: Finance Database Foundation
-- =====================================================
-- Purpose: Track recurring bills and expenses
-- for automatic transaction generation
-- =====================================================

CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Recurring Expense Details
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,

  -- Amount Information
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'TRY',

  -- Recurrence Configuration
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means recurring indefinitely

  -- Tracking
  next_due_date DATE NOT NULL,
  last_generated_date DATE, -- Last time a transaction was auto-created

  -- Payment Details
  payment_method VARCHAR(50), -- cash, bank_transfer, credit_card, check

  -- Automation Settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_create_transaction BOOLEAN NOT NULL DEFAULT true, -- Auto-generate transactions
  reminder_days_before INTEGER DEFAULT 3 CHECK (reminder_days_before >= 0), -- Days before due date to remind

  -- Additional Information
  notes TEXT,
  vendor_name VARCHAR(200), -- e.g., "Electric Company", "Internet Provider"

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_end_date CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT valid_next_due_date CHECK (next_due_date >= start_date)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX idx_recurring_expenses_user_active
  ON public.recurring_expenses(user_id, is_active);

CREATE INDEX idx_recurring_expenses_next_due
  ON public.recurring_expenses(next_due_date, is_active)
  WHERE is_active = true;

CREATE INDEX idx_recurring_expenses_category
  ON public.recurring_expenses(category, is_active);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Users can view only their own recurring expenses
CREATE POLICY "Users can view own recurring expenses"
  ON public.recurring_expenses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert only their own recurring expenses
CREATE POLICY "Users can insert own recurring expenses"
  ON public.recurring_expenses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own recurring expenses
CREATE POLICY "Users can update own recurring expenses"
  ON public.recurring_expenses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own recurring expenses
CREATE POLICY "Users can delete own recurring expenses"
  ON public.recurring_expenses
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Trigger for Updated Timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_recurring_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_recurring_expenses_updated_at
  BEFORE UPDATE ON public.recurring_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_expenses_updated_at();

-- =====================================================
-- Function to Calculate Next Due Date
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_next_due_date(
  current_due_date DATE,
  freq VARCHAR(20),
  day_of_month INTEGER DEFAULT NULL
)
RETURNS DATE AS $$
DECLARE
  next_date DATE;
BEGIN
  CASE freq
    WHEN 'monthly' THEN
      IF day_of_month IS NOT NULL THEN
        -- Use specific day of month
        next_date := (current_due_date + INTERVAL '1 month')::DATE;
        next_date := DATE_TRUNC('month', next_date)::DATE + (day_of_month - 1);
      ELSE
        -- Use same day next month
        next_date := current_due_date + INTERVAL '1 month';
      END IF;

    WHEN 'quarterly' THEN
      next_date := current_due_date + INTERVAL '3 months';

    WHEN 'yearly' THEN
      next_date := current_due_date + INTERVAL '1 year';

    ELSE
      next_date := current_due_date;
  END CASE;

  RETURN next_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Trigger to Set Next Due Date on Insert
-- =====================================================

CREATE OR REPLACE FUNCTION set_initial_next_due_date()
RETURNS TRIGGER AS $$
BEGIN
  -- If next_due_date is not provided, set it to start_date
  IF NEW.next_due_date IS NULL THEN
    NEW.next_due_date := NEW.start_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_recurring_expense_next_due_date
  BEFORE INSERT ON public.recurring_expenses
  FOR EACH ROW
  EXECUTE FUNCTION set_initial_next_due_date();

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE public.recurring_expenses IS
  'Tracks recurring bills and expenses for automatic transaction generation';

COMMENT ON COLUMN public.recurring_expenses.frequency IS
  'How often the expense recurs: monthly, quarterly, or yearly';

COMMENT ON COLUMN public.recurring_expenses.day_of_month IS
  'Specific day of month for monthly recurrence (1-31)';

COMMENT ON COLUMN public.recurring_expenses.next_due_date IS
  'Next date when this expense is due';

COMMENT ON COLUMN public.recurring_expenses.last_generated_date IS
  'Last date when a transaction was auto-created from this recurring expense';

COMMENT ON COLUMN public.recurring_expenses.auto_create_transaction IS
  'Whether to automatically generate transactions when due';

COMMENT ON COLUMN public.recurring_expenses.reminder_days_before IS
  'Number of days before due date to send reminder (0 = day of)';

COMMENT ON COLUMN public.recurring_expenses.is_active IS
  'Set to false to pause recurring expense without deleting it';
