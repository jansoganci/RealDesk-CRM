import { Link, generatePath } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/config/constants';
import type { WaitingOnOthersItem } from '@/types';

type WaitingOnOthersProps = {
  items: WaitingOnOthersItem[];
};

export function WaitingOnOthers({ items }: WaitingOnOthersProps) {
  const { t } = useTranslation('dashboard');

  return (
    <Card className="border-sky-200 bg-sky-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sky-900 text-base">
          <Clock3 className="h-4 w-4" />
          {t('dailyBrief.waiting.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-sky-800">{t('dailyBrief.waiting.empty')}</p>
        ) : (
          items.map((item) => (
            <div key={item.milestoneId} className="rounded-lg border border-sky-200 bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.dealName}</p>
                  <p className="text-sm text-slate-700">{item.milestoneTitle}</p>
                  <p className="text-xs text-slate-500">
                    {t('dailyBrief.waiting.counterparty', {
                      name: item.counterpartyName ?? t('dailyBrief.common.unknown'),
                    })}
                  </p>
                </div>
                <Badge className="border-sky-200 bg-sky-100 text-sky-800">
                  {item.lastNudgeSentAt
                    ? t('dailyBrief.waiting.nudged')
                    : t('dailyBrief.waiting.notNudged')}
                </Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to={generatePath(ROUTES.DEAL_DETAIL, { id: item.dealId })}>
                    {t('dailyBrief.actions.openDeal')}
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to={generatePath(ROUTES.DEAL_DETAIL, { id: item.dealId })}>
                    {t('dailyBrief.actions.sendReminder')}
                  </Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
