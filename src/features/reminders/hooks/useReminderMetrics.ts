import { useMemo } from 'react';
import { remindersService } from '../../../lib/serviceProxy';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';

/**
 * Reminder Metrics Hook
 * Calculates summary metrics and trends for reminders
 * 
 * Metrics:
 * - Total Active: All reminders with reminder enabled (not contacted)
 * - Critical: Reminders in critical zone (<= 30 days or overdue)
 * - Pending Actions: Critical reminders that haven't been contacted
 * - Completion Rate: Percentage of reminders that have been contacted
 */

export interface ReminderMetrics {
  totalActive: number;
  critical: number;
  pendingActions: number;
  completionRate: number;
  underWatch: number;
  completed: number;
  trends?: {
    totalActive?: { value: number; isPositive: boolean };
    critical?: { value: number; isPositive: boolean };
    pendingActions?: { value: number; isPositive: boolean };
  };
}

interface UseReminderMetricsOptions {
  reminders: ReminderWithDetails[];
  previousReminders?: ReminderWithDetails[]; // Optional: for trend calculation
}

interface UseReminderMetricsReturn {
  metrics: ReminderMetrics;
  isLoading: boolean;
}

/**
 * Hook for calculating reminder metrics
 * Supports trend calculation if previousReminders is provided
 */
export function useReminderMetrics({
  reminders,
  previousReminders,
}: UseReminderMetricsOptions): UseReminderMetricsReturn {
  
  const metrics = useMemo(() => {
    // Categorize reminders using new method
    const categorized = remindersService.categorizeRemindersNew(reminders);
    
    // Calculate current metrics
    const totalActive = reminders.filter(
      (r) => r.rent_increase_reminder_enabled && !r.rent_increase_reminder_contacted
    ).length;

    const critical = categorized.critical.length;
    const pendingActions = categorized.critical.filter(
      (r) => !r.rent_increase_reminder_contacted
    ).length;
    
    const underWatch = categorized.underWatch.length;
    const completed = categorized.completed.length;
    
    // Calculate completion rate
    const totalWithReminderEnabled = reminders.filter(
      (r) => r.rent_increase_reminder_enabled
    ).length;
    
    const completionRate = totalWithReminderEnabled > 0
      ? Math.round((completed / totalWithReminderEnabled) * 100)
      : 0;

    // Calculate trends if previousReminders is provided
    let trends: ReminderMetrics['trends'] | undefined;
    
    if (previousReminders) {
      const previousCategorized = remindersService.categorizeRemindersNew(previousReminders);
      
      const previousTotalActive = previousReminders.filter(
        (r) => r.rent_increase_reminder_enabled && !r.rent_increase_reminder_contacted
      ).length;
      
      const previousCritical = previousCategorized.critical.length;
      const previousPendingActions = previousCategorized.critical.filter(
        (r) => !r.rent_increase_reminder_contacted
      ).length;

      trends = {
        totalActive: {
          value: totalActive - previousTotalActive,
          isPositive: totalActive < previousTotalActive, // Lower is better (fewer active = more completed)
        },
        critical: {
          value: critical - previousCritical,
          isPositive: critical < previousCritical, // Lower is better
        },
        pendingActions: {
          value: pendingActions - previousPendingActions,
          isPositive: pendingActions < previousPendingActions, // Lower is better
        },
      };
    }

    return {
      totalActive,
      critical,
      pendingActions,
      completionRate,
      underWatch,
      completed,
      trends,
    };
  }, [reminders, previousReminders]);

  return {
    metrics,
    isLoading: false, // Metrics are calculated synchronously
  };
}
