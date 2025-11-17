import { FinancialRatiosComponent } from './FinancialRatios';
import { FinancialTrends } from './FinancialTrends';
import { BudgetComparison } from './BudgetComparison';
import { TopCategories } from './TopCategories';
import { UpcomingBills } from './UpcomingBills';
import type {
  FinancialRatios,
  YearlySummary,
  BudgetVsActual,
  TopCategory,
} from '../../../types/financial';
import { useTranslation } from 'react-i18next';

interface FinanceAnalyticsProps {
  ratios: FinancialRatios | null;
  yearlySummary: YearlySummary | null;
  budgetComparison: BudgetVsActual[];
  topIncome: TopCategory[];
  topExpense: TopCategory[];
  loading: boolean;
  onBillPaid: () => Promise<void>;
}

export const FinanceAnalytics = ({
  ratios,
  yearlySummary,
  budgetComparison,
  topIncome,
  topExpense,
  loading,
  onBillPaid,
}: FinanceAnalyticsProps) => {
  const { t } = useTranslation(['finance']);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {t('finance:sections.analytics')}
          </h2>
          <p className="text-gray-600 mt-1">
            {t('finance:sections.analyticsDescription')}
          </p>
        </div>
      </div>

      {/* Financial Ratios KPIs */}
      <FinancialRatiosComponent ratios={ratios} loading={loading} />

      {/* Yearly Trends */}
      <FinancialTrends yearlySummary={yearlySummary} loading={loading} />

      {/* Budget Comparison & Top Categories */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BudgetComparison budgetComparison={budgetComparison} loading={loading} />
        <TopCategories
          topIncome={topIncome}
          topExpense={topExpense}
          loading={loading}
        />
      </div>

      {/* Upcoming Bills */}
      <UpcomingBills daysAhead={30} onBillPaid={onBillPaid} />
    </div>
  );
};

