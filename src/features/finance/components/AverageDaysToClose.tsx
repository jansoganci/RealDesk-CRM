import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Clock, TrendingDown, TrendingUp } from 'lucide-react';
import type { AverageDaysToClose } from '../../../services/finance/analytics.service';

interface AverageDaysToCloseProps {
  data: AverageDaysToClose | null;
  loading?: boolean;
}

export const AverageDaysToCloseComponent = ({
  data,
  loading = false,
}: AverageDaysToCloseProps) => {
  const { t } = useTranslation(['finance', 'common']);

  if (loading) {
    return (
      <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalDeals === 0) {
    return (
      <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('finance:analytics.averageDaysToClose')}
            </CardTitle>
            <div className="rounded-lg bg-gradient-to-br from-info to-info/80 p-2.5 shadow-md">
              <Clock className="h-4 w-4 text-info-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            {t('finance:commissionTrends.noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('finance:analytics.averageDaysToClose')}
          </CardTitle>
          <div className="rounded-lg bg-gradient-to-br from-info to-info/80 p-2.5 shadow-md">
            <Clock className="h-4 w-4 text-info-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-info/30 bg-info/15 p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-info" />
                <span className="text-xs font-medium text-info">
                  {t('finance:analytics.averageDaysToClose')}
                </span>
              </div>
              <p className="text-2xl font-bold text-info">
                {data.averageDays}
              </p>
              <p className="mt-1 text-xs text-info">
                {t('finance:analytics.days')}
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3 border border-border dark:bg-muted dark:border-border">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                <span className="text-xs font-medium text-foreground/80 dark:text-muted-foreground">
                  {t('finance:analytics.medianDaysToClose')}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground dark:text-foreground">
                {data.medianDays}
              </p>
              <p className="text-xs text-muted-foreground mt-1 dark:text-muted-foreground/70">
                {t('finance:analytics.days')}
              </p>
            </div>
          </div>

          {/* Breakdown by Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-primary/30 bg-primary/15 p-2">
              <p className="text-xs text-primary font-medium mb-1">
                {t('finance:analytics.rentalsAverage')}
              </p>
              <p className="text-lg font-semibold text-primary">
                {data.rentalsAverage > 0 ? data.rentalsAverage : 'N/A'}
              </p>
            </div>
            <div className="bg-success/15 rounded-lg p-2 border border-success/30">
              <p className="text-xs text-success font-medium mb-1">
                {t('finance:analytics.salesAverage')}
              </p>
              <p className="text-lg font-semibold text-success">
                {data.salesAverage > 0 ? data.salesAverage : 'N/A'}
              </p>
            </div>
          </div>

          {/* Total Deals */}
          <div className="text-center pt-2 border-t border-border dark:border-border">
            <p className="text-xs text-muted-foreground">
              {t('finance:analytics.totalDeals')}: <span className="font-semibold text-foreground">{data.totalDeals}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
