import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { contractsService } from '../../../lib/serviceProxy';
import type { ContractWithDetails } from '../../../types';

/**
 * Contracts PDF Actions Hook
 * Handles PDF upload, download, file validation, and upload state management
 */

interface UseContractsPdfActionsOptions {
  refreshData: () => Promise<void>;
}

interface UseContractsPdfActionsReturn {
  uploadingContractId: string | null;
  pdfActionLoading: boolean;
  handleDownloadPdf: (contract: ContractWithDetails) => Promise<void>;
  handleUploadPdfClick: (contractId: string) => void;
}

/**
 * Hook for managing contract PDF actions
 * Handles PDF upload (with validation), download, and loading states
 */
export function useContractsPdfActions({
  refreshData,
}: UseContractsPdfActionsOptions): UseContractsPdfActionsReturn {
  const [uploadingContractId, setUploadingContractId] = useState<string | null>(null);
  const [pdfActionLoading, setPdfActionLoading] = useState(false);
  const { t } = useTranslation('contracts');

  const handleDownloadPdf = useCallback(async (contract: ContractWithDetails) => {
    if (!contract.contract_pdf_path) return;

    try {
      const url = await contractsService.getContractPdfUrl(contract.contract_pdf_path);
      window.open(url, '_blank');
      toast.success(t('pdf.actions.opening'));
    } catch (error) {
      console.error('PDF download failed:', error);
      toast.error(t('pdf.actions.downloadFailed'), {
        description: error instanceof Error ? error.message : t('create.toasts.unknownError')
      });
    }
  }, [t]);

  const handlePdfFileSelected = useCallback(async (
    e: Event,
    contractId: string
  ) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      setUploadingContractId(null);
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error(t('pdf.actions.invalidFileType'));
      setUploadingContractId(null);
      return;
    }

    // Validate file size
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      toast.error(t('pdf.actions.fileTooLarge'), {
        description: t('pdf.actions.fileSize', { size: (file.size / 1024 / 1024).toFixed(2) })
      });
      setUploadingContractId(null);
      return;
    }

    try {
      setPdfActionLoading(true);
      toast.info(t('pdf.actions.uploading'), { duration: 2000 });

      await contractsService.uploadContractPdfAndPersist(file, contractId);

      toast.success(t('pdf.actions.uploadSuccess'), {
        description: t('pdf.actions.uploadSuccessDescription')
      });

      // Refresh data after successful upload
      await refreshData();
    } catch (error) {
      console.error('PDF upload failed:', error);
      toast.error(t('pdf.actions.uploadFailed'), {
        description: error instanceof Error ? error.message : t('create.toasts.unknownError')
      });
    } finally {
      setPdfActionLoading(false);
      setUploadingContractId(null);
    }
  }, [refreshData, t]);

  const handleUploadPdfClick = useCallback((contractId: string) => {
    setUploadingContractId(contractId);

    // Create and trigger file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => handlePdfFileSelected(e, contractId);
    input.click();
  }, [refreshData, handlePdfFileSelected]);

  return {
    uploadingContractId,
    pdfActionLoading,
    handleDownloadPdf,
    handleUploadPdfClick,
  };
}

