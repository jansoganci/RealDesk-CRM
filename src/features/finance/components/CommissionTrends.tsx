import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { MonthlyCommissionData } from '../../../types';
import { useChartColors } from '@/hooks/useChartColors';

interface CommissionTrendsProps {
  data: MonthlyCommissionData[];
  loading?: boolean;
}

export const CommissionTrends = ({
  data,
  loading = false,
}: CommissionTrendsProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const chartColors = useChartColors();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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

  // Filter out months with no data
  const chartData = data.filter(d => d.total > 0);

  if (chartData.length === 0) {
    return (
      <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('finance:commissionTrends.title')}
            </CardTitle>
            <div className="rounded-lg bg-gradient-to-br from-primary to-primary/80 p-2.5 shadow-md">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
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

  return (
    <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('finance:commissionTrends.title')}
          </CardTitle>
          <div className="rounded-lg bg-gradient-to-br from-primary to-primary/80 p-2.5 shadow-md">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} />
              <XAxis
                dataKey="monthName"
                tick={{ fontSize: 12, fill: chartColors.muted }}
                tickLine={false}
                axisLine={{ stroke: chartColors.border }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: chartColors.muted }}
                tickLine={false}
                axisLine={{ stroke: chartColors.border }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: chartColors.foreground, fontWeight: 600 }}
                contentStyle={{
                  backgroundColor: chartColors.card,
                  border: `1px solid ${chartColors.border}`,
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px hsl(var(--foreground) / 0.1)',
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">
                    {value === 'rental'
                      ? t('finance:commissionTrends.rental')
                      : t('finance:commissionTrends.sale')}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="rental"
                name="rental"
                stroke={chartColors.primary}
                strokeWidth={2}
                dot={{ fill: chartColors.primary, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="sale"
                name="sale"
                stroke={chartColors.success}
                strokeWidth={2}
                dot={{ fill: chartColors.success, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
