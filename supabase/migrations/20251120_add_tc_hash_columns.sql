-- Add tc_hash columns for duplicate detection
-- This prevents 406 errors when checking for duplicate TC numbers

-- Add tc_hash to property_owners if not exists
ALTER TABLE property_owners
ADD COLUMN IF NOT EXISTS tc_hash TEXT;

-- Add tc_hash to tenants if not exists
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS tc_hash TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_owners_tc_hash ON property_owners(tc_hash) WHERE tc_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_tc_hash ON tenants(tc_hash) WHERE tc_hash IS NOT NULL;

-- Update RLS policies to allow tc_hash queries
-- (RLS policies should already allow SELECT, but this ensures it)
