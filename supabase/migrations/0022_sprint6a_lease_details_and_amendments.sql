-- Sprint 6A T2 — US Lease Wizard: lease_details (1:1 with contracts) + lease_amendments.
-- RLS: org membership + row owner (user_id = auth.uid()), matching Sprint 6A spec.

-- ---------------------------------------------------------------------------
-- lease_details
-- ---------------------------------------------------------------------------

CREATE TABLE public.lease_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts (id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  property_timezone text NOT NULL,
  residence_type text NOT NULL DEFAULT 'apartment',
  residence_type_other text,
  property_street text NOT NULL,
  property_unit text,
  property_city text NOT NULL,
  property_state text NOT NULL,
  property_zip text NOT NULL,
  year_built integer,
  bedrooms numeric(3, 1) NOT NULL DEFAULT 1,
  bathrooms numeric(3, 1) NOT NULL DEFAULT 1,

  landlord_name text NOT NULL,
  landlord_mailing_street text,
  landlord_mailing_city text,
  landlord_mailing_state text,
  landlord_mailing_zip text,
  landlord_phone text,
  landlord_email text,

  tenant_name text NOT NULL,
  tenant_phone text,
  tenant_email text,
  tenant_name_2 text,
  tenant_phone_2 text,
  tenant_email_2 text,
  additional_occupants text[] NOT NULL DEFAULT '{}',

  co_signer_name text,
  co_signer_phone text,
  co_signer_email text,
  co_signer_role text,

  rent_due_day integer NOT NULL DEFAULT 1,
  security_deposit_enabled boolean NOT NULL DEFAULT false,
  security_deposit_amount numeric(10, 2),
  security_deposit_return_days integer DEFAULT 21,

  late_fee_type text NOT NULL DEFAULT 'none',
  late_fee_amount numeric(10, 2),
  late_fee_per text,
  late_fee_interest_pct numeric(5, 2),

  nsf_fee_enabled boolean NOT NULL DEFAULT false,
  nsf_fee_amount numeric(10, 2),

  early_move_in_enabled boolean NOT NULL DEFAULT false,
  early_move_in_date date,
  early_move_in_prorated_rent numeric(10, 2),

  prepaid_rent_enabled boolean NOT NULL DEFAULT false,
  prepaid_rent_amount numeric(10, 2),
  prepaid_rent_start date,
  prepaid_rent_end date,

  parking_fee_enabled boolean NOT NULL DEFAULT false,
  parking_fee_amount numeric(8, 2),

  payment_methods text[] NOT NULL DEFAULT '{}',
  paypal_email text,
  venmo_handle text,
  zelle_contact text,
  payment_method_other text,

  utilities_landlord_covered text[] NOT NULL DEFAULT '{}',
  utilities_other text,

  furnished_enabled boolean NOT NULL DEFAULT false,
  furnished_rooms text[],
  appliances_enabled boolean NOT NULL DEFAULT false,
  appliances_list text[],
  appliances_other text,

  common_areas_enabled boolean NOT NULL DEFAULT false,
  common_areas_description text,

  parking_enabled boolean NOT NULL DEFAULT false,
  parking_spaces integer,

  move_in_inspection_required boolean NOT NULL DEFAULT false,

  pets_allowed boolean NOT NULL DEFAULT false,
  pets_count integer,
  pets_types text,
  pets_max_weight_lbs integer,
  pets_deposit_amount numeric(10, 2),
  pets_deposit_refundable boolean,

  subletting_policy text NOT NULL DEFAULT 'not_allowed',
  renters_insurance_required boolean NOT NULL DEFAULT false,
  renters_insurance_min_coverage numeric(10, 2),
  smoking_allowed boolean NOT NULL DEFAULT false,

  landlord_notice_custom_address text,
  tenant_notice_custom_address text,

  lead_paint_disclosure_required boolean NOT NULL DEFAULT false,
  lead_paint_known_hazards boolean,
  lead_paint_hazard_description text,
  lead_paint_records_available boolean,
  lead_paint_records_description text,
  lead_paint_pamphlet_delivered boolean NOT NULL DEFAULT false,
  lead_paint_pamphlet_delivery_method text,
  lead_paint_pamphlet_delivery_date date,

  additional_terms text,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT lease_details_contract_id_key UNIQUE (contract_id),
  CONSTRAINT lease_details_residence_type_check CHECK (
    residence_type = ANY (ARRAY['apartment'::text, 'house'::text, 'condo'::text, 'other'::text])
  ),
  CONSTRAINT lease_details_late_fee_type_check CHECK (
    late_fee_type = ANY (ARRAY['none'::text, 'fixed'::text, 'interest'::text])
  ),
  CONSTRAINT lease_details_late_fee_per_check CHECK (
    late_fee_per IS NULL OR late_fee_per = ANY (ARRAY['occurrence'::text, 'day'::text])
  ),
  CONSTRAINT lease_details_co_signer_role_check CHECK (
    co_signer_role IS NULL OR co_signer_role = ANY (ARRAY['co_signer'::text, 'guarantor'::text])
  ),
  CONSTRAINT lease_details_subletting_policy_check CHECK (
    subletting_policy = ANY (
      ARRAY['not_allowed'::text, 'with_consent'::text, 'no_restriction'::text]
    )
  ),
  CONSTRAINT lease_details_lead_paint_pamphlet_method_check CHECK (
    lead_paint_pamphlet_delivery_method IS NULL
    OR lead_paint_pamphlet_delivery_method = ANY (
      ARRAY['in_person'::text, 'email'::text, 'mail'::text]
    )
  ),
  CONSTRAINT lease_details_rent_due_day_check CHECK (
    rent_due_day >= 1 AND rent_due_day <= 31
  ),
  CONSTRAINT lease_details_additional_terms_len_check CHECK (
    additional_terms IS NULL OR char_length(additional_terms) <= 2000
  )
);

