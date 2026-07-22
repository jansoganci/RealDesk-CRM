import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { remindersService } from '../../../lib/serviceProxy';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * Contract Progress Bar Component
 * Shows visual progress of contract lifecycle with color zones
 * 
 * Color Zones:
 * - Green (0-70%): Safe zone
 * - Yellow (70-90%): Approaching
 * - Orange (90-95%): Entering critical
 * - Red (95-100%): Critical zone
 */

interface ContractProgressBarProps {
  reminder: ReminderWithDetails;
  showLabel?: boolean;
  showDaysUntilCritical?: boolean;
  className?: string;
}

export function ContractProgressBar({
  reminder,
  showLabel = true,
  showDaysUntilCritical = true,
  className,
}: ContractProgressBarProps) {
  const { t } = useTranslation('reminders');
  
  const progressInfo = useMemo(() => {
    return remindersService.calculateProgress(reminder);
  }, [reminder]);

  const { percentage, zone, daysUntilCritical } = progressInfo;

  // Determine color based on zone AND percentage
  // If 100% or expired, always red (expired, not success)
  const getColorClass = () => {
    // If 100% or expired, always red
    if (percentage >= 100 || reminder.days_until_end < 0) {
      return 'bg-red-500';
    }
    
    switch (zone) {
      case 'safe':
        return 'bg-green-500';
      case 'approaching':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-green-500';
    }
  };

  // Determine background color
  const getBgColorClass = () => {
    // If 100% or expired, always red background
    if (percentage >= 100 || reminder.days_until_end < 0) {
      return 'bg-red-100 dark:bg-red-950/50';
    }
    
    switch (zone) {
      case 'safe':
        return 'bg-green-100 dark:bg-green-950/40';
      case 'approaching':
        return 'bg-yellow-100 dark:bg-yellow-950/40';
      case 'critical':
        return 'bg-red-100 dark:bg-red-950/50';
      default:
        return 'bg-green-100 dark:bg-green-950/40';
    }
  };

  const progressBar = (
    <div className={cn('w-full space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {percentage >= 100 || reminder.days_until_end < 0 ? (
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
              {t('progress.expired')}
            </span>
          ) : (
            <span>{t('progress.contractProgress', { percentage: Math.round(percentage) })}</span>
          )}
          {showDaysUntilCritical && daysUntilCritical > 0 && (
            <span className="text-xs">
              {t('progress.daysUntilCritical', { days: daysUntilCritical })}
            </span>
          )}
          {showDaysUntilCritical && daysUntilCritical <= 0 && percentage < 100 && reminder.days_until_end >= 0 && (
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
              {t('progress.inCriticalZone')}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <Progress 
          value={percentage} 
          className={cn(showLabel ? 'h-2' : 'h-1', getBgColorClass())}
        />
        <div 
          className={cn('absolute top-0 left-0 rounded-full transition-all duration-500', showLabel ? 'h-2' : 'h-1', getColorClass())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );

  // Add tooltip if in critical zone
  if (zone === 'critical' || daysUntilCritical <= 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {progressBar}
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('progress.tooltip.critical', { days: reminder.days_until_end })}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return progressBar;
}
