import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CapProgress } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CapProgressCardProps {
  progress: CapProgress;
}

const money = (value: number | null): string =>
  value == null ? '—' : `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const CapProgressCard = ({ progress }: CapProgressCardProps) => {
  const { t } = useTranslation('profile');
  const [expanded, setExpanded] = useState(false);

  const progressTone = useMemo(() => {
    if (progress.is_capped) return 'bg-blue-600 dark:bg-blue-500';
    if (progress.pct_to_cap >= 80) return 'bg-emerald-600 dark:bg-emerald-500';
    return 'bg-amber-500 dark:bg-amber-400';
  }, [progress.is_capped, progress.pct_to_cap]);

  return (
    <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-950/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-900 dark:text-slate-100">{t('commissionSettings.cap.title')}</CardTitle>
          {progress.is_capped && (
            <Badge className="bg-emerald-600 dark:bg-emerald-500 dark:text-white">{t('commissionSettings.cap.capped')}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground dark:text-slate-400">
            {t('commissionSettings.cap.ytdPaid')}: {money(progress.ytd_company_dollar)} / {money(progress.cap_amount)}
          </p>
          <div className="h-2 w-full rounded-full bg-primary/20 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full transition-all ${progressTone}`}
              style={{ width: `${Math.max(0, Math.min(progress.pct_to_cap, 100))}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700 dark:text-slate-300">
          <p>{t('commissionSettings.cap.remaining')}: {money(progress.remaining_to_cap)}</p>
          <p>{t('commissionSettings.cap.dealsToCap')}: {progress.deals_to_cap_estimate == null ? '—' : progress.deals_to_cap_estimate.toFixed(1)}</p>
          <p>{t('commissionSettings.cap.gciToCap')}: {money(progress.gci_to_cap_estimate)}</p>
          <p>
            {t('commissionSettings.cap.resetDate')}: {progress.cap_reset_date ?? '—'}
            {progress.days_to_reset != null ? ` (${progress.days_to_reset} ${t('commissionSettings.cap.daysAway')})` : ''}
          </p>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
          >
            {expanded ? t('commissionSettings.cap.hideHistory') : t('commissionSettings.cap.showHistory')}
          </Button>
          {expanded && (
            <div className="space-y-2">
              {progress.cap_history.length === 0 ? (
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t('commissionSettings.cap.noHistory')}</p>
              ) : (
                progress.cap_history.map((row) => (
                  <div
                    key={row.commission_id}
                    className="rounded-md border border-slate-200 bg-slate-50/80 dark:bg-slate-900/50 dark:border-slate-700 p-2 text-sm"
                  >
                    <p className="font-medium text-slate-900 dark:text-slate-100">{row.property_address}</p>
                    <p className="text-muted-foreground dark:text-slate-400">
                      {row.closing_date ?? '—'} • +{money(row.company_dollar)} • {t('commissionSettings.cap.cumulative')}: {money(row.cumulative_company_dollar)}
                    </p>
                    {row.triggered_cap && (
                      <Badge className="mt-1 bg-blue-600 dark:bg-blue-500 dark:text-white">{t('commissionSettings.cap.triggeredCap')}</Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
