-- Sprint 6A T7 — Atomic US lease: contracts + lease_details in one transaction (SECURITY DEFINER).

CREATE OR REPLACE FUNCTION public.rpc_create_lease_contract(
  p_contract jsonb,
  p_lease_details jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_tenant_id uuid;
  v_property_id uuid;
  v_contract_id uuid;
  v_status text;
  v_merged jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_tenant_id := NULLIF(p_contract->>'tenant_id', '')::uuid;
  v_property_id := NULLIF(p_contract->>'property_id', '')::uuid;
  v_status := COALESCE(p_contract->>'status', 'Active');

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id is required';
  END IF;
  IF v_property_id IS NULL THEN
    RAISE EXCEPTION 'property_id is required';
  END IF;

  SELECT p.org_id
  INTO v_org_id
  FROM public.properties p
  WHERE p.id = v_property_id
    AND p.deleted_at IS NULL;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  IF NOT public.is_org_owner(v_org_id) THEN
    RAISE EXCEPTION 'Only organization owners can create lease contracts';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.id = v_tenant_id
      AND t.org_id = v_org_id
      AND t.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Tenant not found in this organization';
  END IF;

  INSERT INTO public.contracts (
    tenant_id,
    property_id,
    start_date,
    end_date,
    rent_amount,
    deposit,
    status,
    currency,
    user_id,
    org_id,
    lease_type,
    contract_type,
    after_term_action,
    termination_notice_days,
    landlord_id,
    prior_contract_id,
    wizard_completed,
    rent_increase_reminder_enabled,
    rent_increase_reminder_days,
    rent_increase_reminder_contacted
  )
  VALUES (
    v_tenant_id,
    v_property_id,
    NULLIF(p_contract->>'start_date', '')::date,
    NULLIF(p_contract->>'end_date', '')::date,
    NULLIF(p_contract->>'rent_amount', '')::numeric,
    NULLIF(p_contract->>'deposit', '')::numeric,
    v_status,
    COALESCE(NULLIF(p_contract->>'currency', ''), 'USD'),
    v_user_id,
    v_org_id,
    COALESCE(NULLIF(p_contract->>'lease_type', ''), 'standard'),
    COALESCE(NULLIF(p_contract->>'contract_type', ''), 'lease'),
    NULLIF(p_contract->>'after_term_action', '')::text,
    NULLIF(p_contract->>'termination_notice_days', '')::integer,
    NULLIF(p_contract->>'landlord_id', '')::uuid,
    NULLIF(p_contract->>'prior_contract_id', '')::uuid,
    COALESCE((p_contract->>'wizard_completed')::boolean, true),
    COALESCE((p_contract->>'rent_increase_reminder_enabled')::boolean, true),
    COALESCE((p_contract->>'rent_increase_reminder_days')::integer, 30),
    COALESCE((p_contract->>'rent_increase_reminder_contacted')::boolean, false)
  )
  RETURNING id INTO v_contract_id;

  v_merged :=
    p_lease_details
    || jsonb_build_object(
      'id', gen_random_uuid(),
      'contract_id', v_contract_id,
      'org_id', v_org_id,
      'user_id', v_user_id,
      'created_at', to_jsonb(now()),
      'updated_at', to_jsonb(now())
    );

  INSERT INTO public.lease_details
  SELECT (s.r).*
  FROM (SELECT jsonb_populate_record(NULL::lease_details, v_merged) AS r) s;

  IF v_status = 'Active' THEN
    UPDATE public.properties
    SET status = 'Occupied', updated_at = now()
    WHERE id = v_property_id
      AND org_id = v_org_id
      AND deleted_at IS NULL
      AND status = 'Empty';
  END IF;

  RETURN v_contract_id;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_create_lease_contract(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_create_lease_contract(jsonb, jsonb) TO authenticated;
