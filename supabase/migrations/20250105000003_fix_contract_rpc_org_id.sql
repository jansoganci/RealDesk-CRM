-- =====================================================
-- Fix create_contract_atomic RPC - Add org_id Support
-- =====================================================
--
-- This migration updates the create_contract_atomic RPC function to include
-- org_id in all INSERT statements to fix the null constraint violation error.
--
-- Problem:
-- - After multi-tenant migration, all tables require org_id (NOT NULL)
-- - RPC function was missing org_id in INSERT statements
-- - Caused: "null value in column org_id violates not-null constraint"
--
-- Solution:
-- - Fetch org_id from org_members table at start
-- - Add org_id to all 5 INSERT statements:
--   1. property_owners
--   2. tenants
--   3. properties
--   4. contracts
--   5. contract_details
--
-- SAFE TO RUN: Only updates function definition, no data changes
-- ROLLBACK: Re-run 20251222_fix_contract_rpc_currency.sql
--
-- =====================================================

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
  v_org_id uuid;
BEGIN
  -- Security check
  IF user_id_param != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: user_id mismatch';
  END IF;

  -- Get org_id from org_members (user must be active owner)
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = user_id_param
    AND status = 'active'
    AND role = 'owner'
  LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User is not an active owner of any organization';
  END IF;

  -- Validate required fields
  IF owner_data->>'name' IS NULL OR owner_data->>'tc_hash' IS NULL THEN
    RAISE EXCEPTION 'Owner data incomplete: name and tc_hash required';
  END IF;

  IF tenant_data->>'name' IS NULL OR tenant_data->>'tc_hash' IS NULL THEN
    RAISE EXCEPTION 'Tenant data incomplete: name and tc_hash required';
  END IF;

  IF property_data->>'normalized_address' IS NULL THEN
    RAISE EXCEPTION 'Property data incomplete: normalized_address required';
  END IF;

  -- STEP 1: Get or create owner (TC stored ENCRYPTED here)
  SELECT id INTO v_owner_id
  FROM property_owners
  WHERE tc_hash = owner_data->>'tc_hash'
    AND user_id = user_id_param
    AND org_id = v_org_id
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    INSERT INTO property_owners (
      user_id, org_id, name, tc_encrypted, tc_hash, iban_encrypted, phone, email
    )
    VALUES (
      user_id_param,
      v_org_id,
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
    UPDATE property_owners
    SET
      phone = owner_data->>'phone',
      email = owner_data->>'email',
      iban_encrypted = owner_data->>'iban_encrypted',
      updated_at = now()
    WHERE id = v_owner_id;
  END IF;

  -- STEP 2: Get or create tenant (TC stored ENCRYPTED here)
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE tc_hash = tenant_data->>'tc_hash'
    AND user_id = user_id_param
    AND org_id = v_org_id
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    INSERT INTO tenants (
      user_id, org_id, name, tc_encrypted, tc_hash, phone, email, address
    )
    VALUES (
      user_id_param,
      v_org_id,
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
    UPDATE tenants
    SET
      address = tenant_data->>'address',
      phone = tenant_data->>'phone',
      email = tenant_data->>'email',
      updated_at = now()
    WHERE id = v_tenant_id;
  END IF;

  -- STEP 3: Get or create property
  SELECT p.id INTO v_property_id
  FROM properties p
  WHERE p.normalized_address = property_data->>'normalized_address'
    AND p.owner_id = v_owner_id
    AND p.user_id = user_id_param
    AND p.org_id = v_org_id
  LIMIT 1;

  IF v_property_id IS NULL THEN
    INSERT INTO properties (
      user_id, org_id, owner_id, mahalle, cadde_sokak, bina_no, daire_no,
      ilce, il, full_address, normalized_address, type, use_purpose,
      address, status
    )
    VALUES (
      user_id_param,
      v_org_id,
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
    UPDATE properties
    SET status = 'Occupied', updated_at = now()
    WHERE id = v_property_id;
  END IF;

  -- STEP 4: Archive any existing active contracts for this property
  UPDATE contracts
  SET status = 'Archived', updated_at = now()
  WHERE property_id = v_property_id
    AND status = 'Active'
    AND user_id = user_id_param
    AND org_id = v_org_id;

  -- STEP 5: Create contract
  INSERT INTO contracts (
    user_id, org_id, tenant_id, property_id, start_date, end_date,
    rent_amount, deposit, currency, status,
    rent_increase_reminder_enabled
  )
  VALUES (
    user_id_param,
    v_org_id,
    v_tenant_id,
    v_property_id,
    (contract_data->>'start_date')::date,
    (contract_data->>'end_date')::date,
    (contract_data->>'rent_amount')::numeric,
    (contract_data->>'deposit')::numeric,
    COALESCE((contract_data->>'currency')::text, 'TRY'),
    'Active',
    false
  )
  RETURNING id INTO v_contract_id;

  -- STEP 6: Create contract details (WITHOUT plaintext TC/IBAN - SECURITY FIX)
  -- TC and IBAN are already stored ENCRYPTED in property_owners and tenants tables
  -- PDF generation uses form data directly (in-memory), not database
  IF contract_details_data IS NOT NULL AND contract_details_data::text != 'null' THEN
    INSERT INTO contract_details (
      contract_id,
      user_id,
      org_id,
      deposit_amount,
      deposit_currency,
      payment_day_of_month,
      payment_method,
      annual_rent,
      contract_duration_months,
      rent_increase_rate,
      usage_purpose,
      special_conditions,
      furniture_list,
      utilities_included
    )
    VALUES (
      v_contract_id,
      user_id_param,
      v_org_id,
      (contract_details_data->>'deposit_amount')::numeric,
      COALESCE(contract_details_data->>'deposit_currency', 'TRY'),
      (contract_details_data->>'payment_day_of_month')::integer,
      contract_details_data->>'payment_method',
      (contract_details_data->>'annual_rent')::numeric,
      (contract_details_data->>'contract_duration_months')::integer,
      (contract_details_data->>'rent_increase_rate')::numeric,
      contract_details_data->>'usage_purpose',
      contract_details_data->>'special_conditions',
      contract_details_data->'furniture_list',
      contract_details_data->'utilities_included'
    )
    RETURNING id INTO v_contract_details_id;
  END IF;

  -- STEP 7: Return result
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
    RAISE EXCEPTION 'Contract creation failed: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION create_contract_atomic IS
'Atomically creates/finds owner, tenant, property, and contract with org_id support for multi-tenant architecture. Requires user to be an active owner of an organization.';

