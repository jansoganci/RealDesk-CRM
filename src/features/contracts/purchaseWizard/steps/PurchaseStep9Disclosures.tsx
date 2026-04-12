import { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { KeyDatesCard } from '@/features/contracts/components/KeyDatesCard';
import type { PurchaseAgreementFormValues } from '@/features/contracts/schemas/purchaseAgreementForm.schema';

export type PurchaseStep9DisclosuresProps = {
  onEditStep?: (step: number) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
  pendingFhaFile?: File | null;
  pendingVaFile?: File | null;
  onPendingFhaFile?: (file: File | null) => void;
  onPendingVaFile?: (file: File | null) => void;
};

function notProvided(v: string | null | undefined, fallback: string): string {
  const val = v?.trim();
  return val?.length ? val : fallback;
}

export function PurchaseStep9Disclosures({
  onEditStep,
  onGenerate,
  isGenerating = false,
  pendingFhaFile = null,
  pendingVaFile = null,
  onPendingFhaFile = () => {},
  onPendingVaFile = () => {},
}: PurchaseStep9DisclosuresProps) {
  const { t } = useTranslation('contracts');
  const { control, watch, setValue } = useFormContext<PurchaseAgreementFormValues>();
  const fhaPendingFlag = watch('fha_addendum_pending');
  const vaPendingFlag = watch('va_addendum_pending');
  const [leadOptionalOpen, setLeadOptionalOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const yearBuilt = watch('year_built');
  const isPre1978 = !yearBuilt || yearBuilt < 1978;

  const financingType = watch('financing_type');
  const bankLoanType = watch('bank_loan_type');
  const fhaUploaded = watch('fha_addendum_uploaded');
  const vaUploaded = watch('va_addendum_uploaded');

  const leadSectionOpen = isPre1978 || leadOptionalOpen;

  useEffect(() => {
    setValue('lead_paint_disclosure_required', leadSectionOpen, { shouldDirty: true, shouldValidate: true });
  }, [leadSectionOpen, setValue]);

  const customAddendums = watch('custom_addendums') ?? [];
  const additionalTerms = watch('additional_terms') ?? '';
  const pamphletDelivered = watch('lead_paint_pamphlet_delivered');
  const knownHazards = watch('lead_paint_known_hazards');

  const fhaRequired = financingType === 'bank_financing' && bankLoanType === 'fha';
  const vaRequired = financingType === 'bank_financing' && bankLoanType === 'va';

  const appraisalContingency = watch('appraisal_contingency');

  const steps = useMemo(
    () => [
      {
        step: 1,
        title: t('purchaseWizard.step9.review.step1'),
        value: `${watch('property_street')}, ${watch('property_city')}, ${watch('property_state')} ${watch('property_zip')}`,
      },
      {
        step: 2,
        title: t('purchaseWizard.step9.review.step2'),
        value: `${watch('buyer_name')} / ${watch('seller_name')} / ${watch('effective_date') || '—'}`,
      },
      { step: 3, title: t('purchaseWizard.step9.review.step3'), value: watch('personal_property_description') || '—' },
      {
        step: 4,
        title: t('purchaseWizard.step9.review.step4'),
        value: `${watch('earnest_money_amount') ?? '—'} / ${watch('earnest_money_due_date') || '—'}`,
      },
      {
        step: 5,
        title: t('purchaseWizard.step9.review.step5'),
        value: `${watch('financing_type')} / ${watch('bank_loan_type') || '—'}`,
      },
      {
        step: 6,
        title: t('purchaseWizard.step9.review.step6'),
        value: `${watch('closing_date') || '—'} / ${watch('closing_costs_responsibility') || '—'}`,
      },
      {
        step: 7,
        title: t('purchaseWizard.step9.review.step7'),
        value: `${watch('inspection_contractor_deadline_date') || '—'} / ${watch('inspection_disclosures_deadline_date') || '—'}`,
      },
      {
        step: 8,
        title: t('purchaseWizard.step9.review.step8'),
        value: `${watch('offer_expiration_date') || '—'} / ${watch('governing_law_state') || '—'}`,
      },
    ],
    [t, watch],
  );

  const addCustomAddendum = () => {
    if (customAddendums.length >= 5) return;
    setValue('custom_addendums', [...customAddendums, ''], { shouldDirty: true, shouldValidate: true });
  };

  const updateAddendum = (index: number, value: string) => {
    const next = [...customAddendums];
    next[index] = value;
    setValue('custom_addendums', next, { shouldDirty: true, shouldValidate: true });
  };

  const removeAddendum = (index: number) => {
    const next = customAddendums.filter((_, idx) => idx !== index);
    setValue('custom_addendums', next.length ? next : null, { shouldDirty: true, shouldValidate: true });
  };

  const handleGenerate = () => {
    const needsWarning =
      (fhaRequired && !fhaUploaded && !fhaPendingFlag) || (vaRequired && !vaUploaded && !vaPendingFlag);
    if (needsWarning) {
      setWarningOpen(true);
      return;
    }
    onGenerate?.();
  };

  const buyerAgent = notProvided(watch('buyer_agent_name'), t('purchaseWizard.step9.notProvided'));
  const sellerAgent = notProvided(watch('seller_agent_name'), t('purchaseWizard.step9.notProvided'));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('purchaseWizard.step9.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('purchaseWizard.step9.description')}</p>
      </div>

      <section className="space-y-3 rounded-lg border p-4">
        <h4 className="text-sm font-medium">{t('purchaseWizard.step9.agentsTitle')}</h4>
        <div className="grid gap-2 md:grid-cols-2 text-sm">
          <p>{t('purchaseWizard.step9.buyerAgent', { value: buyerAgent })}</p>
          <p>{t('purchaseWizard.step9.sellerAgent', { value: sellerAgent })}</p>
        </div>
        <p className="text-xs text-muted-foreground">{t('purchaseWizard.step9.agentsNote')}</p>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{t('purchaseWizard.step9.leadPaintTitle')}</h4>
          {!isPre1978 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t('purchaseWizard.step9.leadPaintToggle')}</span>
              <Switch checked={leadOptionalOpen} onCheckedChange={setLeadOptionalOpen} />
            </div>
          )}
        </div>

        {isPre1978 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('purchaseWizard.step9.leadPaintRequiredTitle')}</AlertTitle>
            <AlertDescription>{t('purchaseWizard.step9.leadPaintRequiredBody')}</AlertDescription>
          </Alert>
        ) : (
          <p className="text-xs text-muted-foreground">{t('purchaseWizard.step9.leadPaintNotRequired')}</p>
        )}

        {leadSectionOpen && (
          <div className="space-y-4">
            <FormField
              control={control}
              name="lead_paint_known_hazards"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>{t('purchaseWizard.step9.knownHazardsLabel')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value === null ? '' : field.value ? 'yes' : 'no'}
                      onValueChange={(v) => field.onChange(v === 'yes')}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="no" id="hazard-no" />
                        <FormLabel htmlFor="hazard-no" className="font-normal">
                          {t('purchaseWizard.step9.knownHazardsNo')}
                        </FormLabel>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="yes" id="hazard-yes" />
                        <FormLabel htmlFor="hazard-yes" className="font-normal">
                          {t('purchaseWizard.step9.knownHazardsYes')}
                        </FormLabel>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {knownHazards && (
              <FormField
                control={control}
                name="lead_paint_hazard_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchaseWizard.step9.hazardDescription')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={control}
              name="lead_paint_records_available"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>{t('purchaseWizard.step9.recordsLabel')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value === null ? '' : field.value ? 'yes' : 'no'}
                      onValueChange={(v) => field.onChange(v === 'yes')}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="no" id="records-no" />
                        <FormLabel htmlFor="records-no" className="font-normal">
                          {t('purchaseWizard.step9.recordsNo')}
                        </FormLabel>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="yes" id="records-yes" />
                        <FormLabel htmlFor="records-yes" className="font-normal">
                          {t('purchaseWizard.step9.recordsYes')}
                        </FormLabel>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="lead_paint_pamphlet_delivered"
              render={({ field }) => (
                <FormItem className="flex items-start gap-2 rounded-md border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                  </FormControl>
                  <div>
                    <FormLabel>{t('purchaseWizard.step9.pamphletDelivered')}</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {pamphletDelivered && (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="lead_paint_pamphlet_delivery_method"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>{t('purchaseWizard.step9.deliveryMethod')}</FormLabel>
                      <FormControl>
                        <RadioGroup value={field.value ?? ''} onValueChange={field.onChange}>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="in_person" id="delivery-in-person" />
                            <FormLabel htmlFor="delivery-in-person" className="font-normal">
                              {t('purchaseWizard.step9.deliveryInPerson')}
                            </FormLabel>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="email" id="delivery-email" />
                            <FormLabel htmlFor="delivery-email" className="font-normal">
                              {t('purchaseWizard.step9.deliveryEmail')}
                            </FormLabel>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="mail" id="delivery-mail" />
                            <FormLabel htmlFor="delivery-mail" className="font-normal">
                              {t('purchaseWizard.step9.deliveryMail')}
                            </FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="lead_paint_pamphlet_delivery_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('purchaseWizard.step9.deliveryDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <Alert>
              <AlertDescription>{t('purchaseWizard.step9.leadPaintPurchaseNote')}</AlertDescription>
            </Alert>
          </div>
        )}
      </section>

      {(fhaRequired || vaRequired) && (
        <section className="space-y-4 rounded-lg border p-4">
          <h4 className="text-sm font-medium">{t('purchaseWizard.step9.addenda.title')}</h4>
          <p className="text-xs text-muted-foreground">{t('purchaseWizard.step9.addenda.willUploadOnGenerate')}</p>

          {fhaRequired && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  {t('purchaseWizard.step9.addenda.fhaTitle')}
                  <Badge
                    variant={
                      fhaUploaded || fhaPendingFlag ? 'secondary' : 'destructive'
                    }
                  >
                    {fhaUploaded
                      ? t('purchaseWizard.step9.addenda.uploaded')
                      : fhaPendingFlag
                        ? t('purchaseWizard.step9.addenda.selectedPending')
                        : t('purchaseWizard.step9.addenda.requiredMissing')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  type="file"
                  accept=".pdf,application/pdf"
                  disabled={isGenerating}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    onPendingFhaFile(f);
                    setValue('fha_addendum_pending', Boolean(f), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    e.target.value = '';
                  }}
                />
                {pendingFhaFile ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate">{pendingFhaFile.name}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onPendingFhaFile(null);
                        setValue('fha_addendum_pending', false, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    >
                      {t('purchaseWizard.step9.addenda.clearFile')}
                    </Button>
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">{t('purchaseWizard.step9.addenda.fhaHelp')}</p>
              </CardContent>
            </Card>
          )}

          {vaRequired && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  {t('purchaseWizard.step9.addenda.vaTitle')}
                  <Badge
                    variant={
                      vaUploaded || vaPendingFlag ? 'secondary' : 'destructive'
                    }
                  >
                    {vaUploaded
                      ? t('purchaseWizard.step9.addenda.uploaded')
                      : vaPendingFlag
                        ? t('purchaseWizard.step9.addenda.selectedPending')
                        : t('purchaseWizard.step9.addenda.requiredMissing')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  type="file"
                  accept=".pdf,application/pdf"
                  disabled={isGenerating}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    onPendingVaFile(f);
                    setValue('va_addendum_pending', Boolean(f), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    e.target.value = '';
                  }}
                />
                {pendingVaFile ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate">{pendingVaFile.name}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onPendingVaFile(null);
                        setValue('va_addendum_pending', false, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    >
                      {t('purchaseWizard.step9.addenda.clearFile')}
                    </Button>
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">{t('purchaseWizard.step9.addenda.vaHelp')}</p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      <section className="space-y-4 rounded-lg border p-4">
        <h4 className="text-sm font-medium">{t('purchaseWizard.step9.customAddendumsTitle')}</h4>
        <div className="space-y-2">
          {customAddendums.map((value, idx) => (
            <div key={`${idx}-${value}`} className="flex gap-2">
              <Input
                value={value}
                onChange={(e) => updateAddendum(idx, e.target.value)}
                placeholder={t('purchaseWizard.step9.customAddendumPlaceholder', { n: idx + 1 })}
              />
              <Button type="button" variant="outline" onClick={() => removeAddendum(idx)}>
                ×
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addCustomAddendum} disabled={customAddendums.length >= 5}>
            {t('purchaseWizard.step9.addCustomAddendum')}
          </Button>
        </div>

        <FormField
          control={control}
          name="additional_terms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('purchaseWizard.step9.additionalTerms')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  maxLength={2000}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                {t('purchaseWizard.step9.charCount', { count: additionalTerms.length, max: 2000 })}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h4 className="text-sm font-medium">{t('purchaseWizard.step9.reviewTitle')}</h4>
        <Accordion type="single" collapsible className="w-full">
          {steps.map((entry) => (
            <AccordionItem key={entry.step} value={`step-${entry.step}`}>
              <AccordionTrigger>{entry.title}</AccordionTrigger>
              <AccordionContent>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-muted-foreground">{entry.value}</p>
                  <Button type="button" variant="ghost" size="sm" onClick={() => onEditStep?.(entry.step)}>
                    {t('purchaseWizard.step9.edit')}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <KeyDatesCard
          effectiveDate={watch('effective_date') || undefined}
          earnestMoneyDueDate={watch('earnest_money_due_date') || undefined}
          inspectionDeadline={watch('inspection_contractor_deadline_date') || undefined}
          appraisalContingency={appraisalContingency}
          closingDate={watch('closing_date') || undefined}
        />

        <Button type="button" className="w-full" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? t('purchaseWizard.complete.saving') : t('purchaseWizard.step9.generate')}
        </Button>
      </section>

      <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('purchaseWizard.step9.warningDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('purchaseWizard.step9.warningDialog.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('purchaseWizard.step9.warningDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setWarningOpen(false);
                onGenerate?.();
              }}
            >
              {t('purchaseWizard.step9.warningDialog.continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

