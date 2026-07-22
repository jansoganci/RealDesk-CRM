-- Add US agent profile fields collected during onboarding Step 2.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS brokerage_name text,
  ADD COLUMN IF NOT EXISTS license_state text,
  ADD COLUMN IF NOT EXISTS primary_market_city text,
  ADD COLUMN IF NOT EXISTS primary_market_state text;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_license_state_us_code_check
    CHECK (
      license_state IS NULL OR license_state IN (
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
        'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
        'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
        'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
        'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI',
        'WY'
      )
    ),
  ADD CONSTRAINT organizations_primary_market_state_us_code_check
    CHECK (
      primary_market_state IS NULL OR primary_market_state IN (
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
        'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
        'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
        'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
        'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI',
        'WY'
      )
    );

COMMENT ON COLUMN public.organizations.brokerage_name IS 'Brokerage name collected during US onboarding Step 2';
COMMENT ON COLUMN public.organizations.license_state IS '2-letter US state or DC code for the agent license collected during US onboarding Step 2';
COMMENT ON COLUMN public.organizations.primary_market_city IS 'Primary market city collected during US onboarding Step 2';
COMMENT ON COLUMN public.organizations.primary_market_state IS '2-letter US state or DC code for the primary market collected during US onboarding Step 2';
