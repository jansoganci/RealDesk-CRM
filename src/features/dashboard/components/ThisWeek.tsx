import { Link, generatePath } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/config/constants';
import type { DailyBriefMilestoneItem } from '@/types';

type ThisWeekProps = {
  items: DailyBriefMilestoneItem[];
};

export function ThisWeek({ items }: ThisWeekProps) {
  const { t } = useTranslation('dashboard');
  const [open, setOpen] = useState(false);

  const weekItems = useMemo(
    () => items.filter((item) => item.daysUntilDue >= 4 && item.daysUntilDue <= 7),
    [items]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setOpen((prev) => !prev)}
        >
          <CardTitle className="text-base">{t('dailyBrief.thisWeek.title')}</CardTitle>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          {weekItems.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">{t('dailyBrief.thisWeek.empty')}</p>
          ) : (
            weekItems.map((item) => (
              <div key={item.milestoneId} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.dealName}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{item.milestoneTitle}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.dueDate}</p>
                  </div>
                  <Badge variant="secondary">
                    {t('dailyBrief.thisWeek.days', { count: item.daysUntilDue })}
                  </Badge>
                </div>
                <div className="mt-3">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={generatePath(ROUTES.DEAL_DETAIL, { id: item.dealId })}>
                      {t('dailyBrief.actions.openDeal')}
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      )}
    </Card>
  );
}
