import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { tenantsService } from '../../../lib/serviceProxy';
import type { TenantWithProperty, TenantWithContractResult } from '../../../types';

/**
 * Tenant Actions Hook
 * Handles all tenant-related actions (delete, submit, schedule meeting)
 */

interface UseTenantActionsOptions {
  refreshData: () => Promise<void>;
  onCloseCreate?: () => void;
  onCloseEdit?: () => void;
  onCloseDelete?: () => void;
}

interface UseTenantActionsReturn {
  handleDeleteConfirm: (tenant: TenantWithProperty) => Promise<void>;
  handleEnhancedSubmit: (result: TenantWithContractResult) => Promise<void>;
  handleEnhancedEditSuccess: () => Promise<void>;
  handleScheduleMeeting: (tenant: TenantWithProperty) => void;
  isLoading: boolean;
}

export function useTenantActions({
  refreshData,
  onCloseCreate,
  onCloseEdit,
  onCloseDelete,
}: UseTenantActionsOptions): UseTenantActionsReturn {
  const { t } = useTranslation('tenants');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteConfirm = useCallback(
    async (tenant: TenantWithProperty) => {
      try {
        setIsLoading(true);
        await tenantsService.delete(tenant.id);
        toast.success(t('toasts.deleteSuccess'));
        await refreshData();
        onCloseDelete?.();
      } catch (error) {
        console.error('Failed to delete tenant:', error);
        toast.error(t('toasts.deleteError'));
      } finally {
        setIsLoading(false);
      }
    },
    [refreshData, onCloseDelete, t]
  );

  const handleEnhancedSubmit = useCallback(
    async (result: TenantWithContractResult) => {
      await refreshData();
      onCloseCreate?.();
    },
    [refreshData, onCloseCreate]
  );

  const handleEnhancedEditSuccess = useCallback(async () => {
    await refreshData();
    onCloseEdit?.();
  }, [refreshData, onCloseEdit]);

  const handleScheduleMeeting = useCallback(
    (tenant: TenantWithProperty) => {
      navigate(`/calendar?open_add_meeting=true&tenant_id=${tenant.id}`);
    },
    [navigate]
  );

  return {
    handleDeleteConfirm,
    handleEnhancedSubmit,
    handleEnhancedEditSuccess,
    handleScheduleMeeting,
    isLoading,
  };
}

