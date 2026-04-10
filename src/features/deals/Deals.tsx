import { useCallback, useMemo, useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { Handshake } from 'lucide-react';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { TableCell, TableHead, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { COLORS } from '@/config/colors';
import { ROUTES } from '@/config/constants';
import { useOrg } from '@/contexts/OrgContext';
import { useDeals } from '@/features/deals/hooks/useDeals';
import { DealCreationSheet } from '@/features/deals/components/DealCreationSheet';
import type { Deal } from '@/types';
import type { DealStage } from '@/types';

const STAGE_ORDER: DealStage[] = [
  'offer_prep',
  'submitted',
  'negotiating',
  'verbal_accepted',
  'mutual_acceptance',
  'under_contract',
  'pending',
  'closing_scheduled',
  'closed_won',
  'fell_through',
];

const TERMINAL_STAGES = new Set<DealStage>(['closed_won', 'fell_through']);

function formatUpdatedAt(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export function Deals() {
  const { t } = useTranslation(['deals', 'common']);
  const navigate = useNavigate();
  const { isMember } = useOrg();
  const { deals, stats, loading, error, refresh } = useDeals();
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);

  const filterOptions = useMemo(
    () => [
      { value: 'all', label: t('deals:list.filterAll') },
      { value: 'active', label: t('deals:list.filterActive') },
      ...STAGE_ORDER.map((s) => ({
        value: s,
        label: t(`deals:stage.${s}`),
      })),
    ],
    [t]
  );

  const filteredDeals = useMemo(() => {
    let list = deals;
    if (stageFilter === 'active') {
      list = list.filter((d) => !TERMINAL_STAGES.has(d.deal_stage as DealStage));
    } else if (stageFilter !== 'all') {
      list = list.filter((d) => d.deal_stage === stageFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((d) => d.deal_name.toLowerCase().includes(q));
    }
    return list;
  }, [deals, stageFilter, searchQuery]);

  const hasActiveFilters = searchQuery.trim() !== '' || stageFilter !== 'all';

  const emptyStateConfig = useMemo(
    () => ({
      title: hasActiveFilters
        ? t('deals:list.emptyTitleSearch')
        : t('deals:list.emptyTitle'),
      description: hasActiveFilters
        ? t('deals:list.emptyDescriptionSearch')
        : t('deals:list.emptyDescription'),
      icon: <Handshake className={`h-16 w-16 ${COLORS.muted.textLight}`} />,
      actionLabel: t('deals:list.emptyAction'),
      showAction: !hasActiveFilters,
    }),
    [hasActiveFilters, t]
  );

  const renderTableHeaders = useCallback(
    () => (
      <>
        <TableHead>{t('deals:list.tableName')}</TableHead>
        <TableHead>{t('deals:list.tableType')}</TableHead>
        <TableHead>{t('deals:list.tableStage')}</TableHead>
        <TableHead className="text-right">{t('deals:list.tableUpdated')}</TableHead>
      </>
    ),
    [t]
  );

  const renderTableRow = useCallback(
    (deal: Deal) => (
      <TableRow
        key={deal.id}
        className="cursor-pointer hover:bg-muted/60"
        onClick={() =>
          navigate(generatePath(ROUTES.DEAL_DETAIL, { id: deal.id }))
        }
      >
        <TableCell className="font-medium">{deal.deal_name}</TableCell>
        <TableCell>
          {deal.deal_type === 'rental'
            ? t('deals:dealType.rental')
            : t('deals:dealType.sale')}
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="font-normal">
            {t(`deals:stage.${deal.deal_stage as DealStage}`, {
              defaultValue: deal.deal_stage,
            })}
          </Badge>
        </TableCell>
        <TableCell className={`text-right text-sm ${COLORS.muted.text}`}>
          {formatUpdatedAt(deal.updated_at)}
        </TableCell>
      </TableRow>
    ),
    [navigate, t]
  );

  const renderCardContent = useCallback(
    (deal: Deal) => (
      <button
        type="button"
        className="w-full text-left space-y-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        onClick={() =>
          navigate(generatePath(ROUTES.DEAL_DETAIL, { id: deal.id }))
        }
      >
        <div className="flex items-start justify-between gap-2">
          <span className={`font-semibold ${COLORS.gray.text900}`}>
            {deal.deal_name}
          </span>
          <Badge variant="secondary" className="shrink-0 font-normal">
            {t(`deals:stage.${deal.deal_stage as DealStage}`, {
              defaultValue: deal.deal_stage,
            })}
          </Badge>
        </div>
        <div className={`text-sm ${COLORS.muted.text}`}>
          {deal.deal_type === 'rental'
            ? t('deals:dealType.rental')
            : t('deals:dealType.sale')}
          {' · '}
          {formatUpdatedAt(deal.updated_at)}
        </div>
      </button>
    ),
    [navigate, t]
  );

  const headerContent = useMemo(
    () => (
      <>
        {error && (
          <p className={`text-sm mb-4 ${COLORS.danger.text}`} role="alert">
            {error}
          </p>
        )}
        {stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-gray-200/80 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle
                  className={`text-sm font-medium ${COLORS.muted.text}`}
                >
                  {t('deals:list.statsActive')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 px-4">
                <p className={`text-2xl font-bold ${COLORS.gray.text900}`}>
                  {stats.activeDeals}
                </p>
              </CardContent>
            </Card>
            <Card className="border-gray-200/80 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle
                  className={`text-sm font-medium ${COLORS.muted.text}`}
                >
                  {t('deals:list.statsClosings')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 px-4">
                <p className={`text-2xl font-bold ${COLORS.gray.text900}`}>
                  {stats.closingsThisMonth}
                </p>
              </CardContent>
            </Card>
            <Card className="border-gray-200/80 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle
                  className={`text-sm font-medium ${COLORS.muted.text}`}
                >
                  {t('deals:list.statsOverdue')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 px-4">
                <p className={`text-2xl font-bold ${COLORS.danger.text}`}>
                  {stats.overdueMilestones}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </>
    ),
    [error, stats, t]
  );

  return (
    <>
      <ListPageTemplate
        title={t('deals:title')}
        items={filteredDeals}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('deals:list.searchPlaceholder')}
        filterValue={stageFilter}
        onFilterChange={setStageFilter}
        filterOptions={filterOptions}
        filterPlaceholder={t('deals:list.filterAll')}
        onAdd={() => setCreateOpen(true)}
        addButtonLabel={t('deals:list.addDeal')}
        disabledAdd={isMember}
        addDisabledTooltip={isMember ? t('common:readOnlyMode') : undefined}
        skeletonColumnCount={4}
        emptyState={emptyStateConfig}
        renderTableHeaders={renderTableHeaders}
        renderTableRow={renderTableRow}
        renderCardContent={renderCardContent}
        headerContent={headerContent}
      />

      <DealCreationSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refresh}
        disabled={isMember}
      />
    </>
  );
}
