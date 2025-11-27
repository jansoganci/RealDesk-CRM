/**
 * useContractEditData Hook
 * Loads contract data for editing and transforms it to form format
 * Handles decryption of TC and IBAN fields
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { decrypt } from '@/services/encryption.service';
import type { ContractFormData } from '../schemas/contractForm.schema';

// ============================================================================
// Types
// ============================================================================

interface ContractEditData {
  contractId: string;
  tenantId: string;
  propertyId: string;
  ownerId: string;
  formData: ContractFormData;
}

interface UseContractEditDataReturn {
  data: ContractEditData | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

// Extended types for database fields not in generated types
interface OwnerWithEncryption {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  tc_encrypted?: string;
  iban_encrypted?: string;
}

interface TenantWithEncryption {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  tc_encrypted?: string;
}

interface PropertyWithComponents {
  id: string;
  address?: string;
  mahalle?: string;
  cadde_sokak?: string;
  bina_no?: string;
  daire_no?: string;
  ilce?: string;
  il?: string;
  type?: string;
  use_purpose?: string;
  owner?: OwnerWithEncryption;
}

interface ContractDetails {
  payment_day_of_month?: number;
  payment_method?: string;
  special_conditions?: string;
}

interface ContractWithRelations {
  id: string;
  tenant_id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  rent_amount?: number;
  deposit?: number;
  tenant?: TenantWithEncryption;
  property?: PropertyWithComponents;
  details?: ContractDetails;
}

// ============================================================================
// Hook
// ============================================================================

export function useContractEditData(contractId: string | undefined): UseContractEditDataReturn {
  const [data, setData] = useState<ContractEditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContractData = useCallback(async () => {
    if (!contractId) {
      setError('Contract ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch contract with all related data
      const { data: rawContract, error: fetchError } = await supabase
        .from('contracts')
        .select(`
          *,
          tenant:tenants(*),
          property:properties(
            *,
            owner:property_owners(*)
          )
        `)
        .eq('id', contractId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to load contract: ${fetchError.message}`);
      }

      if (!rawContract) {
        throw new Error('Contract not found');
      }

      // Cast to our extended type
      const contract = rawContract as unknown as ContractWithRelations;

      if (!contract.tenant) {
        throw new Error('Tenant data not found');
      }

      if (!contract.property) {
        throw new Error('Property data not found');
      }

      const owner = contract.property.owner;
      if (!owner) {
        throw new Error('Owner data not found');
      }

      // Fetch contract details separately (may not exist)
      const { data: details } = await supabase
        .from('contract_details' as any)
        .select('*')
        .eq('contract_id', contractId)
        .maybeSingle();

      const contractDetails = details as ContractDetails | null;

      // Decrypt sensitive fields
      let ownerTC = '';
      let ownerIBAN = '';
      let tenantTC = '';

      try {
        if (owner.tc_encrypted) {
          ownerTC = await decrypt(owner.tc_encrypted);
        }
        if (owner.iban_encrypted) {
          ownerIBAN = await decrypt(owner.iban_encrypted);
        }
        if (contract.tenant.tc_encrypted) {
          tenantTC = await decrypt(contract.tenant.tc_encrypted);
        }
      } catch (decryptError) {
        console.error('Decryption error:', decryptError);
        throw new Error('Failed to decrypt sensitive data');
      }

      // Transform to form data format
      const formData: ContractFormData = {
        // Owner fields
        owner_name: owner.name || '',
        owner_tc: ownerTC,
        owner_iban: ownerIBAN,
        owner_phone: owner.phone || '',
        owner_email: owner.email || '',

        // Tenant fields
        tenant_name: contract.tenant.name || '',
        tenant_tc: tenantTC,
        tenant_phone: contract.tenant.phone || '',
        tenant_email: contract.tenant.email || '',
        tenant_address: contract.tenant.address || '',

        // Property fields
        mahalle: contract.property.mahalle || '',
        cadde_sokak: contract.property.cadde_sokak || '',
        bina_no: contract.property.bina_no || '',
        daire_no: contract.property.daire_no || '',
        ilce: contract.property.ilce || '',
        il: contract.property.il || 'İstanbul',
        property_type: (contract.property.type as 'apartment' | 'house' | 'commercial') || 'apartment',
        use_purpose: contract.property.use_purpose || '',

        // Contract fields
        start_date: new Date(contract.start_date),
        end_date: new Date(contract.end_date),
        rent_amount: contract.rent_amount || 0,
        deposit: contract.deposit || 0,

        // Optional details
        payment_day_of_month: contractDetails?.payment_day_of_month || undefined,
        payment_method: contractDetails?.payment_method || '',
        special_conditions: contractDetails?.special_conditions || '',
      };

      setData({
        contractId: contract.id,
        tenantId: contract.tenant_id,
        propertyId: contract.property_id,
        ownerId: owner.id,
        formData,
      });

    } catch (err) {
      console.error('Load contract error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contract data');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    loadContractData();
  }, [loadContractData]);

  return {
    data,
    loading,
    error,
    reload: loadContractData,
  };
}
