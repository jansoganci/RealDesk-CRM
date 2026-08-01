/*
  # CCPA deletion progress (Item 7)

  1. data_subject_requests
     - deletion_progress (jsonb) — per-table status/counts for resumable delete
     - deletion_started_at (timestamptz)
     - status CHECK extended with 'processing'

  2. No RLS changes — existing org-member policies still apply
*/

ALTER TABLE public.data_subject_requests
  ADD COLUMN IF NOT EXISTS deletion_progress jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.data_subject_requests
  ADD COLUMN IF NOT EXISTS deletion_started_at timestamptz;

ALTER TABLE public.data_subject_requests
  DROP CONSTRAINT IF EXISTS data_subject_requests_status_check;

ALTER TABLE public.data_subject_requests
  ADD CONSTRAINT data_subject_requests_status_check
  CHECK (
    status = ANY (
      ARRAY[
        'pending'::text,
        'in_review'::text,
        'verification_sent'::text,
        'processing'::text,
        'completed'::text,
        'denied'::text
      ]
    )
  );

COMMENT ON COLUMN public.data_subject_requests.deletion_progress IS
  'Per-table CCPA delete progress: { table: { status, count, action, reason, error } }';

COMMENT ON COLUMN public.data_subject_requests.deletion_started_at IS
  'When delete processing first started (idempotent resume anchor)';
