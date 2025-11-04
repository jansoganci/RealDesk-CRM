import { supabase } from '../config/supabase';
import type { Contract, ContractInsert, ContractUpdate, ContractWithDetails } from '../types';
import type {
  RpcCreateContractAndUpdatePropertyParams,
  RpcCreateContractAndUpdatePropertyResult,
  RpcUpdateContractStatusParams,
  RpcUpdateContractStatusResult,
  RpcDeleteContractParams,
  RpcDeleteContractResult,
} from '../types/rpc';
import { callRpc } from '../lib/rpc';
import { insertRow, updateRow } from '../lib/db';
import { getToday, addDaysToDate, formatDateForDb, isDateInRange } from '../lib/dates';

class ContractsService {
  async getAll(): Promise<ContractWithDetails[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        tenant:tenants(*),
        property:properties(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ContractWithDetails[];
  }

  async getById(id: string): Promise<ContractWithDetails | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        tenant:tenants(*),
        property:properties(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as ContractWithDetails | null;
  }

  async getByTenantId(tenantId: string): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Contract[];
  }

  async getByPropertyId(propertyId: string): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Contract[];
  }

  async getActiveContracts(): Promise<ContractWithDetails[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        tenant:tenants(*),
        property:properties(*)
      `)
      .eq('status', 'Active')
      .order('end_date', { ascending: true });

    if (error) throw error;
    return (data || []) as ContractWithDetails[];
  }

  async getExpiringContracts(days: number = 30): Promise<ContractWithDetails[]> {
    const today = getToday();
    const futureDate = addDaysToDate(today, days);

    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        tenant:tenants(*),
        property:properties(*)
      `)
      .eq('status', 'Active')
      .gte('end_date', formatDateForDb(today))
      .lte('end_date', formatDateForDb(futureDate))
      .order('end_date', { ascending: true });

    if (error) throw error;
    return (data || []) as ContractWithDetails[];
  }

  async create(contract: ContractInsert): Promise<Contract> {
    return insertRow('contracts', contract);
  }

  async createWithStatusUpdate(contract: ContractInsert): Promise<Contract> {
    const params: RpcCreateContractAndUpdatePropertyParams = { p_contract: contract };
    const data = await callRpc<RpcCreateContractAndUpdatePropertyParams, RpcCreateContractAndUpdatePropertyResult>(
      'rpc_create_contract_and_update_property',
      params
    );
    return data;
  }

  async update(id: string, contract: ContractUpdate): Promise<Contract> {
    // If status is being updated, use transactional RPC
    if (contract.status) {
      const params: RpcUpdateContractStatusParams = {
        p_contract_id: id,
        p_new_status: contract.status,
      };
      await callRpc<RpcUpdateContractStatusParams, RpcUpdateContractStatusResult>(
        'rpc_update_contract_status',
        params
      );
      
      // If there are other fields to update besides status, update them
      const { status, ...otherFields } = contract;
      if (Object.keys(otherFields).length > 0) {
        return updateRow('contracts', id, otherFields);
      }
      
      // After status update, refetch the contract to get the latest data
      const updatedContract = await this.getById(id);
      if (!updatedContract) {
        throw new Error(`Contract with id ${id} not found after update`);
      }
      return updatedContract;
    }
    
    // For non-status updates, use regular updateRow
    return updateRow('contracts', id, contract);
  }

  async delete(id: string): Promise<void> {
    const params: RpcDeleteContractParams = { p_contract_id: id };
    await callRpc<RpcDeleteContractParams, RpcDeleteContractResult>('rpc_delete_contract', params);
  }

  async uploadContractPdf(file: File, contractId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${contractId}-${Date.now()}.${fileExt}`;
    const filePath = `contracts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('contract-pdfs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    return filePath;
  }

  async uploadContractPdfAndPersist(file: File, contractId: string): Promise<string> {
    const filePath = await this.uploadContractPdf(file, contractId);
    try {
      await updateRow('contracts', contractId, { contract_pdf_path: filePath });
      return filePath;
    } catch (err) {
      try {
        await this.deleteContractPdf(filePath);
      } catch (cleanupErr) {
        console.warn('Failed to cleanup uploaded PDF after DB update error:', cleanupErr);
      }
      throw err;
    }
  }

  async deleteContractPdf(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('contract-pdfs')
      .remove([filePath]);

    if (error) throw error;
  }

  async getContractPdfUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('contract-pdfs')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async getStats() {
    const { data, error } = await supabase
      .from('contracts')
      .select('status, end_date');

    if (error) throw error;

    const contracts = (data || []) as Array<{ status: string; end_date: string }>;
    const todayStats = getToday();
    const thirtyDaysFromNow = addDaysToDate(todayStats, 30);

    const stats = {
      total: contracts.length || 0,
      active: contracts.filter(c => c.status === 'Active').length || 0,
      archived: contracts.filter(c => c.status === 'Archived').length || 0,
      inactive: contracts.filter(c => c.status === 'Inactive').length || 0,
      expiringSoon: contracts.filter(c => {
        if (c.status !== 'Active') return false;
        return isDateInRange(new Date(c.end_date), todayStats, thirtyDaysFromNow);
      }).length || 0,
    };

    return stats;
  }
}

export const contractsService = new ContractsService();
