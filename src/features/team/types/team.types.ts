/**
 * Team Performance Types
 * Types for team performance dashboard data structures
 */

export interface TeamMemberPerformance {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  commission: number;
  deals: number;
  activeContracts: number;
  status: 'active' | 'pending' | 'suspended';
}

export interface TeamPerformanceSummary {
  totalCommission: number;
  totalDeals: number;
  activeContracts: number;
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
