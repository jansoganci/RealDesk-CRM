import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  PieChart,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import type { FinancialRatios } from '../../../types/financial';

interface FinancialRatiosProps {
  ratios: FinancialRatios | null;
  loading?: boolean;
}

export const FinancialRatiosComponent = ({
  ratios,
  loading = false,
}: FinancialRatiosProps) => {
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

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!ratios) {
    return null;
  }

  const kpis = [
    {
      title: t('finance:analytics.profitMargin'),
      value: formatPercentage(ratios.profit_margin),
      description: t('finance:analytics.profitMarginDesc'),
      icon: TrendingUp,
      iconBg:
        ratios.profit_margin >= 20
          ? 'bg-emerald-600'
          : ratios.profit_margin >= 10
          ? 'bg-blue-600'
          : 'bg-amber-600',
      trend: ratios.profit_margin >= 0 ? 'up' : 'down',
      trendColor: ratios.profit_margin >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      title: t('finance:analytics.expenseRatio'),
      value: formatPercentage(ratios.expense_ratio),
      description: t('finance:analytics.expenseRatioDesc'),
      icon: PieChart,
      iconBg:
        ratios.expense_ratio <= 50
          ? 'bg-emerald-600'
          : ratios.expense_ratio <= 70
          ? 'bg-amber-600'
          : 'bg-red-600',
      trend: ratios.expense_ratio <= 60 ? 'down' : 'up',
      trendColor: ratios.expense_ratio <= 60 ? 'text-green-600' : 'text-red-600',
    },
    {
      title: t('finance:analytics.budgetEfficiency'),
      value: formatPercentage(ratios.budget_efficiency),
      description: t('finance:analytics.budgetEfficiencyDesc'),
      icon: Target,
      iconBg:
        ratios.budget_efficiency >= 10
          ? 'bg-emerald-600'
          : ratios.budget_efficiency >= 0
          ? 'bg-blue-600'
          : 'bg-red-600',
      trend: ratios.budget_efficiency >= 0 ? 'up' : 'down',
      trendColor: ratios.budget_efficiency >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      title: t('finance:analytics.cashFlowForecast'),
      value: formatCurrency(ratios.cash_flow_forecast_30d),
      description: t('finance:analytics.cashFlowForecastDesc'),
      icon: Activity,
      iconBg:
        ratios.cash_flow_forecast_30d >= 0
          ? 'bg-emerald-600'
          : 'bg-red-600',
      trend: ratios.cash_flow_forecast_30d >= 0 ? 'up' : 'down',
      trendColor:
        ratios.cash_flow_forecast_30d >= 0 ? 'text-green-600' : 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <Card
          key={index}
          className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                {kpi.title}
              </CardTitle>
              <div
                className={`p-2.5 rounded-lg ${kpi.iconBg} shadow-md`}
              >
                <kpi.icon className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {kpi.value}
                </span>
                {kpi.trend === 'up' ? (
                  <TrendingUp className={`h-5 w-5 ${kpi.trendColor}`} />
                ) : (
                  <TrendingDown className={`h-5 w-5 ${kpi.trendColor}`} />
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {kpi.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
