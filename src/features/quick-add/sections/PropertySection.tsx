import { useTranslation } from 'react-i18next';
import type { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import type { QuickAddFormData } from '../quickAddSchema';
import { US_STATES } from '@/features/leads/schemas/lead-form';

interface PropertySectionProps {
  form: UseFormReturn<QuickAddFormData>;
  loading?: boolean;
}

export const PropertySection = ({ form, loading = false }: PropertySectionProps) => {
  const { t } = useTranslation('quick-add');
  const propertyType = form.watch('property_type');

  const rentalStatuses = ['Empty', 'Occupied', 'Inactive'];
  const saleStatuses = ['Available', 'Under Offer', 'Sold', 'Inactive'];
  const statuses = propertyType === 'sale' ? saleStatuses : rentalStatuses;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50 border-border">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Building2 className="h-4 w-4" />
        {t('sections.property')}
      </div>

      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('fields.address')} *</FormLabel>
            <FormControl>
              <Input
                placeholder={t('placeholders.address')}
                {...field}
                disabled={loading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.city')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('placeholders.city')}
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="zip_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.zipCode')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('placeholders.zipCode')}
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="state"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('fields.state')}</FormLabel>
            <Select
              onValueChange={(v) =>
                field.onChange(v === '__none__' ? '' : v)
              }
              value={field.value && field.value.length === 2 ? field.value : '__none__'}
            >
              <FormControl>
                <SelectTrigger disabled={loading}>
                  <SelectValue placeholder={t('placeholders.state')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="__none__">{t('fields.stateOptional')}</SelectItem>
                {US_STATES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="property_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.propertyType')} *</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue('status', value === 'sale' ? 'Available' : 'Empty');
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger disabled={loading}>
                    <SelectValue placeholder={t('fields.propertyType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="rental">{t('propertyTypes.rental')}</SelectItem>
                  <SelectItem value="sale">{t('propertyTypes.sale')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.status')} *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger disabled={loading}>
                    <SelectValue placeholder={t('fields.status')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`statuses.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {propertyType === 'rental' ? (
          <FormField
            control={form.control}
            name="rent_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fields.rentAmount')} *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t('placeholders.rentAmount')}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="sale_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fields.salePrice')} *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t('placeholders.salePrice')}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormItem className="flex flex-col justify-end">
          <FormLabel>{t('fields.currency')}</FormLabel>
          <span className="text-sm font-medium py-2 text-foreground">{t('currencies.USD')}</span>
        </FormItem>
      </div>

      <FormField
        control={form.control}
        name="listing_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('fields.listingUrl')}</FormLabel>
            <FormControl>
              <Input
                placeholder={t('placeholders.listingUrl')}
                {...field}
                disabled={loading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('fields.notes')}</FormLabel>
            <FormControl>
              <Textarea
                className="resize-none"
                rows={3}
                placeholder={t('placeholders.notes')}
                {...field}
                disabled={loading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
