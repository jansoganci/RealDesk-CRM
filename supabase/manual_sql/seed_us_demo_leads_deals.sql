-- ============================================================================
-- MANUAL SEED — Supabase SQL Editor only (not part of numbered migrations)
-- US demo data: Leads + Deals
--
-- Demo user_id: 2c6dc4ec-50c5-4228-a183-ed5e40f0253a
-- Demo org_id : d47cc87a-5979-49c6-9b6a-497e09698d68
-- Depends on properties from `seed_us_demo.sql` (b200... IDs)
-- Run as a single transaction.
-- Re-runnable for this fixed UUID set.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Re-runnable cleanup (children -> parents)
-- ---------------------------------------------------------------------------

UPDATE public.property_inquiries
SET deal_id = NULL
WHERE id::text LIKE 'd4000001-0000-4000-8000-0000000000%';

DELETE FROM public.offer_negotiations
WHERE id::text LIKE 'f6000001-0000-4000-8000-0000000000%';

DELETE FROM public.deals
WHERE id::text LIKE 'e5000001-0000-4000-8000-0000000000%';

DELETE FROM public.property_inquiries
WHERE id::text LIKE 'd4000001-0000-4000-8000-0000000000%';

-- ---------------------------------------------------------------------------
-- 1) Leads (property_inquiries)
-- ---------------------------------------------------------------------------

