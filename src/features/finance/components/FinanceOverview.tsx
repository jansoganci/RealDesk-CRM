import { FinancialSummaryCards } from './FinancialSummaryCards';
import { FinancialCharts } from './FinancialCharts';
import type { FinancialDashboard } from '../../../types/financial';

interface FinanceOverviewProps {
  dashboard: FinancialDashboard | null;
  loading: boolean;
}

export const FinanceOverview = ({ dashboard, loading }: FinanceOverviewProps) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <FinancialSummaryCards dashboard={dashboard} loading={loading} />

      {/* Charts */}
      <FinancialCharts dashboard={dashboard} loading={loading} />
    </div>
  );
};

