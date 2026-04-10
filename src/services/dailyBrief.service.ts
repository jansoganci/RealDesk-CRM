import { supabase } from '@/config/supabase';
import { getActiveOrgId } from '@/lib/orgHelpers';
import { getAuthenticatedUserId } from '@/lib/auth';
import { handleServiceError } from '@/lib/handleServiceError';
import type {
  DailyBriefData,
  DailyBriefMilestoneItem,
  DealHealthCard,
  WaitingOnOthersItem,
} from '@/types';
import type { Database } from '@/types/database.types';

type DealMilestoneRow = Database['public']['Tables']['deal_milestones']['Row'];
type DealPartyRow = Database['public']['Tables']['deal_parties']['Row'];

const ACTIVE_DEAL_STAGES = ['under_contract', 'pending', 'closing_scheduled'] as const;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

type MilestoneWithDeal = DealMilestoneRow & {
  last_nudge_sent_at?: string | null;
  deals: {
    id: string;
    deal_name: string;
    deal_stage: string;
    projected_close_date: string | null;
    property_snapshot: Database['public']['Tables']['deals']['Row']['property_snapshot'];
  } | null;
};

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysFromToday(isoDate: string): number {
  const today = new Date(`${getTodayIso()}T00:00:00.000Z`);
  const due = new Date(`${isoDate}T00:00:00.000Z`);
  return Math.floor((due.getTime() - today.getTime()) / MS_PER_DAY);
}

function getPropertyAddressFromSnapshot(snapshot: unknown): string {
  if (!snapshot || typeof snapshot !== 'object') return '—';
  const data = snapshot as Record<string, unknown>;
  const address = data.address;
  const city = data.city;

  const safeAddress = typeof address === 'string' ? address.trim() : '';
  const safeCity = typeof city === 'string' ? city.trim() : '';
  if (safeAddress && safeCity) return `${safeAddress}, ${safeCity}`;
  if (safeAddress) return safeAddress;
  if (safeCity) return safeCity;
  return '—';
}

function toBriefMilestoneItem(row: MilestoneWithDeal): DailyBriefMilestoneItem {
  return {
    milestoneId: row.id,
    dealId: row.deal_id,
    dealName: row.deals?.deal_name ?? 'Unknown deal',
    propertyAddress: getPropertyAddressFromSnapshot(row.deals?.property_snapshot ?? null),
    milestoneTitle: row.title,
    dueDate: row.due_date,
    responsibleParty: row.responsible_party,
    daysUntilDue: daysFromToday(row.due_date),
  };
}

function getPhaseByMilestoneType(milestoneType: string): 1 | 2 | 3 | 4 {
  const phase1 = new Set([
    'mutual_acceptance',
    'send_executed_contract',
    'earnest_money_deposit',
    'open_escrow',
    'title_search_initiated',
    'loan_application_submitted',
  ]);
  const phase2 = new Set([
    'home_inspection',
    'inspection_contingency_removal',
    'appraisal_ordered',
    'appraisal_completed',
    'hoa_doc_review',
  ]);
  const phase3 = new Set([
    'financing_contingency_deadline',
    'title_report_clear',
    'homeowners_insurance',
    'repairs_completed',
    'clear_to_close',
  ]);
  if (phase1.has(milestoneType)) return 1;
  if (phase2.has(milestoneType)) return 2;
  if (phase3.has(milestoneType)) return 3;
  return 4;
}

class DailyBriefService {
  async getDailyBriefData(): Promise<DailyBriefData> {
    try {
      await getAuthenticatedUserId();
      const [overdue, dueToday, due3Days, due7Days, waitingOnOthers, dealHealthCards] =
        await Promise.all([
          this.getOverdueMilestones(),
          this.getDueSoon(0),
          this.getDueSoon(3),
          this.getDueSoon(7),
          this.getWaitingOnOthers(),
          this.getDealHealthCards(),
        ]);

      return {
        overdue,
        dueToday,
        due3Days,
        due7Days,
        waitingOnOthers,
        dealHealthCards,
      };
    } catch (error) {
      throw handleServiceError(error, 'Failed to load Daily Brief data');
    }
  }

  async getOverdueMilestones(): Promise<DailyBriefMilestoneItem[]> {
    try {
      const orgId = await getActiveOrgId();
      const today = getTodayIso();

      const { data, error } = await supabase
        .from('deal_milestones')
        .select(
          '*, deals!inner(id, deal_name, deal_stage, projected_close_date, property_snapshot)'
        )
        .eq('org_id', orgId)
        .eq('status', 'pending')
        .lt('due_date', today)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return ((data ?? []) as MilestoneWithDeal[])
        .filter((row) => ACTIVE_DEAL_STAGES.includes(row.deals?.deal_stage as (typeof ACTIVE_DEAL_STAGES)[number]))
        .map(toBriefMilestoneItem);
    } catch (error) {
      throw handleServiceError(error, 'Failed to load overdue milestones');
    }
  }

