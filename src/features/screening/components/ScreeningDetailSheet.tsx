import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
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
import { Pencil, Trash2, Mail, Phone, DollarSign, CreditCard, CalendarDays } from 'lucide-react';
import { ScreeningChecklist } from './ScreeningChecklist';
import type { ApplicantScreening, ScreeningStatus } from '@/lib/serviceProxy';
import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<ScreeningStatus, string> = {
  pending:     'bg-muted text-muted-foreground',
  in_review:   'bg-warning/15 text-warning',
  approved:    'bg-success/15 text-success',
  rejected:    'bg-destructive/15 text-destructive',
  flagged:     'bg-warning/15 text-warning',
};

interface ScreeningDetailSheetProps {
  screening: ApplicantScreening | null;
  open: boolean;
  onClose: () => void;
  onEdit: (screening: ApplicantScreening) => void;
  onDelete: (id: string) => Promise<void>;
  onChecklistToggle: (id: string, field: string, value: boolean) => Promise<void>;
}

export const ScreeningDetailSheet = ({
  screening,
  open,
  onClose,
  onEdit,
  onDelete,
  onChecklistToggle,
}: ScreeningDetailSheetProps) => {
  const { t } = useTranslation('screening');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!screening) return null;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await onDelete(screening.id);
      setDeleteOpen(false);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div>
                <SheetTitle className="text-lg">{screening.applicant_name}</SheetTitle>
                <Badge className={cn('mt-1 text-xs font-medium', STATUS_CLASSES[screening.screening_status])}>
                  {t(`status.${screening.screening_status}`)}
                </Badge>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(screening)}
                  aria-label={t('detail.edit')}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => setDeleteOpen(true)}
                  aria-label={t('detail.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Contact Info */}
            <section>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                {t('detail.contactInfo')}
              </h3>
              <div className="space-y-2">
                {screening.applicant_email && (
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>{screening.applicant_email}</span>
                  </div>
                )}
                {screening.applicant_phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <Phone className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>{screening.applicant_phone}</span>
                  </div>
                )}
                {screening.desired_move_in_date && (
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <CalendarDays className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>{screening.desired_move_in_date}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Financials */}
            {(screening.monthly_income != null || screening.credit_score != null) && (
              <section>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  {t('detail.financials')}
                </h3>
                <div className="space-y-2">
                  {screening.monthly_income != null && (
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <DollarSign className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span>${screening.monthly_income.toLocaleString()}/mo</span>
                    </div>
                  )}
                  {screening.credit_score != null && (
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <CreditCard className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span>{t('table.creditScore')}: {screening.credit_score}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Checklist */}
            <section>
              <ScreeningChecklist
                screening={screening}
                onToggle={(field, value) => onChecklistToggle(screening.id, field, value)}
              />
            </section>

            {/* Notes */}
            <section>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                {t('detail.notes')}
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                {screening.notes || t('detail.noNotes')}
              </p>
            </section>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('detail.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('detail.confirmDeleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('detail.cancelDelete')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('detail.confirmDeleteBtn')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
