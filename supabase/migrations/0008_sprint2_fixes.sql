-- Sprint 2 audit fixes: buyer_agent_agreements + showing_logs

-- ---------------------------------------------------------------------------
-- 1) buyer_agent_agreements fixes
-- ---------------------------------------------------------------------------

ALTER TABLE public.buyer_agent_agreements
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

UPDATE public.buyer_agent_agreements baa
SET user_id = (
  SELECT pi.user_id
  FROM public.property_inquiries pi
  WHERE pi.id = baa.lead_id
  LIMIT 1
)
WHERE baa.user_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.buyer_agent_agreements
    WHERE user_id IS NULL
  ) THEN
    RAISE NOTICE 'buyer_agent_agreements.user_id still has NULL rows; keeping nullable for safety.';
  ELSE
    ALTER TABLE public.buyer_agent_agreements
      ALTER COLUMN user_id SET NOT NULL;
  END IF;
END
$$;

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = rel.oid
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'buyer_agent_agreements'
      AND con.contype = 'c'
      AND att.attname = 'status'
      AND att.attnum = ANY (con.conkey)
  LOOP
    EXECUTE format(
      'ALTER TABLE public.buyer_agent_agreements DROP CONSTRAINT IF EXISTS %I',
      c.conname
    );
  END LOOP;
END
$$;

UPDATE public.buyer_agent_agreements
SET status = lower(status)
WHERE status IS NOT NULL;

UPDATE public.buyer_agent_agreements
SET status = 'active'
WHERE status = 'active';

UPDATE public.buyer_agent_agreements
SET status = 'draft'
WHERE status IS NULL
   OR status NOT IN ('draft', 'sent', 'signed', 'active', 'expired', 'terminated');

ALTER TABLE public.buyer_agent_agreements
  ADD CONSTRAINT buyer_agent_agreements_status_check
  CHECK (status IN ('draft', 'sent', 'signed', 'active', 'expired', 'terminated'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'buyer_agent_agreements'
      AND column_name = 'sign_date'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'buyer_agent_agreements'
      AND column_name = 'signed_date'
  ) THEN
    ALTER TABLE public.buyer_agent_agreements
      RENAME COLUMN sign_date TO signed_date;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 2) showing_logs fixes
-- ---------------------------------------------------------------------------

ALTER TABLE public.showing_logs
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

UPDATE public.showing_logs sl
SET user_id = (
  SELECT pi.user_id
  FROM public.property_inquiries pi
  WHERE pi.id = sl.lead_id
  LIMIT 1
)
WHERE sl.user_id IS NULL;

ALTER TABLE public.showing_logs
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.showing_logs
  ADD COLUMN IF NOT EXISTS feedback_enum text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'showing_logs'
      AND con.conname = 'showing_logs_feedback_enum_check'
  ) THEN
    ALTER TABLE public.showing_logs
      ADD CONSTRAINT showing_logs_feedback_enum_check
      CHECK (feedback_enum IN ('loved', 'interested', 'pass'));
  END IF;
END
$$;

UPDATE public.showing_logs
SET feedback_enum = CASE interest_level
  WHEN 'high' THEN 'loved'
  WHEN 'medium' THEN 'interested'
  WHEN 'low' THEN 'pass'
  WHEN 'none' THEN 'pass'
  ELSE 'interested'
END
WHERE feedback_enum IS NULL;

-- ---------------------------------------------------------------------------
-- 3) Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS baa_user_id_idx
  ON public.buyer_agent_agreements(user_id);

CREATE INDEX IF NOT EXISTS showing_logs_user_id_idx
  ON public.showing_logs(user_id);
