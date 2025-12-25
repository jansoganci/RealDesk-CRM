/**
 * Sale Contract PDF Hook
 * React hook that wraps the PDF engine service for Sale Contracts
 * 
 * Reference: IMPL-SPEC-contract-pdf-engine-v2.md section 7.1
 * 
 * This hook is the ONLY gateway between Sale UI components and the PDF engine.
 * UI components should never call contractPdfEngineService directly.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { contractPdfEngineService } from '@/services/contractPdfEngine.service';
import type { ContractInstanceV2 } from '@/types/contractBuilder.types';

// ============================================================================
// Types
// ============================================================================

interface UseSaleContractPdfReturn {
  isGenerating: boolean;
  isDownloading: boolean;
  generatePdf: (instance: ContractInstanceV2) => Promise<boolean>;
  downloadPdf: (instance: ContractInstanceV2) => Promise<void>;
  regeneratePdf: (instance: ContractInstanceV2) => Promise<boolean>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSaleContractPdf(): UseSaleContractPdfReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { t } = useTranslation('contractsSale');

  /**
   * Generate PDF for a contract instance
   * Calls the full pipeline: generate + upload + update DB + trigger download
   */
  const generatePdf = useCallback(
    async (instance: ContractInstanceV2): Promise<boolean> => {
      setIsGenerating(true);
      toast.info(t('pdf.generating'));

      try {
        const result = await contractPdfEngineService.generateAndSave(
          'sale',
          instance.form_data,
          instance.id,
          instance.user_id,
          true // trigger download
        );

        if (result.success) {
          toast.success(t('pdf.generated'));
          return true;
        } else {
          toast.error(t('pdf.generateFailed'), { description: result.error });
          return false;
        }
      } catch (error) {
        toast.error(t('pdf.generateFailed'));
        return false;
      } finally {
        setIsGenerating(false);
      }
    },
    [t]
  );

  /**
   * Download existing PDF for a contract instance
   * Gets signed URL and opens in new tab
   */
  const downloadPdf = useCallback(
    async (instance: ContractInstanceV2): Promise<void> => {
      if (!instance.pdf_path) {
        toast.error(t('pdf.notFound'));
        return;
      }

      setIsDownloading(true);

      try {
        const result = await contractPdfEngineService.getDownloadUrl(instance.pdf_path);

        if (result.success && result.signedUrl) {
          window.open(result.signedUrl, '_blank');
          toast.success(t('pdf.downloading'));
        } else {
          toast.error(t('pdf.downloadFailed'), { description: result.error });
        }
      } catch (error) {
        toast.error(t('pdf.downloadFailed'));
      } finally {
        setIsDownloading(false);
      }
    },
    [t]
  );

  /**
   * Regenerate PDF for a contract instance
   * Same as generate, but user explicitly requested regeneration
   */
  const regeneratePdf = useCallback(
    async (instance: ContractInstanceV2): Promise<boolean> => {
      toast.info(t('pdf.regenerating'));
      return generatePdf(instance);
    },
    [generatePdf, t]
  );

  return {
    isGenerating,
    isDownloading,
    generatePdf,
    downloadPdf,
    regeneratePdf,
  };
}

