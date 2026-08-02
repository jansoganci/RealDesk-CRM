import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  TrendingUp,
  Award,
  Target,
  PieChart,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { formatCurrency } from '../../../lib/currency';
import { NormalizedPerformanceSummary, CalculatedMetric } from '../../../services/finance/reportCalculator';
import { YearOverYearIndicator } from './YearOverYearIndicator';

interface PerformanceSummaryProps {
  summary: NormalizedPerformanceSummary | null;
  loading?: boolean;
}

export const PerformanceSummaryComponent = ({
  summary,
  loading = false,
}: PerformanceSummaryProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { currency: displayCurrency } = useAuth();

  const formatMetric = (metric: CalculatedMetric) => {
    const normalizedCurrency = displayCurrency?.toUpperCase().trim() || 'USD';
    const formatted = formatCurrency(metric.value, normalizedCurrency);

    if (metric.isComplete) {
      return <span>{formatted}</span>;
    }

    return (
      <div className="flex items-center gap-1">
        <span>{formatted}</span>
        <div title={`${t('finance:performance.missingRates')}: ${metric.missingDates.join(', ')}`}>
          <AlertCircle className="h-4 w-4 text-amber-500 inline cursor-help" />
        </div>
      </div>
    );
  };

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
          <div className="space-y-4">
            <Skeleton className="h-10 w-32" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm dark:border-border dark:bg-muted hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('finance:performance.title')}
          </CardTitle>
          <div className="p-2.5 rounded-lg bg-secondary shadow-md">
            <Award className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Commission */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground dark:text-foreground">
                {formatMetric(summary.totalCommission)}
              </span>
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('finance:performance.totalCommission')} ({summary.year})
            </p>
            {summary.previousYear && (
              <YearOverYearIndicator
                current={summary.totalCommission.value}
                previous={summary.previousYear.totalCommission.value}
                className="mt-1"
              />
            )}
          </div>

          {/* Transaction Volume */}
          {summary.transactionVolume && summary.transactionVolume.value > 0 && (
            <div className="bg-primary rounded-lg p-3 border border-primary/30">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {t('finance:performance.transactionVolume')}
                </span>
              </div>
              <span className="text-xl font-semibold text-primary">
                {formatMetric(summary.transactionVolume)}
              </span>
              <p className="text-xs text-primary mt-1">
                {t('finance:performance.transactionVolumeDesc', { year: summary.year })}
              </p>
              {summary.previousYear && summary.previousYear.transactionVolume && summary.previousYear.transactionVolume.value >= 0 && (
                <YearOverYearIndicator
                  current={summary.transactionVolume.value}
                  previous={summary.previousYear.transactionVolume.value}
                  className="mt-1"
                />
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Deals Count */}
            <div className="bg-muted rounded-lg p-3 dark:bg-muted">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  {t('finance:performance.dealsCount')}
                </span>
              </div>
              <span className="text-xl font-semibold text-foreground dark:text-foreground">
                {summary.dealsCount}
              </span>
              {summary.previousYear && (
                <YearOverYearIndicator
                  current={summary.dealsCount}
                  previous={summary.previousYear.dealsCount}
                  className="mt-1"
                />
              )}
            </div>

            {/* Average Per Deal */}
            <div className="bg-muted rounded-lg p-3 dark:bg-muted">
              <div className="flex items-center gap-2 mb-1">
                <PieChart className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  {t('finance:performance.averagePerDeal')}
                </span>
              </div>
              <span className="text-xl font-semibold text-foreground dark:text-foreground">
                {formatMetric(summary.averagePerDeal)}
              </span>
              {summary.previousYear && (
                <YearOverYearIndicator
                  current={summary.averagePerDeal.value}
                  previous={summary.previousYear.averagePerDeal.value}
                  className="mt-1"
                />
              )}
            </div>
          </div>

          {/* Best Month */}
          {summary.bestMonth && (
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-700">
                    {t('finance:performance.bestMonth')}
                  </p>
                  <p className="text-sm font-semibold text-amber-900">
                    {summary.bestMonth.monthName}
                  </p>
                </div>
                <span className="text-lg font-bold text-amber-900">
                  {formatMetric(summary.bestMonth.amount)}
                </span>
              </div>
            </div>
          )}

          {/* Rental vs Sale Split */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('finance:performance.rentalVsSale')}</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-muted dark:bg-muted">
              <div
                className="bg-primary transition-all duration-500"
                style={{ width: `${summary.rentalPercentage}%` }}
              />
              <div
                className="bg-success/150 transition-all duration-500"
                style={{ width: `${summary.salePercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-primary">
                {t('finance:performance.rental')} {summary.rentalPercentage.toFixed(0)}%
              </span>
              <span className="text-success">
                {t('finance:performance.sale')} {summary.salePercentage.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
