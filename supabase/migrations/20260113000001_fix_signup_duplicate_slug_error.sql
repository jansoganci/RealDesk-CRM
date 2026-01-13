-- =====================================================
-- FIX: Signup 500 Error - Duplicate Slug Constraint
-- =====================================================
--
-- PROBLEM:
-- Signup fails with: "duplicate key value violates unique constraint organizations_slug_key"
-- This happens when:
--   1. User was partially created (exists in auth.users but signup failed)
--   2. Trigger tries to create org with slug = user.id, but org already exists
--   3. Transaction fails, causing 500 error
--
-- SOLUTION:
-- Update trigger to check if org already exists for user
-- If exists, reuse it instead of creating new one
-- Handle org_members insert with ON CONFLICT DO NOTHING
--
-- SAFE: Idempotent, can run multiple times
-- ROLLBACK: Re-run 20251231000007_org_phase2_new_user_trigger.sql
--
-- =====================================================

-- ============================================
-- 1. Update the trigger function
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

  -- Check if organization already exists for this user (by slug = user.id)
  SELECT id INTO new_org_id
  FROM public.organizations
  WHERE slug = NEW.id::text;

  -- If org doesn't exist, create it
  IF new_org_id IS NULL THEN
    INSERT INTO public.organizations (name, slug)
    VALUES (org_name, NEW.id::text)
    RETURNING id INTO new_org_id;
  END IF;

  -- Add user as owner of their organization (ON CONFLICT handles duplicates)
  INSERT INTO public.org_members (org_id, user_id, role, status, joined_at)
  VALUES (new_org_id, NEW.id, 'owner', 'active', now())
  ON CONFLICT (org_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================
-- 2. Validation
-- ============================================
DO $$
DECLARE
  function_exists BOOLEAN;
BEGIN
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'handle_new_user_org'
  ) INTO function_exists;

  IF NOT function_exists THEN
    RAISE EXCEPTION 'FAILED: handle_new_user_org function not found';
  END IF;

  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ SIGNUP TRIGGER FIXED';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Checks if org exists before creating';
  RAISE NOTICE '  - Reuses existing org if found';
  RAISE NOTICE '  - Handles duplicate org_members gracefully';
  RAISE NOTICE '';
  RAISE NOTICE 'This fixes the 500 error:';
  RAISE NOTICE '  "duplicate key value violates unique constraint organizations_slug_key"';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Validation passed';
  RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
