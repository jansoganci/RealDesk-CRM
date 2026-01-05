-- =====================================================
-- ORG MIGRATION - PHASE 2.3: New User Auto-Org Trigger
-- =====================================================
--
-- This migration creates a trigger that automatically:
-- 1. Creates an organization for each new user signup
-- 2. Adds the user as owner of their organization
--
-- The organization is created with:
-- - name: User's full_name from metadata, or email prefix, or "My Agency"
-- - slug: User's UUID (guaranteed unique)
--
-- IMPORTANT: Run this AFTER Phase 2.2 (new RLS policies)
--
-- ROLLBACK:
-- DROP TRIGGER IF EXISTS on_auth_user_created_org ON auth.users;
-- DROP FUNCTION IF EXISTS handle_new_user_org();
--
-- =====================================================

-- ============================================
-- 1. Create the trigger function
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user_org()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_org_id UUID;
  org_name TEXT;
BEGIN
  -- Determine organization name from user metadata
  org_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'My Agency'
  );

  -- Create organization for this user
  INSERT INTO public.organizations (name, slug)
  VALUES (org_name, NEW.id::text)
  RETURNING id INTO new_org_id;

  -- Add user as owner of their organization
  INSERT INTO public.org_members (org_id, user_id, role, status, joined_at)
  VALUES (new_org_id, NEW.id, 'owner', 'active', now());

  RETURN NEW;
END;
$$;

-- ============================================
-- 2. Create the trigger
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created_org ON auth.users;

CREATE TRIGGER on_auth_user_created_org
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_org();

-- ============================================
-- 3. Grant necessary permissions
-- ============================================
-- The trigger function runs as SECURITY DEFINER,
-- which means it runs with the privileges of the function owner.
-- This is necessary to bypass RLS when creating org records.

-- ============================================
-- Validation
-- ============================================
DO $$
BEGIN
  -- Check trigger exists
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created_org'
  ) THEN
    RAISE NOTICE '✅ Phase 2.3 Complete: New user org trigger created';
    RAISE NOTICE '   New users will automatically get:';
    RAISE NOTICE '   - An organization named after their profile';
    RAISE NOTICE '   - Owner role in that organization';
  ELSE
    RAISE EXCEPTION 'Trigger on_auth_user_created_org was not created';
  END IF;
END $$;

-- =====================================================
-- END OF PHASE 2
-- =====================================================
-- At this point:
-- ✅ Old user_id-based RLS policies are dropped
-- ✅ New org_id-based RLS policies are active
-- ✅ Owners have full CRUD access
-- ✅ Members have read-only access
-- ✅ Soft delete filtering is in place
-- ✅ New users automatically get an organization
--
-- The system is now fully multi-tenant!
--
-- Next steps (manual):
-- - Update frontend to use org_id context
-- - Update API/services to include org_id in inserts
-- - Test with existing users and new signups
-- =====================================================
