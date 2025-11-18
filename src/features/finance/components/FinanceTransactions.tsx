import { FinanceFiltersBar } from './FinanceFiltersBar';
import { TransactionsTable } from './TransactionsTable';
import type {
  FinancialTransaction,
  TransactionFilters,
  ExpenseCategory,
} from '../../../types/financial';
import { useTranslation } from 'react-i18next';

interface FinanceTransactionsProps {
  transactions: FinancialTransaction[];
  categories: ExpenseCategory[];
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onEdit: (transaction: FinancialTransaction) => void;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

export const FinanceTransactions = ({
  transactions,
  categories,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  loading,
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
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
};

