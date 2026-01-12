# Org Migration Execution Guide

> **Document Type:** Step-by-Step Execution Instructions
> **Status:** Ready for Local Testing
> **Date:** 2025-12-31

---

## Migration Files Summary

| File | Phase | Description |
|------|-------|-------------|
| `20251231000001_org_phase1_create_tables.sql` | 1.1 | Create `organizations` + `org_members` tables |
| `20251231000002_org_phase1_add_columns.sql` | 1.2 | Add `org_id` + `deleted_at` to 14 tables |
| `20251231000003_org_phase1_migrate_data.sql` | 1.3 | Migrate existing data (create orgs, link records) |
| `20251231000004_org_phase1_add_constraints.sql` | 1.4 | Add NOT NULL constraints |
| `20251231000005_org_phase2_drop_old_rls.sql` | 2.1 | Drop old user_id-based RLS policies |
| `20251231000006_org_phase2_create_new_rls.sql` | 2.2 | Create new org_id-based RLS policies |
| `20251231000007_org_phase2_new_user_trigger.sql` | 2.3 | Auto-create org on new user signup |

---

## Part 1: Local Testing (REQUIRED FIRST)

### Step 1.1: Reset Local Database

```bash
# Stop any running local Supabase
npx supabase stop

# Start fresh (this resets the local database)
npx supabase start
```

### Step 1.2: Apply Existing Migrations

```bash
# Apply all existing migrations first
npx supabase db reset
```

### Step 1.3: Seed Test Data (Optional)

If you have a seed file, run it now. Otherwise, create some test data manually through the app.

### Step 1.4: Run Phase 1 Migrations

Run each migration in order. Check output after each one.

```bash
# Phase 1.1: Create org tables
npx supabase db push --include-seed=false
# Or apply specific migration:
# psql "postgresql://postgres:postgres@localhost:54322/postgres" -f supabase/migrations/20251231000001_org_phase1_create_tables.sql
```

**Expected Output for Phase 1.1:**
```
NOTICE:  ✅ Phase 1.1 Complete: organizations and org_members tables created
```

**Verify:**
```sql
-- Run in Supabase Studio (localhost:54323) or psql
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('organizations', 'org_members');
-- Should return 2 rows
```

### Step 1.5: Verify Phase 1.2 (Add Columns)

**Expected Output:**
```
NOTICE:  ✅ Phase 1.2 Complete: org_id and deleted_at columns added to 14 tables
```

**Verify:**
```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'org_id' AND table_schema = 'public';
-- Should return 14+ rows (including organizations itself)
```

### Step 1.6: Verify Phase 1.3 (Data Migration)

**Expected Output:**
```
NOTICE:  ========================================
NOTICE:  Starting data migration...
NOTICE:  ========================================
NOTICE:  Created org "UserName" (uuid) for user uuid
NOTICE:  ========================================
NOTICE:  ✅ Data migration complete!
NOTICE:     Users processed: X
NOTICE:     Total rows updated: Y
NOTICE:  ========================================
NOTICE:  Validating migration - checking for orphaned records...
NOTICE:  ✅ Validation passed: No orphaned records found
```

**If you see warnings about orphaned records:**
- DO NOT proceed to Phase 1.4
- Investigate which records are missing org_id
- Fix the data migration script if needed

**Verify:**
```sql
-- Check organizations were created
SELECT * FROM organizations;

-- Check memberships
SELECT * FROM org_members;

-- Check for orphans (should all return 0)
SELECT 'properties', COUNT(*) FROM properties WHERE org_id IS NULL
UNION ALL SELECT 'tenants', COUNT(*) FROM tenants WHERE org_id IS NULL
UNION ALL SELECT 'contracts', COUNT(*) FROM contracts WHERE org_id IS NULL;
```

### Step 1.7: Verify Phase 1.4 (NOT NULL Constraints)

