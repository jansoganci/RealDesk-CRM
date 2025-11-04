import { useEffect } from 'react';
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
import { getInquirySchema } from './inquirySchema';

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
  const inquirySchema = getInquirySchema(t);
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
        reset({
          name: inquiry.name || '',
          phone: inquiry.phone || '',
          email: inquiry.email || '',
          preferred_city: inquiry.preferred_city || '',
          preferred_district: inquiry.preferred_district || '',
          min_budget: inquiry.min_budget || undefined,
          max_budget: inquiry.max_budget || undefined,
          notes: inquiry.notes || '',
        });
      } else {
        reset({
          name: '',
          phone: '',
          email: '',
          preferred_city: '',
          preferred_district: '',
          min_budget: undefined,
          max_budget: undefined,
          notes: '',
        });
      }
    }
  }, [open, inquiry, reset]);

  const handleFormSubmit = async (data: InquiryFormData) => {
    const cleanedData = {
      ...data,
      email: data.email?.trim() || undefined,
      preferred_city: data.preferred_city?.trim() || undefined,
      preferred_district: data.preferred_district?.trim() || undefined,
      min_budget: data.min_budget || undefined,
      max_budget: data.max_budget || undefined,
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_budget">{t('dialog.form.minBudget')}</Label>
              <Input
                id="min_budget"
                type="number"
                step="0.01"
                placeholder={t('dialog.form.minBudgetPlaceholder')}
                {...register('min_budget', { valueAsNumber: true })}
                disabled={loading}
              />
              {errors.min_budget && (
                <p className={`text-sm ${COLORS.danger.text}`}>{errors.min_budget.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_budget">{t('dialog.form.maxBudget')}</Label>
              <Input
                id="max_budget"
                type="number"
                step="0.01"
                placeholder={t('dialog.form.maxBudgetPlaceholder')}
                {...register('max_budget', { valueAsNumber: true })}
                disabled={loading}
              />
              {errors.max_budget && (
                <p className={`text-sm ${COLORS.danger.text}`}>{errors.max_budget.message}</p>
              )}
            </div>
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
              className={`${COLORS.primary.bgGradient} ${COLORS.primary.bgGradientHover}`}
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
