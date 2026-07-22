import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import type { BudgetVsActual } from '../../../types/financial';
import { COLORS } from '@/config/colors';

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
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!budgetComparison || budgetComparison.length === 0) {
    return (
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t('finance:analytics.budgetVsActual')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-400">{t('finance:analytics.noBudgetData')}</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">
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
  const chartData = {
    labels: topCategories.map(item =>
      item.category.length > 15 ? item.category.substring(0, 15) + '...' : item.category
    ),
    datasets: [
      {
        label: t('finance:analytics.budgeted'),
        data: topCategories.map(item => item.budgeted),
        backgroundColor: COLORS.disabled.hex,
        borderRadius: 8,
      },
      {
        label: t('finance:analytics.actual'),
        data: topCategories.map(item => item.actual),
        backgroundColor: topCategories.map(item => {
          switch (item.status) {
            case 'under':
              return COLORS.success.hex;
            case 'on_track':
              return COLORS.primary.hex;
            case 'over':
              return COLORS.danger.hex;
            default:
              return COLORS.muted.hex;
          }
        }),
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: COLORS.muted.hex,
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: {
          color: COLORS.border.hex,
          borderDash: [3, 3],
        },
        ticks: {
          color: COLORS.muted.hex,
          font: {
            size: 12,
          },
          callback: (value: any) => formatCurrency(value),
        },
      },
    },
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
    <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {t('finance:analytics.budgetVsActual')}
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
          {t('finance:analytics.budgetVsActualDesc')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart */}
          <div className="h-72">
            <Bar data={chartData} options={chartOptions} />
          </div>

          {/* Category List */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
              {t('finance:analytics.categoryDetails')}
            </h4>
            {topCategories.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors dark:bg-slate-800/50 dark:hover:bg-slate-800 ${
                  onCategoryClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onCategoryClick && onCategoryClick(item.category)}
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{item.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-slate-400">
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
