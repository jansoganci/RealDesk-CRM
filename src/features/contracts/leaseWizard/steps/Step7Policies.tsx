/**
 * Sprint 6A T12 — Step 7: Pets, subletting, renters insurance, smoking.
 */

import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { LeaseAgreementFormValues } from '@/features/contracts/schemas/leaseAgreementForm.schema';

export function Step7Policies() {
  const { t } = useTranslation('contracts');
  const { control, watch } = useFormContext<LeaseAgreementFormValues>();

  const petsAllowed = watch('pets_allowed');
  const insuranceRequired = watch('renters_insurance_required');

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('leaseWizard.step7.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('leaseWizard.step7.description')}</p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-medium">{t('leaseWizard.step7.petsSection')}</h4>
          <FormField
            control={control}
            name="pets_allowed"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch id="pets" checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor="pets" className="text-sm font-normal">
                  {t('leaseWizard.step7.petsToggle')}
                </Label>
              </div>
            )}
          />
        </div>
        {petsAllowed && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="pets_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leaseWizard.step7.petsCount')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
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
            <FormField
              control={control}
              name="pets_max_weight_lbs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leaseWizard.step7.petsMaxWeight')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
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
            <FormField
              control={control}
              name="pets_types"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('leaseWizard.step7.petsTypes')}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="pets_deposit_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leaseWizard.step7.petsDeposit')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
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
            <FormField
              control={control}
              name="pets_deposit_refundable"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 space-y-2">
                  <FormLabel>{t('leaseWizard.step7.petsDepositRefundable')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={
                        field.value === null ? 'unspecified' : field.value ? 'yes' : 'no'
                      }
                      onValueChange={(v) => {
                        field.onChange(v === 'unspecified' ? null : v === 'yes');
                      }}
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="petdep-yes" />
                        <Label htmlFor="petdep-yes" className="font-normal">
                          {t('leaseWizard.step7.yes')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="petdep-no" />
                        <Label htmlFor="petdep-no" className="font-normal">
                          {t('leaseWizard.step7.no')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unspecified" id="petdep-na" />
                        <Label htmlFor="petdep-na" className="font-normal">
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
        )}
      </section>

      <Separator />

      <section className="space-y-3">
        <h4 className="text-sm font-medium">{t('leaseWizard.step7.sublettingSection')}</h4>
        <FormField
          control={control}
          name="subletting_policy"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_allowed" id="sub-none" />
                    <Label htmlFor="sub-none" className="font-normal">
                      {t('leaseWizard.step7.subletting.notAllowed')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="with_consent" id="sub-consent" />
                    <Label htmlFor="sub-consent" className="font-normal">
                      {t('leaseWizard.step7.subletting.withConsent')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no_restriction" id="sub-free" />
                    <Label htmlFor="sub-free" className="font-normal">
                      {t('leaseWizard.step7.subletting.noRestriction')}
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-medium">{t('leaseWizard.step7.insuranceSection')}</h4>
          <FormField
            control={control}
            name="renters_insurance_required"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch id="ins" checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor="ins" className="text-sm font-normal">
                  {t('leaseWizard.step7.insuranceToggle')}
                </Label>
              </div>
            )}
          />
        </div>
        {insuranceRequired && (
          <FormField
            control={control}
            name="renters_insurance_min_coverage"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>{t('leaseWizard.step7.insuranceMin')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
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
      </section>

      <Separator />

      <section className="space-y-3">
        <h4 className="text-sm font-medium">{t('leaseWizard.step7.smokingSection')}</h4>
        <FormField
          control={control}
          name="smoking_allowed"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  value={field.value ? 'yes' : 'no'}
                  onValueChange={(v) => field.onChange(v === 'yes')}
                  className="flex flex-wrap gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="smoke-no" />
                    <Label htmlFor="smoke-no" className="font-normal">
                      {t('leaseWizard.step7.smokingNotAllowed')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="smoke-yes" />
                    <Label htmlFor="smoke-yes" className="font-normal">
                      {t('leaseWizard.step7.smokingAllowed')}
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>
    </div>
  );
}
