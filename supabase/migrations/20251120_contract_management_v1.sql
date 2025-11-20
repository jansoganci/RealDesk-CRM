-- Contract Management System V1: Foundation
-- Adds encryption fields and component-based address structure
-- Created: 2025-11-20

-- ============================================================================
-- 1. Add encryption fields to property_owners
-- ============================================================================

ALTER TABLE property_owners
ADD COLUMN IF NOT EXISTS tc_encrypted text,
ADD COLUMN IF NOT EXISTS tc_hash text,
ADD COLUMN IF NOT EXISTS iban_encrypted text;

-- ============================================================================
-- 2. Add encryption fields to tenants
-- ============================================================================

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS tc_encrypted text,
ADD COLUMN IF NOT EXISTS tc_hash text;

-- ============================================================================
-- 3. Modify properties table for component-based address
-- ============================================================================

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS mahalle text,
ADD COLUMN IF NOT EXISTS cadde_sokak text,
ADD COLUMN IF NOT EXISTS bina_no text,
ADD COLUMN IF NOT EXISTS daire_no text,
ADD COLUMN IF NOT EXISTS ilce text,
ADD COLUMN IF NOT EXISTS il text,
ADD COLUMN IF NOT EXISTS full_address text,
ADD COLUMN IF NOT EXISTS normalized_address text,
ADD COLUMN IF NOT EXISTS type text DEFAULT 'apartment',
ADD COLUMN IF NOT EXISTS use_purpose text;

-- ============================================================================
-- 4. Create contract_details table
-- ============================================================================

CREATE TABLE IF NOT EXISTS contract_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid UNIQUE REFERENCES contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Payment details
  payment_day_of_month integer,
  payment_method text,

  -- Financial details
  annual_rent numeric(10,2),
  rent_increase_rate numeric(5,2),
  deposit_currency text DEFAULT 'TRY',

  -- Legal details
  special_conditions text,
  furniture_list text[],

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 5. Basic indexes (critical for lookups)
-- ============================================================================

-- Owner indexes
CREATE INDEX IF NOT EXISTS idx_owners_tc_hash ON property_owners(tc_hash);

-- Tenant indexes
CREATE INDEX IF NOT EXISTS idx_tenants_tc_hash ON tenants(tc_hash);

-- ============================================================================
-- 6. Row Level Security for contract_details
-- ============================================================================

ALTER TABLE contract_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view their own contract details" ON contract_details;
DROP POLICY IF EXISTS "Users can insert their own contract details" ON contract_details;
DROP POLICY IF EXISTS "Users can update their own contract details" ON contract_details;
DROP POLICY IF EXISTS "Users can delete their own contract details" ON contract_details;

-- Users can view their own contract details
CREATE POLICY "Users can view their own contract details"
  ON contract_details FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own contract details
CREATE POLICY "Users can insert their own contract details"
  ON contract_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own contract details
CREATE POLICY "Users can update their own contract details"
  ON contract_details FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own contract details
CREATE POLICY "Users can delete their own contract details"
  ON contract_details FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. Comments for documentation
-- ============================================================================

COMMENT ON COLUMN property_owners.tc_encrypted IS 'AES-256-GCM encrypted TC Kimlik No';
COMMENT ON COLUMN property_owners.tc_hash IS 'SHA-256 hash of TC for lookups';
COMMENT ON COLUMN property_owners.iban_encrypted IS 'AES-256-GCM encrypted IBAN';

COMMENT ON COLUMN tenants.tc_encrypted IS 'AES-256-GCM encrypted TC Kimlik No';
COMMENT ON COLUMN tenants.tc_hash IS 'SHA-256 hash of TC for lookups';

COMMENT ON COLUMN properties.mahalle IS 'Mahalle (neighborhood)';
COMMENT ON COLUMN properties.cadde_sokak IS 'Cadde/Sokak (street/avenue)';
COMMENT ON COLUMN properties.bina_no IS 'Bina numarası (building number)';
COMMENT ON COLUMN properties.daire_no IS 'Daire numarası (apartment number)';
COMMENT ON COLUMN properties.ilce IS 'İlçe (district)';
COMMENT ON COLUMN properties.il IS 'İl (city/province)';
COMMENT ON COLUMN properties.full_address IS 'Generated full address for display';
COMMENT ON COLUMN properties.normalized_address IS 'Normalized address for matching';

COMMENT ON TABLE contract_details IS 'Additional contract details for PDF generation';
