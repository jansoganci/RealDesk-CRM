# RLS Security Verification Queries

> **Document Type:** Security Test Suite
> **Date:** 2025-12-31
> **Purpose:** Verify all security fixes are working correctly

---

## Prerequisites

Before running these tests, ensure:
1. All migrations have been applied
2. You have at least 2 test users in different orgs
3. You have at least 1 test user as member (not owner) in an org

---

## Test Data Setup

```sql
-- Create test users (run as admin/service role)
-- Note: In real testing, create users via auth.signUp() or Supabase Dashboard

-- Get existing org/user data for testing
SELECT
  o.id as org_id,
  o.name as org_name,
  om.user_id,
  om.role,
  om.status
FROM organizations o
JOIN org_members om ON om.org_id = o.id
LIMIT 10;

-- Note down:
-- OWNER_USER_UUID: A user with role='owner'
-- MEMBER_USER_UUID: A user with role='member' (same org as owner)
-- OTHER_ORG_USER_UUID: A user in a different org
-- TEST_ORG_UUID: The org they belong to
-- OTHER_ORG_UUID: A different org
```

---

## C1: Organization INSERT Restriction Test

**Objective:** Verify users cannot create organizations directly.

```sql
-- Test as authenticated user (should FAIL)
SET LOCAL request.jwt.claims = '{"sub": "OWNER_USER_UUID"}';

-- Attempt to create organization directly
INSERT INTO organizations (name, slug)
VALUES ('Malicious Org', 'malicious-slug-123');

-- Expected: ERROR - new row violates row-level security policy
-- (Because auth.uid() IS NOT NULL, policy blocks insert)
```

**Pass Criteria:** INSERT fails with RLS violation.

---

## C2: Soft-Delete UPDATE Guard Test

**Objective:** Verify soft-deleted records cannot be updated.

```sql
-- Setup: Create and soft-delete a test property
SET LOCAL request.jwt.claims = '{"sub": "OWNER_USER_UUID"}';

-- First, create a test property
INSERT INTO properties (title, org_id, user_id, status, property_type, listing_type)
VALUES ('Test Property C2', 'TEST_ORG_UUID', 'OWNER_USER_UUID', 'available', 'apartment', 'sale')
RETURNING id;
-- Note the returned ID as TEST_PROPERTY_ID

-- Soft-delete it
UPDATE properties SET deleted_at = now() WHERE id = 'TEST_PROPERTY_ID';

-- Now try to update the soft-deleted record (should FAIL)
UPDATE properties SET title = 'Resurrected Property' WHERE id = 'TEST_PROPERTY_ID';

-- Expected: 0 rows updated (policy filters out deleted records)

-- Verify it's still soft-deleted
SELECT id, title, deleted_at FROM properties WHERE id = 'TEST_PROPERTY_ID';
-- Will return nothing because SELECT policy also filters deleted_at

-- Check with service role to verify it exists
-- (Run as admin): SELECT * FROM properties WHERE id = 'TEST_PROPERTY_ID';
```

**Pass Criteria:** UPDATE affects 0 rows for soft-deleted records.

---

## C2-Resurrect: Cannot Resurrect Deleted Records

**Objective:** Verify owner cannot set deleted_at = NULL to resurrect records.

```sql
SET LOCAL request.jwt.claims = '{"sub": "OWNER_USER_UUID"}';

-- Try to resurrect by setting deleted_at = NULL (should have no effect)
UPDATE properties
SET deleted_at = NULL
WHERE id = 'TEST_PROPERTY_ID';

-- Expected: 0 rows updated
-- The USING clause filters out deleted records before UPDATE runs
```

**Pass Criteria:** Cannot resurrect soft-deleted records.

---

## C3: Hard Delete Block Test

**Objective:** Verify hard DELETE is completely blocked.

```sql
SET LOCAL request.jwt.claims = '{"sub": "OWNER_USER_UUID"}';

-- Try to hard delete a property (should FAIL)
DELETE FROM properties WHERE org_id = 'TEST_ORG_UUID';

-- Expected: ERROR - new row violates row-level security policy
-- Or: 0 rows deleted

-- Try on each table type
DELETE FROM tenants WHERE org_id = 'TEST_ORG_UUID' LIMIT 1;
DELETE FROM contracts WHERE org_id = 'TEST_ORG_UUID' LIMIT 1;
DELETE FROM meetings WHERE org_id = 'TEST_ORG_UUID' LIMIT 1;

-- All should fail or return 0 rows
```

**Pass Criteria:** DELETE always fails or returns 0 rows.

---

## M1: First Member Race Condition Test

**Objective:** Verify only self can be first member of new org.

```sql
SET LOCAL request.jwt.claims = '{"sub": "OWNER_USER_UUID"}';

-- Scenario 1: User tries to add THEMSELVES as first member of new org
-- This requires first creating an org (which only trigger can do)
-- So this test verifies the trigger path works

-- Scenario 2: User tries to add SOMEONE ELSE as first member
-- First, we need a fresh org (created by trigger)
-- Then try to add a different user to an org where no members exist

-- This is hard to test directly because org creation is trigger-only
-- Instead, verify the policy logic:

-- Try to insert yourself into an org you don't belong to (should FAIL)
INSERT INTO org_members (org_id, user_id, role, status, joined_at)
VALUES ('OTHER_ORG_UUID', 'OWNER_USER_UUID', 'member', 'active', now());

-- Expected: ERROR - violates RLS policy
-- (NOT EXISTS check fails because OTHER_ORG already has members,
--  and user is not owner of OTHER_ORG)
```

**Pass Criteria:** Cannot join org without invitation from owner.

---

## M2: Property Photos Soft-Delete Parent Test

**Objective:** Verify cannot upload photos to soft-deleted properties.

