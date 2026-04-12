import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { Link, generatePath, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { AlertCircle, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { COLORS } from '@/config/colors';
import { ROUTES } from '@/config/constants';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { useDealDetail } from '@/features/deals/hooks/useDealDetail';
import { DealOffersPanel } from '@/features/deals/components/DealOffersPanel';
import { TimelineTab } from '@/features/deals/components/TimelineTab';
import { DealContingenciesPanel } from '@/features/deals/components/DealContingenciesPanel';
import { DealOutcomeActions } from '@/features/deals/components/DealOutcomeActions';
import { DocumentsTab } from '@/features/deals/components/DocumentsTab';
import { PartiesTab } from '@/features/deals/components/PartiesTab';
import { AmendmentsTab } from '@/features/deals/components/AmendmentsTab';
import { PurchaseDetailView } from '@/features/deals/components/PurchaseDetailView';
import { getLatestPurchaseContractIdFromDeal } from '@/features/deals/utils/purchaseDealHelpers';
import type { DealStage } from '@/types';
import type { DealWithRelations } from '@/lib/serviceProxy';

function formatOptionalDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

/**
 * Normalizes Supabase one-to-one embeds that may arrive as `T` or `[T]`.
 * Do not use for one-to-many relations — the first array element would be arbitrary.
 */
function unwrapRelation<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-1 py-2.5 border-b border-gray-100 last:border-0 sm:grid-cols-3 sm:gap-4'
      )}
    >
      <dt className={`text-sm font-medium ${COLORS.muted.text}`}>{label}</dt>
      <dd className={`text-sm sm:col-span-2 ${COLORS.gray.text900}`}>
        {children}
      </dd>
    </div>
  );
}

