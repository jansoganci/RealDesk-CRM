/**
 * Sprint 3 — transaction timeline (`deal_milestones`).
 * `generateTimelineMilestones` implements Sprint doc §6.3 (9 steps) and §4.5.1 (20 milestones).
 */

import { addDays } from 'date-fns';
import { supabase } from '@/config/supabase';
import { getActiveOrgId } from '@/lib/orgHelpers';
import { getAuthenticatedUserId } from '@/lib/auth';
import { formatDateForDb, parseDateToStartOfDay } from '@/lib/dates';
import { handleServiceError } from '@/lib/handleServiceError';
import {
  addBusinessDaysFrom,
  getNthBusinessDayBeforeClosing,
} from '@/lib/usBusinessDays';
import type { Database } from '@/types/database.types';

type DealMilestoneInsert = Database['public']['Tables']['deal_milestones']['Insert'];
type OfferContingencyRow = Database['public']['Tables']['offer_contingencies']['Row'];
type DealMilestoneRow = Database['public']['Tables']['deal_milestones']['Row'];
type DealPartyRow = Database['public']['Tables']['deal_parties']['Row'];
type DealMilestoneStatus = DealMilestoneRow['status'];
type DealMilestoneRowExtended = DealMilestoneRow & {
  alert_sent_7d?: boolean;
  alert_sent_3d?: boolean;
  alert_sent_1d?: boolean;
  alert_sent_today?: boolean;
  document_path?: string | null;
  document_uploaded_at?: string | null;
  document_required?: boolean;
  last_nudge_sent_at?: string | null;
};

type MilestoneDef = {
  milestone_type: string;
  title: string;
  responsible_party: DealMilestoneInsert['responsible_party'];
  offset_basis: NonNullable<DealMilestoneInsert['offset_basis']>;
  is_cfpb_required: boolean;
  /** Calendar days from mutual acceptance (ignored for closing-relative kinds). */
  days_from_ma: number | null;
  kind: 'ma_calendar' | 'cd_minus_business_3' | 'close_minus_1' | 'close_day';
};

const MILESTONE_TEMPLATE: MilestoneDef[] = [
  {
    milestone_type: 'mutual_acceptance',
    title: 'Mutual acceptance',
    responsible_party: 'buyer_agent',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 0,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'send_executed_contract',
    title: 'Send executed contract',
    responsible_party: 'buyer_agent',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 1,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'earnest_money_deposit',
    title: 'Earnest money deposit',
    responsible_party: 'buyer',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 2,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'open_escrow',
    title: 'Open escrow',
    responsible_party: 'buyer_agent',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 2,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'title_search_initiated',
    title: 'Title search initiated',
    responsible_party: 'title_co',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 2,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'loan_application_submitted',
    title: 'Loan application submitted',
    responsible_party: 'buyer',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 3,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'home_inspection',
    title: 'Home inspection',
    responsible_party: 'inspector',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 7,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'inspection_contingency_removal',
    title: 'Inspection contingency removal',
    responsible_party: 'buyer',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 10,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'appraisal_ordered',
    title: 'Appraisal ordered',
    responsible_party: 'lender',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 10,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'appraisal_completed',
    title: 'Appraisal completed',
    responsible_party: 'lender',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 17,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'hoa_doc_review',
    title: 'HOA / condo document review',
    responsible_party: 'buyer',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 14,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'financing_contingency_deadline',
    title: 'Financing contingency deadline',
    responsible_party: 'lender',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 23,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'title_report_clear',
    title: 'Title report clear',
    responsible_party: 'title_co',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 25,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'homeowners_insurance',
    title: "Homeowner's insurance binder",
    responsible_party: 'buyer',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 25,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'repairs_completed',
    title: 'Repairs completed',
    responsible_party: 'seller',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 28,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'clear_to_close',
    title: 'Clear to close',
    responsible_party: 'lender',
    offset_basis: 'mutual_acceptance',
    is_cfpb_required: false,
    days_from_ma: 35,
    kind: 'ma_calendar',
  },
  {
    milestone_type: 'closing_disclosure_sent',
    title: 'Closing Disclosure sent (3 business days before closing)',
    responsible_party: 'lender',
    offset_basis: 'closing_date_minus',
    is_cfpb_required: true,
    days_from_ma: null,
    kind: 'cd_minus_business_3',
  },
  {
    milestone_type: 'closing_disclosure_review',
    title: 'Closing Disclosure review',
    responsible_party: 'buyer',
    offset_basis: 'closing_date_minus',
    is_cfpb_required: true,
    days_from_ma: null,
    kind: 'cd_minus_business_3',
  },
  {
    milestone_type: 'final_walkthrough',
    title: 'Final walkthrough',
    responsible_party: 'buyer',
    offset_basis: 'closing_date_minus',
    is_cfpb_required: false,
    days_from_ma: null,
    kind: 'close_minus_1',
  },
  {
    milestone_type: 'closing_day',
    title: 'Closing day',
    responsible_party: 'title_co',
    offset_basis: 'fixed_date',
    is_cfpb_required: false,
    days_from_ma: null,
    kind: 'close_day',
  },
];

