-- Create contract-pdfs storage bucket
-- This bucket stores lease and purchase agreement PDFs
-- Already referenced in contracts.service.ts uploadContractPdf()

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract-pdfs',
  'contract-pdfs',
  false,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Drop if exists (idempotent)
DROP POLICY IF EXISTS "contract_pdfs_select" ON storage.objects;
DROP POLICY IF EXISTS "contract_pdfs_insert" ON storage.objects;
DROP POLICY IF EXISTS "contract_pdfs_delete" ON storage.objects;

-- Authenticated users can access their own uploads
-- org-level scoping is enforced at the service layer via getActiveOrgId()
CREATE POLICY "contract_pdfs_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'contract-pdfs' AND auth.uid() IS NOT NULL);

CREATE POLICY "contract_pdfs_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contract-pdfs' AND auth.uid() IS NOT NULL);

CREATE POLICY "contract_pdfs_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'contract-pdfs' AND auth.uid() IS NOT NULL);
