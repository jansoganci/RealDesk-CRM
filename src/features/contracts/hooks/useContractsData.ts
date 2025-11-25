import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { contractsService } from '../../../lib/serviceProxy';
import type { ContractWithDetails } from '../../../types';

/**
 * Contracts Data Fetching Hook
 * Handles loading contracts data, managing loading state, and providing refresh functionality
 */

interface UseContractsDataReturn {
  contracts: ContractWithDetails[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

/**
 * Hook for fetching and managing contracts data
 * Handles data loading, error handling, and provides refresh functionality
 */
export function useContractsData(): UseContractsDataReturn {
  const { t } = useTranslation('contracts');
  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await contractsService.getAll();
      setContracts(data);
    } catch (error) {
      toast.error(t('errors.loadFailed'));
      console.error(error);
      setContracts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load contracts on mount
  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  return {
    contracts,
    loading,
    refreshData: loadContracts,
  };
}

