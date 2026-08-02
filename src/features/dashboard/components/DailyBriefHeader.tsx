import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { COLORS } from '@/config/colors';

type DailyBriefHeaderProps = {
  attentionCount: number;
  activeDealsCount: number;
};

export function DailyBriefHeader({
  attentionCount,
  activeDealsCount,
}: DailyBriefHeaderProps) {
  const { t } = useTranslation('dashboard');
  const formattedDate = useMemo(
    () => format(new Date(), 'EEEE, MMM d'),
    []
  );

  return (
    <Card className="border-primary/30 bg-primary/10 dark:border-primary dark:bg-primary/40">
      <CardContent className="py-5">
        <div className="space-y-1">
          <p className={`text-lg font-semibold ${COLORS.primary.text}`}>
            {attentionCount === 0
              ? t('dailyBrief.header.greetingClear')
              : t('dailyBrief.header.greeting', { count: attentionCount })}
          </p>
          <p className={`text-sm ${COLORS.gray.text600} dark:text-muted-foreground`}>
            {t('dailyBrief.header.meta', {
              date: formattedDate,
              count: activeDealsCount,
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
