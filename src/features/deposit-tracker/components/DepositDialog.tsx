import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { depositSchema, type DepositFormValues, HELD_BY_OPTIONS, DEPOSIT_STATUSES } from '../schemas/deposit.schema';
import type { SecurityDeposit } from '@/lib/serviceProxy';

interface DepositDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: DepositFormValues) => Promise<void>;
  defaultValues?: SecurityDeposit | null;
  isLoading?: boolean;
}

export const DepositDialog = ({
  open,
  onClose,
  onSubmit,
  defaultValues,
  isLoading,
}: DepositDialogProps) => {
  const { t } = useTranslation('deposit-tracker');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      deposit_amount: 0,
      held_by: 'landlord',
      status: 'held',
      interest_required: false,
    },
  });

  const interestRequired = watch('interest_required');
  const heldBy = watch('held_by');

  useEffect(() => {
    if (open) {
      if (defaultValues) {
        reset({
          property_id: defaultValues.property_id ?? undefined,
          tenant_id: defaultValues.tenant_id ?? undefined,
          contract_id: defaultValues.contract_id ?? undefined,
          deposit_amount: defaultValues.deposit_amount,
          held_by: defaultValues.held_by,
          held_by_other_description: defaultValues.held_by_other_description ?? undefined,
          return_deadline: defaultValues.return_deadline,
          return_date: defaultValues.return_date ?? undefined,
          status: defaultValues.status,
          interest_required: defaultValues.interest_required,
          interest_amount: defaultValues.interest_amount ?? undefined,
          notes: defaultValues.notes ?? undefined,
        });
      } else {
        reset({
          deposit_amount: 0,
          held_by: 'landlord',
          status: 'held',
          interest_required: false,
        });
      }
    }
  }, [open, defaultValues, reset]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? t('editTitle') : t('createTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Deposit Amount */}
          <div className="space-y-1">
            <Label>{t('form.depositAmount')}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register('deposit_amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.deposit_amount && (
              <p className="text-xs text-red-500">{errors.deposit_amount.message}</p>
            )}
          </div>

          {/* Return Deadline */}
          <div className="space-y-1">
            <Label>{t('form.returnDeadline')}</Label>
            <Input type="date" {...register('return_deadline')} />
            {errors.return_deadline && (
              <p className="text-xs text-red-500">{errors.return_deadline.message}</p>
            )}
          </div>

          {/* Held By */}
          <div className="space-y-1">
            <Label>{t('form.heldBy')}</Label>
            <Select
              value={heldBy}
              onValueChange={(v) => setValue('held_by', v as DepositFormValues['held_by'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HELD_BY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {t(`heldBy.${opt}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {heldBy === 'other' && (
            <div className="space-y-1">
              <Label>{t('form.heldByOtherDescription')}</Label>
              <Input
                {...register('held_by_other_description')}
                placeholder={t('form.heldByOtherDescriptionPlaceholder')}
              />
            </div>
          )}

          {/* Status */}
          <div className="space-y-1">
            <Label>{t('form.status')}</Label>
            <Select
              defaultValue={defaultValues?.status ?? 'held'}
              onValueChange={(v) => setValue('status', v as DepositFormValues['status'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPOSIT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`status.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Return Date */}
          <div className="space-y-1">
            <Label>{t('form.returnDate')}</Label>
            <Input type="date" {...register('return_date')} />
          </div>

          {/* Interest Required */}
          <div className="flex items-center justify-between">
            <Label htmlFor="interest_required">{t('form.interestRequired')}</Label>
            <Switch
              id="interest_required"
              checked={interestRequired}
              onCheckedChange={(v) => setValue('interest_required', v)}
            />
          </div>

          {interestRequired && (
            <div className="space-y-1">
              <Label>{t('form.interestAmount')}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('interest_amount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label>{t('form.notes')}</Label>
            <Textarea
              {...register('notes')}
              placeholder={t('form.notesPlaceholder')}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {t('deleteConfirm.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {defaultValues ? t('detail.title') : t('addDeposit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
