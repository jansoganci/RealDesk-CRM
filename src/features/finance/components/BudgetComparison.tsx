import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import type { BudgetVsActual } from '../../../types/financial';

interface BudgetComparisonProps {
  budgetComparison: BudgetVsActual[];
  loading?: boolean;
  onCategoryClick?: (category: string) => void;
}

export const BudgetComparison = ({
  budgetComparison,
  loading = false,
  onCategoryClick,
}: BudgetComparisonProps) => {
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

  if (loading) {
    return (
      <Card className="shadow-lg border-gray-100">
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!budgetComparison || budgetComparison.length === 0) {
    return (
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">
            {t('finance:analytics.budgetVsActual')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t('finance:analytics.noBudgetData')}</p>
            <p className="text-sm text-gray-400 mt-2">
              {t('finance:analytics.noBudgetDataDesc')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Take top 8 categories for better readability
  const topCategories = budgetComparison.slice(0, 8);

  // Prepare data for chart
  const chartData = topCategories.map(item => ({
    category: item.category.length > 15 ? item.category.substring(0, 15) + '...' : item.category,
    [t('finance:analytics.budgeted')]: item.budgeted,
    [t('finance:analytics.actual')]: item.actual,
    status: item.status,
  }));

  const getBarColor = (status: string) => {
    switch (status) {
      case 'under':
        return '#10b981'; // Green
      case 'on_track':
        return '#3b82f6'; // Blue
      case 'over':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getStatusBadge = (status: string, percentage: number) => {
    switch (status) {
      case 'under':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t('finance:analytics.underBudget', {
              percent: Math.abs(percentage).toFixed(0),
            })}
          </Badge>
        );
      case 'on_track':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            {t('finance:analytics.onTrack')}
          </Badge>
        );
      case 'over':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {t('finance:analytics.overBudget', {
              percent: Math.abs(percentage).toFixed(0),
            })}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">
          {t('finance:analytics.budgetVsActual')}
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          {t('finance:analytics.budgetVsActualDesc')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="category"
                stroke="#6b7280"
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={80}
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
              <Bar
                dataKey={t('finance:analytics.budgeted')}
                fill="#94a3b8"
                radius={[8, 8, 0, 0]}
              />
              <Bar dataKey={t('finance:analytics.actual')} radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Category List */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">
              {t('finance:analytics.categoryDetails')}
            </h4>
            {topCategories.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors ${
                  onCategoryClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onCategoryClick && onCategoryClick(item.category)}
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{item.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatCurrency(item.actual)} / {formatCurrency(item.budgeted)}
                    </span>
                    {getStatusBadge(item.status, item.percentage_difference)}
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${
                      item.status === 'over' ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {item.status === 'over' ? '-' : '+'}
                    {formatCurrency(Math.abs(item.difference))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
