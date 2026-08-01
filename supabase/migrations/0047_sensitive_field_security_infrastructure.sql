-- Server-side sensitive-field encryption support.
--
-- Creates service-role-only audit/rate-limit storage, schedules rate-limit
-- cleanup, and moves the legacy contract RPC from iban_encrypted to the
-- dedicated US routing/account ciphertext columns.

CREATE TABLE public.sensitive_field_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  org_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('encrypt', 'decrypt', 'hash')),
  entity_type text NOT NULL,
  entity_id uuid,
  field_name text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('success', 'denied', 'failed')),
  error_code text,
  request_id text NOT NULL
);

CREATE INDEX idx_sensitive_field_access_audit_org_time
  ON public.sensitive_field_access_audit (org_id, occurred_at DESC);

CREATE INDEX idx_sensitive_field_access_audit_user_time
  ON public.sensitive_field_access_audit (user_id, occurred_at DESC);

ALTER TABLE public.sensitive_field_access_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sensitive_field_access_audit FROM anon, authenticated;
GRANT ALL ON public.sensitive_field_access_audit TO service_role;

CREATE TABLE public.sensitive_field_rate_limits (
  scope_kind text NOT NULL CHECK (scope_kind IN ('user', 'org')),
  scope_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('encrypt', 'decrypt', 'hash')),
  window_start timestamptz NOT NULL,
  field_count integer NOT NULL DEFAULT 0 CHECK (field_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope_kind, scope_id, operation, window_start)
);

CREATE INDEX idx_sensitive_field_rate_limits_window
  ON public.sensitive_field_rate_limits (window_start);

ALTER TABLE public.sensitive_field_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sensitive_field_rate_limits FROM anon, authenticated;
GRANT ALL ON public.sensitive_field_rate_limits TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-sensitive-field-rate-limits') THEN
    PERFORM cron.unschedule('cleanup-sensitive-field-rate-limits');
  END IF;

  PERFORM cron.schedule(
    'cleanup-sensitive-field-rate-limits',
    '15 * * * *',
    $CRON$
    DELETE FROM public.sensitive_field_rate_limits
    WHERE window_start < now() - interval '24 hours';
    $CRON$
  );
END $$;

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
  IF user_id_param != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: user_id mismatch';
  END IF;

  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = user_id_param
    AND status = 'active'
    AND role = 'owner'
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

  IF property_data->>'normalized_address' IS NULL THEN
    RAISE EXCEPTION 'Property data incomplete: normalized_address required';
  END IF;

  SELECT id INTO v_owner_id
  FROM property_owners
  WHERE tc_hash = owner_data->>'tc_hash'
    AND user_id = user_id_param
    AND org_id = v_org_id
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    INSERT INTO property_owners (
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
    UPDATE property_owners
    SET
      phone = owner_data->>'phone',
      email = owner_data->>'email',
      routing_number_encrypted = owner_data->>'routing_number_encrypted',
      account_number_encrypted = owner_data->>'account_number_encrypted',
      updated_at = now()
    WHERE id = v_owner_id;
  END IF;

  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE tc_hash = tenant_data->>'tc_hash'
    AND user_id = user_id_param
    AND org_id = v_org_id
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    INSERT INTO tenants (
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
    UPDATE tenants
    SET
      address = tenant_data->>'address',
      phone = tenant_data->>'phone',
      email = tenant_data->>'email',
      updated_at = now()
    WHERE id = v_tenant_id;
  END IF;

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
    ) VALUES (
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

  UPDATE contracts
  SET status = 'Archived', updated_at = now()
  WHERE property_id = v_property_id
    AND status = 'Active'
    AND user_id = user_id_param
    AND org_id = v_org_id;

  INSERT INTO contracts (
    user_id, org_id, tenant_id, property_id, start_date, end_date,
    rent_amount, deposit, currency, status,
    rent_increase_reminder_enabled,
    commission_amount
  ) VALUES (
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
    false,
    NULLIF((contract_data->>'commission_amount')::numeric, 0)
  )
  RETURNING id INTO v_contract_id;

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
    ) VALUES (
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
  IS 'Atomically creates/finds owner, tenant, property, and contract. Sensitive US Tax ID and bank values must arrive encrypted; legacy iban_encrypted is no longer written.';

-- REVERT (manual only; never run on an applied production migration):
-- SELECT cron.unschedule('cleanup-sensitive-field-rate-limits');
-- DROP TABLE public.sensitive_field_rate_limits;
-- DROP TABLE public.sensitive_field_access_audit;
-- Restore create_contract_atomic from the schema version immediately preceding
-- this migration only if the application is also rolled back.
