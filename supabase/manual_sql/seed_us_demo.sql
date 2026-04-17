-- ============================================================================
-- MANUAL SEED — Supabase SQL Editor only (not part of numbered migrations)
-- US demo data: 10 owners, 10 properties (6 rental + 4 sale), 10 tenants
--
-- Demo user_id: 2c6dc4ec-50c5-4228-a183-ed5e40f0253a
-- Demo org_id : d47cc87a-5979-49c6-9b6a-497e09698d68
-- Run as a single transaction.
-- Not idempotent: fixed UUIDs — re-run only after deleting these rows or if IDs are free.
-- Phone numbers use 555 (fictional / reserved exchange for fiction).
-- ============================================================================

BEGIN;

-- Re-runnable cleanup for this demo seed (fixed UUID set)
DELETE FROM public.tenants
WHERE id::text LIKE 'c3000001-0000-4000-8000-0000000000%';

DELETE FROM public.properties
WHERE id::text LIKE 'b2000001-0000-4000-8000-0000000000%';

DELETE FROM public.property_owners
WHERE id::text LIKE 'a1000001-0000-4000-8000-0000000000%';

-- Fixed UUIDs so one file stays deterministic and readable
-- Owners
INSERT INTO public.property_owners (id, name, phone, email, address, user_id, org_id) VALUES
  ('a1000001-0000-4000-8000-000000000001', 'Marcus Thompson', '+1 (415) 555-0142', 'marcus.thompson@gmail.com', '1842 Pine Street, San Francisco, CA 94115', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('a1000001-0000-4000-8000-000000000002', 'Jennifer Walsh', '+1 (512) 555-0288', 'j.walsh.outlook@outlook.com', '903 Barton Creek Blvd, Austin, TX 78746', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('a1000001-0000-4000-8000-000000000003', 'David Chen', '+1 (718) 555-0315', 'david.chen.work@yahoo.com', '56 Court Street, Brooklyn, NY 11201', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('a1000001-0000-4000-8000-000000000004', 'Patricia O''Brien', '+1 (305) 555-0461', 'patricia.obrien@icloud.com', '2100 Brickell Ave, Miami, FL 33129', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('a1000001-0000-4000-8000-000000000005', 'James Rivera', '+1 (206) 555-0527', 'j.rivera.realestate@gmail.com', '4411 Fremont Ave N, Seattle, WA 98103', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('a1000001-0000-4000-8000-000000000006', 'Emily Foster', '+1 (303) 555-0694', 'emily.foster@proton.me', '2850 Zuni St, Denver, CO 80211', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('a1000001-0000-4000-8000-000000000007', 'Robert Kim', '+1 (312) 555-0738', 'robert.kim@live.com', '1645 W Jackson Blvd, Chicago, IL 60612', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('a1000001-0000-4000-8000-000000000008', 'Amanda Brooks', '+1 (602) 555-0816', 'amanda.brooks@gmail.com', '4747 N Central Ave, Phoenix, AZ 85012', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('a1000001-0000-4000-8000-000000000009', 'Michael Hayes', '+1 (404) 555-0943', 'michael.hayes@company.com', '1197 Peachtree St NE, Atlanta, GA 30309', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('a1000001-0000-4000-8000-00000000000a', 'Sarah Mitchell', '+1 (617) 555-0168', 'sarah.mitchell@icloud.com', '88 Broad Street, Boston, MA 02110', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68');

-- Properties: 6 rental (Empty / Occupied mix), 4 sale (Available)
INSERT INTO public.properties (
  id,
  owner_id,
  address,
  street_address,
  city,
  district,
  state,
  zip_code,
  status,
  property_type,
  currency,
  rent_amount,
  sale_price,
  user_id,
  org_id,
  type,
  year_built,
  full_address
) VALUES
  (
    'b2000001-0000-4000-8000-000000000001',
    'a1000001-0000-4000-8000-000000000001',
    '2450 Market St, Unit 4B, San Francisco, CA 94114',
    '2450 Market St',
    'San Francisco',
    'Castro',
    'CA',
    '94114',
    'Occupied',
    'rental',
    'USD',
    3850,
    NULL,
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    'apartment',
    1998,
    '2450 Market St, Unit 4B, San Francisco, CA 94114'
  ),
  (
    'b2000001-0000-4000-8000-000000000002',
    'a1000001-0000-4000-8000-000000000002',
    '1201 Barton Springs Rd, Austin, TX 78704',
    '1201 Barton Springs Rd',
    'Austin',
    'Zilker',
    'TX',
    '78704',
    'Empty',
    'rental',
    'USD',
    2650,
    NULL,
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    'house',
    2005,
    '1201 Barton Springs Rd, Austin, TX 78704'
  ),
  (
    'b2000001-0000-4000-8000-000000000003',
    'a1000001-0000-4000-8000-000000000003',
    '88 Montague St Apt 3C, Brooklyn, NY 11201',
    '88 Montague St',
    'Brooklyn',
    'Brooklyn Heights',
    'NY',
    '11201',
    'Occupied',
    'rental',
    'USD',
    3200,
    NULL,
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    'apartment',
    1924,
    '88 Montague St Apt 3C, Brooklyn, NY 11201'
  ),
  (
    'b2000001-0000-4000-8000-000000000004',
    'a1000001-0000-4000-8000-000000000004',
    '450 NE 2nd Ave, Miami, FL 33132',
    '450 NE 2nd Ave',
    'Miami',
    'Downtown',
    'FL',
    '33132',
    'Empty',
    'rental',
    'USD',
    2400,
    NULL,
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    'apartment',
    2016,
    '450 NE 2nd Ave, Miami, FL 33132'
  ),
  (
    'b2000001-0000-4000-8000-000000000005',
    'a1000001-0000-4000-8000-000000000005',
    '2200 Westlake Ave N, Seattle, WA 98109',
    '2200 Westlake Ave N',
    'Seattle',
    'South Lake Union',
    'WA',
    '98109',
    'Occupied',
    'rental',
    'USD',
    2950,
    NULL,
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    'apartment',
    2014,
    '2200 Westlake Ave N, Seattle, WA 98109'
  ),
  (
    'b2000001-0000-4000-8000-000000000006',
    'a1000001-0000-4000-8000-000000000006',
    '1776 Broadway, Denver, CO 80202',
    '1776 Broadway',
    'Denver',
    'Central Business District',
    'CO',
    '80202',
    'Empty',
    'rental',
    'USD',
    2200,
    NULL,
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    'apartment',
    2009,
    '1776 Broadway, Denver, CO 80202'
  ),
  (
    'b2000001-0000-4000-8000-000000000007',
    'a1000001-0000-4000-8000-000000000007',
    '233 S Wacker Dr, Chicago, IL 60606',
    '233 S Wacker Dr',
    'Chicago',
    'Loop',
    'IL',
    '60606',
    'Available',
    'sale',
    'USD',
    NULL,
    485000,
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    'apartment',
    1992,
    '233 S Wacker Dr, Chicago, IL 60606'
  ),
  (
    'b2000001-0000-4000-8000-000000000008',
    'a1000001-0000-4000-8000-000000000008',
    '2 N Central Ave, Phoenix, AZ 85004',
    '2 N Central Ave',
    'Phoenix',
    'Encanto',
    'AZ',
    '85004',
    'Available',
    'sale',
    'USD',
    NULL,
    395000,
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    'house',
    1987,
    '2 N Central Ave, Phoenix, AZ 85004'
  ),
  (
    'b2000001-0000-4000-8000-000000000009',
    'a1000001-0000-4000-8000-000000000009',
    '400 W Peachtree St NW, Atlanta, GA 30308',
    '400 W Peachtree St NW',
    'Atlanta',
    'Midtown',
    'GA',
    '30308',
    'Available',
    'sale',
    'USD',
    NULL,
    529000,
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    'apartment',
    2001,
    '400 W Peachtree St NW, Atlanta, GA 30308'
  ),
  (
    'b2000001-0000-4000-8000-00000000000a',
    'a1000001-0000-4000-8000-00000000000a',
    '1 Federal St, Boston, MA 02110',
    '1 Federal St',
    'Boston',
    'Financial District',
    'MA',
    '02110',
    'Available',
    'sale',
    'USD',
    NULL,
    715000,
    '2c6dc4ec-50c5-4228-a183-ed5e40f0253a',
    'd47cc87a-5979-49c6-9b6a-497e09698d68',
    'apartment',
    1988,
    '1 Federal St, Boston, MA 02110'
  );

INSERT INTO public.tenants (id, name, phone, email, address, user_id, org_id) VALUES
  ('c3000001-0000-4000-8000-000000000001', 'Tyler Brooks', '+1 (415) 555-7721', 'tyler.brooks@gmail.com', '2450 Market St, Unit 4B, San Francisco, CA 94114', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('c3000001-0000-4000-8000-000000000002', 'Nicole Carter', '+1 (737) 555-8834', 'nicole.carter@yahoo.com', '1201 Barton Springs Rd, Austin, TX 78704', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('c3000001-0000-4000-8000-000000000003', 'Brandon Lee', '+1 (917) 555-4410', 'brandon.lee@outlook.com', '88 Montague St Apt 3C, Brooklyn, NY 11201', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('c3000001-0000-4000-8000-000000000004', 'Rachel Simmons', '+1 (786) 555-2298', 'rachel.simmons@icloud.com', '450 NE 2nd Ave, Miami, FL 33132', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('c3000001-0000-4000-8000-000000000005', 'Kevin Ortiz', '+1 (206) 555-6650', 'kevin.ortiz@gmail.com', '2200 Westlake Ave N, Seattle, WA 98109', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('c3000001-0000-4000-8000-000000000006', 'Lauren Hughes', '+1 (720) 555-3381', 'lauren.hughes@proton.me', '1776 Broadway, Denver, CO 80202', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('c3000001-0000-4000-8000-000000000007', 'Jordan Price', '+1 (312) 555-9044', 'jordan.price@live.com', '914 W Armitage Ave, Chicago, IL 60614', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('c3000001-0000-4000-8000-000000000008', 'Megan Flores', '+1 (480) 555-5512', 'megan.flores@gmail.com', '3935 E Camelback Rd, Phoenix, AZ 85018', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('c3000001-0000-4000-8000-000000000009', 'Chris Andersen', '+1 (678) 555-7720', 'chris.andersen@company.com', '845 Juniper St NE, Atlanta, GA 30308', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68'),
  ('c3000001-0000-4000-8000-00000000000a', 'Ashley Wright', '+1 (857) 555-1189', 'ashley.wright@icloud.com', '42 Northern Ave, Boston, MA 02210', '2c6dc4ec-50c5-4228-a183-ed5e40f0253a', 'd47cc87a-5979-49c6-9b6a-497e09698d68');

COMMIT;