**Expected Output:**
```
NOTICE:  Pre-flight check passed: All records have org_id
NOTICE:  ✅ Phase 1.4 Complete: NOT NULL constraints added to 13 tables
NOTICE:  ✅ expense_categories.org_id correctly remains NULLABLE for system defaults
```

**If it fails:**
- The pre-flight check found orphaned records
- Go back to Phase 1.3 and fix data migration

---

## Part 2: Test RLS Policies (Critical)

### Step 2.1: Apply Phase 2 Migrations

```bash
# Apply remaining migrations
npx supabase db push --include-seed=false
```

### Step 2.2: Test Data Isolation

Open Supabase Studio SQL Editor (localhost:54323) and run these tests:

```sql
-- Get a test user and org from your data
SELECT om.user_id, om.org_id, om.role, o.name
FROM org_members om
JOIN organizations o ON o.id = om.org_id
LIMIT 5;
```

Note the user_id and org_id values.

### Step 2.3: Test as Owner

```sql
-- Set session as a specific user (replace with actual UUID)
SET LOCAL request.jwt.claims = '{"sub": "your-user-uuid-here"}';

-- Test SELECT (should only see your org's data)
SELECT id, title, org_id FROM properties LIMIT 5;

-- Test INSERT (should work for owner)
INSERT INTO properties (title, org_id, user_id, status, property_type, listing_type)
VALUES ('Test Property', 'your-org-uuid', 'your-user-uuid', 'available', 'apartment', 'sale')
RETURNING id;

-- Clean up
DELETE FROM properties WHERE title = 'Test Property';
```

### Step 2.4: Test Cross-Org Isolation

Create a second test user in a different org, then verify:
- User A cannot see User B's properties
- User A cannot insert into User B's org

### Step 2.5: Test New User Signup

1. Open the app in browser
2. Sign up with a new email
3. Check database:

```sql
-- Verify org was created
SELECT o.*, om.user_id, om.role
FROM organizations o
JOIN org_members om ON om.org_id = o.id
ORDER BY o.created_at DESC
LIMIT 1;
```

---

## Part 3: Frontend Integration Testing

### Step 3.1: Run Development Server

```bash
npm run dev
```

### Step 3.2: Test Existing User Flow

1. Login as existing user
2. Verify all data is visible
3. Try all CRUD operations:
   - Create property
   - Edit property
   - Delete property (should soft delete)
   - Create tenant, contract, etc.

### Step 3.3: Check for Errors

- Open browser DevTools → Console
- Look for 403 errors (RLS blocking)
- Look for "undefined" org_id errors

---

## Part 4: Production Deployment

### CRITICAL: Only proceed when local testing is 100% successful

### Step 4.1: Backup Production Database

```bash
# Using Supabase CLI
npx supabase db dump -f backup_before_org_migration.sql --db-url "YOUR_PRODUCTION_DB_URL"

# Or via Supabase Dashboard:
# Settings → Database → Backups → Download backup
```

### Step 4.2: Optional - Maintenance Mode

If you have significant traffic, consider:
- Adding a maintenance banner
- Temporarily blocking new signups
- Notifying users of brief downtime

### Step 4.3: Run Production Migrations

```bash
# Link to production project
npx supabase link --project-ref your-project-ref

# Push all migrations
npx supabase db push
```

### Step 4.4: Verify Production Migration

```sql
-- Run in Supabase Dashboard SQL Editor

-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('organizations', 'org_members');

-- Check all orgs created
SELECT COUNT(*) as org_count FROM organizations;

-- Check all users have orgs
SELECT COUNT(*) as users_without_org
FROM auth.users u
LEFT JOIN org_members om ON om.user_id = u.id
WHERE om.id IS NULL;
-- Should be 0

-- Check for orphaned data
SELECT 'properties', COUNT(*) FROM properties WHERE org_id IS NULL
UNION ALL SELECT 'tenants', COUNT(*) FROM tenants WHERE org_id IS NULL;
-- Should all be 0
```

