/**
 * Sprint 6B — Step 6: Closing terms.
 */

import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

function safeDaysBetween(startIso: string | null | undefined, endIso: string | null | undefined): number | null {
  if (!startIso || !endIso) return null;
  try {
    const start = parseISO(startIso);
    const end = parseISO(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    return differenceInCalendarDays(end, start);
  } catch {
    return null;
  }
}

export function Step6Closing() {
  const { t } = useTranslation('contracts');
  const { control, watch, setValue, getValues } = useFormContext<PurchaseAgreementFormValues>();

  useEffect(() => {
    const v = getValues('closing_costs_responsibility');
    if (v == null) {
      setValue('closing_costs_responsibility', 'both', { shouldDirty: false, shouldValidate: false });
    }
  }, [getValues, setValue]);

  const closingDate = watch('closing_date');
  const effectiveDate = watch('effective_date');
  const daysFromEffective = safeDaysBetween(effectiveDate, closingDate);
  const todayIso = new Date().toISOString().split('T')[0];
  const daysFromToday = safeDaysBetween(todayIso, closingDate);
  const closingTime = fromStoredTime(watch('closing_time'));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('purchaseWizard.step6.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('purchaseWizard.step6.description')}</p>
      </div>

      <FormField
        control={control}
        name="closing_costs_responsibility"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{t('purchaseWizard.step6.closingCosts')}</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value ?? 'both'}
                onValueChange={field.onChange}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="buyer" id="closing-costs-buyer" />
                  <Label htmlFor="closing-costs-buyer">{t('purchaseWizard.step6.closingCostsOptions.buyer')}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="seller" id="closing-costs-seller" />
                  <Label htmlFor="closing-costs-seller">{t('purchaseWizard.step6.closingCostsOptions.seller')}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="both" id="closing-costs-both" />
                  <Label htmlFor="closing-costs-both">{t('purchaseWizard.step6.closingCostsOptions.both')}</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="closing_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('purchaseWizard.step6.closingDate')}</FormLabel>
              <p className={`text-xs ${COLORS.muted.text}`}>{t('purchaseWizard.step6.closingDateNote')}</p>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="closing_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('purchaseWizard.step6.closingTime')}</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={closingTime.time}
                    onChange={(e) => {
                      const next = toStoredTime(e.target.value, closingTime.meridiem);
                      field.onChange(next || null);
                    }}
                  />
                  <select
                    aria-label={t('purchaseWizard.step6.timeAmPm')}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={closingTime.meridiem}
                    onChange={(e) => {
                      const nextMeridiem = e.target.value as 'AM' | 'PM';
                      const next = toStoredTime(closingTime.time, nextMeridiem);
                      setValue('closing_time', next || null, { shouldValidate: true, shouldDirty: true });
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
      </div>

      <FormField
        control={control}
        name="title_company"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('purchaseWizard.step6.titleCompany')}</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} placeholder={t('purchaseWizard.step6.titleCompanyPlaceholder')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {(daysFromEffective != null || daysFromToday != null) && (
        <div className="flex flex-wrap gap-2">
          {daysFromEffective != null && (
            <Badge variant="secondary">
              {t('purchaseWizard.step6.badgeFromEffective', { days: daysFromEffective })}
            </Badge>
          )}
          {daysFromToday != null && (
            <Badge variant="secondary">{t('purchaseWizard.step6.badgeFromToday', { days: daysFromToday })}</Badge>
          )}
        </div>
      )}

      <Alert className={`${COLORS.info.bgLight} ${COLORS.border.color}`}>
        <Info className={`h-4 w-4 ${COLORS.info.text}`} />
        <AlertTitle>{t('purchaseWizard.step6.fundsTitle')}</AlertTitle>
        <AlertDescription>{t('purchaseWizard.step6.fundsBody')}</AlertDescription>
      </Alert>
    </div>
  );
}

