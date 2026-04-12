/**
 * Sprint 6B T13 — Vertical timeline of offer rounds (parent chain + purchase contract link).
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { COLORS } from '@/config/colors';
import { formatCurrency } from '@/lib/currency';
import type { OfferRound } from '@/types';

export type OfferHistoryTimelineProps = {
  rounds: OfferRound[];
};

export function OfferHistoryTimeline({ rounds }: OfferHistoryTimelineProps) {
  const { t } = useTranslation('deals');

  const sorted = useMemo(() => [...rounds].sort((a, b) => a.round_number - b.round_number), [rounds]);

  const roundNumberById = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of sorted) {
      m.set(r.id, r.round_number);
    }
    return m;
  }, [sorted]);

  const roundStatusLabel = (status: string) =>
    t(`offers.roundStatus.${status}`, { defaultValue: status });

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{t('offers.historyTitle')}</p>
      <ol className="space-y-2">
        {sorted.map((r) => {
          const parentN = r.parent_round_id ? roundNumberById.get(r.parent_round_id) : undefined;
          return (
            <li
              key={r.id}
              className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5 space-y-1"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {t('detail.round')} {r.round_number}
                </span>
                <span className="text-sm text-foreground">{formatCurrency(r.offer_price)}</span>
                <Badge variant="outline">{roundStatusLabel(r.status)}</Badge>
              </div>
              {parentN != null && (
                <p className={`text-xs ${COLORS.muted.text}`}>
                  {t('offers.historyParent', { n: parentN })}
                </p>
              )}
              {r.contract_id && (
                <p className={`text-xs ${COLORS.muted.text}`}>{t('offers.historyPurchaseLink')}</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
