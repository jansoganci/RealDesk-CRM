import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import type { FinancialTransaction } from '../../../types/financial';

interface TransactionsTableProps {
  transactions: FinancialTransaction[];
  loading?: boolean;
  onEdit: (transaction: FinancialTransaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionsTable = ({
  transactions,
  loading = false,
  onEdit,
  onDelete,
}: TransactionsTableProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { currency } = useAuth();
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {t(`finance:paymentStatus.${status}`)}
      </Badge>
    );
  };

  const handleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let compareValue = 0;

    if (sortField === 'date') {
      compareValue =
        new Date(a.transaction_date).getTime() -
        new Date(b.transaction_date).getTime();
    } else if (sortField === 'amount') {
      compareValue = a.amount - b.amount;
    }

    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="h-16 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('finance:table.noTransactions')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead
              className="cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center gap-2">
                {t('finance:table.date')}
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>{t('finance:table.type')}</TableHead>
            <TableHead>{t('finance:table.category')}</TableHead>
            <TableHead>{t('finance:table.description')}</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('amount')}
            >
              <div className="flex items-center gap-2">
                {t('finance:table.amount')}
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>{t('finance:table.status')}</TableHead>
            <TableHead>{t('finance:table.paymentMethod')}</TableHead>
            <TableHead className="text-right">{t('finance:table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTransactions.map(transaction => (
            <TableRow
              key={transaction.id}
              className="hover:bg-gray-50 transition-colors"
            >
              <TableCell className="font-medium">
                {formatDate(transaction.transaction_date)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {transaction.type === 'income' ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">
                        {t('finance:types.income')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <TrendingDown className="h-4 w-4" />
                      <span className="font-medium">
                        {t('finance:types.expense')}
                      </span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                  {transaction.category}
                </span>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={transaction.description}>
                  {transaction.description}
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`font-bold ${
                    transaction.type === 'income'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </TableCell>
              <TableCell>{getStatusBadge(transaction.payment_status)}</TableCell>
              <TableCell>
                {transaction.payment_method
                  ? t(`finance:paymentMethods.${transaction.payment_method}`)
                  : '-'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(transaction)}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('common:actions.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(transaction.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('common:actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
