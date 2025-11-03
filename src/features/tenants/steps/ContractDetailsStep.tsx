import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/config/colors';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { propertiesService } from '../../../lib/serviceProxy';
import { Property } from '../../../types';
import { TenantWithContractFormData } from '../EnhancedTenantDialog';

interface ContractDetailsStepProps {
  form: UseFormReturn<TenantWithContractFormData>;
  isLoading: boolean;
}

export const ContractDetailsStep: React.FC<ContractDetailsStepProps> = ({
  form,
  isLoading,
}) => {
  const { t } = useTranslation('tenants');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const selectedPropertyId = watch('contract.property_id');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoadingProperties(true);
      const data = await propertiesService.getAll();
      // Filter to only show empty or occupied properties that can be rented
      const availableProperties = data.filter(p =>
        p.status === 'Empty' || p.status === 'Occupied'
      );
      setProperties(availableProperties);
    } catch (error) {
      console.error(t('enhanced.steps.contract.failedToLoadProperties'), error);
    } finally {
      setLoadingProperties(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t('enhanced.steps.contract.sectionTitle')}</h3>
        <p className="text-sm text-gray-600">
          {t('enhanced.steps.contract.sectionDescription')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contract.property_id">{t('enhanced.steps.contract.fields.property.label')}</Label>
          <Select
            value={selectedPropertyId || ''}
            onValueChange={(value) => setValue('contract.property_id', value)}
            disabled={loadingProperties || isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                loadingProperties
                  ? t('enhanced.steps.contract.loadingProperties')
                  : t('enhanced.steps.contract.fields.property.placeholder')
              } />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  <div className="flex flex-col">
                    <span>{property.address}</span>
                    <span className="text-xs text-gray-500">
                      {t('enhanced.steps.contract.fields.propertyStatus', { status: property.status })}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.contract?.property_id && (
            <p className={`text-sm ${COLORS.danger.text}`}>
              {errors.contract.property_id.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contract.start_date">{t('enhanced.steps.contract.fields.startDate.label')}</Label>
            <Input
              id="contract.start_date"
              type="date"
              {...register('contract.start_date')}
              disabled={isLoading}
            />
            {errors.contract?.start_date && (
              <p className={`text-sm ${COLORS.danger.text}`}>
                {errors.contract.start_date.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract.end_date">{t('enhanced.steps.contract.fields.endDate.label')}</Label>
            <Input
              id="contract.end_date"
              type="date"
              {...register('contract.end_date')}
              disabled={isLoading}
            />
            {errors.contract?.end_date && (
              <p className={`text-sm ${COLORS.danger.text}`}>
                {errors.contract.end_date.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contract.rent_amount">{t('enhanced.steps.contract.fields.rentAmount.label')}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {t('enhanced.steps.contract.fields.rentAmount.currencySymbol')}
              </span>
              <Input
                id="contract.rent_amount"
                type="number"
                placeholder={t('enhanced.steps.contract.fields.rentAmount.placeholder')}
                step="0.01"
                min="0"
                className="pl-8"
                {...register('contract.rent_amount', {
                  valueAsNumber: true,
                })}
                disabled={isLoading}
              />
            </div>
            {errors.contract?.rent_amount && (
              <p className={`text-sm ${COLORS.danger.text}`}>
                {errors.contract.rent_amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract.status">{t('enhanced.steps.contract.fields.status.label')}</Label>
            <Select
              value={watch('contract.status') || 'Active'}
              onValueChange={(value) => setValue('contract.status', value as 'Active' | 'Inactive' | 'Archived')}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('enhanced.steps.contract.fields.status.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">{t('enhanced.steps.contract.fields.status.options.active')}</SelectItem>
                <SelectItem value="Inactive">{t('enhanced.steps.contract.fields.status.options.inactive')}</SelectItem>
                <SelectItem value="Archived">{t('enhanced.steps.contract.fields.status.options.archived')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.contract?.status && (
              <p className={`text-sm ${COLORS.danger.text}`}>
                {errors.contract.status.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};