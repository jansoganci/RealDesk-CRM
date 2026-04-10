-- Sprint 3 T1: Deal core — new tables (deals, offer flow, contingencies, milestones, parties, amendments)
-- RLS mirrors org-scoped tables: get_user_org_ids + is_org_owner (see 0005_sprint2_lead_pipeline.sql)

-- ---------------------------------------------------------------------------
-- 1. deals (lender_contact_id FK added after deal_parties exists)
-- ---------------------------------------------------------------------------

CREATE TABLE public.deals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  lead_id uuid,
  property_id uuid,
  property_snapshot jsonb,
  deal_name text NOT NULL,
  deal_type text DEFAULT 'sale'::text NOT NULL,
  client_role text NOT NULL,
  deal_stage text DEFAULT 'offer_prep'::text NOT NULL,
  financing_type text,
  preapproval_status text,
  buyer_agent_agreement_id uuid,
  lender_contact_id uuid,
  list_price numeric(12, 2),
  intended_offer_price numeric(12, 2),
  accepted_offer_price numeric(12, 2),
  earnest_money_planned numeric(10, 2),
  earnest_money_actual numeric(10, 2),
  projected_close_date date,
  actual_close_date date,
  mutual_acceptance_date timestamp with time zone,
  fell_through_reason text,
  notes text,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deals_pkey PRIMARY KEY (id),
  CONSTRAINT deals_deal_type_check CHECK (
    deal_type = ANY (ARRAY['sale'::text, 'rental'::text])
  ),
  CONSTRAINT deals_client_role_check CHECK (
    client_role = ANY (ARRAY['buyer'::text, 'seller'::text, 'dual'::text])
  ),
  CONSTRAINT deals_deal_stage_check CHECK (
    deal_stage = ANY (ARRAY[
      'offer_prep'::text,
      'submitted'::text,
      'negotiating'::text,
      'verbal_accepted'::text,
      'mutual_acceptance'::text,
      'under_contract'::text,
      'pending'::text,
      'closing_scheduled'::text,
      'closed_won'::text,
      'fell_through'::text
    ])
  ),
  CONSTRAINT deals_financing_type_check CHECK (
    financing_type IS NULL OR financing_type = ANY (ARRAY[
      'cash'::text,
      'conventional'::text,
      'fha'::text,
      'va'::text,
      'usda'::text,
      'seller_financing'::text,
      'other'::text
    ])
  ),
  CONSTRAINT deals_preapproval_status_check CHECK (
    preapproval_status IS NULL OR preapproval_status = ANY (ARRAY[
      'not_started'::text,
      'in_progress'::text,
      'approved'::text,
      'denied'::text
    ])
  ),
  CONSTRAINT deals_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id) ON DELETE CASCADE,
  CONSTRAINT deals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT deals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.property_inquiries (id) ON DELETE SET NULL,
  CONSTRAINT deals_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties (id) ON DELETE SET NULL,
  CONSTRAINT deals_buyer_agent_agreement_id_fkey FOREIGN KEY (buyer_agent_agreement_id) REFERENCES public.buyer_agent_agreements (id) ON DELETE SET NULL
);

COMMENT ON TABLE public.deals IS 'Sprint 3: central deal record (lead → closing).';

CREATE INDEX deals_org_id_idx ON public.deals USING btree (org_id);
CREATE INDEX deals_user_id_idx ON public.deals USING btree (user_id);
CREATE INDEX deals_lead_id_idx ON public.deals USING btree (lead_id);
CREATE INDEX deals_property_id_idx ON public.deals USING btree (property_id);
CREATE INDEX deals_stage_idx ON public.deals USING btree (deal_stage);
CREATE INDEX deals_deleted_at_idx ON public.deals USING btree (deleted_at);

-- ---------------------------------------------------------------------------
-- 2. deal_parties (then wire deals.lender_contact_id)
-- ---------------------------------------------------------------------------

