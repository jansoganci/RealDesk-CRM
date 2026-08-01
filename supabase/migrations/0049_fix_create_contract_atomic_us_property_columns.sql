-- Fix create_contract_atomic after the server-side encryption migration
-- restored legacy property column names that no longer exist in production.

CREATE OR REPLACE FUNCTION public.create_contract_atomic(
  owner_data jsonb,
  tenant_data jsonb,
  property_data jsonb,
  contract_data jsonb,
  contract_details_data jsonb,
  user_id_param uuid
) RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
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
  IF auth.uid() IS NULL OR user_id_param IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: user_id mismatch';
  END IF;

  SELECT org_id INTO v_org_id
  FROM public.org_members
  WHERE user_id = user_id_param
    AND status = 'active'
    AND role = 'owner'
  ORDER BY joined_at ASC NULLS LAST, created_at ASC
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User is not an active owner of any organization';
  END IF;

  IF owner_data->>'name' IS NULL OR owner_data->>'tc_hash' IS NULL THEN
    RAISE EXCEPTION 'Owner data incomplete: name and tc_hash required';
  END IF;

  IF tenant_data->>'name' IS NULL OR tenant_data->>'tc_hash' IS NULL THEN
    RAISE EXCEPTION 'Tenant data incomplete: name and tc_hash required';
  END IF;

  IF property_data->>'normalized_address' IS NULL
    OR property_data->>'full_address' IS NULL
    OR property_data->>'street_address' IS NULL
    OR property_data->>'city' IS NULL
    OR property_data->>'state' IS NULL
    OR property_data->>'zip_code' IS NULL THEN
    RAISE EXCEPTION 'Property data incomplete: US address fields required';
  END IF;

  SELECT id INTO v_owner_id
  FROM public.property_owners
  WHERE tc_hash = owner_data->>'tc_hash'
    AND user_id = user_id_param
    AND org_id = v_org_id
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    INSERT INTO public.property_owners (
      user_id,
      org_id,
      name,
      tc_encrypted,
      tc_hash,
      routing_number_encrypted,
      account_number_encrypted,
      phone,
      email
    ) VALUES (
      user_id_param,
      v_org_id,
      owner_data->>'name',
      owner_data->>'tc_encrypted',
      owner_data->>'tc_hash',
      owner_data->>'routing_number_encrypted',
      owner_data->>'account_number_encrypted',
      owner_data->>'phone',
      owner_data->>'email'
    )
    RETURNING id INTO v_owner_id;
    v_owner_created := true;
  ELSE
    UPDATE public.property_owners
    SET
      name = owner_data->>'name',
      tc_encrypted = owner_data->>'tc_encrypted',
      routing_number_encrypted = owner_data->>'routing_number_encrypted',
      account_number_encrypted = owner_data->>'account_number_encrypted',
      phone = owner_data->>'phone',
      email = owner_data->>'email',
      updated_at = now()
    WHERE id = v_owner_id
      AND user_id = user_id_param
      AND org_id = v_org_id;
  END IF;

  SELECT id INTO v_tenant_id
  FROM public.tenants
  WHERE tc_hash = tenant_data->>'tc_hash'
    AND user_id = user_id_param
    AND org_id = v_org_id
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (
      user_id, org_id, name, tc_encrypted, tc_hash, phone, email, address
    ) VALUES (
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
    UPDATE public.tenants
    SET
      name = tenant_data->>'name',
      tc_encrypted = tenant_data->>'tc_encrypted',
      address = tenant_data->>'address',
      phone = tenant_data->>'phone',
      email = tenant_data->>'email',
      updated_at = now()
    WHERE id = v_tenant_id
      AND user_id = user_id_param
      AND org_id = v_org_id;
  END IF;

  SELECT id INTO v_property_id
  FROM public.properties
  WHERE normalized_address = property_data->>'normalized_address'
    AND owner_id = v_owner_id
    AND user_id = user_id_param
    AND org_id = v_org_id
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_property_id IS NULL THEN
    INSERT INTO public.properties (
      user_id,
      org_id,
      owner_id,
      street_address,
      unit,
      city,
      state,
      zip_code,
      full_address,
      normalized_address,
      type,
      use_purpose,
      address,
      status
    ) VALUES (
      user_id_param,
      v_org_id,
      v_owner_id,
      property_data->>'street_address',
      NULLIF(property_data->>'unit', ''),
      property_data->>'city',
      property_data->>'state',
      property_data->>'zip_code',
      property_data->>'full_address',
      property_data->>'normalized_address',
      COALESCE(NULLIF(property_data->>'type', ''), 'apartment'),
      NULLIF(property_data->>'use_purpose', ''),
      property_data->>'full_address',
      'Occupied'
    )
    RETURNING id INTO v_property_id;
    v_property_created := true;
  ELSE
    UPDATE public.properties
    SET
      street_address = property_data->>'street_address',
      unit = NULLIF(property_data->>'unit', ''),
      city = property_data->>'city',
      state = property_data->>'state',
      zip_code = property_data->>'zip_code',
      full_address = property_data->>'full_address',
      address = property_data->>'full_address',
      type = COALESCE(NULLIF(property_data->>'type', ''), type),
      use_purpose = NULLIF(property_data->>'use_purpose', ''),
      status = 'Occupied',
      updated_at = now()
    WHERE id = v_property_id
      AND user_id = user_id_param
      AND org_id = v_org_id;
  END IF;

  UPDATE public.contracts
  SET status = 'Archived', updated_at = now()
  WHERE property_id = v_property_id
    AND status = 'Active'
    AND user_id = user_id_param
    AND org_id = v_org_id;

  INSERT INTO public.contracts (
    user_id, org_id, tenant_id, property_id, start_date, end_date,
    rent_amount, deposit, currency, status,
    rent_increase_reminder_enabled, commission_amount
  ) VALUES (
    user_id_param,
    v_org_id,
    v_tenant_id,
    v_property_id,
    (contract_data->>'start_date')::date,
    (contract_data->>'end_date')::date,
    (contract_data->>'rent_amount')::numeric,
    (contract_data->>'deposit')::numeric,
    COALESCE(NULLIF(contract_data->>'currency', ''), 'USD'),
    'Active',
    false,
    NULLIF((contract_data->>'commission_amount')::numeric, 0)
  )
  RETURNING id INTO v_contract_id;

  IF contract_details_data IS NOT NULL AND contract_details_data::text <> 'null' THEN
    INSERT INTO public.contract_details (
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
      utilities_included,
      handover_photos_url
    ) VALUES (
      v_contract_id,
      user_id_param,
      v_org_id,
      (contract_details_data->>'deposit_amount')::numeric,
      COALESCE(NULLIF(contract_details_data->>'deposit_currency', ''), 'USD'),
      (contract_details_data->>'payment_day_of_month')::integer,
      NULLIF(contract_details_data->>'payment_method', ''),
      (contract_details_data->>'annual_rent')::numeric,
      (contract_details_data->>'contract_duration_months')::integer,
      (contract_details_data->>'rent_increase_rate')::numeric,
      NULLIF(contract_details_data->>'usage_purpose', ''),
      NULLIF(contract_details_data->>'special_conditions', ''),
      contract_details_data->'furniture_list',
      contract_details_data->'utilities_included',
      NULLIF(contract_details_data->>'handover_photos_url', '')
    )
    RETURNING id INTO v_contract_details_id;
  END IF;

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

COMMENT ON FUNCTION public.create_contract_atomic(jsonb, jsonb, jsonb, jsonb, jsonb, uuid)
  IS 'Atomically creates/finds owner, tenant, US property, and contract using server-encrypted sensitive fields and active org-owner authorization.';

-- REVERT (manual only): restore the preceding function definition only if the
-- application is also rolled back. Migration 0047 is not a safe production
-- rollback target because it references the removed properties.ilce column.
