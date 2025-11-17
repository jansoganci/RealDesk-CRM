import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Line } from 'react-chartjs-2';
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
  const chartData = {
    labels: yearlySummary.months.map(month => formatMonth(month.month)),
    datasets: [
      {
        label: t('finance:analytics.revenue'),
        data: yearlySummary.months.map(month => month.total_income),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: t('finance:analytics.expenses'),
        data: yearlySummary.months.map(month => month.total_expense),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: t('finance:analytics.profit'),
        data: yearlySummary.months.map(month => month.net_income),
        borderColor: '#3b82f6',
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
          color: '#6b7280',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: '#e5e7eb',
          borderDash: [3, 3],
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
          callback: (value: any) => formatCurrency(value),
        },
      },
    },
  };

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
        <div className="h-96">
          <Line data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
};
