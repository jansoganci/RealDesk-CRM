import { supabase } from '@/config/supabase';
import { getActiveOrgId } from '@/lib/orgHelpers';
import { handleServiceError } from '@/lib/handleServiceError';
import type { DealParty, DealPartyInsert, DealPartyUpdate } from '@/types';

export type CreateDealPartyInput = Omit<DealPartyInsert, 'id' | 'org_id' | 'deal_id' | 'created_at'>;
export type UpdateDealPartyInput = Omit<DealPartyUpdate, 'id' | 'org_id' | 'deal_id' | 'created_at'>;

class DealPartiesService {
  async getByDeal(dealId: string): Promise<DealParty[]> {
    try {
      const orgId = await getActiveOrgId();
      const { data, error } = await supabase
        .from('deal_parties')
        .select('*')
        .eq('org_id', orgId)
        .eq('deal_id', dealId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as DealParty[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch deal parties');
    }
  }

  async addParty(dealId: string, data: CreateDealPartyInput): Promise<DealParty> {
    try {
      const orgId = await getActiveOrgId();
      const { data: row, error } = await supabase
        .from('deal_parties')
        .insert({
          org_id: orgId,
          deal_id: dealId,
          ...data,
        })
        .select('*')
        .single();

      if (error) throw error;
      return row as DealParty;
    } catch (error) {
      throw handleServiceError(error, 'Failed to add deal party');
    }
  }

  async updateParty(id: string, data: UpdateDealPartyInput): Promise<DealParty> {
    try {
      const orgId = await getActiveOrgId();
      const { data: row, error } = await supabase
        .from('deal_parties')
        .update(data)
        .eq('id', id)
        .eq('org_id', orgId)
        .select('*')
        .single();

      if (error) throw error;
      return row as DealParty;
    } catch (error) {
      throw handleServiceError(error, 'Failed to update deal party');
    }
  }

  async removeParty(id: string): Promise<void> {
    try {
      const orgId = await getActiveOrgId();
      const { error } = await supabase
        .from('deal_parties')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);

      if (error) throw error;
    } catch (error) {
      throw handleServiceError(error, 'Failed to remove deal party');
    }
  }

  async getContactForMilestone(milestoneId: string): Promise<DealParty | null> {
    try {
      const orgId = await getActiveOrgId();

      const { data: milestone, error: milestoneError } = await supabase
        .from('deal_milestones')
        .select('deal_id, responsible_party')
        .eq('id', milestoneId)
        .eq('org_id', orgId)
        .single();

      if (milestoneError) throw milestoneError;
      if (!milestone?.responsible_party) return null;

      const { data: party, error: partyError } = await supabase
        .from('deal_parties')
        .select('*')
        .eq('org_id', orgId)
        .eq('deal_id', milestone.deal_id)
        .eq('role', milestone.responsible_party)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (partyError) throw partyError;
      return (party as DealParty | null) ?? null;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch contact for milestone');
    }
  }
}

export const dealPartiesService = new DealPartiesService();
