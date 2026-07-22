import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RequestDetailSheet } from './components/RequestDetailSheet';
import { useCcpaRequests } from './hooks/useCcpaRequests';
import { type DataSubjectRequest, type RequestStatus } from '@/lib/serviceProxy';
import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<RequestStatus, string> = {
  pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  in_review: 'bg-yellow-100 text-yellow-800',
  verification_sent: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-800',
  denied: 'bg-red-100 text-red-700',
};

const ALL_STATUSES: Array<RequestStatus | 'all'> = ['all', 'pending', 'in_review', 'verification_sent', 'completed', 'denied'];

export function ComplianceDashboard() {
  const { t } = useTranslation('compliance');
  const { requests, loading, refresh } = useCcpaRequests();

  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<DataSubjectRequest | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = requests;
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.requester_name.toLowerCase().includes(q) ||
          r.requester_email.toLowerCase().includes(q) ||
          r.request_type.includes(q)
      );
    }
    return list;
  }, [requests, statusFilter, search]);

  const handleRowClick = (req: DataSubjectRequest) => {
    setSelectedRequest(req);
    setSheetOpen(true);
  };

  return (
    <MainLayout title={t('admin.title')}>
      <PageContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('admin.title')}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.subtitle')}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder={t('admin.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    statusFilter === s
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  )}
                >
                  {s === 'all' ? t('admin.allRequests') : t(`statuses.${s}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <Shield className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="font-medium">{t('admin.noRequests')}</p>
              <p className="text-xs mt-1">{t('admin.noRequestsHint')}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/70">
                    <TableHead>{t('form.name')}</TableHead>
                    <TableHead>{t('form.email')}</TableHead>
                    <TableHead>{t('form.requestType')}</TableHead>
                    <TableHead>{t('form.relationship')}</TableHead>
                    <TableHead>{t('admin.status')}</TableHead>
                    <TableHead>{t('admin.submitted')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((req) => (
                    <TableRow
                      key={req.id}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      onClick={() => handleRowClick(req)}
                    >
                      <TableCell className="font-medium">{req.requester_name}</TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400 text-sm">{req.requester_email}</TableCell>
                      <TableCell className="text-sm">{t(`requestTypes.${req.request_type}`)}</TableCell>
                      <TableCell className="text-sm">{t(`relationships.${req.relationship_to_org}`)}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', STATUS_CLASSES[req.status])}>
                          {t(`statuses.${req.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </PageContainer>

      <RequestDetailSheet
        request={selectedRequest}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onRefresh={refresh}
      />
    </MainLayout>
  );
}
