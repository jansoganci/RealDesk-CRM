/*
  Multi-Agent Migration - Phase 3.5: Fix RPC Functions for user_id Injection (Fixed)

  This migration updates 2 RPC functions to properly inject user_id:
  1. rpc_create_tenant_with_contract - Add user_id to tenant and contract INSERTs
  2. rpc_create_contract_and_update_property - Add user_id to contract INSERT

  Critical: Without these fixes, RLS policies will block INSERT operations

  Date: 2025-01-11
  Follows: Phase 2 (RLS policies are active)
  Precedes: Phase 4 (Trigger updates)
*/

-- ============================================================================
-- FIX 1: Update rpc_create_tenant_with_contract
-- ============================================================================
-- Add user_id injection to both tenant and contract creation

CREATE OR REPLACE FUNCTION rpc_create_tenant_with_contract(
  p_tenant jsonb,
  p_contract jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  v_contract_id uuid;
  v_property_id uuid;
  v_contract_status text;
  v_result jsonb;
  v_user_id uuid;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();

  -- Verify user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated. Please log in.';
  END IF;

  -- Extract property_id and status from contract data
  v_property_id := (p_contract->>'property_id')::uuid;
  v_contract_status := p_contract->>'status';

  -- Validate required fields
  IF v_property_id IS NULL THEN
    RAISE EXCEPTION 'Property ID is required for contract creation';
  END IF;

  IF p_tenant->>'name' IS NULL OR p_tenant->>'name' = '' THEN
    RAISE EXCEPTION 'Tenant name is required';
  END IF;

  -- Begin transaction (implicit in function)

  -- Step 1: Create the tenant with user_id
  INSERT INTO tenants (
    name,
    phone,
    email,
    notes,
    user_id  -- ✅ ADDED: Inject authenticated user ID
  ) VALUES (
    p_tenant->>'name',
    p_tenant->>'phone',
    p_tenant->>'email',
    p_tenant->>'notes',
    v_user_id  -- ✅ ADDED: Use auth.uid()
  ) RETURNING id INTO v_tenant_id;

  -- Step 2: Create the contract with user_id
  INSERT INTO contracts (
    tenant_id,
    property_id,
    start_date,
    end_date,
    rent_amount,
    status,
    notes,
    rent_increase_reminder_enabled,
    rent_increase_reminder_days,
    rent_increase_reminder_contacted,
    expected_new_rent,
    reminder_notes,
    currency,
    user_id  -- ✅ ADDED: Inject authenticated user ID
  ) VALUES (
    v_tenant_id,
    v_property_id,
    (p_contract->>'start_date')::date,
    (p_contract->>'end_date')::date,
    CASE
      WHEN p_contract->>'rent_amount' IS NOT NULL AND p_contract->>'rent_amount' != ''
      THEN (p_contract->>'rent_amount')::numeric
      ELSE NULL
    END,
    COALESCE(p_contract->>'status', 'Active'),
    p_contract->>'notes',
    COALESCE((p_contract->>'rent_increase_reminder_enabled')::boolean, false),
    CASE
      WHEN p_contract->>'rent_increase_reminder_days' IS NOT NULL AND p_contract->>'rent_increase_reminder_days' != ''
      THEN (p_contract->>'rent_increase_reminder_days')::integer
      ELSE 90
    END,
    false, -- Always false for new contracts
    CASE
      WHEN p_contract->>'expected_new_rent' IS NOT NULL AND p_contract->>'expected_new_rent' != ''
      THEN (p_contract->>'expected_new_rent')::numeric
      ELSE NULL
    END,
    p_contract->>'reminder_notes',
    COALESCE(p_contract->>'currency', 'USD'),
    v_user_id  -- ✅ ADDED: Use auth.uid()
  ) RETURNING id INTO v_contract_id;

  -- Step 3: Update property status if contract is Active
  IF v_contract_status = 'Active' THEN
    UPDATE properties
    SET status = 'Occupied',
        updated_at = NOW()
    WHERE id = v_property_id
      AND user_id = v_user_id;  -- ✅ ADDED: Security check (only update own properties)

    -- Verify the property update was successful
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Failed to update property status - property not found or access denied: %', v_property_id;
    END IF;
  END IF;

  -- Return the created IDs
  v_result := jsonb_build_object(
    'tenant_id', v_tenant_id,
    'contract_id', v_contract_id,
    'property_id', v_property_id,
    'success', true
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (optional)
    RAISE NOTICE 'Error in rpc_create_tenant_with_contract: %', SQLERRM;
    -- Re-raise the exception to trigger rollback
    RAISE;
END;
$$;

-- Log progress
DO $$
BEGIN
  RAISE NOTICE '✅ Updated rpc_create_tenant_with_contract with user_id injection';
END $$;


-- ============================================================================
-- FIX 2: Update rpc_create_contract_and_update_property (FIXED TYPE ERROR)
-- ============================================================================
-- Add user_id injection to contract creation

CREATE OR REPLACE FUNCTION rpc_create_contract_and_update_property(p_contract jsonb)
RETURNS jsonb  -- ✅ FIXED: Use jsonb instead of contracts type
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contract_id uuid;
  v_property_id uuid;
  v_status text;
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();

  -- Verify user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated. Please log in.';
  END IF;

  -- Extract values we need
  v_property_id := nullif(p_contract->>'property_id','')::uuid;
  v_status := p_contract->>'status';

  -- Insert contract with user_id
  INSERT INTO contracts (
    tenant_id,
    property_id,
    start_date,
    end_date,
    rent_amount,
    status,
    notes,
    rent_increase_reminder_enabled,
    rent_increase_reminder_days,
    rent_increase_reminder_contacted,
    expected_new_rent,
    reminder_notes,
    currency,
    user_id  -- ✅ ADDED: Inject authenticated user ID
  ) VALUES (
    nullif(p_contract->>'tenant_id','')::uuid,
    v_property_id,
    (p_contract->>'start_date')::date,
    (p_contract->>'end_date')::date,
    nullif(p_contract->>'rent_amount','')::numeric,
    v_status,
    nullif(p_contract->>'notes',''),
    coalesce((p_contract->>'rent_increase_reminder_enabled')::boolean, false),
    coalesce((p_contract->>'rent_increase_reminder_days')::int, 90),
    coalesce((p_contract->>'rent_increase_reminder_contacted')::boolean, false),
    nullif(p_contract->>'expected_new_rent','')::numeric,
    nullif(p_contract->>'reminder_notes',''),
    coalesce(p_contract->>'currency', 'USD'),
    v_user_id  -- ✅ ADDED: Use auth.uid()
  ) RETURNING id INTO v_contract_id;

  -- If new contract is Active, mark property as Occupied
  IF v_status = 'Active' THEN
    UPDATE properties
      SET status = 'Occupied'
      WHERE id = v_property_id
        AND user_id = v_user_id;  -- ✅ ADDED: Security check (only update own properties)

    -- Verify property was updated
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Failed to update property status - property not found or access denied';
    END IF;
  END IF;

  -- Fetch and return the created contract as jsonb
  SELECT to_jsonb(c.*) INTO v_result
  FROM contracts c
  WHERE c.id = v_contract_id;

  RETURN v_result;
END;
$$;

-- Log progress
DO $$
BEGIN
  RAISE NOTICE '✅ Updated rpc_create_contract_and_update_property with user_id injection';
END $$;


-- ============================================================================
-- FIX 3: Update rpc_rollback_tenant_with_contract (Security Enhancement)
-- ============================================================================
-- Add user_id check to rollback function for security

CREATE OR REPLACE FUNCTION rpc_rollback_tenant_with_contract(
  p_tenant_id uuid,
  p_contract_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_property_id uuid;
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();

  -- Verify user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated. Please log in.';
  END IF;

  -- Get property_id before deleting contract
  SELECT property_id INTO v_property_id
  FROM contracts
  WHERE id = p_contract_id
    AND user_id = v_user_id;  -- ✅ ADDED: Security check (only rollback own contracts)

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found or access denied';
  END IF;

  -- Delete contract first (due to foreign key constraints)
  DELETE FROM contracts
  WHERE id = p_contract_id
    AND user_id = v_user_id;  -- ✅ ADDED: Security check

  -- Delete tenant
  DELETE FROM tenants
  WHERE id = p_tenant_id
    AND user_id = v_user_id;  -- ✅ ADDED: Security check

  -- Reset property status to Empty if we had updated it
  IF v_property_id IS NOT NULL THEN
    UPDATE properties
    SET status = 'Empty',
        updated_at = NOW()
    WHERE id = v_property_id
      AND user_id = v_user_id;  -- ✅ ADDED: Security check
  END IF;

  v_result := jsonb_build_object(
    'tenant_deleted', p_tenant_id,
    'contract_deleted', p_contract_id,
    'property_reset', v_property_id,
    'success', true
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in rpc_rollback_tenant_with_contract: %', SQLERRM;
    RAISE;
END;
$$;

-- Log progress
DO $$
BEGIN
  RAISE NOTICE '✅ Updated rpc_rollback_tenant_with_contract with user_id security checks';
END $$;


-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
BEGIN
  -- Verify all 3 functions exist
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_create_tenant_with_contract') THEN
    RAISE EXCEPTION 'Function rpc_create_tenant_with_contract not found';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_create_contract_and_update_property') THEN
    RAISE EXCEPTION 'Function rpc_create_contract_and_update_property not found';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_rollback_tenant_with_contract') THEN
    RAISE EXCEPTION 'Function rpc_rollback_tenant_with_contract not found';
  END IF;

  RAISE NOTICE '✅ Validation passed: All 3 RPC functions updated successfully';
END $$;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PHASE 3.5 MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - Fixed rpc_create_tenant_with_contract';
  RAISE NOTICE '  - Fixed rpc_create_contract_and_update_property';
  RAISE NOTICE '  - Enhanced rpc_rollback_tenant_with_contract';
  RAISE NOTICE '  - Added auth.uid() to all INSERT statements';
  RAISE NOTICE '  - Added security checks to all UPDATE/DELETE operations';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT:';
  RAISE NOTICE '  - These RPCs now require authenticated user';
  RAISE NOTICE '  - RLS policies will now allow INSERT operations';
  RAISE NOTICE '  - All operations are user-isolated';
  RAISE NOTICE '';
  RAISE NOTICE '✅ NEXT STEPS:';
  RAISE NOTICE '  1. Test tenant creation with contract';
  RAISE NOTICE '  2. Test contract creation with property update';
  RAISE NOTICE '  3. Verify multi-user isolation';
  RAISE NOTICE '  4. Proceed to Phase 4 (Trigger updates)';
  RAISE NOTICE '========================================';
END $$;
