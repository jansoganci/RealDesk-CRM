/**
 * Sprint 6B T7 — Purchase wizard shell: progress bar, navigation, draft save, discard dialog.
 * T12 — Final step: validate, save via RPC, attach PDF, go to deal.
 */

import { useState, type ReactNode } from 'react';
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Form } from '@/components/ui/form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

import { ROUTES } from '@/config/constants';
import { useAuth } from '@/contexts/AuthContext';
import { assertPurchaseDocumentJurisdiction } from '@/features/contracts/utils/documentJurisdiction';
import {
  purchaseAgreementPdfService,
  purchaseAgreementService,
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
import { DocumentPropertyEntryGuard } from '@/features/contracts/components/DocumentPropertyEntryGuard';

import { PurchaseWizardStepContent } from './PurchaseWizardStepContent';
import { usePurchaseWizard } from './usePurchaseWizard';

export type PurchaseWizardProps = {
  onCancel?: () => void;
  renderStep?: (step: number) => ReactNode;
};

export function PurchaseWizard({ onCancel, renderStep }: PurchaseWizardProps) {
  const { t } = useTranslation('contracts');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [pendingFhaFile, setPendingFhaFile] = useState<File | null>(null);
  const [pendingVaFile, setPendingVaFile] = useState<File | null>(null);
  const [submitPhase, setSubmitPhase] = useState<
    'idle' | 'saving' | 'pdf' | 'documents' | 'almost'
  >('idle');

  const wizard = usePurchaseWizard({ userId: user?.id });
  const {
    form,
    currentStep,
    totalSteps,
    goToStep,
    handleNext,
    handleBack,
    validateFullForm,
    getStepProgress,
    isFirstStep,
    isLastStep,
    resetWizard,
    persistDraftNow,
  } = wizard;

  const linkedPropertyId = form.watch('linkedPropertyId');
  const dealIdFromUrl = searchParams.get('dealId');
  const contractIdFromUrl = searchParams.get('contractId');
  const canSaveToCrm = Boolean(linkedPropertyId);

  const stepLabel = t(`purchaseWizard.stepLabels.${currentStep}`);

  const handleConfirmDiscard = () => {
    resetWizard();
    setDiscardOpen(false);
    onCancel?.();
  };

  const content =
    renderStep?.(currentStep) ?? (
      <PurchaseWizardStepContent
        step={currentStep}
        onEditStep={goToStep}
        onGenerate={() => void handleSaveContract()}
        isGenerating={saveLoading}
        pendingFhaFile={pendingFhaFile}
        pendingVaFile={pendingVaFile}
        onPendingFhaFile={setPendingFhaFile}
        onPendingVaFile={setPendingVaFile}
      />
    );

  const handleSaveDraftExplicit = () => {
    if (!user?.id) {
      toast.error(t('purchaseWizard.draftNeedsLogin'));
      return;
    }
    persistDraftNow();
    toast.success(t('purchaseWizard.draftSaved'));
  };

  const handleDownloadPdf = () => {
    if (!validateFullForm()) {
      toast.error(t('purchaseWizard.complete.validationFailed'));
      return;
    }
    const values = form.getValues();
    try {
      const blob = purchaseAgreementPdfService.generateBlob({ form: values });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `purchase-agreement-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('purchaseWizard.complete.pdfReady'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('purchaseWizard.complete.validationFailed'));
    }
  };

  const handleSaveContract = async () => {
    if (!validateFullForm()) {
      toast.error(t('purchaseWizard.complete.validationFailed'));
      return;
    }
    if (!linkedPropertyId) {
      toast.error(t('purchaseWizard.complete.linkRequired'));
      return;
    }
    const values = form.getValues();
    try {
      assertPurchaseDocumentJurisdiction(values.property_state, values.governing_law_state);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('documentStateGuard.message'));
      return;
    }

    setSubmitPhase('saving');
    setSaveLoading(true);
    try {
      let contract_id: string;
      let deal_id: string;

      const fin = values.financing_type;
      const bank = values.bank_loan_type;
      const legacyDraftSync =
        Boolean(contractIdFromUrl) &&
        fin === 'bank_financing' &&
        (bank === 'fha' || bank === 'va');

      if (legacyDraftSync && contractIdFromUrl) {
        const synced = await purchaseAgreementService.syncPurchaseContractFromWizardComplete(
          contractIdFromUrl,
          values,
        );
        contract_id = contractIdFromUrl;
        deal_id = synced.deal_id;
      } else {
        const created = await purchaseAgreementService.createPurchaseContract({
          form: values,
          dealId: dealIdFromUrl ?? undefined,
        });
        contract_id = created.contract_id;
        deal_id = created.deal_id;
      }

      setSubmitPhase('pdf');
      let pdfAttached = false;
      let pdfUploadMessage: string | undefined;
      try {
        await purchaseAgreementService.regeneratePurchaseAgreementPdf(contract_id, 1);
        pdfAttached = true;
      } catch (uploadErr) {
        pdfUploadMessage = uploadErr instanceof Error ? uploadErr.message : undefined;
      }

      setSubmitPhase('documents');
      const isFha = fin === 'bank_financing' && bank === 'fha';
      const isVa = fin === 'bank_financing' && bank === 'va';

      if (isFha) {
        if (pendingFhaFile) {
          try {
            await purchaseAgreementService.uploadFHAAddendum(contract_id, pendingFhaFile);
          } catch {
            toast.warning(t('purchaseWizard.complete.fhaUploadFailed'));
          }
        } else {
          try {
            await purchaseAgreementService.markPurchaseContractIncompleteForMissingAddendum(contract_id);
          } catch {
            /* non-blocking */
          }
        }
      }
      if (isVa) {
        if (pendingVaFile) {
          try {
            await purchaseAgreementService.uploadVAAddendum(contract_id, pendingVaFile);
          } catch {
            toast.warning(t('purchaseWizard.complete.vaUploadFailed'));
          }
        } else {
          try {
            await purchaseAgreementService.markPurchaseContractIncompleteForMissingAddendum(contract_id);
          } catch {
            /* non-blocking */
          }
        }
      }

      setSubmitPhase('almost');
      setPendingFhaFile(null);
      setPendingVaFile(null);
      resetWizard();
      if (pdfAttached) {
        toast.success(t('purchaseWizard.complete.savedWithPdf'));
      } else {
        toast.warning(t('purchaseWizard.complete.savedButPdfFailed'), {
          description: pdfUploadMessage ?? t('purchaseWizard.complete.savedButPdfFailedDescription'),
        });
      }
      navigate(generatePath(ROUTES.DEAL_DETAIL, { id: deal_id }));
    } catch (err) {
      toast.error(t('purchaseWizard.complete.saveFailed'), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaveLoading(false);
      setSubmitPhase('idle');
    }
  };

  const submitPhaseLabel =
    submitPhase === 'saving'
      ? t('purchaseWizard.submitPhase.savingContract')
      : submitPhase === 'pdf'
        ? t('purchaseWizard.submitPhase.generatingPdf')
        : submitPhase === 'documents'
          ? t('purchaseWizard.submitPhase.uploadingDocuments')
          : submitPhase === 'almost'
            ? t('purchaseWizard.submitPhase.almostDone')
            : '';

  const progressPercent = Math.round(getStepProgress());

  return (
    <DocumentPropertyEntryGuard>
      <Form {...form}>
      {saveLoading ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
          <p className="max-w-sm px-4 text-center text-sm font-medium text-foreground">{submitPhaseLabel}</p>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[88rem] flex-col">
        <Card className="flex max-h-[calc(100dvh-8.5rem)] flex-col overflow-hidden border shadow-sm sm:max-h-[calc(100dvh-10rem)]">
          <CardHeader className="shrink-0 space-y-3 border-b pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1 pr-2">
                <p className="text-sm font-medium text-foreground">
                  {t('purchaseWizard.stepProgress', {
                    current: currentStep,
                    total: totalSteps,
                    label: stepLabel,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('purchaseWizard.percentComplete', { percent: progressPercent })}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={t('purchaseWizard.close')}
                onClick={() => setDiscardOpen(true)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {content}
          </CardContent>

          <div className="shrink-0 space-y-3 border-t bg-card px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={isFirstStep}
                className="order-2 sm:order-1"
              >
                {t('purchaseWizard.back')}
              </Button>
              <div className="order-1 flex flex-col gap-2 sm:order-2 sm:ml-auto sm:items-end">
                {!isLastStep ? (
                  <Button type="button" onClick={handleNext} className="w-full sm:w-auto">
                    {t('purchaseWizard.next')}
                  </Button>
                ) : (
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                    <p className="max-w-md text-right text-sm text-muted-foreground">
                      {t('purchaseWizard.complete.summary')}
                    </p>
                    {!canSaveToCrm && (
                      <p className="max-w-md text-right text-xs text-muted-foreground">
                        {t('purchaseWizard.complete.linkHint')}
                      </p>
                    )}
                    {dealIdFromUrl && (
                      <p className="max-w-md text-right text-xs text-muted-foreground">
                        {t('purchaseWizard.complete.dealPrefillHint')}
                      </p>
                    )}
                    {currentStep !== 9 && (
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleDownloadPdf}>
                          {t('purchaseWizard.complete.downloadPdf')}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => void handleSaveContract()}
                          disabled={saveLoading || !canSaveToCrm}
                          title={!canSaveToCrm ? t('purchaseWizard.complete.linkRequired') : undefined}
                        >
                          {saveLoading
                            ? t('purchaseWizard.complete.saving')
                            : t('purchaseWizard.complete.saveContract')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-center">
              <Button type="button" variant="secondary" size="sm" onClick={handleSaveDraftExplicit}>
                {t('purchaseWizard.saveDraftLater')}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('purchaseWizard.discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('purchaseWizard.discardDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('purchaseWizard.discardCancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>
              {t('purchaseWizard.discardConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </Form>
    </DocumentPropertyEntryGuard>
  );
}
