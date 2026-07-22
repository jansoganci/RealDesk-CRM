/**
 * Team Performance Types
 * Types for team performance dashboard data structures
 */

export interface TeamMemberPerformance {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  /** Gross commission (unchanged meaning) — kept for backward compatibility. */
  commission: number;
  deals: number;
  activeContracts: number;
  status: 'active' | 'pending' | 'suspended';
  grossCommission: number;
  /** Agent's net take-home after broker/franchise split ("hakediş"). */
  netCommission: number;
  /** Brokerage's/company's cut (broker_dollar + franchise_fee_amount). */
  companyDollar: number;
}

export interface TeamPerformanceSummary {
  /** Gross commission (unchanged meaning) — kept for backward compatibility. */
  totalCommission: number;
  totalDeals: number;
  activeContracts: number;
  totalGrossCommission: number;
  totalNetCommission: number;
  totalCompanyDollar: number;
  trend: {
    commission: number;
  };
}

export interface TeamPerformancePeriod {
  start: string;
  end: string;
  label: string;
}

export interface TeamPerformanceData {
  summary: TeamPerformanceSummary;
  members: TeamMemberPerformance[];
  period: TeamPerformancePeriod;
}

export type PeriodFilter = 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear';
