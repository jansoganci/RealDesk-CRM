-- =====================================================
-- Expense Categories Table
-- Phase 1: Finance Database Foundation
-- =====================================================
-- Purpose: Define and manage income/expense categories
-- for financial transaction classification
-- =====================================================

CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Category Details
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  parent_category VARCHAR(100), -- For hierarchical categories (optional)

  -- Budget Tracking (Optional)
  monthly_budget DECIMAL(12, 2) CHECK (monthly_budget >= 0),

  -- Display & UI
  icon VARCHAR(50), -- Lucide icon name (e.g., 'home', 'car', 'zap')
  color VARCHAR(20), -- Hex color for charts (e.g., '#10b981')

  -- System vs User Categories
  is_default BOOLEAN NOT NULL DEFAULT false, -- System-provided categories
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, name, type),
  CONSTRAINT check_default_no_user CHECK (
    (is_default = true AND user_id IS NULL) OR
    (is_default = false AND user_id IS NOT NULL)
  )
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX idx_expense_categories_user_type
  ON public.expense_categories(user_id, type, is_active);

CREATE INDEX idx_expense_categories_type
  ON public.expense_categories(type, is_default);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Users can view their own categories AND default categories
CREATE POLICY "Users can view own and default categories"
  ON public.expense_categories
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_default = true
  );

-- Users can insert only their own categories
CREATE POLICY "Users can insert own categories"
  ON public.expense_categories
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    is_default = false
  );

-- Users can update only their own categories (not defaults)
CREATE POLICY "Users can update own categories"
  ON public.expense_categories
  FOR UPDATE
  USING (
    user_id = auth.uid() AND
    is_default = false
  )
  WITH CHECK (
    user_id = auth.uid() AND
    is_default = false
  );

-- Users can delete only their own categories (not defaults)
CREATE POLICY "Users can delete own categories"
  ON public.expense_categories
  FOR DELETE
  USING (
    user_id = auth.uid() AND
    is_default = false
  );

-- =====================================================
-- Seed Default Income Categories
-- =====================================================

INSERT INTO public.expense_categories
  (name, type, icon, color, is_default, user_id)
VALUES
  -- Income Categories
  ('Rental Commissions', 'income', 'home', '#10b981', true, NULL),
  ('Sale Commissions', 'income', 'trending-up', '#3b82f6', true, NULL),
  ('Monthly Rent', 'income', 'calendar', '#8b5cf6', true, NULL),
  ('Property Management Fees', 'income', 'building-2', '#06b6d4', true, NULL),
  ('Consultation Fees', 'income', 'briefcase', '#f59e0b', true, NULL),
  ('Referral Fees', 'income', 'users', '#ec4899', true, NULL),
  ('Late Fees', 'income', 'clock', '#f97316', true, NULL),
  ('Other Income', 'income', 'plus-circle', '#64748b', true, NULL)
ON CONFLICT (user_id, name, type) DO NOTHING;

-- =====================================================
-- Seed Default Expense Categories
-- =====================================================

INSERT INTO public.expense_categories
  (name, type, icon, color, is_default, user_id)
VALUES
  -- Office & Operations
  ('Office Rent', 'expense', 'building', '#ef4444', true, NULL),
  ('Electricity', 'expense', 'zap', '#f97316', true, NULL),
  ('Water', 'expense', 'droplet', '#06b6d4', true, NULL),
  ('Internet & Phone', 'expense', 'wifi', '#8b5cf6', true, NULL),
  ('Office Supplies', 'expense', 'package', '#64748b', true, NULL),
  ('Software & Subscriptions', 'expense', 'monitor', '#3b82f6', true, NULL),

  -- Marketing & Advertising
  ('Digital Marketing', 'expense', 'megaphone', '#ec4899', true, NULL),
  ('Print Advertising', 'expense', 'printer', '#f59e0b', true, NULL),
  ('Social Media Ads', 'expense', 'share-2', '#10b981', true, NULL),
  ('Website Maintenance', 'expense', 'globe', '#06b6d4', true, NULL),
  ('Photography & Videography', 'expense', 'camera', '#8b5cf6', true, NULL),
  ('Signage & Branding', 'expense', 'image', '#ef4444', true, NULL),

  -- Payroll & Personnel
  ('Salaries & Wages', 'expense', 'users', '#3b82f6', true, NULL),
  ('Employee Benefits', 'expense', 'heart', '#10b981', true, NULL),
  ('Contractor Payments', 'expense', 'user-check', '#f59e0b', true, NULL),
  ('Training & Development', 'expense', 'graduation-cap', '#8b5cf6', true, NULL),

  -- Vehicle & Travel
  ('Fuel', 'expense', 'fuel', '#f97316', true, NULL),
  ('Vehicle Maintenance', 'expense', 'wrench', '#64748b', true, NULL),
  ('Vehicle Insurance', 'expense', 'shield', '#ef4444', true, NULL),
  ('Parking & Tolls', 'expense', 'car', '#06b6d4', true, NULL),
  ('Mileage', 'expense', 'map', '#10b981', true, NULL),

  -- Professional Services
  ('Legal Fees', 'expense', 'scale', '#ef4444', true, NULL),
  ('Accounting Fees', 'expense', 'calculator', '#3b82f6', true, NULL),
  ('Consulting', 'expense', 'briefcase', '#f59e0b', true, NULL),
  ('Licenses & Permits', 'expense', 'file-badge', '#64748b', true, NULL),

  -- Property-Specific
  ('Property Maintenance', 'expense', 'hammer', '#f97316', true, NULL),
  ('Repairs', 'expense', 'tool', '#ef4444', true, NULL),
  ('Property Insurance', 'expense', 'shield-check', '#3b82f6', true, NULL),
  ('Property Taxes', 'expense', 'landmark', '#8b5cf6', true, NULL),
  ('HOA Fees', 'expense', 'home', '#06b6d4', true, NULL),

  -- Taxes & Compliance
  ('Income Tax', 'expense', 'receipt', '#ef4444', true, NULL),
  ('Business Taxes', 'expense', 'file-text', '#f97316', true, NULL),
  ('VAT/Sales Tax', 'expense', 'percent', '#8b5cf6', true, NULL),

  -- Miscellaneous
  ('Bank Fees', 'expense', 'landmark', '#64748b', true, NULL),
  ('Insurance (General)', 'expense', 'shield-alert', '#3b82f6', true, NULL),
  ('Meals & Entertainment', 'expense', 'utensils', '#f59e0b', true, NULL),
  ('Other Expenses', 'expense', 'more-horizontal', '#64748b', true, NULL)
ON CONFLICT (user_id, name, type) DO NOTHING;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE public.expense_categories IS
  'Defines income and expense categories for transaction classification';

COMMENT ON COLUMN public.expense_categories.is_default IS
  'True for system-provided categories (cannot be edited/deleted by users)';

COMMENT ON COLUMN public.expense_categories.is_active IS
  'False to hide category from selection without deleting historical data';

COMMENT ON COLUMN public.expense_categories.monthly_budget IS
  'Optional budget limit for expense categories';

COMMENT ON COLUMN public.expense_categories.icon IS
  'Lucide icon name for UI display';

COMMENT ON COLUMN public.expense_categories.color IS
  'Hex color code for charts and visual categorization';
