import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Doughnut } from 'react-chartjs-2';
import { useAuth } from '../../../contexts/AuthContext';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { TopCategory } from '../../../types/financial';
import type { TooltipItem } from 'chart.js';
import { useChartColors } from '@/hooks/useChartColors';

interface TopCategoriesProps {
  topIncome: TopCategory[];
  topExpense: TopCategory[];
  loading?: boolean;
}

export const TopCategories = ({
  topIncome,
  topExpense,
  loading = false,
}: TopCategoriesProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { currency } = useAuth();
  const chartColors = useChartColors();
  const categoryColors = [
    chartColors.chart1,
    chartColors.chart2,
    chartColors.chart3,
    chartColors.chart4,
    chartColors.chart5,
  ];

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <Card key={i} className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const renderCategoryCard = (
    title: string,
    description: string,
    categories: TopCategory[],
    icon: typeof TrendingUp
  ) => {
    const Icon = icon;
    const hasData = categories && categories.length > 0;

    // Prepare chart data
    const chartData = {
      labels: categories.map(c => c.category),
      datasets: [
        {
          data: categories.map(c => c.amount),
          backgroundColor: categoryColors.slice(0, categories.length),
          borderWidth: 0,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'doughnut'>) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              return `${label}: ${formatCurrency(value)}`;
            },
          },
        },
      },
    };

    return (
      <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg shadow-md ${
                icon === TrendingUp
                  ? 'bg-success'
                  : 'bg-destructive'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  icon === TrendingUp
                    ? 'text-success-foreground'
                    : 'text-destructive-foreground'
                }`}
              />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-foreground dark:text-foreground">
                {title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Donut Chart */}
              <div className="w-full md:w-1/2">
                <div className="h-48">
                  <Doughnut data={chartData} options={chartOptions} />
                </div>
              </div>

              {/* Legend */}
              <div className="w-full md:w-1/2 space-y-3">
                {categories.map((cat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                      />
                      <span className="text-sm font-medium text-foreground dark:text-foreground truncate">
                        {cat.category}
                      </span>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-bold text-foreground dark:text-foreground">
                        {formatCurrency(cat.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cat.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon className="h-12 w-12 text-muted-foreground dark:text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {t('finance:analytics.noCategories')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {renderCategoryCard(
        t('finance:analytics.topIncomeSources'),
        t('finance:analytics.topIncomeSourcesDesc'),
        topIncome,
        TrendingUp
      )}
      {renderCategoryCard(
        t('finance:analytics.topExpenseCategories'),
        t('finance:analytics.topExpenseCategoriesDesc'),
        topExpense,
        TrendingDown
      )}
    </div>
  );
};
