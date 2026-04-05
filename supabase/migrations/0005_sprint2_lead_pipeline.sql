-- Sprint 2: Lead pipeline — extend property_inquiries, buyer rep agreements, showing logs
-- RLS mirrors property_inquiries (org_id + get_user_org_ids / is_org_owner; delete blocked)

-- ---------------------------------------------------------------------------
-- A. Extend property_inquiries
-- ---------------------------------------------------------------------------

ALTER TABLE public.property_inquiries
  ADD COLUMN lead_source text,
  ADD COLUMN preferred_state text,
  ADD COLUMN pre_approved boolean DEFAULT false;

ALTER TABLE public.property_inquiries
  ADD CONSTRAINT property_inquiries_lead_source_check CHECK (
    lead_source IS NULL OR lead_source = ANY (ARRAY[
      'zillow'::text,
      'realtor_com'::text,
      'referral'::text,
      'sign_call'::text,
      'social_media'::text,
      'cold_call'::text,
      'open_house'::text,
      'other'::text
    ])
  );

-- Status is text + CHECK (not a Postgres enum in this schema)
ALTER TABLE public.property_inquiries DROP CONSTRAINT valid_inquiry_status;

ALTER TABLE public.property_inquiries ADD CONSTRAINT valid_inquiry_status CHECK (
  status = ANY (ARRAY[
    'active'::text,
    'matched'::text,
    'contacted'::text,
    'converted'::text,
    'closed'::text,
    'new'::text,
    'qualified'::text,
    'under_contract'::text,
    'closed_won'::text,
    'closed_lost'::text
  ])
);

CREATE INDEX idx_property_inquiries_lead_source ON public.property_inquiries USING btree (lead_source);

-- ---------------------------------------------------------------------------
-- B. buyer_agent_agreements (org_id matches property_inquiries / organizations)
-- ---------------------------------------------------------------------------

CREATE TABLE public.buyer_agent_agreements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  org_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  signed_date date NOT NULL,
  expiration_date date NOT NULL,
  commission_rate numeric(5, 2),
  commission_type text,
  flat_fee_amount numeric(12, 2),
  pdf_url text,
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT buyer_agent_agreements_pkey PRIMARY KEY (id),
  CONSTRAINT buyer_agent_agreements_commission_type_check CHECK (
    commission_type IS NULL OR commission_type = ANY (ARRAY['percentage'::text, 'flat_fee'::text, 'tiered'::text])
  ),
  CONSTRAINT buyer_agent_agreements_status_check CHECK (
    status = ANY (ARRAY['active'::text, 'expired'::text, 'terminated'::text])
  ),
  CONSTRAINT buyer_agent_agreements_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id) ON DELETE CASCADE,
  CONSTRAINT buyer_agent_agreements_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.property_inquiries (id) ON DELETE CASCADE
);

CREATE INDEX idx_buyer_agent_agreements_org ON public.buyer_agent_agreements USING btree (org_id);
CREATE INDEX idx_buyer_agent_agreements_lead ON public.buyer_agent_agreements USING btree (lead_id);
CREATE INDEX idx_buyer_agent_agreements_expiration ON public.buyer_agent_agreements USING btree (expiration_date);

ALTER TABLE public.buyer_agent_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_select_buyer_agent_agreements ON public.buyer_agent_agreements FOR SELECT USING ((org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)));

CREATE POLICY org_insert_buyer_agent_agreements ON public.buyer_agent_agreements FOR INSERT WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_update_buyer_agent_agreements ON public.buyer_agent_agreements FOR UPDATE USING (((org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_delete_buyer_agent_agreements ON public.buyer_agent_agreements FOR DELETE USING (false);

CREATE TRIGGER trg_prevent_org_id_change_buyer_agent_agreements BEFORE UPDATE ON public.buyer_agent_agreements FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();

CREATE TRIGGER update_buyer_agent_agreements_updated_at BEFORE UPDATE ON public.buyer_agent_agreements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.buyer_agent_agreements IS 'Buyer representation / buyer-broker agreement records linked to leads (property_inquiries).';

-- ---------------------------------------------------------------------------
-- C. showing_logs
-- ---------------------------------------------------------------------------

CREATE TABLE public.showing_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  org_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  property_id uuid NOT NULL,
  showing_date timestamp with time zone NOT NULL,
  duration_minutes integer,
  feedback text,
  interest_level text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT showing_logs_pkey PRIMARY KEY (id),
  CONSTRAINT showing_logs_interest_level_check CHECK (
    interest_level IS NULL OR interest_level = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text, 'none'::text])
  ),
  CONSTRAINT showing_logs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id) ON DELETE CASCADE,
  CONSTRAINT showing_logs_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.property_inquiries (id) ON DELETE CASCADE,
  CONSTRAINT showing_logs_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties (id) ON DELETE CASCADE
);

CREATE INDEX idx_showing_logs_org ON public.showing_logs USING btree (org_id);
CREATE INDEX idx_showing_logs_lead ON public.showing_logs USING btree (lead_id);
CREATE INDEX idx_showing_logs_property ON public.showing_logs USING btree (property_id);
CREATE INDEX idx_showing_logs_date ON public.showing_logs USING btree (showing_date);

ALTER TABLE public.showing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_select_showing_logs ON public.showing_logs FOR SELECT USING ((org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)));

CREATE POLICY org_insert_showing_logs ON public.showing_logs FOR INSERT WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_update_showing_logs ON public.showing_logs FOR UPDATE USING (((org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_delete_showing_logs ON public.showing_logs FOR DELETE USING (false);

CREATE TRIGGER trg_prevent_org_id_change_showing_logs BEFORE UPDATE ON public.showing_logs FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();

CREATE TRIGGER update_showing_logs_updated_at BEFORE UPDATE ON public.showing_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.showing_logs IS 'Property showing visits linked to leads and listings.';
