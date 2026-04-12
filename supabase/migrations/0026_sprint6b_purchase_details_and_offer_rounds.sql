-- Sprint 6B T2 — purchase_details (1:1 purchase wizard) + offer_rounds.contract_id FK.
-- RLS matches lease_details (0022): get_user_org_ids() + user_id = auth.uid().

-- ---------------------------------------------------------------------------
-- purchase_details
-- ---------------------------------------------------------------------------

CREATE TABLE public.purchase_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts (id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  property_timezone text NOT NULL,
  property_type text NOT NULL DEFAULT 'single_family',
  property_type_other text,
  property_street text NOT NULL,
  property_city text NOT NULL,
  property_state text NOT NULL,
  property_zip text NOT NULL,
  year_built integer,
  tax_parcel_info text,
  other_description text,
  land_included boolean NOT NULL DEFAULT true,
  other_property_info text,

  buyer_name text NOT NULL,
  buyer_mailing_street text,
  buyer_mailing_city text,
  buyer_mailing_state text,
  buyer_mailing_zip text,
  buyer_phone text,
  buyer_email text,
  buyer_name_2 text,
  buyer_mailing_street_2 text,
  buyer_mailing_city_2 text,
  buyer_mailing_state_2 text,
  buyer_mailing_zip_2 text,
  buyer_phone_2 text,
  buyer_email_2 text,

  title_type text,

  seller_name text NOT NULL,
  seller_mailing_street text,
  seller_mailing_city text,
  seller_mailing_state text,
  seller_mailing_zip text,
  seller_phone text,
  seller_email text,
  seller_name_2 text,
  seller_phone_2 text,
  seller_email_2 text,

  buyer_agent_name text,
  seller_agent_name text,

  personal_property_description text,

  earnest_money_escrow_required boolean NOT NULL DEFAULT false,
  earnest_money_deadline_time text,

  financing_type text NOT NULL DEFAULT 'all_cash',
  all_cash_proof_deadline_date date,
  all_cash_proof_deadline_time text,
  bank_loan_type text,
  bank_loan_type_other text,
  bank_preapproval_letter_date date,
  bank_seller_notification_days integer,
  bank_contingent_on_sale boolean NOT NULL DEFAULT false,
  fha_addendum_uploaded boolean NOT NULL DEFAULT false,
  fha_addendum_path text,
  va_addendum_uploaded boolean NOT NULL DEFAULT false,
  va_addendum_path text,
  seller_financing_loan_amount numeric(12, 2),
  seller_financing_down_payment numeric(12, 2),
  seller_financing_interest_rate numeric(5, 3),
  seller_financing_term_value integer,
  seller_financing_term_unit text,
  seller_financing_doc_deadline date,
  seller_financing_approval_deadline date,

  contingent_on_other_property boolean NOT NULL DEFAULT false,
  contingent_property_address text,
  contingent_property_days integer,

  closing_costs_responsibility text NOT NULL DEFAULT 'buyer',
  closing_time text,
  title_company text,

  survey_buyer_notification_days integer,
  survey_seller_remedy_days integer,
  mineral_rights_transferred boolean NOT NULL DEFAULT true,
  title_buyer_review_days integer,
  title_seller_remedy_days integer,

  inspection_contractor_deadline_date date,
  inspection_contractor_deadline_time text,
  inspection_disclosures_deadline_date date,
  inspection_disclosures_deadline_time text,
  inspection_negotiation_days integer,

  appraisal_contingency boolean NOT NULL DEFAULT false,
  appraisal_negotiation_days integer,

  offer_expiration_date date,
  offer_expiration_time text,

  earnest_money_return_days integer NOT NULL DEFAULT 5,

  lead_paint_disclosure_required boolean NOT NULL DEFAULT false,
  lead_paint_known_hazards boolean,
  lead_paint_hazard_description text,
  lead_paint_records_available boolean,
  lead_paint_pamphlet_delivered boolean NOT NULL DEFAULT false,
  lead_paint_pamphlet_delivery_method text,
  lead_paint_pamphlet_delivery_date date,

  custom_addendums text[],
  additional_terms text,

  wizard_completed boolean NOT NULL DEFAULT false,
  pdf_generated_at timestamp with time zone,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT purchase_details_contract_id_key UNIQUE (contract_id),
  CONSTRAINT purchase_details_property_type_check CHECK (
    property_type = ANY (
      ARRAY[
        'single_family'::text,
        'condominium'::text,
        'pud'::text,
        'duplex'::text,
        'triplex'::text,
        'fourplex'::text,
        'other'::text
      ]
    )
  ),
  CONSTRAINT purchase_details_financing_type_check CHECK (
    financing_type = ANY (
      ARRAY[
        'all_cash'::text,
        'bank_financing'::text,
        'seller_financing'::text
      ]
    )
  ),
  CONSTRAINT purchase_details_title_type_check CHECK (
    title_type IS NULL
    OR title_type = ANY (
      ARRAY[
        'tenancy_in_common'::text,
        'joint_tenancy'::text,
        'tenancy_by_entirety'::text
      ]
    )
  ),
  CONSTRAINT purchase_details_closing_costs_check CHECK (
    closing_costs_responsibility = ANY (
      ARRAY['buyer'::text, 'seller'::text, 'both'::text]
    )
  ),
  CONSTRAINT purchase_details_bank_loan_type_check CHECK (
    bank_loan_type IS NULL
    OR bank_loan_type = ANY (
      ARRAY['conventional'::text, 'fha'::text, 'va'::text, 'other'::text]
    )
  ),
  CONSTRAINT purchase_details_seller_fin_term_unit_check CHECK (
    seller_financing_term_unit IS NULL
    OR seller_financing_term_unit = ANY (ARRAY['months'::text, 'years'::text])
  ),
  CONSTRAINT purchase_details_lead_paint_pamphlet_method_check CHECK (
    lead_paint_pamphlet_delivery_method IS NULL
    OR lead_paint_pamphlet_delivery_method = ANY (
      ARRAY['in_person'::text, 'email'::text, 'mail'::text]
    )
  ),
  CONSTRAINT purchase_details_custom_addendums_len_check CHECK (
    COALESCE(cardinality(custom_addendums), 0) <= 5
  ),
  CONSTRAINT purchase_details_additional_terms_len_check CHECK (
    additional_terms IS NULL OR char_length(additional_terms) <= 2000
  ),
  CONSTRAINT purchase_details_earnest_money_return_days_check CHECK (
    earnest_money_return_days >= 0 AND earnest_money_return_days <= 365
  )
);

