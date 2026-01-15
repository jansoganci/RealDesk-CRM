-- =====================================================
-- ADD INDEXES FOR USER_ONBOARDING_RESPONSES TABLE
-- =====================================================
--
-- This migration adds composite indexes to improve query performance
-- for analytics queries on the user_onboarding_responses table.
--
-- =====================================================

-- Composite index for common analytics query pattern:
-- "Get all responses for question X across organization Y"
-- This is a new composite index that combines org_id and question_key
-- for efficient analytics queries
CREATE INDEX IF NOT EXISTS idx_onboarding_responses_org_question 
ON user_onboarding_responses(org_id, question_key);

-- Index on user_id
-- Note: A similar index (idx_onboarding_responses_user_id) already exists from
-- the original migration, but this creates the requested index name
CREATE INDEX IF NOT EXISTS idx_onboarding_responses_user 
ON user_onboarding_responses(user_id);

-- Comments
COMMENT ON INDEX idx_onboarding_responses_org_question IS 'Composite index for querying responses by organization and question key (analytics queries)';
COMMENT ON INDEX idx_onboarding_responses_user IS 'Index for querying all responses for a specific user';

-- Comments
COMMENT ON INDEX idx_onboarding_responses_org_question IS 'Composite index for querying responses by organization and question key (analytics queries)';
COMMENT ON INDEX idx_onboarding_responses_user IS 'Index for querying all responses for a specific user';
