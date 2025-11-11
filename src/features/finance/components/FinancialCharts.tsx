import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
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
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
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
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={t('finance:charts.income')}
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey={t('finance:charts.expense')}
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey={t('finance:charts.net')}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
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
