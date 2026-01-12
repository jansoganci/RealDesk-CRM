# 🔍 Properties Data Fetching Investigation Report

**Date:** January 2025  
**Issue:** Properties not appearing in UI (empty array returned)  
**Status:** Investigation Complete

---

## 📋 Executive Summary

Investigated four potential causes for properties not appearing:
1. ✅ **Data Fetching** - Correctly filters by `org_id`
2. ⚠️ **RLS Policies** - Policies look correct but need verification
3. ✅ **Data Integrity** - Contract creation properly sets `org_id`
4. 🔍 **Console Response** - Empty array suggests RLS filtering or missing `org_id`

**Primary Suspect:** RLS policy helper function `get_user_org_ids()` may not be returning the user's org_id, or properties exist without `org_id` set.

---

## 1. ✅ Data Fetching Analysis

### File: `src/services/properties.service.ts`

**Status:** ✅ **CORRECT**

The `getAll()` method correctly:
- Gets `org_id` from `getActiveOrgId()` helper
- Filters by `.eq('org_id', orgId)`
- Filters soft-deleted records `.is('deleted_at', null)`

```typescript
async getAll(): Promise<PropertyWithOwner[]> {
  const orgId = await getActiveOrgId();  // ✅ Gets org_id from OrgContext
  
  const { data, error } = await supabase
    .from('properties')
    .select(`...`)
    .eq('org_id', orgId)  // ✅ Filters by org_id
    .is('deleted_at', null)  // ✅ Excludes soft-deleted
    .order('created_at', { ascending: false })
    .limit(50);
}
```

**Comparison with Tenants Service:**
- Tenants service uses identical pattern: ✅
- Both use `getActiveOrgId()`: ✅
- Both filter by `org_id`: ✅

**Verdict:** Frontend filtering is correct. Issue is likely in RLS or data.

---

## 2. ⚠️ RLS Policies Analysis

### Latest Migration: `20260108000000_comprehensive_security_fix.sql`

**Properties SELECT Policy:**
```sql
CREATE POLICY "org_select_properties" ON properties
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (SELECT get_user_org_ids())  -- ⚠️ Uses helper function
);
```

**Tenants SELECT Policy (for comparison):**
```sql
CREATE POLICY "org_select_tenants" ON tenants
FOR SELECT USING (
  deleted_at IS NULL 
  AND org_id IN (SELECT get_user_org_ids())  -- ✅ Same pattern
);
```

**Helper Function: `get_user_org_ids()`**
```sql
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS TABLE(org_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT om.org_id
  FROM org_members om
  WHERE om.user_id = auth.uid()
    AND om.status = 'active';
END;
$$;
```

### ⚠️ Potential Issues:

1. **Helper Function May Return Empty:**
   - If user has no active `org_members` record, function returns empty
   - RLS policy `org_id IN (SELECT ...)` with empty result = no rows visible

2. **RLS Policy Logic:**
   - `org_id IN (SELECT get_user_org_ids())` is correct
   - But if helper returns empty, ALL properties are filtered out

3. **Comparison Issue:**
   - Properties and Tenants use identical RLS pattern ✅
   - If tenants work but properties don't, it's a data issue (properties missing `org_id`)

**Verdict:** RLS policies are correct, but need to verify:
- Helper function returns user's org_id
- Properties in database have `org_id` set

---

## 3. ✅ Data Integrity Analysis

### File: `src/services/contractCreation.service.ts`

**Status:** ✅ **CORRECT**

The contract creation flow:
1. Calls `create_contract_atomic` RPC function
2. RPC function gets `org_id` from `org_members`:
   ```sql
   SELECT org_id INTO v_org_id
   FROM org_members
   WHERE user_id = user_id_param
     AND status = 'active'
     AND role = 'owner'
   LIMIT 1;
   ```
3. Sets `org_id` when creating property:
   ```sql
   INSERT INTO properties (
     user_id, org_id, owner_id, ...
   ) VALUES (
     user_id_param,
     v_org_id,  -- ✅ Sets org_id
     ...
   )
   ```

