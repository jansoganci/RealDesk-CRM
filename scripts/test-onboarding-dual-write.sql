-- =====================================================
-- ONBOARDING DUAL-WRITE VERIFICATION QUERIES
-- =====================================================
-- Run these queries in Supabase SQL Editor to verify
-- that dual-write is working correctly
-- =====================================================

-- =====================================================
-- TEST 1: Verify Dual-Write for Primary Use Case
-- =====================================================
-- This query checks if organizations with primary_use_case
-- also have corresponding entries in user_onboarding_responses
SELECT 
  o.id as org_id,
  o.name as org_name,
  o.primary_use_case as org_table_value,
  uor.answer::text as responses_table_value,
  CASE 
    WHEN o.primary_use_case IS NOT NULL AND uor.answer IS NULL THEN '❌ MISSING in responses table'
    WHEN o.primary_use_case IS NULL AND uor.answer IS NOT NULL THEN '⚠️ EXTRA in responses table'
    WHEN o.primary_use_case::text = uor.answer::text THEN '✅ MATCH'
    ELSE '⚠️ MISMATCH'
  END as status
FROM organizations o
LEFT JOIN org_members om ON om.org_id = o.id AND om.role = 'owner' AND om.status = 'active'
LEFT JOIN user_onboarding_responses uor 
  ON uor.user_id = om.user_id 
  AND uor.question_key = 'primary_use_case'
WHERE o.primary_use_case IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 20;

-- =====================================================
-- TEST 2: Verify Dual-Write for Team Size
-- =====================================================
-- This query checks if organizations with team_size_range
-- also have corresponding entries in user_onboarding_responses
SELECT 
  o.id as org_id,
  o.name as org_name,
  o.team_size_range as org_table_value,
  uor.answer::text as responses_table_value,
  CASE 
    WHEN o.team_size_range IS NOT NULL AND uor.answer IS NULL THEN '❌ MISSING in responses table'
    WHEN o.team_size_range IS NULL AND uor.answer IS NOT NULL THEN '⚠️ EXTRA in responses table'
    WHEN o.team_size_range::text = uor.answer::text THEN '✅ MATCH'
    ELSE '⚠️ MISMATCH'
  END as status
FROM organizations o
LEFT JOIN org_members om ON om.org_id = o.id AND om.role = 'owner' AND om.status = 'active'
LEFT JOIN user_onboarding_responses uor 
  ON uor.user_id = om.user_id 
  AND uor.question_key = 'team_size'
WHERE o.team_size_range IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 20;

-- =====================================================
-- TEST 3: Count Summary Statistics
-- =====================================================
-- Compare counts between old and new tables
SELECT 
  'primary_use_case' as question_key,
  COUNT(DISTINCT o.id) FILTER (WHERE o.primary_use_case IS NOT NULL) as orgs_with_value,
  COUNT(DISTINCT uor.id) FILTER (WHERE uor.question_key = 'primary_use_case') as responses_count,
  COUNT(DISTINCT o.id) FILTER (
    WHERE o.primary_use_case IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM org_members om 
      JOIN user_onboarding_responses uor2 
        ON uor2.user_id = om.user_id 
        AND uor2.question_key = 'primary_use_case'
      WHERE om.org_id = o.id 
        AND om.role = 'owner' 
        AND om.status = 'active'
    )
  ) as orgs_with_matching_response
FROM organizations o
LEFT JOIN org_members om ON om.org_id = o.id AND om.role = 'owner' AND om.status = 'active'
LEFT JOIN user_onboarding_responses uor ON uor.user_id = om.user_id

UNION ALL

SELECT 
  'team_size' as question_key,
  COUNT(DISTINCT o.id) FILTER (WHERE o.team_size_range IS NOT NULL) as orgs_with_value,
  COUNT(DISTINCT uor.id) FILTER (WHERE uor.question_key = 'team_size') as responses_count,
  COUNT(DISTINCT o.id) FILTER (
    WHERE o.team_size_range IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM org_members om 
      JOIN user_onboarding_responses uor2 
        ON uor2.user_id = om.user_id 
        AND uor2.question_key = 'team_size'
      WHERE om.org_id = o.id 
        AND om.role = 'owner' 
        AND om.status = 'active'
    )
  ) as orgs_with_matching_response
FROM organizations o
LEFT JOIN org_members om ON om.org_id = o.id AND om.role = 'owner' AND om.status = 'active'
LEFT JOIN user_onboarding_responses uor ON uor.user_id = om.user_id;

-- =====================================================
-- TEST 4: Find Orgs Missing in Responses Table
-- =====================================================
-- Find organizations that have values but no corresponding response
SELECT 
  o.id as org_id,
  o.name as org_name,
  om.user_id as owner_user_id,
  'primary_use_case' as missing_question,
  o.primary_use_case as org_value
FROM organizations o
INNER JOIN org_members om ON om.org_id = o.id AND om.role = 'owner' AND om.status = 'active'
LEFT JOIN user_onboarding_responses uor 
  ON uor.user_id = om.user_id 
  AND uor.question_key = 'primary_use_case'
WHERE o.primary_use_case IS NOT NULL
  AND uor.id IS NULL

UNION ALL

SELECT 
  o.id as org_id,
  o.name as org_name,
  om.user_id as owner_user_id,
  'team_size' as missing_question,
  o.team_size_range as org_value
FROM organizations o
INNER JOIN org_members om ON om.org_id = o.id AND om.role = 'owner' AND om.status = 'active'
LEFT JOIN user_onboarding_responses uor 
  ON uor.user_id = om.user_id 
  AND uor.question_key = 'team_size'
WHERE o.team_size_range IS NOT NULL
  AND uor.id IS NULL;

-- =====================================================
-- TEST 5: Verify Recent Writes (Last 24 Hours)
-- =====================================================
-- Check if recent organization updates also appear in responses table
SELECT 
  o.id as org_id,
  o.name as org_name,
  o.updated_at as org_updated_at,
  o.primary_use_case as org_primary_use_case,
  uor.answer::text as response_value,
  uor.updated_at as response_updated_at,
  CASE 
    WHEN uor.updated_at IS NOT NULL 
      AND uor.updated_at >= o.updated_at - INTERVAL '1 minute' THEN '✅ Recent dual-write'
    WHEN uor.updated_at IS NOT NULL THEN '⚠️ Response older than org update'
    ELSE '❌ No response found'
  END as status
FROM organizations o
INNER JOIN org_members om ON om.org_id = o.id AND om.role = 'owner' AND om.status = 'active'
LEFT JOIN user_onboarding_responses uor 
  ON uor.user_id = om.user_id 
  AND uor.question_key = 'primary_use_case'
WHERE o.updated_at >= NOW() - INTERVAL '24 hours'
  AND o.primary_use_case IS NOT NULL
ORDER BY o.updated_at DESC
LIMIT 10;