COMMENT ON TABLE public.purchase_details IS 'Sprint 6B: US residential purchase wizard fields (1:1 with purchase contracts).';

CREATE INDEX purchase_details_contract_id_idx ON public.purchase_details (contract_id);
CREATE INDEX purchase_details_org_id_idx ON public.purchase_details (org_id);
CREATE INDEX purchase_details_state_idx ON public.purchase_details (property_state);
CREATE INDEX purchase_details_user_id_idx ON public.purchase_details (user_id);

CREATE TRIGGER trg_prevent_org_id_change_purchase_details
  BEFORE UPDATE ON public.purchase_details
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_org_id_change();

CREATE TRIGGER update_purchase_details_updated_at
  BEFORE UPDATE ON public.purchase_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.purchase_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_select_purchase_details ON public.purchase_details FOR SELECT USING (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
);

CREATE POLICY org_insert_purchase_details ON public.purchase_details FOR INSERT WITH CHECK (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
);

CREATE POLICY org_update_purchase_details ON public.purchase_details FOR UPDATE USING (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
) WITH CHECK (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
);

CREATE POLICY org_delete_purchase_details ON public.purchase_details FOR DELETE USING (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
);

-- ---------------------------------------------------------------------------
-- offer_rounds: optional link to purchase agreement contract (Sprint 6B)
-- ---------------------------------------------------------------------------

ALTER TABLE public.offer_rounds
  ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES public.contracts (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS offer_rounds_contract_id_idx ON public.offer_rounds (contract_id)
  WHERE contract_id IS NOT NULL;

COMMENT ON COLUMN public.offer_rounds.contract_id IS 'Sprint 6B: optional FK when round is tied to a generated purchase agreement contract.';