const CONTINGENCY_TYPE_TO_MILESTONE: Partial<Record<string, string>> = {
  inspection_general: 'home_inspection',
  financing: 'financing_contingency_deadline',
  appraisal: 'appraisal_ordered',
  title: 'title_report_clear',
  insurance: 'homeowners_insurance',
  home_sale: 'financing_contingency_deadline',
};

function computeDueDate(
  def: MilestoneDef,
  ma: Date,
  closing: Date
): string {
  if (def.kind === 'ma_calendar' && def.days_from_ma !== null) {
    return formatDateForDb(addDays(ma, def.days_from_ma));
  }
  if (def.kind === 'cd_minus_business_3') {
    return formatDateForDb(getNthBusinessDayBeforeClosing(closing, 3));
  }
  if (def.kind === 'close_minus_1') {
    return formatDateForDb(addDays(closing, -1));
  }
  if (def.kind === 'close_day') {
    return formatDateForDb(closing);
  }
  return formatDateForDb(ma);
}

function contingencyDeadlineDate(
  row: OfferContingencyRow,
  ma: Date
): string | null {
  if (row.days_offset == null) return null;
  if (row.business_days_only) {
    return formatDateForDb(addBusinessDaysFrom(ma, row.days_offset));
  }
  return formatDateForDb(addDays(ma, row.days_offset));
}

/**
 * Generates ~20 `deal_milestones` rows and activates contingency deadlines (§6.3).
 * Idempotent: if milestones already exist for the deal, returns existing count (no duplicate insert).
 * To update due dates after a closing-date change, call `regenerateTimelineMilestones` instead.
 */
