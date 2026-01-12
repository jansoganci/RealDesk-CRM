-- =====================================================
-- QUICK CHECK: Are we running with RLS enabled?
-- =====================================================
-- Run this BEFORE running the M2 test
-- This will tell you if RLS is being enforced

SELECT 
  'Current Context' as check_type,
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ Service Role (RLS BYPASSED!)'
    ELSE '✅ Authenticated User (RLS ACTIVE)'
  END as rls_status,
  current_setting('request.jwt.claims', true)::json->>'sub' as jwt_user_id;

-- Check if test user exists and is owner
SELECT 
  'Test User Check' as check_type,
  '6d604b30-a2f3-446e-adc6-be07ab6ad83a'::uuid as test_user_id,
  EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = '6d604b30-a2f3-446e-adc6-be07ab6ad83a'::uuid
      AND org_id = 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c'::uuid
      AND status = 'active'
      AND role = 'owner'
  ) as is_owner,
  CASE 
    WHEN auth.uid() = '6d604b30-a2f3-446e-adc6-be07ab6ad83a'::uuid THEN '✅ Matches'
    WHEN auth.uid() IS NULL THEN '⚠️  Service role - RLS bypassed'
    ELSE '⚠️  Different user - policy will check auth.uid()'
  END as user_match;

-- Try a simple RLS test
DO $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE WARNING '========================================';
    RAISE WARNING '⚠️  CRITICAL: Running as SERVICE ROLE!';
    RAISE WARNING '========================================';
    RAISE WARNING '';
    RAISE WARNING 'RLS policies are BYPASSED when running as service role.';
    RAISE WARNING 'All security tests will FAIL because RLS is not enforced.';
    RAISE WARNING '';
    RAISE WARNING 'SOLUTION:';
    RAISE WARNING '1. Go to Supabase Dashboard';
    RAISE WARNING '2. SQL Editor → Settings → Switch to "User" mode (not Service Role)';
    RAISE WARNING '3. Or use Supabase client with authenticated user';
    RAISE WARNING '';
  ELSE
    RAISE NOTICE '✅ Running as authenticated user: %', auth.uid();
    RAISE NOTICE '✅ RLS policies will be enforced';
  END IF;
END $$;
