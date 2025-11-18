import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { useAuth } from '../../../contexts/AuthContext';
import { AnimatedTabs } from '../../../components/ui/animated-tabs';
import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';
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

  // Prepare data for category breakdown - top 5 categories
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

  if (loading) {
    return (
      <Card className="shadow-lg border-gray-100">
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-sm font-medium text-gray-600">
            {t('finance:charts.expenseBreakdown')}
          </CardTitle>
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
            <PieChart className="h-4 w-4 text-white" />
          </div>
        </div>
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
  );
};
