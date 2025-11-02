import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/config/colors';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { TenantWithContractFormData } from '../EnhancedTenantDialog';

interface TenantInfoStepProps {
  form: UseFormReturn<TenantWithContractFormData>;
  isLoading: boolean;
}

export const TenantInfoStep: React.FC<TenantInfoStepProps> = ({
  form,
  isLoading,
}) => {
  const { t } = useTranslation('tenants');
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t('enhanced.steps.info.sectionTitle')}</h3>
        <p className="text-sm text-gray-600">
          {t('enhanced.steps.info.sectionDescription')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tenant.name">{t('enhanced.steps.info.fields.name.label')}</Label>
          <Input
            id="tenant.name"
            placeholder={t('enhanced.steps.info.fields.name.placeholder')}
            {...register('tenant.name')}
            disabled={isLoading}
          />
          {errors.tenant?.name && (
            <p className={`text-sm ${COLORS.danger.text}`}>
              {errors.tenant.name.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenant.phone">{t('enhanced.steps.info.fields.phone.label')}</Label>
            <Input
              id="tenant.phone"
              placeholder={t('enhanced.steps.info.fields.phone.placeholder')}
              {...register('tenant.phone')}
              disabled={isLoading}
            />
            {errors.tenant?.phone && (
              <p className={`text-sm ${COLORS.danger.text}`}>
                {errors.tenant.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenant.email">{t('enhanced.steps.info.fields.email.label')}</Label>
            <Input
              id="tenant.email"
              type="email"
              placeholder={t('enhanced.steps.info.fields.email.placeholder')}
              {...register('tenant.email')}
              disabled={isLoading}
            />
            {errors.tenant?.email && (
              <p className={`text-sm ${COLORS.danger.text}`}>
                {errors.tenant.email.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant.notes">{t('enhanced.steps.info.fields.notes.label')}</Label>
          <Textarea
            id="tenant.notes"
            placeholder={t('enhanced.steps.info.fields.notes.placeholder')}
            {...register('tenant.notes')}
            disabled={isLoading}
            rows={3}
          />
          {errors.tenant?.notes && (
            <p className={`text-sm ${COLORS.danger.text}`}>
              {errors.tenant.notes.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};