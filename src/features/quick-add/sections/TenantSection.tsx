import { useTranslation } from 'react-i18next';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { QuickAddFormData } from '../quickAddSchema';

interface TenantSectionProps {
  form: UseFormReturn<QuickAddFormData>;
  loading?: boolean;
}

export const TenantSection = ({ form, loading = false }: TenantSectionProps) => {
  const { t } = useTranslation('quick-add');
  const addTenant = form.watch('addTenant');
  const propertyType = form.watch('property_type');

  // Only show tenant section for rental properties
  if (propertyType === 'sale') {
    return null;
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Users className="h-4 w-4" />
          {t('sections.tenant')}
        </div>
      </div>

      {/* Add Tenant Checkbox */}
      <FormField
        control={form.control}
        name="addTenant"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={loading}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="cursor-pointer">
                {t('fields.addTenant')}
              </FormLabel>
            </div>
          </FormItem>
        )}
      />

      {/* Tenant Fields (shown when checkbox is checked) */}
      {addTenant && (
        <div className="space-y-3 pt-2">
          {/* Tenant Name */}
          <FormField
            control={form.control}
            name="tenantName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fields.tenantName')} *</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('placeholders.tenantName')}
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="tenantPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.tenantPhone')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('placeholders.tenantPhone')}
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
              name="tenantEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.tenantEmail')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('placeholders.tenantEmail')}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Contract Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="contractStart"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('fields.contractStart')} *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={loading}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>{t('fields.contractStart')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contractEnd"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('fields.contractEnd')} *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={loading}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>{t('fields.contractEnd')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Contract Rent & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="contractRent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.contractRent')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t('placeholders.rentAmount')}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contractCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.currency')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={loading}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TRY">{t('currencies.TRY')}</SelectItem>
                      <SelectItem value="USD">{t('currencies.USD')}</SelectItem>
                      <SelectItem value="EUR">{t('currencies.EUR')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
};
