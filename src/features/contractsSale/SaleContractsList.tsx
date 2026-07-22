/**
 * Sale Contracts List Page
 * Displays purchase agreements and legacy template instances — same list shell as rent (`ListPageTemplate`).
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableHead, TableRow } from '@/components/ui/table';
import { ROUTES } from '@/config/constants';
import { useOrg } from '@/contexts/OrgContext';
import { FileText, Pencil, Trash2, FileDown, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { contractBuilderService } from '@/services/contractBuilder.service';
import type { ContractInstanceV2 } from '@/types/contractBuilder.types';
import { toast } from 'sonner';
import { useSaleContractPdf } from './hooks/useSaleContractPdf';
import { contractsService } from '@/lib/serviceProxy';
import type { PurchaseContractListRow } from '@/services/contracts.service';
import { formatCurrency, convertCurrency } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';

type SaleListRow =
  | { kind: 'purchase'; id: string; data: PurchaseContractListRow }
  | { kind: 'legacy'; id: string; data: ContractInstanceV2 };

type TypeFilter = 'all' | 'purchase' | 'legacy';

export function SaleContractsList() {
  const { t } = useTranslation(['contractsSale', 'common']);
  const { t: tContracts } = useTranslation('contracts');
  const navigate = useNavigate();
  const { currency } = useAuth();
  const { isOwner, loading: orgLoading } = useOrg();
  const [purchaseRows, setPurchaseRows] = useState<PurchaseContractListRow[]>([]);
  const [instances, setInstances] = useState<ContractInstanceV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [legacyToDelete, setLegacyToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { isGenerating, isDownloading, generatePdf, downloadPdf } = useSaleContractPdf();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [purchases, legacy] = await Promise.all([
        contractsService.getAllPurchases(),
        contractBuilderService.listInstances('sale'),
      ]);
      setPurchaseRows(purchases);
      setInstances(legacy);
    } catch (error) {
      console.error('Failed to load sale contracts:', error);
      toast.error(t('toasts.list.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const mergedRows = useMemo((): SaleListRow[] => {
    const purchases: SaleListRow[] = purchaseRows.map((row) => ({
      kind: 'purchase',
      id: row.id,
      data: row,
    }));
    const legacy: SaleListRow[] = instances.map((inst) => ({
      kind: 'legacy',
      id: inst.id,
      data: inst,
    }));
    return [...purchases, ...legacy];
  }, [purchaseRows, instances]);

  const filteredRows = useMemo(() => {
    let rows = mergedRows;
    if (typeFilter === 'purchase') {
      rows = rows.filter((r) => r.kind === 'purchase');
    } else if (typeFilter === 'legacy') {
      rows = rows.filter((r) => r.kind === 'legacy');
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      if (row.kind === 'purchase') {
        const r = row.data;
        const buyer = r.purchase_details?.buyer_name?.trim() ?? '';
        const seller = r.purchase_details?.seller_name?.trim() ?? '';
        const address = r.property?.address?.trim() ?? '';
        const title = buyer || t('list.purchaseCard.titleFallback');
        return (
          buyer.toLowerCase().includes(q) ||
          seller.toLowerCase().includes(q) ||
          address.toLowerCase().includes(q) ||
          title.toLowerCase().includes(q)
        );
      }
      const inst = row.data;
      const fd = inst.form_data as Record<string, unknown>;
      const chunks = [
        inst.title ?? '',
        String(fd.seller_name ?? ''),
        String(fd.buyer_name ?? ''),
        String(fd.property_address ?? ''),
      ];
      return chunks.some((c) => c.toLowerCase().includes(q));
    });
  }, [mergedRows, typeFilter, searchQuery, t]);

  const filterOptions = useMemo(
    () => [
      { value: 'all' as const, label: t('list.filters.all') },
      { value: 'purchase' as const, label: t('list.filters.purchase') },
      { value: 'legacy' as const, label: t('list.filters.legacy') },
    ],
    [t],
  );

  const getDealStatusBadge = useCallback(
    (dealStatus: string | null) => {
      const key = (dealStatus ?? 'active') as
        | 'draft'
        | 'active'
        | 'under_contract'
        | 'closed'
        | 'cancelled'
        | 'incomplete';
      const variants: Record<string, { label: string; className: string }> = {
        draft: {
          label: t('dealStatus.draft'),
          className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        },
        active: {
          label: t('dealStatus.active'),
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200',
        },
        under_contract: {
          label: t('dealStatus.under_contract'),
          className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200',
        },
        closed: {
          label: t('dealStatus.closed'),
          className: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200',
        },
        cancelled: {
          label: t('dealStatus.cancelled'),
          className: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
        },
        incomplete: {
          label: t('dealStatus.incomplete'),
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
        },
      };
      const v = variants[key] ?? variants.active;
      return <Badge className={v.className}>{v.label}</Badge>;
    },
    [t],
  );

  const getStatusBadge = useCallback(
    (status: string) => {
      const variants: Record<string, { label: string; className: string }> = {
        draft: {
          label: t('status.draft'),
          className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-200',
        },
        final: {
          label: t('status.final'),
          className: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-200',
        },
        signed: {
          label: t('status.signed'),
          className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200',
        },
        archived: {
          label: t('status.archived'),
          className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
        },
        cancelled: {
          label: t('status.cancelled'),
          className: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
        },
      };
      const v = variants[status] || variants.draft;
      return <Badge className={v.className}>{v.label}</Badge>;
    },
    [t],
  );

  const handleDeleteClick = useCallback((id: string, name: string) => {
    setLegacyToDelete({ id, name });
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setLegacyToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!legacyToDelete) return;
    setDeleteLoading(true);
    try {
      await contractBuilderService.deleteInstance(legacyToDelete.id);
      toast.success(t('toasts.list.deleteSuccess'));
      handleDeleteCancel();
      await loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error(t('toasts.list.deleteFailed'));
    } finally {
      setDeleteLoading(false);
    }
  }, [legacyToDelete, loadData, t, handleDeleteCancel]);

  const emptyStateConfig = useMemo(() => {
    const filtered = searchQuery.trim().length > 0 || typeFilter !== 'all';
    return {
      title: filtered ? t('list.emptyState.titleFiltered') : t('list.emptyState.title'),
      description: filtered ? t('list.emptyState.descriptionFiltered') : t('list.emptyState.description'),
      icon: <FileText className="h-16 w-16 text-muted-foreground" />,
      actionLabel: t('list.emptyState.action'),
      showAction: !filtered,
    };
  }, [searchQuery, typeFilter, t]);

  const headerContent = useMemo(
    () => (
      <PageHeader
        backTo={{ href: ROUTES.CONTRACTS_HUB, label: t('list.backToHub') }}
        actions={
          !orgLoading && isOwner ? (
            <Button type="button" variant="outline" onClick={() => navigate(ROUTES.CONTRACTS_PURCHASE_NEW)}>
              {tContracts('purchaseWizard.entry.openWizard')}
            </Button>
          ) : undefined
        }
      />
    ),
    [navigate, orgLoading, isOwner, t, tContracts],
  );

  const tableHeaders = useCallback(
    () => (
      <>
        <TableHead>{t('list.table.type')}</TableHead>
        <TableHead>{t('list.table.contract')}</TableHead>
        <TableHead>{t('list.table.property')}</TableHead>
        <TableHead>{t('list.table.status')}</TableHead>
        <TableHead>{t('list.table.amount')}</TableHead>
        <TableHead>{t('list.table.date')}</TableHead>
        <TableHead className="text-right">{t('list.table.actions')}</TableHead>
      </>
    ),
    [t],
  );

  const renderTableRow = useCallback(
    (row: SaleListRow, _index: number) => {
      if (row.kind === 'purchase') {
        const r = row.data;
        const buyer = r.purchase_details?.buyer_name?.trim();
        const seller = r.purchase_details?.seller_name?.trim();
        const address = r.property?.address?.trim();
        const title = buyer || t('list.purchaseCard.titleFallback');
        const amount =
          r.purchase_price != null
            ? formatCurrency(
                convertCurrency(Number(r.purchase_price), r.currency || 'USD', currency),
                currency,
              )
            : '—';
        const dateStr = r.closing_date
          ? format(new Date(r.closing_date), 'MMM d, yyyy')
          : r.created_at
            ? format(new Date(r.created_at), 'MMM d, yyyy')
            : '—';
        return (
          <TableRow
            key={`purchase-${r.id}`}
            className="cursor-pointer"
            onClick={() => navigate(generatePath(ROUTES.CONTRACTS_PURCHASE_DETAIL, { id: r.id }))}
          >
            <TableCell>
              <Badge variant="outline">{t('list.table.typePurchase')}</Badge>
            </TableCell>
            <TableCell>
              <div className="font-medium text-foreground">{title}</div>
              {seller ? (
                <div className="text-xs text-muted-foreground">
                  {t('list.card.seller')} {seller}
                </div>
              ) : null}
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">{address ?? '—'}</span>
            </TableCell>
            <TableCell>{getDealStatusBadge(r.deal_status)}</TableCell>
            <TableCell className="font-medium tabular-nums">{amount}</TableCell>
            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{dateStr}</TableCell>
            <TableCell className="text-right">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(generatePath(ROUTES.CONTRACTS_PURCHASE_DETAIL, { id: r.id }));
                }}
              >
                {t('list.viewDetail')}
              </Button>
            </TableCell>
          </TableRow>
        );
      }

      const instance = row.data;
      const fd = instance.form_data as Record<string, unknown>;
      const title = instance.title || t('list.card.untitled');
      const address = typeof fd.property_address === 'string' ? fd.property_address : '';
      const amountStr =
        fd.sale_price != null
          ? `${Number(fd.sale_price).toLocaleString('en-US')} ${String(fd.currency || 'USD')}`
          : '—';
      return (
        <TableRow
          key={`legacy-${instance.id}`}
          className="cursor-pointer"
          onClick={() => navigate(`/contracts/sale/${instance.id}/edit`)}
        >
          <TableCell>
            <Badge variant="secondary">{t('list.table.typeLegacy')}</Badge>
          </TableCell>
          <TableCell>
            <div className="font-medium text-foreground">{title}</div>
            {fd.buyer_name ? (
              <div className="text-xs text-muted-foreground">
                {t('list.card.buyer')} {String(fd.buyer_name)}
              </div>
            ) : null}
          </TableCell>
          <TableCell>
            <span className="text-sm text-muted-foreground">{address || '—'}</span>
          </TableCell>
          <TableCell>{getStatusBadge(instance.status)}</TableCell>
          <TableCell className="tabular-nums">{amountStr}</TableCell>
          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
            {format(new Date(instance.created_at), 'MMM d, yyyy')}
          </TableCell>
          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end gap-1">
              {instance.pdf_path ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => void downloadPdf(instance)}
                  disabled={isDownloading}
                  title={t('pdf.download')}
                >
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => void generatePdf(instance)}
                  disabled={isGenerating}
                  title={t('pdf.generate')}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate(`/contracts/sale/${instance.id}/edit`)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleDeleteClick(instance.id, title)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    },
    [
      currency,
      navigate,
      t,
      getDealStatusBadge,
      getStatusBadge,
      downloadPdf,
      generatePdf,
      isDownloading,
      isGenerating,
      handleDeleteClick,
    ],
  );

  const renderCardContent = useCallback(
    (row: SaleListRow, _index: number) => {
      if (row.kind === 'purchase') {
        const r = row.data;
        const buyer = r.purchase_details?.buyer_name?.trim();
        const seller = r.purchase_details?.seller_name?.trim();
        const address = r.property?.address?.trim();
        const title = buyer || t('list.purchaseCard.titleFallback');
        const amount =
          r.purchase_price != null
            ? formatCurrency(
                convertCurrency(Number(r.purchase_price), r.currency || 'USD', currency),
                currency,
              )
            : null;
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="shrink-0">
                    {t('list.table.typePurchase')}
                  </Badge>
                  <h3 className="font-semibold text-base text-foreground truncate">{title}</h3>
                </div>
                {getDealStatusBadge(r.deal_status)}
              </div>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {address ? (
                <p>
                  <span className="text-foreground/80">{t('list.purchaseCard.property')}: </span>
                  {address}
                </p>
              ) : null}
              {seller ? (
                <p>
                  {t('list.card.seller')} {seller}
                </p>
              ) : null}
              {amount ? (
                <p>
                  {t('list.card.amount')} {amount}
                </p>
              ) : null}
              {r.closing_date ? (
                <p>
                  {t('list.purchaseCard.closing')}: {format(new Date(r.closing_date), 'MMM d, yyyy')}
                </p>
              ) : null}
              {r.created_at ? (
                <p className="text-xs">
                  {t('list.purchaseCard.created')}: {format(new Date(r.created_at), 'MMM d, yyyy p')}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => navigate(generatePath(ROUTES.CONTRACTS_PURCHASE_DETAIL, { id: r.id }))}
              >
                {t('list.viewDetail')}
              </Button>
            </div>
          </div>
        );
      }

      const instance = row.data;
      const fd = instance.form_data as Record<string, unknown>;
      const title = instance.title || t('list.card.untitled');
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="shrink-0">
                  {t('list.table.typeLegacy')}
                </Badge>
                <h3 className="font-semibold text-base text-foreground">{title}</h3>
              </div>
              {getStatusBadge(instance.status)}
            </div>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            {fd.seller_name ? (
              <p>
                {t('list.card.seller')} {String(fd.seller_name)}
              </p>
            ) : null}
            {fd.buyer_name ? (
              <p>
                {t('list.card.buyer')} {String(fd.buyer_name)}
              </p>
            ) : null}
            {fd.sale_price ? (
              <p>
                {t('list.card.amount')} {Number(fd.sale_price).toLocaleString('en-US')}{' '}
                {String(fd.currency || 'USD')}
              </p>
            ) : null}
            <p className="text-xs">{format(new Date(instance.created_at), 'MMM d, yyyy p')}</p>
          </div>
          <div className="flex flex-wrap gap-2 border-t pt-3" onClick={(e) => e.stopPropagation()}>
            {instance.pdf_path ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => void downloadPdf(instance)} disabled={isDownloading}>
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}
                {t('pdf.download')}
              </Button>
            ) : (
              <Button type="button" size="sm" variant="ghost" onClick={() => void generatePdf(instance)} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                {t('pdf.generate')}
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={() => navigate(`/contracts/sale/${instance.id}/edit`)}>
              <Pencil className="h-4 w-4 mr-1" />
              {t('common:actions.edit')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => handleDeleteClick(instance.id, title)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t('common:actions.delete')}
            </Button>
          </div>
        </div>
      );
    },
    [currency, navigate, t, getDealStatusBadge, getStatusBadge, downloadPdf, generatePdf, isDownloading, isGenerating, handleDeleteClick],
  );

  const deleteDialogConfig = useMemo(
    () => ({
      open: deleteDialogOpen,
      title: t('list.dialog.deleteTitle'),
      description: t('list.dialog.deleteDescription', { name: legacyToDelete?.name ?? '' }),
      onConfirm: () => void handleDeleteConfirm(),
      onCancel: handleDeleteCancel,
      loading: deleteLoading,
    }),
    [deleteDialogOpen, legacyToDelete?.name, handleDeleteConfirm, handleDeleteCancel, deleteLoading, t],
  );

  return (
    <ListPageTemplate<SaleListRow>
      title={t('list.pageTitle')}
      items={filteredRows}
      loading={loading}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={t('list.searchPlaceholder')}
      filterValue={typeFilter}
      onFilterChange={(v) => setTypeFilter(v as TypeFilter)}
      filterOptions={filterOptions}
      filterPlaceholder={t('common:filterPlaceholder')}
      onAdd={() => navigate(ROUTES.CONTRACTS_SALE_CREATE)}
      addButtonLabel={t('list.newContract')}
      headerContent={headerContent}
      emptyState={emptyStateConfig}
      renderTableHeaders={tableHeaders}
      renderTableRow={renderTableRow}
      renderCardContent={renderCardContent}
      deleteDialog={deleteDialogConfig}
      skeletonColumnCount={7}
    />
  );
}