CREATE TABLE public.deal_parties (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  org_id uuid NOT NULL,
  deal_id uuid NOT NULL,
  role text NOT NULL,
  name text NOT NULL,
  company text,
  phone text,
  email text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deal_parties_pkey PRIMARY KEY (id),
  CONSTRAINT deal_parties_role_check CHECK (
    role = ANY (ARRAY[
      'buyer'::text,
      'seller'::text,
      'buyer_agent'::text,
      'seller_agent'::text,
      'lender'::text,
      'title_co'::text,
      'inspector'::text,
      'appraiser'::text,
      'attorney'::text,
      'other'::text
    ])
  ),
  CONSTRAINT deal_parties_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id) ON DELETE CASCADE,
  CONSTRAINT deal_parties_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals (id) ON DELETE CASCADE
);

CREATE INDEX deal_parties_deal_id_idx ON public.deal_parties USING btree (deal_id);
CREATE INDEX deal_parties_org_id_idx ON public.deal_parties USING btree (org_id);

ALTER TABLE public.deals
  ADD CONSTRAINT deals_lender_contact_id_fkey FOREIGN KEY (lender_contact_id) REFERENCES public.deal_parties (id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 3. offer_negotiations (accepted_round_id FK added after offer_rounds)
-- ---------------------------------------------------------------------------

CREATE TABLE public.offer_negotiations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  deal_id uuid NOT NULL,
  status text DEFAULT 'active'::text,
  accepted_round_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT offer_negotiations_pkey PRIMARY KEY (id),
  CONSTRAINT offer_negotiations_status_check CHECK (
    status = ANY (ARRAY['active'::text, 'accepted'::text, 'rejected'::text, 'withdrawn'::text])
  ),
  CONSTRAINT offer_negotiations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id) ON DELETE CASCADE,
  CONSTRAINT offer_negotiations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT offer_negotiations_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals (id) ON DELETE CASCADE
);

CREATE INDEX offer_negotiations_deal_id_idx ON public.offer_negotiations USING btree (deal_id);
CREATE INDEX offer_negotiations_org_id_idx ON public.offer_negotiations USING btree (org_id);

-- ---------------------------------------------------------------------------
-- 4. offer_rounds
-- ---------------------------------------------------------------------------

CREATE TABLE public.offer_rounds (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  negotiation_id uuid NOT NULL,
  deal_id uuid NOT NULL,
  round_number integer NOT NULL,
  offered_by text NOT NULL,
  parent_round_id uuid,
  status text NOT NULL,
  offer_price numeric(12, 2) NOT NULL,
  emd_amount numeric(10, 2),
  closing_date date,
  possession_date date,
  seller_credits numeric(10, 2),
  appraisal_gap_coverage numeric(10, 2),
  personal_property_notes text,
  financing_type text,
  expiration_date date,
  expiration_time text,
  submitted_at timestamp with time zone,
  mutual_acceptance_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT offer_rounds_pkey PRIMARY KEY (id),
  CONSTRAINT offer_rounds_offered_by_check CHECK (
    offered_by = ANY (ARRAY['buyer'::text, 'seller'::text])
  ),
  CONSTRAINT offer_rounds_status_check CHECK (
    status = ANY (ARRAY[
      'draft'::text,
      'submitted'::text,
      'verbal_accepted'::text,
      'mutual_acceptance'::text,
      'rejected'::text,
      'expired'::text,
      'withdrawn'::text
    ])
  ),
  CONSTRAINT offer_rounds_financing_type_check CHECK (
    financing_type IS NULL OR financing_type = ANY (ARRAY[
      'cash'::text,
      'conventional'::text,
      'fha'::text,
      'va'::text,
      'usda'::text,
      'seller_financing'::text,
      'other'::text
    ])
  ),
  CONSTRAINT offer_rounds_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id) ON DELETE CASCADE,
  CONSTRAINT offer_rounds_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT offer_rounds_negotiation_id_fkey FOREIGN KEY (negotiation_id) REFERENCES public.offer_negotiations (id) ON DELETE CASCADE,
  CONSTRAINT offer_rounds_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals (id) ON DELETE CASCADE,
  CONSTRAINT offer_rounds_parent_round_id_fkey FOREIGN KEY (parent_round_id) REFERENCES public.offer_rounds (id) ON DELETE SET NULL,
  CONSTRAINT offer_rounds_negotiation_round_number_unique UNIQUE (negotiation_id, round_number)
);

