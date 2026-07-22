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
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
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
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-300">
              {t('finance:analytics.averageDaysToClose')}
            </CardTitle>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-gray-500 dark:text-slate-400">
            {t('finance:commissionTrends.noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90 hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-300">
            {t('finance:analytics.averageDaysToClose')}
          </CardTitle>
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
            <Clock className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">
                  {t('finance:analytics.averageDaysToClose')}
                </span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {data.averageDays}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {t('finance:analytics.days')}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {t('finance:analytics.medianDaysToClose')}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {data.medianDays}
              </p>
              <p className="text-xs text-slate-600 mt-1 dark:text-slate-400">
                {t('finance:analytics.days')}
              </p>
            </div>
          </div>

          {/* Breakdown by Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
              <p className="text-xs text-blue-700 font-medium mb-1">
                {t('finance:analytics.rentalsAverage')}
              </p>
              <p className="text-lg font-semibold text-blue-900">
                {data.rentalsAverage > 0 ? data.rentalsAverage : 'N/A'}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-2 border border-green-200">
              <p className="text-xs text-green-700 font-medium mb-1">
                {t('finance:analytics.salesAverage')}
              </p>
              <p className="text-lg font-semibold text-green-900">
                {data.salesAverage > 0 ? data.salesAverage : 'N/A'}
              </p>
            </div>
          </div>

          {/* Total Deals */}
          <div className="text-center pt-2 border-t border-gray-200 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t('finance:analytics.totalDeals')}: <span className="font-semibold text-gray-700 dark:text-slate-200">{data.totalDeals}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

