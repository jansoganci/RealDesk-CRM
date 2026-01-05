-- =====================================================
-- FIX: Add org_id to RPC Functions
-- =====================================================
--
-- PROBLEM:
-- RPC functions insert user_id but NOT org_id.
-- org_id is now a NOT NULL column, causing insert failures.
--
-- SOLUTION:
-- Get org_id from org_members and include in all INSERTs.
--
-- AFFECTED FUNCTIONS:
-- 1. rpc_create_tenant_with_contract
-- 2. rpc_create_contract_and_update_property
-- 3. rpc_rollback_tenant_with_contract
--
-- =====================================================

-- ============================================================================
-- FIX 1: Update rpc_create_tenant_with_contract with org_id
-- ============================================================================

CREATE OR REPLACE FUNCTION rpc_create_tenant_with_contract(
  p_tenant jsonb,
  p_contract jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_contract_id uuid;
  v_property_id uuid;
  v_contract_status text;
  v_result jsonb;
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();

  -- Verify user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated. Please log in.';
  END IF;

  -- Get user's active org_id
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id AND status = 'active'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user.';
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

  -- Step 1: Create the tenant with user_id AND org_id
  INSERT INTO tenants (
    name,
    phone,
    email,
    notes,
    tc_hash,
    user_id,
    org_id
  ) VALUES (
    p_tenant->>'name',
    p_tenant->>'phone',
    p_tenant->>'email',
    p_tenant->>'notes',
    p_tenant->>'tc_hash',
    v_user_id,
    v_org_id
  ) RETURNING id INTO v_tenant_id;

  -- Step 2: Create the contract with user_id AND org_id
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
    user_id,
    org_id
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
    false,
    CASE
      WHEN p_contract->>'expected_new_rent' IS NOT NULL AND p_contract->>'expected_new_rent' != ''
      THEN (p_contract->>'expected_new_rent')::numeric
      ELSE NULL
    END,
    p_contract->>'reminder_notes',
    COALESCE(p_contract->>'currency', 'TRY'),
    v_user_id,
    v_org_id
  ) RETURNING id INTO v_contract_id;

  -- Step 3: Update property status if contract is Active
  IF v_contract_status = 'Active' THEN
    UPDATE properties
    SET status = 'Occupied',
        updated_at = NOW()
    WHERE id = v_property_id
      AND org_id = v_org_id;

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
    RAISE NOTICE 'Error in rpc_create_tenant_with_contract: %', SQLERRM;
    RAISE;
END;
$$;

-- ============================================================================
-- FIX 2: Update rpc_create_contract_and_update_property with org_id
-- ============================================================================

CREATE OR REPLACE FUNCTION rpc_create_contract_and_update_property(p_contract jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract_id uuid;
  v_property_id uuid;
  v_status text;
  v_user_id uuid;
  v_org_id uuid;
  v_result jsonb;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated. Please log in.';
  END IF;

  -- Get user's active org_id
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id AND status = 'active'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user.';
  END IF;

  -- Extract values we need
  v_property_id := nullif(p_contract->>'property_id','')::uuid;
  v_status := p_contract->>'status';

  -- Insert contract with user_id AND org_id
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
    user_id,
    org_id
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
    coalesce(p_contract->>'currency', 'TRY'),
    v_user_id,
    v_org_id
  ) RETURNING id INTO v_contract_id;

  -- If new contract is Active, mark property as Occupied
  IF v_status = 'Active' THEN
    UPDATE properties
      SET status = 'Occupied'
      WHERE id = v_property_id
        AND org_id = v_org_id;

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

-- ============================================================================
-- FIX 3: Update rpc_rollback_tenant_with_contract with org_id
-- ============================================================================

CREATE OR REPLACE FUNCTION rpc_rollback_tenant_with_contract(
  p_tenant_id uuid,
  p_contract_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id uuid;
  v_user_id uuid;
  v_org_id uuid;
  v_result jsonb;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated. Please log in.';
  END IF;

  -- Get user's active org_id
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id AND status = 'active'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user.';
  END IF;

  -- Get property_id before deleting contract
  SELECT property_id INTO v_property_id
  FROM contracts
  WHERE id = p_contract_id
    AND org_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found or access denied';
  END IF;

  -- Delete contract first (due to foreign key constraints)
  DELETE FROM contracts
  WHERE id = p_contract_id
    AND org_id = v_org_id;

  -- Delete tenant
  DELETE FROM tenants
  WHERE id = p_tenant_id
    AND org_id = v_org_id;

  -- Reset property status to Empty if we had updated it
  IF v_property_id IS NOT NULL THEN
    UPDATE properties
    SET status = 'Empty',
        updated_at = NOW()
    WHERE id = v_property_id
      AND org_id = v_org_id;
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

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'RPC FUNCTIONS UPDATED WITH org_id';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions updated:';
  RAISE NOTICE '  1. rpc_create_tenant_with_contract';
  RAISE NOTICE '  2. rpc_create_contract_and_update_property';
  RAISE NOTICE '  3. rpc_rollback_tenant_with_contract';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Added org_id lookup from org_members';
  RAISE NOTICE '  - Added org_id to tenant INSERT';
  RAISE NOTICE '  - Added org_id to contract INSERT';
  RAISE NOTICE '  - Updated security checks to use org_id';
  RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
