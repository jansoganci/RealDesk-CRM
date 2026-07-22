import { Link, generatePath } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/config/constants';
import { COLORS } from '@/config/colors';
import type { DailyBriefMilestoneItem } from '@/types';

type OverdueZoneProps = {
  items: DailyBriefMilestoneItem[];
};

export function OverdueZone({ items }: OverdueZoneProps) {
  const { t } = useTranslation('dashboard');

  if (items.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
        <CardContent className="py-4">
          <p className={`${COLORS.success.textDark} dark:text-emerald-300 text-sm font-medium`}>
            {t('dailyBrief.overdue.empty')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100 text-base">
          <AlertTriangle className="h-4 w-4" />
          {t('dailyBrief.overdue.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.milestoneId} className="rounded-lg border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.dealName}</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{item.milestoneTitle}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.propertyAddress}</p>
              </div>
              <Badge variant="destructive">
                {t('dailyBrief.overdue.days', { count: Math.abs(item.daysUntilDue) })}
              </Badge>
            </div>
            <div className="mt-3">
              <Button size="sm" asChild>
                <Link to={generatePath(ROUTES.DEAL_DETAIL, { id: item.dealId })}>
                  {t('dailyBrief.actions.openDeal')}
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
