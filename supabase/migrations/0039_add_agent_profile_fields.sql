-- Migration 0039: Add agent profile fields to organizations
-- For US real estate solo agent onboarding

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS brokerage_name text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS license_state text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_market_city text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_market_state text;

COMMENT ON COLUMN organizations.brokerage_name IS 'Name of the brokerage/agency the agent works under';
COMMENT ON COLUMN organizations.license_state IS 'US state abbreviation where agent holds real estate license';
COMMENT ON COLUMN organizations.primary_market_city IS 'Primary city where agent operates';
COMMENT ON COLUMN organizations.primary_market_state IS 'US state abbreviation for primary market';

-- REVERT:
-- ALTER TABLE organizations DROP COLUMN IF EXISTS brokerage_name;
-- ALTER TABLE organizations DROP COLUMN IF EXISTS license_state;
-- ALTER TABLE organizations DROP COLUMN IF EXISTS primary_market_city;
-- ALTER TABLE organizations DROP COLUMN IF EXISTS primary_market_state;
