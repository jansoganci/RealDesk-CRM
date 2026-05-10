import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../../../contexts/AuthContext';
import { NormalizedYearlySummary } from '../../../services/finance/analytics.service';
import { formatCurrency } from '../../../lib/currency';
import { YearOverYearIndicator } from './YearOverYearIndicator';
import { COLORS } from '@/config/colors';

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

  const formatCurrencyLocal = (value: number) => {
    return formatCurrency(value, userCurrency || 'USD');
  };

  const formatMonth = (month: string) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('tr-TR', { month: 'short' });
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
        borderColor: COLORS.success.hex,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: t('finance:analytics.expenses'),
        data: yearlySummary.months.map(month => month.total_expense.value),
        borderColor: COLORS.danger.hex,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: t('finance:analytics.profit'),
        data: yearlySummary.months.map(month => month.net_income.value),
        borderColor: COLORS.primary.hex,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
          label: (context: any) => {
            return `${context.dataset.label}: ${formatCurrencyLocal(context.parsed.y)}`;
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
            size: 12,
          },
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
          callback: (value: any) => formatCurrencyLocal(value),
        },
      },
    },
  };

  return (
    <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t('finance:analytics.yearlyTrend')}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
              {t('finance:analytics.yearlyTrendDesc', { year: yearlySummary.year })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t('finance:analytics.operatingEfficiency')}
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
