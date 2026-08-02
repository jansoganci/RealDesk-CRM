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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { FinancialTransaction } from '../../../types/financial';
import { useCurrencyConversion } from '../../../hooks/useCurrencyConversion';
import { useOrg } from '@/contexts/OrgContext';
import type { PaginationState } from '../hooks/useFinanceData';

interface TransactionsTableProps {
  transactions: FinancialTransaction[];
  loading?: boolean;
  onEdit: (transaction: FinancialTransaction) => void;
  onDelete: (id: string) => void;
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
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
  pagination,
  onPageChange,
}: TransactionsTableProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { isMember } = useOrg();
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
        const normalizedOriginal = t.currency?.toUpperCase().trim() || 'USD';
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
    const normalizedCurrency = currencyCode?.toUpperCase().trim() || 'USD';
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
        <p className="text-muted-foreground">{t('finance:table.noTransactions')}</p>
      </div>
    );
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    if (!pagination || pagination.totalPages <= 1) return [];

    const pages: (number | 'ellipsis')[] = [];
    const { page, totalPages } = pagination;

    // Always show first page
    pages.push(1);

    // Add ellipsis if needed
    if (page > 3) {
      pages.push('ellipsis');
    }

    // Add pages around current page
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    // Add ellipsis if needed
    if (page < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border dark:border-border bg-card dark:bg-muted overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted dark:bg-muted">
              <TableHead
                className="cursor-pointer hover:bg-muted dark:hover:bg-muted transition-colors"
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
                className="cursor-pointer hover:bg-muted dark:hover:bg-muted transition-colors"
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
                className="hover:bg-muted dark:hover:bg-muted transition-colors"
              >
                <TableCell className="font-medium">
                  {formatDate(transaction.transaction_date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {transaction.type === 'income' ? (
                      <div className="flex items-center gap-1 text-success">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">
                          {t('finance:types.income')}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-destructive">
                        <TrendingDown className="h-4 w-4" />
                        <span className="font-medium">
                          {t('finance:types.expense')}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-muted text-foreground/80 dark:bg-muted dark:text-muted-foreground rounded">
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
                          ? 'text-success'
                          : 'text-destructive'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrencyLocal(transaction.amount, transaction.currency)}
                    </span>
                    {conversionCache[transaction.id] && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground italic flex items-center gap-1 cursor-help">
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
                    <DropdownMenuContent align="end" className="dark:bg-muted dark:border-border dark:text-muted-foreground">
                      <DropdownMenuItem 
                        onClick={() => !isMember && onEdit(transaction)}
                        disabled={isMember}
                        className={isMember ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {t('common:actions.edit')}
                        {isMember && <span className="ml-auto text-[10px] italic">({t('common:readOnlyMode')})</span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => !isMember && onDelete(transaction.id)}
                        disabled={isMember}
                        className={`text-destructive ${isMember ? "opacity-50 cursor-not-allowed text-muted-foreground/70 dark:text-muted-foreground" : ""}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('common:actions.delete')}
                        {isMember && <span className="ml-auto text-[10px] italic text-muted-foreground/70 dark:text-muted-foreground">({t('common:readOnlyMode')})</span>}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {t('finance:pagination.showing', {
              from: (pagination.page - 1) * pagination.pageSize + 1,
              to: Math.min(pagination.page * pagination.pageSize, pagination.total),
              total: pagination.total,
            })}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getPageNumbers().map((pageNum, idx) =>
              pageNum === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground/70 dark:text-muted-foreground">...</span>
              ) : (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="min-w-[36px]"
                >
                  {pageNum}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
