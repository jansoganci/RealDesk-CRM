import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { COLORS } from '@/config/colors';
import { useChartColors } from '@/hooks/useChartColors';
import type { LeadSource } from '@/services/leads.service';
import { useLeadSourceBreakdown } from '../hooks/useLeadSourceBreakdown';

type ChartRow = {
  name: string;
  value: number;
  percentage: number;
  source: LeadSource;
  color: string;
};

export function LeadSourceBreakdownCard() {
  const { t } = useTranslation('leads');
  const { data, total, loading, error } = useLeadSourceBreakdown();
  const chartColors = useChartColors();

  const sourceColors: Record<LeadSource, string> = {
    zillow: chartColors.chart1,
    realtor_com: chartColors.chart2,
    referral: chartColors.chart3,
    sign_call: chartColors.chart4,
    social_media: chartColors.chart5,
    cold_call: chartColors.withAlpha('chart1', 0.55),
    open_house: chartColors.withAlpha('chart2', 0.55),
    other: chartColors.muted,
  };

  const chartData: ChartRow[] = data.map((item) => ({
    name: t(`dashboard.sources.${item.source}`),
    value: item.count,
    percentage: item.percentage,
    source: item.source,
    color: sourceColors[item.source] ?? chartColors.muted,
  }));

  return (
    <Card className="shadow-lg border-border dark:border-border bg-card/80 dark:bg-muted backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-semibold">{t('dashboard.leadSources')}</CardTitle>
          </div>
          {!loading && (
            <span className="text-xs text-muted-foreground">
              {t('dashboard.totalLeads', { count: total })}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : error ? (
          <p className={`text-sm ${COLORS.danger.textDark}`}>{error}</p>
        ) : data.length === 0 ? (
          <p className={`text-sm ${COLORS.gray.text500} dark:text-muted-foreground/70`}>{t('dashboard.noLeadData')}</p>
        ) : (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${entry.source}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<SourcesTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 w-full">
              {data.slice(0, 8).map((item) => (
                <div key={item.source} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: sourceColors[item.source] ?? chartColors.muted }}
                  />
                  <span className="text-muted-foreground truncate">
                    {t(`dashboard.sources.${item.source}`)}
                  </span>
                  <span className="font-medium ml-auto shrink-0">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type TooltipPayload = { payload?: ChartRow };

function SourcesTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  const { t } = useTranslation('leads');
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as ChartRow | undefined;
  if (!row) return null;
  return (
    <div className="rounded-md border bg-background px-2 py-1.5 text-xs shadow-sm">
      <p className="font-medium">{row.name}</p>
      <p className="text-muted-foreground">{t('dashboard.tooltipCount', { count: row.value, percent: row.percentage })}</p>
    </div>
  );
}
