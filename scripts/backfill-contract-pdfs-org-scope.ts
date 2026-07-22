/**
 * Backfill: re-key existing contract-pdfs storage objects to `{orgId}/...` paths.
 *
 * Companion to supabase/migrations/0046_contract_pdfs_org_scoped_storage.sql.
 * That migration org-scopes the bucket's RLS policies going forward; this script
 * migrates objects uploaded before it, which used inconsistent, non-org-prefixed
 * paths and would otherwise 403 under the new policies.
 *
 * Why this can't be a SQL migration: `storage.objects.name` is the literal object
 * key in the storage backend. Updating that column via SQL desyncs the DB row from
 * the physical bytes instead of moving them. The actual rename has to go through
 * the Storage API's move(), which needs the service_role key.
 *
 * Safety:
 * - Defaults to DRY RUN — only prints the planned old -> new path map.
 * - Pass --apply to actually call storage.move() and update the owning row.
 * - Never deletes anything. Rows/objects it can't confidently resolve an org_id
 *   for are skipped and logged, left exactly as-is.
 * - Idempotent: objects already under `{orgId}/...` are skipped.
 *
 * Run with: npx tsx scripts/backfill-contract-pdfs-org-scope.ts [--apply]
 * Requires: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (service_role — never
 * VITE_-prefixed, never committed).
 *
 * Do NOT run with --apply against production until explicitly approved.
 */

import { createClient } from '@supabase/supabase-js';

const BUCKET = 'contract-pdfs';
const APPLY = process.argv.includes('--apply');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface PlannedMove {
  source: 'contracts.contract_pdf_path' | 'purchase_details.fha_addendum_path' | 'purchase_details.va_addendum_path' | 'contract_instances_v2.pdf_path';
  rowId: string;
  updateColumn: string;
  updateTable: 'contracts' | 'purchase_details' | 'contract_instances_v2';
  oldPath: string;
  newPath: string;
}

interface SkippedRow {
  source: string;
  rowId: string;
  path: string;
  reason: string;
}

const planned: PlannedMove[] = [];
const skipped: SkippedRow[] = [];
const alreadyMigrated: string[] = [];

/** First path segment is the org id once migrated; UUID length is fixed (36 chars). */
function isUuid(segment: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
}

function computeNewPath(oldPath: string, orgId: string): string {
  const parts = oldPath.split('/');
  if (parts[0] === 'purchases' && isUuid(parts[1])) {
    // purchases/{orgId}/{rest...} -> {orgId}/purchases/{rest...}
    const rest = parts.slice(2).join('/');
    return `${orgId}/purchases/${rest}`;
  }
  // contracts/... or v2/... -> {orgId}/contracts/... or {orgId}/v2/...
  return `${orgId}/${oldPath}`;
}

function planOrSkip(args: {
  source: PlannedMove['source'];
  rowId: string;
  updateTable: PlannedMove['updateTable'];
  updateColumn: string;
  oldPath: string | null;
  orgId: string | null;
}): void {
  const { source, rowId, updateTable, updateColumn, oldPath, orgId } = args;
  if (!oldPath) return;

  if (!orgId) {
    skipped.push({ source, rowId, path: oldPath, reason: 'could not resolve org_id' });
    return;
  }

  const firstSegment = oldPath.split('/')[0];
  if (isUuid(firstSegment)) {
    alreadyMigrated.push(`${source}:${rowId}`);
    return;
  }

  planned.push({
    source,
    rowId,
    updateTable,
    updateColumn,
    oldPath,
    newPath: computeNewPath(oldPath, orgId),
  });
}

async function collectContracts(): Promise<void> {
  const { data, error } = await supabase
    .from('contracts')
    .select('id, org_id, contract_pdf_path')
    .not('contract_pdf_path', 'is', null);
  if (error) throw error;

  for (const row of data ?? []) {
    planOrSkip({
      source: 'contracts.contract_pdf_path',
      rowId: row.id as string,
      updateTable: 'contracts',
      updateColumn: 'contract_pdf_path',
      oldPath: row.contract_pdf_path as string | null,
      orgId: row.org_id as string | null,
    });
  }
}