CREATE INDEX offer_rounds_deal_id_idx ON public.offer_rounds USING btree (deal_id);
CREATE INDEX offer_rounds_negotiation_id_idx ON public.offer_rounds USING btree (negotiation_id);
CREATE INDEX offer_rounds_org_id_idx ON public.offer_rounds USING btree (org_id);

ALTER TABLE public.offer_negotiations
  ADD CONSTRAINT offer_negotiations_accepted_round_id_fkey FOREIGN KEY (accepted_round_id) REFERENCES public.offer_rounds (id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 5. offer_contingencies
-- ---------------------------------------------------------------------------

CREATE TABLE public.offer_contingencies (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  org_id uuid NOT NULL,
  offer_round_id uuid NOT NULL,
  deal_id uuid NOT NULL,
  contingency_type text NOT NULL,
  label_override text,
  included_in_offer boolean DEFAULT true NOT NULL,
  waived_at_offer boolean DEFAULT false NOT NULL,
  days_offset integer,
  deadline_date date,
  response_due_date date,
  status text DEFAULT 'proposed'::text NOT NULL,
  waived_after_acceptance boolean DEFAULT false NOT NULL,
  resolved_date date,
  resolution_type text,
  notice_required boolean DEFAULT false,
  notice_sent_date date,
  type_specific_data jsonb,
  notes text,
  business_days_only boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT offer_contingencies_pkey PRIMARY KEY (id),
  CONSTRAINT offer_contingencies_contingency_type_check CHECK (
    contingency_type = ANY (ARRAY[
      'inspection_general'::text,
      'financing'::text,
      'appraisal'::text,
      'title'::text,
      'home_sale'::text,
      'hoa_review'::text,
      'condo_doc_review'::text,
      'insurance'::text,
      'attorney_review'::text,
      'radon'::text,
      'termite'::text,
      'septic'::text,
      'well_water'::text,
      'survey'::text,
      'lead_based_paint'::text,
      'mold_environmental'::text,
      'flood_insurance'::text,
      'sale_of_other_property'::text,
      'custom'::text
    ])
  ),
  CONSTRAINT offer_contingencies_status_check CHECK (
    status = ANY (ARRAY[
      'proposed'::text,
      'active'::text,
      'satisfied'::text,
      'waived'::text,
      'expired'::text,
      'failed'::text
    ])
  ),
  CONSTRAINT offer_contingencies_resolution_type_check CHECK (
    resolution_type IS NULL OR resolution_type = ANY (ARRAY[
      'satisfied'::text,
      'waived'::text,
      'negotiated_out'::text,
      'expired'::text,
      'terminated_deal'::text
    ])
  ),
  CONSTRAINT offer_contingencies_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id) ON DELETE CASCADE,
  CONSTRAINT offer_contingencies_offer_round_id_fkey FOREIGN KEY (offer_round_id) REFERENCES public.offer_rounds (id) ON DELETE CASCADE,
  CONSTRAINT offer_contingencies_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals (id) ON DELETE CASCADE
);

CREATE INDEX offer_contingencies_offer_round_id_idx ON public.offer_contingencies USING btree (offer_round_id);
CREATE INDEX offer_contingencies_deal_id_idx ON public.offer_contingencies USING btree (deal_id);
CREATE INDEX offer_contingencies_org_id_idx ON public.offer_contingencies USING btree (org_id);

-- ---------------------------------------------------------------------------
-- 6. deal_milestones
-- ---------------------------------------------------------------------------

