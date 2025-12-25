/**
 * Sale Contracts List Page
 * Displays all sale contract instances with filtering and actions
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/config/constants';
import { Plus, FileText, Pencil, Trash2, FileDown, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { contractBuilderService } from '@/services/contractBuilder.service';
import type { ContractInstanceV2 } from '@/types/contractBuilder.types';
import { toast } from 'sonner';
import { useSaleContractPdf } from './hooks/useSaleContractPdf';

export function SaleContractsList() {
  const { t } = useTranslation(['contractsSale', 'common']);
  const navigate = useNavigate();
  const [instances, setInstances] = useState<ContractInstanceV2[]>([]);
  const [loading, setLoading] = useState(true);
  const { isGenerating, isDownloading, generatePdf, downloadPdf } = useSaleContractPdf();

  // Fetch instances on mount
  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = useCallback(async () => {
    try {
      setLoading(true);
      const data = await contractBuilderService.listInstances('sale');
      setInstances(data);
    } catch (error) {
      console.error('Failed to load sale contracts:', error);
      toast.error(t('toasts.list.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm(t('list.confirmDelete'))) return;

    try {
      await contractBuilderService.deleteInstance(id);
      toast.success(t('toasts.list.deleteSuccess'));
      loadInstances();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error(t('toasts.list.deleteFailed'));
    }
  }, [loadInstances, t]);

  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: t('status.draft'), className: 'bg-yellow-100 text-yellow-700' },
      final: { label: t('status.final'), className: 'bg-green-100 text-green-700' },
      signed: { label: t('status.signed'), className: 'bg-blue-100 text-blue-700' },
      archived: { label: t('status.archived'), className: 'bg-gray-100 text-gray-600' },
      cancelled: { label: t('status.cancelled'), className: 'bg-red-100 text-red-700' },
    };
    const v = variants[status] || variants.draft;
    return <Badge className={v.className}>{v.label}</Badge>;
  }, [t]);

  const emptyState = useMemo(() => (
    <div className="text-center py-12">
      <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {t('list.emptyState.title')}
      </h3>
      <p className="text-gray-500 mb-6">
        {t('list.emptyState.description')}
      </p>
      <Button onClick={() => navigate(ROUTES.CONTRACTS_SALE_CREATE)}>
        <Plus className="h-4 w-4 mr-2" />
        {t('list.emptyState.action')}
      </Button>
    </div>
  ), [navigate, t]);

  return (
    <MainLayout title={t('list.pageTitle')}>
      <PageContainer>
        {/* Header */}
        <div className="mb-6">
          <PageHeader
            backTo={{ href: ROUTES.CONTRACTS_HUB, label: t('list.backToHub') }}
            actions={(
              <Button
                onClick={() => navigate(ROUTES.CONTRACTS_SALE_CREATE)}
                className="w-full md:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('list.newContract')}
              </Button>
            )}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : instances.length === 0 ? (
          emptyState
        ) : (
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
                        <div className="text-sm text-gray-600 space-y-1">
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
                        <p className="text-xs text-gray-400 mt-2">
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
        )}
      </PageContainer>
    </MainLayout>
  );
}
