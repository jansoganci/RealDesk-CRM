import { useEffect, useState } from 'react';
import { COLORS } from '@/config/colors';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Tenant, Property } from '../../types';
import { useTranslation } from 'react-i18next';
import { getTenantSchema } from './tenantSchema';
import { propertiesService } from '../../lib/serviceProxy';

interface TenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export const TenantDialog = ({
  open,
  onOpenChange,
  tenant,
  onSubmit,
  loading = false,
}: TenantDialogProps) => {
  const { t } = useTranslation(['tenants', 'common']);
  const tenantSchema = getTenantSchema(t);
  type TenantFormData = z.infer<typeof tenantSchema>;
  
  // Update the interface type to match the actual form data
  const typedOnSubmit = onSubmit as (data: TenantFormData) => Promise<void>;

  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
  });

  const selectedPropertyId = watch('property_id');

  useEffect(() => {
    if (open) {
      const initForm = async () => {
        await loadProperties();
        if (tenant) {
          reset({
            name: tenant.name || '',
            phone: tenant.phone || '',
            email: tenant.email || '',
            property_id: tenant.property_id || '',
            notes: tenant.notes || '',
          });
        } else {
          reset({
            name: '',
            phone: '',
            email: '',
            property_id: '',
            notes: '',
          });
        }
      };
      initForm();
    }
  }, [open, tenant, reset]);

  const loadProperties = async () => {
    try {
      setLoadingProperties(true);
      const data = await propertiesService.getAll();
      setProperties(data);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleFormSubmit = async (data: TenantFormData) => {
    const submitData: TenantFormData = {
      ...data,
      property_id: data.property_id && data.property_id !== '' ? data.property_id : undefined,
      phone: data.phone?.trim() || undefined,
      email: data.email?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };
    await typedOnSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tenant ? t('dialog.editTitle') : t('dialog.addTitle')}</DialogTitle>
          <DialogDescription>
            {tenant
              ? t('dialog.editDescription')
              : t('dialog.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('dialog.form.name')} *</Label>
            <Input
              id="name"
              placeholder={t('dialog.form.namePlaceholder')}
              {...register('name')}
              disabled={loading}
            />
            {errors.name && (
              <p className={`text-sm ${COLORS.danger.text}`}>{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('dialog.form.phone')}</Label>
              <Input
                id="phone"
                placeholder={t('dialog.form.phonePlaceholder')}
                {...register('phone')}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('dialog.form.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('dialog.form.emailPlaceholder')}
                {...register('email')}
                disabled={loading}
              />
              {errors.email && (
                <p className={`text-sm ${COLORS.danger.text}`}>{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="property_id">{t('dialog.form.property')}</Label>
            <Select
              value={selectedPropertyId && selectedPropertyId !== '' ? selectedPropertyId : 'none'}
              onValueChange={(value) => setValue('property_id', value === 'none' ? '' : value)}
              disabled={loadingProperties || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('dialog.form.propertyPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('dialog.form.noProperty')}</SelectItem>
                {properties
                  .filter(p => p.status !== 'Inactive')
                  .map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address} - {property.status}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className={`text-xs ${COLORS.muted.textLight}`}>
              {t('dialog.form.propertyHint')}
            </p>
          </div>

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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`${COLORS.primary.bgGradient} ${COLORS.primary.bgGradientHover}`}
            >
              {loading ? t('saving', { ns: 'common' }) : tenant ? t('dialog.updateButton') : t('dialog.addButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
