/*
  Cookie Consent Logging Migration

  This migration creates the consent_logs table for GDPR/KVKK compliance:
  1. Creates consent_logs table to track user cookie consent decisions
  2. Stores consent records for 5 years minimum (legal requirement)
  3. Supports both authenticated and anonymous users
  4. Sets up RLS policies for secure data access

  ⚠️ IMPORTANT: This table is required for GDPR/KVKK compliance.
  Consent records must be stored for audit purposes and legal compliance.

  Compliance Standards:
  - GDPR Article 7: Conditions for consent
  - GDPR Article 30: Records of processing activities
  - KVKK Madde 5: Processing of personal data
*/

-- ============================================================================
-- STEP 1: CREATE consent_logs TABLE
-- ============================================================================
CREATE TABLE public.consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Consent Information
  timestamp TIMESTAMPTZ NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1.0', -- Consent banner version
  categories JSONB NOT NULL, -- Stores {essential: true, analytics: boolean, marketing: boolean}
  
  -- User Information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous users
  session_id TEXT NOT NULL, -- Unique session identifier
  
  -- Request Metadata
  user_agent TEXT, -- Browser user agent string
  language TEXT NOT NULL CHECK (language IN ('tr', 'en')), -- Consent language
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.consent_logs IS 'Stores user cookie consent decisions for GDPR/KVKK compliance. Records must be retained for 5 years minimum.';
COMMENT ON COLUMN public.consent_logs.id IS 'Primary key - unique identifier for each consent record';
COMMENT ON COLUMN public.consent_logs.timestamp IS 'When the consent decision was made (ISO 8601 timestamp)';
COMMENT ON COLUMN public.consent_logs.version IS 'Version of the consent banner/implementation (e.g., "v1.0")';
COMMENT ON COLUMN public.consent_logs.categories IS 'JSONB object storing consent for each category: {essential: true, analytics: boolean, marketing: boolean}';
COMMENT ON COLUMN public.consent_logs.user_id IS 'Foreign key to auth.users - NULL for anonymous users, populated if user is authenticated';
COMMENT ON COLUMN public.consent_logs.session_id IS 'Unique session identifier for tracking consent across page loads';
COMMENT ON COLUMN public.consent_logs.user_agent IS 'Browser user agent string for debugging and analytics';
COMMENT ON COLUMN public.consent_logs.language IS 'Language in which consent was given: "tr" (Turkish) or "en" (English)';
COMMENT ON COLUMN public.consent_logs.created_at IS 'Database record creation timestamp';

-- Log table creation
DO $$
BEGIN
  RAISE NOTICE '✅ consent_logs table created';
END $$;


-- ============================================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_consent_logs_user_id ON consent_logs(user_id);
CREATE INDEX idx_consent_logs_session_id ON consent_logs(session_id);
CREATE INDEX idx_consent_logs_timestamp ON consent_logs(timestamp);

-- Log index creation
DO $$
BEGIN
  RAISE NOTICE '✅ 3 indexes created on consent_logs table';
END $$;


-- ============================================================================
-- STEP 3: ENABLE RLS AND CREATE POLICIES
-- ============================================================================
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own consent logs
CREATE POLICY "Users can view own consent logs"
  ON consent_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Anyone can insert consent logs (for anonymous users)
CREATE POLICY "Anyone can insert consent logs"
  ON consent_logs FOR INSERT
  WITH CHECK (true);

-- Log RLS setup
DO $$
BEGIN
  RAISE NOTICE '✅ RLS enabled with SELECT and INSERT policies';
END $$;


-- ============================================================================
-- STEP 4: VALIDATION CHECKS
-- ============================================================================
-- Verify table exists and has correct structure
DO $$
DECLARE
  table_exists BOOLEAN;
  column_count INTEGER;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'consent_logs'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION 'Validation failed: consent_logs table does not exist';
  END IF;
  
  -- Check column count (should be 9 columns)
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'consent_logs';
  
  IF column_count < 9 THEN
    RAISE EXCEPTION 'Validation failed: consent_logs table has incorrect number of columns (%)', column_count;
  END IF;
  
  -- Check if indexes exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'consent_logs'
    AND indexname = 'idx_consent_logs_user_id'
  ) THEN
    RAISE EXCEPTION 'Validation failed: idx_consent_logs_user_id index does not exist';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'consent_logs'
    AND indexname = 'idx_consent_logs_session_id'
  ) THEN
    RAISE EXCEPTION 'Validation failed: idx_consent_logs_session_id index does not exist';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'consent_logs'
    AND indexname = 'idx_consent_logs_timestamp'
  ) THEN
    RAISE EXCEPTION 'Validation failed: idx_consent_logs_timestamp index does not exist';
  END IF;
  
  RAISE NOTICE '✅ Validation passed: All components created successfully';
END $$;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CONSENT LOGS MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - consent_logs table created';
  RAISE NOTICE '  - 3 indexes created';
  RAISE NOTICE '  - RLS policies enabled (SELECT, INSERT)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 NEXT STEPS:';
  RAISE NOTICE '  1. Verify migration success in logs';
  RAISE NOTICE '  2. Test INSERT: INSERT INTO consent_logs (timestamp, version, categories, session_id, language) VALUES (NOW(), ''v1.0'', ''{"essential": true, "analytics": false, "marketing": false}'', ''test-session'', ''tr'')';
  RAISE NOTICE '  3. Test RLS: Verify users can only see their own logs';
  RAISE NOTICE '  4. Proceed with Phase 2: Core Consent Logic';
  RAISE NOTICE '========================================';
END $$;


-- ============================================================================
-- ROLLBACK SCRIPT (Use only if migration fails)
-- ============================================================================
-- ⚠️ DANGER: This will remove all consent logging infrastructure
-- Only run if you need to completely revert this migration

/*
-- Drop policies
DROP POLICY IF EXISTS "Users can view own consent logs" ON consent_logs;
DROP POLICY IF EXISTS "Anyone can insert consent logs" ON consent_logs;

-- Disable RLS
ALTER TABLE consent_logs DISABLE ROW LEVEL SECURITY;

-- Drop indexes
DROP INDEX IF EXISTS idx_consent_logs_user_id;
DROP INDEX IF EXISTS idx_consent_logs_session_id;
DROP INDEX IF EXISTS idx_consent_logs_timestamp;

-- Drop table
DROP TABLE IF EXISTS consent_logs;

-- Log rollback
DO $$
BEGIN
  RAISE NOTICE '❌ Consent logs migration rolled back. All consent logging infrastructure removed.';
END $$;
*/



