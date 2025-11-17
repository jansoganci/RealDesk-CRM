import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { financialTransactionsService } from '../../../lib/serviceProxy';
import { useAuth } from '../../../contexts/AuthContext';
import type { UpcomingRecurringExpense } from '../../../types/financial';

interface UpcomingBillsProps {
  daysAhead?: number;
  onBillPaid?: () => void;
}

export const UpcomingBills = ({
  daysAhead = 30,
  onBillPaid,
}: UpcomingBillsProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { currency } = useAuth();
  const [bills, setBills] = useState<UpcomingRecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  useEffect(() => {
    loadBills();
  }, [daysAhead]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const data = await financialTransactionsService.getUpcomingBills(daysAhead);
      setBills(data);
    } catch (error) {
      console.error('Error loading upcoming bills:', error);
      toast.error(t('finance:messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (billId: string) => {
    setMarkingPaid(billId);
    try {
      await financialTransactionsService.markBillAsPaid(billId);
      toast.success(t('finance:automation.billMarkedPaid'));
      await loadBills();
      onBillPaid?.();
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      toast.error(t('finance:automation.markPaidError'));
    } finally {
      setMarkingPaid(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getBadgeVariant = (bill: UpcomingRecurringExpense) => {
    if (bill.is_overdue) {
      return {
        className: 'bg-red-100 text-red-700 border-red-200',
        icon: AlertTriangle,
        label: t('finance:automation.overdue'),
      };
    }
    if (bill.days_until_due <= 3) {
      return {
        className: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Clock,
        label: t('finance:automation.dueSoon', { days: bill.days_until_due }),
      };
    }
    return {
      className: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Calendar,
      label: t('finance:automation.upcoming'),
    };
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bills.length === 0) {
    return (
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg shadow-md bg-emerald-600">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                {t('finance:automation.upcomingBills')}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-0.5">
                {t('finance:automation.upcomingBillsDesc')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              {t('finance:automation.noBills')}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t('finance:automation.noBillsDesc', { days: daysAhead })}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort bills by due date
  const sortedBills = [...bills].sort((a, b) => {
    // Overdue first
    if (a.is_overdue && !b.is_overdue) return -1;
    if (!a.is_overdue && b.is_overdue) return 1;
    // Then by days until due
    return a.days_until_due - b.days_until_due;
  });

  return (
    <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg shadow-md bg-blue-600">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                {t('finance:automation.upcomingBills')}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-0.5">
                {t('finance:automation.upcomingBillsDesc')}
              </p>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-lg px-3 py-1">
            {bills.length} {t('finance:automation.bills')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedBills.map((bill) => {
            const badge = getBadgeVariant(bill);
            const Icon = badge.icon;

            return (
              <div
                key={bill.recurring_expense.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  bill.is_overdue
                    ? 'bg-red-50 border-red-200'
                    : bill.days_until_due <= 3
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-slate-900">
                        {bill.recurring_expense.name}
                      </h4>
                      <Badge className={badge.className}>
                        <Icon className="h-3 w-3 mr-1" />
                        {badge.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        <span className="font-medium">{t('finance:table.category')}:</span>{' '}
                        {bill.recurring_expense.category}
                      </span>
                      <span>
                        <span className="font-medium">{t('finance:table.date')}:</span>{' '}
                        {formatDate(bill.recurring_expense.next_due_date)}
                      </span>
                      <span>
                        <span className="font-medium">{t('finance:automation.frequency')}:</span>{' '}
                        {t(`finance:automation.frequencies.${bill.recurring_expense.frequency}`)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-slate-900 mb-2">
                      {formatCurrency(bill.recurring_expense.amount)}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsPaid(bill.recurring_expense.id)}
                      disabled={markingPaid === bill.recurring_expense.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {markingPaid === bill.recurring_expense.id ? (
                        <span>{t('common:actions.processing')}</span>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {t('finance:automation.markAsPaid')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
