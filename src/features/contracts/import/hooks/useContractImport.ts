/**
 * Contract Import Hook
 * Handles business logic for importing legacy contracts
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  extractTextFromFileViaProxy,
  parseContractFromText,
  createContractWithEntities,
  contractsService
} from '@/lib/serviceProxy';
import { useAuth } from '@/contexts/AuthContext';

interface ImportState {
  file: File | null;
  extractedText: string;
  parsedData: any;
  progress: number;
  status: string;
  submitting: boolean;
  createdData: any;
}

export const useContractImport = () => {
  const { t } = useTranslation('contracts');
  const { user } = useAuth();
  const [state, setState] = useState<ImportState>({
    file: null,
    extractedText: '',
    parsedData: {},
    progress: 0,
    status: '',
    submitting: false,
    createdData: null
  });

  const handleFileUpload = async (file: File) => {
    setState(prev => ({ ...prev, file, progress: 0, status: t('import.uploading') }));

    try {
      // Step 1: Upload and extract text (33%)
      setState(prev => ({ ...prev, progress: 33, status: t('import.reading') }));

      const result = await extractTextFromFileViaProxy(file);

      if (!result.text || result.text.length === 0) {
        throw new Error('PDF\'den metin çıkarılamadı. Dosya boş veya taranmış olabilir.');
      }

      setState(prev => ({ ...prev, extractedText: result.text }));

      // Step 2: Parse contract data (66%)
      setState(prev => ({ ...prev, progress: 66, status: t('import.dataExtracting') }));

      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX

      const parsed = parseContractFromText(result.text);

      // Step 3: Done (100%)
      setState(prev => ({
        ...prev,
        progress: 100,
        status: t('import.ready'),
        parsedData: parsed
      }));

      toast.success(t('import.toasts.success'), {
        description: t('import.toasts.successDescription', { count: Object.keys(parsed).length })
      });

    } catch (error) {
      console.error('Text extraction failed:', error);

      toast.error(t('import.toasts.readFailed'), {
        description: error instanceof Error ? error.message : t('import.toasts.readFailedDescription')
      });

      // Set empty parsed data to allow manual entry
      setState(prev => ({
        ...prev,
        extractedText: '',
        parsedData: {},
        progress: 0,
        status: t('import.error')
      }));
    }
  };

  const submitContract = async (formData: any) => {
    if (!user) {
      toast.error(t('import.toasts.noSession'));
      return false;
    }

    setState(prev => ({ ...prev, submitting: true }));

    try {
      // Create contract with entities via RPC
      const result = await createContractWithEntities(formData, user.id);

      // Upload PDF to storage
      if (state.file) {
        try {
          await contractsService.uploadContractPdfAndPersist(
            state.file,
            result.contract_id
          );
        } catch (uploadError) {
          console.error('PDF upload failed:', uploadError);
          // Don't fail the whole operation - PDF is optional
          toast.warning(t('import.toasts.pdfUploadFailed'), {
            description: t('import.toasts.pdfUploadFailedDescription')
          });
        }
      }

      setState(prev => ({
        ...prev,
        createdData: result,
        submitting: false
      }));

      return true;

    } catch (error) {
      console.error('Contract creation failed:', error);

      setState(prev => ({ ...prev, submitting: false }));

      toast.error(t('import.toasts.saveFailed'), {
        description: error instanceof Error ? error.message : t('create.toasts.unknownError')
      });

      return false;
    }
  };

  const reset = () => {
    setState({
      file: null,
      extractedText: '',
      parsedData: {},
      progress: 0,
      status: '',
      submitting: false,
      createdData: null
    });
  };

  return {
    ...state,
    handleFileUpload,
    submitContract,
    reset
  };
};
