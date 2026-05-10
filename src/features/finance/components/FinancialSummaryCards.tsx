import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { formatCurrency } from '../../../lib/currency';
import { NormalizedFinancialDashboard } from '../../../services/finance/analytics.service';
import { CalculatedMetric } from '../../../services/finance/reportCalculator';

interface FinancialSummaryCardsProps {
  dashboard: NormalizedFinancialDashboard | null;
  loading?: boolean;
}

export const FinancialSummaryCards = ({
  dashboard,
  loading = false,
}: FinancialSummaryCardsProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { currency: displayCurrency } = useAuth();

  const formatMetric = (metric: CalculatedMetric) => {
    const normalizedCurrency = displayCurrency?.toUpperCase().trim() || 'USD';
    const formatted = formatCurrency(metric.value, normalizedCurrency);

    if (metric.isComplete) {
      return <span>{formatted}</span>;
    }

    return (
      <div className="flex items-center gap-1">
        <span>{formatted}</span>
        <div title={`${t('finance:performance.missingRates')}: ${metric.missingDates.join(', ')}`}>
          <AlertCircle className="h-4 w-4 text-amber-500 inline cursor-help" />
        </div>
      </div>
    );
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const currentMonth = dashboard?.current_month;
  const previousMonth = dashboard?.previous_month;

  const incomeChange = currentMonth && previousMonth
    ? calculateChange(currentMonth.total_income.value, previousMonth.total_income.value)
    : 0;

  const expenseChange = currentMonth && previousMonth
    ? calculateChange(currentMonth.total_expense.value, previousMonth.total_expense.value)
    : 0;

  const netChange = currentMonth && previousMonth
    ? calculateChange(currentMonth.net_income.value, previousMonth.net_income.value)
    : 0;

  const pendingTransactions = dashboard?.pending_transactions_count ?? 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: t('finance:cards.totalIncome'),
      metric: currentMonth?.total_income,
      change: incomeChange,
      icon: TrendingUp,
      iconBg: 'bg-emerald-600',
      iconColor: 'text-white',
    },
    {
      title: t('finance:cards.totalExpenses'),
      metric: currentMonth?.total_expense,
      change: expenseChange,
      icon: TrendingDown,
      iconBg: 'bg-red-600',
      iconColor: 'text-white',
    },
    {
      title: t('finance:cards.netProfit'),
      metric: currentMonth?.net_income,
      change: netChange,
      icon: currentMonth && currentMonth.net_income.value >= 0 ? PiggyBank : DollarSign,
      iconBg: currentMonth && currentMonth.net_income.value >= 0
        ? 'bg-blue-600'
        : 'bg-amber-600',
      iconColor: 'text-white',
    },
    {
      title: t('finance:cards.pending'),
      value: pendingTransactions.toString(),
      change: null,
      icon: Clock,
      iconBg: 'bg-gray-600 dark:bg-slate-600',
      iconColor: 'text-white',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card
          key={index}
          className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90 hover:shadow-xl transition-shadow"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-300">
                {card.title}
              </CardTitle>
              <div
                className={`p-2 rounded-lg ${card.iconBg} shadow-md`}
              >
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {card.metric ? formatMetric(card.metric) : card.value}
            </div>
            {card.change !== null && (
              <div className="flex items-center mt-2 text-sm">
                {card.change > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">
                      +{card.change.toFixed(1)}%
                    </span>
                  </>
                ) : card.change < 0 ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    <span className="text-red-600 font-medium">
                      {card.change.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500 dark:text-slate-400 font-medium">
                    {t('finance:cards.noChange')}
                  </span>
                )}
                <span className="text-gray-500 dark:text-slate-400 ml-1">
                  {t('finance:cards.vsLastMonth')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