### Step 4.5: Deploy Frontend

```bash
# Your deployment command (e.g., Vercel, Netlify)
npm run build
# Deploy the build
```

### Step 4.6: Smoke Test Production

1. Login as yourself
2. Verify your data is visible
3. Create/edit/delete a test record
4. Check browser console for errors

### Step 4.7: Monitor for 30 Minutes

- Watch Supabase Dashboard → Logs
- Watch for 500 errors
- Watch for RLS policy errors

---

## Rollback Procedures

### If Phase 1 Fails (Before RLS Changes)

```sql
-- Drop new columns from all tables
ALTER TABLE properties DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE tenants DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE contracts DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE contract_details DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE property_owners DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE property_inquiries DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE inquiry_matches DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE meetings DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE financial_transactions DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE commissions DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE recurring_expenses DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE expense_categories DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE contract_clause_templates DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE contract_clause_overrides DROP COLUMN IF EXISTS org_id, DROP COLUMN IF EXISTS deleted_at;

-- Delete org data
DELETE FROM org_members;
DELETE FROM organizations;

-- Drop org tables
DROP TABLE IF EXISTS org_members;
DROP TABLE IF EXISTS organizations;
```

### If Phase 2 Fails (RLS Broken)

**Emergency: Restore old policies**

```sql
-- Drop all new org policies
DROP POLICY IF EXISTS "org_select_properties" ON properties;
DROP POLICY IF EXISTS "org_insert_properties" ON properties;
DROP POLICY IF EXISTS "org_update_properties" ON properties;
DROP POLICY IF EXISTS "org_delete_properties" ON properties;
-- ... repeat for all tables

-- Temporarily allow all access (DANGEROUS - for recovery only)
CREATE POLICY "temp_all_access" ON properties FOR ALL USING (true);
-- ... repeat for all tables

-- Then restore original policies from backup or re-run old migrations
```

### If Production is Broken

1. Immediately restore from backup
2. Revert frontend deployment
3. Investigate what went wrong
4. Fix and re-test on local

---

## Checklist Summary

### Before Starting
- [ ] Local Supabase is running
- [ ] You have a database backup
- [ ] No pending changes in migrations folder

### After Phase 1
- [ ] organizations table exists
- [ ] org_members table exists
- [ ] All 14 tables have org_id column
- [ ] All 14 tables have deleted_at column
- [ ] All existing data has org_id populated
- [ ] Each user has one organization
- [ ] Each user is owner of their org

### After Phase 2
- [ ] Old RLS policies are gone
- [ ] New org-based RLS policies are active
- [ ] Owner can CRUD all data types
- [ ] Member can only SELECT
- [ ] Cross-org data is isolated
- [ ] New user signup creates org automatically

### After Frontend Update
- [ ] No console errors
- [ ] No 403 errors
- [ ] All CRUD operations work
- [ ] Dashboard stats are correct

### After Production Deploy
- [ ] All users can access their data
- [ ] No error spikes in logs
- [ ] New signups work correctly

---

## Support Queries

Useful queries for debugging:

```sql
-- Find user's org
SELECT o.*, om.role, om.status
FROM organizations o
JOIN org_members om ON om.org_id = o.id
WHERE om.user_id = 'USER_UUID';

-- Check if user can access a property
SELECT EXISTS (
  SELECT 1 FROM org_members
  WHERE user_id = 'USER_UUID'
    AND org_id = (SELECT org_id FROM properties WHERE id = 'PROPERTY_UUID')
    AND status = 'active'
);

-- List all policies on a table
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'properties';

-- Check for orphaned records
SELECT
  'properties' as table_name, COUNT(*) as orphans FROM properties WHERE org_id IS NULL
UNION ALL
SELECT 'tenants', COUNT(*) FROM tenants WHERE org_id IS NULL
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts WHERE org_id IS NULL;
```

---

*Last updated: 2025-12-31*
