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
    if (progress.is_capped) return 'bg-blue-600';
    if (progress.pct_to_cap >= 80) return 'bg-emerald-600';
    return 'bg-amber-500';
  }, [progress.is_capped, progress.pct_to_cap]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('commissionSettings.cap.title')}</CardTitle>
          {progress.is_capped && <Badge className="bg-emerald-600">{t('commissionSettings.cap.capped')}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t('commissionSettings.cap.ytdPaid')}: {money(progress.ytd_company_dollar)} / {money(progress.cap_amount)}
          </p>
          <div className="h-2 w-full rounded-full bg-primary/20 overflow-hidden">
            <div
              className={`h-full transition-all ${progressTone}`}
              style={{ width: `${Math.max(0, Math.min(progress.pct_to_cap, 100))}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <p>{t('commissionSettings.cap.remaining')}: {money(progress.remaining_to_cap)}</p>
          <p>{t('commissionSettings.cap.dealsToCap')}: {progress.deals_to_cap_estimate == null ? '—' : progress.deals_to_cap_estimate.toFixed(1)}</p>
          <p>{t('commissionSettings.cap.gciToCap')}: {money(progress.gci_to_cap_estimate)}</p>
          <p>
            {t('commissionSettings.cap.resetDate')}: {progress.cap_reset_date ?? '—'}
            {progress.days_to_reset != null ? ` (${progress.days_to_reset} ${t('commissionSettings.cap.daysAway')})` : ''}
          </p>
        </div>

        <div className="space-y-2">
          <Button variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? t('commissionSettings.cap.hideHistory') : t('commissionSettings.cap.showHistory')}
          </Button>
          {expanded && (
            <div className="space-y-2">
              {progress.cap_history.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('commissionSettings.cap.noHistory')}</p>
              ) : (
                progress.cap_history.map((row) => (
                  <div key={row.commission_id} className="rounded-md border p-2 text-sm">
                    <p className="font-medium">{row.property_address}</p>
                    <p className="text-muted-foreground">
                      {row.closing_date ?? '—'} • +{money(row.company_dollar)} • {t('commissionSettings.cap.cumulative')}: {money(row.cumulative_company_dollar)}
                    </p>
                    {row.triggered_cap && (
                      <Badge className="mt-1 bg-blue-600">{t('commissionSettings.cap.triggeredCap')}</Badge>
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
