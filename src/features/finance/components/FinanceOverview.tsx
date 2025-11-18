import { FinancialSummaryCards } from './FinancialSummaryCards';
import { FinancialCharts } from './FinancialCharts';
import { PerformanceSummaryComponent } from './PerformanceSummary';
import type { FinancialDashboard } from '../../../types/financial';
import type { PerformanceSummary } from '../../../types';

interface FinanceOverviewProps {
  dashboard: FinancialDashboard | null;
  performanceSummary: PerformanceSummary | null;
  loading: boolean;
}

export const FinanceOverview = ({ dashboard, performanceSummary, loading }: FinanceOverviewProps) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <FinancialSummaryCards dashboard={dashboard} loading={loading} />

      {/* Performance Summary and Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Summary Card */}
        <PerformanceSummaryComponent summary={performanceSummary} loading={loading} />

        {/* Category Breakdown */}
        <FinancialCharts dashboard={dashboard} loading={loading} />
      </div>
    </div>
  );
};

