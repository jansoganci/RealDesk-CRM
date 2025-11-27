import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { contractsService } from '../../../lib/serviceProxy';
import type { ContractWithDetails } from '../../../types';

/**
 * Contracts Actions Hook
 * Handles contract actions: add, edit, delete with confirmation dialog
 */

interface UseContractsActionsOptions {
  refreshData: () => Promise<void>;
}

interface UseContractsActionsReturn {
  deleteDialogOpen: boolean;
  contractToDelete: ContractWithDetails | null;
  actionLoading: boolean;
  handleDeleteClick: (contract: ContractWithDetails) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;
  handleAddContract: () => void;
  handleEditContract: (contract: ContractWithDetails) => void;
}

/**
 * Hook for managing contract actions
 * Handles delete confirmation dialog, delete action with PDF cleanup, and navigation
 */
export function useContractsActions({
  refreshData,
}: UseContractsActionsOptions): UseContractsActionsReturn {
  const { t } = useTranslation('contracts');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<ContractWithDetails | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleDeleteClick = useCallback((contract: ContractWithDetails) => {
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!contractToDelete) return;

    try {
      setActionLoading(true);

      // Delete PDF if exists
      if (contractToDelete.contract_pdf_path) {
        try {
          await contractsService.deleteContractPdf(contractToDelete.contract_pdf_path);
        } catch (error) {
          console.warn('Failed to delete PDF:', error);
          // Continue with contract deletion even if PDF deletion fails
        }
      }

      // Delete contract
      await contractsService.delete(contractToDelete.id);
      toast.success(t('toasts.deleted'));
      
      // Refresh data
      await refreshData();
      
      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    } catch (error) {
      toast.error(t('errors.deleteFailed'));
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  }, [contractToDelete, refreshData, t]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setContractToDelete(null);
  }, []);

  const handleAddContract = useCallback(() => {
    window.location.href = '/contracts/create';
  }, []);

  const handleEditContract = useCallback((contract: ContractWithDetails) => {
    window.location.href = `/contracts/${contract.id}/edit`;
  }, []);

  return {
    deleteDialogOpen,
    contractToDelete,
    actionLoading,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleAddContract,
    handleEditContract,
  };
}

