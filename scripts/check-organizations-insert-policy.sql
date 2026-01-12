-- =====================================================
-- CHECK: Organizations INSERT Policy
-- =====================================================
-- Bu sorgu, organizations tablosundaki INSERT policy'sini kontrol eder

SELECT 
  policyname,
  cmd as operation,
  qual::text as using_clause,
  with_check::text as with_check_clause,
  CASE 
    WHEN with_check::text LIKE '%false%' THEN '✅ BLOCKED (WITH CHECK false)'
    WHEN with_check::text LIKE '%auth.uid() IS NULL%' THEN '❌ UNSAFE (auth.uid() IS NULL allows authenticated users!)'
    WHEN with_check::text LIKE '%true%' THEN '❌ UNSAFE (allows everyone!)'
    ELSE '⚠️  CHECK MANUALLY'
  END as security_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'organizations'
  AND cmd = 'INSERT';

-- =====================================================
-- FIX: Organizations INSERT Policy
-- =====================================================
-- Eğer policy güvensizse, bu sorguyu çalıştır

-- Önce mevcut policy'yi kaldır
DROP POLICY IF EXISTS "org_insert_organizations" ON organizations;

-- Doğru policy'yi oluştur (WITH CHECK false = hiç kimse INSERT yapamaz)
CREATE POLICY "org_insert_organizations" ON organizations
FOR INSERT WITH CHECK (false);

-- Açıklama:
-- - WITH CHECK (false) = Hiç kimse INSERT yapamaz
-- - Sadece SECURITY DEFINER trigger (handle_new_user) INSERT yapabilir
-- - Trigger, auth.uid() context'i olmadan çalışır, bu yüzden RLS'i bypass eder
