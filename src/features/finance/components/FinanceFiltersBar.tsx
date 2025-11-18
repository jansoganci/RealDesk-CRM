import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Filter, X } from 'lucide-react';
import type { TransactionFilters, ExpenseCategory } from '../../../types/financial';

interface FinanceFiltersBarProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  categories: ExpenseCategory[];
  loading?: boolean;
}

export const FinanceFiltersBar = ({
  filters,
  onFiltersChange,
  categories,
  loading = false,
}: FinanceFiltersBarProps) => {
  const { t } = useTranslation(['finance', 'common']);

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
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex flex-wrap gap-3 items-center">
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
    </div>
  );
};
