# 🔧 Dashboard Count Fix - Properties Organization Linkage

**Issue:** Dashboard showing incorrect counts (e.g., Total Properties: 1) even though more data exists in database.

**Root Cause:** Properties created before organization migration have `NULL` org_id or belong to different organizations. RLS policies filter them out, making them invisible to queries.

---

## 📋 Analysis Summary

### How Dashboard Fetches Counts

1. **Dashboard Flow:**
   ```
   Dashboard.tsx
   → useDashboardData() hook
   → propertiesService.getStats()
   → Filters by org_id using getActiveOrgId()
   → Returns filtered count
   ```

2. **Properties Service (`getStats()`):**
   ```typescript
   async getStats() {
     const orgId = await getActiveOrgId();  // Gets user's active org
     
     const { data } = await supabase
       .from('properties')
       .select('status, property_type')
       .eq('org_id', orgId)  // ⚠️ Only counts properties in user's org
       .is('deleted_at', null);
     
     return { total: data.length, ... };
   }
   ```

3. **RLS Policy:**
   ```sql
   CREATE POLICY "org_select_properties" ON properties
   FOR SELECT USING (
     deleted_at IS NULL
     AND org_id IN (SELECT get_user_org_ids())  -- Filters by user's org
   );
   ```

### The Problem

- Properties with `NULL` org_id are filtered out by RLS
- Properties with different org_id are not visible to current user
- `getStats()` only counts properties in user's active organization
- Result: Dashboard shows incorrect counts

---

## 🔍 Diagnostic Steps

### Step 1: Run Diagnostic Script

Run this in Supabase SQL Editor to check current state:

```sql
-- File: scripts/check-properties-org-linkage.sql
```

This will show:
- Properties with NULL org_id
- Properties in target org vs other orgs
- User's org membership status
- RLS visibility simulation

### Step 2: Verify Organization Exists

```sql
SELECT id, name, created_at
FROM organizations
WHERE id = 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c';
```

### Step 3: Check User's Org Membership

```sql
SELECT om.*, o.name as org_name
FROM org_members om
JOIN organizations o ON o.id = om.org_id
WHERE om.user_id = auth.uid()
  AND om.status = 'active';
```

---

## ✅ Solution: Migration Script

### Migration File

**File:** `supabase/migrations/20260111000000_link_properties_to_specific_org.sql`

**What it does:**
1. ✅ Validates target organization exists
2. ✅ Updates properties with NULL org_id to target org
3. ✅ Reports detailed results
4. ✅ Verifies RLS visibility
5. ✅ Creates performance indexes

**Target Organization:** `e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c`

### How to Run

#### Option 1: Via Supabase CLI
```bash
supabase db push
```

#### Option 2: Manual Execution
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of migration file
3. Run the script
4. Review the output messages

### What Gets Updated

- ✅ Properties with `NULL` org_id → Target org
- ⚠️ Properties with different org_id → **NOT updated by default** (optional step available)

### Optional: Migrate All Properties

If you want to migrate ALL properties (including those in other orgs) to the target org, uncomment this section in the migration:

```sql
-- STEP 3: OPTIONAL - Update properties with different org_id
-- Uncomment to migrate ALL properties to target org
```

---

## 📊 Expected Results

### Before Migration
```
Total properties in database: 10
Properties in target org: 1
Properties with NULL org_id: 9
Dashboard shows: Total Properties: 1 ❌
```

### After Migration
```
Total properties in database: 10
Properties in target org: 10
Properties with NULL org_id: 0
Dashboard shows: Total Properties: 10 ✅
```

---

## 🔐 Security Considerations

### RLS Still Enforces Access

- Migration only sets `org_id` on properties
- RLS policies still filter by user's org membership
- Users can only see properties in their active organization
- No security risk - just fixes data linkage

### User Must Be Org Member

**Important:** For properties to be visible, the user must:
1. Be a member of the target organization
2. Have `status = 'active'` in `org_members` table
3. Have the target org as their active org (first org in `joined_at` order)

If user is not a member, add them first:
```sql
INSERT INTO org_members (org_id, user_id, role, status, joined_at)
VALUES (
  'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid,
  auth.uid(),
  'owner',
  'active',
  now()
);
```

---

## 🧪 Verification

### After Migration, Verify:

1. **Check Properties:**
   ```sql
   SELECT COUNT(*) 
   FROM properties 
   WHERE org_id = 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid
     AND deleted_at IS NULL;
   ```

2. **Check Dashboard:**
   - Refresh dashboard page
   - Verify "Total Properties" count matches database count
   - Check all stat cards show correct numbers

3. **Check RLS:**
   ```sql
   -- Should return same count as dashboard
   SELECT COUNT(*) 
   FROM properties 
   WHERE deleted_at IS NULL;
   -- (Run as authenticated user)
   ```

---

## 🐛 Troubleshooting

### Issue: Migration shows "0 properties updated"

**Possible causes:**
- All properties already have org_id set
- Properties belong to different users
- Properties are soft-deleted (`deleted_at IS NOT NULL`)

**Solution:** Check diagnostic script output to see actual state.

### Issue: Dashboard still shows wrong count after migration

**Possible causes:**
- User is not member of target organization
- User's active org is different from target org
- Browser cache - try hard refresh (Ctrl+Shift+R)

**Solution:**
1. Verify user's org membership
2. Check `OrgContext` is loading correct org
3. Clear browser cache and refresh

### Issue: Some properties still not visible

**Possible causes:**
- Properties belong to other users
- Properties are soft-deleted
- RLS policy issue

**Solution:** Run diagnostic script to identify specific properties.

---

## 📝 Related Files

- **Migration:** `supabase/migrations/20260111000000_link_properties_to_specific_org.sql`
- **Diagnostic:** `scripts/check-properties-org-linkage.sql`
- **Service:** `src/services/properties.service.ts` (getStats method)
- **Dashboard Hook:** `src/features/dashboard/hooks/useDashboardData.ts`
- **RLS Policies:** `supabase/migrations/20260108000000_comprehensive_security_fix.sql`

---

## ✅ Checklist

Before running migration:
- [ ] Run diagnostic script to understand current state
- [ ] Verify target organization exists
- [ ] Verify user is member of target organization
- [ ] Backup database (recommended)

After running migration:
- [ ] Check migration output messages
- [ ] Verify properties have correct org_id
- [ ] Refresh dashboard and verify counts
- [ ] Test property list page shows all properties

---

**Next Steps:** Run the diagnostic script first, then apply the migration if needed.
