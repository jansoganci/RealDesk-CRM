import { describe, expect, it, vi } from 'vitest';
import {
  buildDeletionSummary,
  CCPA_REDACTED,
  DELETION_HANDLER_ORDER,
  isHandlerFinished,
  normalizeRequesterEmail,
  PROPERTY_INQUIRIES_PII_COLUMNS,
  runCcpaDeletion,
  type DeletionProgressMap,
  type DeletionTableKey,
} from '../ccpaDeletion';

describe('ccpaDeletion helpers', () => {
  it('normalizes requester email', () => {
    expect(normalizeRequesterEmail('  Ada@Example.COM ')).toBe('ada@example.com');
  });

  it('treats done and skipped as finished', () => {
    expect(isHandlerFinished({ status: 'done', count: 1, action: 'anonymized' })).toBe(true);
    expect(isHandlerFinished({ status: 'skipped', count: 0, action: 'retained' })).toBe(true);
    expect(isHandlerFinished({ status: 'failed', count: 0, action: 'anonymized' })).toBe(false);
    expect(isHandlerFinished(undefined)).toBe(false);
  });

  it('uses real property_inquiries PII columns (not contact_*)', () => {
    expect(PROPERTY_INQUIRIES_PII_COLUMNS).toEqual(['name', 'email', 'phone', 'notes']);
    expect(PROPERTY_INQUIRIES_PII_COLUMNS).not.toContain('contact_email');
    expect(PROPERTY_INQUIRIES_PII_COLUMNS).not.toContain('contact_name');
  });

  it('builds a table-level summary including retained legal records', () => {
    const progress: DeletionProgressMap = {
      property_inquiries: { status: 'done', count: 3, action: 'anonymized' },
      tenants: { status: 'done', count: 1, action: 'anonymized' },
      contract_instances_v2: {
        status: 'done',
        count: 2,
        action: 'retained',
        reason: 'signed/legal document exception (same as PDFs)',
      },
      security_deposit_tracker: {
        status: 'done',
        count: 1,
        action: 'retained',
        reason: 'deposit amounts/status retained; notes scrubbed',
      },
    };

    const summary = buildDeletionSummary(progress);
    expect(summary).toContain('property_inquiries: 3 anonymized');
    expect(summary).toContain('tenants: 1 anonymized');
    expect(summary).toContain('contract_instances_v2: 2 retained');
    expect(summary).toContain('security_deposit_tracker: 1 retained');
  });

  it('returns empty-match message when nothing was touched', () => {
    expect(buildDeletionSummary({})).toBe('No matching records found for provided email');
  });
});

