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
import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { Property, PropertyWithOwner } from '@/types';

interface PropertyFormFieldsProps {
  propertyType: 'rental' | 'sale';
  property: Property | null;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
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

  const selectedStatus = watch('status');
  const selectedCurrency = watch('currency');

  return (
    <>
      {/* Address Field */}
      <div className="space-y-2">
        <Label htmlFor="address">{t('dialog.form.address')} *</Label>
        <Textarea
          id="address"
          placeholder={t('dialog.form.addressPlaceholder')}
          {...register('address')}
          disabled={loading}
          rows={2}
        />
        {errors.address && (
          <p className={`text-sm ${COLORS.danger.text}`}>{errors.address.message}</p>
        )}
      </div>

      {/* City and District Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">{t('dialog.form.city')}</Label>
          <Input
            id="city"
            placeholder={t('dialog.form.cityPlaceholder')}
            {...register('city')}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">{t('dialog.form.district')}</Label>
          <Input
            id="district"
            placeholder={t('dialog.form.districtPlaceholder')}
            {...register('district')}
            disabled={loading}
          />
        </div>
      </div>

      {/* Status Field - Conditional based on Property Type */}
      <div className="space-y-2">
        <Label htmlFor="status">
          {propertyType === 'rental' ? t('dialog.form.rentalStatus') : t('dialog.form.saleStatus')} *
        </Label>
        <Select
          value={selectedStatus}
          onValueChange={(value) => setValue('status', value as any)}
          disabled={loading}
        >
          <SelectTrigger>
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
          <p className={`text-sm ${COLORS.danger.text}`}>{errors.status.message}</p>
        )}
      </div>

      {/* Mark as Sold Button - Only for sale properties with Available status */}
      {property &&
        propertyType === 'sale' &&
        selectedStatus === 'Available' &&
        !(property as any).sold_at &&
        onMarkAsSold && (
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onMarkAsSold(property as PropertyWithOwner)}
              disabled={loading}
              className="w-full bg-amber-50 border-amber-300 hover:bg-amber-100 hover:border-amber-400 text-amber-700 hover:text-amber-800 font-semibold"
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
              {...register('rent_amount' as any, { valueAsNumber: true })}
              disabled={loading}
            />
            {errors.rent_amount && (
              <p className={`text-sm ${COLORS.danger.text}`}>{errors.rent_amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">{t('dialog.form.currency')} *</Label>
            <Select
              value={selectedCurrency || ''}
              onValueChange={(value) => setValue('currency', value as 'USD' | 'TRY')}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('dialog.form.currencyPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="TRY">TRY</SelectItem>
              </SelectContent>
            </Select>
            {errors.currency && (
              <p className={`text-sm ${COLORS.danger.text}`}>{errors.currency.message}</p>
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
              {...register('sale_price' as any, { valueAsNumber: true })}
              disabled={loading}
            />
            {errors.sale_price && (
              <p className={`text-sm ${COLORS.danger.text}`}>{errors.sale_price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">{t('dialog.form.currency')} *</Label>
            <Select
              value={selectedCurrency || ''}
              onValueChange={(value) => setValue('currency', value as 'USD' | 'TRY')}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('dialog.form.currencyPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="TRY">TRY</SelectItem>
              </SelectContent>
            </Select>
            {errors.currency && (
              <p className={`text-sm ${COLORS.danger.text}`}>{errors.currency.message}</p>
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
          <p className={`text-sm ${COLORS.danger.text}`}>{errors.listing_url.message}</p>
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
      </div>
    </>
  );
}

