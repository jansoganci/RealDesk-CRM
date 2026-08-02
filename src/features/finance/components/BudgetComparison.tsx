import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import type { BudgetVsActual } from '../../../types/financial';
import { useChartColors } from '@/hooks/useChartColors';
import type { TooltipItem } from 'chart.js';

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
  const chartColors = useChartColors();

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
      <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted">
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
      <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground dark:text-foreground">
            {t('finance:analytics.budgetVsActual')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-muted-foreground dark:text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('finance:analytics.noBudgetData')}</p>
            <p className="text-sm text-muted-foreground/70 dark:text-muted-foreground mt-2">
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
        backgroundColor: chartColors.mutedSurface,
        borderRadius: 8,
      },
      {
        label: t('finance:analytics.actual'),
        data: topCategories.map(item => item.actual),
        backgroundColor: topCategories.map(item => {
          switch (item.status) {
            case 'under':
              return chartColors.success;
            case 'on_track':
              return chartColors.primary;
            case 'over':
              return chartColors.destructive;
            default:
              return chartColors.muted;
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
          label: (context: TooltipItem<'bar'>) => {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y ?? 0)}`;
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
          color: chartColors.muted,
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: {
          color: chartColors.border,
          borderDash: [3, 3],
        },
        ticks: {
          color: chartColors.muted,
          font: {
            size: 12,
          },
          callback: (value: string | number) => formatCurrency(Number(value)),
        },
      },
    },
  };

  const getStatusBadge = (status: string, percentage: number) => {
    switch (status) {
      case 'under':
        return (
          <Badge className="bg-success/15 text-success border-success/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t('finance:analytics.underBudget', {
              percent: Math.abs(percentage).toFixed(0),
            })}
          </Badge>
        );
      case 'on_track':
        return (
          <Badge className="border-primary/30 bg-primary/15 text-primary">
            <TrendingUp className="h-3 w-3 mr-1" />
            {t('finance:analytics.onTrack')}
          </Badge>
        );
      case 'over':
        return (
          <Badge className="bg-destructive/15 text-destructive border-destructive/30">
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
    <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground dark:text-foreground">
          {t('finance:analytics.budgetVsActual')}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
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
            <h4 className="text-sm font-semibold text-foreground">
              {t('finance:analytics.categoryDetails')}
            </h4>
            {topCategories.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted transition-colors dark:bg-muted dark:hover:bg-muted ${
                  onCategoryClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onCategoryClick && onCategoryClick(item.category)}
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground dark:text-foreground">{item.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(item.actual)} / {formatCurrency(item.budgeted)}
                    </span>
                    {getStatusBadge(item.status, item.percentage_difference)}
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${
                      item.status === 'over' ? 'text-destructive' : 'text-success'
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
