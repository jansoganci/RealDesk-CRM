import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { FinanceChartTooltipProps } from './chartTooltipTypes';
import { Building2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { formatCurrency } from '../../../lib/currency';
import type { CommissionByPropertyType } from '../../../services/finance/analytics.service';
import { useChartColors } from '@/hooks/useChartColors';

interface CommissionByPropertyTypeProps {
  data: CommissionByPropertyType | null;
  loading?: boolean;
}

export const CommissionByPropertyTypeComponent = ({
  data,
  loading = false,
}: CommissionByPropertyTypeProps) => {
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
              {t('finance:analytics.commissionByPropertyType')}
            </CardTitle>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary to-primary shadow-md">
              <Building2 className="h-4 w-4 text-primary-foreground" />
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

  const rentalPercentage = data.total.value > 0 
    ? (data.rental.value / data.total.value) * 100 
    : 0;
  const salePercentage = data.total.value > 0 
    ? (data.sale.value / data.total.value) * 100 
    : 0;

  const chartData = [
    {
      name: t('finance:analytics.rentalCommissions'),
      value: data.rental.value,
      percentage: rentalPercentage,
      color: chartColors.primary,
    },
    {
      name: t('finance:analytics.saleCommissions'),
      value: data.sale.value,
      percentage: salePercentage,
      color: chartColors.success,
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

  const CustomLabel = ({
    cx,
    cy,
    midAngle = 0,
    innerRadius,
    outerRadius,
    percent = 0,
  }: PieLabelRenderProps) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('finance:analytics.commissionByPropertyType')}
          </CardTitle>
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary to-primary shadow-md">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-primary/30 bg-primary/15 p-3">
              <p className="text-xs text-primary font-medium mb-1">
                {t('finance:analytics.rentalCommissions')}
              </p>
              <p className="text-xl font-bold text-primary">
                {formatMetric(data.rental.value)}
              </p>
              <p className="text-xs text-primary mt-1">
                {rentalPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-success/15 rounded-lg p-3 border border-success/30">
              <p className="text-xs text-success font-medium mb-1">
                {t('finance:analytics.saleCommissions')}
              </p>
              <p className="text-xl font-bold text-success">
                {formatMetric(data.sale.value)}
              </p>
              <p className="text-xs text-success mt-1">
                {salePercentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={80}
                  fill={chartColors.primary}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => {
                    const item = chartData.find(d => d.name === value);
                    return item ? `${value} (${item.percentage.toFixed(1)}%)` : value;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
