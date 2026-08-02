import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/config/constants';
import { useTeamPerformanceSummary } from '../hooks/useTeamPerformanceSummary';

const money = (value: number | null | undefined): string =>
  `$${(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export function TeamPerformanceSummaryCard() {
  const { t } = useTranslation(['dashboard', 'team']);
  const { data, loading, error } = useTeamPerformanceSummary();

  return (
    <Link to={ROUTES.TEAM} className="block">
      <Card className="border-border hover:border-primary/40 hover:shadow-md transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('team:pageTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('dailyBrief.forecast.loading')}</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">{t('team:metrics.deals')}</p>
                <p className="font-semibold text-foreground">{data?.totalDeals ?? 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">{t('team:metrics.netCommission')}</p>
                <p className="font-semibold text-success">{money(data?.totalNetCommission)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">{t('team:metrics.companyDollar')}</p>
                <p className="font-semibold text-foreground">{money(data?.totalCompanyDollar)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
