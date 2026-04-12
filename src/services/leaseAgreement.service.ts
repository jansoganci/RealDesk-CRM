import { supabase } from '@/config/supabase';
import { addDays } from 'date-fns';
import type { LeaseAgreementFormValues } from '@/features/contracts/schemas/leaseAgreementForm.schema';
import { getLeaseAgreementFormDefaults } from '@/features/contracts/leaseWizard/leaseAgreementFormDefaults';
import { getAuthenticatedUserId } from '@/lib/auth';
import { insertRow, updateRow } from '@/lib/db';
import { getActiveOrgId } from '@/lib/orgHelpers';
import { callRpc } from '@/lib/rpc';
import { contractsService } from '@/services/contracts.service';
import { leaseAgreementPdfService } from '@/services/leaseAgreementPdf.service';
import type { Json } from '@/types/database.types';
import type {
  RpcCreateLeaseContractParams,
  RpcCreateLeaseContractResult,
} from '@/types/rpc';
import type { Contract, LeaseAmendment, LeaseAmendmentInsert, LeaseDetails } from '@/types';

/** Keys stored on `contracts` or linking only — excluded from `lease_details` JSON. */
const CONTRACT_AND_LINK_KEYS = new Set([
  'lease_type',
  'after_term_action',
  'termination_notice_days',
  'start_date',
  'end_date',
  'rent_amount',
  'deposit',
  'linkedPropertyId',
  'linkedTenant1Id',
  'linkedTenant2Id',
  'linkedLandlordOwnerId',
]);

function leaseDetailsJsonFromForm(form: LeaseAgreementFormValues): Json {
  const o: Record<string, unknown> = {};
  for (const key of Object.keys(form) as (keyof LeaseAgreementFormValues)[]) {
    if (CONTRACT_AND_LINK_KEYS.has(key as string)) continue;
    const v = form[key];
    o[key as string] = v === undefined ? null : v;
  }
  return o as Json;
}

function contractJsonFromForm(
  form: LeaseAgreementFormValues,
  tenantId: string,
  propertyId: string,
  landlordId: string | null,
): Json {
  return {
    tenant_id: tenantId,
    property_id: propertyId,
    start_date: form.start_date,
    end_date: form.end_date,
    rent_amount: form.rent_amount,
    deposit: form.deposit,
    currency: 'USD',
    status: 'Active',
    lease_type: form.lease_type,
    contract_type: 'lease',
    after_term_action: form.after_term_action,
    termination_notice_days: form.termination_notice_days,
    landlord_id: landlordId,
    prior_contract_id: null,
    wizard_completed: true,
    rent_increase_reminder_enabled: true,
    rent_increase_reminder_days: 30,
    rent_increase_reminder_contacted: false,
  };
}

export interface CreateLeaseAgreementInput {
  form: LeaseAgreementFormValues;
  tenantId: string;
  propertyId: string;
  landlordId: string | null;
}

export type LeaseDetailsPatch = Partial<
  Omit<LeaseDetails, 'id' | 'contract_id' | 'org_id' | 'user_id' | 'created_at' | 'updated_at'>
>;

export type LeaseContractWithDetails = Contract & {
  lease_details: LeaseDetails | null;
};

export interface RegenerateLeasePdfResult {
  contractId: string;
  filePath: string;
  generatedAtIso: string;
}

class LeaseAgreementService {
  /**
   * Atomically inserts `contracts` + `lease_details` via RPC (org owner only; property + tenant org-checked server-side).
   */
  async createLeaseContract(input: CreateLeaseAgreementInput): Promise<string> {
    await getAuthenticatedUserId();
    await getActiveOrgId();

    const params: RpcCreateLeaseContractParams = {
      p_contract: contractJsonFromForm(
        input.form,
        input.tenantId,
        input.propertyId,
        input.landlordId,
      ),
      p_lease_details: leaseDetailsJsonFromForm(input.form),
    };

    return callRpc<RpcCreateLeaseContractParams, RpcCreateLeaseContractResult>(
      'rpc_create_lease_contract',
      params,
    );
  }

  /** Sprint 6B alias: same behavior as `createLeaseContract`. */
  async createLeaseWithDetails(input: CreateLeaseAgreementInput): Promise<string> {
    await getAuthenticatedUserId();
    await getActiveOrgId();
    return this.createLeaseContract(input);
  }

  async getLeaseDetailsByContractId(contractId: string): Promise<LeaseDetails | null> {
    await getAuthenticatedUserId();
    await getActiveOrgId();

    const { data, error } = await supabase
      .from('lease_details')
      .select('*')
      .eq('contract_id', contractId)
      .maybeSingle();

    if (error) throw error;
    return data as LeaseDetails | null;
  }

  /** Sprint 6B alias: same behavior as `getLeaseDetailsByContractId`. */
  async getLeaseDetails(contractId: string): Promise<LeaseDetails | null> {
    await getAuthenticatedUserId();
    await getActiveOrgId();
    return this.getLeaseDetailsByContractId(contractId);
  }

