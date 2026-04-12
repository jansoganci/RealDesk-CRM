import { supabase } from '@/config/supabase';
import type { PurchaseAgreementFormValues } from '@/features/contracts/schemas/purchaseAgreementForm.schema';
import { getAuthenticatedUserId } from '@/lib/auth';
import { updateRow } from '@/lib/db';
import { getActiveOrgId } from '@/lib/orgHelpers';
import { callRpc } from '@/lib/rpc';
import type { Json } from '@/types/database.types';
import type {
  RpcCreatePurchaseContractParams,
  RpcCreatePurchaseContractResult,
} from '@/types/rpc';
import type { Contract, PurchaseDetails, PurchaseDetailsUpdate } from '@/types';
import type { OfferRound } from '@/types';
import { toast } from 'sonner';
import { purchaseAgreementFormValuesFromDb } from '@/services/purchaseFormFromDb';

/** Keys stored on `contracts` or linking — excluded from `purchase_details` JSON. */
const CONTRACT_AND_LINK_KEYS = new Set([
  'effective_date',
  'closing_date',
  'purchase_price',
  'earnest_money_amount',
  'earnest_money_due_date',
  'governing_law_state',
  'deal_status',
  'buyer_name_2',
  'seller_name_2',
  'seller_id',
  'linkedPropertyId',
  'linkedSellerOwnerId',
]);

function purchaseDetailsJsonFromForm(form: PurchaseAgreementFormValues): Json {
  const o: Record<string, unknown> = {};
  for (const key of Object.keys(form) as (keyof PurchaseAgreementFormValues)[]) {
    if (CONTRACT_AND_LINK_KEYS.has(key as string)) continue;
    const v = form[key];
    o[key as string] = v === undefined ? null : v;
  }
  return o as Json;
}

function contractJsonFromForm(form: PurchaseAgreementFormValues, propertyId: string): Json {
  const sellerId = form.seller_id ?? form.linkedSellerOwnerId;
  return {
    property_id: propertyId,
    effective_date: form.effective_date,
    closing_date: form.closing_date,
    purchase_price: form.purchase_price,
    earnest_money_amount: form.earnest_money_amount,
    earnest_money_due_date: form.earnest_money_due_date,
    governing_law_state: form.governing_law_state,
    deal_status: form.deal_status ?? 'active',
    buyer_name_2: form.buyer_name_2,
    seller_name_2: form.seller_name_2,
    seller_id: sellerId,
    currency: 'USD',
    wizard_completed: true,
  };
}

function parseRpcPurchaseResult(data: Json): RpcCreatePurchaseContractResult {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid RPC response');
  }
  const r = data as Record<string, unknown>;
  const contract_id = r.contract_id;
  const deal_id = r.deal_id;
  const offer_round_id = r.offer_round_id;
  if (typeof contract_id !== 'string' || typeof deal_id !== 'string' || typeof offer_round_id !== 'string') {
    throw new Error('Invalid RPC response shape');
  }
  return { contract_id, deal_id, offer_round_id };
}

export interface CreatePurchaseAgreementInput {
  form: PurchaseAgreementFormValues;
  /** When set, links the purchase contract to an existing deal instead of creating a new deal. */
  dealId?: string | null;
}

export type PurchaseContractWithDetails = Contract & {
  purchase_details: PurchaseDetails | null;
};

export type PurchaseDetailsWithContract = PurchaseDetails & {
  contracts: Contract | Contract[] | null;
};

export type PurchaseContractWithDetailsRelation = Contract & {
  purchase_details: PurchaseDetails | PurchaseDetails[] | null;
};

export type PurchaseCounterOfferInput = {
  offered_by: 'buyer' | 'seller';
  purchase_price: number;
  closing_date?: string;
  notes?: string;
};

export type CreatePurchaseWithDetailsInput = {
  contractData: Record<string, unknown>;
  detailsData: Record<string, unknown>;
  dealId?: string | null;
};

export type UploadAddendumResult = {
  path: string;
  uploaded: true;
};

export type CloseDealResult = {
  success: true;
  purchasePrice: number | null;
};

async function getServiceProxy() {
  return import('@/lib/serviceProxy');
}

/** Payload from deal counter-offer flow to sync `contracts` + `purchase_details` + `deals`. */
export type PurchaseCounterOfferSync = {
  offer_price: number;
  closing_date?: string | null;
  emd_amount?: number | null;
  expiration_date?: string | null;
  expiration_time?: string | null;
  personal_property_notes?: string | null;
  notes?: string | null;
};

