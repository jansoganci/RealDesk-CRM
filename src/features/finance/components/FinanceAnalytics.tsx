import { FinancialRatiosComponent } from './FinancialRatios';
import { FinancialTrends } from './FinancialTrends';
import { UpcomingBills } from './UpcomingBills';
import { CommissionTrends } from './CommissionTrends';
import type {
  FinancialRatios,
  YearlySummary,
} from '../../../types/financial';
import type { MonthlyCommissionData } from '../../../types';

interface FinanceAnalyticsProps {
  ratios: FinancialRatios | null;
  yearlySummary: YearlySummary | null;
  monthlyCommissions: MonthlyCommissionData[];
  loading: boolean;
  onBillPaid: () => Promise<void>;
}

export const FinanceAnalytics = ({
  ratios,
  yearlySummary,
  monthlyCommissions,
  loading,
  onBillPaid,
}: FinanceAnalyticsProps) => {
  return (
    <div className="space-y-6">
      {/* Financial Ratios KPIs */}
      <FinancialRatiosComponent ratios={ratios} loading={loading} />

      {/* Commission Trends */}
      <CommissionTrends data={monthlyCommissions} loading={loading} />

      {/* Yearly Trends */}
      <FinancialTrends yearlySummary={yearlySummary} loading={loading} />

      {/* Upcoming Bills */}
      <UpcomingBills daysAhead={30} onBillPaid={onBillPaid} />
    </div>
  );
};

