/**
 * Sprint 6A T12 — Step 5: Payment methods & landlord-covered utilities.
 */

import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { LeaseAgreementFormValues } from '@/features/contracts/schemas/leaseAgreementForm.schema';

const PAYMENT_IDS = [
  'ach',
  'cash',
  'check',
  'credit_card',
  'paypal',
  'venmo',
  'zelle',
  'other',
] as const satisfies readonly LeaseAgreementFormValues['payment_methods'][number][];

const UTILITY_IDS = [
  'cable_tv',
  'gas_oil_propane',
  'electricity',
  'internet',
  'landscaping',
  'water_sewer',
  'trash',
  'other',
] as const;

function toggleString(arr: string[], id: string, on: boolean): string[] {
  const s = new Set(arr);
  if (on) s.add(id);
  else s.delete(id);
  return [...s];
}

export function Step5PaymentUtilities() {
  const { t } = useTranslation('contracts');
  const { control, watch, setValue, getValues } = useFormContext<LeaseAgreementFormValues>();

  const methods = watch('payment_methods') ?? [];
  const utilities = watch('utilities_landlord_covered') ?? [];
  const hasOtherUtility = utilities.includes('other');

  const setMethods = (next: LeaseAgreementFormValues['payment_methods']) => {
    setValue('payment_methods', next, { shouldValidate: true, shouldDirty: true });
  };

  const togglePayment = (id: (typeof PAYMENT_IDS)[number], checked: boolean) => {
    const cur = getValues('payment_methods') ?? [];
    let next = toggleString([...cur], id, checked) as LeaseAgreementFormValues['payment_methods'];
    if (!checked && next.length === 0) {
      return;
    }
    next = [...new Set(next)] as LeaseAgreementFormValues['payment_methods'];
    setMethods(next);
  };

  const toggleUtility = (id: string, checked: boolean) => {
    const cur = getValues('utilities_landlord_covered') ?? [];
    setValue('utilities_landlord_covered', toggleString([...cur], id, checked), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('leaseWizard.step5.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('leaseWizard.step5.description')}</p>
      </div>

      <section className="space-y-3">
        <FormLabel className="text-base">{t('leaseWizard.step5.paymentSection')}</FormLabel>
        <p className="text-xs text-muted-foreground">{t('leaseWizard.step5.paymentHelp')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PAYMENT_IDS.map((id) => (
            <div key={id} className="flex items-center space-x-2">
              <Checkbox
                id={`pm-${id}`}
                checked={methods.includes(id)}
                onCheckedChange={(c) => togglePayment(id, c === true)}
              />
              <Label htmlFor={`pm-${id}`} className="font-normal leading-snug">
                {t(`leaseWizard.step5.paymentMethods.${id}`)}
              </Label>
            </div>
          ))}
        </div>
        <FormField
          control={control}
          name="payment_methods"
          render={() => (
            <FormItem className="space-y-0">
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      {methods.includes('paypal') && (
        <FormField
          control={control}
          name="paypal_email"
          render={({ field }) => (
            <FormItem className="max-w-md">
              <FormLabel>{t('leaseWizard.step5.paypalEmail')}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {methods.includes('venmo') && (
        <FormField
          control={control}
          name="venmo_handle"
          render={({ field }) => (
            <FormItem className="max-w-md">
              <FormLabel>{t('leaseWizard.step5.venmoHandle')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {methods.includes('zelle') && (
        <FormField
          control={control}
          name="zelle_contact"
          render={({ field }) => (
            <FormItem className="max-w-md">
              <FormLabel>{t('leaseWizard.step5.zelleContact')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {methods.includes('other') && (
        <FormField
          control={control}
          name="payment_method_other"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step5.otherPaymentDetail')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <Separator />

      <section className="space-y-3">
        <FormLabel className="text-base">{t('leaseWizard.step5.utilitiesSection')}</FormLabel>
        <p className="text-xs text-muted-foreground">{t('leaseWizard.step5.utilitiesHelp')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {UTILITY_IDS.map((id) => (
            <div key={id} className="flex items-center space-x-2">
              <Checkbox
                id={`ut-${id}`}
                checked={utilities.includes(id)}
                onCheckedChange={(c) => toggleUtility(id, c === true)}
              />
              <Label htmlFor={`ut-${id}`} className="font-normal leading-snug">
                {t(`leaseWizard.step5.utilityOptions.${id}`)}
              </Label>
            </div>
          ))}
        </div>
        {hasOtherUtility && (
          <FormField
            control={control}
            name="utilities_other"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('leaseWizard.step5.utilitiesOtherDetail')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </section>
    </div>
  );
}
