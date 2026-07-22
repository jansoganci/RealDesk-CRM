import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/config/colors';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { PropertyInquiry } from '../../types';
import {
  getInquirySchema,
  LEAD_SOURCE_OPTIONS,
  type InquiryDialogFormValues,
  type InquirySubmitPayload,
} from './inquirySchema';
import { InquiryTypeSelector } from './InquiryTypeSelector';
import { US_STATES } from '@/features/leads/schemas/lead-form';

export type { InquirySubmitPayload };

interface InquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inquiry: PropertyInquiry | null;
  onSubmit: (data: InquirySubmitPayload) => Promise<void>;
  loading?: boolean;
}

export const InquiryDialog = ({
  open,
  onOpenChange,
  inquiry,
  onSubmit,
  loading = false,
}: InquiryDialogProps) => {
  const { t } = useTranslation(['leads', 'common']);

  const inquirySchema = useMemo(() => getInquirySchema(t), [t]);

  const emptyDefaults = useMemo(
    (): InquiryDialogFormValues => ({
      name: '',
      phone: '',
      email: '',
      preferred_city: '',
      preferred_state: undefined,
      lead_source: undefined,
      pre_approved: false,
      inquiry_type: 'rental',
      min_rent_budget: undefined,
      max_rent_budget: undefined,
      min_sale_budget: undefined,
      max_sale_budget: undefined,
      notes: '',
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InquiryDialogFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: emptyDefaults,
  });

  const inquiryType = watch('inquiry_type');
  const preferredStateVal = watch('preferred_state');
  const leadSourceVal = watch('lead_source');

  useEffect(() => {
    if (!open) return;
    if (inquiry) {
      reset({
        name: inquiry.name || '',
        phone: inquiry.phone || '',
        email: inquiry.email || '',
        preferred_city: inquiry.preferred_city || '',
        preferred_state:
          inquiry.preferred_state && inquiry.preferred_state.trim().length === 2
            ? inquiry.preferred_state.toUpperCase()
            : undefined,
        lead_source: (inquiry.lead_source ?? undefined) as
          | InquiryDialogFormValues['lead_source']
          | undefined,
        pre_approved: inquiry.pre_approved ?? false,
        inquiry_type: inquiry.inquiry_type === 'sale' ? 'sale' : 'rental',
        min_rent_budget: inquiry.inquiry_type === 'rental' ? inquiry.min_rent_budget ?? undefined : undefined,
        max_rent_budget: inquiry.inquiry_type === 'rental' ? inquiry.max_rent_budget ?? undefined : undefined,
        min_sale_budget: inquiry.inquiry_type === 'sale' ? inquiry.min_sale_budget ?? undefined : undefined,
        max_sale_budget: inquiry.inquiry_type === 'sale' ? inquiry.max_sale_budget ?? undefined : undefined,
        notes: inquiry.notes || '',
      });
    } else {
      reset(emptyDefaults);
    }
  }, [open, inquiry, reset, emptyDefaults]);

  const handleFormSubmit = async (data: InquiryDialogFormValues) => {
    const payload = {
      ...data,
      email: data.email?.trim() || undefined,
      preferred_city: data.preferred_city?.trim() || undefined,
      preferred_state: data.preferred_state?.trim()?.toUpperCase() || undefined,
      preferred_district: null as string | null,
      notes: data.notes?.trim() || undefined,
    };
    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{inquiry ? t('dialog.editTitle') : t('dialog.addTitle')}</DialogTitle>
          <DialogDescription>
            {inquiry ? t('dialog.editDescription') : t('dialog.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {!inquiry && (
            <div className="space-y-2">
              <Label>{t('dialog.form.inquiryType')} *</Label>
              <InquiryTypeSelector
                value={inquiryType}
                onChange={(next) =>
                  setValue('inquiry_type', next, { shouldValidate: true, shouldDirty: true })
                }
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

          <div className="space-y-2">
            <Label htmlFor="lead_source">{t('dialog.form.leadSource')}</Label>
            <Select
              value={leadSourceVal ?? '__none__'}
              onValueChange={(value) =>
                setValue(
                  'lead_source',
                  value === '__none__'
                    ? undefined
                    : (value as NonNullable<InquiryDialogFormValues['lead_source']>),
                  { shouldValidate: true },
                )
              }
              disabled={loading}
            >
              <SelectTrigger id="lead_source">
                <SelectValue placeholder={t('dialog.form.leadSourcePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('dialog.form.leadSourceAny')}</SelectItem>
                {LEAD_SOURCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Label htmlFor="preferred_state">{t('dialog.form.preferredState')}</Label>
              <Select
                value={
                  preferredStateVal && preferredStateVal.length === 2
                    ? preferredStateVal
                    : '__none__'
                }
                onValueChange={(value) =>
                  setValue(
                    'preferred_state',
                    value === '__none__' ? undefined : (value as InquiryDialogFormValues['preferred_state']),
                    { shouldValidate: true },
                  )
                }
                disabled={loading}
              >
                <SelectTrigger id="preferred_state">
                  <SelectValue placeholder={t('dialog.form.preferredStatePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('dialog.form.preferredStateAny')}</SelectItem>
                  {US_STATES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.preferred_state && (
                <p className={`text-sm ${COLORS.danger.text}`}>{errors.preferred_state.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 py-1">
            <Label htmlFor="pre_approved" className="text-sm font-normal cursor-pointer">
              {t('dialog.form.preApproved')}
            </Label>
            <Switch
              id="pre_approved"
              checked={watch('pre_approved') ?? false}
              onCheckedChange={(checked) =>
                setValue('pre_approved', checked, { shouldValidate: true, shouldDirty: true })
              }
              disabled={loading}
            />
          </div>

          {inquiryType === 'rental' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_rent_budget">{t('dialog.form.minRentBudget')}</Label>
                <Input
                  id="min_rent_budget"
                  type="number"
                  step="0.01"
                  placeholder={t('dialog.form.minRentBudgetPlaceholder')}
                  {...register('min_rent_budget', { valueAsNumber: true })}
                  disabled={loading}
                />
                {errors.min_rent_budget && (
                  <p className={`text-sm ${COLORS.danger.text}`}>{errors.min_rent_budget.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_rent_budget">{t('dialog.form.maxRentBudget')}</Label>
                <Input
                  id="max_rent_budget"
                  type="number"
                  step="0.01"
                  placeholder={t('dialog.form.maxRentBudgetPlaceholder')}
                  {...register('max_rent_budget', { valueAsNumber: true })}
                  disabled={loading}
                />
                {errors.max_rent_budget && (
                  <p className={`text-sm ${COLORS.danger.text}`}>{errors.max_rent_budget.message}</p>
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
                  {...register('min_sale_budget', { valueAsNumber: true })}
                  disabled={loading}
                />
                {errors.min_sale_budget && (
                  <p className={`text-sm ${COLORS.danger.text}`}>{errors.min_sale_budget.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_sale_budget">{t('dialog.form.maxSaleBudget')}</Label>
                <Input
                  id="max_sale_budget"
                  type="number"
                  step="0.01"
                  placeholder={t('dialog.form.maxSaleBudgetPlaceholder')}
                  {...register('max_sale_budget', { valueAsNumber: true })}
                  disabled={loading}
                />
                {errors.max_sale_budget && (
                  <p className={`text-sm ${COLORS.danger.text}`}>{errors.max_sale_budget.message}</p>
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
