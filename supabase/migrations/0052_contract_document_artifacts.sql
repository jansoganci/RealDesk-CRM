/*
  # Contract document artifacts (Item 4 — V1 draft PDFs)

  Stores immutable generation metadata for lease/purchase wizard PDFs:
  template_id, template_version, jurisdiction, generated_at, source_transaction_id.

  1. New table: contract_document_artifacts
  2. contracts.current_document_artifact_id pointer
  3. RLS via org membership (same pattern as deposit tracker)
*/

CREATE TABLE IF NOT EXISTS public.contract_document_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  deal_id uuid NULL,
  doc_type text NOT NULL CHECK (doc_type IN ('lease', 'purchase')),
  jurisdiction char(2) NOT NULL,
  template_id text NOT NULL,
  template_version text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source_transaction_id uuid NOT NULL,
  storage_path text NULL,
  input_snapshot jsonb NULL,
  counsel_approval_ref text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_document_artifacts_org_id
  ON public.contract_document_artifacts (org_id);

CREATE INDEX IF NOT EXISTS idx_contract_document_artifacts_contract_id
  ON public.contract_document_artifacts (contract_id);

CREATE INDEX IF NOT EXISTS idx_contract_document_artifacts_user_id
  ON public.contract_document_artifacts (user_id);

COMMENT ON TABLE public.contract_document_artifacts IS
  'Immutable metadata for generated RealDesk draft lease/purchase PDFs (template + jurisdiction provenance).';

COMMENT ON COLUMN public.contract_document_artifacts.source_transaction_id IS
  'Source transaction id — same as contract_id for wizard path.';

COMMENT ON COLUMN public.contract_document_artifacts.counsel_approval_ref IS
  'External counsel/ticket reference when a pack is attorney-approved; null for V1 drafts.';

-- Pointer only (no FK) to avoid circular dependency with contract_id → contracts.
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS current_document_artifact_id uuid NULL;

COMMENT ON COLUMN public.contracts.current_document_artifact_id IS
  'Latest contract_document_artifacts.id for the active generated PDF (no FK; app-maintained).';

ALTER TABLE public.contract_document_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org contract_document_artifacts"
  ON public.contract_document_artifacts
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert org contract_document_artifacts"
  ON public.contract_document_artifacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update org contract_document_artifacts"
  ON public.contract_document_artifacts
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete org contract_document_artifacts"
  ON public.contract_document_artifacts
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );
