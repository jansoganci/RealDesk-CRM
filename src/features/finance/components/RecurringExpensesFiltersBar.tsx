import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Filter, X, Search } from 'lucide-react';
import type { RecurringExpenseFilters, ExpenseCategory } from '../../../types/financial';

interface RecurringExpensesFiltersBarProps {
  filters: RecurringExpenseFilters;
  onFiltersChange: (filters: RecurringExpenseFilters) => void;
  categories: ExpenseCategory[];
  searchTerm?: string;
  onSearchChange?: (searchTerm: string) => void;
  loading?: boolean;
}

export const RecurringExpensesFiltersBar = ({
  filters,
  onFiltersChange,
  categories,
  searchTerm = '',
  onSearchChange,
  loading = false,
}: RecurringExpensesFiltersBarProps) => {
  const { t } = useTranslation(['finance', 'common']);

  const handleActiveStatusChange = (value: string) => {
    if (value === 'all') {
      const { is_active, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      onFiltersChange({ ...filters, is_active: value === 'active' });
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

  const handleFrequencyChange = (value: string) => {
    if (value === 'all') {
      const { frequency, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      onFiltersChange({ ...filters, frequency: value as 'monthly' | 'quarterly' | 'yearly' });
    }
  };

  const clearFilters = () => {
    onFiltersChange({});
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || (searchTerm && searchTerm.length > 0);

  const getActiveStatusValue = () => {
    if (filters.is_active === undefined) return 'all';
    return filters.is_active ? 'active' : 'inactive';
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm space-y-3">
      {/* Search Bar */}
      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
          <Input
            type="text"
            placeholder={t('finance:recurring.filters.search', { defaultValue: 'Search by name...' })}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={loading}
            className="pl-10 h-9 md:h-10 text-xs md:text-sm"
          />
        </div>
      )}

      {/* Filters Row */}
      <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 md:items-center">
        {/* Filter Icon */}
        <div className="hidden md:flex items-center">
          <Filter className="h-4 w-4 text-gray-500 dark:text-slate-400" />
        </div>

        {/* Active/Inactive Filter */}
        <Select
          value={getActiveStatusValue()}
          onValueChange={handleActiveStatusChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full md:w-[140px] h-9 md:h-10 text-xs md:text-sm">
            <SelectValue placeholder={t('finance:recurring.filters.status', { defaultValue: 'Status' })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('finance:recurring.filters.all', { defaultValue: 'All' })}
            </SelectItem>
            <SelectItem value="active">
              {t('finance:recurring.filters.active', { defaultValue: 'Active' })}
            </SelectItem>
            <SelectItem value="inactive">
              {t('finance:recurring.filters.inactive', { defaultValue: 'Inactive' })}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={filters.category || 'all'}
          onValueChange={handleCategoryChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full md:w-[180px] h-9 md:h-10 text-xs md:text-sm">
            <SelectValue placeholder={t('finance:recurring.filters.category', { defaultValue: 'Category' })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('finance:filters.allCategories', { defaultValue: 'All Categories' })}
            </SelectItem>
            {categories.map(category => {
              const categoryKey = `finance:categories.expense.${category.name}`;
              const translatedName = t(categoryKey, { defaultValue: category.name });
              return (
                <SelectItem key={category.id} value={category.name}>
                  {translatedName}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Frequency Filter */}
        <Select
          value={filters.frequency || 'all'}
          onValueChange={handleFrequencyChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full md:w-[160px] h-9 md:h-10 text-xs md:text-sm">
            <SelectValue placeholder={t('finance:recurring.filters.frequency', { defaultValue: 'Frequency' })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('finance:recurring.filters.allFrequencies', { defaultValue: 'All Frequencies' })}
            </SelectItem>
            <SelectItem value="monthly">
              {t('finance:recurring.frequencies.monthly', { defaultValue: 'Monthly' })}
            </SelectItem>
            <SelectItem value="quarterly">
              {t('finance:recurring.frequencies.quarterly', { defaultValue: 'Quarterly' })}
            </SelectItem>
            <SelectItem value="yearly">
              {t('finance:recurring.frequencies.yearly', { defaultValue: 'Yearly' })}
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
            className="gap-1.5 md:gap-2 col-span-2 md:col-span-1 h-9 md:h-10 text-xs md:text-sm"
          >
            <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
            {t('finance:filters.clearFilters', { defaultValue: 'Clear Filters' })}
          </Button>
        )}
      </div>
    </div>
  );
};

