import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Search, ClipboardList } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScreeningDialog } from './components/ScreeningDialog';
import { ScreeningDetailSheet } from './components/ScreeningDetailSheet';
import { SCREENING_STATUSES, type ScreeningFormValues } from './schemas/screening.schema';
import {
  applicantScreeningService,
  type ApplicantScreening,
  type ScreeningStatus,
} from '@/lib/serviceProxy';
import { cn } from '@/lib/utils';
import { useScreeningData } from './hooks/useScreeningData';

const STATUS_CLASSES: Record<ScreeningStatus, string> = {
  pending:     'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  in_review:   'bg-yellow-100 text-yellow-800',
  approved:    'bg-emerald-100 text-emerald-800',
  rejected:    'bg-red-100 text-red-700',
  flagged:     'bg-orange-100 text-orange-800',
};

function checklistProgress(s: ApplicantScreening): number {
  const fields = [
    s.background_check,
    s.credit_check,
    s.employment_verification,
    s.landlord_reference,
    s.income_verification,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

export const ScreeningPage = () => {
  const { t } = useTranslation('screening');

  const { screenings, loading, refresh } = useScreeningData();

  const [statusFilter, setStatusFilter] = useState<ScreeningStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScreening, setEditingScreening] = useState<ApplicantScreening | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [detailScreening, setDetailScreening] = useState<ApplicantScreening | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = screenings;
    if (statusFilter !== 'all') {
      list = list.filter((s) => s.screening_status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.applicant_name.toLowerCase().includes(q) ||
          (s.applicant_email ?? '').toLowerCase().includes(q) ||
          (s.applicant_phone ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [screenings, statusFilter, searchQuery]);

  const openCreate = () => {
    setEditingScreening(null);
    setDialogOpen(true);
  };

  const openEdit = useCallback((screening: ApplicantScreening) => {
    setEditingScreening(screening);
    setDialogOpen(true);
    setDetailOpen(false);
  }, []);

  const openDetail = (screening: ApplicantScreening) => {
    setDetailScreening(screening);
    setDetailOpen(true);
  };

  const handleSubmit = async (values: ScreeningFormValues) => {
    try {
      setIsSubmitting(true);
      if (editingScreening) {
        await applicantScreeningService.update(editingScreening.id, values);
        toast.success(t('toasts.updateSuccess'));
      } else {
        await applicantScreeningService.create(values);
        toast.success(t('toasts.createSuccess'));
      }
      setDialogOpen(false);
      await refresh();
    } catch {
      toast.error(editingScreening ? t('toasts.updateError') : t('toasts.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await applicantScreeningService.softDelete(id);
      toast.success(t('toasts.deleteSuccess'));
      await refresh();
    } catch {
      toast.error(t('toasts.deleteError'));
    }
  };

  const handleChecklistToggle = async (id: string, field: string, value: boolean) => {
    try {
      const updated = await applicantScreeningService.update(id, { [field]: value });
      // Update local detail view without full refresh
      setDetailScreening(updated);
      await refresh();
    } catch {
      toast.error(t('toasts.updateError'));
    }
  };

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: screenings.length };
    for (const s of SCREENING_STATUSES) {
      counts[s] = screenings.filter((x) => x.screening_status === s).length;
    }
    return counts;
  }, [screenings]);

  return (
    <MainLayout title={t('title')}>
      <PageContainer>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('title')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('subtitle')}</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('addScreening')}
          </Button>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {(['all', ...SCREENING_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                statusFilter === s
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              )}
            >
              {t(s === 'all' ? 'filters.all' : `filters.${s}`)}
              {tabCounts[s] > 0 && (
                <span className={cn(
                  'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                  statusFilter === s ? 'bg-white/25 dark:bg-white/15' : 'bg-slate-200 dark:bg-slate-600'
                )}>
                  {tabCounts[s]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            className="pl-9"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardList className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">{t('noScreenings')}</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{t('noScreeningsDesc')}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openDetail(s)}
                  className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{s.applicant_name}</p>
                      {s.applicant_email && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.applicant_email}</p>
                      )}
                    </div>
                    <Badge className={cn('text-xs shrink-0', STATUS_CLASSES[s.screening_status])}>
                      {t(`status.${s.screening_status}`)}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <Progress value={checklistProgress(s)} className="h-1.5" />
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop table */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/70">
                  <TableHead>{t('table.applicant')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('table.moveIn')}</TableHead>
                  <TableHead>{t('table.income')}</TableHead>
                  <TableHead>{t('table.creditScore')}</TableHead>
                  <TableHead>{t('table.progress')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => openDetail(s)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{s.applicant_name}</p>
                        {s.applicant_email && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{s.applicant_email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', STATUS_CLASSES[s.screening_status])}>
                        {t(`status.${s.screening_status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                      {s.desired_move_in_date ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                      {s.monthly_income != null ? `$${s.monthly_income.toLocaleString()}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                      {s.credit_score ?? '—'}
                    </TableCell>
                    <TableCell className="w-28">
                      <div className="flex items-center gap-2">
                        <Progress value={checklistProgress(s)} className="h-2 flex-1" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{checklistProgress(s)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create / Edit dialog */}
        <ScreeningDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          defaultValues={editingScreening}
          isLoading={isSubmitting}
        />

        {/* Detail sheet */}
        <ScreeningDetailSheet
          screening={detailScreening}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onChecklistToggle={handleChecklistToggle}
        />
      </PageContainer>
    </MainLayout>
  );
};
