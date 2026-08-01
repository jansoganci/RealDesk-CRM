import type { SupabaseClient } from '@supabase/supabase-js';

export const CCPA_REDACTED = '[redacted per CCPA request]';

export type DeletionAction = 'anonymized' | 'retained' | 'scrubbed_notes' | 'soft_deleted';

export type DeletionTableStatus = 'pending' | 'done' | 'skipped' | 'failed';

export interface DeletionTableProgress {
  status: DeletionTableStatus;
  count: number;
  action: DeletionAction;
  reason?: string;
  error?: string | null;
  /** Matched row ids (person tables) — used to resume FK scrubbers */
  ids?: string[];
}

export type DeletionProgressMap = Record<string, DeletionTableProgress>;

export interface DeletionHandlerResult {
  count: number;
  action: DeletionAction;
  reason?: string;
  ids?: string[];
}

export interface DeletionContext {
  supabase: SupabaseClient;
  orgId: string;
  email: string;
  deletedAt: string;
  redacted: string;
  /** Lead IDs discovered while processing property_inquiries */
  leadIds: string[];
  /** Tenant IDs discovered while processing tenants */
  tenantIds: string[];
  /** Owner IDs discovered while processing property_owners */
  ownerIds: string[];
}

type DeletionHandler = (ctx: DeletionContext) => Promise<DeletionHandlerResult>;

export const DELETION_HANDLER_ORDER = [
  'property_inquiries',
  'tenants',
  'property_owners',
  'deal_parties',
  'applicant_screenings',
  'lease_details',
  'purchase_details',
  'properties',
  'contracts',
  'showing_logs',
  'deals',
  'meetings',
  'security_deposit_tracker',
  'deposit_deductions',
  'inquiry_matches',
  'buyer_agent_agreements',
  'contract_instances_v2',
] as const;

export type DeletionTableKey = (typeof DELETION_HANDLER_ORDER)[number];

export function normalizeRequesterEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isHandlerFinished(entry: DeletionTableProgress | undefined): boolean {
  return entry?.status === 'done' || entry?.status === 'skipped';
}

export function buildDeletionSummary(progress: DeletionProgressMap): string {
  const parts: string[] = [];

  for (const table of DELETION_HANDLER_ORDER) {
    const entry = progress[table];
    if (!entry || entry.count === 0) continue;

    if (entry.action === 'retained') {
      parts.push(
        `${table}: ${entry.count} retained (${entry.reason ?? 'legal/business retention'})`,
      );
    } else if (entry.action === 'scrubbed_notes') {
      parts.push(`${table}: ${entry.count} note field(s) scrubbed`);
    } else if (entry.action === 'soft_deleted') {
      parts.push(`${table}: ${entry.count} soft-deleted`);
    } else {
      parts.push(`${table}: ${entry.count} anonymized`);
    }
  }

  if (parts.length === 0) {
    return 'No matching records found for provided email';
  }

  return parts.join('; ');
}

function emailsMatch(a: string | null | undefined, email: string): boolean {
  if (!a) return false;
  return a.trim().toLowerCase() === email;
}

/** Quote a PostgREST filter value that may contain @ or other reserved chars. */
function filterValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function jsonContainsEmail(
  value: unknown,
  email: string,
): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.toLowerCase().includes(email);
  try {
    return JSON.stringify(value).toLowerCase().includes(email);
  } catch {
    return false;
  }
}

async function updateByIds(
  supabase: SupabaseClient,
  table: string,
  ids: string[],
  patch: Record<string, unknown>,
): Promise<number> {
  if (ids.length === 0) return 0;

  const { data, error } = await supabase
    .from(table)
    .update(patch)
    .in('id', ids)
    .select('id');

  if (error) throw error;
  return (data as { id: string }[] | null)?.length ?? 0;
}

