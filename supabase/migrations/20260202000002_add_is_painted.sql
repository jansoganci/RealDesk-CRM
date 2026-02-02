-- Add is_painted to contract_details
-- This column tracks whether the property was handed over painted or unpainted

ALTER TABLE contract_details
ADD COLUMN IF NOT EXISTS is_painted BOOLEAN;

COMMENT ON COLUMN contract_details.is_painted IS
'Whether the property was handed over painted (true) or unpainted (false).';
