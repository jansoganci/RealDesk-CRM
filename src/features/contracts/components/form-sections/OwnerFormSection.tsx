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
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.owner_name.message}
            </p>
          )}
        </div>

        {/* Owner Tax ID (EIN/SSN) */}
        <div>
          <Label htmlFor="owner_tax_id">
            Tax ID (EIN/SSN)
          </Label>
          <Input
            id="owner_tax_id"
            placeholder="XX-XXXXXXX or XXX-XX-XXXX"
            {...form.register('owner_tax_id')}
          />
          {form.formState.errors.owner_tax_id && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.owner_tax_id.message}
            </p>
          )}
        </div>

        {/* Owner Bank (ABA Routing + Account) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="owner_routing_number">
              Routing Number *
            </Label>
            <Input
              id="owner_routing_number"
              placeholder="9 digits"
              inputMode="numeric"
              autoComplete="off"
              maxLength={9}
              {...form.register('owner_routing_number')}
            />
            {form.formState.errors.owner_routing_number && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.owner_routing_number.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="owner_account_number">
              Account Number *
            </Label>
            <Input
              id="owner_account_number"
              placeholder="4-17 digits"
              inputMode="numeric"
              autoComplete="off"
              maxLength={17}
              {...form.register('owner_account_number')}
            />
            {form.formState.errors.owner_account_number && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.owner_account_number.message}
              </p>
            )}
          </div>
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
              <p className="text-sm text-destructive mt-1">
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
            placeholder={t('create.placeholders.email')}
            {...form.register('owner_email')}
          />
            {form.formState.errors.owner_email && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.owner_email.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
