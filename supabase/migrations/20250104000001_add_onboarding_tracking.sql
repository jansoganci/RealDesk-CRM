-- =====================================================
-- ONBOARDING TRACKING - Add onboarding columns and events table
-- =====================================================
--
-- This migration adds onboarding tracking to organizations table
-- and creates onboarding_events table for analytics
--
-- SAFE TO RUN: Adds new columns with defaults, creates new table
-- ROLLBACK: 
--   ALTER TABLE organizations DROP COLUMN IF EXISTS onboarding_completed,
--   DROP COLUMN IF EXISTS onboarding_completed_at,
--   DROP COLUMN IF EXISTS primary_use_case,
--   DROP COLUMN IF EXISTS team_size_range,
--   DROP COLUMN IF EXISTS onboarding_skipped,
--   DROP COLUMN IF EXISTS onboarding_skipped_at;
--   DROP TABLE IF EXISTS onboarding_events;
--
-- =====================================================

-- ============================================
-- 1. Add onboarding columns to organizations table
-- ============================================
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS primary_use_case TEXT,
ADD COLUMN IF NOT EXISTS team_size_range TEXT,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_skipped_at TIMESTAMPTZ;

COMMENT ON COLUMN organizations.onboarding_completed IS 'Whether user has completed the onboarding flow';
COMMENT ON COLUMN organizations.primary_use_case IS 'Primary use case selected in Step 1: properties, clients, contracts, team, all';
COMMENT ON COLUMN organizations.team_size_range IS 'Team size range selected in Step 2: 1, 2-5, 6-20, 21+';

-- ============================================
-- 2. Create onboarding_events table for analytics
-- ============================================
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  action_taken TEXT NOT NULL CHECK (action_taken IN ('completed', 'skipped', 'abandoned')),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE onboarding_events IS 'Tracks onboarding step completion for analytics';
COMMENT ON COLUMN onboarding_events.step_number IS 'Step number (1, 2, or 3)';
COMMENT ON COLUMN onboarding_events.step_name IS 'Step name: goal_selection, organization_setup, quick_start';
COMMENT ON COLUMN onboarding_events.action_taken IS 'Action: completed, skipped, or abandoned';
COMMENT ON COLUMN onboarding_events.data IS 'Additional data stored as JSON (e.g., selected options)';

-- ============================================
-- 3. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_onboarding_events_org_id 
ON onboarding_events(org_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id 
ON onboarding_events(user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_created_at 
ON onboarding_events(created_at);

CREATE INDEX IF NOT EXISTS idx_organizations_onboarding_completed 
ON organizations(onboarding_completed) 
WHERE onboarding_completed = FALSE;

-- ============================================
-- 4. Enable RLS on onboarding_events table
-- ============================================
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent migration)
DROP POLICY IF EXISTS "onboarding_events_select" ON onboarding_events;
DROP POLICY IF EXISTS "onboarding_events_insert" ON onboarding_events;

-- SELECT: Users can read their own org's events
CREATE POLICY "onboarding_events_select" ON onboarding_events
FOR SELECT USING (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- INSERT: Users can insert events for their own org
CREATE POLICY "onboarding_events_insert" ON onboarding_events
FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