class PurchaseAgreementService {
  private async getLatestOfferRoundNumber(contractId: string, orgId: string): Promise<number> {
    const { data, error } = await supabase
      .from('offer_rounds')
      .select('round_number')
      .eq('contract_id', contractId)
      .eq('org_id', orgId)
      .order('round_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.round_number ?? 1;
  }

  private async uploadVersionedPurchasePdf(
    contractId: string,
    orgId: string,
    blob: Blob,
    offerNumber: number,
    tag?: 'regenerated',
  ): Promise<string> {
    const timestamp = Date.now();
    const suffix = tag ? `_${tag}` : '';
    const path = `purchases/${orgId}/${contractId}/v${offerNumber}${suffix}_${timestamp}.pdf`;
    const { error } = await supabase.storage.from('contract-pdfs').upload(path, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/pdf',
    });
    if (error) throw error;
    return path;
  }

  /**
   * Atomically creates `contracts` (purchase) + `purchase_details` + `offer_negotiations` (if needed)
   * + first `offer_round` + `deal_milestones` seeds via RPC (org owner only).
   */
  async createPurchaseContract(input: CreatePurchaseAgreementInput): Promise<RpcCreatePurchaseContractResult> {
    await getAuthenticatedUserId();
    await getActiveOrgId();

    const propertyId = input.form.linkedPropertyId;
    if (!propertyId) {
      throw new Error('Property is required');
    }

    const params: RpcCreatePurchaseContractParams = {
      p_contract: contractJsonFromForm(input.form, propertyId),
      p_purchase_details: purchaseDetailsJsonFromForm(input.form),
      p_deal_id: input.dealId ?? null,
    };

    const data = await callRpc<RpcCreatePurchaseContractParams, Json>(
      'rpc_create_purchase_contract',
      params,
    );
    return parseRpcPurchaseResult(data);
  }

  async createPurchaseWithDetails(input: CreatePurchaseWithDetailsInput): Promise<{ contractId: string }> {
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase.rpc('rpc_create_purchase_contract', {
      p_contract: {
        ...input.contractData,
        org_id: orgId,
        user_id: userId,
      },
      p_purchase_details: {
        ...input.detailsData,
        org_id: orgId,
        user_id: userId,
      },
      p_deal_id: input.dealId ?? null,
    });
    if (error) {
      throw new Error(`Failed to create purchase agreement: ${error.message}`);
    }
    const parsed = parseRpcPurchaseResult(data as Json);

    const { data: milestones, error: milestoneErr } = await supabase
      .from('deal_milestones')
      .select('id')
      .eq('deal_id', parsed.deal_id)
      .limit(1);
    if (!milestoneErr && (!milestones || milestones.length === 0)) {
      console.warn('Timeline milestones may not have been seeded for deal:', parsed.deal_id);
      toast.warning(
        'Agreement saved. Timeline milestones could not be auto-created. Add them manually in the Timeline tab.',
      );
    }

    return { contractId: parsed.contract_id };
  }

