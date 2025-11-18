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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { User, UserPlus } from 'lucide-react';
import { PropertyOwner } from '@/types';
import type { QuickAddFormData } from '../quickAddSchema';

interface OwnerSectionProps {
  form: UseFormReturn<QuickAddFormData>;
  owners: PropertyOwner[];
  loading?: boolean;
}

export const OwnerSection = ({ form, owners, loading = false }: OwnerSectionProps) => {
  const { t } = useTranslation('quick-add');
  const ownerMode = form.watch('ownerMode');

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <User className="h-4 w-4" />
        {t('sections.owner')}
      </div>

      {/* Owner Mode Selection */}
      <FormField
        control={form.control}
        name="ownerMode"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="select" id="owner-select" />
                  <Label htmlFor="owner-select" className="cursor-pointer">
                    {t('ownerMode.select')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="create" id="owner-create" />
                  <Label htmlFor="owner-create" className="cursor-pointer flex items-center gap-1">
                    <UserPlus className="h-3 w-3" />
                    {t('ownerMode.create')}
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />

      {/* Select Existing Owner */}
      {ownerMode === 'select' && (
        <FormField
          control={form.control}
          name="owner_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.owner')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger disabled={loading}>
                    <SelectValue placeholder={t('placeholders.selectOwner')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name}
                      {owner.phone && ` - ${owner.phone}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Create New Owner */}
      {ownerMode === 'create' && (
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="ownerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fields.ownerName')} *</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('placeholders.ownerName')}
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
              name="ownerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.ownerPhone')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('placeholders.ownerPhone')}
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
              name="ownerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.ownerEmail')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('placeholders.ownerEmail')}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
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