**Verdict:** New properties created via contract flow will have correct `org_id`.

### ⚠️ Legacy Data Issue:

**Problem:** Properties created BEFORE organization migration may have `NULL` org_id.

**Migration:** `20251231000003_org_phase1_migrate_data.sql` should have migrated existing data, but:
- If migration didn't run
- If migration failed for some records
- If properties were created between migrations

**Solution:** Need to verify all properties have `org_id` set.

---

## 4. 🔍 Console Response Analysis

### Empty Array `[]` vs Error

**If RLS blocks access:**
- Supabase returns empty array `[]`, NOT an error
- This matches the symptom described

**Possible Causes:**
1. ✅ RLS policy filters out all rows (helper function returns empty)
2. ✅ Properties exist but have `NULL` org_id (RLS filters them out)
3. ✅ Properties belong to different org_id than user's active org
4. ✅ User has no active `org_members` record

---

## 🎯 Root Cause Analysis

### Most Likely Causes (in order):

#### 1. **Properties Missing `org_id` (Legacy Data)**
**Probability:** 🔴 **HIGH**

Properties created before organization migration may have `NULL` org_id. RLS policy filters them out.

**Check:**
```sql
SELECT COUNT(*) FROM properties WHERE org_id IS NULL;
```

**Fix:**
```sql
-- Update properties with NULL org_id to user's org
UPDATE properties p
SET org_id = (
  SELECT om.org_id 
  FROM org_members om 
  WHERE om.user_id = p.user_id 
    AND om.status = 'active' 
  LIMIT 1
)
WHERE p.org_id IS NULL;
```

#### 2. **Helper Function Returns Empty**
**Probability:** 🟡 **MEDIUM**

If user has no active `org_members` record, `get_user_org_ids()` returns empty, filtering out all properties.

**Check:**
```sql
-- Verify user has active org membership
SELECT * FROM org_members 
WHERE user_id = auth.uid() AND status = 'active';
```

**Fix:**
- Ensure user has active `org_members` record
- Check `OrgContext` is loading correctly

#### 3. **RLS Policy Mismatch**
**Probability:** 🟢 **LOW**

Policies look correct, but there may be multiple policies conflicting.

**Check:**
```sql
-- List all policies on properties table
SELECT * FROM pg_policies WHERE tablename = 'properties';
```

**Fix:**
- Drop duplicate/conflicting policies
- Ensure only `org_select_properties` policy exists

---

## 🔧 Recommended Fixes

### Fix 1: Verify and Migrate Legacy Properties

**File:** Create new migration: `20260110000000_fix_null_org_id_properties.sql`

```sql
-- Fix properties with NULL org_id
UPDATE properties p
SET org_id = (
  SELECT om.org_id 
  FROM org_members om 
  WHERE om.user_id = p.user_id 
    AND om.status = 'active' 
  LIMIT 1
)
WHERE p.org_id IS NULL
  AND EXISTS (
    SELECT 1 FROM org_members om 
    WHERE om.user_id = p.user_id 
      AND om.status = 'active'
  );

-- Verify no NULL org_id remain
DO $$
DECLARE
  null_count int;
BEGIN
  SELECT COUNT(*) INTO null_count 
  FROM properties 
  WHERE org_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE WARNING '⚠️ % properties still have NULL org_id', null_count;
  ELSE
    RAISE NOTICE '✅ All properties have org_id set';
  END IF;
END $$;
```

### Fix 2: Add Debugging to Frontend

**File:** `src/services/properties.service.ts`

Add logging to diagnose:

```typescript
async getAll(): Promise<PropertyWithOwner[]> {
  const orgId = await getActiveOrgId();
  logger.debug('Fetching properties for org_id:', orgId);

  const { data, error } = await supabase
    .from('properties')
    .select(`...`)
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    logger.error('Error fetching properties:', error);
    throw error;
  }

  logger.debug('Properties fetched:', {
    count: data?.length || 0,
    orgId,
    hasData: !!data && data.length > 0
  });

  return this.transformProperties(data || []);
}
```