async function selectIdsByEmail(
  supabase: SupabaseClient,
  table: string,
  orgId: string,
  emailColumn: string,
  email: string,
  options?: { onlyActive?: boolean },
): Promise<string[]> {
  let query = supabase
    .from(table)
    .select('id')
    .eq('org_id', orgId)
    .ilike(emailColumn, email);

  if (options?.onlyActive !== false) {
    query = query.is('deleted_at', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return ((data as { id: string }[] | null) ?? []).map((row) => row.id);
}

const anonymizePropertyInquiries: DeletionHandler = async (ctx) => {
  const ids = await selectIdsByEmail(
    ctx.supabase,
    'property_inquiries',
    ctx.orgId,
    'email',
    ctx.email,
  );
  ctx.leadIds.push(...ids);

  const count = await updateByIds(ctx.supabase, 'property_inquiries', ids, {
    name: ctx.redacted,
    email: ctx.redacted,
    phone: ctx.redacted,
    notes: null,
    deleted_at: ctx.deletedAt,
  });

  return { count, action: 'anonymized', ids };
};

const anonymizeTenants: DeletionHandler = async (ctx) => {
  const ids = await selectIdsByEmail(ctx.supabase, 'tenants', ctx.orgId, 'email', ctx.email);
  ctx.tenantIds.push(...ids);

  const count = await updateByIds(ctx.supabase, 'tenants', ids, {
    name: ctx.redacted,
    email: ctx.redacted,
    phone: null,
    address: null,
    notes: null,
    tc_encrypted: null,
    tc_hash: null,
    deleted_at: ctx.deletedAt,
  });

  return { count, action: 'anonymized', ids };
};

const anonymizePropertyOwners: DeletionHandler = async (ctx) => {
  const ids = await selectIdsByEmail(
    ctx.supabase,
    'property_owners',
    ctx.orgId,
    'email',
    ctx.email,
  );
  ctx.ownerIds.push(...ids);

  const count = await updateByIds(ctx.supabase, 'property_owners', ids, {
    name: ctx.redacted,
    email: ctx.redacted,
    phone: null,
    address: null,
    notes: null,
    tc_encrypted: null,
    tc_hash: null,
    iban_encrypted: null,
    routing_number_encrypted: null,
    account_number_encrypted: null,
    tax_id: null,
    deleted_at: ctx.deletedAt,
  });

  return { count, action: 'anonymized', ids };
};

const anonymizeDealParties: DeletionHandler = async (ctx) => {
  const { data, error } = await ctx.supabase
    .from('deal_parties')
    .select('id')
    .eq('org_id', ctx.orgId)
    .ilike('email', ctx.email);

  if (error) throw error;
  const ids = ((data as { id: string }[] | null) ?? []).map((row) => row.id);

  const count = await updateByIds(ctx.supabase, 'deal_parties', ids, {
    name: ctx.redacted,
    email: ctx.redacted,
    phone: null,
    company: null,
    notes: null,
  });

  return { count, action: 'anonymized' };
};

const anonymizeApplicantScreenings: DeletionHandler = async (ctx) => {
  const ids = await selectIdsByEmail(
    ctx.supabase,
    'applicant_screenings',
    ctx.orgId,
    'applicant_email',
    ctx.email,
  );

  const count = await updateByIds(ctx.supabase, 'applicant_screenings', ids, {
    applicant_name: ctx.redacted,
    applicant_email: ctx.redacted,
    applicant_phone: null,
    notes: null,
    monthly_income: null,
    credit_score: null,
    deleted_at: ctx.deletedAt,
  });

  return { count, action: 'anonymized' };
};

const anonymizeLeaseDetails: DeletionHandler = async (ctx) => {
  const { data, error } = await ctx.supabase
    .from('lease_details')
    .select(
      'id, tenant_email, tenant_email_2, landlord_email, co_signer_email, paypal_email, zelle_contact',
    )
    .eq('org_id', ctx.orgId)
    .or(
      [
        `tenant_email.ilike.${filterValue(ctx.email)}`,
        `tenant_email_2.ilike.${filterValue(ctx.email)}`,
        `landlord_email.ilike.${filterValue(ctx.email)}`,
        `co_signer_email.ilike.${filterValue(ctx.email)}`,
        `paypal_email.ilike.${filterValue(ctx.email)}`,
        `zelle_contact.ilike.${filterValue(ctx.email)}`,
      ].join(','),
    );

  if (error) throw error;

  const rows =
    (data as
      | {
          id: string;
          tenant_email: string | null;
          tenant_email_2: string | null;
          landlord_email: string | null;
          co_signer_email: string | null;
          paypal_email: string | null;
          zelle_contact: string | null;
        }[]
      | null) ?? [];

  let count = 0;
  for (const row of rows) {
    const patch: Record<string, unknown> = {};

    if (emailsMatch(row.tenant_email, ctx.email) || emailsMatch(row.tenant_email_2, ctx.email)) {
      patch.tenant_name = ctx.redacted;
      patch.tenant_email = emailsMatch(row.tenant_email, ctx.email) ? ctx.redacted : row.tenant_email;
      patch.tenant_phone = null;
      if (emailsMatch(row.tenant_email_2, ctx.email)) {
        patch.tenant_name_2 = ctx.redacted;
        patch.tenant_email_2 = ctx.redacted;
        patch.tenant_phone_2 = null;
      }
      patch.tenant_notice_custom_address = null;
      patch.additional_occupants = [];
    }

    if (emailsMatch(row.landlord_email, ctx.email)) {
      patch.landlord_name = ctx.redacted;
      patch.landlord_email = ctx.redacted;
      patch.landlord_phone = null;
      patch.landlord_mailing_street = null;
      patch.landlord_mailing_city = null;
      patch.landlord_mailing_state = null;
      patch.landlord_mailing_zip = null;
      patch.landlord_notice_custom_address = null;
    }

    if (emailsMatch(row.co_signer_email, ctx.email)) {
      patch.co_signer_name = ctx.redacted;
      patch.co_signer_email = ctx.redacted;
      patch.co_signer_phone = null;
    }

    if (emailsMatch(row.paypal_email, ctx.email)) {
      patch.paypal_email = ctx.redacted;
    }
    if (emailsMatch(row.zelle_contact, ctx.email)) {
      patch.zelle_contact = ctx.redacted;
    }

    if (Object.keys(patch).length === 0) continue;

    const { error: updateError } = await ctx.supabase
      .from('lease_details')
      .update(patch)
      .eq('id', row.id)
      .eq('org_id', ctx.orgId);

    if (updateError) throw updateError;
    count += 1;
  }

  return { count, action: 'anonymized' };
};

const anonymizePurchaseDetails: DeletionHandler = async (ctx) => {
  const { data, error } = await ctx.supabase
    .from('purchase_details')
    .select('id, buyer_email, buyer_email_2, seller_email, seller_email_2')
    .eq('org_id', ctx.orgId)
    .or(
      [
        `buyer_email.ilike.${filterValue(ctx.email)}`,
        `buyer_email_2.ilike.${filterValue(ctx.email)}`,
        `seller_email.ilike.${filterValue(ctx.email)}`,
        `seller_email_2.ilike.${filterValue(ctx.email)}`,
      ].join(','),
    );

  if (error) throw error;

  const rows =
    (data as
      | {
          id: string;
          buyer_email: string | null;
          buyer_email_2: string | null;
          seller_email: string | null;
          seller_email_2: string | null;
        }[]
      | null) ?? [];

  let count = 0;
  for (const row of rows) {
    const patch: Record<string, unknown> = {};

    if (emailsMatch(row.buyer_email, ctx.email) || emailsMatch(row.buyer_email_2, ctx.email)) {
      if (emailsMatch(row.buyer_email, ctx.email)) {
        patch.buyer_name = ctx.redacted;
        patch.buyer_email = ctx.redacted;
        patch.buyer_phone = null;
        patch.buyer_mailing_street = null;
        patch.buyer_mailing_city = null;
        patch.buyer_mailing_state = null;
        patch.buyer_mailing_zip = null;
      }
      if (emailsMatch(row.buyer_email_2, ctx.email)) {
        patch.buyer_name_2 = ctx.redacted;
        patch.buyer_email_2 = ctx.redacted;
        patch.buyer_phone_2 = null;
        patch.buyer_mailing_street_2 = null;
        patch.buyer_mailing_city_2 = null;
        patch.buyer_mailing_state_2 = null;
        patch.buyer_mailing_zip_2 = null;
      }
    }

    if (emailsMatch(row.seller_email, ctx.email) || emailsMatch(row.seller_email_2, ctx.email)) {
      if (emailsMatch(row.seller_email, ctx.email)) {
        patch.seller_name = ctx.redacted;
        patch.seller_email = ctx.redacted;
        patch.seller_phone = null;
        patch.seller_mailing_street = null;
        patch.seller_mailing_city = null;
        patch.seller_mailing_state = null;
        patch.seller_mailing_zip = null;
      }
      if (emailsMatch(row.seller_email_2, ctx.email)) {
        patch.seller_name_2 = ctx.redacted;
        patch.seller_email_2 = ctx.redacted;
        patch.seller_phone_2 = null;
      }
    }

    if (Object.keys(patch).length === 0) continue;

    const { error: updateError } = await ctx.supabase
      .from('purchase_details')
      .update(patch)
      .eq('id', row.id)
      .eq('org_id', ctx.orgId);

    if (updateError) throw updateError;
    count += 1;
  }

  return { count, action: 'anonymized' };
};

const anonymizePropertiesBuyer: DeletionHandler = async (ctx) => {
  const { data, error } = await ctx.supabase
    .from('properties')
    .select('id')
    .eq('org_id', ctx.orgId)
    .ilike('buyer_email', ctx.email)
    .is('deleted_at', null);

  if (error) throw error;
  const ids = ((data as { id: string }[] | null) ?? []).map((row) => row.id);

  const count = await updateByIds(ctx.supabase, 'properties', ids, {
    buyer_name: ctx.redacted,
    buyer_email: ctx.redacted,
    buyer_phone: null,
  });

  return { count, action: 'anonymized' };
};

const scrubContracts: DeletionHandler = async (ctx) => {
  const filters: string[] = [];
  if (ctx.tenantIds.length > 0) filters.push(`tenant_id.in.(${ctx.tenantIds.join(',')})`);
  if (ctx.ownerIds.length > 0) {
    filters.push(`landlord_id.in.(${ctx.ownerIds.join(',')})`);
    filters.push(`seller_id.in.(${ctx.ownerIds.join(',')})`);
  }

  if (filters.length === 0) {
    return { count: 0, action: 'anonymized' };
  }

  const { data, error } = await ctx.supabase
    .from('contracts')
    .select('id')
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .or(filters.join(','));

  if (error) throw error;
  const ids = ((data as { id: string }[] | null) ?? []).map((row) => row.id);

  // Keep contract_pdf_path and row; scrub free-text party name fields only.
  const count = await updateByIds(ctx.supabase, 'contracts', ids, {
    buyer_name_2: ctx.redacted,
    seller_name_2: ctx.redacted,
    notes: null,
    reminder_notes: null,
  });

  return {
    count,
    action: 'anonymized',
    reason: 'party display fields scrubbed; signed PDF retained',
  };
};

const scrubShowingLogs: DeletionHandler = async (ctx) => {
  if (ctx.leadIds.length === 0) return { count: 0, action: 'scrubbed_notes' };

  const { data, error } = await ctx.supabase
    .from('showing_logs')
    .select('id')
    .eq('org_id', ctx.orgId)
    .in('lead_id', ctx.leadIds);

  if (error) throw error;
  const ids = ((data as { id: string }[] | null) ?? []).map((row) => row.id);

  const count = await updateByIds(ctx.supabase, 'showing_logs', ids, {
    feedback: null,
    notes: null,
  });

  return { count, action: 'scrubbed_notes' };
};

const scrubDeals: DeletionHandler = async (ctx) => {
  if (ctx.leadIds.length === 0) return { count: 0, action: 'scrubbed_notes' };

  const { data, error } = await ctx.supabase
    .from('deals')
    .select('id')
    .eq('org_id', ctx.orgId)
    .in('lead_id', ctx.leadIds)
    .is('deleted_at', null);

  if (error) throw error;
  const ids = ((data as { id: string }[] | null) ?? []).map((row) => row.id);

  const count = await updateByIds(ctx.supabase, 'deals', ids, {
    notes: null,
  });

  return { count, action: 'scrubbed_notes' };
};

const scrubMeetings: DeletionHandler = async (ctx) => {
  const filters: string[] = [];
  if (ctx.tenantIds.length > 0) filters.push(`tenant_id.in.(${ctx.tenantIds.join(',')})`);
  if (ctx.ownerIds.length > 0) filters.push(`owner_id.in.(${ctx.ownerIds.join(',')})`);
  if (filters.length === 0) return { count: 0, action: 'scrubbed_notes' };

  const { data, error } = await ctx.supabase
    .from('meetings')
    .select('id')
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .or(filters.join(','));

  if (error) throw error;
  const ids = ((data as { id: string }[] | null) ?? []).map((row) => row.id);

  const count = await updateByIds(ctx.supabase, 'meetings', ids, {
    notes: null,
    title: ctx.redacted,
  });

  return { count, action: 'scrubbed_notes' };
};

const scrubDepositTracker: DeletionHandler = async (ctx) => {
  if (ctx.tenantIds.length === 0) {
    return {
      count: 0,
      action: 'retained',
      reason: 'financial deposit records retained; no matching tenant',
    };
  }

  const { data, error } = await ctx.supabase
    .from('security_deposit_tracker')
    .select('id')
    .eq('org_id', ctx.orgId)
    .in('tenant_id', ctx.tenantIds)
    .is('deleted_at', null);

  if (error) throw error;
  const ids = ((data as { id: string }[] | null) ?? []).map((row) => row.id);

  // Retain amounts/status; scrub free-text notes only.
  const scrubbed = await updateByIds(ctx.supabase, 'security_deposit_tracker', ids, {
    notes: null,
  });

  return {
    count: Math.max(scrubbed, ids.length),
    action: 'retained',
    reason: 'deposit amounts/status retained; notes scrubbed',
  };
};

const scrubDepositDeductions: DeletionHandler = async (ctx) => {
  if (ctx.tenantIds.length === 0) return { count: 0, action: 'scrubbed_notes' };

  const { data: trackers, error: trackerError } = await ctx.supabase
    .from('security_deposit_tracker')
    .select('id')
    .eq('org_id', ctx.orgId)
    .in('tenant_id', ctx.tenantIds);

  if (trackerError) throw trackerError;
  const depositIds = ((trackers as { id: string }[] | null) ?? []).map((row) => row.id);
  if (depositIds.length === 0) return { count: 0, action: 'scrubbed_notes' };

  const { data, error } = await ctx.supabase
    .from('deposit_deductions')
    .select('id')
    .in('deposit_id', depositIds);

  if (error) throw error;
  const ids = ((data as { id: string }[] | null) ?? []).map((row) => row.id);

  const count = await updateByIds(ctx.supabase, 'deposit_deductions', ids, {
    description: ctx.redacted,
  });

  return { count, action: 'scrubbed_notes' };
};

const softDeleteInquiryMatches: DeletionHandler = async (ctx) => {
  if (ctx.leadIds.length === 0) return { count: 0, action: 'soft_deleted' };

  const { data, error } = await ctx.supabase
    .from('inquiry_matches')
    .select('id')
    .eq('org_id', ctx.orgId)
    .in('inquiry_id', ctx.leadIds)
    .is('deleted_at', null);

  if (error) throw error;
  const ids = ((data as { id: string }[] | null) ?? []).map((row) => row.id);

  const count = await updateByIds(ctx.supabase, 'inquiry_matches', ids, {
    deleted_at: ctx.deletedAt,
  });

  return { count, action: 'soft_deleted' };
};

const retainBuyerAgentAgreements: DeletionHandler = async (ctx) => {
  if (ctx.leadIds.length === 0) {
    return {
      count: 0,
      action: 'retained',
      reason: 'signed agreement PDF retained (legal document exception)',
    };
  }

  const { data, error } = await ctx.supabase
    .from('buyer_agent_agreements')
    .select('id')
    .eq('org_id', ctx.orgId)
    .in('lead_id', ctx.leadIds);

  if (error) throw error;
  const count = (data as { id: string }[] | null)?.length ?? 0;

  return {
    count,
    action: 'retained',
    reason: 'signed agreement PDF retained (legal document exception)',
  };
};

const retainContractInstancesV2: DeletionHandler = async (ctx) => {
  // No org_id on this table; RLS limits visibility to the admin's own user_id rows.
  // Retain entirely — same rule as signed PDFs. Match email in-memory (JSONB-safe).
  const { data, error } = await ctx.supabase
    .from('contract_instances_v2')
    .select('id, parties, form_data, rendered_content, signed_by');

  if (error) throw error;

  const rows =
    (data as
      | {
          id: string;
          parties: unknown;
          form_data: unknown;
          rendered_content: string | null;
          signed_by: string | null;
        }[]
      | null) ?? [];

  const count = rows.filter(
    (row) =>
      jsonContainsEmail(row.parties, ctx.email) ||
      jsonContainsEmail(row.form_data, ctx.email) ||
      jsonContainsEmail(row.rendered_content, ctx.email) ||
      jsonContainsEmail(row.signed_by, ctx.email),
  ).length;

  return {
    count,
    action: 'retained',
    reason: 'signed/legal document exception (same as PDFs)',
  };
};

export const DELETION_HANDLERS: Record<DeletionTableKey, DeletionHandler> = {
  property_inquiries: anonymizePropertyInquiries,
  tenants: anonymizeTenants,
  property_owners: anonymizePropertyOwners,
  deal_parties: anonymizeDealParties,
  applicant_screenings: anonymizeApplicantScreenings,
  lease_details: anonymizeLeaseDetails,
  purchase_details: anonymizePurchaseDetails,
  properties: anonymizePropertiesBuyer,
  contracts: scrubContracts,
  showing_logs: scrubShowingLogs,
  deals: scrubDeals,
  meetings: scrubMeetings,
  security_deposit_tracker: scrubDepositTracker,
  deposit_deductions: scrubDepositDeductions,
  inquiry_matches: softDeleteInquiryMatches,
  buyer_agent_agreements: retainBuyerAgentAgreements,
  contract_instances_v2: retainContractInstancesV2,
};

export interface RunDeletionInput {
  supabase: SupabaseClient;
  orgId: string;
  email: string;
  existingProgress?: DeletionProgressMap | null;
  /** Optional: inject handlers for tests */
  handlers?: Partial<Record<DeletionTableKey, DeletionHandler>>;
  /** Called after each table finishes (or fails) so progress can be persisted */
  onProgress?: (progress: DeletionProgressMap) => Promise<void>;
}

export interface RunDeletionResult {
  progress: DeletionProgressMap;
  summary: string;
  failed: boolean;
  failedTable?: DeletionTableKey;
}

/**
 * Process all CCPA deletion handlers idempotently.
 * Skips tables already marked done/skipped. Stops on first failure.
 */
export async function runCcpaDeletion(input: RunDeletionInput): Promise<RunDeletionResult> {
  const email = normalizeRequesterEmail(input.email);
  const progress: DeletionProgressMap = { ...(input.existingProgress ?? {}) };
  const deletedAt = new Date().toISOString();

  const ctx: DeletionContext = {
    supabase: input.supabase,
    orgId: input.orgId,
    email,
    deletedAt,
    redacted: CCPA_REDACTED,
    leadIds: [],
    tenantIds: [],
    ownerIds: [],
  };

  // Restore person IDs from prior progress so FK scrubbers work on resume.
  if (progress.property_inquiries?.ids?.length) {
    ctx.leadIds.push(...progress.property_inquiries.ids);
  }
  if (progress.tenants?.ids?.length) {
    ctx.tenantIds.push(...progress.tenants.ids);
  }
  if (progress.property_owners?.ids?.length) {
    ctx.ownerIds.push(...progress.property_owners.ids);
  }

  const handlers = { ...DELETION_HANDLERS, ...input.handlers };

  for (const table of DELETION_HANDLER_ORDER) {
    if (isHandlerFinished(progress[table])) continue;

    try {
      const result = await handlers[table](ctx);
      const priorCount = progress[table]?.count ?? 0;
      const priorIds = progress[table]?.ids ?? [];
      const nextIds = result.ids?.length
        ? Array.from(new Set([...priorIds, ...result.ids]))
        : priorIds.length
          ? priorIds
          : undefined;

      progress[table] = {
        status: 'done',
        count: priorCount + result.count,
        action: result.action,
        reason: result.reason,
        error: null,
        ids: nextIds,
      };
      if (input.onProgress) await input.onProgress(progress);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown deletion error';
      progress[table] = {
        status: 'failed',
        count: progress[table]?.count ?? 0,
        action: progress[table]?.action ?? 'anonymized',
        reason: progress[table]?.reason,
        error: message,
        ids: progress[table]?.ids,
      };
      if (input.onProgress) await input.onProgress(progress);
      return {
        progress,
        summary: buildDeletionSummary(progress),
        failed: true,
        failedTable: table,
      };
    }
  }

  return {
    progress,
    summary: buildDeletionSummary(progress),
    failed: false,
  };
}

/** Columns used when anonymizing property_inquiries — regression guard for tests */
export const PROPERTY_INQUIRIES_PII_COLUMNS = ['name', 'email', 'phone', 'notes'] as const;