INSERT INTO public.property_inquiries (
  id,
  name,
  phone,
  email,
  inquiry_type,
  status,
  preferred_city,
  preferred_district,
  preferred_state,
  min_rent_budget,
  max_rent_budget,
  min_sale_budget,
  max_sale_budget,
  notes,
  user_id,
  org_id,
  lead_source,
  pre_approved
) VALUES
  ('d4000001-0000-4000-8000-000000000001', 'Olivia Parker', '+1 (415) 555-1201', 'olivia.parker@gmail.com', 'rental', 'new', 'San Francisco', 'Mission', 'CA', 2800, 3600, NULL, NULL, 'Moving in next 45 days. Wants pet-friendly unit.', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68', 'zillow', false),
  ('d4000001-0000-4000-8000-000000000002', 'Ethan Miller', '+1 (512) 555-1202', 'ethan.miller@outlook.com', 'rental', 'contacted', 'Austin', 'Zilker', 'TX', 2200, 2900, NULL, NULL, 'Prefers 2 bed and parking.', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68', 'realtor_com', true),
  ('d4000001-0000-4000-8000-000000000003', 'Sophia Nguyen', '+1 (718) 555-1203', 'sophia.nguyen@yahoo.com', 'rental', 'qualified', 'Brooklyn', 'Brooklyn Heights', 'NY', 3000, 3800, NULL, NULL, 'Close to subway and low noise preferred.', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68', 'referral', true),
  ('d4000001-0000-4000-8000-000000000004', 'Liam Johnson', '+1 (305) 555-1204', 'liam.johnson@icloud.com', 'rental', 'matched', 'Miami', 'Downtown', 'FL', 2100, 2800, NULL, NULL, 'Wants gym + in-unit laundry.', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68', 'social_media', false),
  ('d4000001-0000-4000-8000-000000000005', 'Ava Martinez', '+1 (206) 555-1205', 'ava.martinez@gmail.com', 'rental', 'under_contract', 'Seattle', 'South Lake Union', 'WA', 2600, 3200, NULL, NULL, 'Ready to sign quickly for right unit.', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68', 'open_house', true),
  ('d4000001-0000-4000-8000-000000000006', 'Noah Davis', '+1 (303) 555-1206', 'noah.davis@proton.me', 'rental', 'closed_won', 'Denver', 'Central Business District', 'CO', 1900, 2500, NULL, NULL, 'Lease signed in principle.', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68', 'other', true),
  ('d4000001-0000-4000-8000-000000000007', 'Mason Clark', '+1 (312) 555-1207', 'mason.clark@live.com', 'sale', 'active', 'Chicago', 'Loop', 'IL', NULL, NULL, 420000, 520000, 'First-time buyer. Prefers condo with doorman.', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68', 'zillow', true),
  ('d4000001-0000-4000-8000-000000000008', 'Isabella Lewis', '+1 (602) 555-1208', 'isabella.lewis@gmail.com', 'sale', 'matched', 'Phoenix', 'Encanto', 'AZ', NULL, NULL, 330000, 430000, 'Needs backyard for dog.', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68', 'referral', true),
  ('d4000001-0000-4000-8000-000000000009', 'Lucas Walker', '+1 (404) 555-1209', 'lucas.walker@company.com', 'sale', 'contacted', 'Atlanta', 'Midtown', 'GA', NULL, NULL, 470000, 560000, 'Relocating for work in 3 months.', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68', 'cold_call', false),
  ('d4000001-0000-4000-8000-00000000000a', 'Mia Hall', '+1 (617) 555-1210', 'mia.hall@icloud.com', 'sale', 'qualified', 'Boston', 'Financial District', 'MA', NULL, NULL, 620000, 760000, 'Looking for strong resale value.', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68', 'realtor_com', true),
  ('d4000001-0000-4000-8000-00000000000b', 'James Young', '+1 (713) 555-1211', 'james.young@yahoo.com', 'sale', 'closed_lost', 'Austin', 'Downtown', 'TX', NULL, NULL, 350000, 460000, 'Paused purchase due to financing concerns.', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68', 'other', false),
  ('d4000001-0000-4000-8000-00000000000c', 'Charlotte King', '+1 (646) 555-1212', 'charlotte.king@outlook.com', 'sale', 'converted', 'Chicago', 'Loop', 'IL', NULL, NULL, 480000, 610000, 'Already discussing offer strategy.', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68', 'sign_call', true);

-- ---------------------------------------------------------------------------
-- 2) Deals
-- ---------------------------------------------------------------------------

INSERT INTO public.deals (
  id,
  org_id,
  user_id,
  lead_id,
  property_id,
  deal_name,
  deal_type,
  client_role,
  deal_stage,
  financing_type,
  preapproval_status,
  list_price,
  intended_offer_price,
  accepted_offer_price,
  earnest_money_planned,
  projected_close_date,
  notes
) VALUES
  (
    'e5000001-0000-4000-8000-000000000001',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd4000001-0000-4000-8000-000000000007',
    'b2000001-0000-4000-8000-000000000007',
    'Mason Clark - Chicago Purchase',
    'sale',
    'buyer',
    'negotiating',
    'conventional',
    'approved',
    485000,
    475000,
    NULL,
    7500,
    CURRENT_DATE + INTERVAL '35 days',
    'Buyer reviewing seller counter terms.'
  ),
  (
    'e5000001-0000-4000-8000-000000000002',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd4000001-0000-4000-8000-000000000008',
    'b2000001-0000-4000-8000-000000000008',
    'Isabella Lewis - Phoenix Offer',
    'sale',
    'buyer',
    'under_contract',
    'fha',
    'approved',
    395000,
    388000,
    390000,
    6000,
    CURRENT_DATE + INTERVAL '24 days',
    'Inspection contingency active.'
  ),
  (
    'e5000001-0000-4000-8000-000000000003',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd4000001-0000-4000-8000-000000000005',
    'b2000001-0000-4000-8000-000000000005',
    'Ava Martinez - Seattle Lease',
    'rental',
    'buyer',
    'pending',
    NULL,
    'approved',
    2950,
    2950,
    2950,
    1000,
    CURRENT_DATE + INTERVAL '10 days',
    'Landlord final docs in progress.'
  ),
  (
    'e5000001-0000-4000-8000-000000000004',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd4000001-0000-4000-8000-000000000006',
    'b2000001-0000-4000-8000-000000000006',
    'Noah Davis - Denver Lease Close',
    'rental',
    'buyer',
    'closed_won',
    NULL,
    'approved',
    2200,
    2200,
    2200,
    800,
    CURRENT_DATE - INTERVAL '5 days',
    'Lease executed successfully.'
  ),
  (
    'e5000001-0000-4000-8000-000000000005',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd4000001-0000-4000-8000-00000000000a',
    'b2000001-0000-4000-8000-00000000000a',
    'Mia Hall - Boston Purchase',
    'sale',
    'buyer',
    'offer_prep',
    'cash',
    'in_progress',
    715000,
    700000,
    NULL,
    12000,
    CURRENT_DATE + INTERVAL '42 days',
    'Initial strategy session completed.'
  ),
  (
    'e5000001-0000-4000-8000-000000000006',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd4000001-0000-4000-8000-00000000000c',
    'b2000001-0000-4000-8000-000000000009',
    'Charlotte King - Atlanta Offer',
    'sale',
    'buyer',
    'fell_through',
    'conventional',
    'denied',
    529000,
    510000,
    NULL,
    9000,
    CURRENT_DATE - INTERVAL '2 days',
    'Deal stopped after financing denial.'
  );

-- ---------------------------------------------------------------------------
-- 3) Link leads back to deals (for convert flow compatibility)
-- ---------------------------------------------------------------------------

UPDATE public.property_inquiries
SET deal_id = 'e5000001-0000-4000-8000-000000000001'
WHERE id = 'd4000001-0000-4000-8000-000000000007';

UPDATE public.property_inquiries
SET deal_id = 'e5000001-0000-4000-8000-000000000002'
WHERE id = 'd4000001-0000-4000-8000-000000000008';

UPDATE public.property_inquiries
SET deal_id = 'e5000001-0000-4000-8000-000000000003'
WHERE id = 'd4000001-0000-4000-8000-000000000005';

UPDATE public.property_inquiries
SET deal_id = 'e5000001-0000-4000-8000-000000000004'
WHERE id = 'd4000001-0000-4000-8000-000000000006';

UPDATE public.property_inquiries
SET deal_id = 'e5000001-0000-4000-8000-000000000005'
WHERE id = 'd4000001-0000-4000-8000-00000000000a';

UPDATE public.property_inquiries
SET deal_id = 'e5000001-0000-4000-8000-000000000006'
WHERE id = 'd4000001-0000-4000-8000-00000000000c';

-- ---------------------------------------------------------------------------
-- 4) Offer sessions (optional but useful for deal detail screens)
-- ---------------------------------------------------------------------------

INSERT INTO public.offer_negotiations (
  id,
  org_id,
  user_id,
  deal_id,
  status
) VALUES
  ('f6000001-0000-4000-8000-000000000001', 'd47cc87a-5979-49c6-9b6a-497e09698d68', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'e5000001-0000-4000-8000-000000000001', 'active'),
  ('f6000001-0000-4000-8000-000000000002', 'd47cc87a-5979-49c6-9b6a-497e09698d68', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'e5000001-0000-4000-8000-000000000002', 'accepted'),
  ('f6000001-0000-4000-8000-000000000003', 'd47cc87a-5979-49c6-9b6a-497e09698d68', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'e5000001-0000-4000-8000-000000000003', 'active'),
  ('f6000001-0000-4000-8000-000000000004', 'd47cc87a-5979-49c6-9b6a-497e09698d68', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'e5000001-0000-4000-8000-000000000004', 'accepted'),
  ('f6000001-0000-4000-8000-000000000005', 'd47cc87a-5979-49c6-9b6a-497e09698d68', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'e5000001-0000-4000-8000-000000000005', 'active'),
  ('f6000001-0000-4000-8000-000000000006', 'd47cc87a-5979-49c6-9b6a-497e09698d68', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'e5000001-0000-4000-8000-000000000006', 'rejected');

COMMIT;

