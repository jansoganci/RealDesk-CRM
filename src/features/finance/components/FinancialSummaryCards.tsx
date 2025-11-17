import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PiggyBank,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import type { FinancialDashboard } from '../../../types/financial';

interface FinancialSummaryCardsProps {
  dashboard: FinancialDashboard | null;
  loading?: boolean;
}

export const FinancialSummaryCards = ({
  dashboard,
  loading = false,
}: FinancialSummaryCardsProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { currency } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const currentMonth = dashboard?.current_month;
  const previousMonth = dashboard?.previous_month;

  const incomeChange = currentMonth && previousMonth
    ? calculateChange(currentMonth.total_income, previousMonth.total_income)
    : 0;

  const expenseChange = currentMonth && previousMonth
    ? calculateChange(currentMonth.total_expense, previousMonth.total_expense)
    : 0;

  const netChange = currentMonth && previousMonth
    ? calculateChange(currentMonth.net_income, previousMonth.net_income)
    : 0;

  const pendingTransactions = 0; // TODO: Calculate from transactions

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
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
      value: currentMonth ? formatCurrency(currentMonth.total_income) : formatCurrency(0),
      change: incomeChange,
      icon: TrendingUp,
      iconBg: 'bg-emerald-600',
      iconColor: 'text-white',
    },
    {
      title: t('finance:cards.totalExpenses'),
      value: currentMonth ? formatCurrency(currentMonth.total_expense) : formatCurrency(0),
      change: expenseChange,
      icon: TrendingDown,
      iconBg: 'bg-red-600',
      iconColor: 'text-white',
    },
    {
      title: t('finance:cards.netProfit'),
      value: currentMonth ? formatCurrency(currentMonth.net_income) : formatCurrency(0),
      change: netChange,
      icon: currentMonth && currentMonth.net_income >= 0 ? PiggyBank : DollarSign,
      iconBg: currentMonth && currentMonth.net_income >= 0
        ? 'bg-blue-600'
        : 'bg-amber-600',
      iconColor: 'text-white',
    },
    {
      title: t('finance:cards.pending'),
      value: pendingTransactions.toString(),
      change: null,
      icon: Clock,
      iconBg: 'bg-gray-600',
      iconColor: 'text-white',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card
          key={index}
          className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
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
            <div className="text-2xl font-bold text-slate-900">{card.value}</div>
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
                  <span className="text-gray-500 font-medium">
                    {t('finance:cards.noChange')}
                  </span>
                )}
                <span className="text-gray-500 ml-1">
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
