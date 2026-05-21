/**
 * useContractPdfHandler
 *
 * Custom hook for handling PDF generation, upload, and download
 * Extracted from ContractCreateForm.tsx for better separation of concerns
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { generateContractPDFBlob } from '@/services/contractPdf.service';
import { numberToEnglishText, numberToLegacyLeaseText } from '@/lib/numberToText';
import type { ContractFormData, ContractCreationResult, ContractPdfData } from '@/types/contract.types';
import { createLogger } from '@/lib/logger';
import { formatFixturesForPdf } from '../utils/fixturesUtils';

const logger = createLogger('ContractPdf');

// ============================================================================
// Types
// ============================================================================

export interface PdfHandlerResult {
  success: boolean;
  storagePath?: string;
  downloadTriggered: boolean;
  error?: string;
}

export interface UseContractPdfHandlerReturn {
  generateAndUploadPdf: (
    formData: ContractFormData,
    contractResult: ContractCreationResult
  ) => Promise<PdfHandlerResult>;
  isProcessing: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const MIN_PDF_SIZE = 10000; // 10KB
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// Helper Functions
// ============================================================================

function isLegacyLeasePdf(formData: ContractFormData): boolean {
  const s = formData.state?.trim() ?? '';
  return s.length !== 2;
}

/**
 * Prepare PDF data from form data
 */
function preparePdfData(
  formData: ContractFormData,
  contractId: string,
  isLegacy: boolean,
): ContractPdfData {
  const monthlyRent = typeof formData.rent_amount === 'string'
    ? parseFloat(formData.rent_amount)
    : formData.rent_amount;
  const yearlyRent = monthlyRent * 12;
  const deposit = typeof formData.deposit === 'string'
    ? parseFloat(formData.deposit)
    : formData.deposit;

  const locale = isLegacy ? tr : enUS;
  const datePattern = isLegacy ? 'dd MMMM yyyy' : 'MMMM dd, yyyy';
  const amtToText = isLegacy ? numberToLegacyLeaseText : numberToEnglishText;

  return {
    contractNumber: contractId.slice(0, 8).toUpperCase(),
    contractDate: format(new Date(), 'MM/dd/yyyy'),

    // Property (US Format)
    streetAddress: formData.street_address,
    unit: formData.unit,
    city: formData.city,
    state: formData.state,
    zipCode: formData.zip_code,
    propertyType: formData.property_type || 'apartment',
    propertyUsage: formData.use_purpose || 'Residential',

    // Owner
    ownerName: formData.owner_name,
    ownerTaxId: formData.owner_tax_id,
    ownerPhone: formData.owner_phone,
    ownerRoutingNumber: formData.owner_routing_number,
    ownerAccountNumber: formData.owner_account_number,

    // Tenant
    tenantName: formData.tenant_name,
    tenantTaxId: formData.tenant_tax_id,
    tenantAddress: formData.tenant_address,
    tenantPhone: formData.tenant_phone,

    // Rent amounts
    monthlyRentNumber: monthlyRent,
    monthlyRentText: amtToText(monthlyRent),
    yearlyRentNumber: yearlyRent,
    yearlyRentText: amtToText(yearlyRent),

    // Dates
    startDate: format(new Date(formData.start_date), datePattern, { locale }),
    endDate: format(new Date(formData.end_date), datePattern, { locale }),
    paymentDay: formData.payment_day_of_month?.toString() || '1',

    // Deposit
    depositAmount: deposit,
    depositText: amtToText(deposit),

    // Currency
    currency: formData.currency || 'USD',

    // Fixtures (formatted for PDF: comma + space, or '-' if empty)
    fixtures: formatFixturesForPdf(formData.special_conditions),

    // Paint condition
    isPainted: formData.is_painted,

    // Eviction commitment
    evictionDate: '', // Left blank for manual entry (legal requirement)
    commitmentDate: format(new Date(), datePattern, { locale }),

    // Google Drive handover photos URL (for QR code)
    handoverPhotosUrl: formData.handover_photos_url || undefined
  };
}

/**
 * Validate PDF blob size
 */
function validatePdfSize(pdfBlob: Blob): void {
  if (pdfBlob.size < MIN_PDF_SIZE) {
    throw new Error(`PDF too small (${pdfBlob.size} bytes) - likely corrupted`);
  }
  if (pdfBlob.size > MAX_PDF_SIZE) {
    throw new Error(`PDF too large (${(pdfBlob.size / 1024 / 1024).toFixed(2)} MB)`);
  }
}

/**
 * Upload PDF to Supabase storage with timeout
 */
async function uploadPdfToStorage(
  pdfBlob: Blob,
  contractId: string,
  isLegacy: boolean,
): Promise<string> {
  const base = contractId.slice(0, 8);
  const fileName = isLegacy
    ? `Kira_Sozlesmesi_${base}.pdf`
    : `Lease_Agreement_${base}.pdf`;
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

  const { contractsService } = await import('@/lib/serviceProxy');

  const storageFilePath = await Promise.race([
    contractsService.uploadContractPdfAndPersist(pdfFile, contractId),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), UPLOAD_TIMEOUT)
    )
  ]);

  return storageFilePath;
}

