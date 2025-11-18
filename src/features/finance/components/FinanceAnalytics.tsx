import { FinancialRatiosComponent } from './FinancialRatios';
import { FinancialTrends } from './FinancialTrends';
import { UpcomingBills } from './UpcomingBills';
import type {
  FinancialRatios,
  YearlySummary,
} from '../../../types/financial';

interface FinanceAnalyticsProps {
  ratios: FinancialRatios | null;
  yearlySummary: YearlySummary | null;
  loading: boolean;
  onBillPaid: () => Promise<void>;
}

export const FinanceAnalytics = ({
  ratios,
  yearlySummary,
  loading,
  onBillPaid,
}: FinanceAnalyticsProps) => {
  return (
    <div className="space-y-6">
      {/* Financial Ratios KPIs */}
      <FinancialRatiosComponent ratios={ratios} loading={loading} />

      {/* Yearly Trends */}
      <FinancialTrends yearlySummary={yearlySummary} loading={loading} />

      {/* Upcoming Bills */}
      <UpcomingBills daysAhead={30} onBillPaid={onBillPaid} />
    </div>
  );
};

