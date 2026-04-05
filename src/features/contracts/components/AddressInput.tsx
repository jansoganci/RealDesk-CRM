/**
 * Address Input Component (US Format)
 * Component-based address input with real-time preview
 * Includes active contract warning for duplicate detection
 */

import { useMemo, useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { generateFullAddress, US_STATES } from '@/lib/serviceProxy';
import { usePropertyActiveContract } from '../hooks/usePropertyActiveContract';
import { FixturesSelector } from './FixturesSelector';
import type { ContractFormData } from '../schemas/contractForm.schema';

// Helper function to format date for display
const formatDisplayDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'MM/dd/yyyy');
  } catch {
    return dateString;
  }
};

interface AddressInputProps {
  form: UseFormReturn<ContractFormData>;
}

export function AddressInput({ form }: AddressInputProps) {
  const { t } = useTranslation('contracts');
  const { activeContract, checkAddress, clearWarning } = usePropertyActiveContract();
  const toastShownRef = useRef<string | null>(null);

  const { watch, setValue } = form;

  // Watch all US address fields
  const street_address = watch('street_address');
  const unit = watch('unit');
  const city = watch('city');
  const state = watch('state');
  const zip_code = watch('zip_code');

  // Check for active contract when address fields change
  useEffect(() => {
    // Only check if all required fields are filled
    if (street_address && city && state && zip_code) {
      checkAddress({
        street_address,
        unit: unit || undefined,
        city,
        state,
        zip_code,
      });
    } else {
      clearWarning();
    }
  }, [street_address, unit, city, state, zip_code, checkAddress, clearWarning]);

  // Show toast when active contract is detected (only once per contract)
  useEffect(() => {
    if (activeContract && toastShownRef.current !== activeContract.id) {
      toastShownRef.current = activeContract.id;
      toast.warning(t('activeContractWarning.toastTitle'), {
        description: t('activeContractWarning.toastDescription', { tenant: activeContract.tenant_name }),
        duration: 5000,
      });
    } else if (!activeContract) {
      toastShownRef.current = null;
    }
  }, [activeContract, t]);

  // Generate full address preview
  const fullAddressPreview = useMemo(() => {
    if (!street_address || !city || !state || !zip_code) {
      return 'Full Address: -';
    }

    const address = generateFullAddress({
      street_address,
      unit: unit || undefined,
      city,
      state,
      zip_code,
    });

    return address;
  }, [street_address, unit, city, state, zip_code]);

  return (
    <div className="space-y-4">
      {/* Active Contract Warning Banner */}
      {activeContract && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            {t('activeContractWarning.bannerTitle')}
          </AlertTitle>
          <AlertDescription>
            <p className="mb-2">{t('activeContractWarning.bannerMessage')}</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <span className="font-medium">{t('activeContractWarning.tenant')}:</span>{' '}
                {activeContract.tenant_name}
              </li>
              <li>
                <span className="font-medium">{t('activeContractWarning.period')}:</span>{' '}
                {formatDisplayDate(activeContract.start_date)} - {formatDisplayDate(activeContract.end_date)}
              </li>
              <li>
                <span className="font-medium">{t('activeContractWarning.rent')}:</span>{' '}
                {activeContract.rent_amount.toLocaleString()} {activeContract.currency}{t('activeContractWarning.perMonthSuffix')}
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Street Address */}
      <div>
        <Label htmlFor="street_address">
          Street Address *
        </Label>
        <Input
          id="street_address"
          placeholder="123 Main Street"
          {...form.register('street_address')}
        />
        {form.formState.errors.street_address && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.street_address.message}
          </p>
        )}
      </div>

      {/* Unit/Apt (Optional) */}
      <div>
        <Label htmlFor="unit">
          Unit/Apt
        </Label>
        <Input
          id="unit"
          placeholder="Apt 4B, Suite 200, etc."
          {...form.register('unit')}
        />
        {form.formState.errors.unit && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.unit.message}
          </p>
        )}
      </div>

      {/* City, State, ZIP - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* City */}
        <div className="md:col-span-1">
          <Label htmlFor="city">
            City *
          </Label>
          <Input
            id="city"
            placeholder="Austin"
            {...form.register('city')}
          />
          {form.formState.errors.city && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.city.message}
            </p>
          )}
        </div>

        {/* State */}
        <div className="md:col-span-1">
          <Label htmlFor="state">
            State *
          </Label>
          <Select
            value={watch('state')}
            onValueChange={(value) => setValue('state', value, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((state) => (
                <SelectItem key={state.code} value={state.code}>
                  {state.code} - {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.state && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.state.message}
            </p>
          )}
        </div>

        {/* ZIP Code */}
        <div className="md:col-span-1">
          <Label htmlFor="zip_code">
            ZIP Code *
          </Label>
          <Input
            id="zip_code"
            placeholder="78701"
            maxLength={10}
            {...form.register('zip_code')}
          />
          {form.formState.errors.zip_code && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.zip_code.message}
            </p>
          )}
        </div>
      </div>

      {/* Property Type */}
      <div>
        <Label htmlFor="property_type">
          Property Type *
        </Label>
        <Select
          value={watch('property_type')}
          onValueChange={(value) => setValue('property_type', value as 'apartment' | 'house' | 'commercial')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apartment">
              Apartment
            </SelectItem>
            <SelectItem value="house">
              House
            </SelectItem>
            <SelectItem value="commercial">
              Commercial
            </SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.property_type && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.property_type.message}
          </p>
        )}
      </div>

      {/* Use Purpose */}
      <div>
        <Label htmlFor="use_purpose">
          Use Purpose
        </Label>
        <Input
          id="use_purpose"
          placeholder="Residential, Office, Retail, etc."
          {...form.register('use_purpose')}
        />
        {form.formState.errors.use_purpose && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.use_purpose.message}
          </p>
        )}
      </div>

      {/* Fixtures Declaration */}
      <Separator />
      <div>
        <Label htmlFor="fixtures-selector">
          Fixtures & Appliances
        </Label>
        <FixturesSelector
          value={form.watch('special_conditions') || ''}
          onChange={(value: string) => form.setValue('special_conditions', value, { shouldValidate: true })}
          error={form.formState.errors.special_conditions?.message}
          isPainted={form.watch('is_painted')}
          onPaintedChange={(value: boolean) => form.setValue('is_painted', value, { shouldValidate: true })}
          paintedError={form.formState.errors.is_painted?.message}
        />
      </div>

      {/* Full Address Preview */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Full Address Preview
        </p>
        <p className="text-sm text-slate-900 dark:text-slate-100">
          {fullAddressPreview}
        </p>
      </div>
    </div>
  );
}
