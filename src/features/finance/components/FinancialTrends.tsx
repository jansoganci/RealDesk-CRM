import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import type { YearlySummary } from '../../../types/financial';

interface FinancialTrendsProps {
  yearlySummary: YearlySummary | null;
  loading?: boolean;
}

export const FinancialTrends = ({
  yearlySummary,
  loading = false,
}: FinancialTrendsProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { currency } = useAuth();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMonth = (month: string) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('tr-TR', { month: 'short' });
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!yearlySummary) {
    return null;
  }

  // Prepare data for chart
  const chartData = yearlySummary.months.map(month => ({
    month: formatMonth(month.month),
    [t('finance:analytics.revenue')]: month.total_income,
    [t('finance:analytics.expenses')]: month.total_expense,
    [t('finance:analytics.profit')]: month.net_income,
  }));

  return (
    <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">
              {t('finance:analytics.yearlyTrend')}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {t('finance:analytics.yearlyTrendDesc', { year: yearlySummary.year })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {t('finance:analytics.profitMargin')}
            </p>
            <p
              className={`text-2xl font-bold ${
                yearlySummary.profit_margin >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {yearlySummary.profit_margin.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={value => formatCurrency(value)}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey={t('finance:analytics.revenue')}
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey={t('finance:analytics.expenses')}
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorExpenses)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey={t('finance:analytics.profit')}
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorProfit)"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
