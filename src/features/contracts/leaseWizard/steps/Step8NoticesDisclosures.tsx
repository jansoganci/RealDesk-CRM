/**
 * Sprint 6A T13 — Step 8: Notice addresses, lead-based paint disclosure, additional terms.
 */

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { LeaseAgreementFormValues } from '@/features/contracts/schemas/leaseAgreementForm.schema';

const DELIVERY_METHODS = ['in_person', 'email', 'mail'] as const;

function triStateValue(v: boolean | null | undefined): 'yes' | 'no' | 'unknown' {
  if (v === true) return 'yes';
  if (v === false) return 'no';
  return 'unknown';
}

function triStateToBool(v: 'yes' | 'no' | 'unknown'): boolean | null {
  if (v === 'yes') return true;
  if (v === 'no') return false;
  return null;
}

/** Pre-1978 or unknown year → federal lead paint disclosure required (EPA). */
function showLeadPaintDisclosure(yearBuilt: LeaseAgreementFormValues['year_built']): boolean {
  return !yearBuilt || parseInt(String(yearBuilt), 10) < 1978;
}

export function Step8NoticesDisclosures() {
  const { t } = useTranslation('contracts');
  const { control, watch, setValue } = useFormContext<LeaseAgreementFormValues>();

  const yearBuilt = watch('year_built');
  const knownHazards = watch('lead_paint_known_hazards');
  const recordsAvail = watch('lead_paint_records_available');
  const pamphletDelivered = watch('lead_paint_pamphlet_delivered');
  const additionalTerms = watch('additional_terms') ?? '';

  const showLeadPaint = showLeadPaintDisclosure(yearBuilt);

  useEffect(() => {
    setValue('lead_paint_disclosure_required', showLeadPaint, { shouldDirty: false });
  }, [showLeadPaint, setValue]);
  const yearUnknown =
    yearBuilt == null || (typeof yearBuilt === 'number' && Number.isNaN(yearBuilt));

  const yearLabel =
    yearUnknown
      ? t('leaseWizard.step8.yearUnknown')
      : t('leaseWizard.step8.yearBuiltValue', { year: yearBuilt });

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('leaseWizard.step8.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('leaseWizard.step8.description')}</p>
      </div>

      <section className="space-y-4">
        <h4 className="text-sm font-medium">{t('leaseWizard.step8.noticesSection')}</h4>
        <p className="text-xs text-muted-foreground">{t('leaseWizard.step8.noticesHelp')}</p>
        <FormField
          control={control}
          name="landlord_notice_custom_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step8.landlordNotice')}</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ''} rows={3} placeholder={t('leaseWizard.step8.noticePlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="tenant_notice_custom_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step8.tenantNotice')}</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ''} rows={3} placeholder={t('leaseWizard.step8.noticePlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium">{t('leaseWizard.step8.leadSection')}</h4>
          <p className="text-xs text-muted-foreground">{t('leaseWizard.step8.leadYearBuiltLine', { label: yearLabel })}</p>
        </div>

        {showLeadPaint && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            {t('leaseWizard.step8.leadBannerFederal')}
          </p>
        )}

        {showLeadPaint && yearUnknown && (
          <p className="text-sm text-muted-foreground">{t('leaseWizard.step8.leadUnknownYearNote')}</p>
        )}

        {!showLeadPaint && (
          <p className="rounded-md border border-emerald-200 bg-success/15 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            {t('leaseWizard.step8.leadPost1978Note')}
          </p>
        )}

        {showLeadPaint && (
          <>
            <div className="space-y-2">
              <FormLabel className="text-base">{t('leaseWizard.step8.knownHazards')}</FormLabel>
              <p className="text-xs text-muted-foreground">{t('leaseWizard.step8.knownHazardsHelp')}</p>
              <FormField
                control={control}
                name="lead_paint_known_hazards"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={triStateValue(field.value)}
                        onValueChange={(v) =>
                          field.onChange(triStateToBool(v as 'yes' | 'no' | 'unknown'))
                        }
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="haz-yes" />
                          <Label htmlFor="haz-yes" className="font-normal">
                            {t('leaseWizard.step7.yes')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="haz-no" />
                          <Label htmlFor="haz-no" className="font-normal">
                            {t('leaseWizard.step7.no')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="unknown" id="haz-unk" />
                          <Label htmlFor="haz-unk" className="font-normal">
                            {t('leaseWizard.step7.unspecified')}
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {knownHazards === true && (
              <FormField
                control={control}
                name="lead_paint_hazard_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('leaseWizard.step8.hazardDescription')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ''} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-2">
              <FormLabel className="text-base">{t('leaseWizard.step8.recordsAvailable')}</FormLabel>
              <FormField
                control={control}
                name="lead_paint_records_available"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={triStateValue(field.value)}
                        onValueChange={(v) =>
                          field.onChange(triStateToBool(v as 'yes' | 'no' | 'unknown'))
                        }
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="rec-yes" />
                          <Label htmlFor="rec-yes" className="font-normal">
                            {t('leaseWizard.step7.yes')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="rec-no" />
                          <Label htmlFor="rec-no" className="font-normal">
                            {t('leaseWizard.step7.no')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="unknown" id="rec-unk" />
                          <Label htmlFor="rec-unk" className="font-normal">
                            {t('leaseWizard.step7.unspecified')}
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {recordsAvail === true && (
              <FormField
                control={control}
                name="lead_paint_records_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('leaseWizard.step8.recordsDescription')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ''} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-3 rounded-md border border-border p-4">
              <FormField
                control={control}
                name="lead_paint_pamphlet_delivered"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <FormLabel>{t('leaseWizard.step8.pamphletSection')}</FormLabel>
                      <div className="flex items-center gap-2">
                        <Switch id="pamphlet" checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor="pamphlet" className="text-sm font-normal">
                          {t('leaseWizard.step8.pamphletToggle')}
                        </Label>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {pamphletDelivered && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={control}
                    name="lead_paint_pamphlet_delivery_method"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2 space-y-2">
                        <FormLabel>{t('leaseWizard.step8.deliveryMethod')}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                            className="grid gap-2"
                          >
                            {DELIVERY_METHODS.map((id) => (
                              <div key={id} className="flex items-center space-x-2">
                                <RadioGroupItem value={id} id={`dm-${id}`} />
                                <Label htmlFor={`dm-${id}`} className="font-normal">
                                  {t(`leaseWizard.step8.deliveryMethods.${id}`)}
                                </Label>
                              </div>
                            ))}
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
                        <FormLabel>{t('leaseWizard.step8.deliveryDate')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <Separator />

      <section className="space-y-2">
        <h4 className="text-sm font-medium">{t('leaseWizard.step8.additionalTermsSection')}</h4>
        <p className="text-xs text-muted-foreground">{t('leaseWizard.step8.additionalTermsHelp')}</p>
        <FormField
          control={control}
          name="additional_terms"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea {...field} value={field.value ?? ''} rows={6} />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                {t('leaseWizard.step8.additionalTermsCount', { count: additionalTerms.length })}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>
    </div>
  );
}
