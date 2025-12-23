import { useState, useEffect, useRef } from 'react';
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
import { Skeleton } from '../../../components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
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
  Info,
} from 'lucide-react';
import type { FinancialTransaction } from '../../../types/financial';
import { useCurrencyConversion } from '../../../hooks/useCurrencyConversion';

interface TransactionsTableProps {
  transactions: FinancialTransaction[];
  loading?: boolean;
  onEdit: (transaction: FinancialTransaction) => void;
  onDelete: (id: string) => void;
}

interface ConversionCache {
  [key: string]: {
    converted: string;
    rateInfo: { rate: number; rate_date_used: string };
  };
}

export const TransactionsTable = ({
  transactions,
  loading = false,
  onEdit,
  onDelete,
}: TransactionsTableProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { formatWithConversion, displayCurrency } = useCurrencyConversion();
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [conversionCache, setConversionCache] = useState<ConversionCache>({});
  
  // Guard against redundant loads
  const lastProcessedRef = useRef<string>('');

  // Load conversions for all transactions
  useEffect(() => {
    // Create a fingerprint of the current state to avoid redundant work
    const fingerprint = `${transactions.length}-${displayCurrency}-${transactions.map(t => t.id).join(',')}`;
    
    if (lastProcessedRef.current === fingerprint) return;

    const loadConversions = async () => {
      lastProcessedRef.current = fingerprint;
      const conversions: ConversionCache = {};
      const needsConversion = transactions.filter(t => {
        const normalizedOriginal = t.currency?.toUpperCase().trim() || 'TRY';
        return normalizedOriginal !== displayCurrency;
      });

      if (needsConversion.length === 0) {
        setConversionCache({});
        return;
      }

      // Process in parallel since exchange rates are now cached in memory
      const results = await Promise.all(
        needsConversion.map(async (transaction) => {
          try {
            const result = await formatWithConversion(
              transaction.amount,
              transaction.currency,
              transaction.transaction_date
            );
            return { id: transaction.id, result };
          } catch (error) {
            console.warn(`Failed to convert transaction ${transaction.id}:`, error);
            return null;
          }
        })
      );

      results.forEach(item => {
        if (item) {
          conversions[item.id] = {
            converted: item.result.converted,
            rateInfo: item.result.rateInfo,
          };
        }
      });

      setConversionCache(conversions);
    };

    if (transactions.length > 0) {
      loadConversions();
    } else {
      setConversionCache({});
    }
  }, [transactions, displayCurrency, formatWithConversion]);

  const formatCurrencyLocal = (amount: number, currencyCode: string) => {
    const normalizedCurrency = currencyCode?.toUpperCase().trim() || 'TRY';
    if (!normalizedCurrency || normalizedCurrency === 'MIXED') {
      return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: normalizedCurrency,
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
          <Skeleton
            key={i}
            className="h-16 w-full rounded-lg"
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
                <div className="flex flex-col gap-1">
                  <span
                    className={`font-bold ${
                      transaction.type === 'income'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrencyLocal(transaction.amount, transaction.currency)}
                  </span>
                  {conversionCache[transaction.id] && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-gray-500 italic flex items-center gap-1 cursor-help">
                            ≈ {conversionCache[transaction.id].converted}
                            <Info className="h-3 w-3" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div>
                              {t('finance:conversion.rate')}: {conversionCache[transaction.id].rateInfo.rate.toFixed(4)}
                            </div>
                            <div>
                              {t('finance:conversion.rateDate')}: {new Date(conversionCache[transaction.id].rateInfo.rate_date_used).toLocaleDateString()}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
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
