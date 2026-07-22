import { Link, generatePath } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/config/constants';
import { COLORS } from '@/config/colors';
import type { DealHealthCard as DealHealthCardType } from '@/types';

type DealHealthCardProps = {
  card: DealHealthCardType;
};

export function DealHealthCard({ card }: DealHealthCardProps) {
  const { t } = useTranslation('dashboard');

  return (
    <Link to={generatePath(ROUTES.DEAL_DETAIL, { id: card.dealId })}>
      <Card className="h-full border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all">
        <CardContent className="py-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{card.dealName}</p>
            <Badge variant="outline">{t('dailyBrief.dealCard.phase', { phase: card.phase })}</Badge>
          </div>
          <p className={`text-xs ${COLORS.gray.text600} dark:text-slate-300`}>{card.propertyAddress}</p>
          <p className={`text-xs ${COLORS.gray.text700} dark:text-slate-200`}>
            {card.closingCountdownDays == null
              ? t('dailyBrief.dealCard.noClosingDate')
              : t('dailyBrief.dealCard.closingCountdown', { count: card.closingCountdownDays })}
          </p>
          <p className={`text-xs ${COLORS.gray.text700} dark:text-slate-200`}>
            {card.nextMilestoneTitle
              ? t('dailyBrief.dealCard.nextMilestone', { title: card.nextMilestoneTitle })
              : t('dailyBrief.dealCard.noNextMilestone')}
          </p>
          {card.overdueCount > 0 && (
            <Badge variant="destructive">
              {t('dailyBrief.dealCard.overdueCount', { count: card.overdueCount })}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
