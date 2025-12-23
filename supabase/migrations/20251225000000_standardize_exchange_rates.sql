-- =====================================================
-- Standardize Exchange Rates to TRY Anchor
-- =====================================================
-- Purpose: Remove all non-TRY anchored rates to enforce
-- the new triangulation standard.
-- =====================================================

-- 1. Remove all rates where from_currency is not TRY
DELETE FROM public.exchange_rates
WHERE from_currency != 'TRY';

-- 2. Add comment to enforce standard
COMMENT ON TABLE public.exchange_rates IS
  'Daily exchange rate snapshots anchored to TRY. Rates represent units of target currency per 1 TRY.';

