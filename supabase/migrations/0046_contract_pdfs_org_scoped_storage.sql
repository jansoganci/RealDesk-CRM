-- 0046: Org-scope the contract-pdfs storage bucket (OWASP A01 — critical, see
-- docs/security/OWASP_TOP10_AUDIT_2026-07.md).
--
-- Problem: the policies created in 0032_create_contract_pdfs_bucket.sql only check
-- `auth.uid() IS NOT NULL`, with no ownership/org check. Any authenticated user, in
-- any org, can list/download/delete every org's lease and purchase-agreement PDFs
-- via the Storage API directly (bypassing whatever the app's service layer does).
--
-- Fix: mirror the pattern already used for the deal-documents bucket
-- (0014_sprint4_notifications_and_deal_documents.sql) — require the object's path
-- to start with an org id the requesting user is an active member of. As of this
-- migration, all app code that uploads into this bucket writes paths as
-- `{orgId}/...` (see contracts.service.ts, purchaseAgreement.service.ts,
-- contractPdfEngine.service.ts on branch hermes/fix-contract-pdfs-org-scope).
--
-- NOTE ON EXISTING OBJECTS: this migration only changes policies — it does not
-- touch any existing row or object. Objects uploaded before this migration used
-- inconsistent, non-org-prefixed paths (`contracts/...`, `purchases/{orgId}/...`,
-- `v2/...`) and will fail the new SELECT/UPDATE/DELETE policies (their first path
-- segment isn't an org id) until they are backfilled. That backfill CANNOT be done
-- in SQL: `storage.objects.name` is the literal object key in the storage backend,
-- so `UPDATE storage.objects SET name = ...` desyncs the DB row from the physical
-- bytes instead of moving them, silently breaking every affected download. The
-- real move must go through the Storage API's move() call, which needs the
-- service_role key — see the companion script:
--   scripts/backfill-contract-pdfs-org-scope.ts (not run yet — requires
--   separate approval, same as this migration).

DROP POLICY IF EXISTS "contract_pdfs_select" ON storage.objects;
DROP POLICY IF EXISTS "contract_pdfs_insert" ON storage.objects;
DROP POLICY IF EXISTS "contract_pdfs_delete" ON storage.objects;

-- Path convention: first segment of `name` is always the owning org_id.
-- get_user_org_ids() returns the active org_ids for auth.uid() (defined in
-- 0001_baseline_from_legacy.sql, SECURITY DEFINER, already used by deal-documents).

CREATE POLICY "contract_pdfs_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contract-pdfs'
  AND split_part(name, '/', 1) IN (
    SELECT public.get_user_org_ids()::text
  )
);

CREATE POLICY "contract_pdfs_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contract-pdfs'
  AND split_part(name, '/', 1) IN (
    SELECT public.get_user_org_ids()::text
  )
);

-- New: no UPDATE policy existed before this migration. contractPdfEngine.service.ts
-- (v2 sale PDFs) and the FHA/VA addendum uploaders call `.upload(..., { upsert: true })`,
-- which Supabase Storage executes as an UPDATE against storage.objects when the
-- object already exists — that was previously relying on undocumented/default
-- behavior rather than an explicit grant.
CREATE POLICY "contract_pdfs_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'contract-pdfs'
  AND split_part(name, '/', 1) IN (
    SELECT public.get_user_org_ids()::text
  )
)
WITH CHECK (
  bucket_id = 'contract-pdfs'
  AND split_part(name, '/', 1) IN (
    SELECT public.get_user_org_ids()::text
  )
);

CREATE POLICY "contract_pdfs_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contract-pdfs'
  AND split_part(name, '/', 1) IN (
    SELECT public.get_user_org_ids()::text
  )
);

-- ---------------------------------------------------------------------------
-- Backfill (NOT executed here — documentation only, see note above).
--
-- For each pre-existing object under this bucket, the real fix is:
--   1. Determine the owning org_id:
--      - contracts.contract_pdf_path            -> contracts.org_id (direct)
--      - purchase_details.fha_addendum_path      -> purchase_details.org_id (direct)
--      - purchase_details.va_addendum_path        -> purchase_details.org_id (direct)
--      - contract_instances_v2.pdf_path           -> derive via
--          SELECT org_id FROM org_members
--          WHERE user_id = contract_instances_v2.user_id AND status = 'active'
--          LIMIT 1
--        (contract_instances_v2 has no org_id column of its own)
--   2. Compute new_path:
--      - paths already under 'purchases/{orgId}/...' -> move the org segment to
--        the front: '{orgId}/purchases/{contractId}/...'
--      - all other paths (bare 'contracts/...' or 'v2/...') -> prepend:
--        '{orgId}/{old_path}'
--   3. Call storage.from('contract-pdfs').move(old_path, new_path) with the
--      service_role client (this performs the actual backend rename).
--   4. On success, UPDATE the owning row's path column to new_path.
--   5. If org_id cannot be determined (orphaned row, deleted contract), skip and
--      log — never delete the object.
--
-- Implemented in scripts/backfill-contract-pdfs-org-scope.ts. Do not run against
-- production until explicitly approved — it mutates production storage objects
-- and rows, same as this migration's policy change.
