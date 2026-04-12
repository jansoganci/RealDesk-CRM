-- Sprint 6A T1 — Lease Agreement Wizard: extend contracts; ensure properties.year_built (idempotent).
-- landlord_id references property_owners (US owners table).

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS year_built integer;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS lease_type text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS after_term_action text,
  ADD COLUMN IF NOT EXISTS termination_notice_days integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS contract_type text NOT NULL DEFAULT 'lease',
  ADD COLUMN IF NOT EXISTS landlord_id uuid,
  ADD COLUMN IF NOT EXISTS prior_contract_id uuid,
  ADD COLUMN IF NOT EXISTS pdf_generated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS wizard_completed boolean NOT NULL DEFAULT false;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_lease_type_check CHECK (
    lease_type = ANY (ARRAY['standard'::text, 'month_to_month'::text])
  );

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_contract_type_check CHECK (
    contract_type = ANY (ARRAY['lease'::text, 'purchase'::text, 'buyer_agent'::text])
  );

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_after_term_action_check CHECK (
    after_term_action IS NULL
    OR after_term_action = ANY (
      ARRAY['terminate'::text, 'convert_to_month_to_month'::text]
    )
  );

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.property_owners(id) ON DELETE SET NULL;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_prior_contract_id_fkey FOREIGN KEY (prior_contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_landlord_id ON public.contracts (landlord_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_prior_contract_id ON public.contracts (prior_contract_id)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.contracts.lease_type IS 'Lease term mode: standard fixed term vs month_to-month.';
COMMENT ON COLUMN public.contracts.after_term_action IS 'After standard term ends: terminate or convert to month-to-month.';
COMMENT ON COLUMN public.contracts.termination_notice_days IS 'Notice days for month-to-month termination (wizard default 30).';
COMMENT ON COLUMN public.contracts.contract_type IS 'Distinguishes lease vs future purchase / buyer-agent records.';
COMMENT ON COLUMN public.contracts.landlord_id IS 'Optional link to property_owners; landlord may be inline in lease_details.';
COMMENT ON COLUMN public.contracts.prior_contract_id IS 'Previous contract when this row is a renewal.';
COMMENT ON COLUMN public.contracts.pdf_generated_at IS 'Last successful US lease PDF generation time.';
COMMENT ON COLUMN public.contracts.wizard_completed IS 'True when all 8 lease wizard steps were submitted.';
