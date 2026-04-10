import { supabase } from '@/config/supabase';
import type { Database, Json } from '@/types/database.types';
import { updateRow } from '@/lib/db';
import { getActiveOrgId } from '@/lib/orgHelpers';
import { handleServiceError } from '@/lib/handleServiceError';

type OfferContingencyRow = Database['public']['Tables']['offer_contingencies']['Row'];
type OfferContingencyUpdate = Database['public']['Tables']['offer_contingencies']['Update'];

export type ContingencyResolution =
  | 'satisfied'
  | 'waived'
  | 'negotiated_out'
  | 'expired'
  | 'terminated_deal';

/** Pre-built defaults for Add Counter-Offer / first offer UI (not persisted until inserted). */
export interface DefaultContingencyTemplate {
  contingency_type: NonNullable<Database['public']['Tables']['offer_contingencies']['Insert']['contingency_type']>;
  days_offset: number | null;
  included_in_offer: boolean;
  waived_at_offer: boolean;
  label_override?: string | null;
  type_specific_data?: Json | null;
}

class OfferContingenciesService {
  private async assertContingencyInOrg(id: string): Promise<OfferContingencyRow> {
    const orgId = await getActiveOrgId();
    const { data, error } = await supabase
      .from('offer_contingencies')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error('Contingency not found.');
    }
    return data as OfferContingencyRow;
  }

  async getByOfferRound(offerRoundId: string): Promise<OfferContingencyRow[]> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('offer_contingencies')
        .select('*')
        .eq('offer_round_id', offerRoundId)
        .eq('org_id', orgId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as OfferContingencyRow[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch contingencies for offer round');
    }
  }

  /**
   * Open contingencies on the deal (Contingencies tab after mutual acceptance).
   */
  async getActiveByDeal(dealId: string): Promise<OfferContingencyRow[]> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('offer_contingencies')
        .select('*')
        .eq('deal_id', dealId)
        .eq('org_id', orgId)
        .in('status', ['proposed', 'active'])
        .order('deadline_date', { ascending: true });

      if (error) throw error;
      return (data ?? []) as OfferContingencyRow[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch active contingencies');
    }
  }

  private mapResolutionToContingencyStatus(
    resolution: ContingencyResolution
  ): OfferContingencyRow['status'] {
    switch (resolution) {
      case 'satisfied':
      case 'negotiated_out':
        return 'satisfied';
      case 'waived':
        return 'waived';
      case 'expired':
        return 'expired';
      case 'terminated_deal':
        return 'failed';
      default:
        return 'satisfied';
    }
  }

  private async syncLinkedMilestones(
    contingencyId: string,
    dealId: string,
    resolution: ContingencyResolution
  ): Promise<void> {
    const orgId = await getActiveOrgId();
    const milestoneStatus =
      resolution === 'waived' ||
      resolution === 'expired' ||
      resolution === 'terminated_deal'
        ? 'waived'
        : 'complete';

    const { error } = await supabase
      .from('deal_milestones')
      .update({
        status: milestoneStatus,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('contingency_id', contingencyId)
      .eq('deal_id', dealId)
      .eq('org_id', orgId);

    if (error) throw error;
  }

  async resolveContingency(
    id: string,
    resolutionType: ContingencyResolution,
    resolvedDate: string
  ): Promise<OfferContingencyRow> {
    try {
      const row = await this.assertContingencyInOrg(id);

      const status = this.mapResolutionToContingencyStatus(resolutionType);

      const update: OfferContingencyUpdate = {
        status,
        resolution_type: resolutionType,
        resolved_date: resolvedDate,
        updated_at: new Date().toISOString(),
      };

      const updated = (await updateRow('offer_contingencies', id, update)) as OfferContingencyRow;

      await this.syncLinkedMilestones(id, row.deal_id, resolutionType);

      return updated;
    } catch (error) {
      throw handleServiceError(error, 'Failed to resolve contingency');
    }
  }

  async waiveContingency(id: string): Promise<OfferContingencyRow> {
    const today = new Date().toISOString().slice(0, 10);
    return this.resolveContingency(id, 'waived', today);
  }

  /**
   * Default set for pre-filling offer / counter-offer (inspection 10d, financing 21d; appraisal for sales only).
   */
  getDefaultContingencies(dealType: 'sale' | 'rental' = 'sale'): DefaultContingencyTemplate[] {
    const base: DefaultContingencyTemplate[] = [
      {
        contingency_type: 'inspection_general',
        days_offset: 10,
        included_in_offer: true,
        waived_at_offer: false,
      },
      {
        contingency_type: 'financing',
        days_offset: 21,
        included_in_offer: true,
        waived_at_offer: false,
      },
    ];

    if (dealType === 'rental') {
      return base;
    }

    return [
      ...base,
      {
        contingency_type: 'appraisal',
        days_offset: null,
        included_in_offer: true,
        waived_at_offer: false,
        type_specific_data: { required: true },
      },
    ];
  }
}

export const offerContingenciesService = new OfferContingenciesService();
