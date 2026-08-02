import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExternalLink, Receipt } from 'lucide-react';

interface Invoice {
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

// Mock data - will be replaced with Stripe API call
const mockInvoices: Invoice[] = [
  {
    date: '2024-01-13',
    amount: 29,
    currency: 'USD',
    status: 'paid',
    invoiceUrl: '#',
  },
  {
    date: '2023-12-13',
    amount: 29,
    currency: 'USD',
    status: 'paid',
    invoiceUrl: '#',
  },
  {
    date: '2023-11-13',
    amount: 29,
    currency: 'USD',
    status: 'paid',
    invoiceUrl: '#',
  },
];

export const BillingHistoryCard = () => {
  const { t } = useTranslation('profile');
  const [showAllInvoicesModal, setShowAllInvoicesModal] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const badges = {
      paid: { variant: 'default' as const, text: t('billingHistory.status.paid') },
      pending: { variant: 'outline' as const, text: t('billingHistory.status.pending') },
      failed: { variant: 'destructive' as const, text: t('billingHistory.status.failed') },
    };
    const badge = badges[status];
    return <Badge variant={badge.variant}>{badge.text}</Badge>;
  };

  const handleViewAllInvoices = () => {
    setShowAllInvoicesModal(true);
  };

  return (
    <Card className="border-border dark:border-border dark:bg-muted">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground dark:text-muted-foreground">
          <Receipt className="h-5 w-5 text-foreground/80 dark:text-muted-foreground" />
          {t('billingHistory.title')}
        </CardTitle>
        <CardDescription>
          {t('billingHistory.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border bg-card dark:bg-muted dark:border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('billingHistory.table.date')}</TableHead>
                <TableHead>{t('billingHistory.table.amount')}</TableHead>
                <TableHead>{t('billingHistory.table.status')}</TableHead>
                <TableHead className="text-right">
                  {t('billingHistory.table.invoice')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {t('billingHistory.noInvoices')}
                  </TableCell>
                </TableRow>
              ) : (
                mockInvoices.map((invoice, index) => (
                  <TableRow key={index} className="dark:border-border dark:hover:bg-muted">
                    <TableCell className="font-medium text-foreground dark:text-muted-foreground">
                      {formatDate(invoice.date)}
                    </TableCell>
                    <TableCell className="text-foreground dark:text-muted-foreground">
                      {invoice.amount} {invoice.currency}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.invoiceUrl ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(invoice.invoiceUrl, '_blank')}
                        >
                          {t('billingHistory.viewButton')}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground/70 dark:text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleViewAllInvoices}
            className="dark:border-border dark:bg-muted dark:hover:bg-muted dark:text-muted-foreground"
          >
            {t('billingHistory.viewAllButton')}
          </Button>
        </div>

        {/* Future Integration Note */}
        <p className="text-xs text-muted-foreground/70 dark:text-muted-foreground mt-4 text-center">
          {t('billingHistory.futureIntegration')}
        </p>
      </CardContent>

      {/* All Invoices Modal */}
      <Dialog open={showAllInvoicesModal} onOpenChange={setShowAllInvoicesModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground dark:text-muted-foreground">
              <Receipt className="h-5 w-5 text-foreground/80 dark:text-muted-foreground" />
              {t('subscription.invoiceModal.title')}
            </DialogTitle>
            <DialogDescription>
              {t('subscription.invoiceModal.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="rounded-md border border-border bg-card dark:bg-muted dark:border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('billingHistory.table.date')}</TableHead>
                    <TableHead>{t('billingHistory.table.amount')}</TableHead>
                    <TableHead>{t('billingHistory.table.status')}</TableHead>
                    <TableHead className="text-right">
                      {t('billingHistory.table.invoice')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        {t('billingHistory.noInvoices')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    mockInvoices.map((invoice, index) => (
                      <TableRow key={index} className="dark:border-border dark:hover:bg-muted">
                        <TableCell className="font-medium text-foreground dark:text-muted-foreground">
                          {formatDate(invoice.date)}
                        </TableCell>
                        <TableCell className="text-foreground dark:text-muted-foreground">
                          {invoice.amount} {invoice.currency}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invoice.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice.invoiceUrl ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => window.open(invoice.invoiceUrl, '_blank')}
                            >
                              {t('billingHistory.viewButton')}
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground/70 dark:text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Future Integration Note in Modal */}
            <p className="text-xs text-muted-foreground/70 dark:text-muted-foreground mt-4 text-center">
              {t('billingHistory.futureIntegration')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
