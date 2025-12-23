-- ============================================================================
-- Editable Contract Clauses System
-- Template System with Override Pattern
-- Created: 2024-12-24
-- ============================================================================
--
-- This migration creates the infrastructure for per-contract editable clauses:
-- 1. contract_clause_templates: Default clause templates per user
-- 2. contract_clause_overrides: Per-contract customized clauses
-- 3. RLS policies: 4-policy pattern (SELECT, INSERT, UPDATE, DELETE) per table
-- 4. Indexes: Performance optimization for lookups
-- 5. Seed function: Populate default templates for new users
--
-- ============================================================================

-- ============================================================================
-- 1. CREATE contract_clause_templates TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contract_clause_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Clause identification
  clause_type TEXT NOT NULL CHECK (clause_type IN ('GENEL_SARTLAR', 'OZEL_SARTLAR', 'TAHLIYE_TAAHHUTNAMESI')),
  clause_index INTEGER NOT NULL CHECK (clause_index >= 0),

  -- Content (supports template variables like {{paymentDay}}, {{ownerIBAN}})
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(user_id, clause_type, clause_index)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clause_templates_user_id
  ON contract_clause_templates(user_id);

CREATE INDEX IF NOT EXISTS idx_clause_templates_user_type
  ON contract_clause_templates(user_id, clause_type);

CREATE INDEX IF NOT EXISTS idx_clause_templates_active
  ON contract_clause_templates(user_id, is_active)
  WHERE is_active = true;

-- Table comments
COMMENT ON TABLE contract_clause_templates IS
  'Default clause templates per user (seeded from contractContent.ts). Each user has their own set of 33 templates (13 GENEL_SARTLAR + 19 OZEL_SARTLAR + 1 TAHLIYE_TAAHHUTNAMESI).';

COMMENT ON COLUMN contract_clause_templates.clause_type IS
  'Type of clause: GENEL_SARTLAR (general conditions), OZEL_SARTLAR (special conditions), or TAHLIYE_TAAHHUTNAMESI (eviction commitment)';

COMMENT ON COLUMN contract_clause_templates.clause_index IS
  'Zero-based position in array (e.g., 0-12 for GENEL_SARTLAR)';

COMMENT ON COLUMN contract_clause_templates.content IS
  'Clause text. Supports template variables: {{paymentDay}}, {{ownerIBAN}}, {{ownerName}}, {{tenantName}}, {{contractDate}}';

-- ============================================================================
-- 2. CREATE contract_clause_overrides TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contract_clause_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Clause identification
  clause_type TEXT NOT NULL CHECK (clause_type IN ('GENEL_SARTLAR', 'OZEL_SARTLAR', 'TAHLIYE_TAAHHUTNAMESI')),
  clause_index INTEGER NOT NULL CHECK (clause_index >= 0),

  -- Custom content
  custom_content TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(contract_id, clause_type, clause_index)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clause_overrides_contract_id
  ON contract_clause_overrides(contract_id);

CREATE INDEX IF NOT EXISTS idx_clause_overrides_user_id
  ON contract_clause_overrides(user_id);

CREATE INDEX IF NOT EXISTS idx_clause_overrides_contract_type
  ON contract_clause_overrides(contract_id, clause_type);

-- Table comments
COMMENT ON TABLE contract_clause_overrides IS
  'Per-contract clause customizations. When a user edits a clause for a specific contract, the customized text is stored here. During PDF generation, overrides take precedence over templates.';

COMMENT ON COLUMN contract_clause_overrides.custom_content IS
  'Customized clause text. Still supports template variables ({{paymentDay}}, etc.) which are replaced at PDF generation time.';

-- ============================================================================
-- 3. ROW LEVEL SECURITY (4-policy pattern per table)
-- ============================================================================

-- Enable RLS on contract_clause_templates
ALTER TABLE contract_clause_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for migration re-run safety)
DROP POLICY IF EXISTS "Users can view their own clause templates" ON contract_clause_templates;
DROP POLICY IF EXISTS "Users can insert their own clause templates" ON contract_clause_templates;
DROP POLICY IF EXISTS "Users can update their own clause templates" ON contract_clause_templates;
DROP POLICY IF EXISTS "Users can delete their own clause templates" ON contract_clause_templates;

