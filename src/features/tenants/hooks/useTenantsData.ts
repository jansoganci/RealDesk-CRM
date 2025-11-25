import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { tenantsService } from '../../../lib/serviceProxy';
import type { TenantWithProperty } from '../../../types';

/**
 * Tenants Data Fetching Hook
 * Handles loading tenants data, managing loading state, and providing refresh functionality.
 */

interface UseTenantsDataReturn {
  tenants: TenantWithProperty[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

export function useTenantsData(): UseTenantsDataReturn {
  const { t } = useTranslation('tenants');
  const [tenants, setTenants] = useState<TenantWithProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tenantsService.getAll();
      setTenants(data);
    } catch (error) {
      console.error('Failed to load tenants:', error);
      toast.error(t('toasts.loadError'));
      setTenants([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load tenants on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    tenants,
    loading,
    refreshData,
  };
}

