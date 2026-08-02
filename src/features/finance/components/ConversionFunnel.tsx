import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { FinanceChartTooltipProps } from './chartTooltipTypes';
import { Target } from 'lucide-react';
import type { ConversionFunnelMetrics } from '../../../services/finance/analytics.service';
import { useChartColors } from '@/hooks/useChartColors';

interface ConversionFunnelProps {
  data: ConversionFunnelMetrics | null;
  loading?: boolean;
}

export const ConversionFunnelComponent = ({
  data,
  loading = false,
}: ConversionFunnelProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const chartColors = useChartColors();

  if (loading) {
    return (
      <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.inquiries === 0) {
    return (
      <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('finance:analytics.conversionFunnel')}
            </CardTitle>
            <div className="rounded-lg bg-gradient-to-br from-warning to-warning/80 p-2.5 shadow-md">
              <Target className="h-4 w-4 text-warning-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t('finance:commissionTrends.noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const funnelData = [
    {
      name: t('finance:analytics.totalInquiries'),
      value: data.inquiries,
      fill: chartColors.primary,
    },
    {
      name: t('finance:analytics.appointments'),
      value: data.appointments,
      fill: chartColors.success,
    },
    {
      name: t('finance:analytics.contracts'),
      value: data.contracts,
      fill: chartColors.warning,
    },
  ];

  const CustomTooltip = ({ active, payload }: FinanceChartTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-lg dark:bg-muted dark:border-border">
          <p className="font-semibold text-foreground">{data.payload?.name}</p>
          <p className="text-sm text-muted-foreground">
            {t('finance:analytics.count')}: {data.payload?.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('finance:analytics.conversionFunnel')}
          </CardTitle>
          <div className="rounded-lg bg-gradient-to-br from-warning to-warning/80 p-2.5 shadow-md">
            <Target className="h-4 w-4 text-warning-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Conversion Rates */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-primary/30 bg-primary/15 p-3">
              <p className="text-xs text-primary font-medium mb-1">
                {t('finance:analytics.leadToAppointment')}
              </p>
              <p className="text-xl font-bold text-primary">
                {data.rates.leadToAppointment.toFixed(1)}%
              </p>
            </div>
            <div className="bg-success/15 rounded-lg p-3 border border-success/30">
              <p className="text-xs text-success font-medium mb-1">
                {t('finance:analytics.appointmentToContract')}
              </p>
              <p className="text-xl font-bold text-success">
                {data.rates.appointmentToContract.toFixed(1)}%
              </p>
            </div>
            <div className="bg-warning/15 rounded-lg p-3 border border-warning/30">
              <p className="mb-1 text-xs font-medium text-warning-foreground dark:text-warning">
                {t('finance:analytics.overallConversion')}
              </p>
              <p className="text-xl font-bold text-warning-foreground dark:text-warning">
                {data.rates.overall.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Funnel Visualization */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} />
                <XAxis type="number" tick={{ fontSize: 12, fill: chartColors.muted }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 12, fill: chartColors.muted }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
