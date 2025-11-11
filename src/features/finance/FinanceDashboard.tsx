import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/button';
import { Plus, RefreshCw, Play } from 'lucide-react';
import { toast } from 'sonner';
import { financialTransactionsService } from '../../lib/serviceProxy';
import { FinancialSummaryCards } from './components/FinancialSummaryCards';
import { exportToCSV, exportToPDF, exportToExcel, downloadBlob } from './utils/exportUtils';
import type { ExportFormat } from './components/FinanceFiltersBar';
import { FinancialCharts } from './components/FinancialCharts';
import { TransactionsTable } from './components/TransactionsTable';
import { TransactionDialog } from './components/TransactionDialog';
import { FinanceFiltersBar } from './components/FinanceFiltersBar';
import { FinancialRatiosComponent } from './components/FinancialRatios';
import { FinancialTrends } from './components/FinancialTrends';
import { BudgetComparison } from './components/BudgetComparison';
import { TopCategories } from './components/TopCategories';
import { UpcomingBills } from './components/UpcomingBills';
import type {
  FinancialDashboard as DashboardData,
  FinancialTransaction,
  TransactionFilters,
  ExpenseCategory,
  CreateFinancialTransactionInput,
  UpdateFinancialTransactionInput,
  FinancialRatios,
  YearlySummary,
  BudgetVsActual,
  TopCategory,
} from '../../types/financial';

