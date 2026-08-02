/**
 * Sprint 6B T11 — Step 4: Earnest money amount, due date, deadline time, escrow requirement.
 */

import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { PurchaseAgreementFormValues } from '@/features/contracts/schemas/purchaseAgreementForm.schema';

export function Step4EarnestMoney() {
  const { t } = useTranslation('contracts');
  const { control } = useFormContext<PurchaseAgreementFormValues>();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('purchaseWizard.step4.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('purchaseWizard.step4.description')}</p>
      </div>

      <Alert className="border-primary/30 bg-primary text-primary dark:border-primary/30 dark:bg-primary dark:text-primary">
        <Info className="h-4 w-4" aria-hidden />
        <AlertTitle>{t('purchaseWizard.step4.infoTitle')}</AlertTitle>
        <AlertDescription>{t('purchaseWizard.step4.infoBody')}</AlertDescription>
      </Alert>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          control={control}
          name="earnest_money_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('purchaseWizard.step4.amount')}</FormLabel>
              <p className="text-xs text-muted-foreground">{t('purchaseWizard.step4.amountHelp')}</p>
              <FormControl>
                <div className="relative">
                  <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    className="pl-7"
                    inputMode="decimal"
                    value={field.value === undefined || field.value === null ? '' : field.value}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === '' ? 0 : Number(v));
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="earnest_money_due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('purchaseWizard.step4.dueDate')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="earnest_money_deadline_time"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('purchaseWizard.step4.deadlineTime')}</FormLabel>
            <p className="text-xs text-muted-foreground">{t('purchaseWizard.step4.deadlineTimeHelp')}</p>
            <FormControl>
              <Input {...field} value={field.value ?? ''} placeholder={t('purchaseWizard.step4.deadlineTimePlaceholder')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="earnest_money_escrow_required"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{t('purchaseWizard.step4.escrowRequired')}</FormLabel>
            <p className="text-xs text-muted-foreground">{t('purchaseWizard.step4.escrowHelp')}</p>
            <FormControl>
              <RadioGroup
                onValueChange={(v) => field.onChange(v === 'true')}
                value={field.value ? 'true' : 'false'}
                className="flex flex-wrap gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="escrow-yes" />
                  <Label htmlFor="escrow-yes" className="font-normal">
                    {t('purchaseWizard.step4.yes')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="escrow-no" />
                  <Label htmlFor="escrow-no" className="font-normal">
                    {t('purchaseWizard.step4.no')}
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
