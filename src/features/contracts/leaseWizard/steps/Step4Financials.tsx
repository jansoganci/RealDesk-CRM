/**
 * Sprint 6A T11 — Step 4: Rent, deposits, fees, optional charges, amount due at signing (estimate).
 */

import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { LeaseAgreementFormValues } from '@/features/contracts/schemas/leaseAgreementForm.schema';
import { formatCurrency } from '@/lib/currency';

const USD = 'USD';

export function Step4Financials() {
  const { t } = useTranslation('contracts');
  const { control, watch } = useFormContext<LeaseAgreementFormValues>();

  const rentAmount = watch('rent_amount');
  const deposit = watch('deposit');
  const securityEnabled = watch('security_deposit_enabled');
  const securityAmount = watch('security_deposit_amount');
  const lateFeeType = watch('late_fee_type');
  const nsfEnabled = watch('nsf_fee_enabled');
  const earlyEnabled = watch('early_move_in_enabled');
  const earlyProrated = watch('early_move_in_prorated_rent');
  const prepaidEnabled = watch('prepaid_rent_enabled');
  const prepaidAmount = watch('prepaid_rent_amount');
  const parkingEnabled = watch('parking_fee_enabled');
  const petsAllowed = watch('pets_allowed');
  const petsDeposit = watch('pets_deposit_amount');

  const amountDueAtSigning = useMemo(() => {
    let total = 0;
    const n = (v: number | null | undefined) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);
    total += n(rentAmount);
    if (securityEnabled) total += n(securityAmount);
    total += n(deposit);
    if (earlyEnabled) total += n(earlyProrated);
    if (prepaidEnabled) total += n(prepaidAmount);
    if (petsAllowed && petsDeposit) total += n(petsDeposit);
    return total;
  }, [
    rentAmount,
    deposit,
    securityEnabled,
    securityAmount,
    earlyEnabled,
    earlyProrated,
    prepaidEnabled,
    prepaidAmount,
    petsAllowed,
    petsDeposit,
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('leaseWizard.step4.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('leaseWizard.step4.description')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="rent_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step4.monthlyRent')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="rent_due_day"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step4.rentDueDay')}</FormLabel>
              <p className="text-xs text-muted-foreground">{t('leaseWizard.step4.rentDueDayHelp')}</p>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="deposit"
        render={({ field }) => (
          <FormItem className="max-w-md">
            <FormLabel>{t('leaseWizard.step4.otherDeposit')}</FormLabel>
            <p className="text-xs text-muted-foreground">{t('leaseWizard.step4.otherDepositHelp')}</p>
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

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-medium">{t('leaseWizard.step4.securitySection')}</h4>
            <p className="text-xs text-muted-foreground">{t('leaseWizard.step4.securityHelp')}</p>
          </div>
          <FormField
            control={control}
            name="security_deposit_enabled"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch id="sec-dep" checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor="sec-dep" className="text-sm font-normal">
                  {t('leaseWizard.step4.securityToggle')}
                </Label>
              </div>
            )}
          />
        </div>
        {securityEnabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="security_deposit_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leaseWizard.step4.securityAmount')}</FormLabel>
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
              name="security_deposit_return_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leaseWizard.step4.securityReturnDays')}</FormLabel>
                  <p className="text-xs text-muted-foreground">{t('leaseWizard.step4.securityReturnHelp')}</p>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={90}
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
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <h4 className="text-sm font-medium">{t('leaseWizard.step4.lateFeeSection')}</h4>
        <FormField
          control={control}
          name="late_fee_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step4.lateFeeType')}</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="lf-none" />
                    <Label htmlFor="lf-none" className="font-normal">
                      {t('leaseWizard.step4.lateFeeNone')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="lf-fixed" />
                    <Label htmlFor="lf-fixed" className="font-normal">
                      {t('leaseWizard.step4.lateFeeFixed')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="interest" id="lf-int" />
                    <Label htmlFor="lf-int" className="font-normal">
                      {t('leaseWizard.step4.lateFeeInterest')}
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {lateFeeType === 'fixed' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="late_fee_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leaseWizard.step4.lateFeeAmount')}</FormLabel>
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
              name="late_fee_per"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leaseWizard.step4.lateFeePer')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value ?? undefined}
                      onValueChange={field.onChange}
                      className="flex flex-col gap-2 pt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="occurrence" id="lfp-occ" />
                        <Label htmlFor="lfp-occ" className="font-normal">
                          {t('leaseWizard.step4.lateFeePerOccurrence')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="day" id="lfp-day" />
                        <Label htmlFor="lfp-day" className="font-normal">
                          {t('leaseWizard.step4.lateFeePerDay')}
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
        {lateFeeType === 'interest' && (
          <FormField
            control={control}
            name="late_fee_interest_pct"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>{t('leaseWizard.step4.lateFeeInterestPct')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
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
        )}
      </section>

      <Separator />

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-medium">{t('leaseWizard.step4.nsfSection')}</h4>
          <FormField
            control={control}
            name="nsf_fee_enabled"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch id="nsf" checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor="nsf" className="text-sm font-normal">
                  {t('leaseWizard.step4.nsfToggle')}
                </Label>
              </div>
            )}
          />
        </div>
        {nsfEnabled && (
          <FormField
            control={control}
            name="nsf_fee_amount"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>{t('leaseWizard.step4.nsfAmount')}</FormLabel>
                <p className="text-xs text-muted-foreground">{t('leaseWizard.step4.nsfHelp')}</p>
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
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-medium">{t('leaseWizard.step4.earlyMoveInSection')}</h4>
          <FormField
            control={control}
            name="early_move_in_enabled"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch id="early" checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor="early" className="text-sm font-normal">
                  {t('leaseWizard.step4.earlyToggle')}
                </Label>
              </div>
            )}
          />
        </div>
        {earlyEnabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="early_move_in_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leaseWizard.step4.earlyDate')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="early_move_in_prorated_rent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leaseWizard.step4.earlyProrated')}</FormLabel>
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
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-medium">{t('leaseWizard.step4.prepaidSection')}</h4>
          <FormField
            control={control}
            name="prepaid_rent_enabled"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch id="prepaid" checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor="prepaid" className="text-sm font-normal">
                  {t('leaseWizard.step4.prepaidToggle')}
                </Label>
              </div>
            )}
          />
        </div>
        {prepaidEnabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="prepaid_rent_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leaseWizard.step4.prepaidAmount')}</FormLabel>
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
              name="prepaid_rent_start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leaseWizard.step4.prepaidStart')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="prepaid_rent_end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leaseWizard.step4.prepaidEnd')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-medium">{t('leaseWizard.step4.parkingSection')}</h4>
            <p className="text-xs text-muted-foreground">{t('leaseWizard.step4.parkingNote')}</p>
          </div>
          <FormField
            control={control}
            name="parking_fee_enabled"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch id="parking" checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor="parking" className="text-sm font-normal">
                  {t('leaseWizard.step4.parkingToggle')}
                </Label>
              </div>
            )}
          />
        </div>
        {parkingEnabled && (
          <FormField
            control={control}
            name="parking_fee_amount"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>{t('leaseWizard.step4.parkingAmount')}</FormLabel>
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
        )}
      </section>

      <Separator />

      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-4 space-y-2">
        <p className="text-sm font-semibold">{t('leaseWizard.step4.signingTotalTitle')}</p>
        <p className="text-xs text-muted-foreground">{t('leaseWizard.step4.signingTotalHelp')}</p>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>{t('leaseWizard.step4.lineRent', { amount: formatCurrency(rentAmount || 0, USD) })}</li>
          {securityEnabled && securityAmount != null && securityAmount > 0 && (
            <li>{t('leaseWizard.step4.lineSecurity', { amount: formatCurrency(securityAmount, USD) })}</li>
          )}
          {deposit != null && deposit > 0 && (
            <li>{t('leaseWizard.step4.lineOtherDeposit', { amount: formatCurrency(deposit, USD) })}</li>
          )}
          {earlyEnabled && earlyProrated != null && earlyProrated > 0 && (
            <li>{t('leaseWizard.step4.lineEarly', { amount: formatCurrency(earlyProrated, USD) })}</li>
          )}
          {prepaidEnabled && prepaidAmount != null && prepaidAmount > 0 && (
            <li>{t('leaseWizard.step4.linePrepaid', { amount: formatCurrency(prepaidAmount, USD) })}</li>
          )}
          {petsAllowed && petsDeposit != null && petsDeposit > 0 && (
            <li>{t('leaseWizard.step4.linePet', { amount: formatCurrency(petsDeposit, USD) })}</li>
          )}
        </ul>
        <p className="text-lg font-semibold text-foreground pt-2 border-t border-primary/10">
          {t('leaseWizard.step4.signingTotal', { amount: formatCurrency(amountDueAtSigning, USD) })}
        </p>
        <p className="text-xs text-muted-foreground">{t('leaseWizard.step4.parkingExcluded')}</p>
      </div>
    </div>
  );
}
