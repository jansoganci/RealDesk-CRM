-- Add PDF storage path to contract_instances_v2
-- Part of Contract PDF Engine v2 implementation
-- Reference: IMPL-SPEC-contract-pdf-engine-v2.md

-- Add pdf_path column
ALTER TABLE contract_instances_v2
ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- Add index for queries filtering by PDF existence
CREATE INDEX IF NOT EXISTS idx_contract_instances_v2_has_pdf
ON contract_instances_v2 (user_id, type)
WHERE pdf_path IS NOT NULL;

-- Comment
COMMENT ON COLUMN contract_instances_v2.pdf_path IS 'Supabase Storage path to generated PDF file';

