import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Receipt, BarChart3 } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { AnimatedTabs } from '../../components/ui/animated-tabs';
import { FinanceHeader } from './components/FinanceHeader';
import { FinanceOverview } from './components/FinanceOverview';
import { FinanceTransactions } from './components/FinanceTransactions';
import { FinanceAnalytics } from './components/FinanceAnalytics';
import { TransactionDialog } from './components/TransactionDialog';
import { useFinanceData } from './hooks/useFinanceData';
import { useFinanceActions } from './hooks/useFinanceActions';
import type { FinancialTransaction, TransactionFilters } from '../../types/financial';

type TabValue = 'overview' | 'transactions' | 'analytics';

export const FinanceDashboard = () => {
  const { t } = useTranslation(['finance', 'common']);

  // Tab state - default to overview
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);

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
  }, []);

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
      </PageContainer>
    </MainLayout>
  );
};
