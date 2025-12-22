-- =====================================================
-- Exchange Rates Table
-- Multi-Currency Finance MVP
-- =====================================================
-- Purpose: Store daily exchange rate snapshots for
-- historical rate matching by transaction date
-- =====================================================

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Rate Details
  rate_date DATE NOT NULL,
  from_currency CHAR(3) NOT NULL,  -- ISO 4217 code (e.g., 'USD', 'EUR', 'TRY')
  to_currency CHAR(3) NOT NULL,    -- ISO 4217 code
  rate DECIMAL(18, 8) NOT NULL,     -- High precision: 1 from_currency = rate to_currency
  
  -- Metadata
  source VARCHAR(50),                -- Provider name (e.g., 'TCMB', 'ECB', 'openexchangerates')
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(rate_date, from_currency, to_currency),
  CHECK (from_currency != to_currency),
  CHECK (rate > 0)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX idx_exchange_rates_lookup 
  ON public.exchange_rates(rate_date DESC, from_currency, to_currency);

CREATE INDEX idx_exchange_rates_currencies
  ON public.exchange_rates(from_currency, to_currency);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read exchange rates (public data)
CREATE POLICY "Anyone can read exchange rates"
  ON public.exchange_rates
  FOR SELECT
  USING (true);

-- Only service role can insert/update rates (via edge functions or admin)
-- Note: For MVP, manual insertion is acceptable. Service role policy can be added later.

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE public.exchange_rates IS
  'Daily exchange rate snapshots for historical rate matching by transaction date';

COMMENT ON COLUMN public.exchange_rates.rate_date IS
  'Date for which this rate is valid (used to match transaction dates)';

COMMENT ON COLUMN public.exchange_rates.rate IS
  'Exchange rate: 1 from_currency = rate to_currency (high precision for accuracy)';

COMMENT ON COLUMN public.exchange_rates.source IS
  'Provider/source of the exchange rate (e.g., TCMB, ECB, openexchangerates)';

