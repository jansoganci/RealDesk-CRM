-- Sprint 6B — Allow `incomplete` when FHA/VA addendum is required but not yet uploaded.

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
        'cancelled'::text,
        'incomplete'::text
      ]
    )
  );

COMMENT ON COLUMN public.contracts.deal_status IS 'Sprint 6B: purchase deal lifecycle; incomplete = required addendum missing (e.g. FHA/VA).';
