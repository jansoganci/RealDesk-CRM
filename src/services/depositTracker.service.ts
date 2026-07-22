import { supabase } from '@/config/supabase';
import { getAuthenticatedUserId } from '@/lib/auth';
import { getActiveOrgId } from '@/lib/orgHelpers';
import { handleServiceError } from '@/lib/handleServiceError';

export type DepositStatus = 'held' | 'partially_returned' | 'fully_returned' | 'disputed';
export type HeldBy = 'landlord' | 'escrow' | 'government_agency' | 'other';
export type DeductionCategory = 'damage' | 'cleaning' | 'unpaid_rent' | 'late_fees' | 'other';

export interface SecurityDeposit {
  id: string;
  org_id: string;
  property_id: string | null;
  tenant_id: string | null;
  contract_id: string | null;
  created_by: string;
  deposit_amount: number;
  held_by: HeldBy;
  held_by_other_description: string | null;
  return_deadline: string;
  return_date: string | null;
  status: DepositStatus;
  interest_required: boolean;
  interest_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DepositDeduction {
  id: string;
  deposit_id: string;
  description: string;
  amount: number;
  category: DeductionCategory | null;
  created_at: string;
}

export interface SecurityDepositWithDeductions extends SecurityDeposit {
  deductions: DepositDeduction[];
}

export interface CreateDepositInput {
  property_id?: string | null;
  tenant_id?: string | null;
  contract_id?: string | null;
  deposit_amount: number;
  held_by: HeldBy;
  held_by_other_description?: string | null;
  return_deadline: string;
  return_date?: string | null;
  status?: DepositStatus;
  interest_required?: boolean;
  interest_amount?: number | null;
  notes?: string | null;
}

export type UpdateDepositInput = Partial<CreateDepositInput> & {
  status?: DepositStatus;
};

export interface CreateDeductionInput {
  description: string;
  amount: number;
  category?: DeductionCategory | null;
}

class DepositTrackerService {
  async getAll(): Promise<SecurityDeposit[]> {
    try {
      const orgId = await getActiveOrgId();
      const { data, error } = await supabase
        .from('security_deposit_tracker')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('return_deadline', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SecurityDeposit[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch deposits');
    }
  }

  async getById(id: string): Promise<SecurityDepositWithDeductions | null> {
    try {
      const orgId = await getActiveOrgId();
      const { data, error } = await supabase
        .from('security_deposit_tracker')
        .select('*')
        .eq('id', id)
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const deductions = await this.getDeductions(id);
      return { ...(data as unknown as SecurityDeposit), deductions };
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch deposit');
    }
  }

  async create(input: CreateDepositInput): Promise<SecurityDeposit> {
    try {
      const [orgId, userId] = await Promise.all([
        getActiveOrgId(),
        getAuthenticatedUserId(),
      ]);
      const { data, error } = await supabase
        .from('security_deposit_tracker')
        .insert({
          ...input,
          org_id: orgId,
          created_by: userId,
          status: input.status ?? 'held',
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SecurityDeposit;
    } catch (error) {
      throw handleServiceError(error, 'Failed to create deposit');
    }
  }

  async update(id: string, input: UpdateDepositInput): Promise<SecurityDeposit> {
    try {
      const orgId = await getActiveOrgId();
      const { data, error } = await supabase
        .from('security_deposit_tracker')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SecurityDeposit;
    } catch (error) {
      throw handleServiceError(error, 'Failed to update deposit');
    }
  }

  async updateStatus(id: string, status: DepositStatus): Promise<SecurityDeposit> {
    return this.update(id, { status });
  }

  async softDelete(id: string): Promise<void> {
    try {
      const orgId = await getActiveOrgId();
      const { error } = await supabase
        .from('security_deposit_tracker')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('org_id', orgId);
      if (error) throw error;
    } catch (error) {
      throw handleServiceError(error, 'Failed to delete deposit');
    }
  }

  async getActive(): Promise<SecurityDeposit[]> {
    try {
      const orgId = await getActiveOrgId();
      const { data, error } = await supabase
        .from('security_deposit_tracker')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'held')
        .is('deleted_at', null)
        .order('return_deadline', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SecurityDeposit[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch active deposits');
    }
  }

  async getPendingReturns(): Promise<SecurityDeposit[]> {
    try {
      const orgId = await getActiveOrgId();
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('security_deposit_tracker')
        .select('*')
        .eq('org_id', orgId)
        .in('status', ['held', 'partially_returned'])
        .lt('return_deadline', today)
        .is('deleted_at', null)
        .order('return_deadline', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SecurityDeposit[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch pending returns');
    }
  }

  async getDeductions(depositId: string): Promise<DepositDeduction[]> {
    try {
      const { data, error } = await supabase
        .from('deposit_deductions')
        .select('*')
        .eq('deposit_id', depositId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as DepositDeduction[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch deductions');
    }
  }

  async addDeduction(depositId: string, input: CreateDeductionInput): Promise<DepositDeduction> {
    try {
      const { data, error } = await supabase
        .from('deposit_deductions')
        .insert({ ...input, deposit_id: depositId })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as DepositDeduction;
    } catch (error) {
      throw handleServiceError(error, 'Failed to add deduction');
    }
  }

  async removeDeduction(deductionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('deposit_deductions')
        .delete()
        .eq('id', deductionId);
      if (error) throw error;
    } catch (error) {
      throw handleServiceError(error, 'Failed to remove deduction');
    }
  }
}

export const depositTrackerService = new DepositTrackerService();
