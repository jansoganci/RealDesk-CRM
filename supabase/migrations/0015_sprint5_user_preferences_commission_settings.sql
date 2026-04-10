-- Sprint 5 T1: user_preferences commission settings columns
-- Adds broker model configuration fields with safe guards for existing schemas.

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS broker_model text DEFAULT 'split_with_cap',
  ADD COLUMN IF NOT EXISTS broker_split_pct numeric(5,2) DEFAULT 30,
  ADD COLUMN IF NOT EXISTS annual_cap_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS cap_anniversary_date date,
  ADD COLUMN IF NOT EXISTS franchise_fee_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS franchise_fee_pct numeric(5,2),
  ADD COLUMN IF NOT EXISTS franchise_fee_cap numeric(10,2),
  ADD COLUMN IF NOT EXISTS default_transaction_fee numeric(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS eo_fee_type text DEFAULT 'per_deal',
  ADD COLUMN IF NOT EXISTS eo_fee_amount numeric(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_tc_fee numeric(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_rental_commission_type text DEFAULT 'one_month',
  ADD COLUMN IF NOT EXISTS default_rental_commission_rate numeric(5,2),
  ADD COLUMN IF NOT EXISTS default_rental_flat_fee numeric(8,2);
