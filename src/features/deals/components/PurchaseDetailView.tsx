/**
 * Sprint 6B T14 — Purchase agreement area on deal detail: overview, contingency summary, key dates, addenda uploads.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle, Download, FileText, Loader2 } from 'lucide-react';

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/config/constants';
import { COLORS } from '@/config/colors';
import { CounterOfferModal } from '@/features/contracts/components/CounterOfferModal';
import { KeyDatesCard } from '@/features/contracts/components/KeyDatesCard';
import { OfferHistoryTimeline } from '@/features/contracts/components/OfferHistoryTimeline';
import { formatCurrency } from '@/lib/currency';
import {
  contractsService,
  purchaseAgreementService,
  type DealWithRelations,
  type PurchaseContractWithDetails,
} from '@/lib/serviceProxy';
import { ContingencySummaryCard } from '@/features/deals/components/ContingencySummaryCard';
import { buildKeyDatesFromPurchase } from '@/features/deals/utils/keyDatesFromPurchase';

export type PurchaseDetailViewProps = {
  deal: DealWithRelations;
  contractId: string;
  onRefresh: () => void | Promise<void>;
  readOnly?: boolean;
  onOpenContingenciesTab?: () => void;
};

function financingLabel(
  t: (k: string, o?: Record<string, string>) => string,
  pd: NonNullable<PurchaseContractWithDetails['purchase_details']>,
): string {
  const ft = pd.financing_type;
  if (ft === 'all_cash') return t('purchaseDetail.financing.allCash');
  if (ft === 'seller_financing') return t('purchaseDetail.financing.seller');
  if (ft === 'bank_financing') {
    const bt = pd.bank_loan_type;
    if (bt === 'fha') return t('purchaseDetail.financing.fha');
    if (bt === 'va') return t('purchaseDetail.financing.va');
    if (bt === 'conventional') return t('purchaseDetail.financing.conventional');
    if (bt === 'other') return t('purchaseDetail.financing.other');
    return t('purchaseDetail.financing.bank');
  }
  return ft;
}

export function PurchaseDetailView({
  deal,
  contractId,
  onRefresh,
  readOnly = false,
  onOpenContingenciesTab,
}: PurchaseDetailViewProps) {
  const { t } = useTranslation('deals');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bundle, setBundle] = useState<PurchaseContractWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [uploadKind, setUploadKind] = useState<'fha' | 'va' | null>(null);
  const [isCounterOfferOpen, setIsCounterOfferOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [closedPrice, setClosedPrice] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await purchaseAgreementService.getPurchaseByContractId(contractId);
      setBundle(data);
    } catch (e) {
      setBundle(null);
      setLoadError(e instanceof Error ? e.message : t('purchaseDetail.loadError'));
    } finally {
      setLoading(false);
    }
  }, [contractId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const pd = bundle?.purchase_details;

  const keyDates = useMemo(() => {
    if (!bundle || !pd) return null;
    return buildKeyDatesFromPurchase(bundle, pd);
  }, [bundle, pd]);

  const needsFhaAddendum =
    pd?.financing_type === 'bank_financing' && pd.bank_loan_type === 'fha' && !pd.fha_addendum_uploaded;
  const needsVaAddendum =
    pd?.financing_type === 'bank_financing' && pd.bank_loan_type === 'va' && !pd.va_addendum_uploaded;

  const handleOpenPdf = async () => {
    if (!bundle?.contract_pdf_path) return;
    setPdfBusy(true);
    try {
      const url = await contractsService.getContractPdfUrl(bundle.contract_pdf_path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setPdfBusy(false);
    }
  };

  const handleAddendum = async (kind: 'fha' | 'va', file: File | null) => {
    if (!file || readOnly) return;
    setUploadKind(kind);
    try {
      await purchaseAgreementService.uploadPurchaseAddendum(contractId, kind, file);
      toast({ title: t('purchaseDetail.addenda.uploadSuccess') });
      await onRefresh();
      await load();
    } catch (e) {
      toast({
        title: t('purchaseDetail.addenda.uploadError'),
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setUploadKind(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[160px] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t('purchaseDetail.loading')}
      </div>
    );
  }

  if (loadError || !bundle || !pd) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('purchaseDetail.errorTitle')}</AlertTitle>
        <AlertDescription>{loadError ?? t('purchaseDetail.missingDetails')}</AlertDescription>
      </Alert>
    );
  }

  const purchaseContract = bundle;
  const canUpdateDealStatus =
    purchaseContract.deal_status === 'active' || purchaseContract.deal_status === 'under_contract';

  const handleCloseDeal = async () => {
    setActionBusy(true);
    try {
      const result = await purchaseAgreementService.closeDeal(contractId);
      setClosedPrice(result.purchasePrice);
      setCloseDialogOpen(false);
      setCommissionDialogOpen(true);
      await onRefresh();
      await load();
    } catch (e) {
      toast({
        title: t('purchaseDetail.dealActions.closeError'),
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleCancelDeal = async () => {
    setActionBusy(true);
    try {
      await purchaseAgreementService.cancelDeal(contractId, cancelReason || undefined);
      setCancelDialogOpen(false);
      setCancelReason('');
      toast({ title: t('purchaseDetail.dealActions.cancelSuccess') });
      await onRefresh();
      await load();
    } catch (e) {
      toast({
        title: t('purchaseDetail.dealActions.cancelError'),
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleRecordCommission = () => {
    const dealName = deal.property_inquiries?.name ?? deal.properties?.address ?? `Deal ${deal.id.slice(0, 8)}`;
    const params = new URLSearchParams({
      tab: 'commission',
      dealPrice: String(closedPrice ?? purchaseContract.purchase_price ?? 0),
      dealName,
    });
    navigate(`${ROUTES.FINANCE}?${params.toString()}`);
  };

  return (
    <Tabs defaultValue="pOverview" className="w-full">
      <TabsList className="flex w-full max-w-4xl flex-wrap gap-1 h-auto">
        <TabsTrigger value="pOverview">{t('purchaseDetail.tabs.overview')}</TabsTrigger>
        <TabsTrigger value="pContingencies">{t('purchaseDetail.tabs.contingencies')}</TabsTrigger>
        <TabsTrigger value="pKeyDates">{t('purchaseDetail.tabs.keyDates')}</TabsTrigger>
        <TabsTrigger value="pDocuments">{t('purchaseDetail.tabs.documents')}</TabsTrigger>
      </TabsList>

      <TabsContent value="pOverview" className="mt-6 space-y-4">
        <Card className="border-border/80 dark:border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{t('purchaseDetail.overview.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <span className={`${COLORS.muted.text} dark:text-muted-foreground/70`}>{t('purchaseDetail.overview.price')}</span>
              <span className="font-medium text-foreground">
                {formatCurrency(purchaseContract.purchase_price ?? 0)}
              </span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className={`${COLORS.muted.text} dark:text-muted-foreground/70`}>{t('purchaseDetail.overview.financing')}</span>
              <Badge variant="secondary">{financingLabel(t, pd)}</Badge>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className={`${COLORS.muted.text} dark:text-muted-foreground/70`}>{t('purchaseDetail.overview.property')}</span>
              <span className="text-right">
                {pd.property_street}, {pd.property_city}, {pd.property_state} {pd.property_zip}
              </span>
            </div>
            {purchaseContract.contract_pdf_path && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={readOnly || pdfBusy}
                onClick={() => void handleOpenPdf()}
              >
                <FileText className="h-4 w-4" />
                {t('purchaseDetail.overview.openPdf')}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={readOnly}
              onClick={() => setIsCounterOfferOpen(true)}
            >
              {t('purchaseDetail.counterOffer.add')}
            </Button>
            {canUpdateDealStatus && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={readOnly}
                  onClick={() => setCloseDialogOpen(true)}
                >
                  {t('purchaseDetail.dealActions.markClosed')}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={readOnly}
                  onClick={() => setCancelDialogOpen(true)}
                >
                  {t('purchaseDetail.dealActions.cancelDeal')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <OfferHistoryTimeline contractId={contractId} />
      </TabsContent>

      <TabsContent value="pContingencies" className="mt-6">
        <ContingencySummaryCard
          dealId={deal.id}
          onOpenFullTab={onOpenContingenciesTab}
          readOnly={readOnly}
        />
      </TabsContent>

      <TabsContent value="pKeyDates" className="mt-6">
        {keyDates && (
          <KeyDatesCard
            effectiveDate={keyDates.effective_date ?? undefined}
            earnestMoneyDueDate={keyDates.earnest_money_due_date ?? undefined}
            inspectionDeadline={keyDates.inspection_disclosures_deadline_date ?? undefined}
            appraisalContingency={Boolean(pd.appraisal_contingency)}
            closingDate={keyDates.closing_date ?? undefined}
          />
        )}
      </TabsContent>

      <TabsContent value="pDocuments" className="mt-6 space-y-4">
        {(needsFhaAddendum || needsVaAddendum) && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('purchaseDetail.addenda.incompleteTitle')}</AlertTitle>
            <AlertDescription>{t('purchaseDetail.addenda.incompleteDescription')}</AlertDescription>
          </Alert>
        )}

        <Card className="border-border/80 dark:border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{t('purchaseDetail.addenda.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t('purchaseDetail.addenda.fha')}</p>
              <p className={`text-xs ${COLORS.muted.text} dark:text-muted-foreground/70`}>{t('purchaseDetail.addenda.fhaHelp')}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="max-w-xs"
                  disabled={readOnly || uploadKind === 'fha'}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    void handleAddendum('fha', f ?? null);
                    e.target.value = '';
                  }}
                />
                {pd.fha_addendum_uploaded && (
                  <Badge variant="outline">{t('purchaseDetail.addenda.uploaded')}</Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t('purchaseDetail.addenda.va')}</p>
              <p className={`text-xs ${COLORS.muted.text} dark:text-muted-foreground/70`}>{t('purchaseDetail.addenda.vaHelp')}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="max-w-xs"
                  disabled={readOnly || uploadKind === 'va'}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    void handleAddendum('va', f ?? null);
                    e.target.value = '';
                  }}
                />
                {pd.va_addendum_uploaded && (
                  <Badge variant="outline">{t('purchaseDetail.addenda.uploaded')}</Badge>
                )}
              </div>
            </div>

            {purchaseContract.contract_pdf_path && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-2"
                disabled={readOnly || pdfBusy}
                onClick={() => void handleOpenPdf()}
              >
                <Download className="h-4 w-4" />
                {t('purchaseDetail.overview.openPdf')}
              </Button>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <CounterOfferModal
        contractId={contractId}
        currentPrice={purchaseContract.purchase_price ?? 0}
        currentClosingDate={purchaseContract.closing_date ?? undefined}
        isOpen={isCounterOfferOpen}
        onClose={() => setIsCounterOfferOpen(false)}
        onSuccess={() => {
          void onRefresh();
          void load();
        }}
      />

      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('purchaseDetail.dealActions.closeConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('purchaseDetail.dealActions.closeConfirmBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('purchaseDetail.dealActions.cancel')}</AlertDialogCancel>
            <AlertDialogAction disabled={actionBusy} onClick={() => void handleCloseDeal()}>
              {t('purchaseDetail.dealActions.closeDeal')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('purchaseDetail.dealActions.cancelConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('purchaseDetail.dealActions.cancelConfirmBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={cancelReason}
            maxLength={300}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={t('purchaseDetail.dealActions.cancelReasonPlaceholder')}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t('purchaseDetail.dealActions.cancel')}</AlertDialogCancel>
            <AlertDialogAction disabled={actionBusy} onClick={() => void handleCancelDeal()}>
              {t('purchaseDetail.dealActions.confirmCancelDeal')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('purchaseDetail.dealActions.commissionTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('purchaseDetail.dealActions.commissionBody', {
                price: formatCurrency(closedPrice ?? purchaseContract.purchase_price ?? 0),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('purchaseDetail.dealActions.later')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecordCommission}>
              {t('purchaseDetail.dealActions.recordCommission')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}
