-- Atomically convert an active lead and one of its matched properties into a deal.

CREATE OR REPLACE FUNCTION public.rpc_convert_lead_to_deal(
  p_lead_id uuid,
  p_property_id uuid,
  p_org_id uuid,
  p_deal jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_lead public.property_inquiries%ROWTYPE;
  v_property public.properties%ROWTYPE;
  v_deal public.deals%ROWTYPE;
  v_negotiation public.offer_negotiations%ROWTYPE;
  v_deal_name text;
  v_client_role text;
  v_financing_type text;
  v_preapproval_status text;
  v_buyer_agent_agreement_id uuid;
  v_list_price numeric;
  v_intended_offer_price numeric;
  v_earnest_money_planned numeric;
  v_projected_close_date date;
  v_notes text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_deal IS NULL OR jsonb_typeof(p_deal) <> 'object' THEN
    RAISE EXCEPTION 'Deal details are required';
  END IF;

  SELECT inquiry.*
  INTO v_lead
  FROM public.property_inquiries AS inquiry
  WHERE inquiry.id = p_lead_id
    AND inquiry.org_id = p_org_id
    AND inquiry.deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  IF NOT public.is_org_owner(v_lead.org_id) THEN
    RAISE EXCEPTION 'Only organization owners can convert leads';
  END IF;

  IF v_lead.status <> 'active' THEN
    RAISE EXCEPTION 'Lead must be active before conversion';
  END IF;

  IF v_lead.deal_id IS NOT NULL THEN
    RAISE EXCEPTION 'Lead has already been converted';
  END IF;

  SELECT property.*
  INTO v_property
  FROM public.properties AS property
  WHERE property.id = p_property_id
    AND property.org_id = v_lead.org_id
    AND property.deleted_at IS NULL
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Matched property not found';
  END IF;

  IF v_property.property_type <> v_lead.inquiry_type THEN
    RAISE EXCEPTION 'Property type does not match lead type';
  END IF;

  IF (v_lead.inquiry_type = 'sale' AND v_property.status <> 'Available')
     OR (v_lead.inquiry_type = 'rental' AND v_property.status <> 'Empty') THEN
    RAISE EXCEPTION 'Property is no longer available';
  END IF;

  PERFORM 1
  FROM public.inquiry_matches AS match
  WHERE match.inquiry_id = v_lead.id
    AND match.property_id = v_property.id
    AND match.org_id = v_lead.org_id
    AND match.deleted_at IS NULL
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property is not an active match for this lead';
  END IF;

  IF NULLIF(p_deal->>'deal_type', '') IS DISTINCT FROM v_lead.inquiry_type THEN
    RAISE EXCEPTION 'Deal type must match lead type';
  END IF;

  v_deal_name := NULLIF(btrim(p_deal->>'deal_name'), '');
  IF v_deal_name IS NULL OR char_length(v_deal_name) > 300 THEN
    RAISE EXCEPTION 'Deal name must contain between 1 and 300 characters';
  END IF;

  v_client_role := NULLIF(p_deal->>'client_role', '');
  IF v_client_role IS NULL OR v_client_role NOT IN ('buyer', 'seller', 'dual') THEN
    RAISE EXCEPTION 'Invalid client role';
  END IF;

  v_financing_type := NULLIF(p_deal->>'financing_type', '');
  IF v_financing_type IS NOT NULL
     AND v_financing_type NOT IN ('cash', 'conventional', 'fha', 'va', 'usda', 'seller_financing', 'other') THEN
    RAISE EXCEPTION 'Invalid financing type';
  END IF;

  v_preapproval_status := NULLIF(p_deal->>'preapproval_status', '');
  IF v_preapproval_status IS NOT NULL
     AND v_preapproval_status NOT IN ('not_started', 'in_progress', 'approved', 'denied') THEN
    RAISE EXCEPTION 'Invalid pre-approval status';
  END IF;

  v_buyer_agent_agreement_id := NULLIF(p_deal->>'buyer_agent_agreement_id', '')::uuid;
  IF v_buyer_agent_agreement_id IS NOT NULL THEN
    PERFORM 1
    FROM public.buyer_agent_agreements AS agreement
    WHERE agreement.id = v_buyer_agent_agreement_id
      AND agreement.lead_id = v_lead.id
      AND agreement.org_id = v_lead.org_id
      AND agreement.user_id = v_user_id
    FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Buyer agent agreement does not belong to this lead';
    END IF;
  END IF;

  v_list_price := NULLIF(p_deal->>'list_price', '')::numeric;
  v_intended_offer_price := NULLIF(p_deal->>'intended_offer_price', '')::numeric;
  v_earnest_money_planned := NULLIF(p_deal->>'earnest_money_planned', '')::numeric;
  v_projected_close_date := NULLIF(p_deal->>'projected_close_date', '')::date;
  v_notes := NULLIF(p_deal->>'notes', '');

  IF v_list_price IS NOT NULL AND v_list_price <= 0 THEN
    RAISE EXCEPTION 'List price must be greater than zero';
  END IF;
  IF v_intended_offer_price IS NOT NULL AND v_intended_offer_price <= 0 THEN
    RAISE EXCEPTION 'Intended offer must be greater than zero';
  END IF;
  IF v_earnest_money_planned IS NOT NULL AND v_earnest_money_planned < 0 THEN
    RAISE EXCEPTION 'Earnest money cannot be negative';
  END IF;
  IF v_earnest_money_planned IS NOT NULL
     AND v_intended_offer_price IS NOT NULL
     AND v_earnest_money_planned > v_intended_offer_price THEN
    RAISE EXCEPTION 'Earnest money cannot exceed intended offer';
  END IF;
  IF v_projected_close_date IS NOT NULL AND v_projected_close_date < current_date THEN
    RAISE EXCEPTION 'Projected close date cannot be in the past';
  END IF;
  IF v_notes IS NOT NULL AND char_length(v_notes) > 10000 THEN
    RAISE EXCEPTION 'Notes cannot exceed 10000 characters';
  END IF;

  INSERT INTO public.deals (
    org_id,
    user_id,
    lead_id,
    property_id,
    property_snapshot,
    deal_name,
    deal_type,
    client_role,
    deal_stage,
    financing_type,
    preapproval_status,
    buyer_agent_agreement_id,
    list_price,
    intended_offer_price,
    earnest_money_planned,
    projected_close_date,
    notes
  )
  VALUES (
    v_lead.org_id,
    v_user_id,
    v_lead.id,
    v_property.id,
    NULL,
    v_deal_name,
    v_lead.inquiry_type,
    v_client_role,
    'offer_prep',
    v_financing_type,
    v_preapproval_status,
    v_buyer_agent_agreement_id,
    v_list_price,
    v_intended_offer_price,
    v_earnest_money_planned,
    v_projected_close_date,
    v_notes
  )
  RETURNING * INTO v_deal;

  INSERT INTO public.offer_negotiations (
    org_id,
    user_id,
    deal_id,
    status
  )
  VALUES (
    v_lead.org_id,
    v_user_id,
    v_deal.id,
    'active'
  )
  RETURNING * INTO v_negotiation;

  UPDATE public.property_inquiries
  SET deal_id = v_deal.id,
      status = 'converted',
      updated_at = now()
  WHERE id = v_lead.id
    AND org_id = v_lead.org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead could not be marked converted';
  END IF;

  RETURN jsonb_build_object(
    'deal', to_jsonb(v_deal),
    'negotiation', to_jsonb(v_negotiation)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_convert_lead_to_deal(uuid, uuid, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_convert_lead_to_deal(uuid, uuid, uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.rpc_convert_lead_to_deal(uuid, uuid, uuid, jsonb) TO authenticated;

--- REVERT
-- DROP FUNCTION IF EXISTS public.rpc_convert_lead_to_deal(uuid, uuid, uuid, jsonb);
