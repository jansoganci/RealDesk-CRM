-- 0012: Add pipeline_stage column to property_inquiries
-- pipeline_stage is the spec-required column name; it is kept in sync with
-- the existing `status` column via a BEFORE INSERT/UPDATE trigger so that
-- all existing service code continues to work without change.

ALTER TABLE public.property_inquiries
  ADD COLUMN IF NOT EXISTS pipeline_stage text;

-- Backfill from current status values
UPDATE public.property_inquiries
SET pipeline_stage = status
WHERE pipeline_stage IS NULL;

-- Allow the same values as the status CHECK (plus NULL during migration window)
ALTER TABLE public.property_inquiries
  ADD CONSTRAINT property_inquiries_pipeline_stage_check
  CHECK (
    pipeline_stage IS NULL
    OR pipeline_stage = ANY (ARRAY[
      'new'::text,
      'contacted'::text,
      'qualified'::text,
      'active'::text,
      'matched'::text,
      'under_contract'::text,
      'closed_won'::text,
      'closed_lost'::text,
      'converted'::text,
      'closed'::text
    ])
  );

-- Trigger function: keeps pipeline_stage = status on every write
CREATE OR REPLACE FUNCTION public.sync_pipeline_stage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.pipeline_stage := NEW.status;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_pipeline_stage ON public.property_inquiries;

CREATE TRIGGER trg_sync_pipeline_stage
  BEFORE INSERT OR UPDATE OF status
  ON public.property_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_pipeline_stage();

CREATE INDEX IF NOT EXISTS idx_property_inquiries_pipeline_stage
  ON public.property_inquiries USING btree (pipeline_stage);
