-- Phase 2: per-member org commission overrides + attribute closings to deal.user_id.
-- Forward-only: does not recompute historical commissions rows.

CREATE TABLE IF NOT EXISTS public.org_member_commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_model text NOT NULL DEFAULT 'split_with_cap'
    CHECK (broker_model IN ('split_with_cap', 'traditional_split', 'flat_fee_100pct')),
  broker_split_pct numeric(5,2) NOT NULL DEFAULT 30,
  annual_cap_amount numeric(10,2),
  cap_anniversary_date date,
  franchise_fee_enabled boolean NOT NULL DEFAULT false,
  franchise_fee_pct numeric(5,2),
  franchise_fee_cap numeric(10,2),
  default_transaction_fee numeric(8,2) NOT NULL DEFAULT 0,
  eo_fee_type text NOT NULL DEFAULT 'per_deal'
    CHECK (eo_fee_type IN ('per_deal', 'monthly', 'annual_excluded')),
  eo_fee_amount numeric(8,2) NOT NULL DEFAULT 0,
  default_tc_fee numeric(8,2) NOT NULL DEFAULT 0,
  default_rental_commission_type text NOT NULL DEFAULT 'one_month'
    CHECK (default_rental_commission_type IN ('one_month', 'annual_pct', 'flat_fee')),
  default_rental_commission_rate numeric(5,2),
  default_rental_flat_fee numeric(8,2),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_member_commission_settings_org_user_unique UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_member_commission_settings_org_id
  ON public.org_member_commission_settings (org_id);
CREATE INDEX IF NOT EXISTS idx_org_member_commission_settings_user_id
  ON public.org_member_commission_settings (user_id);

CREATE OR REPLACE FUNCTION public.update_org_member_commission_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_member_commission_settings_updated_at
  ON public.org_member_commission_settings;
CREATE TRIGGER trg_org_member_commission_settings_updated_at
  BEFORE UPDATE ON public.org_member_commission_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_org_member_commission_settings_updated_at();

ALTER TABLE public.org_member_commission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_select_org_member_commission_settings
  ON public.org_member_commission_settings
  FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY org_insert_org_member_commission_settings
  ON public.org_member_commission_settings
  FOR INSERT
  WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_update_org_member_commission_settings
  ON public.org_member_commission_settings
  FOR UPDATE
  USING (public.is_org_owner(org_id))
  WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_delete_org_member_commission_settings
  ON public.org_member_commission_settings
  FOR DELETE
  USING (public.is_org_owner(org_id));

