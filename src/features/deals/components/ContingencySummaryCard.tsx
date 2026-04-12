/**
 * Sprint 6B T14 — Compact contingency snapshot for the purchase detail tab.
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { COLORS } from '@/config/colors';
import { offerContingenciesService } from '@/lib/serviceProxy';
import type { OfferContingency } from '@/types';

function formatDeadline(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

export type ContingencySummaryCardProps = {
  dealId: string;
  onOpenFullTab?: () => void;
  readOnly?: boolean;
};

export function ContingencySummaryCard({
  dealId,
  onOpenFullTab,
  readOnly: _readOnly = false,
}: ContingencySummaryCardProps) {
  const { t } = useTranslation('deals');
  const { toast } = useToast();
  const [rows, setRows] = useState<OfferContingency[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await offerContingenciesService.getActiveByDeal(dealId);
      setRows(data);
    } catch {
      setRows([]);
      toast({ title: t('contingencies.loadError'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [dealId, t, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusLabel = (s: string) =>
    t(`contingencies.status.${s}`, { defaultValue: s });

  return (
    <Card className="border-gray-200/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">{t('purchaseDetail.contingencySummary.title')}</CardTitle>
        {onOpenFullTab && (
          <Button type="button" variant="ghost" size="sm" onClick={onOpenFullTab}>
            {t('purchaseDetail.contingencySummary.openFull')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className={`text-sm ${COLORS.muted.text}`}>{t('purchaseDetail.loading')}</p>
        ) : rows.length === 0 ? (
          <p className={`text-sm ${COLORS.muted.text}`}>{t('purchaseDetail.contingencySummary.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {rows.slice(0, 6).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className={COLORS.gray.text900}>
                  {r.label_override?.trim() ||
                    t(`contingencies.types.${r.contingency_type}`, {
                      defaultValue: r.contingency_type.replace(/_/g, ' '),
                    })}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{statusLabel(r.status)}</Badge>
                  <span className={COLORS.muted.text}>{formatDeadline(r.deadline_date)}</span>
                </span>
              </li>
            ))}
            {rows.length > 6 && (
              <li className={`text-xs ${COLORS.muted.text}`}>
                {t('purchaseDetail.contingencySummary.more', { count: rows.length - 6 })}
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
