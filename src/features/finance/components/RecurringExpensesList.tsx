import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Repeat,
  Calendar,
} from 'lucide-react';
import { EmptyState } from '../../../components/common/EmptyState';
import { RecurringExpensesFiltersBar } from './RecurringExpensesFiltersBar';
import { useOrg } from '@/contexts/OrgContext';
import type {
  RecurringExpense,
  ExpenseCategory,
  RecurringExpenseFilters,
} from '../../../types/financial';

interface RecurringExpensesListProps {
  recurringExpenses: RecurringExpense[];
  categories: ExpenseCategory[];
  filters: RecurringExpenseFilters;
  onFiltersChange: (filters: RecurringExpenseFilters) => void;
  loading?: boolean;
  onEdit: (expense: RecurringExpense) => void;
  onDelete: (id: string) => Promise<void>;
}

export const RecurringExpensesList = ({
  recurringExpenses,
  categories,
  filters,
  onFiltersChange,
  loading = false,
  onEdit,
  onDelete,
}: RecurringExpensesListProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { isMember } = useOrg();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Client-side search filtering
  const filteredExpenses = useMemo(() => {
    let result = [...recurringExpenses];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(expense =>
        expense.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [recurringExpenses, searchTerm]);

  const formatCurrency = (amount: number, currency: string) => {
    const normalizedCurrency = currency?.toUpperCase().trim() || 'USD';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (expense: RecurringExpense) => {
    if (!expense.is_active) {
      return (
        <Badge variant="secondary" className="bg-muted text-foreground/80 dark:bg-muted dark:text-muted-foreground">
          {t('finance:recurring.status.inactive', { defaultValue: 'Inactive' })}
        </Badge>
      );
    }

    const daysUntilDue = getDaysUntilDue(expense.next_due_date);
    if (daysUntilDue < 0) {
      return (
        <Badge variant="destructive">
          {t('finance:automation.overdue', { defaultValue: 'Overdue' })}
        </Badge>
      );
    } else if (daysUntilDue <= 3) {
      return (
        <Badge variant="default" className="bg-amber-100 text-amber-700 border-amber-200">
          {t('finance:automation.dueSoon', { days: daysUntilDue, defaultValue: `Due in ${daysUntilDue} days` })}
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
          {t('finance:recurring.status.active', { defaultValue: 'Active' })}
        </Badge>
      );
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      monthly: 'default',
      quarterly: 'secondary',
      yearly: 'outline',
    };

    const colors: Record<string, string> = {
      monthly: 'bg-primary text-primary border-primary/30',
      quarterly: 'bg-purple-100 text-purple-700 border-purple-200',
      yearly: 'bg-orange-100 text-orange-700 border-orange-200',
    };

    return (
      <Badge variant={variants[frequency] || 'outline'} className={colors[frequency]}>
        {t(`finance:recurring.frequencies.${frequency}`, { defaultValue: frequency })}
      </Badge>
    );
  };

  const handleDeleteClick = (id: string) => {
    setExpenseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (expenseToDelete) {
      await onDelete(expenseToDelete);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <RecurringExpensesFiltersBar
          filters={filters}
          onFiltersChange={onFiltersChange}
          categories={categories}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
        />

        {/* Desktop Skeleton */}
        <div className="hidden md:block bg-card dark:bg-muted rounded-lg shadow-lg border border-border dark:border-border overflow-hidden">
          <div className="p-6">
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Skeleton */}
        <div className="md:hidden space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-8 w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredExpenses.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <RecurringExpensesFiltersBar
          filters={filters}
          onFiltersChange={onFiltersChange}
          categories={categories}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
        />

        <EmptyState
          title={t('finance:recurring.list.empty.title', { defaultValue: 'No recurring expenses' })}
          description={t('finance:recurring.list.empty.description', {
            defaultValue: 'Create your first recurring expense to get started',
          })}
          icon={<Repeat className="h-12 w-12 text-muted-foreground/70 dark:text-muted-foreground" />}
          showAction={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RecurringExpensesFiltersBar
        filters={filters}
        onFiltersChange={onFiltersChange}
        categories={categories}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        loading={loading}
      />

      {/* Desktop Table View */}
      <div className="hidden md:block bg-card dark:bg-muted rounded-lg shadow-lg border border-border dark:border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border dark:border-border">
          <h2 className="text-xl font-bold text-foreground dark:text-foreground">
            {t('finance:recurring.list.title', { defaultValue: 'Recurring Expenses' })}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('finance:recurring.list.description', {
              defaultValue: 'Manage your recurring bills and expenses',
            })}
          </p>
        </div>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted dark:bg-muted">
                <TableHead>{t('finance:recurring.table.name', { defaultValue: 'Name' })}</TableHead>
                <TableHead>{t('finance:recurring.table.category', { defaultValue: 'Category' })}</TableHead>
                <TableHead>{t('finance:recurring.table.amount', { defaultValue: 'Amount' })}</TableHead>
                <TableHead>{t('finance:recurring.table.frequency', { defaultValue: 'Frequency' })}</TableHead>
                <TableHead>{t('finance:recurring.table.nextDueDate', { defaultValue: 'Next Due Date' })}</TableHead>
                <TableHead>{t('finance:recurring.table.status', { defaultValue: 'Status' })}</TableHead>
                <TableHead className="text-right">
                  {t('finance:recurring.table.actions', { defaultValue: 'Actions' })}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map(expense => (
                <TableRow key={expense.id} className="hover:bg-muted dark:hover:bg-muted transition-colors">
                  <TableCell className="font-medium">{expense.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{expense.category}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(expense.amount, expense.currency)}
                  </TableCell>
                  <TableCell>{getFrequencyBadge(expense.frequency)}</TableCell>
                  <TableCell>{formatDate(expense.next_due_date)}</TableCell>
                  <TableCell>{getStatusBadge(expense)}</TableCell>
                  <TableCell className="text-right">
                    {!isMember && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dark:bg-muted dark:border-border dark:text-muted-foreground">
                          <DropdownMenuItem onClick={() => onEdit(expense)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('finance:recurring.actions.edit', { defaultValue: 'Edit' })}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(expense.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('finance:recurring.actions.delete', { defaultValue: 'Delete' })}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredExpenses.map(expense => (
          <Card key={expense.id} className="p-4 shadow-sm border-border dark:border-border bg-card dark:bg-muted">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-foreground dark:text-foreground">{expense.name}</h3>
              {getStatusBadge(expense)}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{expense.category}</Badge>
                {getFrequencyBadge(expense.frequency)}
              </div>
              <div className="text-2xl font-bold text-foreground dark:text-foreground">
                {formatCurrency(expense.amount, expense.currency)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {t('finance:recurring.table.nextDueDate', { defaultValue: 'Next due' })}:{' '}
                  {formatDate(expense.next_due_date)}
                </span>
              </div>
              {!isMember && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(expense)}
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {t('finance:recurring.actions.edit', { defaultValue: 'Edit' })}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(expense.id)}
                    className="flex-1"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('finance:recurring.actions.delete', { defaultValue: 'Delete' })}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('finance:recurring.delete.confirm', {
                defaultValue: 'Delete Recurring Expense',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('finance:recurring.delete.message', {
                defaultValue:
                  'Are you sure you want to delete this recurring expense? This action cannot be undone.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common:actions.cancel', { defaultValue: 'Cancel' })}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              {t('finance:recurring.actions.delete', { defaultValue: 'Delete' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

