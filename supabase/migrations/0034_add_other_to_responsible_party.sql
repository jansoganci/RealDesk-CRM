-- Allow 'other' for custom timeline milestones (TimelineTab responsible party select).

ALTER TABLE deal_milestones
DROP CONSTRAINT IF EXISTS deal_milestones_responsible_party_check;

ALTER TABLE deal_milestones
ADD CONSTRAINT deal_milestones_responsible_party_check
CHECK (
  responsible_party IS NULL
  OR responsible_party = ANY (ARRAY[
    'buyer'::text,
    'seller'::text,
    'buyer_agent'::text,
    'seller_agent'::text,
    'lender'::text,
    'title_co'::text,
    'inspector'::text,
    'other'::text
  ])
);
