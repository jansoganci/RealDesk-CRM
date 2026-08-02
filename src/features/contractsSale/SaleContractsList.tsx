/**
 * Sale Contracts List Page
 * Displays all sale contract instances with filtering and actions
 * Sprint 6B T16 — Org owners get a shortcut to the US purchase wizard (same guard as `/contracts/purchase/new`).
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/config/constants';
import { COLORS } from '@/config/colors';
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

export function SaleContractsList() {
  const { t } = useTranslation(['contractsSale', 'common']);
  const { t: tContracts } = useTranslation('contracts');
  const navigate = useNavigate();
  const { currency } = useAuth();
  const { isOwner, loading: orgLoading } = useOrg();
  const [purchaseRows, setPurchaseRows] = useState<PurchaseContractListRow[]>([]);
  const [instances, setInstances] = useState<ContractInstanceV2[]>([]);
  const [loading, setLoading] = useState(true);
  const { isGenerating, isDownloading, generatePdf, downloadPdf } = useSaleContractPdf();

  const canOpenPurchaseWizard = !orgLoading && isOwner;

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
    loadData();
  }, [loadData]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm(t('list.confirmDelete'))) return;

    try {
      await contractBuilderService.deleteInstance(id);
      toast.success(t('toasts.list.deleteSuccess'));
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error(t('toasts.list.deleteFailed'));
    }
  }, [loadData, t]);

  const getDealStatusBadge = useCallback((dealStatus: string | null) => {
    const key = (dealStatus ?? 'active') as
      | 'draft'
      | 'active'
      | 'under_contract'
      | 'closed'
      | 'cancelled'
      | 'incomplete';
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: t('dealStatus.draft'), className: 'bg-muted text-foreground/80' },
      active: { label: t('dealStatus.active'), className: 'bg-primary text-primary' },
      under_contract: { label: t('dealStatus.under_contract'), className: 'bg-indigo-100 text-indigo-800' },
      closed: { label: t('dealStatus.closed'), className: 'bg-green-100 text-green-800' },
      cancelled: { label: t('dealStatus.cancelled'), className: 'bg-red-100 text-red-700' },
      incomplete: { label: t('dealStatus.incomplete'), className: 'bg-amber-100 text-amber-800' },
    };
    const v = variants[key] ?? variants.active;
    return <Badge className={v.className}>{v.label}</Badge>;
  }, [t]);

  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: t('status.draft'), className: 'bg-yellow-100 text-yellow-700' },
      final: { label: t('status.final'), className: 'bg-green-100 text-green-700' },
      signed: { label: t('status.signed'), className: 'bg-primary text-primary' },
      archived: { label: t('status.archived'), className: 'bg-muted text-muted-foreground' },
      cancelled: { label: t('status.cancelled'), className: 'bg-red-100 text-red-700' },
    };
    const v = variants[status] || variants.draft;
    return <Badge className={v.className}>{v.label}</Badge>;
  }, [t]);

  const emptyState = useMemo(() => (
    <EmptyState
      title={t('list.emptyState.title')}
      description={t('list.emptyState.description')}
      icon={<FileText className={`h-16 w-16 ${COLORS.muted.text}`} />}
      actionLabel={t('list.emptyState.action')}
      onAction={() => navigate(ROUTES.CONTRACTS_PURCHASE_NEW)}
      showAction={canOpenPurchaseWizard}
    />
  ), [canOpenPurchaseWizard, navigate, t]);

  return (
    <MainLayout title={t('list.pageTitle')}>
      <PageContainer>
        {/* Header */}
        <div className="mb-6">
          <PageHeader
            backTo={{ href: ROUTES.CONTRACTS_HUB, label: t('list.backToHub') }}
            actions={
              canOpenPurchaseWizard ? (
                <Button
                  type="button"
                  onClick={() => navigate(ROUTES.CONTRACTS_PURCHASE_NEW)}
                  className="w-full md:w-auto"
                >
                  {tContracts('purchaseWizard.entry.openWizard')}
                </Button>
              ) : undefined
            }
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : purchaseRows.length === 0 && instances.length === 0 ? (
          emptyState
        ) : (
          <div className="space-y-10">
            {purchaseRows.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  {t('list.purchaseSection.title')}
                </h2>
                <div className="space-y-4">
                  {purchaseRows.map((row) => {
                    const buyer = row.purchase_details?.buyer_name?.trim();
                    const seller = row.purchase_details?.seller_name?.trim();
                    const address = row.property?.address?.trim();
                    const title = buyer || t('list.purchaseCard.titleFallback');
                    return (
                      <Card
                        key={row.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(generatePath(ROUTES.CONTRACTS_PURCHASE_DETAIL, { id: row.id }))}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg truncate">{title}</h3>
                                {getDealStatusBadge(row.deal_status)}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                {address ? (
                                  <p>
                                    <span className="text-muted-foreground">{t('list.purchaseCard.property')}: </span>
                                    {address}
                                  </p>
                                ) : null}
                                {seller ? (
                                  <p>
                                    {t('list.card.seller')} {seller}
                                  </p>
                                ) : null}
                                {row.purchase_price != null ? (
                                  <p>
                                    {t('list.card.amount')}{' '}
                                    {formatCurrency(
                                      convertCurrency(Number(row.purchase_price), row.currency || 'USD', currency),
                                      currency,
                                    )}
                                  </p>
                                ) : null}
                                {row.closing_date ? (
                                  <p>
                                    {t('list.purchaseCard.closing')}: {format(new Date(row.closing_date), 'MMM d, yyyy')}
                                  </p>
                                ) : null}
                                {row.created_at ? (
                                  <p className="text-xs text-muted-foreground/70 mt-2">
                                    {t('list.purchaseCard.created')}: {format(new Date(row.created_at), 'MMM d, yyyy p')}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {instances.length > 0 && (
              <section className="space-y-4">
                {purchaseRows.length > 0 && (
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    {t('list.legacySection.title')}
                  </h2>
                )}
                <div className="space-y-4">
            {instances.map((instance) => {
              const formData = instance.form_data as Record<string, unknown>;
              return (
                <Card
                  key={instance.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/contracts/sale/${instance.id}/edit`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {instance.title || t('list.card.untitled')}
                          </h3>
                          {getStatusBadge(instance.status)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {formData.seller_name ? (
                            <p>{t('list.card.seller')} {String(formData.seller_name)}</p>
                          ) : null}
                          {formData.buyer_name ? (
                            <p>{t('list.card.buyer')} {String(formData.buyer_name)}</p>
                          ) : null}
                          {formData.sale_price ? (
                            <p>
                              {t('list.card.amount')} {Number(formData.sale_price).toLocaleString('tr-TR')}{' '}
                              {String(formData.currency || 'TRY')}
                            </p>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          {format(new Date(instance.created_at), 'dd.MM.yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {instance.pdf_path ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); downloadPdf(instance); }}
                            disabled={isDownloading}
                            title={t('pdf.download')}
                          >
                            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); generatePdf(instance); }}
                            disabled={isGenerating}
                            title={t('pdf.generate')}
                          >
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/contracts/sale/${instance.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(instance.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
                </div>
              </section>
            )}
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}
