import { useState, useEffect, useCallback } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { contractsService } from '../../../lib/serviceProxy';
import type { TenantWithProperty, Contract, ContractStatus } from '../../../types';
import type { TenantEditFormData } from '../schemas/tenantEditSchema';

/**
 * Tenant Edit Data Loading Hook
 * Handles loading tenant and contract data, finding primary contract, and populating form
 */

interface UseTenantEditDataOptions {
  open: boolean;
  tenant: TenantWithProperty;
  setValue: UseFormSetValue<TenantEditFormData>;
}

interface UseTenantEditDataReturn {
  loading: boolean;
  primaryContract: Contract | null;
  loadData: () => Promise<void>;
}

/**
 * Hook for loading tenant and contract data for editing
 * Handles data fetching, primary contract finding, and form population
 */
export function useTenantEditData({
  open,
  tenant,
  setValue,
}: UseTenantEditDataOptions): UseTenantEditDataReturn {
  const { t } = useTranslation('tenants');
  const [loading, setLoading] = useState(false);
  const [primaryContract, setPrimaryContract] = useState<Contract | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load tenant's contracts
      const contracts = await contractsService.getByTenantId(tenant.id);
      
      // Find primary contract (most recent active, or most recent if no active)
      let primary = contracts.find(c => c.status === 'Active');
      if (!primary && contracts.length > 0) {
        primary = contracts[0]; // Most recent contract
      }
      
      setPrimaryContract(primary || null);
      
      // Populate form with tenant data
      setValue('tenant.name', tenant.name || '');
      setValue('tenant.email', tenant.email || '');
      setValue('tenant.phone', tenant.phone || '');
      setValue('tenant.notes', tenant.notes || '');
      
      // Populate form with contract data if exists
      if (primary) {
        setValue('contract.property_id', primary.property_id || '');
        setValue('contract.start_date', primary.start_date || '');
        setValue('contract.end_date', primary.end_date || '');
        setValue('contract.rent_amount', primary.rent_amount);
        setValue('contract.status', (primary.status as ContractStatus) || 'Active');
        setValue('contract.rent_increase_reminder_enabled', primary.rent_increase_reminder_enabled || false);
        setValue('contract.rent_increase_reminder_days', primary.rent_increase_reminder_days || 90);
        setValue('contract.expected_new_rent', primary.expected_new_rent);
        setValue('contract.reminder_notes', primary.reminder_notes || '');
      } else {
        // No contract exists - set default values for new contract
        setValue('contract.property_id', tenant.property?.id || '');
        setValue('contract.start_date', '');
        setValue('contract.end_date', '');
        setValue('contract.rent_amount', null);
        setValue('contract.status', 'Active');
        setValue('contract.rent_increase_reminder_enabled', false);
        setValue('contract.rent_increase_reminder_days', 90);
        setValue('contract.expected_new_rent', null);
        setValue('contract.reminder_notes', '');
      }
      
    } catch (error) {
      console.error('Failed to load tenant and contract data:', error);
      toast.error(t('edit.loadDataFailed'));
    } finally {
      setLoading(false);
    }
  }, [tenant, setValue, t]);

  // Load data when dialog opens
  useEffect(() => {
    if (open && tenant) {
      loadData();
    }
  }, [open, tenant, loadData]);

  return {
    loading,
    primaryContract,
    loadData,
  };
}

