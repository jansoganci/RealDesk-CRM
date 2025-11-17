import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Line, Pie } from 'react-chartjs-2';
import { useAuth } from '../../../contexts/AuthContext';
import type { FinancialDashboard } from '../../../types/financial';

interface FinancialChartsProps {
  dashboard: FinancialDashboard | null;
  loading?: boolean;
}

export const FinancialCharts = ({
  dashboard,
  loading = false,
}: FinancialChartsProps) => {
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
    return date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
  };

  // Prepare data for line chart
  const trendsData =
    dashboard?.monthly_trends.map(trend => ({
      month: formatMonth(trend.month),
      [t('finance:charts.income')]: trend.income,
      [t('finance:charts.expense')]: trend.expense,
      [t('finance:charts.net')]: trend.net,
    })) || [];

  // Prepare data for pie chart - top 5 expense categories
  const expenseData =
    dashboard?.expense_by_category.slice(0, 5).map(cat => ({
      name: cat.category,
      value: cat.total_amount,
    })) || [];

  // Colors for charts
  const COLORS = ['#ef4444', '#f97316', '#ec4899', '#3b82f6', '#8b5cf6'];

  // Line chart data
  const lineChartData = {
    labels: trendsData.map(d => d.month),
    datasets: [
      {
        label: t('finance:charts.income'),
        data: trendsData.map(d => d[t('finance:charts.income')]),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: t('finance:charts.expense'),
        data: trendsData.map(d => d[t('finance:charts.expense')]),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: t('finance:charts.net'),
        data: trendsData.map(d => d[t('finance:charts.net')]),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderDash: [5, 5],
      },
    ],
  };

  const lineChartOptions = {
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

  // Pie chart data
  const pieChartData = {
    labels: expenseData.map(d => d.name),
    datasets: [
      {
        data: expenseData.map(d => d.value),
        backgroundColor: COLORS,
        borderWidth: 0,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(0);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-gray-100">
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gray-100 rounded animate-pulse" />
          </CardContent>
        </Card>
        <Card className="shadow-lg border-gray-100">
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gray-100 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Line Chart - Income vs Expenses */}
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">
            {t('finance:charts.incomeVsExpenses')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart - Expense Breakdown */}
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">
            {t('finance:charts.expenseBreakdown')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenseData.length > 0 ? (
            <div className="h-80">
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              {t('finance:charts.noExpenseData')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
