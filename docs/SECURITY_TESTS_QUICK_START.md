# 🔒 Security Tests Quick Start Guide

> **Purpose:** Run RLS security verification tests quickly and easily  
> **Time:** ~15-20 minutes  
> **Prerequisites:** Supabase Dashboard access, 2+ test users

---

## 🎯 What We're Testing

1. ✅ Users cannot create organizations directly
2. ✅ Soft-deleted records cannot be updated
3. ✅ Hard DELETE is blocked
4. ✅ Members have read-only access
5. ✅ Cross-org data isolation
6. ✅ org_id cannot be changed
7. ✅ Property photos respect soft-delete

---

## 📋 Step 1: Get Your Test Users

Run this in **Supabase Dashboard → SQL Editor**:

```sql
-- Get test users and orgs
SELECT
  o.id as org_id,
  o.name as org_name,
  om.user_id,
  u.email,
  om.role,
  om.status
FROM organizations o
JOIN org_members om ON om.org_id = o.id
JOIN auth.users u ON u.id = om.user_id
WHERE om.status = 'active'
ORDER BY om.role, o.created_at
LIMIT 20;
```

**Note down:**
- `OWNER_USER_ID`: A user with `role='owner'`
- `OWNER_ORG_ID`: Their org ID
- `MEMBER_USER_ID`: A user with `role='member'` (same org) - *optional*
- `OTHER_ORG_USER_ID`: A user in a different org - *optional*

---

## 🧪 Step 2: Run Tests

### Test 1: Organization INSERT Blocked ✅

**As:** Any authenticated user (use Supabase Dashboard with your account)

```sql
-- This should FAIL with RLS error
INSERT INTO organizations (name, slug)
VALUES ('Test Org', 'test-org-' || gen_random_uuid()::text);
```

**Expected:** Error like `new row violates row-level security policy`

**✅ Pass if:** INSERT fails  
**❌ Fail if:** INSERT succeeds

---

### Test 2: Soft-Delete Protection ✅

**As:** Owner user (login as owner in Supabase Dashboard)

```sql
-- Replace OWNER_ORG_ID and OWNER_USER_ID with actual values
DO $$
DECLARE
  test_property_id UUID;
  rows_updated INT;
BEGIN
  -- Create test property
  INSERT INTO properties (title, org_id, user_id, status, property_type, listing_type)
  VALUES ('Test Soft Delete', 'OWNER_ORG_ID', 'OWNER_USER_ID', 'available', 'apartment', 'sale')
  RETURNING id INTO test_property_id;

  -- Soft-delete it
  UPDATE properties SET deleted_at = now() WHERE id = test_property_id;

  -- Try to update (should affect 0 rows)
  UPDATE properties 
  SET title = 'Resurrected' 
  WHERE id = test_property_id;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  IF rows_updated = 0 THEN
    RAISE NOTICE '✅ PASSED: Soft-deleted records cannot be updated';
  ELSE
    RAISE WARNING '❌ FAILED: Updated % rows (expected 0)', rows_updated;
  END IF;

  -- Cleanup (as service role)
  -- DELETE FROM properties WHERE id = test_property_id;
END $$;
```

**✅ Pass if:** `rows_updated = 0`  
**❌ Fail if:** `rows_updated > 0`

---

### Test 3: Hard DELETE Blocked ✅

**As:** Owner user

```sql
-- Replace OWNER_ORG_ID with actual value
-- This should FAIL or return 0 rows
DELETE FROM properties WHERE org_id = 'OWNER_ORG_ID' LIMIT 1;
```

**Expected:** Error or `0 rows deleted`

**✅ Pass if:** DELETE fails or affects 0 rows  
**❌ Fail if:** DELETE succeeds

---

### Test 4: Cross-Org Isolation ✅

**As:** Owner user

```sql
-- Replace OTHER_ORG_ID with actual value from a different org
SELECT COUNT(*) as visible_count
FROM properties
WHERE org_id = 'OTHER_ORG_ID';
```

**Expected:** `visible_count = 0`

**✅ Pass if:** Cannot see other org's data  
**❌ Fail if:** Can see other org's data