```sql
SET LOCAL request.jwt.claims = '{"sub": "OWNER_USER_UUID"}';

-- Get a soft-deleted property ID (from C2 test above, or create new)
-- Assuming TEST_PROPERTY_ID is soft-deleted

-- Try to upload photo to soft-deleted property (should FAIL)
INSERT INTO property_photos (property_id, url, is_cover)
VALUES ('TEST_PROPERTY_ID', 'https://example.com/photo.jpg', false);

-- Expected: ERROR - new row violates row-level security policy
-- (Because parent property has deleted_at IS NOT NULL)

-- Verify by trying on a NON-deleted property (should WORK)
-- First create a non-deleted property
INSERT INTO properties (title, org_id, user_id, status, property_type, listing_type)
VALUES ('Active Property', 'TEST_ORG_UUID', 'OWNER_USER_UUID', 'available', 'apartment', 'sale')
RETURNING id;
-- Note ID as ACTIVE_PROPERTY_ID

INSERT INTO property_photos (property_id, url, is_cover)
VALUES ('ACTIVE_PROPERTY_ID', 'https://example.com/photo.jpg', false);

-- Expected: SUCCESS
```

**Pass Criteria:** Photos only insertable to non-deleted properties.

---

## L3: Org ID Immutability Test

**Objective:** Verify org_id cannot be changed during UPDATE.

```sql
SET LOCAL request.jwt.claims = '{"sub": "OWNER_USER_UUID"}';

-- Try to move a property to a different org (should FAIL)
UPDATE properties
SET org_id = 'OTHER_ORG_UUID'
WHERE id = 'ACTIVE_PROPERTY_ID';

-- Expected: ERROR - new row violates row-level security policy
-- (WITH CHECK fails because user is not owner of OTHER_ORG)

-- Verify property still in original org
SELECT id, org_id FROM properties WHERE id = 'ACTIVE_PROPERTY_ID';
-- Should show TEST_ORG_UUID
```

**Pass Criteria:** Cannot transfer records between orgs.

---

## Cross-Org Isolation Test

**Objective:** Verify complete data isolation between orgs.

```sql
-- Test as user in Org A
SET LOCAL request.jwt.claims = '{"sub": "OWNER_USER_UUID"}';

SELECT COUNT(*) as my_org_properties FROM properties;
-- Should return count of TEST_ORG properties only

-- Verify cannot see other org's data
SELECT * FROM properties WHERE org_id = 'OTHER_ORG_UUID';
-- Should return 0 rows

-- Test as user in Org B
SET LOCAL request.jwt.claims = '{"sub": "OTHER_ORG_USER_UUID"}';

SELECT * FROM properties WHERE org_id = 'TEST_ORG_UUID';
-- Should return 0 rows (cannot see Org A's data)
```

**Pass Criteria:** Users see only their own org's data.

---

## Member Read-Only Test

**Objective:** Verify members cannot write, only read.

```sql
SET LOCAL request.jwt.claims = '{"sub": "MEMBER_USER_UUID"}';

-- Test SELECT (should WORK)
SELECT * FROM properties WHERE org_id = 'TEST_ORG_UUID';
-- Should return properties

-- Test INSERT (should FAIL)
INSERT INTO properties (title, org_id, user_id, status, property_type, listing_type)
VALUES ('Member Property', 'TEST_ORG_UUID', 'MEMBER_USER_UUID', 'available', 'apartment', 'sale');
-- Expected: ERROR - new row violates row-level security policy

-- Test UPDATE (should FAIL)
UPDATE properties SET title = 'Member Update' WHERE org_id = 'TEST_ORG_UUID';
-- Expected: 0 rows updated

-- Test DELETE (should FAIL - blocked for everyone anyway)
DELETE FROM properties WHERE org_id = 'TEST_ORG_UUID';
-- Expected: ERROR or 0 rows
```

**Pass Criteria:** Members can only SELECT, not INSERT/UPDATE/DELETE.

---

## New User Signup Test

**Objective:** Verify new user gets org automatically.

```sql
-- This must be tested through the app signup flow
-- After signup, verify:

-- 1. Check organization was created
SELECT * FROM organizations WHERE slug = 'NEW_USER_UUID';
-- Should return 1 row

-- 2. Check user is owner of their org
SELECT * FROM org_members
WHERE user_id = 'NEW_USER_UUID'
  AND role = 'owner'
  AND status = 'active';
-- Should return 1 row

-- 3. Check user can create data in their org
SET LOCAL request.jwt.claims = '{"sub": "NEW_USER_UUID"}';

INSERT INTO properties (title, org_id, user_id, status, property_type, listing_type)
SELECT 'New User Property', o.id, 'NEW_USER_UUID', 'available', 'apartment', 'sale'
FROM organizations o WHERE slug = 'NEW_USER_UUID';
-- Should succeed
```

**Pass Criteria:** New signup creates org + owner membership automatically.

---

## Complete Test Checklist

Run all tests and check off:

- [ ] C1: Org INSERT blocked for users
- [ ] C2: Soft-deleted records cannot be updated
- [ ] C2-Resurrect: Cannot set deleted_at = NULL
- [ ] C3: Hard DELETE blocked on all tables
- [ ] M1: Cannot add others as first member
- [ ] M2: Cannot upload photos to deleted properties
- [ ] L3: Cannot change org_id during update
- [ ] Cross-Org: Complete data isolation
- [ ] Member: Read-only access enforced
- [ ] New User: Auto-org creation works

---

## Cleanup

```sql
-- Clean up test data (run as admin)
DELETE FROM property_photos WHERE url LIKE '%example.com%';
DELETE FROM properties WHERE title LIKE 'Test%' OR title LIKE 'Active%' OR title LIKE 'New User%';
```

---

*Last updated: 2025-12-31*
