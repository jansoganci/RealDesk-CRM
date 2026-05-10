import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { depositTrackerService, type DepositDeduction } from '@/lib/serviceProxy';
import { deductionSchema, type DeductionFormValues, DEDUCTION_CATEGORIES } from '../schemas/deposit.schema';
import { cn } from '@/lib/utils';

const CATEGORY_CLASSES: Record<string, string> = {
  damage: 'bg-red-100 text-red-700',
  cleaning: 'bg-blue-100 text-blue-800',
  unpaid_rent: 'bg-orange-100 text-orange-800',
  late_fees: 'bg-amber-100 text-amber-800',
  other: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

interface DeductionsListProps {
  depositId: string;
  depositAmount: number;
  deductions: DepositDeduction[];
  onRefresh: () => Promise<void>;
}

export const DeductionsList = ({
  depositId,
  depositAmount,
  deductions,
  onRefresh,
}: DeductionsListProps) => {
  const { t } = useTranslation('deposit-tracker');
  const [addOpen, setAddOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DeductionFormValues>({
    resolver: zodResolver(deductionSchema),
    defaultValues: { description: '', amount: 0, category: null },
  });

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const netDeposit = depositAmount - totalDeductions;

  const onAddSubmit = async (values: DeductionFormValues) => {
    try {
      setSubmitting(true);
      await depositTrackerService.addDeduction(depositId, values);
      toast.success(t('toasts.deductionAdded'));
      reset();
      setAddOpen(false);
      await onRefresh();
    } catch {
      toast.error(t('toasts.deductionAddError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await depositTrackerService.removeDeduction(id);
      toast.success(t('toasts.deductionRemoved'));
      await onRefresh();
    } catch {
      toast.error(t('toasts.deductionRemoveError'));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('deductions.title')}</h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-7 text-xs"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-3 w-3" />
          {t('deductions.addDeduction')}
        </Button>
      </div>

      {deductions.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">{t('deductions.noDeductions')}</p>
      ) : (
        <div className="space-y-2">
          {deductions.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{d.description}</p>
                {d.category && (
                  <Badge className={cn('mt-0.5 text-xs', CATEGORY_CLASSES[d.category] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200')}>
                    {t(`deductionCategory.${d.category}`)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-red-600">
                  -${d.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => setRemovingId(d.id)}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors rounded"
                  aria-label="Remove deduction"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
          <span>{t('deductions.total')}</span>
          <span className="font-semibold text-red-600">
            -${totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100">
          <span>{t('deductions.net')}</span>
          <span className={cn(netDeposit < 0 ? 'text-red-600' : 'text-emerald-700')}>
            ${netDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Add deduction inline form */}
      {addOpen && (
        <form
          onSubmit={handleSubmit(onAddSubmit)}
          className="p-3 rounded-lg border border-blue-200 bg-blue-50 space-y-3"
        >
          <div className="space-y-1">
            <Label className="text-xs">{t('deductions.description')}</Label>
            <Input
              {...register('description')}
              placeholder={t('deductions.descriptionPlaceholder')}
              className="h-8 text-sm"
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">{t('deductions.amount')}</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="h-8 text-sm"
              />
              {errors.amount && (
                <p className="text-xs text-red-500">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('deductions.category')}</Label>
              <Select
                onValueChange={(v) => setValue('category', v as DeductionFormValues['category'])}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={t('deductions.categoryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {DEDUCTION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`deductionCategory.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setAddOpen(false); reset(); }}
            >
              {t('deleteConfirm.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {t('deductions.addDeduction')}
            </Button>
          </div>
        </form>
      )}

      {/* Remove confirm dialog */}
      <AlertDialog open={!!removingId} onOpenChange={(v) => { if (!v) setRemovingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => removingId && handleRemove(removingId)}
            >
              {t('deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
