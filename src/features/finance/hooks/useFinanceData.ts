import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { financialTransactionsService, commissionsService } from '../../../lib/serviceProxy';
import { fetchAndStoreDailyRates, hasRatesForDate } from '../../../services/finance/exchangeRates.service';
import type {
  FinancialDashboard,
  FinancialTransaction,
  TransactionFilters,
  ExpenseCategory,
  FinancialRatios,
  YearlySummary,
} from '../../../types/financial';
import type { PerformanceSummary, MonthlyCommissionData } from '../../../types';

export const useFinanceData = (filters: TransactionFilters) => {
  const { t } = useTranslation(['finance']);

  // Core data state
  const [dashboard, setDashboard] = useState<FinancialDashboard | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Analytics state
  const [ratios, setRatios] = useState<FinancialRatios | null>(null);
  const [yearlySummary, setYearlySummary] = useState<YearlySummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Performance summary state
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
  const [monthlyCommissions, setMonthlyCommissions] = useState<MonthlyCommissionData[]>([]);

  // Load core data (dashboard, categories, transactions, performance)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();

      // Check if today's rates exist before fetching (optimization)
      // Only fetch if missing - avoids unnecessary API calls
      const today = new Date();
      try {
        const hasRates = await hasRatesForDate(today);
        if (!hasRates) {
          // Only fetch if missing
          fetchAndStoreDailyRates(today).catch(error => {
            console.error('[useFinanceData] Failed to fetch today\'s exchange rates:', error);
            // Don't block UI if rate fetch fails - getRateForDate will handle fallback
          });
        }
      } catch (error) {
        // If check fails, try fetching anyway (safe fallback)
        console.warn('[useFinanceData] Error checking rates, attempting fetch:', error);
        fetchAndStoreDailyRates(today).catch(fetchError => {
          console.error('[useFinanceData] Fetch also failed:', fetchError);
        });
      }

      const [dashboardData, categoriesData, transactionsData, performanceData] = await Promise.all([
        financialTransactionsService.getFinancialDashboard(),
        financialTransactionsService.getCategories(),
        financialTransactionsService.getTransactions(filters),
        commissionsService.getPerformanceSummary(currentYear),
      ]);

      setDashboard(dashboardData);
      setCategories(categoriesData);
      setTransactions(transactionsData);
      setPerformanceSummary(performanceData);

      // Fetch rates for unique transaction dates (non-blocking, after data loads)
      // This pre-populates rates for historical transactions
      if (transactionsData.length > 0) {
        const uniqueDates = new Set<string>();
        transactionsData.forEach(t => {
          const dateStr = t.transaction_date.split('T')[0];
          uniqueDates.add(dateStr);
        });

        // Fetch rates for up to 10 unique dates (to avoid too many API calls)
        // Priority: most recent dates first
        const sortedDates = Array.from(uniqueDates)
          .sort((a, b) => b.localeCompare(a))
          .slice(0, 10);

        // Fetch in background (don't block UI)
        Promise.all(
          sortedDates.map(dateStr => 
            fetchAndStoreDailyRates(new Date(dateStr)).catch(err => 
              console.warn(`Failed to fetch rates for ${dateStr}:`, err)
            )
          )
        ).catch(() => {
          // Silently fail - getRateForDate will handle missing rates
        });
      }
    } catch (error) {
      console.error('Error loading finance data:', error);
      toast.error(t('finance:messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  // Load transactions only
  const loadTransactions = useCallback(async () => {
    try {
      const data = await financialTransactionsService.getTransactions(filters);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
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
        financialTransactionsService.getFinancialRatios(currentMonth),
        financialTransactionsService.getYearlySummary(currentYear),
        commissionsService.getMonthlyCommissionData(currentYear),
      ]);

      setRatios(ratiosData);
      setYearlySummary(yearlyData);
      setMonthlyCommissions(commissionsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error(t('finance:messages.loadError'));
    } finally {
      setAnalyticsLoading(false);
    }
  }, [t]);

  // Refresh dashboard only
  const refreshDashboard = useCallback(async () => {
    try {
      const dashboardData = await financialTransactionsService.getFinancialDashboard();
      setDashboard(dashboardData);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
  }, []);

  return {
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
  };
};

