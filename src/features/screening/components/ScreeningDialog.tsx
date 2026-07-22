import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { screeningSchema, SCREENING_STATUSES, type ScreeningFormValues } from '../schemas/screening.schema';
import type { ApplicantScreening } from '@/lib/serviceProxy';

interface ScreeningDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ScreeningFormValues) => Promise<void>;
  defaultValues?: ApplicantScreening | null;
  isLoading?: boolean;
}

const emptyDefaults: ScreeningFormValues = {
  applicant_name: '',
  applicant_email: '',
  applicant_phone: '',
  screening_status: 'pending',
  property_id: null,
  lead_id: null,
  desired_move_in_date: null,
  monthly_income: null,
  credit_score: null,
  background_check: false,
  credit_check: false,
  employment_verification: false,
  landlord_reference: false,
  income_verification: false,
  notes: '',
};

export const ScreeningDialog = ({
  open,
  onClose,
  onSubmit,
  defaultValues,
  isLoading = false,
}: ScreeningDialogProps) => {
  const { t } = useTranslation('screening');

  const form = useForm<ScreeningFormValues>({
    resolver: zodResolver(screeningSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (open) {
      if (defaultValues) {
        form.reset({
          applicant_name: defaultValues.applicant_name,
          applicant_email: defaultValues.applicant_email ?? '',
          applicant_phone: defaultValues.applicant_phone ?? '',
          screening_status: defaultValues.screening_status,
          property_id: defaultValues.property_id ?? null,
          lead_id: defaultValues.lead_id ?? null,
          desired_move_in_date: defaultValues.desired_move_in_date ?? null,
          monthly_income: defaultValues.monthly_income ?? null,
          credit_score: defaultValues.credit_score ?? null,
          background_check: defaultValues.background_check,
          credit_check: defaultValues.credit_check,
          employment_verification: defaultValues.employment_verification,
          landlord_reference: defaultValues.landlord_reference,
          income_verification: defaultValues.income_verification,
          notes: defaultValues.notes ?? '',
        });
      } else {
        form.reset(emptyDefaults);
      }
    }
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  const isEditing = Boolean(defaultValues);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('dialog.editTitle') : t('dialog.createTitle')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="applicant_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.applicantName')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="applicant_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.applicantEmail')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jane@example.com" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="applicant_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.applicantPhone')}</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 000-0000" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="screening_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.screeningStatus')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SCREENING_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`status.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Move-in date */}
            <FormField
              control={form.control}
              name="desired_move_in_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.desiredMoveInDate')}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Monthly Income */}
            <FormField
              control={form.control}
              name="monthly_income"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.monthlyIncome')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="5000"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Credit Score */}
            <FormField
              control={form.control}
              name="credit_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.creditScore')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={300}
                      max={850}
                      step={1}
                      placeholder="720"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Additional notes…"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                {t('dialog.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('dialog.saving') : t('dialog.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