export const FinanceDashboard = () => {
  const { t } = useTranslation(['finance', 'common']);

  // State
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    return {
      start_date: `${year}-${String(month).padStart(2, '0')}-01`,
      end_date: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<FinancialTransaction | null>(null);
  const [saving, setSaving] = useState(false);

  // Analytics state
  const [ratios, setRatios] = useState<FinancialRatios | null>(null);
  const [yearlySummary, setYearlySummary] = useState<YearlySummary | null>(null);
  const [budgetComparison, setBudgetComparison] = useState<BudgetVsActual[]>([]);
  const [topIncome, setTopIncome] = useState<TopCategory[]>([]);
  const [topExpense, setTopExpense] = useState<TopCategory[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Automation state
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [lastAutomationRun, setLastAutomationRun] = useState<string | null>(null);

  // Load initial data and run automation
  useEffect(() => {
    loadData();
    runAutomation(); // Run automation on mount
  }, []);

  // Reload transactions when filters change
  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardData, categoriesData] = await Promise.all([
        financialTransactionsService.getFinancialDashboard(),
        financialTransactionsService.getCategories(),
      ]);

      setDashboard(dashboardData);
      setCategories(categoriesData);
      await loadTransactions();
      await loadAnalytics(); // Load analytics data
    } catch (error) {
      console.error('Error loading finance data:', error);
      toast.error(t('finance:messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await financialTransactionsService.getTransactions(filters);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error(t('finance:messages.loadError'));
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentYear = new Date().getFullYear();

      const [
        ratiosData,
        yearlyData,
        budgetData,
        topIncomeData,
        topExpenseData,
      ] =
        await Promise.all([
          financialTransactionsService.getFinancialRatios(currentMonth),
          financialTransactionsService.getYearlySummary(currentYear),
          financialTransactionsService.getBudgetVsActual(currentMonth),
          financialTransactionsService.getTopCategories('income', 5, currentMonth),
          financialTransactionsService.getTopCategories('expense', 5, currentMonth),
        ]);

      setRatios(ratiosData);
      setYearlySummary(yearlyData);
      setBudgetComparison(budgetData);
      setTopIncome(topIncomeData);
      setTopExpense(topExpenseData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error(t('finance:messages.loadError'));
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const runAutomation = async () => {
    // Check if automation has already run today
    const today = new Date().toISOString().split('T')[0];
    if (lastAutomationRun === today) {
      console.log('Automation already ran today, skipping...');
      return;
    }

    setRunningAutomation(true);
    try {
      const count = await financialTransactionsService.generateRecurringTransactions();
      if (count > 0) {
        console.log(`Generated ${count} recurring transactions`);
        toast.success(t('finance:automation.transactionsGenerated', { count }));
        await loadData(); // Reload dashboard data
      } else {
        console.log('No recurring transactions to generate');
      }
      setLastAutomationRun(today);
    } catch (error) {
      console.error('Error running automation:', error);
      // Don't show error toast on mount, just log
    } finally {
      setRunningAutomation(false);
    }
  };

  const handleRunAutomation = async () => {
    // Force run automation manually (bypass date check)
    setRunningAutomation(true);
    try {
      const count = await financialTransactionsService.generateRecurringTransactions();
      if (count > 0) {
        toast.success(t('finance:automation.transactionsGenerated', { count }));
        await loadData();
      } else {
        toast.info(t('finance:automation.noTransactionsToGenerate'));
      }
      setLastAutomationRun(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error running automation:', error);
      toast.error(t('finance:automation.automationError'));
    } finally {
      setRunningAutomation(false);
    }
  };

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setDialogOpen(true);
  };

  const handleEditTransaction = (transaction: FinancialTransaction) => {
    setSelectedTransaction(transaction);
    setDialogOpen(true);
  };

  const handleSaveTransaction = async (
    data: CreateFinancialTransactionInput | UpdateFinancialTransactionInput
  ) => {
    setSaving(true);
    try {
      if (selectedTransaction) {
        // Update existing
        await financialTransactionsService.updateTransaction(
          selectedTransaction.id,
          data as UpdateFinancialTransactionInput
        );
        toast.success(t('finance:messages.updateSuccess'));
      } else {
        // Create new
        await financialTransactionsService.createTransaction(
          data as CreateFinancialTransactionInput
        );
        toast.success(t('finance:messages.createSuccess'));
      }

      setDialogOpen(false);
      setSelectedTransaction(null);
      await loadData(); // Reload all data including dashboard
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error(t('finance:messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm(t('finance:messages.deleteConfirm'))) {
      return;
    }

    try {
      await financialTransactionsService.deleteTransaction(id);
      toast.success(t('finance:messages.deleteSuccess'));
      await loadData(); // Reload all data including dashboard
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error(t('finance:messages.deleteError'));
    }
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const dateRange = filters.start_date
        ? `${filters.start_date} to ${filters.end_date || 'now'}`
        : undefined;

      const companyName = 'Real Estate CRM';

      switch (format) {
        case 'csv': {
          const csv = exportToCSV(transactions, dateRange);
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          downloadBlob(blob, `transactions_${dateStr}.csv`);
          break;
        }

        case 'pdf': {
          const blob = await exportToPDF(transactions, companyName, dateRange);
          downloadBlob(blob, `transactions_${dateStr}.pdf`);
          break;
        }

        case 'excel': {
          const blob = await exportToExcel(transactions, companyName, dateRange);
          downloadBlob(blob, `transactions_${dateStr}.xlsx`);
          break;
        }
      }

      toast.success(t('finance:export.exportSuccess', { format: format.toUpperCase() }));
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      toast.error(t('finance:export.exportError'));
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  return (
    <MainLayout title={t('finance:pageTitle')}>
      <PageContainer>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {t('finance:pageTitle')}
            </h1>
            <p className="text-gray-600 mt-1">{t('finance:pageDescription')}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRunAutomation}
              disabled={runningAutomation}
              className="gap-2"
            >
              <Play className={`h-4 w-4 ${runningAutomation ? 'animate-pulse' : ''}`} />
              {t('finance:automation.runNow')}
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('common:actions.refresh')}
            </Button>
            <Button
              onClick={handleAddTransaction}
              className="gap-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-700"
            >
              <Plus className="h-4 w-4" />
              {t('finance:actions.addTransaction')}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <FinancialSummaryCards dashboard={dashboard} loading={loading} />

        {/* Charts */}
        <FinancialCharts dashboard={dashboard} loading={loading} />

        {/* Analytics Section */}
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {t('finance:sections.analytics')}
              </h2>
              <p className="text-gray-600 mt-1">
                {t('finance:sections.analyticsDescription')}
              </p>
            </div>
          </div>

          {/* Financial Ratios KPIs */}
          <FinancialRatiosComponent ratios={ratios} loading={analyticsLoading} />

          {/* Yearly Trends */}
          <FinancialTrends
            yearlySummary={yearlySummary}
            loading={analyticsLoading}
          />

          {/* Budget Comparison & Top Categories */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <BudgetComparison
              budgetComparison={budgetComparison}
              loading={analyticsLoading}
            />
            <TopCategories
              topIncome={topIncome}
              topExpense={topExpense}
              loading={analyticsLoading}
            />
          </div>
        </div>

        {/* Upcoming Bills */}
        <UpcomingBills daysAhead={30} onBillPaid={loadData} />

        {/* Filters */}
        <FinanceFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
          onExport={handleExport}
          loading={loading}
        />

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-slate-900">
              {t('finance:sections.transactions')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('finance:sections.transactionsDescription')}
            </p>
          </div>
          <div className="p-6">
            <TransactionsTable
              transactions={transactions}
              loading={loading}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          </div>
        </div>

        {/* Transaction Dialog */}
        <TransactionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          transaction={selectedTransaction}
          categories={categories}
          onSave={handleSaveTransaction}
          loading={saving}
        />
      </PageContainer>
    </MainLayout>
  );
};
