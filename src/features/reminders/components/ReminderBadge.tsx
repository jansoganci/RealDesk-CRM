import { Badge } from '../../../components/ui/badge';
import { remindersService } from '../../../lib/serviceProxy';
import { COLORS } from '@/config/colors';
import { useTranslation } from 'react-i18next';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';

/**
 * Reminder Badge Component
 * Renders a badge indicating the urgency level of a reminder based on days until contract end
 */

interface ReminderBadgeProps {
  reminder: ReminderWithDetails;
  className?: string;
}

export function ReminderBadge({ reminder, className }: ReminderBadgeProps) {
  const { t } = useTranslation('reminders');

  const urgency = remindersService.getReminderUrgencyCategory(reminder.days_until_end ?? 0);
  const days = reminder.days_until_end ?? 0;

  switch (urgency) {
    case 'expired':
      return (
        <Badge variant="destructive" className={className}>
          {t('badges.contractEnded')}
        </Badge>
      );
    case 'urgent':
      return (
        <Badge className={`${COLORS.reminders.overdue} ${className || ''}`}>
          {t('badges.urgent', { days })}
        </Badge>
      );
    case 'soon':
      return (
        <Badge className={`${COLORS.warning.dark} ${className || ''}`}>
          {t('badges.soon', { days })}
        </Badge>
      );
    case 'upcoming':
      return (
        <Badge className={`${COLORS.reminders.upcoming} ${className || ''}`}>
          {t('badges.upcoming', { days })}
        </Badge>
      );
    default:
      return null;
  }
}

