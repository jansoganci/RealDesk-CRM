import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../../../contexts/AuthContext';
import { AnimatedTabs } from '../../../components/ui/animated-tabs';
import { TrendingUp, TrendingDown } from 'lucide-react';
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
  const [breakdownTab, setBreakdownTab] = useState<'income' | 'expense'>('expense');

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
  const trendsData = dashboard?.monthly_trends || [];

  // Debug: Log to check data
  console.log('📊 FinancialCharts - trendsData:', trendsData);
  console.log('📊 FinancialCharts - trendsData months:', trendsData.map(t => t.month));
  console.log('📊 FinancialCharts - dashboard:', dashboard);

  // Prepare data for pie charts - top 5 categories
  const incomeData =
    dashboard?.income_by_category?.slice(0, 5).map(cat => ({
      name: cat.category,
      value: cat.total_amount,
    })) || [];

  const expenseData =
    dashboard?.expense_by_category?.slice(0, 5).map(cat => ({
      name: cat.category,
      value: cat.total_amount,
    })) || [];

  // Colors for progress bars
  const INCOME_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];
  const EXPENSE_COLORS = ['#ef4444', '#f97316', '#ec4899', '#3b82f6', '#8b5cf6'];

  // Get active data based on tab
  const activeData = breakdownTab === 'income' ? incomeData : expenseData;
  const activeColors = breakdownTab === 'income' ? INCOME_COLORS : EXPENSE_COLORS;

  // Calculate total for percentage
  const activeTotal = activeData.reduce((sum, item) => sum + item.value, 0);

  // Line chart data - ensure valid data structure
  const lineChartData = trendsData.length > 0 ? {
    labels: trendsData.map(trend => {
      try {
        return formatMonth(trend.month);
      } catch (e) {
        console.error('Error formatting month:', trend.month, e);
        return trend.month;
      }
    }),
    datasets: [
      {
        label: t('finance:charts.income'),
        data: trendsData.map(trend => trend.income ?? 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: t('finance:charts.expense'),
        data: trendsData.map(trend => trend.expense ?? 0),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: t('finance:charts.net'),
        data: trendsData.map(trend => trend.net ?? 0),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderDash: [5, 5],
      },
    ],
  } : null;

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
          {lineChartData && trendsData.length > 0 ? (
            <div className="h-80">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              {dashboard ? 
                t('finance:charts.noTrendData', { defaultValue: 'Bu dönem için trend verisi bulunmamaktadır' }) :
                'Yükleniyor...'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown with Progress Bars */}
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900 mb-4">
            {t('finance:charts.expenseBreakdown')}
          </CardTitle>
          <AnimatedTabs
            tabs={[
              {
                id: 'income',
                label: t('finance:charts.income'),
                icon: <TrendingUp className="h-4 w-4" />,
              },
              {
                id: 'expense',
                label: t('finance:charts.expense'),
                icon: <TrendingDown className="h-4 w-4" />,
              },
            ]}
            defaultTab={breakdownTab}
            onChange={(tabId) => setBreakdownTab(tabId as 'income' | 'expense')}
          />
        </CardHeader>
        <CardContent>
          {activeData.length > 0 ? (
            <div className="space-y-4">
              {/* Total amount header */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">
                  {t('finance:charts.total')}
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(activeTotal)}
                </span>
              </div>

              {/* Category list with progress bars */}
              <div className="space-y-3">
                {activeData.map((item, index) => {
                  const percentage = activeTotal > 0 ? (item.value / activeTotal) * 100 : 0;
                  const color = activeColors[index % activeColors.length];

                  return (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCurrency(item.value)}
                          </span>
                          <span className="text-xs text-gray-500 w-12 text-right">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              {breakdownTab === 'income'
                ? t('finance:charts.noIncomeData', { defaultValue: 'Bu dönem için gelir verisi bulunmamaktadır' })
                : t('finance:charts.noExpenseData')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
