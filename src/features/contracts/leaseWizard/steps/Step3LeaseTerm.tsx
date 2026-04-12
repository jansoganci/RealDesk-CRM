/**
 * Sprint 6A T11 — Step 3: Lease type, dates, after-term action (standard), termination notice (M2M), duration badge.
 */

import { useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { differenceInCalendarMonths, formatDistanceStrict, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import type { LeaseAgreementFormValues } from '@/features/contracts/schemas/leaseAgreementForm.schema';

function formatLeaseDuration(startIso: string, endIso: string): string | null {
  try {
    const start = parseISO(startIso);
    const end = parseISO(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return null;
    }
    return formatDistanceStrict(start, end, { locale: enUS });
  } catch {
    return null;
  }
}

export function Step3LeaseTerm() {
  const { t } = useTranslation('contracts');
  const { control, watch, setValue } = useFormContext<LeaseAgreementFormValues>();

  const leaseType = watch('lease_type');
  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const noticeDays = watch('termination_notice_days');

  useEffect(() => {
    if (leaseType === 'month_to_month') {
      setValue('after_term_action', null);
    }
  }, [leaseType, setValue]);

  const durationLabel = useMemo(() => {
    if (leaseType === 'month_to_month') {
      return t('leaseWizard.step3.durationMonthToMonth', {
        days: noticeDays ?? 30,
      });
    }
    const formatted = formatLeaseDuration(startDate, endDate);
    if (!formatted) return t('leaseWizard.step3.durationInvalid');
    let monthsApart = 0;
    try {
      monthsApart = differenceInCalendarMonths(parseISO(endDate), parseISO(startDate));
    } catch {
      monthsApart = 0;
    }
    return t('leaseWizard.step3.durationStandard', { label: formatted, months: monthsApart });
  }, [leaseType, startDate, endDate, noticeDays, t]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('leaseWizard.step3.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('leaseWizard.step3.description')}</p>
      </div>

      <FormField
        control={control}
        name="lease_type"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{t('leaseWizard.step3.leaseType')}</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  if (v === 'month_to_month') {
                    setValue('after_term_action', null);
                  } else {
                    setValue('after_term_action', 'terminate');
                  }
                }}
                className="grid gap-3 sm:grid-cols-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="lt-standard" />
                  <Label htmlFor="lt-standard" className="font-normal">
                    {t('leaseWizard.step3.leaseTypes.standard')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="month_to_month" id="lt-m2m" />
                  <Label htmlFor="lt-m2m" className="font-normal">
                    {t('leaseWizard.step3.leaseTypes.monthToMonth')}
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step3.startDate')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step3.endDate')}</FormLabel>
              <p className="text-xs text-muted-foreground">
                {leaseType === 'month_to_month'
                  ? t('leaseWizard.step3.endDateHelpM2m')
                  : t('leaseWizard.step3.endDateHelpStandard')}
              </p>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {leaseType === 'standard' && (
        <FormField
          control={control}
          name="after_term_action"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>{t('leaseWizard.step3.afterTerm')}</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="terminate" id="at-terminate" />
                    <Label htmlFor="at-terminate" className="font-normal">
                      {t('leaseWizard.step3.afterTermOptions.terminate')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="convert_to_month_to_month" id="at-m2m" />
                    <Label htmlFor="at-m2m" className="font-normal">
                      {t('leaseWizard.step3.afterTermOptions.convertM2m')}
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {leaseType === 'month_to_month' && (
        <FormField
          control={control}
          name="termination_notice_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step3.terminationNotice')}</FormLabel>
              <p className="text-xs text-muted-foreground">{t('leaseWizard.step3.terminationNoticeHelp')}</p>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  inputMode="numeric"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v === '' ? null : Number(v));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <Separator />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-muted/40 px-4 py-3">
        <div>
          <p className="text-sm font-medium">{t('leaseWizard.step3.durationBadgeTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('leaseWizard.step3.durationBadgeSubtitle')}</p>
        </div>
        <Badge variant="secondary" className="whitespace-normal text-left font-normal sm:max-w-[min(100%,20rem)]">
          {durationLabel}
        </Badge>
      </div>
    </div>
  );
}
