-- Sprint 6B T13 — Counter-offer flow: prior round marked superseded when a new round is created.

ALTER TABLE public.offer_rounds DROP CONSTRAINT IF EXISTS offer_rounds_status_check;

ALTER TABLE public.offer_rounds ADD CONSTRAINT offer_rounds_status_check CHECK (
  status = ANY (
    ARRAY[
      'draft'::text,
      'submitted'::text,
      'verbal_accepted'::text,
      'mutual_acceptance'::text,
      'rejected'::text,
      'expired'::text,
      'withdrawn'::text,
      'superseded'::text
    ]
  )
);

COMMENT ON CONSTRAINT offer_rounds_status_check ON public.offer_rounds IS
  'Includes superseded when a newer offer_round replaces this row (Sprint 6B counter-offers).';
