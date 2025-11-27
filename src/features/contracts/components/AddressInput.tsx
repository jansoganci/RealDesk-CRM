/**
 * Address Input Component
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
import { generateFullAddress } from '@/lib/serviceProxy';
import { usePropertyActiveContract } from '../hooks/usePropertyActiveContract';
import type { ContractFormData } from '../schemas/contractForm.schema';

// Helper function to format date for display
const formatDisplayDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'dd.MM.yyyy');
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

  // Watch all address fields
  const mahalle = watch('mahalle');
  const cadde_sokak = watch('cadde_sokak');
  const bina_no = watch('bina_no');
  const daire_no = watch('daire_no');
  const ilce = watch('ilce');
  const il = watch('il');

  // Check for active contract when address fields change
  useEffect(() => {
    // Only check if all required fields are filled
    if (mahalle && cadde_sokak && bina_no && ilce && il) {
      checkAddress({ mahalle, cadde_sokak, bina_no, daire_no, ilce, il });
    } else {
      clearWarning();
    }
  }, [mahalle, cadde_sokak, bina_no, daire_no, ilce, il, checkAddress, clearWarning]);

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
    if (!mahalle || !cadde_sokak || !bina_no || !ilce || !il) {
      return t('create.preview.fullAddress') + ': -';
    }

    const address = generateFullAddress({
      mahalle,
      cadde_sokak,
      bina_no,
      daire_no: daire_no || undefined,
      ilce,
      il,
    });

    return address;
  }, [mahalle, cadde_sokak, bina_no, daire_no, ilce, il, t]);

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
                {activeContract.rent_amount.toLocaleString()} {activeContract.currency}/ay
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Mahalle */}
      <div>
        <Label htmlFor="mahalle">
          {t('create.fields.mahalle')} *
        </Label>
        <Input
          id="mahalle"
          placeholder={t('create.placeholders.mahalle')}
          {...form.register('mahalle')}
        />
        {form.formState.errors.mahalle && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.mahalle.message}
          </p>
        )}
      </div>

      {/* Cadde/Sokak */}
      <div>
        <Label htmlFor="cadde_sokak">
          {t('create.fields.cadde_sokak')} *
        </Label>
        <Input
          id="cadde_sokak"
          placeholder={t('create.placeholders.cadde_sokak')}
          {...form.register('cadde_sokak')}
        />
        {form.formState.errors.cadde_sokak && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.cadde_sokak.message}
          </p>
        )}
      </div>

      {/* Bina No and Daire No - Side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bina_no">
            {t('create.fields.bina_no')} *
          </Label>
          <Input
            id="bina_no"
            placeholder={t('create.placeholders.bina_no')}
            {...form.register('bina_no')}
          />
          {form.formState.errors.bina_no && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.bina_no.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="daire_no">
            {t('create.fields.daire_no')}
          </Label>
          <Input
            id="daire_no"
            placeholder={t('create.placeholders.daire_no')}
            {...form.register('daire_no')}
          />
          {form.formState.errors.daire_no && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.daire_no.message}
            </p>
          )}
        </div>
      </div>

      {/* İlçe and İl - Side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ilce">
            {t('create.fields.ilce')} *
          </Label>
          <Input
            id="ilce"
            placeholder={t('create.placeholders.ilce')}
            {...form.register('ilce')}
          />
          {form.formState.errors.ilce && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.ilce.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="il">
            {t('create.fields.il')} *
          </Label>
          <Input
            id="il"
            placeholder={t('create.placeholders.il')}
            {...form.register('il')}
          />
          {form.formState.errors.il && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.il.message}
            </p>
          )}
        </div>
      </div>

      {/* Property Type */}
      <div>
        <Label htmlFor="property_type">
          {t('create.fields.property_type')} *
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
              {t('create.propertyTypes.apartment')}
            </SelectItem>
            <SelectItem value="house">
              {t('create.propertyTypes.house')}
            </SelectItem>
            <SelectItem value="commercial">
              {t('create.propertyTypes.commercial')}
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
          {t('create.fields.use_purpose')}
        </Label>
        <Input
          id="use_purpose"
          placeholder={t('create.placeholders.usePurpose')}
          {...form.register('use_purpose')}
        />
        {form.formState.errors.use_purpose && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.use_purpose.message}
          </p>
        )}
      </div>

      {/* Full Address Preview */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {t('create.preview.fullAddress')}
        </p>
        <p className="text-sm text-slate-900 dark:text-slate-100">
          {fullAddressPreview}
        </p>
      </div>
    </div>
  );
}
