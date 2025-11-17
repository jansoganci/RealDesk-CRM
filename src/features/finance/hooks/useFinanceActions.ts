import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { financialTransactionsService } from '../../../lib/serviceProxy';
import { exportToCSV, exportToPDF, exportToExcel, downloadBlob } from '../utils/exportUtils';
import type {
  FinancialTransaction,
  TransactionFilters,
  CreateFinancialTransactionInput,
  UpdateFinancialTransactionInput,
} from '../../../types/financial';
import type { ExportFormat } from '../components/FinanceFiltersBar';

interface UseFinanceActionsProps {
  onDataChange: () => Promise<void>;
  transactions: FinancialTransaction[];
  filters: TransactionFilters;
}

export const useFinanceActions = ({
  onDataChange,
  transactions,
  filters,
}: UseFinanceActionsProps) => {
  const { t } = useTranslation(['finance']);
  const [saving, setSaving] = useState(false);

  const handleSaveTransaction = useCallback(
    async (data: CreateFinancialTransactionInput | UpdateFinancialTransactionInput, 
           selectedTransaction: FinancialTransaction | null) => {
      setSaving(true);
      try {
        if (selectedTransaction) {
          await financialTransactionsService.updateTransaction(
            selectedTransaction.id,
            data as UpdateFinancialTransactionInput
          );
          toast.success(t('finance:messages.updateSuccess'));
        } else {
          await financialTransactionsService.createTransaction(
            data as CreateFinancialTransactionInput
          );
          toast.success(t('finance:messages.createSuccess'));
        }

        await onDataChange();
      } catch (error) {
        console.error('Error saving transaction:', error);
        toast.error(t('finance:messages.saveError'));
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [onDataChange, t]
  );

  const handleDeleteTransaction = useCallback(
    async (id: string) => {
      if (!window.confirm(t('finance:messages.deleteConfirm'))) {
        return;
      }

      try {
        await financialTransactionsService.deleteTransaction(id);
        toast.success(t('finance:messages.deleteSuccess'));
        await onDataChange();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast.error(t('finance:messages.deleteError'));
      }
    },
    [onDataChange, t]
  );

  const handleExport = useCallback(
    async (format: ExportFormat) => {
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
    },
    [transactions, filters, t]
  );

  return {
    saving,
    handleSaveTransaction,
    handleDeleteTransaction,
    handleExport,
  };
};

