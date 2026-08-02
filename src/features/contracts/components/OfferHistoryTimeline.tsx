import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { COLORS } from '@/config/colors';
import { formatCurrency } from '@/lib/currency';
import { contractsService, purchaseAgreementService } from '@/lib/serviceProxy';
import type { OfferRound } from '@/types';

export interface OfferHistoryTimelineProps {
  contractId: string;
}

function statusClass(status: string): string {
  if (status === 'accepted') return `${COLORS.success.bgLight} ${COLORS.success.textDark} ${COLORS.success.border}`;
  if (status === 'rejected') return `${COLORS.danger.bgLight} ${COLORS.danger.textDark} ${COLORS.danger.border}`;
  if (status === 'superseded') return `${COLORS.gray.bg100} ${COLORS.gray.text700} ${COLORS.gray.border200}`;
  return `${COLORS.primary.bgLight} ${COLORS.primary.text} ${COLORS.primary.border}`;
}

function fmtDate(v: string | null | undefined): string {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function OfferHistoryTimeline({ contractId }: OfferHistoryTimelineProps) {
  const { t } = useTranslation('contracts');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OfferRound[]>([]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const data = await purchaseAgreementService.getOfferHistory(contractId);
        if (mounted) setRows(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [contractId]);

  const sorted = useMemo(() => [...rows].sort((a, b) => a.round_number - b.round_number), [rows]);

  const openPdf = async (path: string) => {
    const url = await contractsService.getContractPdfUrl(path);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return <p className={`text-sm ${COLORS.muted.text}`}>{t('purchaseWizard.step9.offerHistory.loading')}</p>;
  }

  if (sorted.length === 0) {
    return <p className={`text-sm ${COLORS.muted.text}`}>{t('purchaseWizard.step9.offerHistory.empty')}</p>;
  }

  return (
    <div className="space-y-3">
      {sorted.map((row) => {
        const rowAny = row as OfferRound & { pdf_path?: string | null };
        return (
          <Card key={row.id} className="border-border/80 shadow-sm">
            <CardContent className="space-y-2 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{t('purchaseWizard.step9.offerHistory.round', { n: row.round_number })}</Badge>
                <Badge className={statusClass(row.status)}>{row.status}</Badge>
              </div>
              <p className="text-sm">{t('purchaseWizard.step9.offerHistory.offeredBy', { who: row.offered_by })}</p>
              <p className="text-sm">{t('purchaseWizard.step9.offerHistory.price', { value: formatCurrency(row.offer_price) })}</p>
              <p className="text-sm">{t('purchaseWizard.step9.offerHistory.closingDate', { value: fmtDate(row.closing_date) })}</p>
              <p className="text-sm">{t('purchaseWizard.step9.offerHistory.submittedAt', { value: fmtDate(row.submitted_at) })}</p>
              {row.notes && <p className={`text-sm ${COLORS.muted.text}`}>{row.notes}</p>}
              {rowAny.pdf_path ? (
                <Button type="button" size="sm" variant="outline" onClick={() => void openPdf(rowAny.pdf_path!)}>
                  {t('purchaseWizard.step9.offerHistory.viewPdf')}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