COMMENT ON TABLE public.lease_details IS 'Sprint 6A: US residential lease wizard fields (1:1 with contracts).';

CREATE INDEX lease_details_org_id_idx ON public.lease_details (org_id);
CREATE INDEX lease_details_property_state_idx ON public.lease_details (property_state);
CREATE INDEX lease_details_user_id_idx ON public.lease_details (user_id);

CREATE TRIGGER trg_prevent_org_id_change_lease_details
  BEFORE UPDATE ON public.lease_details
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_org_id_change();

CREATE TRIGGER update_lease_details_updated_at
  BEFORE UPDATE ON public.lease_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.lease_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_select_lease_details ON public.lease_details FOR SELECT USING (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
);

CREATE POLICY org_insert_lease_details ON public.lease_details FOR INSERT WITH CHECK (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
);

CREATE POLICY org_update_lease_details ON public.lease_details FOR UPDATE USING (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
) WITH CHECK (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
);

CREATE POLICY org_delete_lease_details ON public.lease_details FOR DELETE USING (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
);

-- ---------------------------------------------------------------------------
-- lease_amendments (rental lease amendments; distinct from deal_amendments)
-- ---------------------------------------------------------------------------

CREATE TABLE public.lease_amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts (id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  amendment_date date NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lease_amendments IS 'Sprint 6A: amendments log for US lease contracts.';

CREATE INDEX lease_amendments_contract_id_idx ON public.lease_amendments (contract_id);
CREATE INDEX lease_amendments_org_id_idx ON public.lease_amendments (org_id);

CREATE TRIGGER trg_prevent_org_id_change_lease_amendments
  BEFORE UPDATE ON public.lease_amendments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_org_id_change();

ALTER TABLE public.lease_amendments ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_select_lease_amendments ON public.lease_amendments FOR SELECT USING (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
);

CREATE POLICY org_insert_lease_amendments ON public.lease_amendments FOR INSERT WITH CHECK (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
);

CREATE POLICY org_update_lease_amendments ON public.lease_amendments FOR UPDATE USING (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
) WITH CHECK (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
);

CREATE POLICY org_delete_lease_amendments ON public.lease_amendments FOR DELETE USING (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
);
