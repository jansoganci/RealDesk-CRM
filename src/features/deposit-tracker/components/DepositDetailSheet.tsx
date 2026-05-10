import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
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
import { depositTrackerService, type SecurityDeposit, type DepositDeduction, type DepositStatus } from '@/lib/serviceProxy';
import { StatusBadge } from './StatusBadge';
import { DeductionsList } from './DeductionsList';

interface DepositDetailSheetProps {
  deposit: SecurityDeposit | null;
  open: boolean;
  onClose: () => void;
  onEdit: (deposit: SecurityDeposit) => void;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const DepositDetailSheet = ({
  deposit,
  open,
  onClose,
  onEdit,
  onDelete,
  onRefresh,
}: DepositDetailSheetProps) => {
  const { t } = useTranslation('deposit-tracker');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deductions, setDeductions] = useState<DepositDeduction[]>([]);

  useEffect(() => {
    if (deposit?.id && open) {
      depositTrackerService.getDeductions(deposit.id).then(setDeductions).catch(() => {});
    }
  }, [deposit?.id, open]);

  const refreshDeductions = async () => {
    if (deposit?.id) {
      const data = await depositTrackerService.getDeductions(deposit.id);
      setDeductions(data);
    }
    await onRefresh();
  };

  const handleDelete = async () => {
    if (!deposit) return;
    try {
      setDeleting(true);
      await onDelete(deposit.id);
      setDeleteOpen(false);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (status: DepositStatus) => {
    if (!deposit) return;
    try {
      await depositTrackerService.updateStatus(deposit.id, status);
      toast.success(t('toasts.statusSuccess'));
      await onRefresh();
    } catch {
      toast.error(t('toasts.statusError'));
    }
  };

  if (!deposit) return null;

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-2">
              <div>
                <SheetTitle className="text-lg">{t('detail.title')}</SheetTitle>
                <StatusBadge status={deposit.status} className="mt-1" />
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(deposit)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:border-red-300"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="py-4 space-y-6">
            {/* Summary */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('detail.summary')}
              </h3>
              <dl className="space-y-1.5 text-sm">
                <Row label={t('detail.depositAmount')} value={fmt(deposit.deposit_amount)} />
                <Row label={t('detail.heldBy')} value={t(`heldBy.${deposit.held_by}`)} />
                {deposit.held_by === 'other' && deposit.held_by_other_description && (
                  <Row label="" value={deposit.held_by_other_description} />
                )}
                <Row label={t('detail.returnDeadline')} value={deposit.return_deadline} />
                {deposit.return_date && (
                  <Row label={t('detail.returnDate')} value={deposit.return_date} />
                )}
                <Row
                  label={t('detail.interestRequired')}
                  value={deposit.interest_required ? t('detail.yes') : t('detail.no')}
                />
                {deposit.interest_required && deposit.interest_amount != null && (
                  <Row label={t('detail.interestAmount')} value={fmt(deposit.interest_amount)} />
                )}
                {deposit.notes && (
                  <div className="pt-1">
                    <p className="text-xs text-slate-400 font-medium mb-0.5">{t('detail.notes')}</p>
                    <p className="text-slate-700 text-sm">{deposit.notes}</p>
                  </div>
                )}
              </dl>
            </section>

            {/* Status actions */}
            {deposit.status !== 'fully_returned' && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Update Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    onClick={() => handleStatusChange('fully_returned')}
                  >
                    {t('detail.markReturned')}
                  </Button>
                  {deposit.status === 'held' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-700 border-amber-300 hover:bg-amber-50"
                      onClick={() => handleStatusChange('partially_returned')}
                    >
                      {t('detail.markPartial')}
                    </Button>
                  )}
                  {deposit.status !== 'disputed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleStatusChange('disputed')}
                    >
                      {t('detail.markDisputed')}
                    </Button>
                  )}
                </div>
              </section>
            )}

            {/* Deductions */}
            <section>
              <DeductionsList
                depositId={deposit.id}
                depositAmount={deposit.deposit_amount}
                deductions={deductions}
                onRefresh={refreshDeductions}
              />
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={(v) => { if (!v) setDeleteOpen(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleting}
            >
              {t('deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  if (!label) return null;
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className="font-medium text-slate-800 text-right">{value}</dd>
    </div>
  );
}
