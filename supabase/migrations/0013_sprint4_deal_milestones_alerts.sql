-- 0013: Sprint 4 T1 - extend deal_milestones for alert tracking and documents

ALTER TABLE public.deal_milestones
  ADD COLUMN IF NOT EXISTS alert_sent_7d boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alert_sent_3d boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alert_sent_1d boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alert_sent_today boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_nudge_sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS document_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS document_path text,
  ADD COLUMN IF NOT EXISTS document_uploaded_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS deal_milestones_alert_idx
  ON public.deal_milestones (due_date, status, alert_sent_3d)
  WHERE status = 'pending';