CREATE TABLE public.deal_milestones (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  org_id uuid NOT NULL,
  deal_id uuid NOT NULL,
  milestone_type text NOT NULL,
  title text NOT NULL,
  due_date date NOT NULL,
  due_time text,
  days_offset integer,
  offset_basis text,
  status text DEFAULT 'pending'::text NOT NULL,
  responsible_party text,
  completed_at timestamp with time zone,
  contingency_id uuid,
  is_cfpb_required boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deal_milestones_pkey PRIMARY KEY (id),
  CONSTRAINT deal_milestones_status_check CHECK (
    status = ANY (ARRAY[
      'pending'::text,
      'in_progress'::text,
      'complete'::text,
      'overdue'::text,
      'waived'::text
    ])
  ),
  CONSTRAINT deal_milestones_offset_basis_check CHECK (
    offset_basis IS NULL OR offset_basis = ANY (ARRAY[
      'mutual_acceptance'::text,
      'closing_date_minus'::text,
      'fixed_date'::text
    ])
  ),
  CONSTRAINT deal_milestones_responsible_party_check CHECK (
    responsible_party IS NULL OR responsible_party = ANY (ARRAY[
      'buyer'::text,
      'seller'::text,
      'buyer_agent'::text,
      'seller_agent'::text,
      'lender'::text,
      'title_co'::text,
      'inspector'::text
    ])
  ),
  CONSTRAINT deal_milestones_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id) ON DELETE CASCADE,
  CONSTRAINT deal_milestones_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals (id) ON DELETE CASCADE,
  CONSTRAINT deal_milestones_contingency_id_fkey FOREIGN KEY (contingency_id) REFERENCES public.offer_contingencies (id) ON DELETE SET NULL
);

CREATE INDEX deal_milestones_deal_id_idx ON public.deal_milestones USING btree (deal_id);
CREATE INDEX deal_milestones_due_date_idx ON public.deal_milestones USING btree (due_date);
CREATE INDEX deal_milestones_status_idx ON public.deal_milestones USING btree (status);
CREATE INDEX deal_milestones_org_id_idx ON public.deal_milestones USING btree (org_id);

-- ---------------------------------------------------------------------------
-- 7. deal_amendments
-- ---------------------------------------------------------------------------

CREATE TABLE public.deal_amendments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  org_id uuid NOT NULL,
  deal_id uuid NOT NULL,
  amendment_type text,
  description text NOT NULL,
  effective_date date NOT NULL,
  old_value text,
  new_value text,
  signed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deal_amendments_pkey PRIMARY KEY (id),
  CONSTRAINT deal_amendments_amendment_type_check CHECK (
    amendment_type IS NULL OR amendment_type = ANY (ARRAY[
      'price_change'::text,
      'deadline_extension'::text,
      'repair_agreement'::text,
      'contingency_waiver'::text,
      'other'::text
    ])
  ),
  CONSTRAINT deal_amendments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id) ON DELETE CASCADE,
  CONSTRAINT deal_amendments_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals (id) ON DELETE CASCADE
);

