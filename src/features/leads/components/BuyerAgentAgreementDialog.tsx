import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { leadsService } from '@/lib/serviceProxy';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DateField } from '@/components/ui/date-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  createBuyerAgentAgreementSchema,
  COMMISSION_TYPE_OPTIONS,
  AGREEMENT_STATUS_OPTIONS,
  type CreateBuyerAgentAgreementFormData,
} from '../schemas/buyer-agent-agreement-form';
import type { BuyerAgentAgreement } from '@/services/leads.service';
import { addMonths } from 'date-fns';
import { formatDateForDb } from '@/lib/dates';

interface BuyerAgentAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  existingAgreement?: BuyerAgentAgreement | null;
  onSuccess?: () => void;
}

export function BuyerAgentAgreementDialog({
  open,
  onOpenChange,
  leadId,
  existingAgreement,
  onSuccess,
}: BuyerAgentAgreementDialogProps) {
  const { t } = useTranslation('leads');
  const { user, currency } = useAuth();
  const { currentOrg } = useOrg();

  const form = useForm<CreateBuyerAgentAgreementFormData>({
    resolver: zodResolver(createBuyerAgentAgreementSchema),
    defaultValues: {
      lead_id: leadId,
      signed_date: formatDateForDb(new Date()),
      expiration_date: formatDateForDb(addMonths(new Date(), 6)),
      commission_type: 'percentage',
      commission_rate: 2.5,
      status: 'draft',
    },
  });

  useEffect(() => {
    if (open) {
      if (existingAgreement) {
        form.reset({
          lead_id: leadId,
          signed_date: existingAgreement.signed_date ?? undefined,
          expiration_date: existingAgreement.expiration_date ?? undefined,
          commission_type: existingAgreement.commission_type as any,
          commission_rate: existingAgreement.commission_rate ?? undefined,
          flat_fee_amount: existingAgreement.flat_fee_amount ?? undefined,
          pdf_url: existingAgreement.pdf_url ?? '',
          status: (existingAgreement.status as any) ?? 'draft',
        });
      } else {
        form.reset({
          lead_id: leadId,
          signed_date: formatDateForDb(new Date()),
          expiration_date: formatDateForDb(addMonths(new Date(), 6)),
          commission_type: 'percentage',
          commission_rate: 2.5,
          status: 'draft',
        });
      }
    }
  }, [open, existingAgreement, leadId, form]);

  const onSubmit = async (data: CreateBuyerAgentAgreementFormData) => {
    if (!user?.id || !currentOrg?.id) {
      toast.error('Authentication required');
      return;
    }

    try {
      // Convert null to undefined for service call
      const serviceData = {
        ...data,
        commission_rate: data.commission_rate ?? undefined,
        flat_fee_amount: data.flat_fee_amount ?? undefined,
      };
      await leadsService.createBuyerAgentAgreement(serviceData, user.id, currentOrg.id);
      toast.success(
        existingAgreement
          ? t('toasts.agreementUpdated', 'Agreement updated')
          : t('toasts.agreementCreated', 'Agreement created')
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        existingAgreement
          ? t('toasts.agreementUpdateError', 'Failed to update agreement')
          : t('toasts.agreementCreateError', 'Failed to create agreement')
      );
      console.error(error);
    }
  };

  const commissionType = form.watch('commission_type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingAgreement
              ? t('agreements.edit', 'Edit Buyer-Agent Agreement')
              : t('agreements.create', 'Create Buyer-Agent Agreement')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Signed Date */}
            <FormField
              control={form.control}
              name="signed_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('agreements.signedDate', 'Signed Date')}</FormLabel>
                  <FormControl>
                    <DateField
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expiration Date */}
            <FormField
              control={form.control}
              name="expiration_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('agreements.expirationDate', 'Expiration Date')}</FormLabel>
                  <FormControl>
                    <DateField
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Commission Type */}
            <FormField
              control={form.control}
              name="commission_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('agreements.commissionType', 'Commission Type')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select commission type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMMISSION_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Commission Rate (if percentage) */}
            {commissionType === 'percentage' && (
              <FormField
                control={form.control}
                name="commission_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('agreements.commissionRate', 'Commission Rate (%)')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="2.5"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? null : parseFloat(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Flat Fee Amount (if flat_fee) */}
            {commissionType === 'flat_fee' && (
              <FormField
                control={form.control}
                name="flat_fee_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('agreements.flatFeeAmount', 'Flat Fee Amount ($)')}</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        emptyValue={null}
                        currency={currency}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* PDF URL (optional) */}
            <FormField
              control={form.control}
              name="pdf_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('agreements.pdfUrl', 'Agreement PDF URL')}{' '}
                    <span className="text-muted-foreground">(Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/agreement.pdf"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('agreements.status', 'Status')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('agreements.status', 'Status')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AGREEMENT_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common:actions.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? t('common:actions.saving', 'Saving...')
                  : existingAgreement
                  ? t('common:actions.update', 'Update')
                  : t('common:actions.create', 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
