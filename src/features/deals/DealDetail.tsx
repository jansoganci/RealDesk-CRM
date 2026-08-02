import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { Link, generatePath, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { AlertCircle, CalendarDays, Loader2, MapPin, Phone, UserRound } from 'lucide-react';
import { toast } from 'sonner';
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
import { dealsService } from '@/lib/serviceProxy';
import { useDealDetail } from '@/features/deals/hooks/useDealDetail';
import { DealOffersPanel } from '@/features/deals/components/DealOffersPanel';
import { TimelineTab } from '@/features/deals/components/TimelineTab';
import { DealContingenciesPanel } from '@/features/deals/components/DealContingenciesPanel';
import { DealOutcomeActions } from '@/features/deals/components/DealOutcomeActions';
import { DocumentsTab } from '@/features/deals/components/DocumentsTab';
import { PartiesTab } from '@/features/deals/components/PartiesTab';
import { AmendmentsTab } from '@/features/deals/components/AmendmentsTab';
import { PurchaseDetailView } from '@/features/deals/components/PurchaseDetailView';
import { EarningAgentSelect } from '@/features/deals/components/EarningAgentSelect';
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
    <div className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-3 sm:gap-4 sm:py-2.5">
      <dt className={`text-xs font-medium uppercase tracking-wide ${COLORS.muted.text}`}>
        {label}
      </dt>
      <dd className={`text-sm sm:col-span-2 ${COLORS.gray.text900}`}>{children}</dd>
    </div>
  );
}

function MoneyStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted px-3 py-3 dark:bg-muted">
      <p className={`text-xs font-medium ${COLORS.muted.text}`}>{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${COLORS.gray.text900}`}>
        {value}
      </p>
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
  const [savingAgent, setSavingAgent] = useState(false);

  const lead = unwrapRelation(deal.property_inquiries);
  const property = unwrapRelation(deal.properties);

  const negotiations = deal.offer_negotiations ?? [];

  const purchaseContractId = useMemo(() => getLatestPurchaseContractIdFromDeal(deal), [deal]);
  const showPurchaseTab = deal.deal_type === 'sale' && purchaseContractId != null;

  const isTerminal =
    deal.deal_stage === 'closed_won' || deal.deal_stage === 'fell_through';

  const handleEarningAgentChange = async (userId: string) => {
    if (readOnly || isTerminal || userId === deal.user_id) return;
    setSavingAgent(true);
    try {
      await dealsService.updateDeal(deal.id, { user_id: userId });
      toast.success(t('detail.earningAgentUpdated'));
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('detail.earningAgentUpdateError'));
    } finally {
      setSavingAgent(false);
    }
  };

  const hasMoney =
    deal.list_price != null ||
    deal.intended_offer_price != null ||
    deal.earnest_money_planned != null;

  const hasFinancing = Boolean(deal.financing_type || deal.preapproval_status);
  const hasOverviewContent = Boolean(deal.notes) || negotiations.length > 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="flex w-full flex-nowrap items-center justify-start gap-1 overflow-x-auto custom-scrollbar">
            <TabsTrigger value="overview" className="shrink-0">
              {t('detail.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value="milestones" className="shrink-0">
              {t('detail.tabs.milestones')}
            </TabsTrigger>
            <TabsTrigger value="contingencies" className="shrink-0">
              {t('detail.tabs.contingencies')}
            </TabsTrigger>
            <TabsTrigger value="offers" className="shrink-0">
              {t('detail.tabs.offers')}
            </TabsTrigger>
            {showPurchaseTab && (
              <TabsTrigger value="purchase" className="shrink-0">
                {t('detail.tabs.purchase')}
              </TabsTrigger>
            )}
            <TabsTrigger value="documents" className="shrink-0">
              {t('detail.tabs.documents')}
            </TabsTrigger>
            <TabsTrigger value="parties" className="shrink-0">
              {t('detail.tabs.parties')}
            </TabsTrigger>
            <TabsTrigger value="amendments" className="shrink-0">
              {t('detail.tabs.amendments')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-5">
            {deal.notes && (
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">
                    {t('detail.section.notes')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className={cn(
                      'whitespace-pre-wrap text-sm leading-relaxed',
                      COLORS.gray.text900
                    )}
                  >
                    {deal.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {negotiations.length > 0 && (
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">
                    {t('detail.section.negotiations')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-wrap gap-2 text-sm">
                    {negotiations.map((n) => (
                      <li key={n.id}>
                        <Badge variant="outline">{n.status ?? '—'}</Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {!hasOverviewContent && (
              <p className={`text-sm ${COLORS.muted.text}`}>{t('detail.overviewEmpty')}</p>
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
      </div>

      <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              {t('detail.section.summary')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-medium">
                {t(`stage.${deal.deal_stage as DealStage}`, {
                  defaultValue: deal.deal_stage,
                })}
              </Badge>
            </div>
            <p className={`text-sm ${COLORS.muted.text}`}>
              {deal.deal_type === 'rental'
                ? t('dealType.rental')
                : t('dealType.sale')}
              {' · '}
              {t(`clientRole.${deal.client_role as 'buyer' | 'seller' | 'dual'}`)}
            </p>

            <div className="space-y-2 border-t border-border pt-3 dark:border-border">
              <label className={`text-xs font-medium uppercase tracking-wide ${COLORS.muted.text}`}>
                {t('fields.earningAgent')}
              </label>
              <EarningAgentSelect
                value={deal.user_id}
                onChange={(userId) => void handleEarningAgentChange(userId)}
                disabled={readOnly || isTerminal || savingAgent}
              />
            </div>

            <div className="space-y-2 border-t border-border pt-3 dark:border-border">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className={`flex items-center gap-1.5 ${COLORS.muted.text}`}>
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  {t('detail.meta.projectedClose')}
                </span>
                <span className={`font-medium ${COLORS.gray.text900}`}>
                  {formatOptionalDate(deal.projected_close_date)}
                </span>
              </div>
              {deal.mutual_acceptance_date && (
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className={COLORS.muted.text}>
                    {t('detail.mutualAcceptanceDate')}
                  </span>
                  <span className={`font-medium ${COLORS.gray.text900}`}>
                    {formatOptionalDate(deal.mutual_acceptance_date)}
                  </span>
                </div>
              )}
              {deal.actual_close_date && (
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className={COLORS.muted.text}>{t('detail.actualClose')}</span>
                  <span className={`font-medium ${COLORS.gray.text900}`}>
                    {formatOptionalDate(deal.actual_close_date)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {hasMoney && (
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {t('detail.section.money')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deal.list_price != null && (
                <MoneyStat
                  label={t('fields.listPrice')}
                  value={formatCurrency(deal.list_price)}
                />
              )}
              {deal.intended_offer_price != null && (
                <MoneyStat
                  label={t('fields.intendedOffer')}
                  value={formatCurrency(deal.intended_offer_price)}
                />
              )}
              {deal.earnest_money_planned != null && (
                <MoneyStat
                  label={t('fields.earnestMoney')}
                  value={formatCurrency(deal.earnest_money_planned)}
                />
              )}
            </CardContent>
          </Card>
        )}

        {hasFinancing && (
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {t('detail.section.financing')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800">
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
              </dl>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <UserRound className={`h-4 w-4 ${COLORS.muted.text}`} />
              {t('detail.section.linkedLead')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lead ? (
              <div className="space-y-2">
                <p className={`text-sm font-medium ${COLORS.gray.text900}`}>{lead.name}</p>
                <p className={`flex items-center gap-2 text-sm ${COLORS.muted.text}`}>
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {lead.phone || t('detail.meta.noPhone')}
                </p>
              </div>
            ) : (
              <p className={`text-sm ${COLORS.muted.text}`}>{t('detail.noLead')}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <MapPin className={`h-4 w-4 ${COLORS.muted.text}`} />
              {t('detail.section.property')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {property ? (
              <div className="space-y-3">
                <p className={`text-sm font-medium ${COLORS.gray.text900}`}>
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
      </aside>
    </div>
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
    <MainLayout>
      <PageContainer>
        <div className="w-full">
          <div className="mb-6">
            <PageHeader
              title={deal.deal_name}
              subtitle={t('detail.subtitle')}
              backTo={{ href: ROUTES.DEALS, label: t('detail.backToList') }}
              actions={
                <DealOutcomeActions
                  deal={deal}
                  onSuccess={refresh}
                  readOnly={isMember}
                />
              }
            />
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
