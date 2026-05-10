import { FinanceFiltersBar } from './FinanceFiltersBar';
import { TransactionsTable } from './TransactionsTable';
import type {
  FinancialTransaction,
  TransactionFilters,
  ExpenseCategory,
} from '../../../types/financial';
import type { PaginationState } from '../hooks/useFinanceData';
import { useTranslation } from 'react-i18next';

interface FinanceTransactionsProps {
  transactions: FinancialTransaction[];
  categories: ExpenseCategory[];
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onEdit: (transaction: FinancialTransaction) => void;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
}

export const FinanceTransactions = ({
  transactions,
  categories,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  loading,
  pagination,
  onPageChange,
}: FinanceTransactionsProps) => {
  const { t } = useTranslation(['finance']);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FinanceFiltersBar
        filters={filters}
        onFiltersChange={onFiltersChange}
        categories={categories}
        loading={loading}
      />

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t('finance:sections.transactions')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
            {t('finance:sections.transactionsDescription')}
          </p>
        </div>
        <div className="p-6">
          <TransactionsTable
            transactions={transactions}
            loading={loading}
            onEdit={onEdit}
            onDelete={onDelete}
            pagination={pagination}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </div>
  );
};

