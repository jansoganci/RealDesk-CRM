import { FinancialRatiosComponent } from './FinancialRatios';
import { FinancialTrends } from './FinancialTrends';
import { UpcomingBills } from './UpcomingBills';
import { CommissionTrends } from './CommissionTrends';
import { CommissionByPropertyTypeComponent } from './CommissionByPropertyType';
import { AverageDaysToCloseComponent } from './AverageDaysToClose';
import { CommissionByClientTypeComponent } from './CommissionByClientType';
import { ConversionFunnelComponent } from './ConversionFunnel';
import type {
  FinancialRatios,
} from '../../../types/financial';
import type { MonthlyCommissionData } from '../../../types';
import type { NormalizedYearlySummary, CommissionByPropertyType, AverageDaysToClose, CommissionByClientType, MarketingROI, ConversionFunnelMetrics } from '../../../services/finance/analytics.service';

interface FinanceAnalyticsProps {
  ratios: FinancialRatios | null;
  yearlySummary: NormalizedYearlySummary | null;
  monthlyCommissions: MonthlyCommissionData[];
  commissionByPropertyType: CommissionByPropertyType | null;
  averageDaysToClose: AverageDaysToClose | null;
  commissionByClientType: CommissionByClientType | null;
  marketingROI: MarketingROI | null;
  conversionFunnel: ConversionFunnelMetrics | null;
  loading: boolean;
  onBillPaid: () => Promise<void>;
}

export const FinanceAnalytics = ({
  ratios,
  yearlySummary,
  monthlyCommissions,
  commissionByPropertyType,
  averageDaysToClose,
  commissionByClientType,
  conversionFunnel,
  loading,
  onBillPaid,
}: FinanceAnalyticsProps) => {
  return (
    <div className="space-y-6">
      {/* Financial Ratios KPIs */}
      <FinancialRatiosComponent ratios={ratios} loading={loading} />

      {/* Commission Trends */}
      <CommissionTrends data={monthlyCommissions} loading={loading} />

      {/* Commission by Property Type */}
      <CommissionByPropertyTypeComponent data={commissionByPropertyType} loading={loading} />

      {/* Commission by Client Type */}
      <CommissionByClientTypeComponent data={commissionByClientType} loading={loading} />

      {/* Average Days to Close */}
      <AverageDaysToCloseComponent data={averageDaysToClose} loading={loading} />

      {/* Conversion Funnel */}
      <ConversionFunnelComponent data={conversionFunnel} loading={loading} />

      {/* Yearly Trends */}
      <FinancialTrends yearlySummary={yearlySummary} loading={loading} />

      {/* Upcoming Bills */}
      <UpcomingBills daysAhead={30} onBillPaid={onBillPaid} />
    </div>
  );
};

