-- Sprint 6B T5 — Atomic purchase: contracts + purchase_details + deal (optional) + offer_negotiation + offer_round + milestone seeds.

CREATE OR REPLACE FUNCTION public.rpc_create_purchase_contract(
  p_contract jsonb,
  p_purchase_details jsonb,
  p_deal_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_property_id uuid;
  v_contract_id uuid;
  v_deal_id uuid;
  v_negotiation_id uuid;
  v_round_id uuid;
  v_merged jsonb;
  v_fin text;
  v_bank text;
  v_offer_fin text;
  v_deal_name text;
  v_emd date;
  v_close date;
  v_eff date;
  v_prop_type text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_property_id := NULLIF(p_contract->>'property_id', '')::uuid;
  IF v_property_id IS NULL THEN
    RAISE EXCEPTION 'property_id is required';
  END IF;

  SELECT p.org_id, p.property_type
  INTO v_org_id, v_prop_type
  FROM public.properties p
  WHERE p.id = v_property_id
    AND p.deleted_at IS NULL;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  IF NOT public.is_org_owner(v_org_id) THEN
    RAISE EXCEPTION 'Only organization owners can create purchase contracts';
  END IF;

  v_eff := NULLIF(p_contract->>'effective_date', '')::date;
  v_close := NULLIF(p_contract->>'closing_date', '')::date;
  v_emd := NULLIF(p_contract->>'earnest_money_due_date', '')::date;

  IF v_eff IS NULL THEN
    RAISE EXCEPTION 'effective_date is required';
  END IF;
  IF v_close IS NULL THEN
    RAISE EXCEPTION 'closing_date is required';
  END IF;

  v_fin := COALESCE(p_purchase_details->>'financing_type', 'all_cash');
  v_bank := p_purchase_details->>'bank_loan_type';
  IF v_fin = 'all_cash' THEN
    v_offer_fin := 'cash';
  ELSIF v_fin = 'seller_financing' THEN
    v_offer_fin := 'seller_financing';
  ELSIF v_fin = 'bank_financing' AND v_bank = 'fha' THEN
    v_offer_fin := 'fha';
  ELSIF v_fin = 'bank_financing' AND v_bank = 'va' THEN
    v_offer_fin := 'va';
  ELSIF v_fin = 'bank_financing' AND v_bank = 'other' THEN
    v_offer_fin := 'other';
  ELSE
    v_offer_fin := 'conventional';
  END IF;

  IF p_deal_id IS NOT NULL THEN
    SELECT d.id
    INTO v_deal_id
    FROM public.deals d
    WHERE d.id = p_deal_id
      AND d.org_id = v_org_id
      AND d.deleted_at IS NULL;
    IF v_deal_id IS NULL THEN
      RAISE EXCEPTION 'Deal not found';
    END IF;
  ELSE
    v_deal_name := COALESCE(
      NULLIF(trim(both FROM p_purchase_details->>'buyer_name'), ''),
      'Buyer'
    ) || ' — Purchase';
    IF char_length(v_deal_name) > 200 THEN
      v_deal_name := left(v_deal_name, 200);
    END IF;

    INSERT INTO public.deals (
      org_id,
      user_id,
      deal_name,
      deal_type,
      client_role,
      deal_stage,
      property_id,
      projected_close_date,
      intended_offer_price,
      earnest_money_planned,
      financing_type
    )
    VALUES (
      v_org_id,
      v_user_id,
      v_deal_name,
      'sale',
      'buyer',
      'under_contract',
      v_property_id,
      v_close,
      NULLIF(p_contract->>'purchase_price', '')::numeric,
      NULLIF(p_contract->>'earnest_money_amount', '')::numeric,
      v_offer_fin
    )
    RETURNING id INTO v_deal_id;
  END IF;

  SELECT n.id
  INTO v_negotiation_id
  FROM public.offer_negotiations n
  WHERE n.deal_id = v_deal_id
  ORDER BY n.created_at ASC
  LIMIT 1;

  IF v_negotiation_id IS NULL THEN
    INSERT INTO public.offer_negotiations (org_id, user_id, deal_id, status)
    VALUES (v_org_id, v_user_id, v_deal_id, 'active')
    RETURNING id INTO v_negotiation_id;
  END IF;

  INSERT INTO public.contracts (
    tenant_id,
    property_id,
    start_date,
    end_date,
    status,
    currency,
    user_id,
    org_id,
    lease_type,
    contract_type,
    landlord_id,
    prior_contract_id,
    wizard_completed,
    rent_amount,
    deposit,
    effective_date,
    closing_date,
    purchase_price,
    earnest_money_amount,
    earnest_money_due_date,
    governing_law_state,
    deal_status,
    buyer_name_2,
    seller_name_2,
    seller_id
  )
  VALUES (
    NULL,
    v_property_id,
    v_eff,
    v_close,
    'Active',
    COALESCE(NULLIF(p_contract->>'currency', ''), 'USD'),
    v_user_id,
    v_org_id,
    'standard',
    'purchase',
    NULL,
    NULL,
    COALESCE((p_contract->>'wizard_completed')::boolean, true),
    NULL,
    NULL,
    v_eff,
    v_close,
    NULLIF(p_contract->>'purchase_price', '')::numeric,
    NULLIF(p_contract->>'earnest_money_amount', '')::numeric,
    v_emd,
    NULLIF(p_contract->>'governing_law_state', '')::text,
    COALESCE(NULLIF(p_contract->>'deal_status', ''), 'active'),
    NULLIF(p_contract->>'buyer_name_2', '')::text,
    NULLIF(p_contract->>'seller_name_2', '')::text,
    NULLIF(p_contract->>'seller_id', '')::uuid
  )
  RETURNING id INTO v_contract_id;

  v_merged :=
    p_purchase_details
    || jsonb_build_object(
      'id', gen_random_uuid(),
      'contract_id', v_contract_id,
      'org_id', v_org_id,
      'user_id', v_user_id,
      'created_at', to_jsonb(now()),
      'updated_at', to_jsonb(now())
    );

  INSERT INTO public.purchase_details
  SELECT (s.r).*
  FROM (SELECT jsonb_populate_record(NULL::purchase_details, v_merged) AS r) s;

  INSERT INTO public.offer_rounds (
    org_id,
    user_id,
    negotiation_id,
    deal_id,
    round_number,
    offered_by,
    parent_round_id,
    status,
    offer_price,
    emd_amount,
    closing_date,
    financing_type,
    expiration_date,
    expiration_time,
    personal_property_notes,
    contract_id
  )
  VALUES (
    v_org_id,
    v_user_id,
    v_negotiation_id,
    v_deal_id,
    1,
    'buyer',
    NULL,
    'submitted',
    COALESCE(NULLIF(p_contract->>'purchase_price', '')::numeric, 0),
    NULLIF(p_contract->>'earnest_money_amount', '')::numeric,
    v_close,
    v_offer_fin,
    NULLIF(p_purchase_details->>'offer_expiration_date', '')::date,
    NULLIF(p_purchase_details->>'offer_expiration_time', '')::text,
    NULLIF(p_purchase_details->>'personal_property_description', '')::text,
    v_contract_id
  )
  RETURNING id INTO v_round_id;

  IF v_emd IS NOT NULL THEN
    INSERT INTO public.deal_milestones (
      org_id,
      deal_id,
      milestone_type,
      title,
      due_date,
      offset_basis,
      status
    )
    VALUES (
      v_org_id,
      v_deal_id,
      'purchase_earnest_money_due',
      'Earnest money due',
      v_emd,
      'fixed_date',
      'pending'
    );
  END IF;

  IF NULLIF(p_purchase_details->>'bank_preapproval_letter_date', '')::date IS NOT NULL
     AND v_fin = 'bank_financing' THEN
    INSERT INTO public.deal_milestones (
      org_id,
      deal_id,
      milestone_type,
      title,
      due_date,
      offset_basis,
      status
    )
    VALUES (
      v_org_id,
      v_deal_id,
      'purchase_preapproval_letter',
      'Pre-approval letter due',
      NULLIF(p_purchase_details->>'bank_preapproval_letter_date', '')::date,
      'fixed_date',
      'pending'
    );
  END IF;

  IF NULLIF(p_purchase_details->>'inspection_contractor_deadline_date', '')::date IS NOT NULL THEN
    INSERT INTO public.deal_milestones (
      org_id,
      deal_id,
      milestone_type,
      title,
      due_date,
      offset_basis,
      status
    )
    VALUES (
      v_org_id,
      v_deal_id,
      'purchase_inspection_access_end',
      'Inspection period ends',
      NULLIF(p_purchase_details->>'inspection_contractor_deadline_date', '')::date,
      'fixed_date',
      'pending'
    );
  END IF;

  IF NULLIF(p_purchase_details->>'inspection_disclosures_deadline_date', '')::date IS NOT NULL THEN
    INSERT INTO public.deal_milestones (
      org_id,
      deal_id,
      milestone_type,
      title,
      due_date,
      offset_basis,
      status
    )
    VALUES (
      v_org_id,
      v_deal_id,
      'purchase_disclosure_deadline',
      'Disclosure deadline',
      NULLIF(p_purchase_details->>'inspection_disclosures_deadline_date', '')::date,
      'fixed_date',
      'pending'
    );
  END IF;

  IF v_close IS NOT NULL THEN
    INSERT INTO public.deal_milestones (
      org_id,
      deal_id,
      milestone_type,
      title,
      due_date,
      offset_basis,
      status
    )
    VALUES (
      v_org_id,
      v_deal_id,
      'purchase_closing',
      'Closing',
      v_close,
      'fixed_date',
      'pending'
    );
  END IF;

  IF NULLIF(p_purchase_details->>'offer_expiration_date', '')::date IS NOT NULL THEN
    INSERT INTO public.deal_milestones (
      org_id,
      deal_id,
      milestone_type,
      title,
      due_date,
      offset_basis,
      status
    )
    VALUES (
      v_org_id,
      v_deal_id,
      'purchase_offer_expiration',
      'Offer expiration',
      NULLIF(p_purchase_details->>'offer_expiration_date', '')::date,
      'fixed_date',
      'pending'
    );
  END IF;

  IF v_prop_type = 'sale' THEN
    UPDATE public.properties
    SET status = 'Under Offer',
        under_contract_deal_id = v_deal_id,
        updated_at = now()
    WHERE id = v_property_id
      AND org_id = v_org_id
      AND deleted_at IS NULL;
  END IF;

  RETURN jsonb_build_object(
    'contract_id', v_contract_id,
    'deal_id', v_deal_id,
    'offer_round_id', v_round_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_create_purchase_contract(jsonb, jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_create_purchase_contract(jsonb, jsonb, uuid) TO authenticated;
