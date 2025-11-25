import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PropertyOwner } from '@/types';
import { ownersService } from '@/lib/serviceProxy';

interface UsePropertyOwnerSelectionReturn {
  owners: PropertyOwner[];
  loadingOwners: boolean;
  loadOwners: () => Promise<void>;
}

/**
 * Hook for managing property owner selection
 * Handles fetching and loading owners for property forms
 */
export function usePropertyOwnerSelection(): UsePropertyOwnerSelectionReturn {
  const { t } = useTranslation(['properties', 'common']);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);

  const loadOwners = useCallback(async () => {
    try {
      setLoadingOwners(true);
      const data = await ownersService.getAll();
      setOwners(data);
    } catch (error) {
      console.error(t('toasts.loadOwnersError'), error);
    } finally {
      setLoadingOwners(false);
    }
  }, [t]);

  return {
    owners,
    loadingOwners,
    loadOwners,
  };
}

