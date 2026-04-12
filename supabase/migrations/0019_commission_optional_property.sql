-- Commission recording without a linked RealDesk property (manual / off-system address).
-- Nullable property_id + RPC skips property status update when absent.

ALTER TABLE public.commissions
  ALTER COLUMN property_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.rpc_record_commission_and_close_deal(p_commission jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_deal_id uuid;
  v_property_id uuid;
  v_lead_id uuid;
  v_deal_type text;
  v_closing_date date;
  v_commission_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
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

  SELECT d.org_id, d.deal_type, d.lead_id
  INTO v_org_id, v_deal_type, v_lead_id
  FROM public.deals d
  WHERE d.id = v_deal_id
    AND d.user_id = v_user_id
    AND d.deleted_at IS NULL
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Deal not found or access denied';
  END IF;

  INSERT INTO public.commissions (
    org_id, user_id, property_id, deal_id, contract_id, type, amount, currency, property_address, notes,
    commission_side, commission_type, commission_rate, sale_price, gross_commission,
    referral_fee_pct, referral_fee_amount, referral_to, post_referral_gci,
    broker_split_pct, broker_dollar, capped_at_close, franchise_fee_amount, transaction_fee, eo_fee, tc_fee, other_fees,
    net_commission, closing_date
  )
  VALUES (
    v_org_id, v_user_id, v_property_id, v_deal_id, NULLIF(p_commission->>'contract_id', '')::uuid,
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
  WHERE id = v_deal_id AND org_id = v_org_id AND user_id = v_user_id AND deleted_at IS NULL;

  IF v_property_id IS NOT NULL THEN
    IF v_deal_type = 'sale' THEN
      UPDATE public.properties
      SET status = 'Sold', sold_at = v_closing_date, under_contract_deal_id = NULL, updated_at = NOW()
      WHERE id = v_property_id AND org_id = v_org_id AND user_id = v_user_id AND deleted_at IS NULL;
    ELSE
      UPDATE public.properties
      SET status = 'Occupied', under_contract_deal_id = NULL, updated_at = NOW()
      WHERE id = v_property_id AND org_id = v_org_id AND user_id = v_user_id AND deleted_at IS NULL;
    END IF;
  END IF;

  IF v_lead_id IS NOT NULL THEN
    UPDATE public.property_inquiries
    SET status = 'closed', updated_at = NOW()
    WHERE id = v_lead_id AND org_id = v_org_id AND user_id = v_user_id AND deleted_at IS NULL;
  END IF;

  INSERT INTO public.notifications (org_id, user_id, deal_id, alert_type, title, body, action_url)
  VALUES (
    v_org_id,
    v_user_id,
    v_deal_id,
    'closing_soon',
    'Commission recorded',
    'Deal closed and commission recorded successfully.',
    '/deals/' || v_deal_id::text
  );

  RETURN v_commission_id;
END;
$$;
