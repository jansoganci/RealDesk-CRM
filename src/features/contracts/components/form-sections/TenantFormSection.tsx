/**
 * Tenant Form Section
 *
 * Form section for tenant information
 */

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ContractFormData } from '@/types/contract.types';

interface TenantFormSectionProps {
  form: UseFormReturn<ContractFormData>;
}

export function TenantFormSection({ form }: TenantFormSectionProps) {
  const { t } = useTranslation('contracts');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('create.sections.tenant')}</CardTitle>
        <CardDescription>
          {t('create.sections.tenantDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tenant Name */}
        <div>
          <Label htmlFor="tenant_name">
            {t('create.fields.tenant_name')} *
          </Label>
          <Input
            id="tenant_name"
            placeholder={t('create.placeholders.tenant_name')}
            {...form.register('tenant_name')}
          />
          {form.formState.errors.tenant_name && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.tenant_name.message}
            </p>
          )}
        </div>

        {/* Tenant TC */}
        <div>
          <Label htmlFor="tenant_tc">
            {t('create.fields.tenant_tc')} *
          </Label>
          <Input
            id="tenant_tc"
            placeholder={t('create.placeholders.owner_tc')}
            maxLength={11}
            {...form.register('tenant_tc')}
          />
          {form.formState.errors.tenant_tc && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.tenant_tc.message}
            </p>
          )}
        </div>

        {/* Tenant Phone and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tenant_phone">
              {t('create.fields.tenant_phone')} *
            </Label>
            <Input
              id="tenant_phone"
              placeholder={t('create.placeholders.owner_phone')}
              {...form.register('tenant_phone')}
            />
            {form.formState.errors.tenant_phone && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.tenant_phone.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="tenant_email">
              {t('create.fields.tenant_email')}
            </Label>
            <Input
              id="tenant_email"
              type="email"
              placeholder="ornek@email.com"
              {...form.register('tenant_email')}
            />
            {form.formState.errors.tenant_email && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.tenant_email.message}
              </p>
            )}
          </div>
        </div>

        {/* Tenant Address */}
        <div>
          <Label htmlFor="tenant_address">
            {t('create.fields.tenant_address')} *
          </Label>
          <Textarea
            id="tenant_address"
            placeholder={t('create.placeholders.tenant_address')}
            rows={3}
            {...form.register('tenant_address')}
          />
          {form.formState.errors.tenant_address && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.tenant_address.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
