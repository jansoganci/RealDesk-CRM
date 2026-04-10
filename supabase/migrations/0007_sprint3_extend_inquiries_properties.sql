-- Sprint 3 T2: Link leads and listings to deals (soft FKs; no cascade delete)

-- ---------------------------------------------------------------------------
-- property_inquiries — originating deal when lead is converted
-- ---------------------------------------------------------------------------

ALTER TABLE public.property_inquiries
  ADD COLUMN deal_id uuid;

ALTER TABLE public.property_inquiries
  ADD CONSTRAINT property_inquiries_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals (id) ON DELETE SET NULL;

CREATE INDEX idx_property_inquiries_deal_id ON public.property_inquiries USING btree (deal_id);

COMMENT ON COLUMN public.property_inquiries.deal_id IS 'Sprint 3: linked deal after Convert to Deal. Soft reference; lead row is retained.';

-- ---------------------------------------------------------------------------
-- properties — sale pipeline timestamps + current active contract deal
-- sold_at already exists in baseline (see 0001_baseline_from_legacy.sql)
-- ---------------------------------------------------------------------------

ALTER TABLE public.properties
  ADD COLUMN under_offer_at timestamp with time zone,
  ADD COLUMN under_contract_deal_id uuid;

ALTER TABLE public.properties
  ADD CONSTRAINT properties_under_contract_deal_id_fkey FOREIGN KEY (under_contract_deal_id) REFERENCES public.deals (id) ON DELETE SET NULL;

CREATE INDEX idx_properties_under_contract_deal_id ON public.properties USING btree (under_contract_deal_id);
CREATE INDEX idx_properties_under_offer_at ON public.properties USING btree (under_offer_at);

COMMENT ON COLUMN public.properties.under_offer_at IS 'Sprint 3: set when a deal reaches mutual acceptance (MLS-aligned marketing status).';
COMMENT ON COLUMN public.properties.under_contract_deal_id IS 'Sprint 3: current active deal for this listing; previous deals remain in deals table.';
