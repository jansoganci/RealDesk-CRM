import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../../../contexts/AuthContext';
import { NormalizedYearlySummary } from '../../../services/finance/analytics.service';
import { formatCurrency } from '../../../lib/currency';
import { YearOverYearIndicator } from './YearOverYearIndicator';
import { useChartColors } from '@/hooks/useChartColors';
import type { TooltipItem } from 'chart.js';

interface FinancialTrendsProps {
  yearlySummary: NormalizedYearlySummary | null;
  loading?: boolean;
}

export const FinancialTrends = ({
  yearlySummary,
  loading = false,
}: FinancialTrendsProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { currency: userCurrency } = useAuth();
  const chartColors = useChartColors();

  const formatCurrencyLocal = (value: number) => {
    return formatCurrency(value, userCurrency || 'USD');
  };

  const formatMonth = (month: string) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('tr-TR', { month: 'short' });
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

  if (!yearlySummary) {
    return null;
  }

  // Prepare data for chart
  const chartData = {
    labels: yearlySummary.months.map(month => formatMonth(month.month)),
    datasets: [
      {
        label: t('finance:analytics.revenue'),
        data: yearlySummary.months.map(month => month.total_income.value),
        borderColor: chartColors.success,
        backgroundColor: chartColors.withAlpha('success', 0.1),
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: t('finance:analytics.expenses'),
        data: yearlySummary.months.map(month => month.total_expense.value),
        borderColor: chartColors.destructive,
        backgroundColor: chartColors.withAlpha('destructive', 0.1),
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: t('finance:analytics.profit'),
        data: yearlySummary.months.map(month => month.net_income.value),
        borderColor: chartColors.primary,
        backgroundColor: chartColors.withAlpha('primary', 0.1),
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderDash: [5, 5],
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
          label: (context: TooltipItem<'line'>) => {
            return `${context.dataset.label}: ${formatCurrencyLocal(context.parsed.y ?? 0)}`;
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
            size: 12,
          },
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
          callback: (value: string | number) => formatCurrencyLocal(Number(value)),
        },
      },
    },
  };

  return (
    <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-foreground dark:text-foreground">
              {t('finance:analytics.yearlyTrend')}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('finance:analytics.yearlyTrendDesc', { year: yearlySummary.year })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {t('finance:analytics.operatingEfficiency')}
            </p>
            <p
              className={`text-2xl font-bold ${
                yearlySummary.profit_margin >= 0
                  ? 'text-success'
                  : 'text-destructive'
              }`}
            >
              {yearlySummary.profit_margin.toFixed(1)}%
            </p>
            {yearlySummary.previousYear && (
              <YearOverYearIndicator
                current={yearlySummary.profit_margin}
                previous={yearlySummary.previousYear.profit_margin}
                className="mt-1"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <Line data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
};
