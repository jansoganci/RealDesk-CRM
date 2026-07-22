import { supabase } from '@/config/supabase';
import type { Database } from '@/types/database.types';
import type { DealStage } from '@/types';
import { insertRow, updateRow } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import { getActiveOrgId, softDelete } from '@/lib/orgHelpers';
import { handleServiceError } from '@/lib/handleServiceError';
import { generateTimelineMilestones } from '@/services/timelineMilestones.service';

type DealRow = Database['public']['Tables']['deals']['Row'];
type DealInsert = Database['public']['Tables']['deals']['Insert'];
type DealUpdate = Database['public']['Tables']['deals']['Update'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

/** Safe subset for editing deal metadata (use {@link DealsService.updateStage} for stage changes). */
export type UpdateDealInput = Partial<
  Pick<
    DealUpdate,
    | 'deal_name'
    | 'notes'
    | 'projected_close_date'
    | 'intended_offer_price'
    | 'list_price'
    | 'earnest_money_planned'
    | 'financing_type'
    | 'preapproval_status'
    | 'buyer_agent_agreement_id'
    | 'property_snapshot'
    | 'property_id'
    | 'lead_id'
  >
>;
type OfferNegotiationRow = Database['public']['Tables']['offer_negotiations']['Row'];
type OfferRoundRow = Database['public']['Tables']['offer_rounds']['Row'];

export interface CreateDealInput {
  deal_name: string;
  deal_type: 'sale' | 'rental';
  client_role: 'buyer' | 'seller' | 'dual';
  lead_id?: string | null;
  property_id?: string | null;
  property_snapshot?: DealInsert['property_snapshot'];
  financing_type?: DealInsert['financing_type'];
  preapproval_status?: DealInsert['preapproval_status'];
  buyer_agent_agreement_id?: string | null;
  list_price?: number | null;
  intended_offer_price?: number | null;
  earnest_money_planned?: number | null;
  projected_close_date?: string | null;
  notes?: string | null;
}

type DealMilestoneRow = Database['public']['Tables']['deal_milestones']['Row'];
type DealPartyRow = Database['public']['Tables']['deal_parties']['Row'];

export interface DealWithRelations extends DealRow {
  offer_negotiations?: OfferNegotiationRow[] | null;
  offer_rounds?: OfferRoundRow[] | null;
  deal_milestones?: DealMilestoneRow[] | null;
  deal_parties?: DealPartyRow[] | null;
  property_inquiries?: Pick<
    Database['public']['Tables']['property_inquiries']['Row'],
    'id' | 'name' | 'status' | 'phone'
  > | null;
  properties?: Pick<
    Database['public']['Tables']['properties']['Row'],
    'id' | 'address' | 'city' | 'status' | 'property_type'
  > | null;
}

export interface DealStats {
  activeDeals: number;
  closingsThisMonth: number;
  overdueMilestones: number;
}

const TERMINAL_STAGES: DealStage[] = ['closed_won', 'fell_through'];

class DealsService {
  /**
   * Ensures a property row in the active org was updated (avoids silent RLS / cross-org failures).
   */
  private async assertPropertyRowUpdated(
    orgId: string,
    propertyId: string,
    patch: PropertyUpdate
  ): Promise<void> {
    const payload: PropertyUpdate = {
      ...patch,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('properties')
      .update(payload)
      .eq('id', propertyId)
      .eq('org_id', orgId)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error('Property could not be updated. It may be missing or you may lack access.');
    }
  }

  private async assertDealInOrg(dealId: string): Promise<DealRow> {
    const orgId = await getActiveOrgId();
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error('Deal not found.');
    }
    return data as DealRow;
  }

  /**
   * INSERT deal + first offer_negotiation (active session, no rounds yet).
   */
  async createDeal(input: CreateDealInput): Promise<{ deal: DealRow; negotiation: OfferNegotiationRow }> {
    try {
      const userId = await getAuthenticatedUserId();
      const orgId = await getActiveOrgId();

      const dealValues: DealInsert = {
        org_id: orgId,
        user_id: userId,
        deal_name: input.deal_name,
        deal_type: input.deal_type,
        client_role: input.client_role,
        deal_stage: 'offer_prep',
        lead_id: input.lead_id ?? null,
        property_id: input.property_id ?? null,
        property_snapshot: input.property_snapshot ?? null,
        financing_type: input.financing_type ?? null,
        preapproval_status: input.preapproval_status ?? null,
        buyer_agent_agreement_id: input.buyer_agent_agreement_id ?? null,
        list_price: input.list_price ?? null,
        intended_offer_price: input.intended_offer_price ?? null,
        earnest_money_planned: input.earnest_money_planned ?? null,
        projected_close_date: input.projected_close_date ?? null,
        notes: input.notes ?? null,
      };

      const deal = (await insertRow('deals', dealValues)) as DealRow;

      const negotiation = (await insertRow('offer_negotiations', {
        org_id: orgId,
        user_id: userId,
        deal_id: deal.id,
        status: 'active',
      })) as OfferNegotiationRow;

      return { deal, negotiation };
    } catch (error) {
      throw handleServiceError(error, 'Failed to create deal');
    }
  }

  /**
   * Atomically creates a deal + negotiation and marks the matched lead converted.
   */
  async convertLeadToDeal(leadId: string, input: CreateDealInput): Promise<{ deal: DealRow; negotiation: OfferNegotiationRow }> {
    try {
      await getAuthenticatedUserId();
      const orgId = await getActiveOrgId();

      if (!input.property_id) {
        throw new Error('A matched property is required to convert this lead.');
      }

      const { data, error } = await supabase.rpc('rpc_convert_lead_to_deal', {
        p_lead_id: leadId,
        p_org_id: orgId,
        p_property_id: input.property_id,
        p_deal: {
          deal_name: input.deal_name,
          deal_type: input.deal_type,
          client_role: input.client_role,
          financing_type: input.financing_type ?? null,
          preapproval_status: input.preapproval_status ?? null,
          buyer_agent_agreement_id: input.buyer_agent_agreement_id ?? null,
          list_price: input.list_price ?? null,
          intended_offer_price: input.intended_offer_price ?? null,
          earnest_money_planned: input.earnest_money_planned ?? null,
          projected_close_date: input.projected_close_date ?? null,
          notes: input.notes ?? null,
        },
      });

      if (error) throw error;
      if (!data) throw new Error('The conversion did not return a deal.');

      return data;
    } catch (error) {
      throw handleServiceError(error, 'Failed to convert lead to deal');
    }
  }

  async getAll(): Promise<DealRow[]> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as DealRow[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch deals');
    }
  }

  async getById(id: string): Promise<DealWithRelations> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('deals')
        .select(
          `
          *,
          offer_negotiations (*),
          offer_rounds (*),
          deal_milestones (*),
          deal_parties!deal_parties_deal_id_fkey (*),
          property_inquiries!deals_lead_id_fkey (id, name, status, phone),
          properties!deals_property_id_fkey (id, address, city, status, property_type)
        `
        )
        .eq('id', id)
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('Deal not found.');
      }

      return data as DealWithRelations;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch deal');
    }
  }

  async getByStage(stage: DealStage): Promise<DealRow[]> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('org_id', orgId)
        .eq('deal_stage', stage)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as DealRow[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch deals by stage');
    }
  }

  async updateStage(id: string, stage: DealStage): Promise<DealRow> {
    try {
      await this.assertDealInOrg(id);

      const row = (await updateRow('deals', id, {
        deal_stage: stage,
        updated_at: new Date().toISOString(),
      })) as DealRow;

      return row;
    } catch (error) {
      throw handleServiceError(error, 'Failed to update deal stage');
    }
  }

  /**
   * Patch editable deal fields. Does not change `deal_stage` (see {@link updateStage}).
   */
  async updateDeal(id: string, patch: UpdateDealInput): Promise<DealRow> {
    try {
      await this.assertDealInOrg(id);

      const update: DealUpdate = {
        updated_at: new Date().toISOString(),
      };
      (Object.keys(patch) as (keyof UpdateDealInput)[]).forEach((key) => {
        const v = patch[key];
        if (v !== undefined) {
          (update as Record<string, unknown>)[key as string] = v;
        }
      });

      return (await updateRow('deals', id, update)) as DealRow;
    } catch (error) {
      throw handleServiceError(error, 'Failed to update deal');
    }
  }

  async markMutualAcceptance(
    dealId: string,
    roundId: string,
    acceptedAt: Date | string
  ): Promise<{ deal: DealRow; milestonesCreated: number }> {
    try {
      const deal = await this.assertDealInOrg(dealId);
      const orgId = await getActiveOrgId();
      const acceptedIso = typeof acceptedAt === 'string' ? acceptedAt : acceptedAt.toISOString();

      const { data: round, error: roundError } = await supabase
        .from('offer_rounds')
        .select('*')
        .eq('id', roundId)
        .eq('deal_id', dealId)
        .eq('org_id', orgId)
        .maybeSingle();

      if (roundError) throw roundError;
      if (!round) {
        throw new Error('Offer round not found.');
      }

      if (round.status !== 'submitted' && round.status !== 'verbal_accepted') {
        throw new Error('Only a submitted or verbal-accepted round can move to mutual acceptance.');
      }

      await updateRow('offer_rounds', roundId, {
        status: 'mutual_acceptance',
        mutual_acceptance_at: acceptedIso,
        updated_at: new Date().toISOString(),
      });

      const negotiationUpdate: Database['public']['Tables']['offer_negotiations']['Update'] = {
        accepted_round_id: roundId,
        status: 'accepted',
        updated_at: new Date().toISOString(),
      };

      await updateRow('offer_negotiations', round.negotiation_id, negotiationUpdate);

      const dealUpdate: DealUpdate = {
        deal_stage: 'under_contract',
        mutual_acceptance_date: acceptedIso,
        accepted_offer_price: round.offer_price,
        earnest_money_actual: round.emd_amount ?? null,
        projected_close_date: round.closing_date ?? deal.projected_close_date,
        updated_at: new Date().toISOString(),
      };

      const updatedDeal = (await updateRow('deals', dealId, dealUpdate)) as DealRow;

      if (deal.property_id) {
        await this.assertPropertyRowUpdated(orgId, deal.property_id, {
          under_offer_at: acceptedIso,
          under_contract_deal_id: dealId,
          status: 'Under Offer',
        });
      }

      const milestonesCreated = await generateTimelineMilestones(dealId, roundId, acceptedIso);

      return { deal: updatedDeal, milestonesCreated };
    } catch (error) {
      throw handleServiceError(error, 'Failed to record mutual acceptance');
    }
  }

  async markClosedWon(id: string, closeDate: string): Promise<DealRow> {
    try {
      const deal = await this.assertDealInOrg(id);
      const orgId = await getActiveOrgId();

      const updated = (await updateRow('deals', id, {
        deal_stage: 'closed_won',
        actual_close_date: closeDate,
        updated_at: new Date().toISOString(),
      })) as DealRow;

      if (deal.property_id && deal.deal_type === 'sale') {
        await this.assertPropertyRowUpdated(orgId, deal.property_id, {
          status: 'Sold',
          sold_at: closeDate,
          under_contract_deal_id: null,
        });
      }

      if (deal.property_id && deal.deal_type === 'rental') {
        await this.assertPropertyRowUpdated(orgId, deal.property_id, {
          status: 'Occupied',
          under_contract_deal_id: null,
        });
      }

      return updated;
    } catch (error) {
      throw handleServiceError(error, 'Failed to close deal');
    }
  }

  async markFellThrough(id: string, reason: string): Promise<DealRow> {
    try {
      const deal = await this.assertDealInOrg(id);
      const orgId = await getActiveOrgId();

      const updated = (await updateRow('deals', id, {
        deal_stage: 'fell_through',
        fell_through_reason: reason,
        updated_at: new Date().toISOString(),
      })) as DealRow;

      await supabase
        .from('deal_milestones')
        .update({ status: 'waived', updated_at: new Date().toISOString() })
        .eq('deal_id', id)
        .eq('org_id', orgId);

      if (deal.property_id) {
        await this.assertPropertyRowUpdated(orgId, deal.property_id, {
          status: 'Available',
          under_contract_deal_id: null,
          under_offer_at: null,
        });
      }

      return updated;
    } catch (error) {
      throw handleServiceError(error, 'Failed to mark deal as fell through');
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await this.assertDealInOrg(id);
      await softDelete('deals', id);
    } catch (error) {
      throw handleServiceError(error, 'Failed to delete deal');
    }
  }

  private async assertMilestoneInOrg(milestoneId: string): Promise<DealMilestoneRow> {
    const orgId = await getActiveOrgId();
    const { data, error } = await supabase
      .from('deal_milestones')
      .select('*')
      .eq('id', milestoneId)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error('Milestone not found.');
    }
    return data as DealMilestoneRow;
  }

  /**
   * Update timeline milestone status (T14 — manual progress on deal detail).
   */
  async updateMilestoneStatus(
    milestoneId: string,
    status: DealMilestoneRow['status']
  ): Promise<DealMilestoneRow> {
    try {
      await this.assertMilestoneInOrg(milestoneId);
      const now = new Date().toISOString();
      const completedAt =
        status === 'complete' || status === 'waived' ? now : null;

      return (await updateRow('deal_milestones', milestoneId, {
        status,
        completed_at: completedAt,
        updated_at: now,
      })) as DealMilestoneRow;
    } catch (error) {
      throw handleServiceError(error, 'Failed to update milestone');
    }
  }

  async getStats(): Promise<DealStats> {
    try {
      const orgId = await getActiveOrgId();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

      const { data: allDeals, error: dealsError } = await supabase
        .from('deals')
        .select('id, deal_stage, projected_close_date, actual_close_date')
        .eq('org_id', orgId)
        .is('deleted_at', null);

      if (dealsError) throw dealsError;

      const rows = allDeals ?? [];
      const activeDeals = rows.filter((d) => !TERMINAL_STAGES.includes(d.deal_stage as DealStage)).length;

      const closingsThisMonth = rows.filter((d) => {
        const close = d.actual_close_date ?? d.projected_close_date;
        if (!close) return false;
        return close >= startOfMonth && close <= endOfMonth;
      }).length;

      const today = now.toISOString().slice(0, 10);
      const { count, error: msError } = await supabase
        .from('deal_milestones')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .in('status', ['pending', 'in_progress'])
        .lt('due_date', today);

      if (msError) throw msError;

      return {
        activeDeals,
        closingsThisMonth,
        overdueMilestones: count ?? 0,
      };
    } catch (error) {
      throw handleServiceError(error, 'Failed to load deal stats');
    }
  }
}

export const dealsService = new DealsService();
