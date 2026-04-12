-- Sprint 6B T5 — Purchase agreements do not use tenants; allow NULL tenant_id when contract_type = 'purchase'.

ALTER TABLE public.contracts
  ALTER COLUMN tenant_id DROP NOT NULL;

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_tenant_required_for_lease;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_tenant_required_for_lease CHECK (
    (contract_type <> 'lease'::text) OR (tenant_id IS NOT NULL)
  );

COMMENT ON COLUMN public.contracts.tenant_id IS 'Required for lease contracts; NULL for purchase / non-tenant contract types.';
