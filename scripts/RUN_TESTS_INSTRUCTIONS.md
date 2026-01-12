# 🚀 HOW TO RUN SECURITY TESTS - IMMEDIATE ACTION

## ⚠️ CRITICAL: These tests MUST run as authenticated user, NOT service role!

Supabase CLI uses service role which **bypasses RLS** - tests will not work correctly via CLI.

## ✅ CORRECT WAY TO RUN (2 minutes):

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/jglxczzxliaiigccavnb
   - Navigate to: **SQL Editor**

2. **Make sure you're logged in as:** `deneme@gmail.com` (owner user)

3. **Copy and paste ALL tests from:**
   - File: `scripts/run-security-tests-now.sql`
   - OR copy from `docs/READY_TO_RUN_SECURITY_TESTS.md`

4. **Click "Run"** - All 5 tests will execute

5. **Check output** for ✅ PASSED or ❌ FAILED messages

## 📋 Quick Copy-Paste (All 5 Tests):

```sql
-- TEST 1: Organization INSERT Blocked
INSERT INTO organizations (name, slug)
VALUES ('Test Org', 'test-org-' || gen_random_uuid()::text);

-- TEST 2: Soft-Delete Protection
DO $$
DECLARE
  owner_user_id UUID := '6d604b30-a2f3-446e-adc6-be07ab6ad83a';
  owner_org_id UUID := 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c';
  test_property_id UUID;
  rows_updated INT;
BEGIN
  INSERT INTO properties (title, org_id, user_id, status, property_type, listing_type)
  VALUES ('Test Soft Delete', owner_org_id, owner_user_id, 'available', 'apartment', 'sale')
  RETURNING id INTO test_property_id;
  RAISE NOTICE 'Created test property: %', test_property_id;
  UPDATE properties SET deleted_at = now() WHERE id = test_property_id;
  RAISE NOTICE 'Soft-deleted the property';
  UPDATE properties SET title = 'Resurrected' WHERE id = test_property_id;
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  IF rows_updated = 0 THEN
    RAISE NOTICE '✅ PASSED: Soft-deleted records cannot be updated';
  ELSE
    RAISE WARNING '❌ FAILED: Updated % rows (expected 0)', rows_updated;
  END IF;
END $$;

-- TEST 3: Hard DELETE Blocked
DO $$
DECLARE
  owner_org_id UUID := 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c';
  rows_deleted INT;
  test_passed BOOLEAN := false;
BEGIN
  BEGIN
    DELETE FROM properties WHERE org_id = owner_org_id LIMIT 1;
    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    IF rows_deleted = 0 THEN test_passed := true; END IF;
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%row-level security%' OR SQLERRM LIKE '%policy%' THEN
        test_passed := true;
      END IF;
  END;
  IF test_passed THEN
    RAISE NOTICE '✅ PASSED: Hard DELETE blocked';
  ELSE
    RAISE WARNING '❌ FAILED: Deleted % rows (expected 0 or error)', rows_deleted;
  END IF;
END $$;

-- TEST 4: Cross-Org Isolation
DO $$
DECLARE
  other_org_id UUID := 'ddfd3604-cd1f-4e8e-be28-78896320bd27';
  visible_count INT;
BEGIN
  SELECT COUNT(*) INTO visible_count FROM properties WHERE org_id = other_org_id;
  IF visible_count = 0 THEN
    RAISE NOTICE '✅ PASSED: Cannot see other org data';
  ELSE
    RAISE WARNING '❌ FAILED: Can see % properties from other org', visible_count;
  END IF;
END $$;

-- TEST 5: Org ID Immutability
DO $$
DECLARE
  owner_user_id UUID := '6d604b30-a2f3-446e-adc6-be07ab6ad83a';
  owner_org_id UUID := 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c';
  other_org_id UUID := 'ddfd3604-cd1f-4e8e-be28-78896320bd27';
  test_property_id UUID;
  test_passed BOOLEAN := false;
BEGIN
  INSERT INTO properties (title, org_id, user_id, status, property_type, listing_type)
  VALUES ('Test Org ID', owner_org_id, owner_user_id, 'available', 'apartment', 'sale')
  RETURNING id INTO test_property_id;
  RAISE NOTICE 'Created test property: %', test_property_id;
  BEGIN
    UPDATE properties SET org_id = other_org_id WHERE id = test_property_id;
    test_passed := false;
    RAISE WARNING '❌ FAILED: org_id UPDATE succeeded (should have been blocked)';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%row-level security%' OR SQLERRM LIKE '%policy%' THEN
        test_passed := true;
      ELSE
        RAISE WARNING '❌ FAILED: Unexpected error: %', SQLERRM;
      END IF;
  END;
  IF test_passed THEN
    RAISE NOTICE '✅ PASSED: org_id cannot be changed';
  ELSE
    RAISE WARNING '❌ FAILED: org_id was changed (security issue!)';
  END IF;
END $$;
```

## 🎯 Expected Results:

- **TEST 1:** Should FAIL with RLS error ✅
- **TEST 2:** Should show ✅ PASSED
- **TEST 3:** Should show ✅ PASSED  
- **TEST 4:** Should show ✅ PASSED
- **TEST 5:** Should show ✅ PASSED

## 🔗 Direct Links:

- **SQL Editor:** https://supabase.com/dashboard/project/jglxczzxliaiigccavnb/sql/new
- **Test File:** `scripts/run-security-tests-now.sql`

---

**DO THIS NOW:** Open SQL Editor → Paste all tests → Run → Check results!

