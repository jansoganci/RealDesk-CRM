import { supabase } from '@/config/supabase';
import type { Database } from '@/types/database.types';
import { insertRow, updateRow } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import { getActiveOrgId } from '@/lib/orgHelpers';
import { handleServiceError } from '@/lib/handleServiceError';
import { dealsService } from '@/services/deals.service';
import { purchaseAgreementService } from '@/services/purchaseAgreement.service';

type DealRow = Database['public']['Tables']['deals']['Row'];
type OfferRoundRow = Database['public']['Tables']['offer_rounds']['Row'];
type OfferRoundInsert = Database['public']['Tables']['offer_rounds']['Insert'];
type OfferNegotiationRow = Database['public']['Tables']['offer_negotiations']['Row'];

export type OfferedBy = 'buyer' | 'seller';

/** Fields for the first offer round (draft). */
export interface CreateFirstOfferInput {
  offer_price: number;
  offered_by: OfferedBy;
  emd_amount?: number | null;
  closing_date?: string | null;
  possession_date?: string | null;
  seller_credits?: number | null;
  appraisal_gap_coverage?: number | null;
  personal_property_notes?: string | null;
  financing_type?: OfferRoundInsert['financing_type'];
  expiration_date?: string | null;
  expiration_time?: string | null;
  notes?: string | null;
}

/** Overrides for a new counter round (merged on top of the prior round). */
export type AddCounterOfferInput = Partial<CreateFirstOfferInput>;

