import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { COLORS } from '@/config/colors';
import { cn } from '@/lib/utils';

type ClosingCountdownProps = {
  closingDate: string;
  dealName: string;
};

function daysUntilClosing(closingDate: string): number {
  const now = new Date();
  const close = parseISO(closingDate);
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const closeDate = new Date(close.getFullYear(), close.getMonth(), close.getDate());
  return Math.floor((closeDate.getTime() - nowDate.getTime()) / (24 * 60 * 60 * 1000));
}

export function ClosingCountdown({ closingDate, dealName }: ClosingCountdownProps) {
  const { t } = useTranslation('deals');

  let formattedDate = closingDate;
  try {
    formattedDate = format(parseISO(closingDate), 'MMMM d, yyyy');
  } catch {
    formattedDate = closingDate;
  }

  const daysRemaining = daysUntilClosing(closingDate);
  let className = `${COLORS.success.bgLight} ${COLORS.success.border} ${COLORS.success.text}`;
  let message = t('closingCountdown.inDays', {
    count: daysRemaining,
    date: formattedDate,
    dealName,
  });

  if (daysRemaining <= 7 && daysRemaining > 0) {
    className = `${COLORS.warning.bgLight} ${COLORS.warning.border} ${COLORS.warning.text}`;
    message = t('closingCountdown.inDaysWarning', {
      count: daysRemaining,
      date: formattedDate,
      dealName,
    });
  } else if (daysRemaining === 0) {
    className = `${COLORS.danger.bgLight} ${COLORS.danger.border} ${COLORS.danger.text}`;
    message = t('closingCountdown.today', { date: formattedDate, dealName });
  } else if (daysRemaining < 0) {
    className = `${COLORS.danger.bgLight} ${COLORS.danger.border} ${COLORS.danger.text}`;
    message = t('closingCountdown.passed', {
      count: Math.abs(daysRemaining),
      dealName,
    });
  }

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardContent className="py-3">
        <p className="text-sm font-medium">{message}</p>
      </CardContent>
    </Card>
  );
}
