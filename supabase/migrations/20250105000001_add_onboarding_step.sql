-- =====================================================
-- ONBOARDING STEP TRACKING - Add onboarding_step column
-- =====================================================
--
-- This migration adds onboarding_step column to track last completed step
-- for resume functionality
--
-- SAFE TO RUN: Adds new column with default value
-- ROLLBACK: ALTER TABLE organizations DROP COLUMN IF EXISTS onboarding_step;
--
-- =====================================================

-- ============================================
-- 1. Add onboarding_step column to organizations table
-- ============================================
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

COMMENT ON COLUMN organizations.onboarding_step IS 'Tracks last completed onboarding step: 0 = none, 1 = step 1, 2 = step 2, 3 = step 3';

-- ============================================
-- 2. Update existing records based on current data
-- ============================================
-- If primary_use_case exists, user completed Step 1
UPDATE organizations
SET onboarding_step = 1
WHERE primary_use_case IS NOT NULL 
  AND onboarding_step = 0;

-- If team_size_range exists, user completed Step 2
UPDATE organizations
SET onboarding_step = 2
WHERE team_size_range IS NOT NULL 
  AND onboarding_step < 2;

-- If onboarding_completed = TRUE, user completed Step 3
UPDATE organizations
SET onboarding_step = 3
WHERE onboarding_completed = TRUE 
  AND onboarding_step < 3;

