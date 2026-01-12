# 🔧 Fix: 406 Not Acceptable - Missing Org Memberships

## Problem Summary

Users are experiencing **406 Not Acceptable** errors when querying `property_owners` and `tenants` tables. The root cause is that users have **no active org membership** in the `org_members` table, causing RLS (Row Level Security) policies to block all queries.

### Symptoms
- ✅ PDF generation works
- ✅ Contract saves successfully  
- ❌ Console shows 406 errors on:
  - `GET /rest/v1/property_owners?...&org_id=eq.xxx&deleted_at=is.null`
  - `GET /rest/v1/tenants?...&org_id=eq.xxx&deleted_at=is.null`

### Root Cause
The RLS policies require users to have an active `org_members` record:
```sql
org_id IN (SELECT get_user_org_ids())
```

If `get_user_org_ids()` returns empty (no active membership), all queries are blocked → 406 error.

## Why This Happens

1. **User signed up before trigger existed** - The auto-org trigger (`on_auth_user_created_org`) was added in migration `20251231000007`, but users who signed up before this don't have orgs.

2. **Trigger failed silently** - The trigger might have failed due to:
   - Constraint violations
   - Transaction rollbacks
   - Missing permissions

3. **Org created manually** - Orgs with custom slugs (like `jans-emlak`) were created manually, but the user wasn't added as a member.

4. **Migration didn't catch user** - The data migration (`20251231000003`) only processes users who have data. Users with no data yet weren't migrated.

## Solution

Two migrations have been created:

### 1. Diagnostic Migration
**File:** `supabase/migrations/20250105000008_diagnose_org_memberships.sql`

**Purpose:** Analyze the current state and identify issues.

**What it checks:**
- Users without org memberships
- Orgs without owners
- Orphaned data (records without org_id)
- Trigger status

**How to run:**
```sql
-- In Supabase SQL Editor or via migration
\i supabase/migrations/20250105000008_diagnose_org_memberships.sql
```

**Output:** Detailed NOTICE messages showing statistics and recommendations.

### 2. Fix Migration
**File:** `supabase/migrations/20250105000007_fix_missing_org_memberships.sql`

**Purpose:** Automatically fix missing org memberships.

**What it does:**
1. Finds all users without active org membership
2. For each user, tries multiple strategies to find their org:
   - **Strategy 1:** Find org by `slug = user UUID` (how trigger creates orgs)
   - **Strategy 2:** Find org by checking user's existing data
   - **Strategy 3:** Find org by name matching (for manually created orgs)
   - **Strategy 4:** Create new org if none found
3. Adds user as owner with `active` status
4. Validates that all users now have memberships

**How to run:**
```sql
-- In Supabase SQL Editor or via migration
\i supabase/migrations/20250105000007_fix_missing_org_memberships.sql
```

**Safety:**
- ✅ Only creates missing memberships
- ✅ Doesn't modify existing active memberships
- ✅ Uses `ON CONFLICT` to handle duplicates safely
- ✅ Can be run multiple times (idempotent)

## Step-by-Step Fix Process

### Step 1: Run Diagnostics
```sql
-- Run the diagnostic migration
\i supabase/migrations/20250105000008_diagnose_org_memberships.sql
```

Review the output to understand:
- How many users are affected
- Which orgs are missing owners
- Whether the trigger exists

### Step 2: Run the Fix
```sql
-- Run the fix migration
\i supabase/migrations/20250105000007_fix_missing_org_memberships.sql
```

The migration will:
- Process all affected users
- Create missing orgs if needed
- Link users to their orgs
- Report progress and summary

### Step 3: Verify the Fix

**Check user's org membership:**
```sql
SELECT 
  u.email,
  o.name as org_name,
  om.role,
  om.status
FROM auth.users u
JOIN org_members om ON om.user_id = u.id
JOIN organizations o ON o.id = om.org_id
WHERE u.email = 'user@example.com';
```

**Test RLS policies:**
```sql
-- This should return rows (not 406)
SELECT * FROM property_owners 
WHERE org_id IN (SELECT get_user_org_ids())
  AND deleted_at IS NULL;
```

**Check frontend:**
- Refresh the app
- Try creating a contract
- Check browser console - 406 errors should be gone

## Prevention

### Ensure Trigger Exists
The trigger should automatically create orgs for new users. Verify it exists:

```sql
SELECT EXISTS (
  SELECT 1 FROM pg_trigger
  WHERE tgname = 'on_auth_user_created_org'
) as trigger_exists;
```

If missing, run:
```sql
\i supabase/migrations/20251231000007_org_phase2_new_user_trigger.sql
```

### Monitor New Signups
After the fix, all new users should automatically get:
- An organization (slug = their user UUID)
- An `org_members` record with `role = 'owner'` and `status = 'active'`

### Manual Org Creation
If you manually create orgs, always create the `org_members` record:

```sql
-- Create org
INSERT INTO organizations (name, slug) 
VALUES ('My Agency', 'my-agency')
RETURNING id;

-- Add user as owner
INSERT INTO org_members (org_id, user_id, role, status, joined_at)
VALUES (org_id, user_id, 'owner', 'active', now());
```

## Rollback

If you need to rollback the fix:

```sql
-- Find memberships created by the fix (adjust timestamp)
DELETE FROM org_members 
WHERE created_at > '2025-01-05 00:00:00'
  AND role = 'owner'
  AND status = 'active';
```

**⚠️ Warning:** Only rollback if you're sure these memberships were created by the fix and shouldn't exist.

## Related Files

- **Trigger Migration:** `supabase/migrations/20251231000007_org_phase2_new_user_trigger.sql`
- **Data Migration:** `supabase/migrations/20251231000003_org_phase1_migrate_data.sql`
- **RLS Helper:** `supabase/migrations/20260104000001_hotfix_org_members_circular_rls.sql`
- **RLS Policies:** `supabase/migrations/20251231000006_org_phase2_create_new_rls.sql`

## Expected Results

After running the fix:
- ✅ All users have active org memberships
- ✅ No more 406 errors
- ✅ Queries to `property_owners` and `tenants` work
- ✅ Contracts can be created without errors
- ✅ Frontend loads data correctly

## Troubleshooting

### Still Getting 406 Errors?

1. **Check user's membership:**
   ```sql
   SELECT * FROM org_members 
   WHERE user_id = auth.uid() AND status = 'active';
   ```

2. **Check get_user_org_ids() function:**
   ```sql
   SELECT get_user_org_ids();
   -- Should return at least one UUID
   ```

3. **Check RLS policies:**
   ```sql
   SELECT tablename, policyname, qual
   FROM pg_policies
   WHERE tablename IN ('property_owners', 'tenants');
   ```

4. **Re-run diagnostics:**
   ```sql
   \i supabase/migrations/20250105000008_diagnose_org_memberships.sql
   ```

### User Has Multiple Orgs?

The system supports multiple orgs per user. The frontend picks the first one (oldest `joined_at`). If you need to change which org is active, update the `joined_at` timestamp:

```sql
UPDATE org_members
SET joined_at = now() - INTERVAL '1 day'
WHERE org_id = 'desired-org-id' AND user_id = auth.uid();
```

## Summary

The fix migration automatically:
- ✅ Finds users without org memberships
- ✅ Links them to existing orgs or creates new ones
- ✅ Adds them as owners with active status
- ✅ Validates the fix worked

Run the diagnostic first to understand the scope, then run the fix. The migrations are safe and idempotent - you can run them multiple times without issues.