async function collectPurchaseDetails(): Promise<void> {
  const { data, error } = await supabase
    .from('purchase_details')
    .select('id, org_id, fha_addendum_path, va_addendum_path')
    .or('fha_addendum_path.not.is.null,va_addendum_path.not.is.null');
  if (error) throw error;

  for (const row of data ?? []) {
    planOrSkip({
      source: 'purchase_details.fha_addendum_path',
      rowId: row.id as string,
      updateTable: 'purchase_details',
      updateColumn: 'fha_addendum_path',
      oldPath: row.fha_addendum_path as string | null,
      orgId: row.org_id as string | null,
    });
    planOrSkip({
      source: 'purchase_details.va_addendum_path',
      rowId: row.id as string,
      updateTable: 'purchase_details',
      updateColumn: 'va_addendum_path',
      oldPath: row.va_addendum_path as string | null,
      orgId: row.org_id as string | null,
    });
  }
}

async function collectContractInstancesV2(): Promise<void> {
  const { data, error } = await supabase
    .from('contract_instances_v2')
    .select('id, user_id, pdf_path')
    .not('pdf_path', 'is', null);
  if (error) throw error;

  for (const row of data ?? []) {
    const userId = row.user_id as string;
    const { data: membership, error: memberErr } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    if (memberErr) throw memberErr;

    planOrSkip({
      source: 'contract_instances_v2.pdf_path',
      rowId: row.id as string,
      updateTable: 'contract_instances_v2',
      updateColumn: 'pdf_path',
      oldPath: row.pdf_path as string | null,
      orgId: (membership?.org_id as string | undefined) ?? null,
    });
  }
}

async function applyMove(move: PlannedMove): Promise<{ ok: boolean; error?: string }> {
  const { error: moveError } = await supabase.storage
    .from(BUCKET)
    .move(move.oldPath, move.newPath);
  if (moveError) {
    return { ok: false, error: `storage.move failed: ${moveError.message}` };
  }

  const { error: updateError } = await supabase
    .from(move.updateTable)
    .update({ [move.updateColumn]: move.newPath })
    .eq('id', move.rowId);
  if (updateError) {
    return { ok: false, error: `DB update failed after move succeeded (object is now at ${move.newPath}, row still points to old path): ${updateError.message}` };
  }

  return { ok: true };
}

async function main(): Promise<void> {
  await collectContracts();
  await collectPurchaseDetails();
  await collectContractInstancesV2();

  console.log(`Already org-scoped (skipped, no action): ${alreadyMigrated.length}`);
  console.log(`Unresolvable org_id (skipped, logged below): ${skipped.length}`);
  for (const s of skipped) {
    console.log(`  SKIP  ${s.source} id=${s.rowId} path=${s.path} reason="${s.reason}"`);
  }

  console.log(`\nPlanned moves: ${planned.length}`);
  for (const m of planned) {
    console.log(`  ${m.source} id=${m.rowId}\n    ${m.oldPath}\n    -> ${m.newPath}`);
  }

  if (!APPLY) {
    console.log('\nDRY RUN — no changes made. Re-run with --apply to execute.');
    return;
  }

  console.log('\nAPPLYING moves...');
  let succeeded = 0;
  let failed = 0;
  for (const move of planned) {
    const result = await applyMove(move);
    if (result.ok) {
      succeeded += 1;
      console.log(`  OK    ${move.oldPath} -> ${move.newPath}`);
    } else {
      failed += 1;
      console.error(`  FAIL  ${move.oldPath} -> ${move.newPath}: ${result.error}`);
    }
  }
  console.log(`\nDone. ${succeeded} succeeded, ${failed} failed, ${skipped.length} skipped (unresolvable), ${alreadyMigrated.length} already migrated.`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Backfill script failed:', error);
  process.exit(1);
});
