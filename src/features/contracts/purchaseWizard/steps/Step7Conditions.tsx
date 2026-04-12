/**
 * Sprint 6B — Step 7: Conditions and contingencies.
 */

import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { COLORS } from '@/config/colors';
import type { PurchaseAgreementFormValues } from '@/features/contracts/schemas/purchaseAgreementForm.schema';

function fromStoredTime(v: string | null | undefined): { time: string; meridiem: 'AM' | 'PM' } {
  const raw = (v ?? '').trim();
  if (!raw) return { time: '', meridiem: 'PM' };
  const m = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m) {
    const hour = Number(m[1]);
    const minute = m[2];
    const meridiem = m[3].toUpperCase() as 'AM' | 'PM';
    const hh24 = meridiem === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    return { time: `${String(hh24).padStart(2, '0')}:${minute}`, meridiem };
  }
  return { time: '', meridiem: 'PM' };
}

function toStoredTime(time24: string, meridiem: 'AM' | 'PM'): string {
  if (!time24) return '';
  const [hhRaw, mm] = time24.split(':');
  const hh = Number(hhRaw);
  if (Number.isNaN(hh) || !mm) return '';
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${mm} ${meridiem}`;
}

function asDateLabel(v: string | null | undefined): string {
  return v?.trim() || '—';
}

export function Step7Conditions() {
  const { t } = useTranslation('contracts');
  const { control, watch, setValue, getValues } = useFormContext<PurchaseAgreementFormValues>();

  const propertyType = watch('property_type');
  const mineralRights = watch('mineral_rights_transferred');
  const condoAutoApplied = useRef(false);

  const inspectionDate = watch('inspection_contractor_deadline_date');
  const disclosureDate = watch('inspection_disclosures_deadline_date');
  const appraisalContingency = watch('appraisal_contingency');
  const financingType = watch('financing_type');
  const bankContingent = watch('bank_contingent_on_sale') || watch('contingent_on_other_property');

  const inspectionTime = fromStoredTime(watch('inspection_contractor_deadline_time'));
  const disclosureTime = fromStoredTime(watch('inspection_disclosures_deadline_time'));

  useEffect(() => {
    if (propertyType === 'condominium' && !condoAutoApplied.current) {
      setValue('mineral_rights_transferred', false, { shouldDirty: true, shouldValidate: true });
      condoAutoApplied.current = true;
    }
  }, [propertyType, setValue]);

  useEffect(() => {
    if (getValues('survey_buyer_notification_days') == null) {
      setValue('survey_buyer_notification_days', 10, { shouldDirty: true });
    }
    if (getValues('survey_seller_remedy_days') == null) {
      setValue('survey_seller_remedy_days', 10, { shouldDirty: true });
    }
    if (getValues('title_buyer_review_days') == null) {
      setValue('title_buyer_review_days', 10, { shouldDirty: true });
    }
    if (getValues('title_seller_remedy_days') == null) {
      setValue('title_seller_remedy_days', 10, { shouldDirty: true });
    }
  }, [getValues, setValue]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('purchaseWizard.step7.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('purchaseWizard.step7.description')}</p>
      </div>

      <section className="space-y-4 rounded-lg border p-4">
        <h4 className="text-sm font-medium">{t('purchaseWizard.step7.surveySection')}</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="survey_buyer_notification_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step7.surveyBuyerDays')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="survey_seller_remedy_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step7.surveySellerDays')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h4 className="text-sm font-medium">{t('purchaseWizard.step7.mineralSection')}</h4>
        {propertyType === 'condominium' && !mineralRights && (
          <Alert className={`${COLORS.info.bgLight} ${COLORS.border.color}`}>
            <Info className={`h-4 w-4 ${COLORS.info.text}`} />
            <AlertDescription>{t('purchaseWizard.step7.condoAutoBanner')}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={control}
          name="mineral_rights_transferred"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border px-3 py-2">
              <FormLabel className="m-0">{t('purchaseWizard.step7.mineralTransferred')}</FormLabel>
              <FormControl>
                <Switch checked={!!field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h4 className="text-sm font-medium">{t('purchaseWizard.step7.titleSection')}</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="title_buyer_review_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step7.titleBuyerDays')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="title_seller_remedy_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step7.titleSellerDays')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h4 className="text-sm font-medium">{t('purchaseWizard.step7.inspectionSection')}</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="inspection_contractor_deadline_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step7.inspectionContractorDate')}</FormLabel>
                <p className={`text-xs ${COLORS.muted.text}`}>{t('purchaseWizard.step7.inspectionContractorDateHelp')}</p>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="inspection_contractor_deadline_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step7.inspectionContractorTime')}</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={inspectionTime.time}
                      onChange={(e) => field.onChange(toStoredTime(e.target.value, inspectionTime.meridiem) || null)}
                    />
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={inspectionTime.meridiem}
                      onChange={(e) => {
                        const next = toStoredTime(inspectionTime.time, e.target.value as 'AM' | 'PM');
                        setValue('inspection_contractor_deadline_time', next || null, { shouldDirty: true, shouldValidate: true });
                      }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="inspection_disclosures_deadline_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step7.inspectionDisclosuresDate')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="inspection_disclosures_deadline_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step7.inspectionDisclosuresTime')}</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={disclosureTime.time}
                      onChange={(e) => field.onChange(toStoredTime(e.target.value, disclosureTime.meridiem) || null)}
                    />
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={disclosureTime.meridiem}
                      onChange={(e) => {
                        const next = toStoredTime(disclosureTime.time, e.target.value as 'AM' | 'PM');
                        setValue('inspection_disclosures_deadline_time', next || null, { shouldDirty: true, shouldValidate: true });
                      }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="inspection_negotiation_days"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('purchaseWizard.step7.inspectionNegotiationDays')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h4 className="text-sm font-medium">{t('purchaseWizard.step7.appraisalSection')}</h4>
        <FormField
          control={control}
          name="appraisal_contingency"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border px-3 py-2">
              <FormLabel className="m-0">{t('purchaseWizard.step7.appraisalToggle')}</FormLabel>
              <FormControl>
                <Switch checked={!!field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {appraisalContingency && (
          <FormField
            control={control}
            name="appraisal_negotiation_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step7.appraisalNegotiationDays')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </section>

      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{t('purchaseWizard.step7.activeContingenciesTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {inspectionDate || disclosureDate || appraisalContingency || financingType === 'bank_financing' || bankContingent ? (
            <>
              <p>{t('purchaseWizard.step7.summaryRows.inspection', { date: asDateLabel(inspectionDate) })}</p>
              <p>{t('purchaseWizard.step7.summaryRows.disclosure', { date: asDateLabel(disclosureDate) })}</p>
              <p>{t('purchaseWizard.step7.summaryRows.appraisal', { value: appraisalContingency ? t('purchaseWizard.step4.yes') : t('purchaseWizard.step4.no') })}</p>
              <p>
                {t('purchaseWizard.step7.summaryRows.financing', {
                  value: financingType === 'bank_financing' ? t('purchaseWizard.step4.yes') : t('purchaseWizard.step4.no'),
                })}
              </p>
              <p>
                {t('purchaseWizard.step7.summaryRows.sale', {
                  value: bankContingent ? t('purchaseWizard.step4.yes') : t('purchaseWizard.step4.no'),
                })}
              </p>
            </>
          ) : (
            <p className={COLORS.muted.text}>{t('purchaseWizard.step7.activeContingenciesNone')}</p>
          )}
          <p className={`pt-2 text-xs ${COLORS.muted.text}`}>{t('purchaseWizard.step7.activeContingenciesNote')}</p>
        </CardContent>
      </Card>
    </div>
  );
}

