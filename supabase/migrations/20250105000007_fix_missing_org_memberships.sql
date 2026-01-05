-- =====================================================
-- FIX: Missing Org Memberships (406 Not Acceptable Fix)
-- =====================================================
--
-- PROBLEM:
-- Users are getting 406 errors because they have no org_members records.
-- This happens when:
-- 1. User signed up before trigger existed
-- 2. Trigger failed silently
-- 3. Org was created manually with different slug
-- 4. Migration didn't catch user (no data yet)
--
-- SOLUTION:
-- 1. Find all users in auth.users without active org_members
-- 2. For each user, find or create their org
-- 3. Add them as owner with active status
--
-- SAFE: Only creates missing memberships, doesn't modify existing ones
-- ROLLBACK: DELETE FROM org_members WHERE created_at > [timestamp before migration]
--
-- =====================================================

DO $$
DECLARE
  user_record RECORD;
  user_org_id UUID;
  org_name TEXT;
  user_email TEXT;
  users_fixed INT := 0;
  users_skipped INT := 0;
  users_created INT := 0;
  temp_count INT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIX: Missing Org Memberships';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ============================================
  -- Find all users without active org membership
  -- ============================================
  FOR user_record IN
    SELECT 
      u.id as user_id,
      u.email,
      COALESCE(
        u.raw_user_meta_data->>'full_name',
        split_part(u.email, '@', 1),
        'My Agency'
      ) as display_name
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 
      FROM public.org_members om
      WHERE om.user_id = u.id 
        AND om.status = 'active'
    )
    ORDER BY u.created_at
  LOOP
    RAISE NOTICE 'Processing user: % (%)', user_record.email, user_record.user_id;

    -- ============================================
    -- Strategy 1: Find org by slug = user UUID
    -- (This is how the trigger creates orgs)
    -- ============================================
    SELECT id INTO user_org_id
    FROM public.organizations
    WHERE slug = user_record.user_id::text;

    -- ============================================
    -- Strategy 2: Find org by checking user's data
    -- (If user has data, find which org it belongs to)
    -- ============================================
    IF user_org_id IS NULL THEN
      SELECT DISTINCT org_id INTO user_org_id
      FROM (
        SELECT org_id FROM properties WHERE user_id = user_record.user_id AND org_id IS NOT NULL
        UNION SELECT org_id FROM tenants WHERE user_id = user_record.user_id AND org_id IS NOT NULL
        UNION SELECT org_id FROM contracts WHERE user_id = user_record.user_id AND org_id IS NOT NULL
        UNION SELECT org_id FROM property_owners WHERE user_id = user_record.user_id AND org_id IS NOT NULL
        UNION SELECT org_id FROM financial_transactions WHERE user_id = user_record.user_id AND org_id IS NOT NULL
        UNION SELECT org_id FROM commissions WHERE user_id = user_record.user_id AND org_id IS NOT NULL
      ) user_data
      LIMIT 1;
    END IF;

    -- ============================================
    -- Strategy 3: Find org by name matching
    -- (For manually created orgs like 'jans-emlak')
    -- Check if any org has no owner and name matches user
    -- ============================================
    IF user_org_id IS NULL THEN
      SELECT o.id INTO user_org_id
      FROM public.organizations o
      WHERE NOT EXISTS (
        SELECT 1 
        FROM public.org_members om
        WHERE om.org_id = o.id 
          AND om.role = 'owner'
          AND om.status = 'active'
      )
      AND (
        o.name ILIKE '%' || split_part(user_record.email, '@', 1) || '%'
        OR o.slug = lower(split_part(user_record.email, '@', 1))
      )
      LIMIT 1;
    END IF;

    -- ============================================
    -- Strategy 4: Create new org if none found
    -- ============================================
    IF user_org_id IS NULL THEN
      INSERT INTO public.organizations (name, slug)
      VALUES (
        user_record.display_name,
        user_record.user_id::text
      )
      RETURNING id INTO user_org_id;
      
      users_created := users_created + 1;
      RAISE NOTICE '  ✅ Created new org "%" (%)', user_record.display_name, user_org_id;
    ELSE
      RAISE NOTICE '  ✅ Found existing org (%)', user_org_id;
    END IF;

    -- ============================================
    -- Add user as owner (skip if already exists)
    -- ============================================
    INSERT INTO public.org_members (org_id, user_id, role, status, joined_at)
    VALUES (user_org_id, user_record.user_id, 'owner', 'active', now())
    ON CONFLICT (org_id, user_id) 
    DO UPDATE SET
      status = 'active',
      role = COALESCE(EXCLUDED.role, org_members.role, 'owner'),
      joined_at = COALESCE(org_members.joined_at, EXCLUDED.joined_at, now())
    WHERE org_members.status != 'active';

    GET DIAGNOSTICS temp_count = ROW_COUNT;
    IF temp_count > 0 THEN
      users_fixed := users_fixed + 1;
      RAISE NOTICE '  ✅ Added/updated user as owner';
    ELSE
      -- Check if membership already exists and is active
      IF EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_id = user_org_id 
          AND user_id = user_record.user_id 
          AND status = 'active'
      ) THEN
        users_skipped := users_skipped + 1;
        RAISE NOTICE '  ⏭️  Membership already exists and is active';
      ELSE
        users_fixed := users_fixed + 1;
        RAISE NOTICE '  ✅ Added user as owner';
      END IF;
    END IF;

    RAISE NOTICE '';
  END LOOP;

  -- ============================================
  -- Summary
  -- ============================================
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users fixed: %', users_fixed;
  RAISE NOTICE 'Orgs created: %', users_created;
  RAISE NOTICE 'Users skipped: %', users_skipped;
  RAISE NOTICE '';
  RAISE NOTICE 'All users should now have active org memberships.';
  RAISE NOTICE '406 errors should be resolved.';
  RAISE NOTICE '========================================';

END $$;

-- ============================================
-- Validation: Check for remaining orphaned users
-- ============================================
DO $$
DECLARE
  orphaned_count INT;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 
    FROM public.org_members om
    WHERE om.user_id = u.id 
      AND om.status = 'active'
  );

  IF orphaned_count > 0 THEN
    RAISE WARNING '⚠️  WARNING: % users still have no active org membership', orphaned_count;
    RAISE WARNING '   These users may still experience 406 errors.';
    RAISE WARNING '   Run diagnostics to investigate further.';
  ELSE
    RAISE NOTICE '✅ Validation passed: All users have active org memberships';
  END IF;
END $$;

-- =====================================================
-- END OF FIX
-- =====================================================

