import { useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { tenantsService, contractsService } from '../../../lib/serviceProxy';
import type { TenantWithProperty, Contract, TenantUpdate, ContractUpdate } from '../../../types';
import type { TenantEditFormData } from '../schemas/tenantEditSchema';

/**
 * Tenant Edit Submission Hook
 * Handles form submission, tenant update, contract update/create, and PDF upload
 */

interface UseTenantEditSubmissionOptions {
  tenant: TenantWithProperty;
  primaryContract: Contract | null;
  form: UseFormReturn<TenantEditFormData>;
  pdfFile: File | null;
  validateCurrentStep: () => Promise<boolean>;
  onSuccess: () => void;
  onOpenChange: (open: boolean) => void;
}

interface UseTenantEditSubmissionReturn {
  submitting: boolean;
  handleSubmit: () => Promise<void>;
}

/**
 * Hook for handling tenant edit form submission
 * Manages tenant update, contract update/create, PDF upload, and success/error handling
 */
export function useTenantEditSubmission({
  tenant,
  primaryContract,
  form,
  pdfFile,
  validateCurrentStep,
  onSuccess,
  onOpenChange,
}: UseTenantEditSubmissionOptions): UseTenantEditSubmissionReturn {
  const { t } = useTranslation('tenants');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    try {
      setSubmitting(true);
      
      // Final validation
      const isValid = await validateCurrentStep();
      if (!isValid) return;

      const formData = form.getValues();
      
      // Update tenant
      // property_id is not part of TenantUpdate - tenants are related to properties via contracts
      const tenantUpdateData: TenantUpdate = {
        name: formData.tenant.name,
        email: formData.tenant.email || null,
        phone: formData.tenant.phone || null,
        notes: formData.tenant.notes || null,
      };
      
      await tenantsService.update(tenant.id, tenantUpdateData);
      
      // Update or create contract
      if (primaryContract) {
        // Update existing contract
        const contractUpdateData: ContractUpdate = {
          property_id: formData.contract.property_id,
          start_date: formData.contract.start_date,
          end_date: formData.contract.end_date,
          rent_amount: formData.contract.rent_amount,
          status: formData.contract.status,
          rent_increase_reminder_enabled: formData.contract.rent_increase_reminder_enabled,
          rent_increase_reminder_days: formData.contract.rent_increase_reminder_enabled 
            ? formData.contract.rent_increase_reminder_days 
            : null,
          expected_new_rent: formData.contract.expected_new_rent,
          reminder_notes: formData.contract.reminder_notes || null,
        };
        
        await contractsService.update(primaryContract.id, contractUpdateData);
      } else {
        // Create new contract if none exists
        const contractInsertData = {
          tenant_id: tenant.id,
          property_id: formData.contract.property_id,
          start_date: formData.contract.start_date,
          end_date: formData.contract.end_date,
          rent_amount: formData.contract.rent_amount,
          status: formData.contract.status,
          rent_increase_reminder_enabled: formData.contract.rent_increase_reminder_enabled,
          rent_increase_reminder_days: formData.contract.rent_increase_reminder_enabled 
            ? formData.contract.rent_increase_reminder_days 
            : null,
          rent_increase_reminder_contacted: false,
          expected_new_rent: formData.contract.expected_new_rent,
          reminder_notes: formData.contract.reminder_notes || null,
        };
        
        // user_id is injected automatically by the service
        await contractsService.create(contractInsertData as any);
      }
      
      // Handle PDF upload if provided
      if (pdfFile && primaryContract) {
        try {
          await contractsService.uploadContractPdfAndPersist(pdfFile, primaryContract.id);
        } catch (uploadError) {
          console.error('PDF upload failed:', uploadError);
          toast.error(t('edit.pdfUploadFailed'));
        }
      }

      // Success!
      toast.success(t('edit.updateSuccess', { name: formData.tenant.name }));
      onSuccess();
      onOpenChange(false);

    } catch (error) {
      console.error('Failed to update tenant and contract:', error);
      toast.error(error instanceof Error ? error.message : t('edit.updateFailed'));
    } finally {
      setSubmitting(false);
    }
  }, [
    tenant,
    primaryContract,
    form,
    pdfFile,
    validateCurrentStep,
    onSuccess,
    onOpenChange,
    t,
  ]);

  return {
    submitting,
    handleSubmit,
  };
}

