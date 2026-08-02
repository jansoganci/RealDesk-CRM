import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { YTDSummary } from '@/types';
import { useTranslation } from 'react-i18next';

interface SalesVsRentalCardProps {
  summary: YTDSummary | null;
}

const money = (v: number | null | undefined): string =>
  `$${(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const SalesVsRentalCard = ({ summary }: SalesVsRentalCardProps) => {
  const { t } = useTranslation('finance');

  return (
    <Card className="border border-border dark:border-border bg-card dark:bg-muted">
      <CardHeader>
        <CardTitle className="text-foreground dark:text-foreground">{t('commissionDashboard.salesVsRental.title')}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/80 dark:text-muted-foreground">
        <div className="rounded-md border border-border dark:border-border p-3 bg-muted/50 dark:bg-muted">
          <p className="font-medium text-foreground dark:text-foreground">{t('commissionDashboard.salesVsRental.sales')}</p>
          <p>{t('commissionDashboard.salesVsRental.gci')}: {money(summary?.sales_gci)}</p>
          <p>{t('commissionDashboard.salesVsRental.net')}: {money(summary?.sales_net)}</p>
        </div>
        <div className="rounded-md border border-border dark:border-border p-3 bg-muted/50 dark:bg-muted">
          <p className="font-medium text-foreground dark:text-foreground">{t('commissionDashboard.salesVsRental.rental')}</p>
          <p>{t('commissionDashboard.salesVsRental.gci')}: {money(summary?.rental_gci)}</p>
          <p>{t('commissionDashboard.salesVsRental.net')}: {money(summary?.rental_net)}</p>
        </div>
      </CardContent>
    </Card>
  );
};
