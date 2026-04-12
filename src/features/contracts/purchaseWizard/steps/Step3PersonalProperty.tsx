/**
 * Sprint 6B T10 — Step 3: Personal property & fixtures included in the sale.
 */

import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { PurchaseAgreementFormValues } from '@/features/contracts/schemas/purchaseAgreementForm.schema';

const MAX_LEN = 2000;

export function Step3PersonalProperty() {
  const { t } = useTranslation('contracts');
  const { control, watch } = useFormContext<PurchaseAgreementFormValues>();
  const raw = watch('personal_property_description');
  const count = (raw ?? '').length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('purchaseWizard.step3.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('purchaseWizard.step3.description')}</p>
      </div>

      <FormField
        control={control}
        name="personal_property_description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('purchaseWizard.step3.label')}</FormLabel>
            <p className="text-xs text-muted-foreground">{t('purchaseWizard.step3.help')}</p>
            <FormControl>
              <Textarea
                rows={8}
                maxLength={MAX_LEN}
                placeholder={t('purchaseWizard.step3.placeholder')}
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <p className="text-xs text-muted-foreground text-right">
              {t('purchaseWizard.step3.charCount', { count })}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        {t('purchaseWizard.step3.pdfNote')}
      </div>
    </div>
  );
}