-- Resolve broker settings: org override → member user_preferences → defaults.
CREATE OR REPLACE FUNCTION public.resolve_member_broker_settings(
  p_org_id uuid,
  p_member_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_owner boolean;
  v_is_self boolean;
  v_is_active_member boolean;
  v_override public.org_member_commission_settings%ROWTYPE;
  v_prefs public.user_preferences%ROWTYPE;
  v_source text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_org_id IS NULL OR p_member_user_id IS NULL THEN
    RAISE EXCEPTION 'org_id and member_user_id are required';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id
      AND user_id = v_caller
      AND role = 'owner'
      AND status = 'active'
  ) INTO v_is_owner;

  v_is_self := (v_caller = p_member_user_id);

  IF NOT v_is_owner AND NOT v_is_self THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Self must still be an active member of the org.
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id
      AND user_id = p_member_user_id
      AND status = 'active'
  ) INTO v_is_active_member;

  IF NOT v_is_active_member THEN
    RAISE EXCEPTION 'Member not found or inactive';
  END IF;

  SELECT *
  INTO v_override
  FROM public.org_member_commission_settings
  WHERE org_id = p_org_id
    AND user_id = p_member_user_id
  LIMIT 1;

  IF FOUND THEN
    v_source := 'override';
    RETURN jsonb_build_object(
      'source', v_source,
      'broker_model', v_override.broker_model,
      'broker_split_pct', v_override.broker_split_pct,
      'annual_cap_amount', v_override.annual_cap_amount,
      'cap_anniversary_date', v_override.cap_anniversary_date,
      'franchise_fee_enabled', v_override.franchise_fee_enabled,
      'franchise_fee_pct', v_override.franchise_fee_pct,
      'franchise_fee_cap', v_override.franchise_fee_cap,
      'default_transaction_fee', v_override.default_transaction_fee,
      'eo_fee_type', v_override.eo_fee_type,
      'eo_fee_amount', v_override.eo_fee_amount,
      'default_tc_fee', v_override.default_tc_fee,
      'default_rental_commission_type', v_override.default_rental_commission_type,
      'default_rental_commission_rate', v_override.default_rental_commission_rate,
      'default_rental_flat_fee', v_override.default_rental_flat_fee
    );
  END IF;

  SELECT *
  INTO v_prefs
  FROM public.user_preferences
  WHERE user_id = p_member_user_id
  LIMIT 1;

  IF FOUND THEN
    v_source := 'profile';
    RETURN jsonb_build_object(
      'source', v_source,
      'broker_model', COALESCE(v_prefs.broker_model, 'split_with_cap'),
      'broker_split_pct', COALESCE(v_prefs.broker_split_pct, 30),
      'annual_cap_amount', v_prefs.annual_cap_amount,
      'cap_anniversary_date', v_prefs.cap_anniversary_date,
      'franchise_fee_enabled', COALESCE(v_prefs.franchise_fee_enabled, false),
      'franchise_fee_pct', v_prefs.franchise_fee_pct,
      'franchise_fee_cap', v_prefs.franchise_fee_cap,
      'default_transaction_fee', COALESCE(v_prefs.default_transaction_fee, 0),
      'eo_fee_type', COALESCE(v_prefs.eo_fee_type, 'per_deal'),
      'eo_fee_amount', COALESCE(v_prefs.eo_fee_amount, 0),
      'default_tc_fee', COALESCE(v_prefs.default_tc_fee, 0),
      'default_rental_commission_type', COALESCE(v_prefs.default_rental_commission_type, 'one_month'),
      'default_rental_commission_rate', v_prefs.default_rental_commission_rate,
      'default_rental_flat_fee', v_prefs.default_rental_flat_fee
    );
  END IF;

  RETURN jsonb_build_object(
    'source', 'defaults',
    'broker_model', 'split_with_cap',
    'broker_split_pct', 30,
    'annual_cap_amount', null,
    'cap_anniversary_date', null,
    'franchise_fee_enabled', false,
    'franchise_fee_pct', null,
    'franchise_fee_cap', null,
    'default_transaction_fee', 0,
    'eo_fee_type', 'per_deal',
    'eo_fee_amount', 0,
    'default_tc_fee', 0,
    'default_rental_commission_type', 'one_month',
    'default_rental_commission_rate', null,
    'default_rental_flat_fee', null
  );
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_member_broker_settings(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_member_broker_settings(uuid, uuid) TO authenticated;

-- Owners can close any org deal; commission attributes to deal.user_id (earning agent).
CREATE OR REPLACE FUNCTION public.rpc_record_commission_and_close_deal(p_commission jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_org_id uuid;
  v_deal_id uuid;
  v_property_id uuid;
  v_lead_id uuid;
  v_deal_type text;
  v_closing_date date;
  v_commission_id uuid;
  v_earning_user_id uuid;
  v_earning_active boolean;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_deal_id := NULLIF(p_commission->>'deal_id', '')::uuid;
  v_property_id := NULLIF(p_commission->>'property_id', '')::uuid;
  v_closing_date := NULLIF(p_commission->>'closing_date', '')::date;

  IF v_deal_id IS NULL THEN
    RAISE EXCEPTION 'deal_id is required';
  END IF;
  IF v_closing_date IS NULL THEN
    RAISE EXCEPTION 'closing_date is required';
  END IF;

  SELECT d.org_id, d.deal_type, d.lead_id, d.user_id
  INTO v_org_id, v_deal_type, v_lead_id, v_earning_user_id
  FROM public.deals d
  WHERE d.id = v_deal_id
    AND d.deleted_at IS NULL
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Deal not found or access denied';
  END IF;

  IF NOT public.is_org_owner(v_org_id) THEN
    RAISE EXCEPTION 'Only organization owners can record commission and close deals';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = v_org_id
      AND user_id = v_earning_user_id
      AND status = 'active'
  ) INTO v_earning_active;

  IF NOT v_earning_active THEN
    RAISE EXCEPTION 'Earning agent must be an active organization member';
  END IF;

  INSERT INTO public.commissions (
    org_id, user_id, property_id, deal_id, contract_id, type, amount, currency, property_address, notes,
    commission_side, commission_type, commission_rate, sale_price, gross_commission,
    referral_fee_pct, referral_fee_amount, referral_to, post_referral_gci,
    broker_split_pct, broker_dollar, capped_at_close, franchise_fee_amount, transaction_fee, eo_fee, tc_fee, other_fees,
    net_commission, closing_date
  )
  VALUES (
    v_org_id, v_earning_user_id, v_property_id, v_deal_id, NULLIF(p_commission->>'contract_id', '')::uuid,
    COALESCE(NULLIF(p_commission->>'type', ''), 'sale'),
    COALESCE(NULLIF(p_commission->>'amount', '')::numeric, 0),
    COALESCE(NULLIF(p_commission->>'currency', ''), 'USD'),
    COALESCE(NULLIF(p_commission->>'property_address', ''), ''),
    NULLIF(p_commission->>'notes', ''),
    NULLIF(p_commission->>'commission_side', ''),
    NULLIF(p_commission->>'commission_type', ''),
    NULLIF(p_commission->>'commission_rate', '')::numeric,
    NULLIF(p_commission->>'sale_price', '')::numeric,
    NULLIF(p_commission->>'gross_commission', '')::numeric,
    COALESCE(NULLIF(p_commission->>'referral_fee_pct', '')::numeric, 0),
    COALESCE(NULLIF(p_commission->>'referral_fee_amount', '')::numeric, 0),
    NULLIF(p_commission->>'referral_to', ''),
    NULLIF(p_commission->>'post_referral_gci', '')::numeric,
    COALESCE(NULLIF(p_commission->>'broker_split_pct', '')::numeric, 0),
    COALESCE(NULLIF(p_commission->>'broker_dollar', '')::numeric, 0),
    COALESCE(NULLIF(p_commission->>'capped_at_close', '')::boolean, false),
    COALESCE(NULLIF(p_commission->>'franchise_fee_amount', '')::numeric, 0),
    COALESCE(NULLIF(p_commission->>'transaction_fee', '')::numeric, 0),
    COALESCE(NULLIF(p_commission->>'eo_fee', '')::numeric, 0),
    COALESCE(NULLIF(p_commission->>'tc_fee', '')::numeric, 0),
    COALESCE(NULLIF(p_commission->>'other_fees', '')::numeric, 0),
    NULLIF(p_commission->>'net_commission', '')::numeric,
    v_closing_date
  )
  RETURNING id INTO v_commission_id;

  UPDATE public.deals
  SET deal_stage = 'closed_won', actual_close_date = v_closing_date, updated_at = NOW()
  WHERE id = v_deal_id AND org_id = v_org_id AND deleted_at IS NULL;

  IF v_property_id IS NOT NULL THEN
    IF v_deal_type = 'sale' THEN
      UPDATE public.properties
      SET status = 'Sold', sold_at = v_closing_date, under_contract_deal_id = NULL, updated_at = NOW()
      WHERE id = v_property_id AND org_id = v_org_id AND deleted_at IS NULL;
    ELSE
      UPDATE public.properties
      SET status = 'Occupied', under_contract_deal_id = NULL, updated_at = NOW()
      WHERE id = v_property_id AND org_id = v_org_id AND deleted_at IS NULL;
    END IF;
  END IF;

  IF v_lead_id IS NOT NULL THEN
    UPDATE public.property_inquiries
    SET status = 'closed', updated_at = NOW()
    WHERE id = v_lead_id AND org_id = v_org_id AND deleted_at IS NULL;
  END IF;

  INSERT INTO public.notifications (org_id, user_id, deal_id, alert_type, title, body, action_url)
  VALUES (
    v_org_id,
    v_earning_user_id,
    v_deal_id,
    'closing_soon',
    'Commission recorded',
    'Deal closed and commission recorded successfully.',
    '/deals/' || v_deal_id::text
  );

  RETURN v_commission_id;
END;
$$;

-- Allow optional earning agent on lead→deal conversion.
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
  v_earning_user_id uuid;
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

  v_earning_user_id := COALESCE(NULLIF(p_deal->>'user_id', '')::uuid, v_user_id);
  PERFORM 1
  FROM public.org_members AS member
  WHERE member.org_id = v_lead.org_id
    AND member.user_id = v_earning_user_id
    AND member.status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Earning agent must be an active organization member';
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
    v_earning_user_id,
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
    v_earning_user_id,
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
