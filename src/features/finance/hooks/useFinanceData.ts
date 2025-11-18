import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { financialTransactionsService, commissionsService } from '../../../lib/serviceProxy';
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

      const [dashboardData, categoriesData, transactionsData, performanceData] = await Promise.all([
        financialTransactionsService.getFinancialDashboard(),
        financialTransactionsService.getCategories(),
        financialTransactionsService.getTransactions(filters),
        commissionsService.getPerformanceSummary(currentYear, 'TRY'),
      ]);

      setDashboard(dashboardData);
      setCategories(categoriesData);
      setTransactions(transactionsData);
      setPerformanceSummary(performanceData);
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
        commissionsService.getMonthlyCommissionData(currentYear, 'TRY'),
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

