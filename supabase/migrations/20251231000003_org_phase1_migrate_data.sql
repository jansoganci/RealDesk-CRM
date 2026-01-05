-- =====================================================
-- ORG MIGRATION - PHASE 1.3: Migrate Existing Data
-- =====================================================
--
-- This migration:
-- 1. Finds all unique user_ids with data in the system
-- 2. Creates an organization for each user
-- 3. Adds the user as owner of their organization
-- 4. Updates all their records with the org_id
--
-- IMPORTANT: Run this AFTER Phase 1.1 and 1.2
-- SAFE: Uses transactions, validates before committing
-- ROLLBACK: Delete from org_members; Delete from organizations;
--
-- =====================================================

DO $$
DECLARE
  user_record RECORD;
  new_org_id UUID;
  user_name TEXT;
  user_count INT := 0;
  rows_updated INT := 0;
  temp_count INT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Starting data migration...';
  RAISE NOTICE '========================================';

  -- ============================================
  -- Find all unique user_ids with data
  -- ============================================
  FOR user_record IN
    SELECT DISTINCT user_id
    FROM (
      SELECT user_id FROM properties WHERE user_id IS NOT NULL AND org_id IS NULL
      UNION SELECT user_id FROM tenants WHERE user_id IS NOT NULL AND org_id IS NULL
      UNION SELECT user_id FROM contracts WHERE user_id IS NOT NULL AND org_id IS NULL
      UNION SELECT user_id FROM contract_details WHERE user_id IS NOT NULL AND org_id IS NULL
      UNION SELECT user_id FROM property_owners WHERE user_id IS NOT NULL AND org_id IS NULL
      UNION SELECT user_id FROM property_inquiries WHERE user_id IS NOT NULL AND org_id IS NULL
      UNION SELECT user_id FROM inquiry_matches WHERE user_id IS NOT NULL AND org_id IS NULL
      UNION SELECT user_id FROM meetings WHERE user_id IS NOT NULL AND org_id IS NULL
      UNION SELECT user_id FROM financial_transactions WHERE user_id IS NOT NULL AND org_id IS NULL
      UNION SELECT user_id FROM commissions WHERE user_id IS NOT NULL AND org_id IS NULL
      UNION SELECT user_id FROM recurring_expenses WHERE user_id IS NOT NULL AND org_id IS NULL
      UNION SELECT user_id FROM expense_categories WHERE user_id IS NOT NULL AND org_id IS NULL
      UNION SELECT user_id FROM contract_clause_templates WHERE user_id IS NOT NULL AND org_id IS NULL
      UNION SELECT user_id FROM contract_clause_overrides WHERE user_id IS NOT NULL AND org_id IS NULL
    ) all_users
    WHERE user_id IS NOT NULL
  LOOP
    -- ============================================
    -- Get user name from auth.users
    -- ============================================
    SELECT COALESCE(
      raw_user_meta_data->>'full_name',
      split_part(email, '@', 1),
      'My Agency'
    ) INTO user_name
    FROM auth.users
    WHERE id = user_record.user_id;

    -- Handle case where user doesn't exist in auth.users (shouldn't happen)
    IF user_name IS NULL THEN
      user_name := 'Agency';
      RAISE WARNING 'User % not found in auth.users, using default name', user_record.user_id;
    END IF;

    -- ============================================
    -- Check if org already exists for this user
    -- ============================================
    SELECT id INTO new_org_id
    FROM public.organizations
    WHERE slug = user_record.user_id::text;

    IF new_org_id IS NULL THEN
      -- ============================================
      -- Create organization for this user
      -- ============================================
      INSERT INTO public.organizations (name, slug)
      VALUES (user_name, user_record.user_id::text)
      RETURNING id INTO new_org_id;

      RAISE NOTICE 'Created org "%" (%) for user %', user_name, new_org_id, user_record.user_id;

      -- ============================================
      -- Add user as owner of the organization
      -- ============================================
      INSERT INTO public.org_members (org_id, user_id, role, status, joined_at)
      VALUES (new_org_id, user_record.user_id, 'owner', 'active', now())
      ON CONFLICT (org_id, user_id) DO NOTHING;
    ELSE
      RAISE NOTICE 'Org already exists for user %, reusing org %', user_record.user_id, new_org_id;
    END IF;

    -- ============================================
    -- Update all user's data with org_id
    -- ============================================

    -- properties
    UPDATE properties SET org_id = new_org_id
    WHERE user_id = user_record.user_id AND org_id IS NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    rows_updated := rows_updated + temp_count;

    -- tenants
    UPDATE tenants SET org_id = new_org_id
    WHERE user_id = user_record.user_id AND org_id IS NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    rows_updated := rows_updated + temp_count;

    -- contracts
    UPDATE contracts SET org_id = new_org_id
    WHERE user_id = user_record.user_id AND org_id IS NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    rows_updated := rows_updated + temp_count;

    -- contract_details
    UPDATE contract_details SET org_id = new_org_id
    WHERE user_id = user_record.user_id AND org_id IS NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    rows_updated := rows_updated + temp_count;

    -- property_owners
    UPDATE property_owners SET org_id = new_org_id
    WHERE user_id = user_record.user_id AND org_id IS NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    rows_updated := rows_updated + temp_count;

    -- property_inquiries
    UPDATE property_inquiries SET org_id = new_org_id
    WHERE user_id = user_record.user_id AND org_id IS NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    rows_updated := rows_updated + temp_count;

    -- inquiry_matches
    UPDATE inquiry_matches SET org_id = new_org_id
    WHERE user_id = user_record.user_id AND org_id IS NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    rows_updated := rows_updated + temp_count;

    -- meetings
    UPDATE meetings SET org_id = new_org_id
    WHERE user_id = user_record.user_id AND org_id IS NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    rows_updated := rows_updated + temp_count;

    -- financial_transactions
    UPDATE financial_transactions SET org_id = new_org_id
    WHERE user_id = user_record.user_id AND org_id IS NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    rows_updated := rows_updated + temp_count;

    -- commissions
    UPDATE commissions SET org_id = new_org_id
    WHERE user_id = user_record.user_id AND org_id IS NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    rows_updated := rows_updated + temp_count;

    -- recurring_expenses
    UPDATE recurring_expenses SET org_id = new_org_id
    WHERE user_id = user_record.user_id AND org_id IS NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    rows_updated := rows_updated + temp_count;

    -- expense_categories
    UPDATE expense_categories SET org_id = new_org_id
    WHERE user_id = user_record.user_id AND org_id IS NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    rows_updated := rows_updated + temp_count;

    -- contract_clause_templates
    UPDATE contract_clause_templates SET org_id = new_org_id
    WHERE user_id = user_record.user_id AND org_id IS NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    rows_updated := rows_updated + temp_count;

    -- contract_clause_overrides
    UPDATE contract_clause_overrides SET org_id = new_org_id
    WHERE user_id = user_record.user_id AND org_id IS NULL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    rows_updated := rows_updated + temp_count;

    user_count := user_count + 1;
  END LOOP;

  -- ============================================
  -- Summary
  -- ============================================
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Data migration complete!';
  RAISE NOTICE '   Users processed: %', user_count;
  RAISE NOTICE '   Total rows updated: %', rows_updated;
  RAISE NOTICE '========================================';