-- Templates: SELECT policy
CREATE POLICY "Users can view their own clause templates"
  ON contract_clause_templates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Templates: INSERT policy
CREATE POLICY "Users can insert their own clause templates"
  ON contract_clause_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Templates: UPDATE policy
CREATE POLICY "Users can update their own clause templates"
  ON contract_clause_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Templates: DELETE policy
CREATE POLICY "Users can delete their own clause templates"
  ON contract_clause_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on contract_clause_overrides
ALTER TABLE contract_clause_overrides ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own clause overrides" ON contract_clause_overrides;
DROP POLICY IF EXISTS "Users can insert their own clause overrides" ON contract_clause_overrides;
DROP POLICY IF EXISTS "Users can update their own clause overrides" ON contract_clause_overrides;
DROP POLICY IF EXISTS "Users can delete their own clause overrides" ON contract_clause_overrides;

-- Overrides: SELECT policy
CREATE POLICY "Users can view their own clause overrides"
  ON contract_clause_overrides
  FOR SELECT
  USING (auth.uid() = user_id);

-- Overrides: INSERT policy
CREATE POLICY "Users can insert their own clause overrides"
  ON contract_clause_overrides
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Overrides: UPDATE policy
CREATE POLICY "Users can update their own clause overrides"
  ON contract_clause_overrides
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Overrides: DELETE policy
CREATE POLICY "Users can delete their own clause overrides"
  ON contract_clause_overrides
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. DATABASE FUNCTION: Check if user needs template seeding
-- ============================================================================

CREATE OR REPLACE FUNCTION seed_default_clause_templates(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if templates already exist for this user
  IF EXISTS (
    SELECT 1
    FROM contract_clause_templates
    WHERE user_id = p_user_id
    LIMIT 1
  ) THEN
    -- Templates already seeded, skip
    RAISE NOTICE 'Templates already exist for user %', p_user_id;
    RETURN;
  END IF;

  -- Note: Actual template seeding is done in the application layer
  -- (clausesService.seedTemplatesForUser) which reads from contractContent.ts
  -- This function just checks if seeding is needed

  RAISE NOTICE 'User % needs clause templates seeded (to be done in app layer)', p_user_id;
END;
$$;

COMMENT ON FUNCTION seed_default_clause_templates IS
  'Checks if user needs template seeding. Actual seeding is done in application layer (clausesService.seedTemplatesForUser) which reads default clauses from contractContent.ts and inserts 33 templates (13 GENEL_SARTLAR + 19 OZEL_SARTLAR + 1 TAHLIYE_TAAHHUTNAMESI).';

-- ============================================================================
-- 5. TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to contract_clause_templates
DROP TRIGGER IF EXISTS update_contract_clause_templates_updated_at ON contract_clause_templates;
CREATE TRIGGER update_contract_clause_templates_updated_at
  BEFORE UPDATE ON contract_clause_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to contract_clause_overrides
DROP TRIGGER IF EXISTS update_contract_clause_overrides_updated_at ON contract_clause_overrides;
CREATE TRIGGER update_contract_clause_overrides_updated_at
  BEFORE UPDATE ON contract_clause_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verification queries (run manually after migration):
--
-- 1. Check tables exist:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name LIKE '%clause%';
--
-- 2. Check RLS enabled:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename IN ('contract_clause_templates', 'contract_clause_overrides');
--
-- 3. Check policies (should have 8 total: 4 per table):
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE tablename IN ('contract_clause_templates', 'contract_clause_overrides')
-- ORDER BY tablename, policyname;
--
-- 4. Check indexes:
-- SELECT indexname, tablename
-- FROM pg_indexes
-- WHERE tablename IN ('contract_clause_templates', 'contract_clause_overrides')
-- ORDER BY tablename, indexname;
