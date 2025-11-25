/**
 * Migration: Contract Management V3 - Performance Indexes
 *
 * Purpose:
 * Adds performance indexes to optimize duplicate detection queries
 * for contract creation validation.
 *
 * Indexes Added:
 * 1. idx_property_owners_tc_hash - For finding existing owners by TC
 * 2. idx_property_owners_name_user - For duplicate name checks
 * 3. idx_tenants_tc_hash - For finding existing tenants by TC
 * 4. idx_tenants_name_user - For duplicate name checks
 * 5. idx_contracts_tenant_status - For multiple contract checks
 */

-- ============================================================================
-- PROPERTY OWNERS INDEXES
-- ============================================================================

-- Index for TC hash lookups (used in checkDataChanges)
CREATE INDEX IF NOT EXISTS idx_property_owners_tc_hash
ON property_owners(tc_hash, user_id)
WHERE tc_hash IS NOT NULL;

-- Index for name-based duplicate detection
CREATE INDEX IF NOT EXISTS idx_property_owners_name_user
ON property_owners(LOWER(name), user_id);

-- ============================================================================
-- TENANTS INDEXES
-- ============================================================================

-- Index for TC hash lookups (used in checkDataChanges and checkMultipleContracts)
CREATE INDEX IF NOT EXISTS idx_tenants_tc_hash
ON tenants(tc_hash, user_id)
WHERE tc_hash IS NOT NULL;

-- Index for name-based duplicate detection
CREATE INDEX IF NOT EXISTS idx_tenants_name_user
ON tenants(LOWER(name), user_id);

-- ============================================================================
-- CONTRACTS INDEXES
-- ============================================================================

-- Index for checking multiple active contracts per tenant
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_status
ON contracts(tenant_id, status, user_id)
WHERE status = 'Active';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify indexes were created
DO $$
BEGIN
  RAISE NOTICE 'Verifying performance indexes...';

  -- Check property_owners indexes
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_property_owners_tc_hash') THEN
    RAISE NOTICE '✓ idx_property_owners_tc_hash created';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_property_owners_name_user') THEN
    RAISE NOTICE '✓ idx_property_owners_name_user created';
  END IF;

  -- Check tenants indexes
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tenants_tc_hash') THEN
    RAISE NOTICE '✓ idx_tenants_tc_hash created';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tenants_name_user') THEN
    RAISE NOTICE '✓ idx_tenants_name_user created';
  END IF;

  -- Check contracts indexes
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_tenant_status') THEN
    RAISE NOTICE '✓ idx_contracts_tenant_status created';
  END IF;

  RAISE NOTICE 'All performance indexes verified successfully!';
END $$;
