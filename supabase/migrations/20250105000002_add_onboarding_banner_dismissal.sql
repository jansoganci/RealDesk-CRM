-- =====================================================
-- ONBOARDING BANNER DISMISSAL - Add column to user_preferences
-- =====================================================
--
-- This migration adds onboarding_banner_dismissed_at column to track
-- when user dismissed the completion banner
--
-- SAFE TO RUN: Adds new column with default NULL
-- ROLLBACK: ALTER TABLE user_preferences DROP COLUMN IF EXISTS onboarding_banner_dismissed_at;
--
-- =====================================================

-- ============================================
-- 1. Add onboarding_banner_dismissed_at column
-- ============================================
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS onboarding_banner_dismissed_at BIGINT;

COMMENT ON COLUMN user_preferences.onboarding_banner_dismissed_at IS 'Timestamp (milliseconds) when user dismissed the onboarding completion banner. Banner reappears after 7 days.';

