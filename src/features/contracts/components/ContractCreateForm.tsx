/**
 * Contract Creation Form
 * Comprehensive form for creating contracts with auto-entity creation
 * V1: Manual creation (no RPC yet)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createContractWithEntities } from '@/lib/serviceProxy';
import { clausesService } from '@/services/clauses.service';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { contractFormSchema, contractFormDefaultValues, type ContractFormData } from '../schemas/contractForm.schema';
import { AddressInput } from './AddressInput';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useContractPdfHandler } from '../hooks/useContractPdfHandler';
import { useContractPreValidation } from '../hooks/useContractPreValidation';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';
import { fillFormWithTestData } from '../data/testContracts';
import { OwnerFormSection, TenantFormSection, ContractDetailsSection } from './form-sections';
import { EditableClausesSection } from './EditableClausesSection';

export function ContractCreateForm() {
  const { t } = useTranslation('contracts');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { generateAndUploadPdf } = useContractPdfHandler();
  const { validateBeforeSubmit } = useContractPreValidation();
  const { dialogState, showConfirmation, onConfirm, onCancel } = useConfirmationDialog();

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: contractFormDefaultValues,
  });

  // Fill form with test data (extracted to data/testContracts.ts)
  const fillTestData = () => fillFormWithTestData(form);

  const onSubmit = async (data: ContractFormData) => {
    if (!user?.id) {
      toast.error(t('create.toasts.noSession'));
      return;
    }

    setIsSubmitting(true);

    try {
      // ========================================================================
      // V3: Pre-submit checks (duplicate detection and confirmations)
      // ========================================================================
      const validation = await validateBeforeSubmit(data, user.id, showConfirmation);

      if (!validation.canProceed) {
        setIsSubmitting(false);
        return;
      }

      // ========================================================================
      // V2: Call RPC function to create contract with auto-entity creation
      // ========================================================================
      toast.info(t('create.toasts.creating'), { duration: 2000 });

      const result = await createContractWithEntities(data, user.id);

      // Build success message with creation flags
      const messages: string[] = [];
      if (result.created_owner) {
        messages.push(t('create.toasts.ownerCreated'));
      } else {
        messages.push(t('create.toasts.ownerUsed'));
      }

      if (result.created_tenant) {
        messages.push(t('create.toasts.tenantCreated'));
      } else {
        messages.push(t('create.toasts.tenantUsed'));
      }

      if (result.created_property) {
        messages.push(t('create.toasts.propertyCreated'));
      } else {
        messages.push(t('create.toasts.propertyUsed'));
      }

      messages.push(t('create.toasts.contractCreated'));

      toast.success(messages.join('\n'), {
        duration: 6000,
        description: t('create.toasts.allCompleted')
      });

      // ========================================================================
      // V5: Save Clause Overrides (BEFORE PDF generation)
      // ========================================================================
      if (data.clauseOverrides && data.clauseOverrides.length > 0) {
        try {
          await clausesService.saveOverrides(
            result.contract_id,
            data.clauseOverrides,
            user.id
          );
          console.log('[ContractCreate] Clause overrides saved');
        } catch (overrideError) {
          console.error('[ContractCreate] Failed to save clause overrides:', overrideError);
          toast.warning('Sözleşme oluşturuldu ancak özel maddeler kaydedilemedi', {
            description: 'PDF oluşturmadan önce maddeleri kontrol edin',
          });
          // Non-blocking: Continue to PDF generation anyway
        }
      }

      // ========================================================================
      // V6: Generate PDF Contract and Save to Storage (using extracted hook)
      // ========================================================================
      await generateAndUploadPdf(data, result);

      // Navigate to contracts list
      navigate('/contracts');
    } catch (error) {
      console.error('Contract creation error:', error);
      toast.error(t('errors.createFailed'), {
        description: error instanceof Error ? error.message : t('create.toasts.unknownError')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Test Data Button - DEV ONLY */}
      {import.meta.env.DEV && (
        <div className="flex justify-end mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={fillTestData}
            className="bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
          >
            🧪 Test Verileriyle Doldur
          </Button>
        </div>
      )}

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

      {/* Editable Clauses Section */}
      <EditableClausesSection form={form} />

      {/* Form Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/contracts')}
          className="flex-1"
        >
          {t('create.buttons.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? t('create.buttons.submitting') : t('create.buttons.submit')}
        </Button>
      </div>
    </form>

    {/* Confirmation Dialog */}
    <ConfirmationDialog
      open={dialogState.open}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      title={dialogState.title}
      message={dialogState.message}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
    </>
  );
}
