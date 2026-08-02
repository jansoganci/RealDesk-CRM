import { Link, generatePath } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/config/constants';
import type { DailyBriefMilestoneItem } from '@/types';

type HorizonZoneProps = {
  items: DailyBriefMilestoneItem[];
};

export function HorizonZone({ items }: HorizonZoneProps) {
  const { t } = useTranslation('dashboard');

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-900 text-base">
          <CalendarClock className="h-4 w-4" />
          {t('dailyBrief.horizon.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.milestoneId} className="rounded-lg border border-amber-200 bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.dealName}</p>
                <p className="text-sm text-foreground/80">{item.milestoneTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {item.dueDate} · {item.responsibleParty ?? t('dailyBrief.common.unassigned')}
                </p>
              </div>
              <Badge variant="warning">
                {t('dailyBrief.horizon.days', { count: item.daysUntilDue })}
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
        ))}
      </CardContent>
    </Card>
  );
}
