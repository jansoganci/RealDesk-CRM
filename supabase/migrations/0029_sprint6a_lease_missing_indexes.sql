-- Sprint 6A audit follow-up — add missing lease_details indexes.

CREATE INDEX IF NOT EXISTS lease_details_contract_id_idx
  ON public.lease_details (contract_id);

CREATE INDEX IF NOT EXISTS lease_details_state_idx
  ON public.lease_details (property_state);