CREATE INDEX deal_amendments_deal_id_idx ON public.deal_amendments USING btree (deal_id);
CREATE INDEX deal_amendments_org_id_idx ON public.deal_amendments USING btree (org_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

CREATE TRIGGER trg_prevent_org_id_change_deals BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();
CREATE TRIGGER trg_prevent_update_if_deleted_deals BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_prevent_org_id_change_offer_negotiations BEFORE UPDATE ON public.offer_negotiations FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();
CREATE TRIGGER update_offer_negotiations_updated_at BEFORE UPDATE ON public.offer_negotiations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_prevent_org_id_change_offer_rounds BEFORE UPDATE ON public.offer_rounds FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();
CREATE TRIGGER update_offer_rounds_updated_at BEFORE UPDATE ON public.offer_rounds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_prevent_org_id_change_offer_contingencies BEFORE UPDATE ON public.offer_contingencies FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();
CREATE TRIGGER update_offer_contingencies_updated_at BEFORE UPDATE ON public.offer_contingencies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_prevent_org_id_change_deal_milestones BEFORE UPDATE ON public.deal_milestones FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();
CREATE TRIGGER update_deal_milestones_updated_at BEFORE UPDATE ON public.deal_milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_prevent_org_id_change_deal_parties BEFORE UPDATE ON public.deal_parties FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();

CREATE TRIGGER trg_prevent_org_id_change_deal_amendments BEFORE UPDATE ON public.deal_amendments FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_contingencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_amendments ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_select_deals ON public.deals FOR SELECT USING (
  (deleted_at IS NULL) AND (org_id IN (SELECT public.get_user_org_ids() AS get_user_org_ids))
);

CREATE POLICY org_insert_deals ON public.deals FOR INSERT WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_update_deals ON public.deals FOR UPDATE USING (
  (deleted_at IS NULL) AND (org_id IN (SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id)
) WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_delete_deals ON public.deals FOR DELETE USING (false);

CREATE POLICY org_select_deal_parties ON public.deal_parties FOR SELECT USING (
  org_id IN (SELECT public.get_user_org_ids() AS get_user_org_ids)
);

CREATE POLICY org_insert_deal_parties ON public.deal_parties FOR INSERT WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_update_deal_parties ON public.deal_parties FOR UPDATE USING (
  (org_id IN (SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id)
) WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_delete_deal_parties ON public.deal_parties FOR DELETE USING (false);

CREATE POLICY org_select_offer_negotiations ON public.offer_negotiations FOR SELECT USING (
  org_id IN (SELECT public.get_user_org_ids() AS get_user_org_ids)
);

CREATE POLICY org_insert_offer_negotiations ON public.offer_negotiations FOR INSERT WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_update_offer_negotiations ON public.offer_negotiations FOR UPDATE USING (
  (org_id IN (SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id)
) WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_delete_offer_negotiations ON public.offer_negotiations FOR DELETE USING (false);

CREATE POLICY org_select_offer_rounds ON public.offer_rounds FOR SELECT USING (
  org_id IN (SELECT public.get_user_org_ids() AS get_user_org_ids)
);

CREATE POLICY org_insert_offer_rounds ON public.offer_rounds FOR INSERT WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_update_offer_rounds ON public.offer_rounds FOR UPDATE USING (
  (org_id IN (SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id)
) WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_delete_offer_rounds ON public.offer_rounds FOR DELETE USING (false);

CREATE POLICY org_select_offer_contingencies ON public.offer_contingencies FOR SELECT USING (
  org_id IN (SELECT public.get_user_org_ids() AS get_user_org_ids)
);

CREATE POLICY org_insert_offer_contingencies ON public.offer_contingencies FOR INSERT WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_update_offer_contingencies ON public.offer_contingencies FOR UPDATE USING (
  (org_id IN (SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id)
) WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_delete_offer_contingencies ON public.offer_contingencies FOR DELETE USING (false);

CREATE POLICY org_select_deal_milestones ON public.deal_milestones FOR SELECT USING (
  org_id IN (SELECT public.get_user_org_ids() AS get_user_org_ids)
);

CREATE POLICY org_insert_deal_milestones ON public.deal_milestones FOR INSERT WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_update_deal_milestones ON public.deal_milestones FOR UPDATE USING (
  (org_id IN (SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id)
) WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_delete_deal_milestones ON public.deal_milestones FOR DELETE USING (false);

CREATE POLICY org_select_deal_amendments ON public.deal_amendments FOR SELECT USING (
  org_id IN (SELECT public.get_user_org_ids() AS get_user_org_ids)
);

CREATE POLICY org_insert_deal_amendments ON public.deal_amendments FOR INSERT WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_update_deal_amendments ON public.deal_amendments FOR UPDATE USING (
  (org_id IN (SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id)
) WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_delete_deal_amendments ON public.deal_amendments FOR DELETE USING (false);
