import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { PropertyInquiry } from '../../types';
import { getRentalInquirySchema, getSaleInquirySchema } from '../properties/propertySchemas';
import { InquiryTypeSelector } from './InquiryTypeSelector';

interface InquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inquiry: PropertyInquiry | null;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export const InquiryDialog = ({
  open,
  onOpenChange,
  inquiry,
  onSubmit,
  loading = false,
}: InquiryDialogProps) => {
  const { t } = useTranslation(['inquiries', 'common']);
  const [inquiryType, setInquiryType] = useState<'rental' | 'sale'>('rental');

  // Conditional schema based on inquiry type
  const inquirySchema = inquiryType === 'rental'
    ? getRentalInquirySchema(t)
    : getSaleInquirySchema(t);
  type InquiryFormData = z.infer<typeof inquirySchema>;

  // Type assertion for onSubmit to maintain type safety
  const typedOnSubmit = onSubmit as (data: InquiryFormData) => Promise<void>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
  });

  useEffect(() => {
    if (open) {
      if (inquiry) {
        // Detect inquiry type from existing inquiry
        const existingType = (inquiry as any).inquiry_type || 'rental';
        setInquiryType(existingType);

        // Reset form with type-specific data
        if (existingType === 'rental') {
          reset({
            name: inquiry.name || '',
            phone: inquiry.phone || '',
            email: inquiry.email || '',
            preferred_city: inquiry.preferred_city || '',
            preferred_district: inquiry.preferred_district || '',
            min_rent_budget: (inquiry as any).min_rent_budget || undefined,
            max_rent_budget: (inquiry as any).max_rent_budget || undefined,
            inquiry_type: 'rental',
            notes: inquiry.notes || '',
          } as any);
        } else {
          reset({
            name: inquiry.name || '',
            phone: inquiry.phone || '',
            email: inquiry.email || '',
            preferred_city: inquiry.preferred_city || '',
            preferred_district: inquiry.preferred_district || '',
            min_sale_budget: (inquiry as any).min_sale_budget || undefined,
            max_sale_budget: (inquiry as any).max_sale_budget || undefined,
            inquiry_type: 'sale',
            notes: inquiry.notes || '',
          } as any);
        }
      } else {
        // New inquiry - use current inquiry type
        if (inquiryType === 'rental') {
          reset({
            name: '',
            phone: '',
            email: '',
            preferred_city: '',
            preferred_district: '',
            min_rent_budget: undefined,
            max_rent_budget: undefined,
            inquiry_type: 'rental',
            notes: '',
          } as any);
        } else {
          reset({
            name: '',
            phone: '',
            email: '',
            preferred_city: '',
            preferred_district: '',
            min_sale_budget: undefined,
            max_sale_budget: undefined,
            inquiry_type: 'sale',
            notes: '',
          } as any);
        }
      }
    }
  }, [open, inquiry, inquiryType, reset]);

  const handleFormSubmit = async (data: InquiryFormData) => {
    const cleanedData = {
      ...data,
      email: data.email?.trim() || undefined,
      preferred_city: data.preferred_city?.trim() || undefined,
      preferred_district: data.preferred_district?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };
    await typedOnSubmit(cleanedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {inquiry ? t('dialog.editTitle') : t('dialog.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {inquiry
              ? t('dialog.editDescription')
              : t('dialog.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Inquiry Type Selector - only shown for new inquiries */}
          {!inquiry && (
            <div className="space-y-2">
              <Label>{t('dialog.form.inquiryType')} *</Label>
              <InquiryTypeSelector
                value={inquiryType}
                onChange={setInquiryType}
                disabled={loading}
              />
            </div>
          )}

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
              <Label htmlFor="phone">{t('dialog.form.phone')} *</Label>
              <Input
                id="phone"
                placeholder={t('dialog.form.phonePlaceholder')}
                {...register('phone')}
                disabled={loading}
              />
              {errors.phone && (
                <p className={`text-sm ${COLORS.danger.text}`}>{errors.phone.message}</p>
              )}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred_city">{t('dialog.form.preferredCity')}</Label>
              <Input
                id="preferred_city"
                placeholder={t('dialog.form.preferredCityPlaceholder')}
                {...register('preferred_city')}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_district">{t('dialog.form.preferredDistrict')}</Label>
              <Input
                id="preferred_district"
                placeholder={t('dialog.form.preferredDistrictPlaceholder')}
                {...register('preferred_district')}
                disabled={loading}
              />
            </div>
          </div>

          {/* Conditional Budget Fields based on Inquiry Type */}
          {inquiryType === 'rental' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_rent_budget">{t('dialog.form.minRentBudget')}</Label>
                <Input
                  id="min_rent_budget"
                  type="number"
                  step="0.01"
                  placeholder={t('dialog.form.minRentBudgetPlaceholder')}
                  {...register('min_rent_budget' as any, { valueAsNumber: true })}
                  disabled={loading}
                />
                {(errors as any).min_rent_budget && (
                  <p className={`text-sm ${COLORS.danger.text}`}>{(errors as any).min_rent_budget.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_rent_budget">{t('dialog.form.maxRentBudget')}</Label>
                <Input
                  id="max_rent_budget"
                  type="number"
                  step="0.01"
                  placeholder={t('dialog.form.maxRentBudgetPlaceholder')}
                  {...register('max_rent_budget' as any, { valueAsNumber: true })}
                  disabled={loading}
                />
                {(errors as any).max_rent_budget && (
                  <p className={`text-sm ${COLORS.danger.text}`}>{(errors as any).max_rent_budget.message}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_sale_budget">{t('dialog.form.minSaleBudget')}</Label>
                <Input
                  id="min_sale_budget"
                  type="number"
                  step="0.01"
                  placeholder={t('dialog.form.minSaleBudgetPlaceholder')}
                  {...register('min_sale_budget' as any, { valueAsNumber: true })}
                  disabled={loading}
                />
                {(errors as any).min_sale_budget && (
                  <p className={`text-sm ${COLORS.danger.text}`}>{(errors as any).min_sale_budget.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_sale_budget">{t('dialog.form.maxSaleBudget')}</Label>
                <Input
                  id="max_sale_budget"
                  type="number"
                  step="0.01"
                  placeholder={t('dialog.form.maxSaleBudgetPlaceholder')}
                  {...register('max_sale_budget' as any, { valueAsNumber: true })}
                  disabled={loading}
                />
                {(errors as any).max_sale_budget && (
                  <p className={`text-sm ${COLORS.danger.text}`}>{(errors as any).max_sale_budget.message}</p>
                )}
              </div>
            </div>
          )}

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

          <DialogFooter className="pt-4 border-t">
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
              className={`${COLORS.primary.bg} ${COLORS.primary.hover} ${COLORS.text.white}`}
            >
              {loading
                ? t('saving', { ns: 'common' })
                : inquiry
                ? t('dialog.updateButton')
                : t('dialog.addButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
