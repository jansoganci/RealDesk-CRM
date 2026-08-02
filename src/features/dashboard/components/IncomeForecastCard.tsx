import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/config/constants';
import { useCommissionForecast } from '../hooks/useCommissionForecast';

const money = (value: number | null | undefined): string =>
  `$${(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export function IncomeForecastCard() {
  const { t } = useTranslation('dashboard');
  const { data, loading, error } = useCommissionForecast();

  return (
    <Link to={`${ROUTES.FINANCE}?tab=commission`} className="block">
      <Card className="border-border hover:border-primary/40 hover:shadow-md transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('dailyBrief.forecast.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('dailyBrief.forecast.loading')}</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">{t('dailyBrief.forecast.committedGross')}</p>
                <p className="font-semibold text-foreground">{money(data?.committed_this_month_gross)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">{t('dailyBrief.forecast.committedNet')}</p>
                <p className="font-semibold text-success">{money(data?.committed_this_month_net)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">{t('dailyBrief.forecast.weightedGross')}</p>
                <p className="font-semibold text-foreground">{money(data?.weighted_90_days_gross)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">{t('dailyBrief.forecast.weightedNet')}</p>
                <p className="font-semibold text-success">{money(data?.weighted_90_days_net)}</p>
              </div>
              <div className="md:col-span-2 text-xs text-muted-foreground">
                {t('dailyBrief.forecast.activeDeals', { count: data?.active_deals_count ?? 0 })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
