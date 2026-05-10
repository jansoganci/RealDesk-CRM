import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Send, FileSignature, CheckCircle, XCircle } from 'lucide-react';
import { leadsService } from '@/lib/serviceProxy';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const { user } = useAuth();
  const { currentOrg } = useOrg();

  const getDateInputValue = (value: unknown): string => {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? '' : value.toISOString().split('T')[0];
    }
    if (typeof value === 'string') {
      return value;
    }
    return '';
  };

  const form = useForm<CreateBuyerAgentAgreementFormData>({
    resolver: zodResolver(createBuyerAgentAgreementSchema),
    defaultValues: {
      lead_id: leadId,
      signed_date: new Date(),
      expiration_date: addMonths(new Date(), 6),
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
          signed_date: existingAgreement.signed_date
            ? new Date(existingAgreement.signed_date)
            : undefined,
          expiration_date: existingAgreement.expiration_date
            ? new Date(existingAgreement.expiration_date)
            : undefined,
          commission_type: existingAgreement.commission_type as any,
          commission_rate: existingAgreement.commission_rate ?? undefined,
          flat_fee_amount: existingAgreement.flat_fee_amount ?? undefined,
          pdf_url: existingAgreement.pdf_url ?? '',
          status: (existingAgreement.status as any) ?? 'draft',
        });
      } else {
        form.reset({
          lead_id: leadId,
          signed_date: new Date(),
          expiration_date: addMonths(new Date(), 6),
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
      const serviceData = {
        ...data,
        commission_rate: data.commission_rate ?? undefined,
        flat_fee_amount: data.flat_fee_amount ?? undefined,
      };

      if (existingAgreement) {
        await leadsService.updateBuyerAgentAgreement(existingAgreement.id, serviceData, user.id);
        toast.success(t('toasts.agreementUpdated', 'Agreement updated'));
      } else {
        await leadsService.createBuyerAgentAgreement(serviceData, user.id, currentOrg.id);
        toast.success(t('toasts.agreementCreated', 'Agreement created'));
      }

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
  const status = form.watch('status');

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
                    <Input
                      type="date"
                      value={getDateInputValue(field.value)}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
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
                    <Input
                      type="date"
                      value={getDateInputValue(field.value)}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
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
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="5000.00"
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
            <div className="space-y-2">
              <div className="space-y-1">
                <Label>{t('agreements.status', 'Status')}</Label>
                <div>
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    status === 'draft' && 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600',
                    status === 'sent' && 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700',
                    status === 'signed' && 'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-700',
                    status === 'active' && 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-950/50 dark:text-green-300 dark:border-green-700',
                    status === 'expired' && 'bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-700',
                    status === 'terminated' && 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-700',
                  )}>
                    {AGREEMENT_STATUS_OPTIONS.find(o => o.value === status)?.label ?? status}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {status === 'draft' && (
                  <Button type="button" size="sm" variant="outline" onClick={() => form.setValue('status', 'sent')}>
                    <Send className="h-4 w-4 mr-1" />
                    {t('agreements.markAsSent', 'Mark as Sent')}
                  </Button>
                )}
                {status === 'sent' && (
                  <Button type="button" size="sm" variant="outline" onClick={() => form.setValue('status', 'signed')}>
                    <FileSignature className="h-4 w-4 mr-1" />
                    {t('agreements.markAsSigned', 'Mark as Signed')}
                  </Button>
                )}
                {status === 'signed' && (
                  <Button type="button" size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950/50" onClick={() => form.setValue('status', 'active')}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t('agreements.activate', 'Activate Agreement')}
                  </Button>
                )}
                {status === 'active' && (
                  <Button type="button" size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => form.setValue('status', 'terminated')}>
                    <XCircle className="h-4 w-4 mr-1" />
                    {t('agreements.terminate', 'Terminate Agreement')}
                  </Button>
                )}
                {(status === 'active' || status === 'signed') && (
                  <p className="text-xs text-muted-foreground mt-1 w-full">
                    {t('agreements.saveToApply', 'Save the agreement to apply this status change.')}
                  </p>
                )}
              </div>
            </div>

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
