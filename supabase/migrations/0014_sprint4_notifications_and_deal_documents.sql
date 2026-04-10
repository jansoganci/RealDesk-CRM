-- 0014: Sprint 4 T2 - notifications table + RLS + deal-documents storage bucket/policies

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.deal_milestones(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  action_url text,
  is_read boolean NOT NULL DEFAULT false,
  is_dismissed boolean NOT NULL DEFAULT false,
  snoozed_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_alert_type_check CHECK (
    alert_type = ANY (ARRAY[
      'overdue'::text,
      'due_today'::text,
      'due_3d'::text,
      'due_7d'::text,
      'waiting_on_others'::text,
      'closing_soon'::text,
      'prerequisite_missing'::text
    ])
  )
);

CREATE INDEX IF NOT EXISTS notifications_org_user_created_idx
  ON public.notifications (org_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, is_read, is_dismissed, snoozed_until, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_deal_idx
  ON public.notifications (deal_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select
ON public.notifications
FOR SELECT
USING (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
  AND is_dismissed = false
  AND (snoozed_until IS NULL OR snoozed_until < now())
);

DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert
ON public.notifications
FOR INSERT
WITH CHECK (
  org_id IN (SELECT public.get_user_org_ids())
  AND user_id = auth.uid()
);

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update
ON public.notifications
FOR UPDATE
USING (
  user_id = auth.uid()
  AND org_id IN (SELECT public.get_user_org_ids())
)
WITH CHECK (
  user_id = auth.uid()
  AND org_id IN (SELECT public.get_user_org_ids())
);

DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete
ON public.notifications
FOR DELETE
USING (
  user_id = auth.uid()
  AND org_id IN (SELECT public.get_user_org_ids())
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deal-documents',
  'deal-documents',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS deal_documents_select ON storage.objects;
CREATE POLICY deal_documents_select
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'deal-documents'
  AND split_part(name, '/', 1) IN (
    SELECT public.get_user_org_ids()::text
  )
);

DROP POLICY IF EXISTS deal_documents_insert ON storage.objects;
CREATE POLICY deal_documents_insert
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'deal-documents'
  AND split_part(name, '/', 1) IN (
    SELECT public.get_user_org_ids()::text
  )
);

DROP POLICY IF EXISTS deal_documents_update ON storage.objects;
CREATE POLICY deal_documents_update
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'deal-documents'
  AND split_part(name, '/', 1) IN (
    SELECT public.get_user_org_ids()::text
  )
)
WITH CHECK (
  bucket_id = 'deal-documents'
  AND split_part(name, '/', 1) IN (
    SELECT public.get_user_org_ids()::text
  )
);

DROP POLICY IF EXISTS deal_documents_delete ON storage.objects;
CREATE POLICY deal_documents_delete
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'deal-documents'
  AND split_part(name, '/', 1) IN (
    SELECT public.get_user_org_ids()::text
  )
);