  async getDueSoon(days: number): Promise<DailyBriefMilestoneItem[]> {
    try {
      const orgId = await getActiveOrgId();
      const today = getTodayIso();
      const end = new Date(`${today}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + days);
      const endIso = end.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('deal_milestones')
        .select(
          '*, deals!inner(id, deal_name, deal_stage, projected_close_date, property_snapshot)'
        )
        .eq('org_id', orgId)
        .eq('status', 'pending')
        .gte('due_date', today)
        .lte('due_date', endIso)
        .order('due_date', { ascending: true });

      if (error) throw error;
      const all = ((data ?? []) as MilestoneWithDeal[]).filter((row) =>
        ACTIVE_DEAL_STAGES.includes(row.deals?.deal_stage as (typeof ACTIVE_DEAL_STAGES)[number])
      );

      if (days === 0) {
        return all.map(toBriefMilestoneItem);
      }

      // Exclude same-day to represent 1..N horizon.
      return all.filter((row) => row.due_date > today).map(toBriefMilestoneItem);
    } catch (error) {
      throw handleServiceError(error, `Failed to load milestones due in ${days} days`);
    }
  }

  async getWaitingOnOthers(): Promise<WaitingOnOthersItem[]> {
    try {
      const orgId = await getActiveOrgId();
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('deal_milestones')
        .select(
          '*, deals!inner(id, deal_name, deal_stage, projected_close_date, property_snapshot)'
        )
        .eq('org_id', orgId)
        .eq('status', 'in_progress')
        .neq('responsible_party', 'buyer_agent')
        .or(`last_nudge_sent_at.is.null,last_nudge_sent_at.lt.${cutoff}`)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const rows = ((data ?? []) as MilestoneWithDeal[]).filter((row) =>
        ACTIVE_DEAL_STAGES.includes(row.deals?.deal_stage as (typeof ACTIVE_DEAL_STAGES)[number])
      );

      const dealIds = Array.from(new Set(rows.map((row) => row.deal_id)));
      let partiesByDeal = new Map<string, DealPartyRow[]>();

      if (dealIds.length > 0) {
        const { data: parties, error: partiesError } = await supabase
          .from('deal_parties')
          .select('*')
          .eq('org_id', orgId)
          .in('deal_id', dealIds);

        if (partiesError) throw partiesError;
        partiesByDeal = (parties ?? []).reduce((map, row) => {
          const existing = map.get(row.deal_id) ?? [];
          existing.push(row as DealPartyRow);
          map.set(row.deal_id, existing);
          return map;
        }, new Map<string, DealPartyRow[]>());
      }

      return rows.map((row) => {
        const base = toBriefMilestoneItem(row);
        const matchingParty = (partiesByDeal.get(row.deal_id) ?? []).find(
          (party) => party.role === row.responsible_party
        );

        return {
          ...base,
          counterpartyName: matchingParty?.name ?? null,
          lastNudgeSentAt: row.last_nudge_sent_at ?? null,
        };
      });
    } catch (error) {
      throw handleServiceError(error, 'Failed to load waiting-on-others milestones');
    }
  }

  async getDealHealthCards(): Promise<DealHealthCard[]> {
    try {
      const orgId = await getActiveOrgId();
      const userId = await getAuthenticatedUserId();

      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('id, deal_name, deal_stage, projected_close_date, property_snapshot')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .in('deal_stage', [...ACTIVE_DEAL_STAGES])
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (dealsError) throw dealsError;
      if (!deals?.length) return [];

      const dealIds = deals.map((deal) => deal.id);
      const { data: milestones, error: milestonesError } = await supabase
        .from('deal_milestones')
        .select('*')
        .eq('org_id', orgId)
        .in('deal_id', dealIds)
        .order('due_date', { ascending: true });

      if (milestonesError) throw milestonesError;

      const milestonesByDeal = (milestones ?? []).reduce((map, milestone) => {
        const list = map.get(milestone.deal_id) ?? [];
        list.push(milestone as DealMilestoneRow);
        map.set(milestone.deal_id, list);
        return map;
      }, new Map<string, DealMilestoneRow[]>());

      const today = getTodayIso();

      return deals.map((deal) => {
        const rows = milestonesByDeal.get(deal.id) ?? [];
        const nextMilestone =
          rows.find((row) => ['pending', 'in_progress', 'overdue'].includes(row.status)) ?? null;
        const overdueCount = rows.filter(
          (row) => ['pending', 'in_progress'].includes(row.status) && row.due_date < today
        ).length;
        const phase = nextMilestone ? getPhaseByMilestoneType(nextMilestone.milestone_type) : 4;
        const closingCountdownDays = deal.projected_close_date
          ? daysFromToday(deal.projected_close_date)
          : null;

        return {
          dealId: deal.id,
          dealName: deal.deal_name,
          propertyAddress: getPropertyAddressFromSnapshot(deal.property_snapshot),
          closingDate: deal.projected_close_date,
          closingCountdownDays,
          phase,
          nextMilestoneTitle: nextMilestone?.title ?? null,
          nextMilestoneDueDate: nextMilestone?.due_date ?? null,
          overdueCount,
        };
      });
    } catch (error) {
      throw handleServiceError(error, 'Failed to load deal health cards');
    }
  }
}

export const dailyBriefService = new DailyBriefService();
