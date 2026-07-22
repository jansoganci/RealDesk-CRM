import { Link, generatePath } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { ListTodo } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/config/constants';
import type { DailyBriefMilestoneItem } from '@/types';
import { groupAttentionByDeal } from '@/features/dashboard/utils/mergeAttentionItems';

type NeedsAttentionSectionProps = {
  items: DailyBriefMilestoneItem[];
};

export function NeedsAttentionSection({ items }: NeedsAttentionSectionProps) {
  const { t } = useTranslation('dashboard');
  const groups = useMemo(() => groupAttentionByDeal(items), [items]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <ListTodo className="h-4 w-4 shrink-0" />
          <span>{t('dailyBrief.needsAttention.title')}</span>
          <span className="text-sm font-normal text-slate-500">
            {t('dailyBrief.needsAttention.subtitle')}
          </span>
          {items.length > 0 && (
            <Badge variant="secondary">{items.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.length === 0 ? (
          <p className="text-sm text-slate-600">{t('dailyBrief.needsAttention.empty')}</p>
        ) : (
          groups.map((group) => (
            <div
              key={group.dealId}
              className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3"
            >
              <p className="text-sm font-semibold text-slate-900">{group.dealName}</p>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li
                    key={item.milestoneId}
                    className="rounded-md border border-slate-200 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {item.milestoneTitle}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.dueDate} ·{' '}
                          {item.responsibleParty ?? t('dailyBrief.common.unassigned')}
                        </p>
                      </div>
                      <Badge
                        variant={item.daysUntilDue < 0 ? 'destructive' : 'outline'}
                      >
                        {item.daysUntilDue < 0
                          ? t('dailyBrief.overdue.days', {
                              count: Math.abs(item.daysUntilDue),
                            })
                          : item.daysUntilDue === 0
                            ? t('dailyBrief.needsAttention.dueToday')
                            : t('dailyBrief.horizon.days', {
                                count: item.daysUntilDue,
                              })}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          to={generatePath(ROUTES.DEAL_DETAIL, { id: item.dealId })}
                        >
                          {t('dailyBrief.actions.openDeal')}
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
