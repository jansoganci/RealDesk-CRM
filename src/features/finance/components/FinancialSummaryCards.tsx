import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Clock,
  Info,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useCurrencyConversion } from '../../../hooks/useCurrencyConversion';
import { getTransactions } from '../../../services/finance/transactions.service';
import type { FinancialDashboard } from '../../../types/financial';

interface FinancialSummaryCardsProps {
  dashboard: FinancialDashboard | null;
  loading?: boolean;
}

interface CurrencyBreakdown {
  [currency: string]: number;
}

interface ConvertedTotals {
  income: { breakdown: CurrencyBreakdown; total: number };
  expense: { breakdown: CurrencyBreakdown; total: number };
  net: { breakdown: CurrencyBreakdown; total: number };
}

export const FinancialSummaryCards = ({
  dashboard,
  loading = false,
}: FinancialSummaryCardsProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { currency: displayCurrency } = useAuth();
  const { convert } = useCurrencyConversion();
  const [convertedTotals, setConvertedTotals] = useState<ConvertedTotals | null>(null);

  // Calculate currency breakdown and converted totals
  useEffect(() => {
    const calculateConvertedTotals = async () => {
      if (!dashboard?.current_month) return;

      try {
        // Get current month transactions
        const today = new Date();
        const currentMonthStr = today.toISOString().slice(0, 7);
        const [year, month] = currentMonthStr.split('-').map(Number);
        const startDate = `${currentMonthStr}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const transactions = await getTransactions({
          start_date: startDate,
          end_date: endDate,
          payment_status: 'completed',
        });

        // Group by currency
        const incomeBreakdown: CurrencyBreakdown = {};
        const expenseBreakdown: CurrencyBreakdown = {};

        for (const transaction of transactions) {
          const normalizedCurrency = transaction.currency?.toUpperCase().trim() || 'TRY';
          if (transaction.type === 'income') {
            incomeBreakdown[normalizedCurrency] = (incomeBreakdown[normalizedCurrency] || 0) + transaction.amount;
          } else {
            expenseBreakdown[normalizedCurrency] = (expenseBreakdown[normalizedCurrency] || 0) + transaction.amount;
          }
        }

        // Convert totals
        let convertedIncomeTotal = 0;
        let convertedExpenseTotal = 0;

        for (const [currency, amount] of Object.entries(incomeBreakdown)) {
          if (currency === displayCurrency?.toUpperCase().trim()) {
            convertedIncomeTotal += amount;
          } else {
            try {
              const result = await convert(amount, currency, `${startDate}T00:00:00`);
              convertedIncomeTotal += result.convertedAmount;
            } catch (error) {
              console.warn(`Failed to convert ${currency} income:`, error);
              convertedIncomeTotal += amount; // Fallback to original
            }
          }
        }

        for (const [currency, amount] of Object.entries(expenseBreakdown)) {
          if (currency === displayCurrency?.toUpperCase().trim()) {
            convertedExpenseTotal += amount;
          } else {
            try {
              const result = await convert(amount, currency, `${startDate}T00:00:00`);
              convertedExpenseTotal += result.convertedAmount;
            } catch (error) {
              console.warn(`Failed to convert ${currency} expense:`, error);
              convertedExpenseTotal += amount; // Fallback to original
            }
          }
        }

        setConvertedTotals({
          income: { breakdown: incomeBreakdown, total: convertedIncomeTotal },
          expense: { breakdown: expenseBreakdown, total: convertedExpenseTotal },
          net: {
            breakdown: {},
            total: convertedIncomeTotal - convertedExpenseTotal,
          },
        });
      } catch (error) {
        console.error('Failed to calculate converted totals:', error);
      }
    };

    calculateConvertedTotals();
  }, [dashboard, displayCurrency, convert]);

  const formatCurrencyLocal = (amount: number, currencyCode?: string) => {
    const normalizedCurrency = currencyCode?.toUpperCase().trim() || displayCurrency || 'TRY';
    if (!normalizedCurrency || normalizedCurrency === 'MIXED') {
      return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyBreakdown = (breakdown: CurrencyBreakdown): string => {
    const parts: string[] = [];
    for (const [currency, amount] of Object.entries(breakdown)) {
      parts.push(`${currency}: ${formatCurrencyLocal(amount, currency)}`);
    }
    return parts.join(', ');
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

  const pendingTransactions = dashboard?.pending_transactions_count ?? 0;

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
      value: convertedTotals
        ? formatCurrencyLocal(convertedTotals.income.total, displayCurrency)
        : currentMonth
        ? formatCurrencyLocal(currentMonth.total_income, displayCurrency)
        : formatCurrencyLocal(0, displayCurrency),
      breakdown: convertedTotals?.income.breakdown,
      change: incomeChange,
      icon: TrendingUp,
      iconBg: 'bg-emerald-600',
      iconColor: 'text-white',
    },
    {
      title: t('finance:cards.totalExpenses'),
      value: convertedTotals
        ? formatCurrencyLocal(convertedTotals.expense.total, displayCurrency)
        : currentMonth
        ? formatCurrencyLocal(currentMonth.total_expense, displayCurrency)
        : formatCurrencyLocal(0, displayCurrency),
      breakdown: convertedTotals?.expense.breakdown,
      change: expenseChange,
      icon: TrendingDown,
      iconBg: 'bg-red-600',
      iconColor: 'text-white',
    },
    {
      title: t('finance:cards.netProfit'),
      value: convertedTotals
        ? formatCurrencyLocal(convertedTotals.net.total, displayCurrency)
        : currentMonth
        ? formatCurrencyLocal(currentMonth.net_income, displayCurrency)
        : formatCurrencyLocal(0, displayCurrency),
      breakdown: undefined,
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
      breakdown: undefined,
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
            {card.breakdown && Object.keys(card.breakdown).length > 1 && (
              <div className="mt-2 text-xs text-gray-600">
                <div className="flex items-center gap-1 mb-1">
                  <span>{t('finance:cards.byCurrency')}:</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          {t('finance:cards.rateDisclaimer')}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-gray-500">
                  {formatCurrencyBreakdown(card.breakdown)}
                </div>
              </div>
            )}
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
