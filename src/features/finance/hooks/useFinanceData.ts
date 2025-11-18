import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { financialTransactionsService } from '../../../lib/serviceProxy';
import type {
  FinancialDashboard,
  FinancialTransaction,
  TransactionFilters,
  ExpenseCategory,
  FinancialRatios,
  YearlySummary,
} from '../../../types/financial';

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

  // Load core data (dashboard, categories, transactions)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardData, categoriesData, transactionsData] = await Promise.all([
        financialTransactionsService.getFinancialDashboard(),
        financialTransactionsService.getCategories(),
        financialTransactionsService.getTransactions(filters),
      ]);

      setDashboard(dashboardData);
      setCategories(categoriesData);
      setTransactions(transactionsData);
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

      const [ratiosData, yearlyData] = await Promise.all([
        financialTransactionsService.getFinancialRatios(currentMonth),
        financialTransactionsService.getYearlySummary(currentYear),
      ]);

      setRatios(ratiosData);
      setYearlySummary(yearlyData);
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

