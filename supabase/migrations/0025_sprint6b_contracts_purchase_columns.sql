-- Sprint 6B T1 — Purchase Agreement Wizard: extend contracts for purchase workflow.
-- Idempotent ADD COLUMN IF NOT EXISTS (runs after Sprint 6A 0021–0024).

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS effective_date date,
  ADD COLUMN IF NOT EXISTS closing_date date,
  ADD COLUMN IF NOT EXISTS purchase_price numeric(12, 2),
  ADD COLUMN IF NOT EXISTS earnest_money_amount numeric(10, 2),
  ADD COLUMN IF NOT EXISTS earnest_money_due_date date,
  ADD COLUMN IF NOT EXISTS governing_law_state text,
  ADD COLUMN IF NOT EXISTS deal_status text,
  ADD COLUMN IF NOT EXISTS buyer_name_2 text,
  ADD COLUMN IF NOT EXISTS seller_name_2 text,
  ADD COLUMN IF NOT EXISTS seller_id uuid;

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_deal_status_check;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_deal_status_check CHECK (
    deal_status IS NULL
    OR deal_status = ANY (
      ARRAY[
        'draft'::text,
        'active'::text,
        'under_contract'::text,
        'closed'::text,
        'cancelled'::text
      ]
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'contracts_seller_id_fkey'
  ) THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_seller_id_fkey
      FOREIGN KEY (seller_id) REFERENCES public.property_owners (id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_contracts_seller_id ON public.contracts (seller_id)
  WHERE deleted_at IS NULL AND seller_id IS NOT NULL;

COMMENT ON COLUMN public.contracts.effective_date IS 'Sprint 6B: agreement made date (purchase).';
COMMENT ON COLUMN public.contracts.closing_date IS 'Sprint 6B: target closing date (purchase + timeline).';
COMMENT ON COLUMN public.contracts.purchase_price IS 'Sprint 6B: total purchase price.';
COMMENT ON COLUMN public.contracts.earnest_money_amount IS 'Sprint 6B: earnest money deposit.';
COMMENT ON COLUMN public.contracts.earnest_money_due_date IS 'Sprint 6B: earnest money payment due date.';
COMMENT ON COLUMN public.contracts.governing_law_state IS 'Sprint 6B: 2-letter US state code for governing law.';
COMMENT ON COLUMN public.contracts.deal_status IS 'Sprint 6B: purchase deal lifecycle (draft through cancelled).';
COMMENT ON COLUMN public.contracts.buyer_name_2 IS 'Sprint 6B: optional second buyer display name.';
COMMENT ON COLUMN public.contracts.seller_name_2 IS 'Sprint 6B: optional second seller display name.';
COMMENT ON COLUMN public.contracts.seller_id IS 'Sprint 6B: optional link to primary seller (property_owners).';
