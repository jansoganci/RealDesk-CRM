-- Sprint 6B audit fixes:
-- 1) Ensure offer_rounds can link to contracts via optional FK.
-- 2) Add purchase_details join index used for contract-linked lookups.

ALTER TABLE public.offer_rounds
ADD COLUMN IF NOT EXISTS contract_id uuid
REFERENCES public.contracts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS offer_rounds_contract_id_idx
ON public.offer_rounds(contract_id);

CREATE INDEX IF NOT EXISTS purchase_details_closing_date_idx
ON public.purchase_details(contract_id);
