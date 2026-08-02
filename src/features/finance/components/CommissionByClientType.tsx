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
import { Users } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { formatCurrency } from '../../../lib/currency';
import type { CommissionByClientType } from '../../../services/finance/analytics.service';
import { useChartColors } from '@/hooks/useChartColors';

interface CommissionByClientTypeProps {
  data: CommissionByClientType | null;
  loading?: boolean;
}

export const CommissionByClientTypeComponent = ({
  data,
  loading = false,
}: CommissionByClientTypeProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { currency } = useAuth();
  const chartColors = useChartColors();

  const formatMetric = (value: number) => {
    return formatCurrency(value, currency || 'USD');
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

  if (!data || data.total.value === 0) {
    return (
      <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('finance:analytics.commissionByClientType')}
            </CardTitle>
            <div className="rounded-lg bg-gradient-to-br from-primary to-primary/80 p-2.5 shadow-md">
              <Users className="h-4 w-4 text-primary-foreground" />
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

  const ownerPercentage = data.total.value > 0 
    ? (data.owner.value / data.total.value) * 100 
    : 0;
  const tenantPercentage = data.total.value > 0 
    ? (data.tenant.value / data.total.value) * 100 
    : 0;
  const buyerPercentage = data.total.value > 0 
    ? (data.buyer.value / data.total.value) * 100 
    : 0;

  const chartData = [
    {
      name: t('finance:analytics.ownerCommissions'),
      value: data.owner.value,
      percentage: ownerPercentage,
      color: chartColors.primary,
    },
    {
      name: t('finance:analytics.tenantCommissions'),
      value: data.tenant.value,
      percentage: tenantPercentage,
      color: chartColors.success,
    },
    {
      name: t('finance:analytics.buyerCommissions'),
      value: data.buyer.value,
      percentage: buyerPercentage,
      color: chartColors.warning,
    },
  ];

  const CustomTooltip = ({ active, payload }: FinanceChartTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-lg dark:bg-muted dark:border-border">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatMetric(data.value ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.payload?.percentage?.toFixed(1)}%
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
            {t('finance:analytics.commissionByClientType')}
          </CardTitle>
          <div className="rounded-lg bg-gradient-to-br from-primary to-primary/80 p-2.5 shadow-md">
            <Users className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-primary/30 bg-primary/15 p-3">
              <p className="text-xs text-primary font-medium mb-1">
                {t('finance:analytics.ownerCommissions')}
              </p>
              <p className="text-lg font-bold text-primary">
                {formatMetric(data.owner.value)}
              </p>
              <p className="text-xs text-primary mt-1">
                {ownerPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-success/15 rounded-lg p-3 border border-success/30">
              <p className="text-xs text-success font-medium mb-1">
                {t('finance:analytics.tenantCommissions')}
              </p>
              <p className="text-lg font-bold text-success">
                {formatMetric(data.tenant.value)}
              </p>
              <p className="text-xs text-success mt-1">
                {tenantPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-warning/15 rounded-lg p-3 border border-warning/30">
              <p className="mb-1 text-xs font-medium text-warning-foreground dark:text-warning">
                {t('finance:analytics.buyerCommissions')}
              </p>
              <p className="text-lg font-bold text-warning-foreground dark:text-warning">
                {formatMetric(data.buyer.value)}
              </p>
              <p className="mt-1 text-xs text-warning-foreground dark:text-warning">
                {buyerPercentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} />
                <XAxis
                  dataKey="name"
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
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
