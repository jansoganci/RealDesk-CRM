/**
 * useContractPdfHandler
 *
 * Custom hook for handling PDF generation, upload, and download
 * Extracted from ContractCreateForm.tsx for better separation of concerns
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { generateContractPDFBlob } from '@/services/contractPdf.service';
import { numberToTurkishText } from '@/lib/numberToText';
import type { ContractFormData, ContractCreationResult, ContractPdfData } from '@/types/contract.types';

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

/**
 * Prepare PDF data from form data
 */
function preparePdfData(
  formData: ContractFormData,
  contractId: string
): ContractPdfData {
  const monthlyRent = typeof formData.rent_amount === 'string'
    ? parseFloat(formData.rent_amount)
    : formData.rent_amount;
  const yearlyRent = monthlyRent * 12;
  const deposit = typeof formData.deposit === 'string'
    ? parseFloat(formData.deposit)
    : formData.deposit;

  return {
    contractNumber: contractId.slice(0, 8).toUpperCase(),
    contractDate: format(new Date(), 'dd/MM/yyyy'),

    // Property
    mahalle: formData.mahalle,
    ilce: formData.ilce,
    il: formData.il,
    sokak: formData.cadde_sokak,
    binaNo: formData.bina_no,
    daireNo: formData.daire_no || '',
    propertyType: formData.property_type || 'Daire',
    propertyUsage: formData.use_purpose || 'Mesken',

    // Owner
    ownerName: formData.owner_name,
    ownerPhone: formData.owner_phone,
    ownerIBAN: formData.owner_iban || '',

    // Tenant
    tenantName: formData.tenant_name,
    tenantTC: formData.tenant_tc,
    tenantAddress: formData.tenant_address,
    tenantPhone: formData.tenant_phone,

    // Rent amounts
    monthlyRentNumber: monthlyRent,
    monthlyRentText: numberToTurkishText(monthlyRent),
    yearlyRentNumber: yearlyRent,
    yearlyRentText: numberToTurkishText(yearlyRent),

    // Dates
    startDate: format(new Date(formData.start_date), 'dd MMMM yyyy', { locale: tr }),
    endDate: format(new Date(formData.end_date), 'dd MMMM yyyy', { locale: tr }),
    paymentDay: formData.payment_day_of_month?.toString() || '1',

    // Deposit
    depositAmount: deposit,
    depositText: numberToTurkishText(deposit),

    // Fixtures
    fixtures: formData.special_conditions || 'Kombi, Klima',

    // Eviction commitment
    evictionDate: format(new Date(formData.end_date), 'dd MMMM yyyy', { locale: tr }),
    commitmentDate: format(new Date(), 'dd MMMM yyyy', { locale: tr })
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
  contractId: string
): Promise<string> {
  const fileName = `Kira_Sozlesmesi_${contractId.slice(0, 8)}.pdf`;
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
function downloadPdfToBrowser(pdfBlob: Blob, contractId: string): boolean {
  try {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kira_Sozlesmesi_${contractId.slice(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('PDF download triggered');
    return true;
  } catch (downloadError) {
    console.error('Browser download failed:', downloadError);
    return false;
  }
}

/**
 * Handle upload errors with appropriate toast messages
 */
function handleUploadError(error: unknown): void {
  console.error('PDF storage upload failed:', error);

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  if (errorMessage.includes('storage_quota')) {
    toast.warning('Depolama alanı dolu', {
      description: 'PDF indirilecek ancak sisteme kaydedilemedi. Lütfen yönetici ile iletişime geçin.',
      duration: 8000
    });
  } else if (errorMessage.includes('timeout')) {
    toast.warning('Yavaş internet bağlantısı', {
      description: 'PDF indirilecek ancak sisteme kaydedilemedi. Lütfen daha sonra manuel yükleyin.',
      duration: 8000
    });
  } else {
    toast.warning('PDF sisteme kaydedilemedi', {
      description: 'PDF indirilecek. İsterseniz daha sonra kontrat listesinden manuel yükleyebilirsiniz.',
      duration: 8000
    });
  }
}

/**
 * Show final success message based on upload result
 */
function showFinalSuccessMessage(storageSaveSucceeded: boolean): void {
  if (storageSaveSucceeded) {
    toast.success('Sözleşme ve PDF başarıyla oluşturuldu!', {
      description: 'PDF sisteme kaydedildi ve cihazınıza indirildi. İsterseniz kontrat listesinden tekrar indirebilirsiniz.',
      duration: 6000
    });
  } else {
    toast.success('Sözleşme oluşturuldu, PDF indirildi', {
      description: 'PDF sisteme kaydedilemedi. Lütfen indirilen dosyayı kontrat listesinden manuel yükleyin.',
      duration: 8000
    });
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useContractPdfHandler(): UseContractPdfHandlerReturn {
  const [isProcessing, setIsProcessing] = useState(false);

  const generateAndUploadPdf = async (
    formData: ContractFormData,
    contractResult: ContractCreationResult
  ): Promise<PdfHandlerResult> => {
    setIsProcessing(true);

    try {
      toast.info('PDF sözleşme hazırlanıyor...', { duration: 2000 });

      // STEP 1: Prepare PDF data
      const pdfData = preparePdfData(formData, contractResult.contract_id);

      // STEP 2: Generate PDF Blob
      const pdfBlob = await generateContractPDFBlob(pdfData);

      // STEP 3: Validate PDF size
      validatePdfSize(pdfBlob);

      console.log(`PDF generated successfully: ${(pdfBlob.size / 1024).toFixed(2)} KB`);

      // STEP 4: Upload to Supabase Storage
      let storageSaveSucceeded = false;
      let storageFilePath = '';

      try {
        toast.info('PDF sisteme kaydediliyor...', { duration: 2000 });

        storageFilePath = await uploadPdfToStorage(pdfBlob, contractResult.contract_id);
        storageSaveSucceeded = true;

        console.log('PDF saved to storage:', storageFilePath);
      } catch (uploadError) {
        handleUploadError(uploadError);
      }

      // STEP 5: Download to user's browser (always attempt, even if storage failed)
      const downloadTriggered = downloadPdfToBrowser(pdfBlob, contractResult.contract_id);

      // STEP 6: Show appropriate success message
      showFinalSuccessMessage(storageSaveSucceeded);

      setIsProcessing(false);

      return {
        success: true,
        storagePath: storageSaveSucceeded ? storageFilePath : undefined,
        downloadTriggered,
      };

    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError);

      toast.error('PDF oluşturulamadı', {
        description: 'Sözleşme başarıyla kaydedildi. PDF\'i daha sonra kontrat listesinden oluşturabilir veya manuel yükleyebilirsiniz.',
        duration: 8000
      });

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
