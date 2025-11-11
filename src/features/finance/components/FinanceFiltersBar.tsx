import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Download, Filter, X, FileDown, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import type { TransactionFilters, ExpenseCategory } from '../../../types/financial';

export type ExportFormat = 'csv' | 'pdf' | 'excel';

interface FinanceFiltersBarProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  categories: ExpenseCategory[];
  onExport: (format: ExportFormat) => void;
  loading?: boolean;
}

export const FinanceFiltersBar = ({
  filters,
  onFiltersChange,
  categories,
  onExport,
  loading = false,
}: FinanceFiltersBarProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handleTypeChange = (value: string) => {
    if (value === 'all') {
      const { type, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      onFiltersChange({ ...filters, type: value as 'income' | 'expense' });
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'all') {
      const { category, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      onFiltersChange({ ...filters, category: value });
    }
  };

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      const { payment_status, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      onFiltersChange({
        ...filters,
        payment_status: value as 'completed' | 'pending' | 'cancelled',
      });
    }
  };

  const handleMonthChange = (value: string) => {
    if (value === 'all') {
      const { start_date, end_date, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      const startDate = `${value}-01`;
      const [year, month] = value.split('-').map(Number);
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      onFiltersChange({ ...filters, start_date: startDate, end_date: endDate });
    }
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  // Generate last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
    };
  });

  // Get current month for default
  const currentMonth = new Date().toISOString().slice(0, 7);
  const selectedMonth =
    filters.start_date?.slice(0, 7) || currentMonth;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={selectedMonth}
            onValueChange={handleMonthChange}
            disabled={loading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('finance:filters.selectMonth')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finance:filters.allMonths')}</SelectItem>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter */}
        <Select
          value={filters.type || 'all'}
          onValueChange={handleTypeChange}
          disabled={loading}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('finance:filters.selectType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('finance:filters.allTypes')}</SelectItem>
            <SelectItem value="income">{t('finance:types.income')}</SelectItem>
            <SelectItem value="expense">{t('finance:types.expense')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={filters.category || 'all'}
          onValueChange={handleCategoryChange}
          disabled={loading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('finance:filters.selectCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('finance:filters.allCategories')}
            </SelectItem>
            {categories
              .filter(c => !filters.type || c.type === filters.type)
              .map(category => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.payment_status || 'all'}
          onValueChange={handleStatusChange}
          disabled={loading}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('finance:filters.selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('finance:filters.allStatuses')}</SelectItem>
            <SelectItem value="completed">
              {t('finance:paymentStatus.completed')}
            </SelectItem>
            <SelectItem value="pending">
              {t('finance:paymentStatus.pending')}
            </SelectItem>
            <SelectItem value="cancelled">
              {t('finance:paymentStatus.cancelled')}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={loading}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            {t('finance:filters.clearFilters')}
          </Button>
        )}
      </div>

      {/* Export Button with Dropdown */}
      <div className="relative">
        <div className="flex gap-1">
          <Button
            variant="outline"
            onClick={() => onExport('csv')}
            disabled={loading}
            className="gap-2 whitespace-nowrap rounded-r-none"
          >
            <Download className="h-4 w-4" />
            {t('finance:export.exportData')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            disabled={loading}
            className="px-2 rounded-l-none border-l-0"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {exportMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setExportMenuOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="py-1">
                <button
                  onClick={() => {
                    onExport('csv');
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  disabled={loading}
                >
                  <FileText className="h-4 w-4 text-green-600" />
                  {t('finance:export.exportCSV')}
                </button>
                <button
                  onClick={() => {
                    onExport('pdf');
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  disabled={loading}
                >
                  <FileDown className="h-4 w-4 text-red-600" />
                  {t('finance:export.exportPDF')}
                </button>
                <button
                  onClick={() => {
                    onExport('excel');
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  disabled={loading}
                >
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                  {t('finance:export.exportExcel')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
