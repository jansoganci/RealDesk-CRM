-- =====================================================
-- ONBOARDING RESPONSES - Flexible storage for survey answers
-- =====================================================
--
-- This migration creates the user_onboarding_responses table
-- to store user answers during the onboarding flow for BI analysis.
--
-- =====================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.user_onboarding_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    question_key TEXT NOT NULL,
    answer JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, question_key)
);

-- 2. Add comments
COMMENT ON TABLE public.user_onboarding_responses IS 'Stores user responses to onboarding survey questions for business intelligence.';
COMMENT ON COLUMN public.user_onboarding_responses.question_key IS 'Unique key for the onboarding question (e.g., goal, experience_level, referral_source)';
COMMENT ON COLUMN public.user_onboarding_responses.answer IS 'JSONB storage for the answer, supporting strings, arrays, or objects';

-- 3. Enable Row Level Security
ALTER TABLE public.user_onboarding_responses ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DROP POLICY IF EXISTS "onboarding_responses_select" ON public.user_onboarding_responses;
DROP POLICY IF EXISTS "onboarding_responses_insert" ON public.user_onboarding_responses;
DROP POLICY IF EXISTS "onboarding_responses_update" ON public.user_onboarding_responses;

-- Users can read their own responses
CREATE POLICY "onboarding_responses_select" ON public.user_onboarding_responses
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "onboarding_responses_insert" ON public.user_onboarding_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own responses
CREATE POLICY "onboarding_responses_update" ON public.user_onboarding_responses
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. Create Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_responses_user_id ON public.user_onboarding_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_responses_org_id ON public.user_onboarding_responses(org_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_responses_question_key ON public.user_onboarding_responses(question_key);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_user_onboarding_responses_updated_at ON public.user_onboarding_responses;
CREATE TRIGGER tr_user_onboarding_responses_updated_at
    BEFORE UPDATE ON public.user_onboarding_responses
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();
