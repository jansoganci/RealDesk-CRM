import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { financialTransactionsService, commissionsService } from '../../../lib/serviceProxy';
import { calculatePerformanceSummary, NormalizedPerformanceSummary } from '../../../services/finance/reportCalculator';
import { NormalizedFinancialDashboard, NormalizedYearlySummary, getTransactionVolumeNormalized, getCommissionByPropertyType, CommissionByPropertyType, getAverageDaysToClose, AverageDaysToClose, getCommissionByClientType, CommissionByClientType, getMarketingROI, MarketingROI, getConversionFunnelMetrics, ConversionFunnelMetrics } from '../../../services/finance/analytics.service';
import type {
  FinancialTransaction,
  TransactionFilters,
  ExpenseCategory,
  FinancialRatios,
} from '../../../types/financial';
import type { MonthlyCommissionData } from '../../../types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Finance');

const DEFAULT_PAGE_SIZE = 25;

/** V1: USD-only — no client FX; ignore user currency preference for finance aggregates. */
const V1_DISPLAY_CURRENCY = 'USD';

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const useFinanceData = (filters: TransactionFilters) => {
  const { t } = useTranslation(['finance']);

  // Core data state
  const [dashboard, setDashboard] = useState<NormalizedFinancialDashboard | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  // Analytics state
  const [ratios, setRatios] = useState<FinancialRatios | null>(null);
  const [yearlySummary, setYearlySummary] = useState<NormalizedYearlySummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Performance summary state
  const [performanceSummary, setPerformanceSummary] = useState<NormalizedPerformanceSummary | null>(null);
  const [monthlyCommissions, setMonthlyCommissions] = useState<MonthlyCommissionData[]>([]);
  const [commissionByPropertyType, setCommissionByPropertyType] = useState<CommissionByPropertyType | null>(null);
  const [averageDaysToClose, setAverageDaysToClose] = useState<AverageDaysToClose | null>(null);
  const [commissionByClientType, setCommissionByClientType] = useState<CommissionByClientType | null>(null);
  const [marketingROI, setMarketingROI] = useState<MarketingROI | null>(null);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnelMetrics | null>(null);

  // Load core data (dashboard, categories, transactions, performance)
  const loadData = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const paginatedFilters = { ...filters, page, pageSize: DEFAULT_PAGE_SIZE };

      const [dashboardData, categoriesData, paginatedResult, rawCommissions] = await Promise.all([
        financialTransactionsService.getFinancialDashboardNormalized(V1_DISPLAY_CURRENCY),
        financialTransactionsService.getCategories(),
        financialTransactionsService.getTransactionsPaginated(paginatedFilters),
        commissionsService.getByDateRange(startDate, endDate),
      ]);

      const previousYear = currentYear - 1;
      const previousYearStartDate = `${previousYear}-01-01`;
      const previousYearEndDate = `${previousYear}-12-31`;

      const [normalizedPerformance, transactionVolume, previousYearCommissions, previousYearTransactionVolume] = await Promise.all([
        calculatePerformanceSummary(
          rawCommissions,
          currentYear,
          V1_DISPLAY_CURRENCY
        ),
        getTransactionVolumeNormalized(
          currentYear,
          V1_DISPLAY_CURRENCY
        ),
        commissionsService.getByDateRange(previousYearStartDate, previousYearEndDate),
        getTransactionVolumeNormalized(
          previousYear,
          V1_DISPLAY_CURRENCY
        )
      ]);

      // Calculate previous year performance for comparison
      const previousYearPerformance = await calculatePerformanceSummary(
        previousYearCommissions,
        previousYear,
        V1_DISPLAY_CURRENCY
      );

      const previousYearWithVolume = {
        ...previousYearPerformance,
        transactionVolume: previousYearTransactionVolume
      };

      const performanceWithVolume = {
        ...normalizedPerformance,
        transactionVolume,
        previousYear: previousYearWithVolume
      };

      setDashboard(dashboardData);
      setCategories(categoriesData);
      setTransactions(paginatedResult.data);
      setPagination({
        page: paginatedResult.page,
        pageSize: paginatedResult.pageSize,
        total: paginatedResult.total,
        totalPages: paginatedResult.totalPages,
      });
      setPerformanceSummary(performanceWithVolume);
    } catch (error) {
      logger.error('Error loading finance data:', error);
      toast.error(t('finance:messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  // Load transactions only (paginated)
  const loadTransactions = useCallback(async (page: number = pagination.page) => {
    try {
      const paginatedFilters = { ...filters, page, pageSize: DEFAULT_PAGE_SIZE };
      const paginatedResult = await financialTransactionsService.getTransactionsPaginated(paginatedFilters);
      setTransactions(paginatedResult.data);
      setPagination({
        page: paginatedResult.page,
        pageSize: paginatedResult.pageSize,
        total: paginatedResult.total,
        totalPages: paginatedResult.totalPages,
      });
    } catch (error) {
      logger.error('Error loading transactions:', error);
      toast.error(t('finance:messages.loadError'));
    }
  }, [filters, pagination.page, t]);

  // Change page
  const setPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadTransactions(newPage);
    }
  }, [loadTransactions, pagination.totalPages]);

  // Load analytics data (lazy - only when needed)
  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentYear = new Date().getFullYear();

      const previousYear = currentYear - 1;

      const [ratiosData, yearlyData, previousYearData, commissionsData, commissionByPropertyTypeData, averageDaysToCloseData, commissionByClientTypeData, marketingROIData, conversionFunnelData] = await Promise.all([
        financialTransactionsService.getFinancialRatiosNormalized(V1_DISPLAY_CURRENCY, currentMonth),
        financialTransactionsService.getYearlySummaryNormalized(currentYear, V1_DISPLAY_CURRENCY),
        financialTransactionsService.getYearlySummaryNormalized(previousYear, V1_DISPLAY_CURRENCY),
        commissionsService.getMonthlyCommissionData(currentYear),
        getCommissionByPropertyType(currentYear, V1_DISPLAY_CURRENCY),
        getAverageDaysToClose(currentYear),
        getCommissionByClientType(currentYear, V1_DISPLAY_CURRENCY),
        getMarketingROI(currentYear, V1_DISPLAY_CURRENCY),
        getConversionFunnelMetrics(currentYear),
      ]);

      // Merge previous year data into current year summary
      const yearlyDataWithComparison = {
        ...yearlyData,
        previousYear: previousYearData
      };

      setRatios(ratiosData);
      setYearlySummary(yearlyDataWithComparison);
      setMonthlyCommissions(commissionsData);
      setCommissionByPropertyType(commissionByPropertyTypeData);
      setAverageDaysToClose(averageDaysToCloseData);
      setCommissionByClientType(commissionByClientTypeData);
      setMarketingROI(marketingROIData);
      setConversionFunnel(conversionFunnelData);
    } catch (error) {
      logger.error('Error loading analytics:', error);
      toast.error(t('finance:messages.loadError'));
    } finally {
      setAnalyticsLoading(false);
    }
  }, [t]);

  // Refresh dashboard only
  const refreshDashboard = useCallback(async () => {
    try {
      const dashboardData = await financialTransactionsService.getFinancialDashboardNormalized(V1_DISPLAY_CURRENCY);
      setDashboard(dashboardData);
    } catch (error) {
      logger.error('Error refreshing dashboard:', error);
    }
  }, []);

  return useMemo(() => ({
    // Data
    dashboard,
    transactions,
    categories,
    ratios,
    yearlySummary,
    performanceSummary,
    monthlyCommissions,
    commissionByPropertyType,
    averageDaysToClose,
    commissionByClientType,
    marketingROI,
    conversionFunnel,

    // Pagination
    pagination,

    // Loading states
    loading,
    analyticsLoading,

    // Actions
    loadData,
    loadTransactions,
    loadAnalytics,
    refreshDashboard,
    setTransactions,
    setDashboard,
    setPage,
  }), [
    dashboard,
    transactions,
    categories,
    ratios,
    yearlySummary,
    performanceSummary,
    monthlyCommissions,
    commissionByPropertyType,
    averageDaysToClose,
    commissionByClientType,
    marketingROI,
    conversionFunnel,
    pagination,
    loading,
    analyticsLoading,
    loadData,
    loadTransactions,
    loadAnalytics,
    refreshDashboard,
    setPage,
  ]);
};
