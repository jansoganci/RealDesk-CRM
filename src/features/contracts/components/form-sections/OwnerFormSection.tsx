/**
 * Owner Form Section
 *
 * Form section for owner (property owner / landlord) information
 */

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ContractFormData } from '@/types/contract.types';

interface OwnerFormSectionProps {
  form: UseFormReturn<ContractFormData>;
}

export function OwnerFormSection({ form }: OwnerFormSectionProps) {
  const { t } = useTranslation('contracts');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('create.sections.owner')}</CardTitle>
        <CardDescription>
          {t('create.sections.ownerDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Owner Name */}
        <div>
          <Label htmlFor="owner_name">
            {t('create.fields.owner_name')} *
          </Label>
          <Input
            id="owner_name"
            placeholder={t('create.placeholders.owner_name')}
            {...form.register('owner_name')}
          />
          {form.formState.errors.owner_name && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.owner_name.message}
            </p>
          )}
        </div>

        {/* Owner TC */}
        <div>
          <Label htmlFor="owner_tc">
            {t('create.fields.owner_tc')} *
          </Label>
          <Input
            id="owner_tc"
            placeholder={t('create.placeholders.owner_tc')}
            maxLength={11}
            {...form.register('owner_tc')}
          />
          {form.formState.errors.owner_tc && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.owner_tc.message}
            </p>
          )}
        </div>

        {/* Owner IBAN */}
        <div>
          <Label htmlFor="owner_iban">
            {t('create.fields.owner_iban')} *
          </Label>
          <Input
            id="owner_iban"
            placeholder={t('create.placeholders.owner_iban')}
            maxLength={26}
            {...form.register('owner_iban')}
          />
          {form.formState.errors.owner_iban && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.owner_iban.message}
            </p>
          )}
        </div>

        {/* Owner Phone and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="owner_phone">
              {t('create.fields.owner_phone')} *
            </Label>
            <Input
              id="owner_phone"
              placeholder={t('create.placeholders.owner_phone')}
              {...form.register('owner_phone')}
            />
            {form.formState.errors.owner_phone && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.owner_phone.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="owner_email">
              {t('create.fields.owner_email')}
            </Label>
            <Input
              id="owner_email"
              type="email"
              placeholder="ornek@email.com"
              {...form.register('owner_email')}
            />
            {form.formState.errors.owner_email && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.owner_email.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
