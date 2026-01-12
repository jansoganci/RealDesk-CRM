import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { LayoutDashboard, Receipt, BarChart3, Repeat, Plus } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { AnimatedTabs } from '../../components/ui/animated-tabs';
import { Button } from '../../components/ui/button';
import { FinanceHeader } from './components/FinanceHeader';
import { FinanceOverview } from './components/FinanceOverview';
import { FinanceTransactions } from './components/FinanceTransactions';
import { FinanceAnalytics } from './components/FinanceAnalytics';
import { TransactionDialog } from './components/TransactionDialog';
import { RecurringExpensesList } from './components/RecurringExpensesList';
import { RecurringExpenseDialog } from './components/RecurringExpenseDialog';
import { useFinanceData } from './hooks/useFinanceData';
import { useFinanceActions } from './hooks/useFinanceActions';
import { financialTransactionsService } from '../../lib/serviceProxy';
import type {
  FinancialTransaction,
  TransactionFilters,
  RecurringExpense,
  RecurringExpenseFilters,
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
} from '../../types/financial';

type TabValue = 'overview' | 'transactions' | 'analytics' | 'recurring';

export const FinanceDashboard = () => {
  const { t } = useTranslation(['finance', 'common']);

  // Tab state - default to overview
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);
  const [recurringExpensesLoaded, setRecurringExpensesLoaded] = useState(false);

  // Filters state
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

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<FinancialTransaction | null>(null);

  // Recurring expenses state
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [recurringExpensesLoading, setRecurringExpensesLoading] = useState(false);
  const [recurringExpensesFilters, setRecurringExpensesFilters] = useState<RecurringExpenseFilters>({});

  // Recurring expense dialog state
  const [recurringExpenseDialogOpen, setRecurringExpenseDialogOpen] = useState(false);
  const [selectedRecurringExpense, setSelectedRecurringExpense] = useState<RecurringExpense | null>(null);

  // Custom hooks
  const financeData = useFinanceData(filters);
  const financeActions = useFinanceActions({
    onDataChange: async () => {
      await financeData.loadData();
      if (activeTab === 'analytics' && analyticsLoaded) {
        await financeData.loadAnalytics();
      }
    },
    transactions: financeData.transactions,
    filters,
  });

  // Load initial data
  useEffect(() => {
    financeData.loadData();
  }, [financeData.loadData]);

  // Reload transactions when filters change
  useEffect(() => {
    if (activeTab === 'transactions' || activeTab === 'overview') {
      financeData.loadTransactions();
    }
  }, [filters, activeTab]);

  // Lazy load analytics when tab is opened
  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsLoaded) {
      financeData.loadAnalytics();
      setAnalyticsLoaded(true);
    }
  }, [activeTab, analyticsLoaded]);

  // Load recurring expenses function
  const loadRecurringExpenses = useCallback(async () => {
    setRecurringExpensesLoading(true);
    try {
      const expenses = await financialTransactionsService.getRecurringExpenses(recurringExpensesFilters);
      setRecurringExpenses(expenses);
    } catch (error) {
      console.error('Error loading recurring expenses:', error);
      toast.error(t('finance:recurring.messages.loadError', { defaultValue: 'Failed to load recurring expenses' }));
    } finally {
      setRecurringExpensesLoading(false);
    }
  }, [recurringExpensesFilters, t]);

  // Load recurring expenses when tab is opened
  useEffect(() => {
    if (activeTab === 'recurring' && !recurringExpensesLoaded) {
      loadRecurringExpenses();
      setRecurringExpensesLoaded(true);
    }
  }, [activeTab, recurringExpensesLoaded, loadRecurringExpenses]);

  // Reload when filters change (if on recurring tab)
  useEffect(() => {
    if (activeTab === 'recurring' && recurringExpensesLoaded) {
      loadRecurringExpenses();
    }
  }, [recurringExpensesFilters, activeTab, recurringExpensesLoaded, loadRecurringExpenses]);

  // Auto-process due recurring expenses on page load
  useEffect(() => {
    // Silently process due recurring expenses in background
    financialTransactionsService.processDueRecurringExpenses()
      .then(count => {
        if (count > 0) {
          toast.success(
            t('finance:recurring.messages.transactionsGenerated', {
              count,
              defaultValue: `${count} recurring transaction(s) created`,
            })
          );
        }
      })
      .catch(error => {
        console.error('Error processing recurring expenses:', error);
        // Silent fail - no toast for errors
      });
  }, []); // Run once on mount

  // Handlers
  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setDialogOpen(true);
  };

  const handleEditTransaction = (transaction: FinancialTransaction) => {
    setSelectedTransaction(transaction);
    setDialogOpen(true);
  };

  const handleSaveTransaction = async (
    data: any,
    selected: FinancialTransaction | null
  ) => {
    await financeActions.handleSaveTransaction(data, selected);
    setDialogOpen(false);
    setSelectedTransaction(null);
  };

  // Recurring expense handlers
  const handleAddRecurringExpense = () => {
    setSelectedRecurringExpense(null);
    setRecurringExpenseDialogOpen(true);
  };

  const handleEditRecurringExpense = (expense: RecurringExpense) => {
    setSelectedRecurringExpense(expense);
    setRecurringExpenseDialogOpen(true);
  };

  const handleSaveRecurringExpense = async (
    data: CreateRecurringExpenseInput | UpdateRecurringExpenseInput,
    selected: RecurringExpense | null
  ) => {
    try {
      if (selected) {
        // Update existing
        await financialTransactionsService.updateRecurringExpense(selected.id, data as UpdateRecurringExpenseInput);
        toast.success(t('finance:recurring.messages.updated', { defaultValue: 'Recurring expense updated successfully' }));
      } else {
        // Create new
        await financialTransactionsService.createRecurringExpense(data as CreateRecurringExpenseInput);
        toast.success(t('finance:recurring.messages.created', { defaultValue: 'Recurring expense created successfully' }));
      }

      // Reload recurring expenses
      await loadRecurringExpenses();
      setRecurringExpenseDialogOpen(false);
      setSelectedRecurringExpense(null);
    } catch (error) {
      console.error('Error saving recurring expense:', error);
      toast.error(t('finance:recurring.messages.saveError', { defaultValue: 'Failed to save recurring expense' }));
    }
  };

  const handleDeleteRecurringExpense = async (id: string) => {
    try {
      await financialTransactionsService.deleteRecurringExpense(id);
      toast.success(t('finance:recurring.messages.deleted', { defaultValue: 'Recurring expense deleted successfully' }));
      // Reload recurring expenses
      await loadRecurringExpenses();
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
      toast.error(t('finance:recurring.messages.deleteError', { defaultValue: 'Failed to delete recurring expense' }));
    }
  };

  return (
    <MainLayout title={t('finance:pageTitle')}>
      <PageContainer>
        {/* Header with Tabs and Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-6">
          {/* Left: Tabs */}
          <AnimatedTabs
            tabs={[
              {
                id: 'overview',
                label: t('finance:tabs.overview'),
                icon: <LayoutDashboard className="h-3.5 w-3.5 md:h-4 md:w-4" />,
              },
              {
                id: 'transactions',
                label: t('finance:tabs.transactions'),
                icon: <Receipt className="h-3.5 w-3.5 md:h-4 md:w-4" />,
              },
              {
                id: 'analytics',
                label: t('finance:tabs.analytics'),
                icon: <BarChart3 className="h-3.5 w-3.5 md:h-4 md:w-4" />,
              },
              {
                id: 'recurring',
                label: t('finance:recurring.title', { defaultValue: 'Recurring Expenses' }),
                icon: <Repeat className="h-3.5 w-3.5 md:h-4 md:w-4" />,
              },
            ]}
            defaultTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as TabValue)}
          />

          {/* Right: Action Buttons */}
          <FinanceHeader
            onAddTransaction={handleAddTransaction}
            onExport={financeActions.handleExport}
            loading={financeData.loading}
          />
        </div>

        {/* Tab Content */}
        <div className="space-y-6">

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="mt-6">
              <FinanceOverview
                dashboard={financeData.dashboard}
                performanceSummary={financeData.performanceSummary}
                loading={financeData.loading}
              />
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="mt-6">
              <FinanceTransactions
                transactions={financeData.transactions}
                categories={financeData.categories}
                filters={filters}
                onFiltersChange={setFilters}
                onEdit={handleEditTransaction}
                onDelete={financeActions.handleDeleteTransaction}
                loading={financeData.loading}
                pagination={financeData.pagination}
                onPageChange={financeData.setPage}
              />
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="mt-6">
              <FinanceAnalytics
                ratios={financeData.ratios}
                yearlySummary={financeData.yearlySummary}
                monthlyCommissions={financeData.monthlyCommissions}
                commissionByPropertyType={financeData.commissionByPropertyType}
                averageDaysToClose={financeData.averageDaysToClose}
                commissionByClientType={financeData.commissionByClientType}
                marketingROI={financeData.marketingROI}
                conversionFunnel={financeData.conversionFunnel}
                loading={financeData.analyticsLoading}
                onBillPaid={async () => {
                  await financeData.loadData();
                  if (analyticsLoaded) {
                    await financeData.loadAnalytics();
                  }
                }}
              />
            </div>
          )}

          {/* Recurring Expenses Tab */}
          {activeTab === 'recurring' && (
            <div className="mt-6 space-y-6">
              {/* Add Button */}
              <div className="flex justify-end">
                <Button onClick={handleAddRecurringExpense}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('finance:recurring.addButton', { defaultValue: 'Add Recurring Expense' })}
                </Button>
              </div>

              {/* List Component */}
              <RecurringExpensesList
                recurringExpenses={recurringExpenses}
                categories={financeData.categories.filter(c => c.type === 'expense')}
                filters={recurringExpensesFilters}
                onFiltersChange={setRecurringExpensesFilters}
                loading={recurringExpensesLoading}
                onEdit={handleEditRecurringExpense}
                onDelete={handleDeleteRecurringExpense}
              />
            </div>
          )}
        </div>

        {/* Transaction Dialog - Always available regardless of active tab */}
        <TransactionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          transaction={selectedTransaction}
          categories={financeData.categories}
          onSave={async (data) => {
            await handleSaveTransaction(data, selectedTransaction);
          }}
          loading={financeActions.saving}
        />

        {/* Recurring Expense Dialog - Always available regardless of active tab */}
        <RecurringExpenseDialog
          open={recurringExpenseDialogOpen}
          onOpenChange={setRecurringExpenseDialogOpen}
          recurringExpense={selectedRecurringExpense}
          categories={financeData.categories.filter(c => c.type === 'expense')}
          onSave={async (data) => {
            await handleSaveRecurringExpense(data, selectedRecurringExpense);
          }}
          loading={false}
        />
      </PageContainer>
    </MainLayout>
  );
};