### Fix 3: Verify RLS Helper Function

**Check in Supabase SQL Editor:**

```sql
-- Test helper function
SELECT * FROM get_user_org_ids();

-- Should return user's org_id(s)
-- If empty, user has no active org membership
```

### Fix 4: Add Database Query to Check Data

**Run in Supabase SQL Editor:**

```sql
-- Check properties with NULL org_id
SELECT 
  COUNT(*) as total_properties,
  COUNT(org_id) as with_org_id,
  COUNT(*) - COUNT(org_id) as null_org_id
FROM properties
WHERE deleted_at IS NULL;

-- Check properties per org
SELECT 
  org_id,
  COUNT(*) as property_count
FROM properties
WHERE deleted_at IS NULL
GROUP BY org_id
ORDER BY property_count DESC;

-- Check user's org membership
SELECT 
  om.*,
  o.name as org_name
FROM org_members om
JOIN organizations o ON o.id = om.org_id
WHERE om.user_id = auth.uid()
  AND om.status = 'active';
```

---

## 📊 Diagnostic Checklist

Run these checks in order:

- [ ] **1. Check for NULL org_id properties:**
  ```sql
  SELECT COUNT(*) FROM properties WHERE org_id IS NULL;
  ```

- [ ] **2. Verify user has active org membership:**
  ```sql
  SELECT * FROM org_members 
  WHERE user_id = auth.uid() AND status = 'active';
  ```

- [ ] **3. Test RLS helper function:**
  ```sql
  SELECT * FROM get_user_org_ids();
  ```

- [ ] **4. Check properties count by org:**
  ```sql
  SELECT org_id, COUNT(*) 
  FROM properties 
  WHERE deleted_at IS NULL 
  GROUP BY org_id;
  ```

- [ ] **5. Verify RLS policies:**
  ```sql
  SELECT * FROM pg_policies 
  WHERE tablename = 'properties' 
    AND policyname LIKE 'org_%';
  ```

- [ ] **6. Test direct query (bypass RLS):**
  ```sql
  -- As service role, check all properties
  SELECT id, org_id, user_id, address 
  FROM properties 
  WHERE deleted_at IS NULL 
  LIMIT 10;
  ```

---

## 🚀 Immediate Action Items

### Priority 1: Data Verification
1. Run diagnostic queries in Supabase SQL Editor
2. Check for properties with `NULL` org_id
3. Verify user has active org membership

### Priority 2: Fix Legacy Data
1. Create migration to set `org_id` for NULL properties
2. Run migration
3. Verify all properties have `org_id`

### Priority 3: Add Debugging
1. Add logging to `properties.service.ts`
2. Check browser console for org_id value
3. Verify `OrgContext` is loading correctly

### Priority 4: Test RLS
1. Test `get_user_org_ids()` function directly
2. Verify it returns user's org_id
3. Check if multiple policies exist on properties table

---

## 📝 Notes

- **Tenants work but properties don't:** Suggests data issue (properties missing org_id) rather than RLS issue
- **Empty array response:** Confirms RLS is working, just filtering out all rows
- **No errors:** RLS doesn't throw errors, it silently filters rows

---

## 🔗 Related Files

- `src/services/properties.service.ts` - Data fetching
- `src/services/tenants.service.ts` - Comparison reference
- `src/lib/orgHelpers.ts` - `getActiveOrgId()` helper
- `src/contexts/OrgContext.tsx` - Organization context
- `supabase/migrations/20260108000000_comprehensive_security_fix.sql` - Latest RLS policies
- `supabase/migrations/20250105000003_fix_contract_rpc_org_id.sql` - Contract RPC with org_id

---

**Next Steps:** Run diagnostic queries to identify the exact cause, then apply appropriate fix.
