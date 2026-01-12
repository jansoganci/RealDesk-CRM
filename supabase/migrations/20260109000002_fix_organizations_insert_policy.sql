-- =====================================================
-- FIX: Organizations INSERT Policy - Critical Security Fix
-- =====================================================
--
-- PROBLEM:
-- Organizations tablosuna INSERT yapılabiliyor (TEST C1 FAILED)
-- Bu, herhangi bir authenticated user'ın sınırsız org oluşturabileceği anlamına gelir.
--
-- ROOT CAUSE:
-- Policy `WITH CHECK (auth.uid() IS NULL)` kullanıyor
-- Bu yanlış çünkü authenticated user'lar için auth.uid() NULL değil!
-- Policy geçiyor ve INSERT başarılı oluyor.
--
-- SOLUTION:
-- Policy'yi `WITH CHECK (false)` olarak değiştir
-- Bu, hiç kimsenin INSERT yapamayacağı anlamına gelir
-- Sadece SECURITY DEFINER trigger (handle_new_user) INSERT yapabilir
-- Trigger, auth.uid() context'i olmadan çalışır, RLS'i bypass eder
--
-- SAFE: Idempotent, can run multiple times
-- ROLLBACK: Re-run 20260104000002_fix_all_rls_policies_use_helper_function.sql
--
-- =====================================================

-- ============================================================================
-- STEP 1: Drop Existing Policy
-- ============================================================================

DROP POLICY IF EXISTS "org_insert_organizations" ON organizations;

-- ============================================================================
-- STEP 2: Create Correct Policy
-- ============================================================================

-- ✅ CORRECT: WITH CHECK (false) = No one can INSERT
-- Only SECURITY DEFINER trigger can INSERT (bypasses RLS)
CREATE POLICY "org_insert_organizations" ON organizations
FOR INSERT WITH CHECK (false);

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  policy_exists BOOLEAN;
  policy_has_false_check BOOLEAN;
BEGIN
  -- Check if policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND cmd = 'INSERT'
      AND policyname = 'org_insert_organizations'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    RAISE EXCEPTION 'FAILED: org_insert_organizations policy not found';
  END IF;
  
  -- Check if policy uses WITH CHECK (false)
  SELECT with_check::text LIKE '%false%' INTO policy_has_false_check
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'organizations'
    AND cmd = 'INSERT'
    AND policyname = 'org_insert_organizations';
  
  IF NOT policy_has_false_check THEN
    RAISE EXCEPTION 'FAILED: Policy does not use WITH CHECK (false)';
  END IF;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ ORGANIZATIONS INSERT POLICY FIXED';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Policy updated:';
  RAISE NOTICE '  - Name: org_insert_organizations';
  RAISE NOTICE '  - Operation: INSERT';
  RAISE NOTICE '  - WITH CHECK: false (completely blocked)';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  - ✅ Users cannot create organizations';
  RAISE NOTICE '  - ✅ Only SECURITY DEFINER trigger can create orgs';
  RAISE NOTICE '  - ✅ TEST C1 should now PASS';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Validation passed';
  RAISE NOTICE '=====================================================';
  
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
