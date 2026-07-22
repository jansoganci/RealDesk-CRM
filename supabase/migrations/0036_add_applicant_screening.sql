-- 0036: Sprint 7 - Applicant Screening table

CREATE TABLE IF NOT EXISTS public.applicant_screenings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id                 UUID REFERENCES public.property_inquiries(id) ON DELETE SET NULL,
  created_by              UUID NOT NULL REFERENCES auth.users(id),
  applicant_name          TEXT NOT NULL,
  applicant_email         TEXT,
  applicant_phone         TEXT,
  screening_status        TEXT NOT NULL DEFAULT 'pending'
                            CHECK (screening_status IN ('pending','in_review','approved','rejected','flagged')),
  background_check        BOOLEAN NOT NULL DEFAULT FALSE,
  credit_check            BOOLEAN NOT NULL DEFAULT FALSE,
  employment_verification BOOLEAN NOT NULL DEFAULT FALSE,
  landlord_reference      BOOLEAN NOT NULL DEFAULT FALSE,
  income_verification     BOOLEAN NOT NULL DEFAULT FALSE,
  notes                   TEXT,
  property_id             UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  desired_move_in_date    DATE,
  monthly_income          NUMERIC(12,2),
  credit_score            INTEGER CHECK (credit_score >= 300 AND credit_score <= 850),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at_applicant_screenings()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_applicant_screenings_updated_at
  BEFORE UPDATE ON public.applicant_screenings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_applicant_screenings();

-- RLS
ALTER TABLE public.applicant_screenings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applicant_screenings_select"
  ON public.applicant_screenings FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "applicant_screenings_insert"
  ON public.applicant_screenings FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "applicant_screenings_update"
  ON public.applicant_screenings FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "applicant_screenings_delete"
  ON public.applicant_screenings FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS applicant_screenings_org_id_idx
  ON public.applicant_screenings (org_id);

CREATE INDEX IF NOT EXISTS applicant_screenings_status_idx
  ON public.applicant_screenings (org_id, screening_status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS applicant_screenings_property_id_idx
  ON public.applicant_screenings (property_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS applicant_screenings_lead_id_idx
  ON public.applicant_screenings (lead_id)
  WHERE deleted_at IS NULL;
