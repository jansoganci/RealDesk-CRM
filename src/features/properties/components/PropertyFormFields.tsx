import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { COLORS } from '@/config/colors';
import { TrendingUp } from 'lucide-react';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { Property, PropertyWithOwner } from '@/types';
import { US_STATES } from '@/features/leads/schemas/lead-form';
import type { z } from 'zod';
import type { getRentalPropertySchema, getSalePropertySchema } from '../propertySchemas';

type RentalForm = z.infer<ReturnType<typeof getRentalPropertySchema>>;
type SaleForm = z.infer<ReturnType<typeof getSalePropertySchema>>;
type PropertyFormValues = RentalForm | SaleForm;

interface PropertyFormFieldsProps {
  propertyType: 'rental' | 'sale';
  property: Property | null;
  register: UseFormRegister<PropertyFormValues>;
  setValue: UseFormSetValue<PropertyFormValues>;
  watch: UseFormWatch<PropertyFormValues>;
  errors: FieldErrors<PropertyFormValues>;
  loading?: boolean;
  onMarkAsSold?: (property: PropertyWithOwner) => void;
}

/**
 * Property Form Fields Component
 * Displays all form field inputs based on property type
 */
export function PropertyFormFields({
  propertyType,
  property,
  register,
  setValue,
  watch,
  errors,
  loading = false,
  onMarkAsSold,
}: PropertyFormFieldsProps) {
  const { t } = useTranslation(['properties', 'common']);
  const rentalErrors =
    propertyType === 'rental' ? (errors as FieldErrors<RentalForm>) : null;
  const saleErrors = propertyType === 'sale' ? (errors as FieldErrors<SaleForm>) : null;

  const selectedStatus = watch('status');
  const watchedState = watch('state');

  return (
    <>
      {/* Street Address */}
      <div className="space-y-2">
        <Label htmlFor="street_address">{t('dialog.form.streetAddress')} *</Label>
        <Input
          id="street_address"
          placeholder={t('dialog.form.streetAddressPlaceholder')}
          {...register('street_address')}
          disabled={loading}
        />
        {errors.street_address && (
          <p className={`text-sm ${COLORS.danger.text}`}>
            {errors.street_address.message as string}
          </p>
        )}
      </div>

      {/* City and State */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">{t('dialog.form.city')} *</Label>
          <Input
            id="city"
            placeholder={t('dialog.form.cityPlaceholder')}
            {...register('city')}
            disabled={loading}
          />
          {errors.city && (
            <p className={`text-sm ${COLORS.danger.text}`}>{errors.city.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">{t('dialog.form.state')} *</Label>
          <Select
            value={watchedState?.length === 2 ? watchedState : undefined}
            onValueChange={(value) => setValue('state', value as PropertyFormValues['state'])}
            disabled={loading}
          >
            <SelectTrigger id="state">
              <SelectValue placeholder={t('dialog.form.statePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className={`text-sm ${COLORS.danger.text}`}>{errors.state.message as string}</p>
          )}
        </div>
      </div>

      {/* Zip Code and MLS ID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zip_code">{t('dialog.form.zipCode')} *</Label>
          <Input
            id="zip_code"
            placeholder={t('dialog.form.zipCodePlaceholder')}
            {...register('zip_code')}
            disabled={loading}
          />
          {errors.zip_code && (
            <p className={`text-sm ${COLORS.danger.text}`}>{errors.zip_code.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mls_id">{t('dialog.form.mlsId')}</Label>
          <Input
            id="mls_id"
            placeholder={t('dialog.form.mlsIdPlaceholder')}
            {...register('mls_id')}
            disabled={loading}
          />
          {errors.mls_id && (
            <p className={`text-sm ${COLORS.danger.text}`}>{errors.mls_id.message as string}</p>
          )}
        </div>
      </div>

      {/* Year Built */}
      <div className="space-y-2">
        <Label htmlFor="year_built">{t('dialog.form.yearBuilt')}</Label>
        <Input
          id="year_built"
          type="number"
          placeholder={t('dialog.form.yearBuiltPlaceholder')}
          {...register('year_built', { valueAsNumber: true })}
          disabled={loading}
        />
        {errors.year_built && (
          <p className={`text-sm ${COLORS.danger.text}`}>{errors.year_built.message as string}</p>
        )}
      </div>

      {/* Status Field - Conditional based on Property Type */}
      <div className="space-y-2">
        <Label htmlFor="status">
          {propertyType === 'rental' ? t('dialog.form.rentalStatus') : t('dialog.form.saleStatus')} *
        </Label>
        <Select
          value={selectedStatus}
          onValueChange={(value) =>
            setValue('status', value as PropertyFormValues['status'])
          }
          disabled={loading}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder={t('dialog.form.statusPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {propertyType === 'rental' ? (
              <>
                <SelectItem value="Empty">{t('status.rental.empty')}</SelectItem>
                <SelectItem value="Occupied">{t('status.rental.occupied')}</SelectItem>
                <SelectItem value="Inactive">{t('status.rental.inactive')}</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="Available">{t('status.sale.available')}</SelectItem>
                <SelectItem value="Under Offer">{t('status.sale.underOffer')}</SelectItem>
                <SelectItem value="Sold">{t('status.sale.sold')}</SelectItem>
                <SelectItem value="Inactive">{t('status.sale.inactive')}</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
        {errors.status && (
          <p className={`text-sm ${COLORS.danger.text}`}>{errors.status.message as string}</p>
        )}
      </div>

      {/* Mark as Sold Button - Only for sale properties with Available status */}
      {property &&
        propertyType === 'sale' &&
        selectedStatus === 'Available' &&
        !property.sold_at &&
        onMarkAsSold && (
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onMarkAsSold(property as PropertyWithOwner)}
              disabled={loading}
              className="w-full bg-amber-50 dark:bg-slate-800/70 border-amber-300 dark:border-slate-700 hover:bg-amber-100 dark:hover:bg-slate-800 hover:border-amber-400 dark:hover:border-amber-600 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 font-semibold"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('markAsSold.button')}
            </Button>
          </div>
        )}

      {/* Price Fields - Conditional based on Property Type */}
      {propertyType === 'rental' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rent_amount">{t('dialog.form.rentAmount')} *</Label>
            <Input
              id="rent_amount"
              type="number"
              step="0.01"
              placeholder={t('dialog.form.rentAmountPlaceholder')}
              {...register('rent_amount', { valueAsNumber: true })}
              disabled={loading}
            />
            {rentalErrors?.rent_amount && (
              <p className={`text-sm ${COLORS.danger.text}`}>
                {rentalErrors.rent_amount.message as string}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sale_price">{t('dialog.form.salePrice')} *</Label>
            <Input
              id="sale_price"
              type="number"
              step="0.01"
              placeholder={t('dialog.form.salePricePlaceholder')}
              {...register('sale_price', { valueAsNumber: true })}
              disabled={loading}
            />
            {saleErrors?.sale_price && (
              <p className={`text-sm ${COLORS.danger.text}`}>
                {saleErrors.sale_price.message as string}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Listing URL Field */}
      <div className="space-y-2">
        <Label htmlFor="listing_url">{t('dialog.form.listingUrl')}</Label>
        <Input
          id="listing_url"
          type="url"
          placeholder={t('dialog.form.listingUrlPlaceholder')}
          {...register('listing_url')}
          disabled={loading}
        />
        {errors.listing_url && (
          <p className={`text-sm ${COLORS.danger.text}`}>{errors.listing_url.message as string}</p>
        )}
      </div>

      {/* Notes Field */}
      <div className="space-y-2">
        <Label htmlFor="notes">{t('dialog.form.notes')}</Label>
        <Textarea
          id="notes"
          placeholder={t('dialog.form.notesPlaceholder')}
          {...register('notes')}
          disabled={loading}
          rows={3}
        />
        {errors.notes && (
          <p className={`text-sm ${COLORS.danger.text}`}>{errors.notes.message as string}</p>
        )}
      </div>
    </>
  );
}
