import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Search, Landmark } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { depositTrackerService, type SecurityDeposit, type DepositStatus } from '@/lib/serviceProxy';
import { cn } from '@/lib/utils';
import { useDepositTracker } from './hooks/useDepositTracker';
import { DepositDialog } from './components/DepositDialog';
import { DepositDetailSheet } from './components/DepositDetailSheet';
import { StatusBadge } from './components/StatusBadge';
import { DEPOSIT_STATUSES, type DepositFormValues } from './schemas/deposit.schema';

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function rowUrgencyClass(deposit: SecurityDeposit): string {
  if (deposit.status === 'fully_returned') return '';
  const days = daysUntil(deposit.return_deadline);
  if (days < 0) return 'bg-red-50 hover:bg-red-100';
  if (days <= 7) return 'bg-amber-50 hover:bg-amber-100';
  return 'hover:bg-slate-50 dark:hover:bg-slate-800/50';
}

export const DepositTrackerPage = () => {
  const { t } = useTranslation('deposit-tracker');
  const { deposits, loading, refresh } = useDepositTracker();

  const [statusFilter, setStatusFilter] = useState<DepositStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<SecurityDeposit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [detailDeposit, setDetailDeposit] = useState<SecurityDeposit | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = deposits;
    if (statusFilter !== 'all') {
      list = list.filter((d) => d.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          (d.property_id ?? '').toLowerCase().includes(q) ||
          (d.tenant_id ?? '').toLowerCase().includes(q) ||
          (d.notes ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [deposits, statusFilter, searchQuery]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: deposits.length };
    for (const s of DEPOSIT_STATUSES) {
      counts[s] = deposits.filter((d) => d.status === s).length;
    }
    return counts;
  }, [deposits]);

  const openCreate = () => {
    setEditingDeposit(null);
    setDialogOpen(true);
  };

  const openEdit = useCallback((deposit: SecurityDeposit) => {
    setEditingDeposit(deposit);
    setDialogOpen(true);
    setDetailOpen(false);
  }, []);

  const openDetail = (deposit: SecurityDeposit) => {
    setDetailDeposit(deposit);
    setDetailOpen(true);
  };

  const handleSubmit = async (values: DepositFormValues) => {
    try {
      setIsSubmitting(true);
      if (editingDeposit) {
        await depositTrackerService.update(editingDeposit.id, values);
        toast.success(t('toasts.updateSuccess'));
      } else {
        await depositTrackerService.create(values);
        toast.success(t('toasts.createSuccess'));
      }
      setDialogOpen(false);
      await refresh();
    } catch {
      toast.error(editingDeposit ? t('toasts.updateError') : t('toasts.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await depositTrackerService.softDelete(id);
      toast.success(t('toasts.deleteSuccess'));
      await refresh();
    } catch {
      toast.error(t('toasts.deleteError'));
    }
  };

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
            {t('addDeposit')}
          </Button>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {(['all', ...DEPOSIT_STATUSES] as const).map((s) => (
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
              {(tabCounts[s] ?? 0) > 0 && (
                <span
                  className={cn(
                    'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                    statusFilter === s ? 'bg-white/25 dark:bg-white/15' : 'bg-slate-200 dark:bg-slate-600'
                  )}
                >
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

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Landmark className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">{t('noDeposits')}</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{t('noDepositsDesc')}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((d) => {
                const days = daysUntil(d.return_deadline);
                return (
                  <button
                    key={d.id}
                    onClick={() => openDetail(d)}
                    className={cn(
                      'w-full text-left p-4 transition-colors',
                      rowUrgencyClass(d)
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          ${d.deposit_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d.return_deadline}</p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    {d.status !== 'fully_returned' && (
                      <p className={cn('text-xs mt-1.5', days < 0 ? 'text-red-600 font-medium' : days <= 7 ? 'text-amber-600 font-medium' : 'text-slate-400 dark:text-slate-500')}>
                        {days < 0
                          ? t('daysLeft.overdue', { days: Math.abs(days) })
                          : days === 0
                          ? t('daysLeft.today')
                          : t('daysLeft.soon', { days })}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Desktop table */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/70">
                  <TableHead>{t('table.amount')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('table.returnDeadline')}</TableHead>
                  <TableHead>{t('table.daysLeft')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => {
                  const days = daysUntil(d.return_deadline);
                  const isReturned = d.status === 'fully_returned';
                  return (
                    <TableRow
                      key={d.id}
                      className={cn('cursor-pointer transition-colors', rowUrgencyClass(d))}
                      onClick={() => openDetail(d)}
                    >
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                        ${d.deposit_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={d.status} />
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                        {d.return_deadline}
                      </TableCell>
                      <TableCell>
                        {isReturned ? (
                          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                        ) : (
                          <Badge
                            className={cn(
                              'text-xs font-medium',
                              days < 0
                                ? 'bg-red-100 text-red-700'
                                : days <= 7
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            )}
                          >
                            {days < 0
                              ? t('daysLeft.overdue', { days: Math.abs(days) })
                              : days === 0
                              ? t('daysLeft.today')
                              : t('daysLeft.soon', { days })}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <DepositDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          defaultValues={editingDeposit}
          isLoading={isSubmitting}
        />

        <DepositDetailSheet
          deposit={detailDeposit}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onRefresh={refresh}
        />
      </PageContainer>
    </MainLayout>
  );
};
