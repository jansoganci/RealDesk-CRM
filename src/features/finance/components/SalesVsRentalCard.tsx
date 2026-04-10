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
    <Card>
      <CardHeader>
        <CardTitle>{t('commissionDashboard.salesVsRental.title')}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="rounded-md border p-3">
          <p className="font-medium">{t('commissionDashboard.salesVsRental.sales')}</p>
          <p>{t('commissionDashboard.salesVsRental.gci')}: {money(summary?.sales_gci)}</p>
          <p>{t('commissionDashboard.salesVsRental.net')}: {money(summary?.sales_net)}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="font-medium">{t('commissionDashboard.salesVsRental.rental')}</p>
          <p>{t('commissionDashboard.salesVsRental.gci')}: {money(summary?.rental_gci)}</p>
          <p>{t('commissionDashboard.salesVsRental.net')}: {money(summary?.rental_net)}</p>
        </div>
      </CardContent>
    </Card>
  );
};