function DealDetailBody({
  deal,
  onRefresh,
  readOnly,
  activeTab,
  onTabChange,
}: {
  deal: DealWithRelations;
  onRefresh: () => void | Promise<void>;
  readOnly?: boolean;
  activeTab: string;
  onTabChange: (value: string) => void;
}) {
  const { t } = useTranslation('deals');

  const lead = unwrapRelation(deal.property_inquiries);
  const property = unwrapRelation(deal.properties);

  const negotiations = deal.offer_negotiations ?? [];
  const parties = deal.deal_parties ?? [];

  const purchaseContractId = useMemo(() => getLatestPurchaseContractIdFromDeal(deal), [deal]);
  const showPurchaseTab = deal.deal_type === 'sale' && purchaseContractId != null;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="flex w-full max-w-4xl flex-wrap gap-1 h-auto">
        <TabsTrigger value="overview">{t('detail.tabs.overview')}</TabsTrigger>
        <TabsTrigger value="milestones">{t('detail.tabs.milestones')}</TabsTrigger>
        <TabsTrigger value="contingencies">
          {t('detail.tabs.contingencies')}
        </TabsTrigger>
        <TabsTrigger value="offers">{t('detail.tabs.offers')}</TabsTrigger>
        {showPurchaseTab && (
          <TabsTrigger value="purchase">{t('detail.tabs.purchase')}</TabsTrigger>
        )}
        <TabsTrigger value="documents">{t('detail.tabs.documents')}</TabsTrigger>
        <TabsTrigger value="parties">{t('detail.tabs.parties')}</TabsTrigger>
        <TabsTrigger value="amendments">{t('detail.tabs.amendments')}</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6 space-y-6">
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{t('detail.section.details')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label={t('fields.dealName')}>{deal.deal_name}</DetailRow>
              <DetailRow label={t('fields.dealType')}>
                {deal.deal_type === 'rental'
                  ? t('dealType.rental')
                  : t('dealType.sale')}
              </DetailRow>
              <DetailRow label={t('fields.clientRole')}>
                {t(`clientRole.${deal.client_role as 'buyer' | 'seller' | 'dual'}`)}
              </DetailRow>
              <DetailRow label={t('list.tableStage')}>
                <Badge variant="secondary" className="font-normal">
                  {t(`stage.${deal.deal_stage as DealStage}`, {
                    defaultValue: deal.deal_stage,
                  })}
                </Badge>
              </DetailRow>
              {deal.financing_type && (
                <DetailRow label={t('fields.financingType')}>
                  {t(`financing.${deal.financing_type}`, {
                    defaultValue: deal.financing_type,
                  })}
                </DetailRow>
              )}
              {deal.preapproval_status && (
                <DetailRow label={t('fields.preapproval')}>
                  {t(`preapproval.${deal.preapproval_status}`, {
                    defaultValue: deal.preapproval_status,
                  })}
                </DetailRow>
              )}
              {deal.list_price != null && (
                <DetailRow label={t('fields.listPrice')}>
                  {formatCurrency(deal.list_price)}
                </DetailRow>
              )}
              {deal.intended_offer_price != null && (
                <DetailRow label={t('fields.intendedOffer')}>
                  {formatCurrency(deal.intended_offer_price)}
                </DetailRow>
              )}
              {deal.earnest_money_planned != null && (
                <DetailRow label={t('fields.earnestMoney')}>
                  {formatCurrency(deal.earnest_money_planned)}
                </DetailRow>
              )}
              <DetailRow label={t('fields.projectedClose')}>
                {formatOptionalDate(deal.projected_close_date)}
              </DetailRow>
              {deal.mutual_acceptance_date && (
                <DetailRow label={t('detail.mutualAcceptanceDate')}>
                  {formatOptionalDate(deal.mutual_acceptance_date)}
                </DetailRow>
              )}
              {deal.actual_close_date && (
                <DetailRow label={t('detail.actualClose')}>
                  {formatOptionalDate(deal.actual_close_date)}
                </DetailRow>
              )}
              {deal.notes && (
                <DetailRow label={t('fields.notes')}>
                  <span className="whitespace-pre-wrap">{deal.notes}</span>
                </DetailRow>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{t('detail.section.linkedLead')}</CardTitle>
          </CardHeader>
          <CardContent>
            {lead ? (
              <dl>
                <DetailRow label={t('list.tableName')}>{lead.name}</DetailRow>
                <DetailRow label={t('detail.leadPhone')}>{lead.phone}</DetailRow>
              </dl>
            ) : (
              <p className={`text-sm ${COLORS.muted.text}`}>{t('detail.noLead')}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{t('detail.section.property')}</CardTitle>
          </CardHeader>
          <CardContent>
            {property ? (
              <div className="space-y-3">
                <p className={`text-sm ${COLORS.gray.text900}`}>
                  {property.address}
                  {property.city ? `, ${property.city}` : ''}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to={generatePath(ROUTES.PROPERTY_DETAIL, {
                      id: property.id,
                    })}
                  >
                    {t('detail.viewProperty')}
                  </Link>
                </Button>
              </div>
            ) : (
              <p className={`text-sm ${COLORS.muted.text}`}>{t('detail.noProperty')}</p>
            )}
          </CardContent>
        </Card>

        {negotiations.length > 0 && (
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.section.negotiations')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {negotiations.map((n) => (
                  <li key={n.id}>
                    <Badge variant="outline">{n.status ?? '—'}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {parties.length > 0 && (
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.section.parties')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {parties.map((p) => (
                  <li key={p.id} className="text-sm">
                    <span className={`font-medium ${COLORS.gray.text900}`}>
                      {p.name}
                    </span>
                    <span className={`${COLORS.muted.text} ml-2`}>
                      ({p.role})
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="milestones" className="mt-6">
        <TimelineTab deal={deal} readOnly={readOnly} />
      </TabsContent>

      <TabsContent value="contingencies" className="mt-6">
        <DealContingenciesPanel
          deal={deal}
          onRefresh={onRefresh}
          readOnly={readOnly}
        />
      </TabsContent>

      <TabsContent value="offers" className="mt-6">
        <DealOffersPanel
          deal={deal}
          onRefresh={onRefresh}
          readOnly={readOnly}
        />
      </TabsContent>

      {showPurchaseTab && purchaseContractId && (
        <TabsContent value="purchase" className="mt-6">
          <PurchaseDetailView
            deal={deal}
            contractId={purchaseContractId}
            onRefresh={onRefresh}
            readOnly={readOnly}
            onOpenContingenciesTab={() => onTabChange('contingencies')}
          />
        </TabsContent>
      )}

      <TabsContent value="documents" className="mt-6">
        <DocumentsTab dealId={deal.id} readOnly={readOnly} />
      </TabsContent>

      <TabsContent value="parties" className="mt-6">
        <PartiesTab deal={deal} readOnly={readOnly} />
      </TabsContent>

      <TabsContent value="amendments" className="mt-6">
        <AmendmentsTab deal={deal} readOnly={readOnly} />
      </TabsContent>
    </Tabs>
  );
}

export function DealDetail() {
  const { t } = useTranslation('deals');
  const { id } = useParams<{ id: string }>();
  const { deal, loading, error, refresh } = useDealDetail(id);
  const { isMember } = useOrg();
  const [activeTab, setActiveTab] = useState('overview');

  const linkedPurchaseContractId = useMemo(() => {
    if (!deal) return null;
    return getLatestPurchaseContractIdFromDeal(deal);
  }, [deal]);

  useEffect(() => {
    setActiveTab('overview');
  }, [id]);

  if (loading) {
    return (
      <MainLayout title={t('title')}>
        <PageContainer>
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className={`mt-4 text-sm ${COLORS.muted.text}`}>
                {t('detail.loading')}
              </p>
            </div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  if (error || !deal) {
    return (
      <MainLayout title={t('title')}>
        <PageContainer>
          <div className="mx-auto max-w-lg">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('detail.errorTitle')}</AlertTitle>
              <AlertDescription>
                {error ?? t('detail.errorNotFound')}
              </AlertDescription>
            </Alert>
            <Button variant="outline" asChild>
              <Link to={ROUTES.DEALS}>{t('detail.backToList')}</Link>
            </Button>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={deal.deal_name}>
      <PageContainer>
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <PageHeader
              title={deal.deal_name}
              subtitle={t('detail.subtitle')}
              backTo={{ href: ROUTES.DEALS, label: t('detail.backToList') }}
            />
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {t(`stage.${deal.deal_stage as DealStage}`, {
                defaultValue: deal.deal_stage,
              })}
            </Badge>
            <span className={`text-sm ${COLORS.muted.text}`}>
              {deal.deal_type === 'rental'
                ? t('dealType.rental')
                : t('dealType.sale')}
              {' · '}
              {t(`clientRole.${deal.client_role as 'buyer' | 'seller' | 'dual'}`)}
            </span>
          </div>
          {deal.deal_type === 'sale' &&
            deal.deal_stage === 'verbal_accepted' &&
            linkedPurchaseContractId == null &&
            !isMember && (
              <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
                <AlertTitle>{t('detail.verbalAcceptedPurchasePrompt.title')}</AlertTitle>
                <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>{t('detail.verbalAcceptedPurchasePrompt.description')}</span>
                  <Button size="sm" asChild className="shrink-0">
                    <Link to={`${ROUTES.CONTRACTS_PURCHASE_NEW}?dealId=${deal.id}`}>
                      {t('detail.verbalAcceptedPurchasePrompt.cta')}
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          <DealOutcomeActions
            deal={deal}
            onSuccess={refresh}
            readOnly={isMember}
          />
          <DealDetailBody
            deal={deal}
            onRefresh={refresh}
            readOnly={isMember}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </PageContainer>
    </MainLayout>
  );
}
