import { supabase } from '../config/supabase';
import type {
  Tenant,
  TenantInsert,
  TenantUpdate,
  TenantWithProperty,
  Contract,
  TenantWithContractData,
  TenantWithContractResult
} from '../types';
import { insertRow, updateRow } from '../lib/db';
import type {
  RpcCreateTenantWithContractParams,
  RpcCreateTenantWithContractResult,
  RpcRollbackTenantWithContractParams,
} from '../types/rpc';
import { callRpc } from '../lib/rpc';
import {
  AppError,
  ERROR_TENANT_NAME_REQUIRED,
  ERROR_TENANT_PROPERTY_REQUIRED,
  ERROR_TENANT_INVALID_EMAIL,
  ERROR_TENANT_INVALID_RESPONSE,
  ERROR_TENANT_PDF_UPLOAD_FAILED,
  ERROR_TENANT_NOT_FOUND,
  ERROR_CONTRACT_START_DATE_REQUIRED,
  ERROR_CONTRACT_END_DATE_REQUIRED,
  ERROR_CONTRACT_END_BEFORE_START,
  ERROR_CONTRACT_NOT_FOUND,
  ERROR_TENANT_CONTRACT_CREATION_FAILED,
} from '../lib/errorCodes';

class TenantsService {
  async getAll(): Promise<TenantWithProperty[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        property:properties(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as TenantWithProperty[];
  }

  async getById(id: string): Promise<TenantWithProperty | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        property:properties(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as TenantWithProperty | null;
  }

  async getByPropertyId(propertyId: string): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Tenant[];
  }

  async getUnassigned(): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .is('property_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Tenant[];
  }

  async create(tenant: TenantInsert): Promise<Tenant> {
    return insertRow('tenants', tenant);
  }

  async update(id: string, tenant: TenantUpdate): Promise<Tenant> {
    return updateRow('tenants', id, tenant);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async assignToProperty(tenantId: string, propertyId: string | null): Promise<Tenant> {
    return this.update(tenantId, { property_id: propertyId });
  }

  async getStats() {
    const { data, error } = await supabase
      .from('tenants')
      .select('property_id');

    if (error) throw error;

    const tenants = (data || []) as Array<{ property_id: string | null }>;

    const stats = {
      total: tenants.length || 0,
      assigned: tenants.filter(t => t.property_id !== null).length || 0,
      unassigned: tenants.filter(t => t.property_id === null).length || 0,
    };

    return stats;
  }

  /**
   * Validates tenant and contract data before processing
   * @private
   */
  private validateTenantWithContractData(data: TenantWithContractData): void {
    const { tenant, contract } = data;

    if (!tenant.name || tenant.name.trim() === '') {
      throw new AppError(ERROR_TENANT_NAME_REQUIRED);
    }

    if (!contract.property_id) {
      throw new AppError(ERROR_TENANT_PROPERTY_REQUIRED);
    }

    if (!contract.start_date) {
      throw new AppError(ERROR_CONTRACT_START_DATE_REQUIRED);
    }

    if (!contract.end_date) {
      throw new AppError(ERROR_CONTRACT_END_DATE_REQUIRED);
    }

    // Validate end date is after start date
    const startDate = new Date(contract.start_date);
    const endDate = new Date(contract.end_date);

    if (endDate <= startDate) {
      throw new AppError(ERROR_CONTRACT_END_BEFORE_START);
    }

    // Validate email format if provided
    if (tenant.email && tenant.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(tenant.email)) {
        throw new AppError(ERROR_TENANT_INVALID_EMAIL);
      }
    }
  }

  /**
   * Creates a tenant with an associated contract in a single atomic transaction.
   * This method ensures data consistency by rolling back all changes if any step fails.
   * 
   * @param data - Combined tenant and contract data with optional PDF file
   * @returns Promise containing the created tenant and contract
   * @throws Error if any step in the transaction fails
   */
  async createTenantWithContract(data: TenantWithContractData): Promise<TenantWithContractResult> {
    const { tenant: tenantData, contract: contractData, pdfFile } = data;

    // Validate input data first
    this.validateTenantWithContractData(data);

    try {
      // Use Supabase RPC for atomic transaction
      const rpcArgs: RpcCreateTenantWithContractParams = {
        p_tenant: tenantData,
        p_contract: contractData,
      };
      const result = await callRpc<RpcCreateTenantWithContractParams, RpcCreateTenantWithContractResult>(
        'rpc_create_tenant_with_contract',
        rpcArgs
      );


      const resTyped = result as RpcCreateTenantWithContractResult;
      if (!resTyped.tenant_id || !resTyped.contract_id) {
        throw new AppError(ERROR_TENANT_INVALID_RESPONSE);
      }

      // If PDF file is provided, upload it and persist the path
      if (pdfFile) {
        try {
          const { contractsService } = await import('./contracts.service');
          await contractsService.uploadContractPdfAndPersist(pdfFile, resTyped.contract_id);
        } catch (uploadErr) {
          console.error('PDF upload failed after tenant/contract creation:', uploadErr);
          
          // Rollback the tenant and contract creation
          try {
            const rbArgs: RpcRollbackTenantWithContractParams = {
              p_tenant_id: resTyped.tenant_id,
              p_contract_id: resTyped.contract_id,
            };
            await callRpc<RpcRollbackTenantWithContractParams, void>('rpc_rollback_tenant_with_contract', rbArgs);
            } catch (rollbackErr) {
            console.error('Failed to rollback after PDF upload error:', rollbackErr);
          }

          throw new AppError(ERROR_TENANT_PDF_UPLOAD_FAILED);
        }
      }

      // Fetch the created records with full details
      const [tenantResult, { data: contractRow, error: contractErr }] = await Promise.all([
        this.getById(resTyped.tenant_id),
        supabase
          .from('contracts')
          .select('*')
          .eq('id', resTyped.contract_id)
          .single()
      ]);

      if (!tenantResult) {
        throw new AppError(ERROR_TENANT_NOT_FOUND);
      }

      if (contractErr || !contractRow) {
        throw new AppError(ERROR_CONTRACT_NOT_FOUND);
      }

      return {
        tenant: tenantResult as Tenant,
        contract: contractRow as Contract,
      };

    } catch (error) {
      console.error('[Tenant creation failed]', error);
      
      // Preserve error structure for UI handling
      if (error instanceof AppError) {
        throw error;
      }

      if (error && typeof error === 'object') {
        const supabaseError = error as { code?: string; message?: string };
        const structuredError = new AppError(ERROR_TENANT_CONTRACT_CREATION_FAILED, supabaseError.message);
        (structuredError as any).originalCode = supabaseError.code;
        throw structuredError;
      }

      // Re-throw with more context for non-structured errors
      if (error instanceof Error) {
        throw error;
      } else {
        throw new AppError(ERROR_TENANT_CONTRACT_CREATION_FAILED);
      }
    }
  }
}

export const tenantsService = new TenantsService();