  async updateLeaseDetails(contractId: string, patch: LeaseDetailsPatch): Promise<LeaseDetails> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data: row, error } = await supabase
      .from('lease_details')
      .select('id, org_id')
      .eq('contract_id', contractId)
      .eq('org_id', orgId)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error('Lease details not found');

    const updated = await updateRow('lease_details', row.id, patch);
    return updated as LeaseDetails;
  }

  async getLeasesByProperty(propertyId: string): Promise<LeaseContractWithDetails[]> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('contracts')
      .select('*, lease_details(*)')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .eq('property_id', propertyId)
      .eq('contract_type', 'lease')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as LeaseContractWithDetails[];
  }

  async getActiveLeases(): Promise<LeaseContractWithDetails[]> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('contracts')
      .select('*, lease_details(*)')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .eq('status', 'Active')
      .eq('contract_type', 'lease')
      .order('end_date', { ascending: true });
    if (error) throw error;
    return (data || []) as LeaseContractWithDetails[];
  }

  async getExpiringSoon(days: number): Promise<LeaseContractWithDetails[]> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const now = new Date();
    const future = addDays(now, Math.max(0, days || 0));
    const toDate = future.toISOString().slice(0, 10);
    const fromDate = now.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('contracts')
      .select('*, lease_details(*)')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .eq('status', 'Active')
      .eq('contract_type', 'lease')
      .gte('end_date', fromDate)
      .lte('end_date', toDate)
      .order('end_date', { ascending: true });
    if (error) throw error;
    return (data || []) as LeaseContractWithDetails[];
  }

  async listLeaseAmendmentsByContractId(contractId: string): Promise<LeaseAmendment[]> {
    await getAuthenticatedUserId();
    await getActiveOrgId();

    const { data, error } = await supabase
      .from('lease_amendments')
      .select('*')
      .eq('contract_id', contractId)
      .order('amendment_date', { ascending: false });

    if (error) throw error;
    return (data || []) as LeaseAmendment[];
  }

  /** Sprint 6B alias: same behavior as `listLeaseAmendmentsByContractId`. */
  async getAmendments(contractId: string): Promise<LeaseAmendment[]> {
    await getAuthenticatedUserId();
    await getActiveOrgId();
    return this.listLeaseAmendmentsByContractId(contractId);
  }

  async createLeaseAmendment(
    contractId: string,
    payload: Pick<LeaseAmendmentInsert, 'amendment_date' | 'description'>,
  ): Promise<LeaseAmendment> {
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data: row, error: contractError } = await supabase
      .from('contracts')
      .select('id')
      .eq('id', contractId)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .maybeSingle();

    if (contractError) throw contractError;
    if (!row) {
      throw new Error('Contract not found');
    }

    return insertRow('lease_amendments', {
      contract_id: contractId,
      org_id: orgId,
      user_id: userId,
      amendment_date: payload.amendment_date,
      description: payload.description,
    });
  }

  /** Sprint 6B alias: same behavior as `createLeaseAmendment`. */
  async addAmendment(
    contractId: string,
    payload: Pick<LeaseAmendmentInsert, 'amendment_date' | 'description'>,
  ): Promise<LeaseAmendment> {
    await getAuthenticatedUserId();
    await getActiveOrgId();
    return this.createLeaseAmendment(contractId, payload);
  }

  async regeneratePdf(contractId: string): Promise<RegenerateLeasePdfResult> {
    await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .maybeSingle();
    if (contractError) throw contractError;
    if (!contract) throw new Error('Contract not found');

    const { data: details, error: detailsError } = await supabase
      .from('lease_details')
      .select('*')
      .eq('contract_id', contractId)
      .eq('org_id', orgId)
      .maybeSingle();
    if (detailsError) throw detailsError;
    if (!details) throw new Error('Lease details not found');

    const defaults = getLeaseAgreementFormDefaults();
    const form = {
      ...defaults,
      ...details,
      linkedPropertyId: contract.property_id,
      linkedTenant1Id: contract.tenant_id,
      linkedTenant2Id: null,
      linkedLandlordOwnerId: contract.landlord_id,
      lease_type: (contract.lease_type as LeaseAgreementFormValues['lease_type']) ?? 'standard',
      after_term_action:
        (contract.after_term_action as LeaseAgreementFormValues['after_term_action']) ?? null,
      termination_notice_days: contract.termination_notice_days,
      start_date: contract.start_date ?? defaults.start_date,
      end_date: contract.end_date ?? defaults.end_date,
      rent_amount: contract.rent_amount ?? defaults.rent_amount,
      deposit: contract.deposit,
      // Keep optional email/phone fields compatible with form schema string unions.
      landlord_email: details.landlord_email ?? '',
      tenant_email: details.tenant_email ?? '',
      tenant_email_2: details.tenant_email_2 ?? '',
      co_signer_email: details.co_signer_email ?? '',
      landlord_phone: details.landlord_phone ?? '',
      tenant_phone: details.tenant_phone ?? '',
      tenant_phone_2: details.tenant_phone_2 ?? '',
      co_signer_phone: details.co_signer_phone ?? '',
      paypal_email: details.paypal_email ?? '',
    } as LeaseAgreementFormValues;

    const blob = leaseAgreementPdfService.generateBlob({ form });
    const file = new File([blob], `Lease_Agreement_${contractId.slice(0, 8)}.pdf`, {
      type: 'application/pdf',
    });
    const filePath = await contractsService.uploadContractPdfAndPersist(file, contractId);
    const generatedAtIso = new Date().toISOString();
    await updateRow('contracts', contractId, { pdf_generated_at: generatedAtIso });

    return { contractId, filePath, generatedAtIso };
  }
}

export const leaseAgreementService = new LeaseAgreementService();
