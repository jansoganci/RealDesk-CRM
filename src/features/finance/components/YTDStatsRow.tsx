import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CapProgress, YTDSummary } from '@/types';
import { useTranslation } from 'react-i18next';

interface YTDStatsRowProps {
  summary: YTDSummary | null;
  capProgress: CapProgress | null;
}

const money = (value: number | null | undefined): string =>
  `$${(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const YTDStatsRow = ({ summary, capProgress }: YTDStatsRowProps) => {
  const { t } = useTranslation('finance');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{t('commissionDashboard.stats.ytdGci')}</CardTitle></CardHeader><CardContent className="text-xl font-semibold">{money(summary?.total_gci)}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{t('commissionDashboard.stats.ytdNet')}</CardTitle></CardHeader><CardContent className="text-xl font-semibold text-emerald-600">{money(summary?.total_net)}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{t('commissionDashboard.stats.dealsClosed')}</CardTitle></CardHeader><CardContent className="text-xl font-semibold">{summary?.deal_count ?? 0}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{t('commissionDashboard.stats.avgNetPerDeal')}</CardTitle></CardHeader><CardContent className="text-xl font-semibold">{money(summary?.avg_net_per_deal)}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{t('commissionDashboard.stats.capProgress')}</CardTitle></CardHeader><CardContent className="text-xl font-semibold">{(capProgress?.pct_to_cap ?? 0).toFixed(0)}%</CardContent></Card>
    </div>
  );
};
