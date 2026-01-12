-- =====================================================
-- ORG MEMBERSHIP DIAGNOSTIC QUERIES
-- =====================================================
-- Copy-paste these queries into Supabase SQL Editor
-- Run them to check if you have org membership problems
-- =====================================================

-- =====================================================
-- QUERY 1: Count Users Without Org Memberships
-- =====================================================
-- What it tests: Users who will get 406 errors
-- Good result: 0 (all users have memberships)
-- Bad result: Any number > 0 (those users need fixing)
-- =====================================================
SELECT 
  COUNT(*) as users_without_org
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.org_members om
  WHERE om.user_id = u.id 
    AND om.status = 'active'
);

-- =====================================================
-- QUERY 2: List Users Without Org Memberships (Details)
-- =====================================================
-- What it tests: Specific users who need fixing
-- Good result: Empty result set (no rows)
-- Bad result: List of users with their emails and creation dates
-- =====================================================
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'full_name' as display_name
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.org_members om
  WHERE om.user_id = u.id 
    AND om.status = 'active'
)
ORDER BY u.created_at;

-- =====================================================
-- QUERY 3: Count Organizations Without Owners
-- =====================================================
-- What it tests: Orgs that are missing owners
-- Good result: 0 (all orgs have owners)
-- Bad result: Any number > 0 (those orgs need owners)
-- =====================================================
SELECT 
  COUNT(*) as orgs_without_owner
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.org_members om
  WHERE om.org_id = o.id 
    AND om.role = 'owner' 
    AND om.status = 'active'
);

-- =====================================================
-- QUERY 4: List Organizations Without Owners (Details)
-- =====================================================
-- What it tests: Specific orgs that need owners
-- Good result: Empty result set (no rows)
-- Bad result: List of orgs with their names and slugs
-- =====================================================
SELECT 
  o.id,
  o.name,
  o.slug,
  o.created_at
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.org_members om
  WHERE om.org_id = o.id 
    AND om.role = 'owner' 
    AND om.status = 'active'
)
ORDER BY o.created_at;

-- =====================================================
-- QUERY 5: Check Auto-Org Trigger Exists
-- =====================================================
-- What it tests: Whether new users will automatically get orgs
-- Good result: true (trigger exists, new users are safe)
-- Bad result: false (trigger missing, new users will have problems)
-- =====================================================
SELECT EXISTS (
  SELECT 1 
  FROM pg_trigger
  WHERE tgname = 'on_auth_user_created_org'
) as trigger_exists;

-- =====================================================
-- QUERY 6: Check for Orphaned Properties
-- =====================================================
-- What it tests: Properties that aren't linked to any org
-- Good result: 0 (all properties have org_id)
-- Bad result: Any number > 0 (data integrity issue)
-- =====================================================
SELECT 
  COUNT(*) as orphaned_properties
FROM properties
WHERE org_id IS NULL 
  AND deleted_at IS NULL;

-- =====================================================
-- QUERY 7: Check for Orphaned Tenants
-- =====================================================
-- What it tests: Tenants that aren't linked to any org
-- Good result: 0 (all tenants have org_id)
-- Bad result: Any number > 0 (data integrity issue)
-- =====================================================
SELECT 
  COUNT(*) as orphaned_tenants
FROM tenants
WHERE org_id IS NULL 
  AND deleted_at IS NULL;

-- =====================================================
-- QUERY 8: Check for Orphaned Contracts
-- =====================================================
-- What it tests: Contracts that aren't linked to any org
-- Good result: 0 (all contracts have org_id)
-- Bad result: Any number > 0 (data integrity issue)
-- =====================================================
SELECT 
  COUNT(*) as orphaned_contracts
FROM contracts
WHERE org_id IS NULL 
  AND deleted_at IS NULL;

-- =====================================================
-- QUERY 9: Check for Orphaned Owners
-- =====================================================
-- What it tests: Property owners that aren't linked to any org
-- Good result: 0 (all owners have org_id)
-- Bad result: Any number > 0 (data integrity issue)
-- =====================================================
SELECT 
  COUNT(*) as orphaned_owners
FROM property_owners
WHERE org_id IS NULL 
  AND deleted_at IS NULL;

-- =====================================================
-- QUERY 10: Overall Health Check (Summary) ⭐ RECOMMENDED
-- =====================================================
-- What it tests: All problems at once
-- Good result: All counts = 0, trigger_exists = true
-- Bad result: Any count > 0 or trigger_exists = false
-- =====================================================
-- ⭐ START HERE - This gives you everything in one query
SELECT 
  (SELECT COUNT(*) FROM auth.users u
   WHERE NOT EXISTS (
     SELECT 1 FROM public.org_members om
     WHERE om.user_id = u.id AND om.status = 'active'
   )) as users_without_org,
  
  (SELECT COUNT(*) FROM public.organizations o
   WHERE NOT EXISTS (
     SELECT 1 FROM public.org_members om
     WHERE om.org_id = o.id AND om.role = 'owner' AND om.status = 'active'
   )) as orgs_without_owner,
  
  (SELECT EXISTS (
     SELECT 1 FROM pg_trigger
     WHERE tgname = 'on_auth_user_created_org'
   )) as trigger_exists,
  
  (SELECT COUNT(*) FROM properties WHERE org_id IS NULL AND deleted_at IS NULL) as orphaned_properties,
  (SELECT COUNT(*) FROM tenants WHERE org_id IS NULL AND deleted_at IS NULL) as orphaned_tenants,
  (SELECT COUNT(*) FROM contracts WHERE org_id IS NULL AND deleted_at IS NULL) as orphaned_contracts,
  (SELECT COUNT(*) FROM property_owners WHERE org_id IS NULL AND deleted_at IS NULL) as orphaned_owners;

-- =====================================================
-- INTERPRETATION GUIDE
-- =====================================================
-- 
-- GOOD RESULTS (No Problems):
--   - users_without_org: 0
--   - orgs_without_owner: 0
--   - trigger_exists: true
--   - All orphaned counts: 0
--
-- BAD RESULTS (Problems Found):
--   - users_without_org > 0 → Run fix migration
--   - orgs_without_owner > 0 → Needs manual investigation
--   - trigger_exists = false → Need to run trigger migration
--   - Any orphaned count > 0 → Data integrity issue
--
-- =====================================================
