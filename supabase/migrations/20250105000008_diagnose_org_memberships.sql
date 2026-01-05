-- =====================================================
-- DIAGNOSTIC: Org Membership Analysis
-- =====================================================
--
-- This diagnostic script helps identify:
-- 1. Users without org memberships
-- 2. Orgs without owners
-- 3. Orphaned data (data without org_id)
-- 4. Trigger status
--
-- Run this BEFORE applying the fix to understand the situation.
-- Results are printed as NOTICE messages.
--
-- =====================================================

DO $$
DECLARE
  total_users INT;
  users_with_org INT;
  users_without_org INT;
  total_orgs INT;
  orgs_with_owner INT;
  orgs_without_owner INT;
  total_members INT;
  active_members INT;
  trigger_exists BOOLEAN;
  orphaned_properties INT;
  orphaned_tenants INT;
  orphaned_contracts INT;
  orphaned_owners INT;
  user_record RECORD;
  org_record RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ORG MEMBERSHIP DIAGNOSTICS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ============================================
  -- 1. User Statistics
  -- ============================================
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(DISTINCT u.id) INTO users_with_org
  FROM auth.users u
  WHERE EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.user_id = u.id AND om.status = 'active'
  );
  users_without_org := total_users - users_with_org;

  RAISE NOTICE '📊 USER STATISTICS';
  RAISE NOTICE '   Total users: %', total_users;
  RAISE NOTICE '   Users with active org: %', users_with_org;
  RAISE NOTICE '   Users WITHOUT org: %', users_without_org;
  RAISE NOTICE '';

  -- ============================================
  -- 2. Organization Statistics
  -- ============================================
  SELECT COUNT(*) INTO total_orgs FROM public.organizations;
  SELECT COUNT(DISTINCT o.id) INTO orgs_with_owner
  FROM public.organizations o
  WHERE EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = o.id 
      AND om.role = 'owner' 
      AND om.status = 'active'
  );
  orgs_without_owner := total_orgs - orgs_with_owner;

  RAISE NOTICE '📊 ORGANIZATION STATISTICS';
  RAISE NOTICE '   Total orgs: %', total_orgs;
  RAISE NOTICE '   Orgs with owner: %', orgs_with_owner;
  RAISE NOTICE '   Orgs WITHOUT owner: %', orgs_without_owner;
  RAISE NOTICE '';

  -- ============================================
  -- 3. Membership Statistics
  -- ============================================
  SELECT COUNT(*) INTO total_members FROM public.org_members;
  SELECT COUNT(*) INTO active_members 
  FROM public.org_members 
  WHERE status = 'active';

  RAISE NOTICE '📊 MEMBERSHIP STATISTICS';
  RAISE NOTICE '   Total memberships: %', total_members;
  RAISE NOTICE '   Active memberships: %', active_members;
  RAISE NOTICE '   Inactive memberships: %', (total_members - active_members);
  RAISE NOTICE '';

  -- ============================================
  -- 4. Trigger Status
  -- ============================================
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created_org'
  ) INTO trigger_exists;

  RAISE NOTICE '📊 TRIGGER STATUS';
  IF trigger_exists THEN
    RAISE NOTICE '   ✅ Auto-org trigger EXISTS';
    RAISE NOTICE '   New users will get orgs automatically';
  ELSE
    RAISE NOTICE '   ❌ Auto-org trigger MISSING';
    RAISE NOTICE '   New users will NOT get orgs automatically';
  END IF;
  RAISE NOTICE '';

  -- ============================================
  -- 5. List Users Without Org
  -- ============================================
  IF users_without_org > 0 THEN
    RAISE NOTICE '⚠️  USERS WITHOUT ORG MEMBERSHIP:';
    FOR user_record IN
      SELECT 
        u.id,
        u.email,
        u.created_at
      FROM auth.users u
      WHERE NOT EXISTS (
        SELECT 1 FROM public.org_members om
        WHERE om.user_id = u.id AND om.status = 'active'
      )
      ORDER BY u.created_at
      LIMIT 10
    LOOP
      RAISE NOTICE '   - % (%) - Created: %', 
        user_record.email, 
        user_record.id, 
        user_record.created_at;
    END LOOP;
    IF users_without_org > 10 THEN
      RAISE NOTICE '   ... and % more', (users_without_org - 10);
    END IF;
    RAISE NOTICE '';
  END IF;

  -- ============================================
  -- 6. List Orgs Without Owner
  -- ============================================
  IF orgs_without_owner > 0 THEN
    RAISE NOTICE '⚠️  ORGS WITHOUT OWNER:';
    FOR org_record IN
      SELECT 
        o.id,
        o.name,
        o.slug,
        o.created_at
      FROM public.organizations o
      WHERE NOT EXISTS (
        SELECT 1 FROM public.org_members om
        WHERE om.org_id = o.id 
          AND om.role = 'owner' 
          AND om.status = 'active'
      )
      ORDER BY o.created_at
      LIMIT 10
    LOOP
      RAISE NOTICE '   - % (slug: %) - Created: %', 
        org_record.name, 
        org_record.slug,
        org_record.created_at;
    END LOOP;
    IF orgs_without_owner > 10 THEN
      RAISE NOTICE '   ... and % more', (orgs_without_owner - 10);
    END IF;
    RAISE NOTICE '';
  END IF;

  -- ============================================
  -- 7. Check for Orphaned Data
  -- ============================================
  RAISE NOTICE '📊 DATA INTEGRITY CHECK';
  
  SELECT COUNT(*) INTO orphaned_properties
  FROM properties
  WHERE org_id IS NULL AND deleted_at IS NULL;
  
  SELECT COUNT(*) INTO orphaned_tenants
  FROM tenants
  WHERE org_id IS NULL AND deleted_at IS NULL;
  
  SELECT COUNT(*) INTO orphaned_contracts
  FROM contracts
  WHERE org_id IS NULL AND deleted_at IS NULL;
  
  SELECT COUNT(*) INTO orphaned_owners
  FROM property_owners
  WHERE org_id IS NULL AND deleted_at IS NULL;

  IF orphaned_properties > 0 THEN
    RAISE WARNING '   ⚠️  % properties without org_id', orphaned_properties;
  END IF;
  IF orphaned_tenants > 0 THEN
    RAISE WARNING '   ⚠️  % tenants without org_id', orphaned_tenants;
  END IF;
  IF orphaned_contracts > 0 THEN
    RAISE WARNING '   ⚠️  % contracts without org_id', orphaned_contracts;
  END IF;
  IF orphaned_owners > 0 THEN
    RAISE WARNING '   ⚠️  % property_owners without org_id', orphaned_owners;
  END IF;

  IF orphaned_properties = 0 AND orphaned_tenants = 0 
     AND orphaned_contracts = 0 AND orphaned_owners = 0 THEN
    RAISE NOTICE '   ✅ All data has org_id';
  END IF;

  RAISE NOTICE '';

  -- ============================================
  -- Summary & Recommendations
  -- ============================================
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RECOMMENDATIONS';
  RAISE NOTICE '========================================';
  
  IF users_without_org > 0 THEN
    RAISE NOTICE '🔧 Run fix_missing_org_memberships.sql to fix % users', users_without_org;
  END IF;
  
  IF orgs_without_owner > 0 THEN
    RAISE NOTICE '🔧 % orgs need owners - check manually', orgs_without_owner;
  END IF;
  
  IF NOT trigger_exists THEN
    RAISE NOTICE '🔧 Run org_phase2_new_user_trigger.sql to enable auto-org creation';
  END IF;

  IF users_without_org = 0 AND orgs_without_owner = 0 AND trigger_exists THEN
    RAISE NOTICE '✅ System looks healthy!';
  END IF;

  RAISE NOTICE '========================================';

END $$;

-- =====================================================
-- END OF DIAGNOSTICS
-- =====================================================

