-- HOTFIX: Add missing columns to tenants table for V2 contract management
-- Run this in Supabase SQL Editor to fix the schema
-- Created: 2025-11-20

-- Add encryption and address fields to tenants
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS tc_encrypted text,
ADD COLUMN IF NOT EXISTS tc_hash text,
ADD COLUMN IF NOT EXISTS address text;

-- Create index on tc_hash for fast lookups
CREATE INDEX IF NOT EXISTS idx_tenants_tc_hash ON tenants(tc_hash);

-- Add comments for documentation
COMMENT ON COLUMN tenants.tc_encrypted IS 'AES-256-GCM encrypted TC Kimlik No';
COMMENT ON COLUMN tenants.tc_hash IS 'SHA-256 hash of TC for lookups';
COMMENT ON COLUMN tenants.address IS 'Tenant current address';