/**
 * Trigger browser download for PDF
 */
function downloadPdfToBrowser(pdfBlob: Blob, contractId: string, isLegacy: boolean): boolean {
  try {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    const base = contractId.slice(0, 8);
    link.download = isLegacy ? `Kira_Sozlesmesi_${base}.pdf` : `Lease_Agreement_${base}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logger.debug('PDF download triggered');
    return true;
  } catch (downloadError) {
    logger.error('Browser download failed:', downloadError);
    return false;
  }
}

/**
 * Handle upload errors with appropriate toast messages
 */
function handleUploadError(error: unknown, tf: TFunction<'contracts'>): void {
  logger.error('PDF storage upload failed:', error);

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  if (errorMessage.includes('storage_quota')) {
    toast.warning(tf('pdf.errors.storageQuota'), {
      description: tf('pdf.errors.storageQuotaDescription'),
      duration: 8000
    });
  } else if (errorMessage.includes('timeout')) {
    toast.warning(tf('pdf.errors.timeout'), {
      description: tf('pdf.errors.timeoutDescription'),
      duration: 8000
    });
  } else {
    toast.warning(tf('pdf.errors.uploadFailed'), {
      description: tf('pdf.errors.uploadFailedDescription'),
      duration: 8000
    });
  }
}

/**
 * Show final success message based on upload result
 */
function showFinalSuccessMessage(
  storageSaveSucceeded: boolean,
  tf: TFunction<'contracts'>,
): void {
  if (storageSaveSucceeded) {
    toast.success(tf('pdf.success.createdAndSaved'), {
      description: tf('pdf.success.createdAndSavedDescription'),
      duration: 6000
    });
  } else {
    toast.success(tf('pdf.success.createdDownloaded'), {
      description: tf('pdf.success.createdDownloadedDescription'),
      duration: 8000
    });
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useContractPdfHandler(): UseContractPdfHandlerReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useTranslation('contracts');

  const generateAndUploadPdf = async (
    formData: ContractFormData,
    contractResult: ContractCreationResult
  ): Promise<PdfHandlerResult> => {
    setIsProcessing(true);

    try {
      const isLegacy = isLegacyLeasePdf(formData);

      toast.info(t('pdf.generating'), { duration: 2000 });

      // STEP 1: Prepare PDF data
      const pdfData = preparePdfData(formData, contractResult.contract_id, isLegacy);

      // STEP 2: Generate PDF Blob (with merged clauses from database)
      const pdfBlob = await generateContractPDFBlob(pdfData, contractResult.contract_id);

      // STEP 3: Validate PDF size
      validatePdfSize(pdfBlob);

      logger.debug(`PDF generated successfully: ${(pdfBlob.size / 1024).toFixed(2)} KB`);

      // STEP 4: Upload to Supabase Storage
      let storageSaveSucceeded = false;
      let storageFilePath = '';

      try {
        toast.info(t('pdf.uploading'), { duration: 2000 });

        storageFilePath = await uploadPdfToStorage(pdfBlob, contractResult.contract_id, isLegacy);
        storageSaveSucceeded = true;

        logger.debug('PDF saved to storage:', storageFilePath);
      } catch (uploadError) {
        handleUploadError(uploadError, t);
      }

      // STEP 5: Download to user's browser (always attempt, even if storage failed)
      const downloadTriggered = downloadPdfToBrowser(pdfBlob, contractResult.contract_id, isLegacy);

      // STEP 6: Show appropriate success message
      showFinalSuccessMessage(storageSaveSucceeded, t);

      setIsProcessing(false);

      return {
        success: true,
        storagePath: storageSaveSucceeded ? storageFilePath : undefined,
        downloadTriggered,
      };

    } catch (pdfError) {
      logger.error('PDF generation failed:', pdfError);

      const errorMessage = pdfError instanceof Error ? pdfError.message.toLowerCase() : '';
      if (errorMessage.includes('clause') || errorMessage.includes('madde')) {
        toast.error(t('pdf.errors.clausesLoadFailed'), {
          description: t('pdf.errors.clausesLoadFailedDescription'),
          duration: 8000
        });
      } else {
        toast.error(t('pdf.errors.generationFailed'), {
          description: pdfError instanceof Error ? pdfError.message : t('pdf.errors.generationFailedDescription'),
          duration: 8000
        });
      }

      setIsProcessing(false);

      return {
        success: false,
        downloadTriggered: false,
        error: pdfError instanceof Error ? pdfError.message : 'Unknown error',
      };
    }
  };

  return {
    generateAndUploadPdf,
    isProcessing,
  };
}