export async function generateTimelineMilestones(
  dealId: string,
  acceptedRoundId: string,
  mutualAcceptanceAtIso: string
): Promise<number> {
  const orgId = await getActiveOrgId();
  const userId = await getAuthenticatedUserId();

  const { count: existing, error: countErr } = await supabase
    .from('deal_milestones')
    .select('id', { count: 'exact', head: true })
    .eq('deal_id', dealId)
    .eq('org_id', orgId);

  if (countErr) throw countErr;
  if ((existing ?? 0) > 0) {
    return existing ?? 0;
  }

  const { data: round, error: roundErr } = await supabase
    .from('offer_rounds')
    .select('id, deal_id, closing_date')
    .eq('id', acceptedRoundId)
    .eq('deal_id', dealId)
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (roundErr) throw roundErr;
  if (!round?.closing_date) {
    throw new Error('Closing date is required on the accepted offer to generate a timeline.');
  }

  const ma = parseDateToStartOfDay(mutualAcceptanceAtIso.slice(0, 10));
  const closing = parseDateToStartOfDay(round.closing_date);

  const { data: contingencies, error: conErr } = await supabase
    .from('offer_contingencies')
    .select('*')
    .eq('offer_round_id', acceptedRoundId)
    .eq('deal_id', dealId)
    .eq('org_id', orgId);

  if (conErr) throw conErr;

  const rows: DealMilestoneInsert[] = MILESTONE_TEMPLATE.map((def) => {
    const dueDate = computeDueDate(def, ma, closing);
    return {
      org_id: orgId,
      deal_id: dealId,
      milestone_type: def.milestone_type,
      title: def.title,
      due_date: dueDate,
      offset_basis: def.offset_basis,
      days_offset:
        def.kind === 'ma_calendar' && def.days_from_ma !== null ? def.days_from_ma : null,
      status: 'pending',
      responsible_party: def.responsible_party,
      is_cfpb_required: def.is_cfpb_required,
      contingency_id: null,
    };
  });

  const byType = new Map(rows.map((r) => [r.milestone_type, r]));

  for (const c of contingencies ?? []) {
    if (!c.included_in_offer || c.waived_at_offer) continue;
    const mt = CONTINGENCY_TYPE_TO_MILESTONE[c.contingency_type];
    if (!mt) continue;
    const target = byType.get(mt);
    if (!target) continue;
    const dl = contingencyDeadlineDate(c as OfferContingencyRow, ma);
    if (dl) {
      target.due_date = dl;
      target.days_offset = c.days_offset;
      target.contingency_id = c.id;
    }
  }

  const { error: insErr } = await supabase.from('deal_milestones').insert(rows);
  if (insErr) throw insErr;

  for (const c of contingencies ?? []) {
    if (!c.included_in_offer || c.waived_at_offer) continue;
    const dl = contingencyDeadlineDate(c as OfferContingencyRow, ma);
    const { error: upErr } = await supabase
      .from('offer_contingencies')
      .update({
        ...(dl ? { deadline_date: dl } : {}),
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', c.id)
      .eq('org_id', orgId);

    if (upErr) throw upErr;
  }

  return rows.length;
}

/**
 * Re-computes `due_date` for all non-terminal milestones when the closing date changes
 * (e.g. after a deal amendment). Only rows with status `pending`, `upcoming`, or `overdue`
 * are touched — `complete` and `waived` milestones are left unchanged.
 *
 * Milestones relative to mutual-acceptance date (`ma_calendar` kind) are recomputed from the
 * stored MA date and will be written to the same value they already hold; this is harmless and
 * avoids a separate code path. Closing-relative milestones (`cd_minus_business_3`,
 * `close_minus_1`, `close_day`) will receive updated due dates.
 *
 * @param dealId          - The deal whose milestones to refresh
 * @param newClosingDateIso - New closing date as YYYY-MM-DD (e.g. "2026-06-15")
 * @returns Number of milestone rows updated
 */
export async function regenerateTimelineMilestones(
  dealId: string,
  newClosingDateIso: string
): Promise<number> {
  const orgId = await getActiveOrgId();
  const userId = await getAuthenticatedUserId();

  const { data: deal, error: dealErr } = await supabase
    .from('deals')
    .select('mutual_acceptance_date')
    .eq('id', dealId)
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (dealErr) throw dealErr;
  if (!deal?.mutual_acceptance_date) {
    throw new Error('Deal has no mutual acceptance date; timeline cannot be recalculated.');
  }

  const ma = parseDateToStartOfDay(deal.mutual_acceptance_date.slice(0, 10));
  const closing = parseDateToStartOfDay(newClosingDateIso);

  const { data: milestones, error: msErr } = await supabase
    .from('deal_milestones')
    .select('id, milestone_type')
    .eq('deal_id', dealId)
    .eq('org_id', orgId)
    .in('status', ['pending', 'upcoming', 'overdue']);

  if (msErr) throw msErr;
  if (!milestones?.length) return 0;

  const defByType = new Map(MILESTONE_TEMPLATE.map((d) => [d.milestone_type, d]));
  const now = new Date().toISOString();
  let updatedCount = 0;

  for (const ms of milestones) {
    const def = defByType.get(ms.milestone_type);
    if (!def) continue;
    const newDueDate = computeDueDate(def, ma, closing);
    const { error } = await supabase
      .from('deal_milestones')
      .update({ due_date: newDueDate, updated_at: now })
      .eq('id', ms.id)
      .eq('org_id', orgId);
    if (error) throw error;
    updatedCount++;
  }

  return updatedCount;
}

export async function getByDeal(dealId: string): Promise<DealMilestoneRow[]> {
  const orgId = await getActiveOrgId();
  const { data, error } = await supabase
    .from('deal_milestones')
    .select('*')
    .eq('deal_id', dealId)
    .eq('org_id', orgId)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DealMilestoneRow[];
}

async function getMilestoneInOrg(milestoneId: string): Promise<DealMilestoneRowExtended> {
  const orgId = await getActiveOrgId();
  const { data, error } = await supabase
    .from('deal_milestones')
    .select('*')
    .eq('id', milestoneId)
    .eq('org_id', orgId)
    .single();

  if (error) throw error;
  return data as DealMilestoneRowExtended;
}

function normalizeFileName(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_');
}

export async function updateMilestoneStatus(
  id: string,
  status: DealMilestoneStatus
): Promise<DealMilestoneRow> {
  try {
    const orgId = await getActiveOrgId();
    const now = new Date().toISOString();
    const completedAt = status === 'complete' ? now : null;

    const { data, error } = await supabase
      .from('deal_milestones')
      .update({
        status,
        completed_at: completedAt,
        updated_at: now,
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select('*')
      .single();

    if (error) throw error;
    return data as DealMilestoneRow;
  } catch (error) {
    throw handleServiceError(error, 'Failed to update milestone status');
  }
}

export async function addMilestoneNote(id: string, note: string): Promise<DealMilestoneRow> {
  try {
    const row = await getMilestoneInOrg(id);
    const timestamp = new Date().toISOString();
    const nextNote = `[${timestamp}] ${note.trim()}`;
    const merged = row.notes?.trim() ? `${row.notes}\n${nextNote}` : nextNote;

    const { data, error } = await supabase
      .from('deal_milestones')
      .update({
        notes: merged,
        updated_at: timestamp,
      })
      .eq('id', id)
      .eq('org_id', row.org_id)
      .select('*')
      .single();

    if (error) throw error;
    return data as DealMilestoneRow;
  } catch (error) {
    throw handleServiceError(error, 'Failed to add milestone note');
  }
}

export async function uploadMilestoneDocument(
  id: string,
  file: File
): Promise<DealMilestoneRow> {
  try {
    const row = await getMilestoneInOrg(id);
    const safeName = normalizeFileName(file.name);
    const path = `${row.org_id}/${row.deal_id}/${row.milestone_type}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('deal-documents')
      .upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('deal_milestones')
      .update({
        document_path: path,
        document_uploaded_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .eq('org_id', row.org_id)
      .select('*')
      .single();

    if (error) throw error;
    return data as DealMilestoneRow;
  } catch (error) {
    throw handleServiceError(error, 'Failed to upload milestone document');
  }
}

export async function getMilestoneDocument(id: string): Promise<string | null> {
  try {
    const row = await getMilestoneInOrg(id);
    if (!row.document_path) return null;

    const { data, error } = await supabase.storage
      .from('deal-documents')
      .createSignedUrl(row.document_path, 60 * 60);

    if (error) throw error;
    return data?.signedUrl ?? null;
  } catch (error) {
    throw handleServiceError(error, 'Failed to get milestone document');
  }
}

type AddCustomMilestoneInput = {
  title: string;
  due_date: string;
  responsible_party?: DealMilestoneInsert['responsible_party'];
  notes?: string | null;
  document_required?: boolean;
};

export async function addCustomMilestone(
  dealId: string,
  data: AddCustomMilestoneInput
): Promise<DealMilestoneRow> {
  try {
    const orgId = await getActiveOrgId();
    const now = new Date().toISOString();
    const { data: row, error } = await supabase
      .from('deal_milestones')
      .insert({
        org_id: orgId,
        deal_id: dealId,
        milestone_type: 'custom',
        title: data.title,
        due_date: data.due_date,
        status: 'pending',
        responsible_party: data.responsible_party ?? 'buyer_agent',
        notes: data.notes ?? null,
        document_required: data.document_required ?? false,
        updated_at: now,
      })
      .select('*')
      .single();

    if (error) throw error;
    return row as DealMilestoneRow;
  } catch (error) {
    throw handleServiceError(error, 'Failed to add custom milestone');
  }
}

export async function updateMilestoneDueDate(
  id: string,
  newDate: string
): Promise<DealMilestoneRow> {
  try {
    const row = await getMilestoneInOrg(id);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('deal_milestones')
      .update({
        due_date: newDate,
        alert_sent_7d: false,
        alert_sent_3d: false,
        alert_sent_1d: false,
        alert_sent_today: false,
        updated_at: now,
      })
      .eq('id', id)
      .eq('org_id', row.org_id)
      .select('*')
      .single();

    if (error) throw error;
    return data as DealMilestoneRow;
  } catch (error) {
    throw handleServiceError(error, 'Failed to update milestone due date');
  }
}

export async function sendNudge(milestoneId: string): Promise<DealPartyRow | null> {
  try {
    const row = await getMilestoneInOrg(milestoneId);
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('deal_milestones')
      .update({
        last_nudge_sent_at: now,
        updated_at: now,
      })
      .eq('id', milestoneId)
      .eq('org_id', row.org_id);
    if (updateError) throw updateError;

    if (!row.responsible_party) return null;

    const { data, error } = await supabase
      .from('deal_parties')
      .select('*')
      .eq('org_id', row.org_id)
      .eq('deal_id', row.deal_id)
      .eq('role', row.responsible_party)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;

    return (data as DealPartyRow | null) ?? null;
  } catch (error) {
    throw handleServiceError(error, 'Failed to send milestone nudge');
  }
}
