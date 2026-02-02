-- Add handover_photos_url to contract_details
-- This stores the Google Drive folder link for property handover photos

ALTER TABLE contract_details
ADD COLUMN IF NOT EXISTS handover_photos_url TEXT;

-- Add comment
COMMENT ON COLUMN contract_details.handover_photos_url IS
'Google Drive folder URL containing property condition photos before tenant handover. Used to generate QR code on contract PDF.';
