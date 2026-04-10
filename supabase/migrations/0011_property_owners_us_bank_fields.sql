-- US bank + optional Tax ID (EIN) on property owners.
--
-- LEGACY: tc_encrypted, iban_encrypted kept for backward
-- compatibility with existing rental contracts.
-- Will be removed in Sprint 8 cleanup migration.

ALTER TABLE public.property_owners
  ADD COLUMN IF NOT EXISTS routing_number_encrypted text,
  ADD COLUMN IF NOT EXISTS account_number_encrypted text,
  ADD COLUMN IF NOT EXISTS tax_id text;

COMMENT ON COLUMN public.property_owners.routing_number_encrypted IS 'AES-256-GCM encrypted US ABA routing number (9 digits)';
COMMENT ON COLUMN public.property_owners.account_number_encrypted IS 'AES-256-GCM encrypted US bank account number';
COMMENT ON COLUMN public.property_owners.tax_id IS 'Optional Tax ID / EIN (plain text; not SSN)';