describe('runCcpaDeletion', () => {
  it('processes all matching records via handlers (no single-row cap)', async () => {
    const calls: Array<{ table: DeletionTableKey; count: number }> = [];

    const handlers = Object.fromEntries(
      DELETION_HANDLER_ORDER.map((table) => [
        table,
        async () => {
          const count = table === 'property_inquiries' ? 3 : table === 'tenants' ? 2 : 0;
          calls.push({ table, count });
          return {
            count,
            action: table === 'contract_instances_v2' ? ('retained' as const) : ('anonymized' as const),
            reason:
              table === 'contract_instances_v2'
                ? 'signed/legal document exception (same as PDFs)'
                : undefined,
            ids: table === 'property_inquiries' ? ['l1', 'l2', 'l3'] : undefined,
          };
        },
      ]),
    );

    const result = await runCcpaDeletion({
      supabase: {} as never,
      orgId: 'org-1',
      email: 'person@example.com',
      handlers,
    });

    expect(result.failed).toBe(false);
    expect(result.progress.property_inquiries?.count).toBe(3);
    expect(result.progress.tenants?.count).toBe(2);
    expect(result.summary).toContain('property_inquiries: 3 anonymized');
    expect(calls.find((c) => c.table === 'property_inquiries')?.count).toBe(3);
  });

  it('skips finished tables and resumes after a prior failure', async () => {
    const ran: string[] = [];
    const existing: DeletionProgressMap = {
      property_inquiries: {
        status: 'done',
        count: 2,
        action: 'anonymized',
        ids: ['lead-a', 'lead-b'],
      },
      tenants: { status: 'failed', count: 0, action: 'anonymized', error: 'timeout' },
    };

    const handlers = Object.fromEntries(
      DELETION_HANDLER_ORDER.map((table) => [
        table,
        async () => {
          ran.push(table);
          if (table === 'tenants') {
            return { count: 1, action: 'anonymized' as const, ids: ['tenant-1'] };
          }
          if (table === 'contract_instances_v2') {
            return {
              count: 1,
              action: 'retained' as const,
              reason: 'signed/legal document exception (same as PDFs)',
            };
          }
          return { count: 0, action: 'anonymized' as const };
        },
      ]),
    );

    const result = await runCcpaDeletion({
      supabase: {} as never,
      orgId: 'org-1',
      email: 'person@example.com',
      existingProgress: existing,
      handlers,
    });

    expect(ran).not.toContain('property_inquiries');
    expect(ran[0]).toBe('tenants');
    expect(result.failed).toBe(false);
    expect(result.progress.property_inquiries?.count).toBe(2);
    expect(result.progress.tenants?.count).toBe(1);
    expect(result.progress.tenants?.status).toBe('done');
    expect(result.summary).toContain('contract_instances_v2: 1 retained');
  });

  it('stops on first failure, persists failed table, keeps prior done tables', async () => {
    const progressSnapshots: DeletionProgressMap[] = [];

    const handlers = Object.fromEntries(
      DELETION_HANDLER_ORDER.map((table) => [
        table,
        async () => {
          if (table === 'property_inquiries') {
            return { count: 2, action: 'anonymized' as const, ids: ['l1', 'l2'] };
          }
          if (table === 'tenants') {
            throw new Error('tenants update failed');
          }
          return { count: 0, action: 'anonymized' as const };
        },
      ]),
    );

    const result = await runCcpaDeletion({
      supabase: {} as never,
      orgId: 'org-1',
      email: 'person@example.com',
      handlers,
      onProgress: async (progress) => {
        progressSnapshots.push({ ...progress });
      },
    });

    expect(result.failed).toBe(true);
    expect(result.failedTable).toBe('tenants');
    expect(result.progress.property_inquiries?.status).toBe('done');
    expect(result.progress.property_inquiries?.ids).toEqual(['l1', 'l2']);
    expect(result.progress.tenants?.status).toBe('failed');
    expect(result.progress.tenants?.error).toContain('tenants update failed');
    expect(result.progress.deal_parties).toBeUndefined();
    expect(progressSnapshots.length).toBeGreaterThanOrEqual(2);
  });

  it('reports retained contract_instances_v2 with legal reason in summary', async () => {
    const handlers = Object.fromEntries(
      DELETION_HANDLER_ORDER.map((table) => [
        table,
        async () => {
          if (table === 'contract_instances_v2') {
            return {
              count: 4,
              action: 'retained' as const,
              reason: 'signed/legal document exception (same as PDFs)',
            };
          }
          return { count: 0, action: 'anonymized' as const };
        },
      ]),
    );

    const result = await runCcpaDeletion({
      supabase: {} as never,
      orgId: 'org-1',
      email: 'person@example.com',
      handlers,
    });

    expect(result.summary).toContain(
      'contract_instances_v2: 4 retained (signed/legal document exception (same as PDFs))',
    );
    expect(CCPA_REDACTED).toBe('[redacted per CCPA request]');
  });

  it('invokes onProgress after each table for resumability', async () => {
    const onProgress = vi.fn(async () => undefined);
    let step = 0;

    const handlers = Object.fromEntries(
      DELETION_HANDLER_ORDER.map((table) => [
        table,
        async () => {
          step += 1;
          return { count: table === 'property_inquiries' ? 1 : 0, action: 'anonymized' as const };
        },
      ]),
    );

    await runCcpaDeletion({
      supabase: {} as never,
      orgId: 'org-1',
      email: 'person@example.com',
      handlers,
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledTimes(DELETION_HANDLER_ORDER.length);
    expect(step).toBe(DELETION_HANDLER_ORDER.length);
  });
});