---

### Test 5: Member Read-Only Access ✅

**As:** Member user (login as member in Supabase Dashboard)

```sql
-- Replace OWNER_ORG_ID and MEMBER_USER_ID with actual values

-- Test SELECT (should work)
SELECT COUNT(*) as visible_count
FROM properties
WHERE org_id = 'OWNER_ORG_ID';
-- Should return a number > 0

-- Test INSERT (should FAIL)
INSERT INTO properties (title, org_id, user_id, status, property_type, listing_type)
VALUES ('Member Property', 'OWNER_ORG_ID', 'MEMBER_USER_ID', 'available', 'apartment', 'sale');
-- Expected: RLS error

-- Test UPDATE (should affect 0 rows)
UPDATE properties 
SET title = 'Member Update' 
WHERE org_id = 'OWNER_ORG_ID'
LIMIT 1;
-- Check ROW_COUNT = 0
```

**✅ Pass if:** Can SELECT, but INSERT fails and UPDATE affects 0 rows  
**❌ Fail if:** Can INSERT or UPDATE

---

### Test 6: Org ID Immutability ✅

**As:** Owner user

```sql
-- Replace OWNER_ORG_ID, OTHER_ORG_ID, OWNER_USER_ID with actual values
DO $$
DECLARE
  test_property_id UUID;
  test_passed BOOLEAN := false;
BEGIN
  -- Create test property
  INSERT INTO properties (title, org_id, user_id, status, property_type, listing_type)
  VALUES ('Test Org ID', 'OWNER_ORG_ID', 'OWNER_USER_ID', 'available', 'apartment', 'sale')
  RETURNING id INTO test_property_id;

  BEGIN
    -- Try to change org_id (should fail)
    UPDATE properties
    SET org_id = 'OTHER_ORG_ID'
    WHERE id = test_property_id;
    
    test_passed := false;
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%row-level security%' OR SQLERRM LIKE '%policy%' THEN
        test_passed := true;
      END IF;
  END;

  IF test_passed THEN
    RAISE NOTICE '✅ PASSED: org_id cannot be changed';
  ELSE
    RAISE WARNING '❌ FAILED: org_id was changed (security issue!)';
  END IF;

  -- Cleanup
  -- DELETE FROM properties WHERE id = test_property_id;
END $$;
```

**✅ Pass if:** UPDATE fails with RLS error  
**❌ Fail if:** UPDATE succeeds

---

## 📊 Test Results Checklist

After running all tests, check off:

- [ ] **C1:** Organization INSERT blocked
- [ ] **C2:** Soft-deleted records cannot be updated
- [ ] **C3:** Hard DELETE blocked
- [ ] **Cross-Org:** Data isolation works
- [ ] **Member:** Read-only access enforced
- [ ] **L3:** org_id immutability

---

## 🚨 If Tests Fail

1. **Check RLS policies exist:**
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('properties', 'organizations', 'org_members')
   ORDER BY tablename, policyname;
   ```

2. **Check policies are enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('properties', 'organizations', 'org_members');
   ```

3. **Review migration files:**
   - `supabase/migrations/20251231000006_org_phase2_create_new_rls.sql`
   - `supabase/migrations/20260104000001_hotfix_org_members_circular_rls.sql`

---

## 📝 Notes

- **User Context:** In Supabase Dashboard SQL Editor, you're authenticated as the user you logged in as. To test as different users, you need to:
  1. Log out and log in as that user, OR
  2. Use the Supabase client in your app with different user sessions

- **Service Role:** Some cleanup operations require service role. Use Supabase Dashboard → Settings → API → Service Role Key (be careful!)

- **Test Data:** Tests create temporary data. Clean up manually or use the cleanup queries in `ORG_SECURITY_VERIFICATION.md`

---

## 🔗 Related Files

- **Detailed tests:** `docs/ORG_SECURITY_VERIFICATION.md`
- **Test migration:** `supabase/migrations/20260105000000_security_verification_tests.sql`
- **Test script:** `scripts/run-security-tests.sh`

---

*Last updated: 2025-01-XX*


