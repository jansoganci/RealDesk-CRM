import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { US_STATES } from '@/lib/serviceProxy';
import type { PurchaseAgreementFormValues } from '@/features/contracts/schemas/purchaseAgreementForm.schema';

function fromStoredTime(v: string | null | undefined): { time: string; meridiem: 'AM' | 'PM' } {
  const raw = (v ?? '').trim();
  if (!raw) return { time: '', meridiem: 'PM' };
  const m = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return { time: '', meridiem: 'PM' };
  const hour = Number(m[1]);
  const minute = m[2];
  const meridiem = m[3].toUpperCase() as 'AM' | 'PM';
  const hh24 = meridiem === 'AM' ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12;
  return { time: `${String(hh24).padStart(2, '0')}:${minute}`, meridiem };
}

function toStoredTime(time24: string, meridiem: 'AM' | 'PM'): string {
  if (!time24) return '';
  const [hhRaw, mm] = time24.split(':');
  const hh = Number(hhRaw);
  if (Number.isNaN(hh) || !mm) return '';
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${mm} ${meridiem}`;
}

export function PurchaseStep8Legal() {
  const { t } = useTranslation('contracts');
  const { control, watch, setValue, getValues, setError, clearErrors } =
    useFormContext<PurchaseAgreementFormValues>();

  const propertyState = watch('property_state');
  const governingState = watch('governing_law_state');
  const closingDate = watch('closing_date');
  const expirationDate = watch('offer_expiration_date');
  const expirationTime = fromStoredTime(watch('offer_expiration_time'));

  useEffect(() => {
    if (!governingState && propertyState) {
      setValue('governing_law_state', propertyState as PurchaseAgreementFormValues['governing_law_state'], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [governingState, propertyState, setValue]);

  useEffect(() => {
    if (getValues('earnest_money_return_days') == null) {
      setValue('earnest_money_return_days', 5, { shouldDirty: true, shouldValidate: true });
    }
  }, [getValues, setValue]);

  useEffect(() => {
    if (expirationDate && closingDate && expirationDate > closingDate) {
      setError('offer_expiration_date', {
        type: 'manual',
        message: t('purchaseWizard.step8.expirationDateOrderError'),
      });
      return;
    }
    clearErrors('offer_expiration_date');
  }, [expirationDate, closingDate, clearErrors, setError, t]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('purchaseWizard.step8.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('purchaseWizard.step8.description')}</p>
      </div>

      <section className="space-y-4 rounded-lg border p-4">
        <h4 className="text-sm font-medium">{t('purchaseWizard.step8.offerExpirationSection')}</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="offer_expiration_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step8.offerExpirationDate')}</FormLabel>
                <p className="text-xs text-muted-foreground">{t('purchaseWizard.step8.offerExpirationDateHelp')}</p>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="offer_expiration_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step8.offerExpirationTime')}</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={expirationTime.time}
                      onChange={(e) =>
                        field.onChange(toStoredTime(e.target.value, expirationTime.meridiem) || null)
                      }
                    />
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={expirationTime.meridiem}
                      onChange={(e) => {
                        const next = toStoredTime(expirationTime.time, e.target.value as 'AM' | 'PM');
                        setValue('offer_expiration_time', next || null, { shouldDirty: true, shouldValidate: true });
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
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h4 className="text-sm font-medium">{t('purchaseWizard.step8.governingLawSection')}</h4>
        <FormField
          control={control}
          name="governing_law_state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('purchaseWizard.step8.governingLawState')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('purchaseWizard.step8.governingLawPlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[280px]">
                  {US_STATES.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('purchaseWizard.step8.governingLawHelp')}</p>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h4 className="text-sm font-medium">{t('purchaseWizard.step8.terminationSection')}</h4>
        <FormField
          control={control}
          name="earnest_money_return_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('purchaseWizard.step8.earnestMoneyReturnDays')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  step={1}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">{t('purchaseWizard.step8.infoCards.buyerDefault.title')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('purchaseWizard.step8.infoCards.buyerDefault.body')}
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">{t('purchaseWizard.step8.infoCards.sellerDefault.title')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('purchaseWizard.step8.infoCards.sellerDefault.body')}
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">{t('purchaseWizard.step8.infoCards.disputeResolution.title')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('purchaseWizard.step8.infoCards.disputeResolution.body')}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