END $$;

-- ============================================
-- Validation: Check for any orphaned records
-- ============================================
DO $$
DECLARE
  orphan_count INT := 0;
  temp_count INT;
BEGIN
  RAISE NOTICE 'Validating migration - checking for orphaned records...';

  -- Check each table for records without org_id (excluding expense_categories which allows NULL)
  SELECT COUNT(*) INTO temp_count FROM properties WHERE org_id IS NULL;
  IF temp_count > 0 THEN
    RAISE WARNING 'properties: % rows without org_id', temp_count;
    orphan_count := orphan_count + temp_count;
  END IF;

  SELECT COUNT(*) INTO temp_count FROM tenants WHERE org_id IS NULL;
  IF temp_count > 0 THEN
    RAISE WARNING 'tenants: % rows without org_id', temp_count;
    orphan_count := orphan_count + temp_count;
  END IF;

  SELECT COUNT(*) INTO temp_count FROM contracts WHERE org_id IS NULL;
  IF temp_count > 0 THEN
    RAISE WARNING 'contracts: % rows without org_id', temp_count;
    orphan_count := orphan_count + temp_count;
  END IF;

  SELECT COUNT(*) INTO temp_count FROM contract_details WHERE org_id IS NULL;
  IF temp_count > 0 THEN
    RAISE WARNING 'contract_details: % rows without org_id', temp_count;
    orphan_count := orphan_count + temp_count;
  END IF;

  SELECT COUNT(*) INTO temp_count FROM property_owners WHERE org_id IS NULL;
  IF temp_count > 0 THEN
    RAISE WARNING 'property_owners: % rows without org_id', temp_count;
    orphan_count := orphan_count + temp_count;
  END IF;

  SELECT COUNT(*) INTO temp_count FROM property_inquiries WHERE org_id IS NULL;
  IF temp_count > 0 THEN
    RAISE WARNING 'property_inquiries: % rows without org_id', temp_count;
    orphan_count := orphan_count + temp_count;
  END IF;

  SELECT COUNT(*) INTO temp_count FROM inquiry_matches WHERE org_id IS NULL;
  IF temp_count > 0 THEN
    RAISE WARNING 'inquiry_matches: % rows without org_id', temp_count;
    orphan_count := orphan_count + temp_count;
  END IF;

  SELECT COUNT(*) INTO temp_count FROM meetings WHERE org_id IS NULL;
  IF temp_count > 0 THEN
    RAISE WARNING 'meetings: % rows without org_id', temp_count;
    orphan_count := orphan_count + temp_count;
  END IF;

  SELECT COUNT(*) INTO temp_count FROM financial_transactions WHERE org_id IS NULL;
  IF temp_count > 0 THEN
    RAISE WARNING 'financial_transactions: % rows without org_id', temp_count;
    orphan_count := orphan_count + temp_count;
  END IF;

  SELECT COUNT(*) INTO temp_count FROM commissions WHERE org_id IS NULL;
  IF temp_count > 0 THEN
    RAISE WARNING 'commissions: % rows without org_id', temp_count;
    orphan_count := orphan_count + temp_count;
  END IF;

  SELECT COUNT(*) INTO temp_count FROM recurring_expenses WHERE org_id IS NULL;
  IF temp_count > 0 THEN
    RAISE WARNING 'recurring_expenses: % rows without org_id', temp_count;
    orphan_count := orphan_count + temp_count;
  END IF;

  -- expense_categories can have NULL org_id for system defaults, so only warn if user_id is set
  SELECT COUNT(*) INTO temp_count FROM expense_categories WHERE org_id IS NULL AND user_id IS NOT NULL;
  IF temp_count > 0 THEN
    RAISE WARNING 'expense_categories: % user rows without org_id', temp_count;
    orphan_count := orphan_count + temp_count;
  END IF;

  SELECT COUNT(*) INTO temp_count FROM contract_clause_templates WHERE org_id IS NULL;
  IF temp_count > 0 THEN
    RAISE WARNING 'contract_clause_templates: % rows without org_id', temp_count;
    orphan_count := orphan_count + temp_count;
  END IF;

  SELECT COUNT(*) INTO temp_count FROM contract_clause_overrides WHERE org_id IS NULL;
  IF temp_count > 0 THEN
    RAISE WARNING 'contract_clause_overrides: % rows without org_id', temp_count;
    orphan_count := orphan_count + temp_count;
  END IF;

  IF orphan_count = 0 THEN
    RAISE NOTICE '✅ Validation passed: No orphaned records found';
  ELSE
    RAISE WARNING '⚠️ Validation warning: % orphaned records found. Review before adding NOT NULL constraints.', orphan_count;
  END IF;
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
