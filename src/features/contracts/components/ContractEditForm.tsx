/**
 * Contract Edit Form
 * Form for editing existing contracts
 * Pre-fills with existing data and handles updates
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

import { contractFormSchema, type ContractFormData } from '../schemas/contractForm.schema';
import { AddressInput } from './AddressInput';
import { OwnerFormSection, TenantFormSection, ContractDetailsSection } from './form-sections';
import { useContractPdfHandler } from '../hooks/useContractPdfHandler';
import { updateContractWithEntities } from '@/services/contractUpdate.service';

// ============================================================================
// Types
// ============================================================================

interface ContractEditFormProps {
  contractId: string;
  tenantId: string;
  propertyId: string;
  ownerId: string;
  initialData: ContractFormData;
}

// ============================================================================
// Component
// ============================================================================

export function ContractEditForm({
  contractId,
  tenantId,
  propertyId,
  ownerId,
  initialData,
}: ContractEditFormProps) {
  const { t } = useTranslation('contracts');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { generateAndUploadPdf } = useContractPdfHandler();

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: initialData,
  });

  // Reset form when initialData changes
  useEffect(() => {
    form.reset(initialData);
  }, [initialData, form]);

  const onSubmit = async (data: ContractFormData) => {
    if (!user?.id) {
      toast.error(t('edit.toasts.noSession'));
      return;
    }

    setIsSubmitting(true);

    try {
      toast.info(t('edit.toasts.updating'), { duration: 2000 });

      // Update contract and related entities
      const result = await updateContractWithEntities({
        contractId,
        tenantId,
        propertyId,
        ownerId,
        formData: data,
        userId: user.id,
      });

      // Show success messages
      const messages: string[] = [];
      if (result.ownerUpdated) messages.push(t('edit.toasts.ownerUpdated'));
      if (result.tenantUpdated) messages.push(t('edit.toasts.tenantUpdated'));
      if (result.propertyUpdated) messages.push(t('edit.toasts.propertyUpdated'));
      if (result.contractUpdated) messages.push(t('edit.toasts.contractUpdated'));

      toast.success(messages.join('\n'), {
        duration: 6000,
        description: t('edit.toasts.successDescription')
      });

      // Regenerate PDF with updated data
      if (result.dataChanged) {
        toast.info(t('edit.toasts.regeneratingPdf'), { duration: 2000 });
        await generateAndUploadPdf(data, {
          success: true,
          contract_id: contractId,
          owner_id: ownerId,
          tenant_id: tenantId,
          property_id: propertyId,
          created_owner: false,
          created_tenant: false,
          created_property: false,
          message: 'Contract updated',
        });
      }

      // Navigate back to contracts list
      navigate('/contracts');
    } catch (error) {
      console.error('Contract update error:', error);
      toast.error(t('errors.updateFailed'), {
        description: error instanceof Error ? error.message : t('edit.toasts.unknownError')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Edit Mode Warning */}
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t('edit.warning')}
        </AlertDescription>
      </Alert>

      {/* Owner Section */}
      <OwnerFormSection form={form} />

      {/* Tenant Section */}
      <TenantFormSection form={form} />

      {/* Property Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('create.sections.property')}</CardTitle>
          <CardDescription>
            {t('create.sections.propertyDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddressInput form={form} />
        </CardContent>
      </Card>

      {/* Contract Section */}
      <ContractDetailsSection form={form} />

      {/* Form Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/contracts')}
          className="flex-1"
          disabled={isSubmitting}
        >
          {t('edit.buttons.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? t('edit.buttons.submitting') : t('edit.buttons.submit')}
        </Button>
      </div>
    </form>
  );
}
