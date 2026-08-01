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
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { formatCurrency } from '../../../lib/currency';
import type { MarketingROI } from '../../../services/finance/analytics.service';
import { COLORS } from '@/config/colors';

interface MarketingROIProps {
  data: MarketingROI | null;
  loading?: boolean;
}

export const MarketingROIComponent = ({
  data,
  loading = false,
}: MarketingROIProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { currency } = useAuth();

  const formatMetric = (value: number) => {
    return formatCurrency(value, currency || 'USD');
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
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

  if (!data || data.totalMarketingSpend.value === 0) {
    return (
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-300">
              {t('finance:analytics.marketingROI')}
            </CardTitle>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 shadow-md">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-slate-400">
            {t('finance:analytics.noMarketingData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.byCategory
    .filter(cat => cat.spend.value > 0)
    .map(cat => ({
      name: t(`finance:categories.expense.${cat.category}`) || cat.category,
      spend: cat.spend.value,
      roi: cat.roi,
      color: cat.roi >= 0 ? COLORS.success.hex : COLORS.danger.hex,
    }));

  const CustomTooltip = ({ active, payload }: FinanceChartTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg dark:bg-slate-900 dark:border-slate-700">
          <p className="font-semibold text-gray-900 dark:text-slate-100">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            {t('finance:analytics.marketingSpend')}: {formatMetric(data.value ?? 0)}
          </p>
          <p className={`text-xs font-medium ${(data.payload?.roi ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ROI: {(data.payload?.roi ?? 0) >= 0 ? '+' : ''}{(data.payload?.roi ?? 0).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90 hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-300">
            {t('finance:analytics.marketingROI')}
          </CardTitle>
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 shadow-md">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main ROI KPI */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-pink-700 font-medium mb-1">
                  {t('finance:analytics.roiPercentage')}
                </p>
                <div className="flex items-baseline gap-2">
                  {data.roi >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  <p className={`text-3xl font-bold ${data.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.roi >= 0 ? '+' : ''}{data.roi.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 dark:text-slate-300 mb-1">
                  {t('finance:analytics.marketingSpend')}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  {formatMetric(data.totalMarketingSpend.value)}
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">
                  {t('finance:analytics.commissionRevenue')}: {formatMetric(data.commissionRevenue.value)}
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown by Category */}
          {chartData.length > 0 && (
            <div className="h-[250px]">
              <p className="text-xs font-medium text-gray-600 dark:text-slate-300 mb-2">
                {t('finance:analytics.byCategory')}
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border.hex} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: COLORS.muted.hex }}
                    tickLine={false}
                    axisLine={{ stroke: COLORS.border.hex }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: COLORS.muted.hex }}
                    tickLine={false}
                    axisLine={{ stroke: COLORS.border.hex }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="spend" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