class OfferRoundsService {
  private async assertRoundInOrg(roundId: string): Promise<OfferRoundRow> {
    const orgId = await getActiveOrgId();
    const { data, error } = await supabase
      .from('offer_rounds')
      .select('*')
      .eq('id', roundId)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error('Offer round not found.');
    }
    return data as OfferRoundRow;
  }

  /**
   * Ensures an active `offer_negotiations` row exists for the deal (normally created with the deal).
   */
  private async getOrCreateNegotiation(dealId: string): Promise<OfferNegotiationRow> {
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data: existing, error: fetchError } = await supabase
      .from('offer_negotiations')
      .select('*')
      .eq('deal_id', dealId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existing) {
      return existing as OfferNegotiationRow;
    }

    return insertRow('offer_negotiations', {
      org_id: orgId,
      user_id: userId,
      deal_id: dealId,
      status: 'active',
    }) as Promise<OfferNegotiationRow>;
  }

  /**
   * Creates round #1 in draft (negotiation must exist or will be created).
   */
  async createFirstOffer(
    dealId: string,
    data: CreateFirstOfferInput
  ): Promise<{ negotiation: OfferNegotiationRow; round: OfferRoundRow }> {
    try {
      const userId = await getAuthenticatedUserId();
      const orgId = await getActiveOrgId();

      const { data: dealRow, error: dealErr } = await supabase
        .from('deals')
        .select('id')
        .eq('id', dealId)
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .maybeSingle();

      if (dealErr) throw dealErr;
      if (!dealRow) {
        throw new Error('Deal not found.');
      }

      const negotiation = await this.getOrCreateNegotiation(dealId);

      const { count, error: countError } = await supabase
        .from('offer_rounds')
        .select('id', { count: 'exact', head: true })
        .eq('negotiation_id', negotiation.id);

      if (countError) throw countError;
      if ((count ?? 0) > 0) {
        throw new Error('This deal already has offer rounds. Use add counter-offer instead.');
      }

      const roundValues: OfferRoundInsert = {
        org_id: orgId,
        user_id: userId,
        negotiation_id: negotiation.id,
        deal_id: dealId,
        round_number: 1,
        offered_by: data.offered_by,
        parent_round_id: null,
        status: 'draft',
        offer_price: data.offer_price,
        emd_amount: data.emd_amount ?? null,
        closing_date: data.closing_date ?? null,
        possession_date: data.possession_date ?? null,
        seller_credits: data.seller_credits ?? null,
        appraisal_gap_coverage: data.appraisal_gap_coverage ?? null,
        personal_property_notes: data.personal_property_notes ?? null,
        financing_type: data.financing_type ?? null,
        expiration_date: data.expiration_date ?? null,
        expiration_time: data.expiration_time ?? null,
        notes: data.notes ?? null,
      };

      const round = (await insertRow('offer_rounds', roundValues)) as OfferRoundRow;

      return { negotiation, round };
    } catch (error) {
      throw handleServiceError(error, 'Failed to create first offer');
    }
  }

  /**
   * Immutable new round after `priorRoundId`, pre-filled from prior + overrides.
   */
  async addCounterOffer(
    priorRoundId: string,
    data: AddCounterOfferInput,
    offeredBy: OfferedBy
  ): Promise<OfferRoundRow> {
    try {
      const userId = await getAuthenticatedUserId();
      const orgId = await getActiveOrgId();

      const prior = await this.assertRoundInOrg(priorRoundId);

      const { data: maxRow, error: maxError } = await supabase
        .from('offer_rounds')
        .select('round_number')
        .eq('negotiation_id', prior.negotiation_id)
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxError) throw maxError;
      const nextNumber = (maxRow?.round_number ?? prior.round_number) + 1;

      const merged: CreateFirstOfferInput = {
        offer_price: data.offer_price ?? prior.offer_price,
        offered_by: offeredBy,
        emd_amount: data.emd_amount ?? prior.emd_amount,
        closing_date: data.closing_date ?? prior.closing_date,
        possession_date: data.possession_date ?? prior.possession_date,
        seller_credits: data.seller_credits ?? prior.seller_credits,
        appraisal_gap_coverage: data.appraisal_gap_coverage ?? prior.appraisal_gap_coverage,
        personal_property_notes: data.personal_property_notes ?? prior.personal_property_notes,
        financing_type: data.financing_type ?? prior.financing_type,
        expiration_date: data.expiration_date ?? prior.expiration_date,
        expiration_time: data.expiration_time ?? prior.expiration_time,
        notes: data.notes ?? null,
      };

      const roundValues: OfferRoundInsert = {
        org_id: orgId,
        user_id: userId,
        negotiation_id: prior.negotiation_id,
        deal_id: prior.deal_id,
        round_number: nextNumber,
        offered_by: merged.offered_by,
        parent_round_id: priorRoundId,
        status: 'draft',
        offer_price: merged.offer_price,
        emd_amount: merged.emd_amount,
        closing_date: merged.closing_date,
        possession_date: merged.possession_date,
        seller_credits: merged.seller_credits,
        appraisal_gap_coverage: merged.appraisal_gap_coverage,
        personal_property_notes: merged.personal_property_notes,
        financing_type: merged.financing_type,
        expiration_date: merged.expiration_date,
        expiration_time: merged.expiration_time,
        notes: merged.notes,
        contract_id: prior.contract_id,
      };

      const round = (await insertRow('offer_rounds', roundValues)) as OfferRoundRow;

      const now = new Date().toISOString();

      if (prior.contract_id) {
        await purchaseAgreementService.syncPurchaseContractAfterCounterOffer(prior.contract_id, prior.deal_id, {
          offer_price: merged.offer_price,
          closing_date: merged.closing_date,
          emd_amount: merged.emd_amount,
          expiration_date: merged.expiration_date,
          expiration_time: merged.expiration_time,
          personal_property_notes: merged.personal_property_notes,
          notes: merged.notes,
        });
        await purchaseAgreementService.regeneratePurchaseAgreementPdf(prior.contract_id);
      }

      const terminal = new Set([
        'mutual_acceptance',
        'rejected',
        'expired',
        'withdrawn',
        'superseded',
      ]);
      if (!terminal.has(prior.status)) {
        await updateRow('offer_rounds', priorRoundId, {
          status: 'superseded',
          updated_at: now,
        });
      }

      await updateRow('deals', prior.deal_id, {
        deal_stage: 'negotiating',
        updated_at: now,
      });

      return round;
    } catch (error) {
      throw handleServiceError(error, 'Failed to add counter-offer');
    }
  }

  async submitOffer(roundId: string): Promise<OfferRoundRow> {
    try {
      const round = await this.assertRoundInOrg(roundId);
      if (round.status !== 'draft') {
        throw new Error('Only draft offers can be submitted.');
      }

      const now = new Date().toISOString();
      const updated = (await updateRow('offer_rounds', roundId, {
        status: 'submitted',
        submitted_at: now,
        updated_at: now,
      })) as OfferRoundRow;

      const { data: deal } = await supabase
        .from('deals')
        .select('deal_stage')
        .eq('id', round.deal_id)
        .maybeSingle();

      if (deal?.deal_stage === 'offer_prep' || deal?.deal_stage === 'negotiating') {
        await updateRow('deals', round.deal_id, {
          deal_stage: 'submitted',
          updated_at: now,
        });
      }

      return updated;
    } catch (error) {
      throw handleServiceError(error, 'Failed to submit offer');
    }
  }

  async markVerbalAccepted(roundId: string): Promise<OfferRoundRow> {
    try {
      const round = await this.assertRoundInOrg(roundId);
      if (round.status !== 'submitted') {
        throw new Error('Only a submitted offer can be marked verbally accepted.');
      }

      const now = new Date().toISOString();
      const updated = (await updateRow('offer_rounds', roundId, {
        status: 'verbal_accepted',
        updated_at: now,
      })) as OfferRoundRow;

      await updateRow('deals', round.deal_id, {
        deal_stage: 'verbal_accepted',
        updated_at: now,
      });

      return updated;
    } catch (error) {
      throw handleServiceError(error, 'Failed to mark verbal acceptance');
    }
  }

  async markMutualAcceptance(
    roundId: string,
    acceptedAt: Date | string
  ): Promise<{ deal: DealRow; milestonesCreated: number }> {
    try {
      const round = await this.assertRoundInOrg(roundId);
      return dealsService.markMutualAcceptance(round.deal_id, roundId, acceptedAt);
    } catch (error) {
      throw handleServiceError(error, 'Failed to record mutual acceptance');
    }
  }

  async markRejected(roundId: string): Promise<OfferRoundRow> {
    try {
      await this.assertRoundInOrg(roundId);
      const now = new Date().toISOString();

      return (await updateRow('offer_rounds', roundId, {
        status: 'rejected',
        updated_at: now,
      })) as OfferRoundRow;
    } catch (error) {
      throw handleServiceError(error, 'Failed to mark offer rejected');
    }
  }

  async markExpired(roundId: string): Promise<OfferRoundRow> {
    try {
      await this.assertRoundInOrg(roundId);
      const now = new Date().toISOString();

      return (await updateRow('offer_rounds', roundId, {
        status: 'expired',
        updated_at: now,
      })) as OfferRoundRow;
    } catch (error) {
      throw handleServiceError(error, 'Failed to mark offer expired');
    }
  }

  async getByDeal(dealId: string): Promise<OfferRoundRow[]> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('offer_rounds')
        .select('*')
        .eq('deal_id', dealId)
        .eq('org_id', orgId)
        .order('round_number', { ascending: true });

      if (error) throw error;
      return (data ?? []) as OfferRoundRow[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch offer rounds');
    }
  }

  async getActiveRound(dealId: string): Promise<OfferRoundRow | null> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('offer_rounds')
        .select('*')
        .eq('deal_id', dealId)
        .eq('org_id', orgId)
        .in('status', ['submitted', 'verbal_accepted'])
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as OfferRoundRow) ?? null;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch active offer round');
    }
  }
}

export const offerRoundsService = new OfferRoundsService();
