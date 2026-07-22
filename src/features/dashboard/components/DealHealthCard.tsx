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
      <Card className="h-full border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
        <CardContent className="py-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900 line-clamp-2">
              {card.dealName}
            </p>
            <Badge variant="outline" className="shrink-0 whitespace-nowrap">
              {t('dailyBrief.dealCard.phase', { phase: card.phase })}
            </Badge>
          </div>
          <p className={`text-xs ${COLORS.gray.text600}`}>{card.propertyAddress}</p>
          <p className={`text-xs ${COLORS.gray.text700}`}>
            {card.closingCountdownDays == null
              ? t('dailyBrief.dealCard.noClosingDate')
              : t('dailyBrief.dealCard.closingCountdown', { count: card.closingCountdownDays })}
          </p>
          <p className={`text-xs ${COLORS.gray.text700}`}>
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
