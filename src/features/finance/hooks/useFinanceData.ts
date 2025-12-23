import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { financialTransactionsService, commissionsService } from '../../../lib/serviceProxy';
import { fetchAndStoreDailyRates, hasRatesForDate, getRatesForBatchFromTry } from '../../../services/finance/exchangeRates.service';
import { calculatePerformanceSummary, NormalizedPerformanceSummary } from '../../../services/finance/reportCalculator';
import { useAuth } from '../../../contexts/AuthContext';
import { NormalizedFinancialDashboard, NormalizedYearlySummary } from '../../../services/finance/analytics.service';
import type {
  FinancialTransaction,
  TransactionFilters,
  ExpenseCategory,
  FinancialRatios,
} from '../../../types/financial';
import type { MonthlyCommissionData } from '../../../types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Finance');

export const useFinanceData = (filters: TransactionFilters) => {
  const { t } = useTranslation(['finance']);
  const { currency: displayCurrency } = useAuth();

  // Core data state
  const [dashboard, setDashboard] = useState<NormalizedFinancialDashboard | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Analytics state
  const [ratios, setRatios] = useState<FinancialRatios | null>(null);
  const [yearlySummary, setYearlySummary] = useState<NormalizedYearlySummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Performance summary state
  const [performanceSummary, setPerformanceSummary] = useState<NormalizedPerformanceSummary | null>(null);
  const [monthlyCommissions, setMonthlyCommissions] = useState<MonthlyCommissionData[]>([]);

  // Load core data (dashboard, categories, transactions, performance)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      // Check if today's rates exist before fetching (optimization)
      const today = new Date();
      try {
        const hasRates = await hasRatesForDate(today);
        if (!hasRates) {
          fetchAndStoreDailyRates(today).catch(error => {
            logger.error("Failed to fetch today's exchange rates:", error);
          });
        }
      } catch (error) {
        logger.warn('Error checking rates, attempting fetch:', error);
        fetchAndStoreDailyRates(today).catch(() => {});
      }

      const [dashboardData, categoriesData, transactionsData, rawCommissions] = await Promise.all([
        financialTransactionsService.getFinancialDashboardNormalized(displayCurrency || 'TRY'),
        financialTransactionsService.getCategories(),
        financialTransactionsService.getTransactions(filters, 'id, amount, currency, transaction_date, category, type, payment_status, description, payment_method'),
        commissionsService.getByDateRange(startDate, endDate),
      ]);

      const normalizedPerformance = await calculatePerformanceSummary(
        rawCommissions,
        currentYear,
        displayCurrency || 'TRY'
      );

      setDashboard(dashboardData);
      setCategories(categoriesData);
      setTransactions(transactionsData);
      setPerformanceSummary(normalizedPerformance);

      // PROACTIVE RATE HYDRATION: Pre-fetch rates for the transactions table
      if (transactionsData.length > 0) {
        const rateRequests = transactionsData
          .filter(t => t.currency !== 'TRY' || displayCurrency !== 'TRY')
          .map(t => [
            { currency: t.currency, date: t.transaction_date },
            { currency: displayCurrency || 'TRY', date: t.transaction_date }
          ])
          .flat();
        
        if (rateRequests.length > 0) {
          getRatesForBatchFromTry(rateRequests).catch(err => {
            logger.warn('Failed to pre-fetch table rates:', err);
          });
        }
      }
    } catch (error) {
      logger.error('Error loading finance data:', error);
      toast.error(t('finance:messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [filters, t, displayCurrency]);

  // Load transactions only
  const loadTransactions = useCallback(async () => {
    try {
      const data = await financialTransactionsService.getTransactions(filters);
      setTransactions(data);
    } catch (error) {
      logger.error('Error loading transactions:', error);
      toast.error(t('finance:messages.loadError'));
    }
  }, [filters, t]);

  // Load analytics data (lazy - only when needed)
  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentYear = new Date().getFullYear();

      const [ratiosData, yearlyData, commissionsData] = await Promise.all([
        financialTransactionsService.getFinancialRatiosNormalized(displayCurrency || 'TRY', currentMonth),
        financialTransactionsService.getYearlySummaryNormalized(currentYear, displayCurrency || 'TRY'),
        commissionsService.getMonthlyCommissionData(currentYear),
      ]);

      setRatios(ratiosData);
      setYearlySummary(yearlyData);
      setMonthlyCommissions(commissionsData);
    } catch (error) {
      logger.error('Error loading analytics:', error);
      toast.error(t('finance:messages.loadError'));
    } finally {
      setAnalyticsLoading(false);
    }
  }, [t, displayCurrency]);

  // Refresh dashboard only
  const refreshDashboard = useCallback(async () => {
    try {
      const dashboardData = await financialTransactionsService.getFinancialDashboardNormalized(displayCurrency || 'TRY');
      setDashboard(dashboardData);
    } catch (error) {
      logger.error('Error refreshing dashboard:', error);
    }
  }, [displayCurrency]);

  return useMemo(() => ({
    // Data
    dashboard,
    transactions,
    categories,
    ratios,
    yearlySummary,
    performanceSummary,
    monthlyCommissions,

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
  }), [
    dashboard,
    transactions,
    categories,
    ratios,
    yearlySummary,
    performanceSummary,
    monthlyCommissions,
    loading,
    analyticsLoading,
    loadData,
    loadTransactions,
    loadAnalytics,
    refreshDashboard,
  ]);
};