  async getPurchaseDetails(contractId: string): Promise<PurchaseDetailsWithContract | null> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('purchase_details')
      .select('*, contracts(*)')
      .eq('contract_id', contractId)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) throw error;
    return (data as PurchaseDetailsWithContract | null) ?? null;
  }

  async getActiveDeals(): Promise<PurchaseContractWithDetailsRelation[]> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('contracts')
      .select('*, purchase_details(*)')
      .eq('org_id', orgId)
      .eq('contract_type', 'purchase')
      .neq('deal_status', 'cancelled')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as PurchaseContractWithDetailsRelation[] | null) ?? [];
  }

  async getDealsByStatus(status: string): Promise<PurchaseContractWithDetailsRelation[]> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('contracts')
      .select('*, purchase_details(*)')
      .eq('org_id', orgId)
      .eq('contract_type', 'purchase')
      .eq('deal_status', status)
      .is('deleted_at', null)
      .order('closing_date', { ascending: true });

    if (error) throw error;
    return (data as PurchaseContractWithDetailsRelation[] | null) ?? [];
  }

  async addCounterOffer(contractId: string, data: PurchaseCounterOfferInput): Promise<OfferRound> {
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data: latestRound, error: latestErr } = await supabase
      .from('offer_rounds')
      .select('id, round_number, negotiation_id, deal_id')
      .eq('contract_id', contractId)
      .eq('org_id', orgId)
      .order('round_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestErr) throw latestErr;
    if (!latestRound) {
      throw new Error('No existing offer round found for this purchase agreement');
    }

    const nextRound = (latestRound.round_number ?? 0) + 1;

    const { error: supersedeErr } = await supabase
      .from('offer_rounds')
      .update({ status: 'superseded', updated_at: new Date().toISOString() })
      .eq('contract_id', contractId)
      .eq('org_id', orgId)
      .eq('round_number', latestRound.round_number);
    if (supersedeErr) throw supersedeErr;

    const { data: inserted, error: insertErr } = await supabase
      .from('offer_rounds')
      .insert({
        contract_id: contractId,
        org_id: orgId,
        user_id: userId,
        deal_id: latestRound.deal_id,
        negotiation_id: latestRound.negotiation_id,
        round_number: nextRound,
        offered_by: data.offered_by,
        offer_price: data.purchase_price,
        notes: data.notes ?? null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select('*')
      .single();
    if (insertErr) throw insertErr;

    const patch: Record<string, unknown> = {
      purchase_price: data.purchase_price,
      updated_at: new Date().toISOString(),
    };
    if (data.closing_date) {
      patch.closing_date = data.closing_date;
    }

    const { error: contractErr } = await supabase
      .from('contracts')
      .update(patch)
      .eq('id', contractId)
      .eq('org_id', orgId);
    if (contractErr) throw contractErr;

    await this.regeneratePurchaseAgreementPdf(contractId, inserted.round_number ?? nextRound);

    return inserted as OfferRound;
  }

  async getOfferHistory(contractId: string): Promise<OfferRound[]> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('offer_rounds')
      .select('*')
      .eq('contract_id', contractId)
      .eq('org_id', orgId)
      .order('round_number', { ascending: true });

    if (error) throw error;
    return (data as OfferRound[] | null) ?? [];
  }

  async getPurchaseDetailsByContractId(contractId: string): Promise<PurchaseDetails | null> {
    await getAuthenticatedUserId();
    await getActiveOrgId();

    const { data, error } = await supabase
      .from('purchase_details')
      .select('*')
      .eq('contract_id', contractId)
      .maybeSingle();

    if (error) throw error;
    return data as PurchaseDetails | null;
  }

  async updatePurchaseDetails(contractId: string, patch: PurchaseDetailsUpdate): Promise<PurchaseDetails> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data: row, error } = await supabase
      .from('purchase_details')
      .select('id, org_id')
      .eq('contract_id', contractId)
      .eq('org_id', orgId)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error('Purchase details not found');

    const updated = await updateRow('purchase_details', row.id, patch);
    return updated as PurchaseDetails;
  }

  async getPurchaseByContractId(contractId: string): Promise<PurchaseContractWithDetails | null> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .eq('org_id', orgId)
      .eq('contract_type', 'purchase')
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    if (!contract) return null;

    const purchase_details = await this.getPurchaseDetailsByContractId(contractId);
    return { ...(contract as Contract), purchase_details };
  }

  /** Deal linked via `offer_rounds.contract_id` (latest round wins). */
  async getDealIdForPurchaseContract(contractId: string): Promise<string | null> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('offer_rounds')
      .select('deal_id')
      .eq('contract_id', contractId)
      .eq('org_id', orgId)
      .order('round_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.deal_id ?? null;
  }

  /**
   * Applies counter-offer terms to the purchase agreement rows and deal summary (Sprint 6B T13).
   */
  async syncPurchaseContractAfterCounterOffer(
    contractId: string,
    dealId: string,
    patch: PurchaseCounterOfferSync,
  ): Promise<void> {
    await getAuthenticatedUserId();
    await getActiveOrgId();

    const bundle = await this.getPurchaseByContractId(contractId);
    if (!bundle?.purchase_details) {
      throw new Error('Purchase contract not found');
    }

    const pd = bundle.purchase_details;
    const now = new Date().toISOString();

    await updateRow('contracts', contractId, {
      purchase_price: patch.offer_price,
      closing_date: patch.closing_date ?? bundle.closing_date,
      earnest_money_amount: patch.emd_amount ?? bundle.earnest_money_amount,
      updated_at: now,
    });

    const detailPatch: PurchaseDetailsUpdate = {
      offer_expiration_date: patch.expiration_date ?? pd.offer_expiration_date,
      offer_expiration_time: patch.expiration_time ?? pd.offer_expiration_time,
      updated_at: now,
    };

    if (patch.personal_property_notes != null && patch.personal_property_notes.trim() !== '') {
      detailPatch.personal_property_description = patch.personal_property_notes;
    }

    if (patch.notes?.trim()) {
      const prev = pd.additional_terms?.trim() ?? '';
      const line = `[Counter-offer] ${patch.notes.trim()}`;
      detailPatch.additional_terms = prev ? `${prev}\n\n${line}` : line;
    }

    await updateRow('purchase_details', pd.id, detailPatch);

    await updateRow('deals', dealId, {
      intended_offer_price: patch.offer_price,
      projected_close_date: patch.closing_date ?? undefined,
      updated_at: now,
    });
  }

  async closeDeal(contractId: string): Promise<CloseDealResult> {
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { error: updateErr } = await supabase
      .from('contracts')
      .update({ deal_status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', contractId)
      .eq('org_id', orgId);
    if (updateErr) throw updateErr;

    const { data: contractRow, error: contractErr } = await supabase
      .from('contracts')
      .select('property_id, purchase_price')
      .eq('id', contractId)
      .eq('org_id', orgId)
      .maybeSingle();
    if (contractErr) throw contractErr;

    if (contractRow?.property_id) {
      const { error: propertyErr } = await supabase
        .from('properties')
        .update({ status: 'Sold', updated_at: new Date().toISOString() })
        .eq('id', contractRow.property_id)
        .eq('org_id', orgId);
      if (propertyErr) throw propertyErr;
    }

    const { error: notifErr } = await (supabase as unknown as {
      from: (table: string) => { insert: (row: Record<string, unknown>) => Promise<{ error: Error | null }> };
    })
      .from('notifications')
      .insert({
      org_id: orgId,
      user_id: userId,
      deal_id: null,
      milestone_id: null,
      alert_type: 'commission_due',
      title: 'Deal Closed — Record Commission',
      body: 'Your purchase agreement has closed. Record the commission for this deal.',
      action_url: '/finance?tab=commission',
      is_read: false,
    });
    if (notifErr) throw notifErr;

    return {
      success: true,
      purchasePrice: contractRow?.purchase_price ?? null,
    };
  }

  async cancelDeal(contractId: string, reason?: string): Promise<{ success: true }> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const payload: Record<string, unknown> = {
      deal_status: 'cancelled',
      updated_at: new Date().toISOString(),
    };
    if (reason?.trim()) {
      payload.notes = `[Cancelled] ${reason.trim()}`;
    }

    const { error: updateErr } = await supabase
      .from('contracts')
      .update(payload)
      .eq('id', contractId)
      .eq('org_id', orgId);
    if (updateErr) throw updateErr;

    const { data: contractRow, error: contractErr } = await supabase
      .from('contracts')
      .select('property_id')
      .eq('id', contractId)
      .eq('org_id', orgId)
      .maybeSingle();
    if (contractErr) throw contractErr;

    if (contractRow?.property_id) {
      const { error: propertyErr } = await supabase
        .from('properties')
        .update({ status: 'Available', updated_at: new Date().toISOString() })
        .eq('id', contractRow.property_id)
        .eq('org_id', orgId);
      if (propertyErr) throw propertyErr;
    }

    return { success: true };
  }

  async regeneratePdf(contractId: string): Promise<{ pdfPath: string }> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const detail = await this.getPurchaseDetails(contractId);
    if (!detail) {
      throw new Error('Purchase details not found');
    }
    const contractRaw = detail.contracts;
    const contract = Array.isArray(contractRaw) ? (contractRaw[0] ?? null) : contractRaw;
    if (!contract) {
      throw new Error('Contract not found for purchase details');
    }

    const form = purchaseAgreementFormValuesFromDb(contract as Contract, detail);
    const roundNumber = await this.getLatestOfferRoundNumber(contractId, orgId);
    const { purchaseAgreementPdfService } = await getServiceProxy();
    const blob = purchaseAgreementPdfService.generateBlob({ form });
    const path = await this.uploadVersionedPurchasePdf(contractId, orgId, blob, roundNumber, 'regenerated');

    const now = new Date().toISOString();
    const { error: contractErr } = await supabase
      .from('contracts')
      .update({ contract_pdf_path: path, pdf_generated_at: now, updated_at: now })
      .eq('id', contractId)
      .eq('org_id', orgId);
    if (contractErr) throw contractErr;

    const { error: detailsErr } = await supabase
      .from('purchase_details')
      .update({ pdf_generated_at: now, updated_at: now })
      .eq('contract_id', contractId)
      .eq('org_id', orgId);
    if (detailsErr) throw detailsErr;

    return { pdfPath: path };
  }

  async getExpiringOffers(days: number): Promise<PurchaseDetailsWithContract[]> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const today = new Date();
    const start = today.toISOString().split('T')[0];
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + Math.max(0, days));
    const end = futureDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('purchase_details')
      .select('*, contracts(*)')
      .eq('org_id', orgId)
      .gte('offer_expiration_date', start)
      .lte('offer_expiration_date', end)
      .eq('wizard_completed', true)
      .order('offer_expiration_date', { ascending: true });

    if (error) throw error;
    return (data as PurchaseDetailsWithContract[] | null) ?? [];
  }

  async uploadFHAAddendum(contractId: string, file: File): Promise<UploadAddendumResult> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const path = `purchases/${orgId}/${contractId}/fha_addendum_${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('contract-pdfs')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const now = new Date().toISOString();
    const { data: updated, error: detailsErr } = await supabase
      .from('purchase_details')
      .update({
        fha_addendum_uploaded: true,
        fha_addendum_path: path,
        updated_at: now,
      })
      .eq('contract_id', contractId)
      .eq('org_id', orgId)
      .select('bank_loan_type')
      .maybeSingle();
    if (detailsErr) throw detailsErr;

    if (updated?.bank_loan_type === 'fha') {
      await supabase
        .from('contracts')
        .update({ wizard_completed: true, updated_at: now })
        .eq('id', contractId)
        .eq('org_id', orgId);
      await supabase
        .from('purchase_details')
        .update({ wizard_completed: true, updated_at: now })
        .eq('contract_id', contractId)
        .eq('org_id', orgId);
    }

    return { path, uploaded: true };
  }

  async uploadVAAddendum(contractId: string, file: File): Promise<UploadAddendumResult> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const path = `purchases/${orgId}/${contractId}/va_addendum_${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('contract-pdfs')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const now = new Date().toISOString();
    const { data: updated, error: detailsErr } = await supabase
      .from('purchase_details')
      .update({
        va_addendum_uploaded: true,
        va_addendum_path: path,
        updated_at: now,
      })
      .eq('contract_id', contractId)
      .eq('org_id', orgId)
      .select('bank_loan_type')
      .maybeSingle();
    if (detailsErr) throw detailsErr;

    if (updated?.bank_loan_type === 'va') {
      await supabase
        .from('contracts')
        .update({ wizard_completed: true, updated_at: now })
        .eq('id', contractId)
        .eq('org_id', orgId);
      await supabase
        .from('purchase_details')
        .update({ wizard_completed: true, updated_at: now })
        .eq('contract_id', contractId)
        .eq('org_id', orgId);
    }

    return { path, uploaded: true };
  }

  /** Regenerates storage PDF from DB-backed wizard fields (e.g. after counter-offer). */
  async regeneratePurchaseAgreementPdf(contractId: string, offerNumber?: number): Promise<void> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const bundle = await this.getPurchaseByContractId(contractId);
    if (!bundle?.purchase_details) {
      throw new Error('Purchase contract not found');
    }

    const form = purchaseAgreementFormValuesFromDb(bundle, bundle.purchase_details);
    const resolvedRound = offerNumber ?? (await this.getLatestOfferRoundNumber(contractId, orgId));
    const { purchaseAgreementPdfService } = await getServiceProxy();
    const pdfBlob = purchaseAgreementPdfService.generateBlob({ form });
    const path = await this.uploadVersionedPurchasePdf(contractId, orgId, pdfBlob, resolvedRound);
    const stamp = new Date().toISOString();
    await updateRow('contracts', contractId, { contract_pdf_path: path, pdf_generated_at: stamp });
    await updateRow('purchase_details', bundle.purchase_details.id, { pdf_generated_at: stamp });
  }

  /**
   * Uploads FHA or VA addendum PDF to contract storage and flags `purchase_details` (Sprint 6B T14).
   */
  async uploadPurchaseAddendum(contractId: string, kind: 'fha' | 'va', file: File): Promise<void> {
    await getAuthenticatedUserId();
    await getActiveOrgId();

    const bundle = await this.getPurchaseByContractId(contractId);
    if (!bundle?.purchase_details) {
      throw new Error('Purchase contract not found');
    }

    const fileExt = file.name.includes('.') ? file.name.split('.').pop() : 'pdf';
    const safeExt = fileExt && fileExt.length <= 8 ? fileExt : 'pdf';
    const fileName = `${contractId}-${kind}-${Date.now()}.${safeExt}`;
    const filePath = `contracts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('contract-pdfs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const now = new Date().toISOString();
    const patch: PurchaseDetailsUpdate =
      kind === 'fha'
        ? { fha_addendum_path: filePath, fha_addendum_uploaded: true, updated_at: now }
        : { va_addendum_path: filePath, va_addendum_uploaded: true, updated_at: now };

    await updateRow('purchase_details', bundle.purchase_details.id, patch);
  }
}

export const purchaseAgreementService = new PurchaseAgreementService();
