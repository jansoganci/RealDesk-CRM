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
    <Card className="border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/90">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-slate-100">{t('commissionDashboard.salesVsRental.title')}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-200">
        <div className="rounded-md border border-gray-200 dark:border-slate-700 p-3 bg-slate-50/50 dark:bg-slate-800/40">
          <p className="font-medium text-slate-900 dark:text-slate-100">{t('commissionDashboard.salesVsRental.sales')}</p>
          <p>{t('commissionDashboard.salesVsRental.gci')}: {money(summary?.sales_gci)}</p>
          <p>{t('commissionDashboard.salesVsRental.net')}: {money(summary?.sales_net)}</p>
        </div>
        <div className="rounded-md border border-gray-200 dark:border-slate-700 p-3 bg-slate-50/50 dark:bg-slate-800/40">
          <p className="font-medium text-slate-900 dark:text-slate-100">{t('commissionDashboard.salesVsRental.rental')}</p>
          <p>{t('commissionDashboard.salesVsRental.gci')}: {money(summary?.rental_gci)}</p>
          <p>{t('commissionDashboard.salesVsRental.net')}: {money(summary?.rental_net)}</p>
        </div>
      </CardContent>
    </Card>
  );
};
