import { FinancialSummaryCards } from './FinancialSummaryCards';
import { FinancialCharts } from './FinancialCharts';
import { PerformanceSummaryComponent } from './PerformanceSummary';
import { NormalizedFinancialDashboard } from '../../../services/finance/analytics.service';
import { NormalizedPerformanceSummary } from '../../../services/finance/reportCalculator';

interface FinanceOverviewProps {
  dashboard: NormalizedFinancialDashboard | null;
  performanceSummary: NormalizedPerformanceSummary | null;
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

