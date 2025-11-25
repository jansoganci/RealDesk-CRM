-- Contract Management System V2: Atomic Transaction
-- PostgreSQL RPC function for smart auto-creation
-- Created: 2025-11-20

-- ============================================================================
-- FUNCTION: create_contract_atomic
-- Purpose: Atomically create/find owner, tenant, property, and contract
-- Returns: JSON with all IDs and creation flags
-- ============================================================================

CREATE OR REPLACE FUNCTION create_contract_atomic(
  owner_data jsonb,
  tenant_data jsonb,
  property_data jsonb,
  contract_data jsonb,
  contract_details_data jsonb,
  user_id_param uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_tenant_id uuid;
  v_property_id uuid;
  v_contract_id uuid;
  v_contract_details_id uuid;
  v_result jsonb;
  v_owner_created boolean := false;
  v_tenant_created boolean := false;
  v_property_created boolean := false;
BEGIN
  -- ========================================================================
  -- Security check: Ensure user_id matches authenticated user
  -- ========================================================================
  IF user_id_param != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: user_id mismatch';
  END IF;

  -- ========================================================================
  -- Validate required fields
  -- ========================================================================
  IF owner_data->>'name' IS NULL OR owner_data->>'tc_hash' IS NULL THEN
    RAISE EXCEPTION 'Owner data incomplete: name and tc_hash required';
  END IF;

  IF tenant_data->>'name' IS NULL OR tenant_data->>'tc_hash' IS NULL THEN
    RAISE EXCEPTION 'Tenant data incomplete: name and tc_hash required';
  END IF;

  IF property_data->>'normalized_address' IS NULL THEN
    RAISE EXCEPTION 'Property data incomplete: normalized_address required';
  END IF;

  -- ========================================================================
  -- STEP 1: Get or create owner by TC hash
  -- ========================================================================
  SELECT id INTO v_owner_id
  FROM property_owners
  WHERE tc_hash = owner_data->>'tc_hash'
    AND user_id = user_id_param
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    -- Owner doesn't exist - create new
    INSERT INTO property_owners (
      user_id,
      name,
      tc_encrypted,
      tc_hash,
      iban_encrypted,
      phone,
      email
    )
    VALUES (
      user_id_param,
      owner_data->>'name',
      owner_data->>'tc_encrypted',
      owner_data->>'tc_hash',
      owner_data->>'iban_encrypted',
      owner_data->>'phone',
      owner_data->>'email'
    )
    RETURNING id INTO v_owner_id;

    v_owner_created := true;
  ELSE
    -- Owner exists - update contact info (may have changed)
    UPDATE property_owners
    SET
      phone = owner_data->>'phone',
      email = owner_data->>'email',
      iban_encrypted = owner_data->>'iban_encrypted',
      updated_at = now()
    WHERE id = v_owner_id;
  END IF;

  -- ========================================================================
  -- STEP 2: Get or create tenant by TC hash
  -- ========================================================================
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE tc_hash = tenant_data->>'tc_hash'
    AND user_id = user_id_param
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    -- Tenant doesn't exist - create new
    INSERT INTO tenants (
      user_id,
      name,
      tc_encrypted,
      tc_hash,
      phone,
      email,
      address
    )
    VALUES (
      user_id_param,
      tenant_data->>'name',
      tenant_data->>'tc_encrypted',
      tenant_data->>'tc_hash',
      tenant_data->>'phone',
      tenant_data->>'email',
      tenant_data->>'address'
    )
    RETURNING id INTO v_tenant_id;

    v_tenant_created := true;
  ELSE
    -- Tenant exists - update contact info and current address
    UPDATE tenants
    SET
      address = tenant_data->>'address',
      phone = tenant_data->>'phone',
      email = tenant_data->>'email',
      updated_at = now()
    WHERE id = v_tenant_id;
  END IF;

  -- ========================================================================
  -- STEP 3: Get or create property by normalized address + owner
  -- ========================================================================
  SELECT p.id INTO v_property_id
  FROM properties p
  WHERE p.normalized_address = property_data->>'normalized_address'
    AND p.owner_id = v_owner_id
    AND p.user_id = user_id_param
  LIMIT 1;

  IF v_property_id IS NULL THEN
    -- Property doesn't exist - create new
    INSERT INTO properties (
      user_id,
      owner_id,
      mahalle,
      cadde_sokak,
      bina_no,
      daire_no,
      ilce,
      il,
      full_address,
      normalized_address,
      type,
      use_purpose,
      address,
      status
    )
    VALUES (
      user_id_param,
      v_owner_id,
      property_data->>'mahalle',
      property_data->>'cadde_sokak',
      property_data->>'bina_no',
      property_data->>'daire_no',
      property_data->>'ilce',
      property_data->>'il',
      property_data->>'full_address',
      property_data->>'normalized_address',
      COALESCE(property_data->>'type', 'apartment'),
      property_data->>'use_purpose',
      property_data->>'full_address',
      'Occupied'
    )
    RETURNING id INTO v_property_id;

    v_property_created := true;
  ELSE
    -- Property exists - update status to Occupied
    UPDATE properties
    SET
      status = 'Occupied',
      updated_at = now()
    WHERE id = v_property_id;
  END IF;

  -- ========================================================================
  -- STEP 4: Create contract (always new)
  -- ========================================================================
  INSERT INTO contracts (
    user_id,
    tenant_id,
    property_id,
    start_date,
    end_date,
    rent_amount,
    deposit,
    currency,
    status
  )
  VALUES (
    user_id_param,
    v_tenant_id,
    v_property_id,
    (contract_data->>'start_date')::date,
    (contract_data->>'end_date')::date,
    (contract_data->>'rent_amount')::numeric,
    (contract_data->>'deposit')::numeric,
    'TRY',
    'Active'
  )
  RETURNING id INTO v_contract_id;

  -- ========================================================================
  -- STEP 5: Create contract details (if provided)
  -- ========================================================================
  IF contract_details_data IS NOT NULL AND contract_details_data::text != 'null' THEN
    INSERT INTO contract_details (
      contract_id,
      user_id,
      payment_day_of_month,
      payment_method,
      annual_rent,
      rent_increase_rate,
      deposit_currency,
      special_conditions,
      furniture_list
    )
    VALUES (
      v_contract_id,
      user_id_param,
      (contract_details_data->>'payment_day_of_month')::integer,
      contract_details_data->>'payment_method',
      (contract_details_data->>'annual_rent')::numeric,
      (contract_details_data->>'rent_increase_rate')::numeric,
      COALESCE(contract_details_data->>'deposit_currency', 'TRY'),
      contract_details_data->>'special_conditions',
      contract_details_data->'furniture_list'
    )
    RETURNING id INTO v_contract_details_id;
  END IF;

  -- ========================================================================
  -- STEP 6: Return all IDs and creation flags
  -- ========================================================================
  v_result := jsonb_build_object(
    'success', true,
    'owner_id', v_owner_id,
    'tenant_id', v_tenant_id,
    'property_id', v_property_id,
    'contract_id', v_contract_id,
    'contract_details_id', v_contract_details_id,
    'created_owner', v_owner_created,
    'created_tenant', v_tenant_created,
    'created_property', v_property_created,
    'message', 'Contract created successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Any error triggers automatic ROLLBACK
    RAISE EXCEPTION 'Contract creation failed: %', SQLERRM;
END;
$$;

-- ============================================================================
-- Grant execute permission to authenticated users
-- ============================================================================
GRANT EXECUTE ON FUNCTION create_contract_atomic TO authenticated;

-- ============================================================================
-- Add helpful comment
-- ============================================================================
COMMENT ON FUNCTION create_contract_atomic IS
'Atomically creates/finds owner, tenant, property and creates contract.
Uses TC hash for owner/tenant lookup, normalized address for property lookup.
Returns JSON with all IDs and flags indicating which entities were created.
Rolls back entire transaction on any error.';
