/**
 * useContractEditData Hook
 * Loads contract data for editing and transforms it to form format
 * Loads decrypted US Tax ID and bank fields through the authenticated Edge Function.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { decryptSensitiveFields } from '@/lib/serviceProxy';
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

interface ContractOwner {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface ContractTenant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface PropertyWithComponents {
  id: string;
  address?: string;
  // Turkish format (legacy)
  mahalle?: string;
  cadde_sokak?: string;
  bina_no?: string;
  daire_no?: string;
  district_legacy?: string;
  il?: string;
  // US format (new)
  street_address?: string;
  unit?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  // Common
  type?: string;
  use_purpose?: string;
  owner?: ContractOwner;
}

interface ContractDetails {
  payment_day_of_month?: number;
  payment_method?: string;
  special_conditions?: string;
  deposit_currency?: 'USD' | 'EUR' | 'TRY';
  handover_photos_url?: string;
  is_painted?: boolean;
}

interface ContractWithRelations {
  id: string;
  tenant_id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  rent_amount?: number;
  deposit?: number;
  commission_amount?: number | null; // Manual commission amount (null = use rent_amount)
  tenant?: ContractTenant;
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
          tenant:tenants(id, name, phone, email, address),
          property:properties(
            *,
            owner:property_owners(id, name, phone, email)
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
        .from('contract_details')
        .select('*')
        .eq('contract_id', contractId)
        .maybeSingle();

      const contractDetails = details as ContractDetails | null;

      try {
        const [ownerSensitive, tenantSensitive] = await Promise.all([
          decryptSensitiveFields(
            'property_owner',
            owner.id,
            ['tax_id', 'routing_number', 'account_number'],
          ),
          decryptSensitiveFields('tenant', contract.tenant.id, ['tax_id']),
        ]);

        // Transform to form data format (US Format)
        const formData: ContractFormData = {
          // Owner fields
          owner_name: owner.name || '',
          owner_tax_id: ownerSensitive.tax_id ?? '',
          owner_routing_number: ownerSensitive.routing_number ?? '',
          owner_account_number: ownerSensitive.account_number ?? '',
          owner_phone: owner.phone || '',
          owner_email: owner.email || '',

          // Tenant fields
          tenant_name: contract.tenant.name || '',
          tenant_tax_id: tenantSensitive.tax_id ?? '',
          tenant_phone: contract.tenant.phone || '',
          tenant_email: contract.tenant.email || '',
          tenant_address: contract.tenant.address || '',

          // Property fields (US Format - fallback to Turkish if US fields not yet migrated)
          street_address: contract.property.street_address || contract.property.cadde_sokak || '',
          unit: contract.property.unit || contract.property.daire_no || '',
          city: contract.property.city || contract.property.district_legacy || '',
          state: contract.property.state || contract.property.il || 'TX',
          zip_code: contract.property.zip_code || '',
          property_type: (contract.property.type as 'apartment' | 'house' | 'commercial') || 'apartment',
          use_purpose: contract.property.use_purpose || '',

          // Contract fields
          start_date: new Date(contract.start_date),
          end_date: new Date(contract.end_date),
          rent_amount: contract.rent_amount || 0,
          deposit: contract.deposit || 0,
          currency: (contractDetails?.deposit_currency as 'USD' | 'EUR' | 'TRY') || 'USD',
          commission_amount: contract.commission_amount && contract.commission_amount > 0
            ? contract.commission_amount
            : undefined,

          // Optional details
          payment_day_of_month: contractDetails?.payment_day_of_month || undefined,
          payment_method: contractDetails?.payment_method || '',
          special_conditions: contractDetails?.special_conditions || '',
          is_painted: contractDetails?.is_painted ?? false,
          handover_photos_url: contractDetails?.handover_photos_url || '',
        };

        setData({
          contractId: contract.id,
          tenantId: contract.tenant_id,
          propertyId: contract.property_id,
          ownerId: owner.id,
          formData,
        });
      } catch (decryptError) {
        console.error('Sensitive data loading error:', decryptError);
        throw new Error('Failed to decrypt sensitive data');
      }

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
