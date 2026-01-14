import { Shield, Bell, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';

/**
 * Alarm Status Icon Component
 * Shows visual status of reminder alarm system
 * 
 * Statuses:
 * - armed: Green shield (Under Watch - alarm is active)
 * - critical: Red bell (Critical - action required)
 * - completed: Gray checkmark (Completed - no action needed)
 */

interface AlarmStatusIconProps {
  reminder: ReminderWithDetails;
  className?: string;
  size?: number;
}

export function AlarmStatusIcon({
  reminder,
  className,
  size = 16,
}: AlarmStatusIconProps) {
  const { t } = useTranslation('reminders');
  
  // Fixed 30-day threshold (matches remindersService.EXPIRY_REMINDER_DAYS)
  const EXPIRY_REMINDER_DAYS = 30;

  // Determine status based on reminder state
  const getStatus = (): 'armed' | 'critical' | 'completed' => {
    if (reminder.rent_increase_reminder_contacted) {
      return 'completed';
    }
    
    if (reminder.is_overdue || (reminder.days_until_end <= EXPIRY_REMINDER_DAYS)) {
      return 'critical';
    }
    
    if (reminder.rent_increase_reminder_enabled && reminder.days_until_end > EXPIRY_REMINDER_DAYS) {
      return 'armed';
    }
    
    return 'armed'; // Default
  };

  const status = getStatus();
  const days = reminder.days_until_end ?? 0;

  // Render icon based on status
  const renderIcon = () => {
    const iconClassName = cn('transition-colors', className);

    switch (status) {
      case 'armed':
        return (
          <Shield 
            className={cn(iconClassName, 'text-green-600')} 
            size={size}
            aria-label={t('alarm.armed')}
          />
        );
      case 'critical':
        return (
          <Bell 
            className={cn(iconClassName, 'text-red-600 animate-pulse')} 
            size={size}
            aria-label={t('alarm.critical')}
          />
        );
      case 'completed':
        return (
          <CheckCircle2 
            className={cn(iconClassName, 'text-gray-500')} 
            size={size}
            aria-label={t('alarm.completed')}
          />
        );
    }
  };

  // Get tooltip text based on status
  const getTooltipText = () => {
    switch (status) {
      case 'armed':
        return t('alarm.tooltip.armed');
      case 'critical':
        return t('alarm.tooltip.critical', { days });
      case 'completed':
        // Try to get contacted date if available (would need to be added to ReminderWithDetails)
        return t('alarm.tooltip.completed');
      default:
        return '';
    }
  };

  const icon = renderIcon();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center justify-center">
            {icon}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
