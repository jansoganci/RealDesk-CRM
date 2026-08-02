/**
 * Sprint 6B T15 — Read-only summary for a purchase contract (standalone route).
 */

import { useCallback, useEffect, useState } from 'react';
import { generatePath, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ExternalLink, Loader2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { COLORS } from '@/config/colors';
import { ROUTES } from '@/config/constants';
import { formatCurrency } from '@/lib/currency';
import {
  contractsService,
  purchaseAgreementService,
  type PurchaseContractWithDetails,
} from '@/lib/serviceProxy';

export type PurchaseContractDetailViewProps = {
  contractId: string;
};

function formatOptionalDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

function financingLabel(
  tDeals: (k: string, o?: Record<string, string>) => string,
  pd: NonNullable<PurchaseContractWithDetails['purchase_details']>,
): string {
  const ft = pd.financing_type;
  if (ft === 'all_cash') return tDeals('purchaseDetail.financing.allCash');
  if (ft === 'seller_financing') return tDeals('purchaseDetail.financing.seller');
  if (ft === 'bank_financing') {
    const bt = pd.bank_loan_type;
    if (bt === 'fha') return tDeals('purchaseDetail.financing.fha');
    if (bt === 'va') return tDeals('purchaseDetail.financing.va');
    if (bt === 'conventional') return tDeals('purchaseDetail.financing.conventional');
    if (bt === 'other') return tDeals('purchaseDetail.financing.other');
    return tDeals('purchaseDetail.financing.bank');
  }
  return ft ?? '—';
}

export function PurchaseContractDetailView({ contractId }: PurchaseContractDetailViewProps) {
  const { t } = useTranslation('contracts');
  const { t: tDeals } = useTranslation('deals');
  const [bundle, setBundle] = useState<PurchaseContractWithDetails | null>(null);
  const [dealId, setDealId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, linkedDealId] = await Promise.all([
        purchaseAgreementService.getPurchaseByContractId(contractId),
        purchaseAgreementService.getDealIdForPurchaseContract(contractId),
      ]);
      setBundle(data);
      setDealId(linkedDealId);
    } catch (e) {
      setBundle(null);
      setDealId(null);
      setError(e instanceof Error ? e.message : t('purchaseContractDetail.loadError'));
    } finally {
      setLoading(false);
    }
  }, [contractId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const pd = bundle?.purchase_details;
  const addressLine =
    pd &&
    [pd.property_street, pd.property_city, pd.property_state, pd.property_zip]
      .filter(Boolean)
      .join(', ');

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

  if (loading) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className={`text-sm ${COLORS.muted.text}`}>{t('purchaseContractDetail.loading')}</p>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('purchaseContractDetail.loadError')}</AlertTitle>
        <AlertDescription>{error ?? t('purchaseContractDetail.loadError')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t('purchaseContractDetail.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {addressLine ? (
            <p className={COLORS.gray.text900}>{addressLine}</p>
          ) : (
            <p className={COLORS.muted.text}>{t('purchaseContractDetail.property')}</p>
          )}
          <dl className="grid gap-2 sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-x-4">
            <dt className={`font-medium ${COLORS.muted.text}`}>{t('purchaseContractDetail.price')}</dt>
            <dd>
              {bundle.purchase_price != null
                ? formatCurrency(bundle.purchase_price)
                : '—'}
            </dd>
            <dt className={`font-medium ${COLORS.muted.text}`}>{t('purchaseContractDetail.closing')}</dt>
            <dd>{formatOptionalDate(bundle.closing_date)}</dd>
            {pd && (
              <>
                <dt className={`font-medium ${COLORS.muted.text}`}>{t('purchaseContractDetail.financing')}</dt>
                <dd>{financingLabel(tDeals, pd)}</dd>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {dealId ? (
          <Button variant="default" size="sm" asChild>
            <Link to={generatePath(ROUTES.DEAL_DETAIL, { id: dealId })}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {t('purchaseContractDetail.viewDeal')}
            </Link>
          </Button>
        ) : (
          <p className={`text-sm ${COLORS.muted.text}`}>{t('purchaseContractDetail.dealMissing')}</p>
        )}
        {bundle.contract_pdf_path ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleOpenPdf()}
            disabled={pdfBusy}
          >
            {pdfBusy ? t('purchaseContractDetail.openPdfBusy') : t('purchaseContractDetail.openPdf')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
