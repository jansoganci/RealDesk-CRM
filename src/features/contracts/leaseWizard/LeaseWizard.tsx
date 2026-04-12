/**
 * Sprint 6A T9 — Full wizard shell: progress bar, navigation, draft discard dialog.
 * T14 — Final step: full-form validation, PDF download, optional CRM save (linked property + tenant).
 * T15 — After CRM save, generate US lease PDF and attach via `uploadContractPdfAndPersist` (non-blocking on failure).
 * T16 — Entry points: Contracts hub (rent card) + contract create header → `/contracts/rent/lease-wizard` (owners).
 * Step field UI: `LeaseWizardStepContent` (steps 1–8), or override via `renderStep`.
 */

import { useState, type ReactNode } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Form } from '@/components/ui/form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/config/constants';
import {
  contractsService,
  leaseAgreementPdfService,
  leaseAgreementService,
} from '@/lib/serviceProxy';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LeaseWizardStepContent } from './LeaseWizardStepContent';
import { useLeaseWizard } from './useLeaseWizard';

export type LeaseWizardProps = {
  /** Called after the user confirms discard (draft cleared). */
  onCancel?: () => void;
  /** Optional step content; defaults to `LeaseWizardStepContent`. */
  renderStep?: (step: number) => ReactNode;
};

export function LeaseWizard({ onCancel, renderStep }: LeaseWizardProps) {
  const { t } = useTranslation('contracts');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const wizard = useLeaseWizard({ userId: user?.id });
  const {
    form,
    currentStep,
    totalSteps,
    handleNext,
    handleBack,
    validateFullForm,
    getStepProgress,
    isFirstStep,
    isLastStep,
    resetWizard,
  } = wizard;

  const linkedPropertyId = form.watch('linkedPropertyId');
  const linkedTenant1Id = form.watch('linkedTenant1Id');
  const linkedLandlordOwnerId = form.watch('linkedLandlordOwnerId');
  const canSaveToCrm = Boolean(linkedPropertyId && linkedTenant1Id);

  const stepLabel = t(`leaseWizard.stepLabels.${currentStep}`);

  const handleConfirmDiscard = () => {
    resetWizard();
    setDiscardOpen(false);
    onCancel?.();
  };

  const content = renderStep?.(currentStep) ?? <LeaseWizardStepContent step={currentStep} />;

  const handleDownloadPdf = () => {
    if (!validateFullForm()) {
      toast.error(t('leaseWizard.complete.validationFailed'));
      return;
    }
    const values = form.getValues();
    const blob = leaseAgreementPdfService.generateBlob({ form: values });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lease-agreement-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('leaseWizard.complete.pdfReady'));
  };

  const handleSaveContract = async () => {
    if (!validateFullForm()) {
      toast.error(t('leaseWizard.complete.validationFailed'));
      return;
    }
    if (!linkedPropertyId || !linkedTenant1Id) {
      toast.error(t('leaseWizard.complete.linkRequired'));
      return;
    }
    setSaveLoading(true);
    try {
      const values = form.getValues();
      const contractId = await leaseAgreementService.createLeaseContract({
        form: values,
        tenantId: linkedTenant1Id,
        propertyId: linkedPropertyId,
        landlordId: linkedLandlordOwnerId ?? null,
      });

      const pdfBlob = leaseAgreementPdfService.generateBlob({ form: values });
      const pdfFile = new File(
        [pdfBlob],
        `Lease_Agreement_${contractId.slice(0, 8)}.pdf`,
        { type: 'application/pdf' },
      );
      let pdfAttached = false;
      let pdfUploadMessage: string | undefined;
      try {
        await contractsService.uploadContractPdfAndPersist(pdfFile, contractId);
        pdfAttached = true;
      } catch (uploadErr) {
        pdfUploadMessage = uploadErr instanceof Error ? uploadErr.message : undefined;
      }

      resetWizard();
      if (pdfAttached) {
        toast.success(t('leaseWizard.complete.savedWithPdf'));
      } else {
        toast.warning(t('leaseWizard.complete.savedButPdfFailed'), {
          description: pdfUploadMessage ?? t('leaseWizard.complete.savedButPdfFailedDescription'),
        });
      }
      navigate(generatePath(ROUTES.CONTRACTS_LEASE_DETAIL, { id: contractId }));
    } catch (err) {
      toast.error(t('leaseWizard.complete.saveFailed'), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <Form {...form}>
      <Card className="mx-auto w-full max-w-[700px] border shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1 pr-8">
            <p className="text-sm font-medium text-muted-foreground">
              {t('leaseWizard.stepProgress', {
                current: currentStep,
                total: totalSteps,
                label: stepLabel,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('leaseWizard.percentComplete', { percent: Math.round(getStepProgress()) })}
            </p>
            <Progress value={getStepProgress()} className="mt-3 h-2" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label={t('leaseWizard.close')}
            onClick={() => setDiscardOpen(true)}
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="min-h-[200px]">{content}</div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={isFirstStep}
              className="order-2 sm:order-1"
            >
              {t('leaseWizard.back')}
            </Button>
            <div className="flex flex-col gap-2 order-1 sm:order-2 sm:ml-auto sm:items-end">
              {!isLastStep ? (
                <Button type="button" onClick={handleNext}>
                  {t('leaseWizard.next')}
                </Button>
              ) : (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                  <p className="text-sm text-muted-foreground text-right max-w-md">
                    {t('leaseWizard.complete.summary')}
                  </p>
                  {!canSaveToCrm && (
                    <p className="text-xs text-muted-foreground text-right max-w-md">
                      {t('leaseWizard.complete.linkHint')}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={handleDownloadPdf}>
                      {t('leaseWizard.complete.downloadPdf')}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleSaveContract()}
                      disabled={saveLoading || !canSaveToCrm}
                      title={!canSaveToCrm ? t('leaseWizard.complete.linkRequired') : undefined}
                    >
                      {saveLoading ? t('leaseWizard.complete.saving') : t('leaseWizard.complete.saveContract')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('leaseWizard.discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('leaseWizard.discardDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('leaseWizard.discardCancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>
              {t('leaseWizard.discardConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
