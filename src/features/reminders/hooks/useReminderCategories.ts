import { useState, useEffect, useMemo } from 'react';
import { remindersService } from '../../../lib/serviceProxy';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';

/**
 * Reminder Categorization Hook
 * Handles categorization of reminders into categories and tab initialization logic
 * 
 * Updated for Contract Expiry Control Center:
 * - Uses new categorization (critical, underWatch, completed)
 * - Maintains backward compatibility with old structure
 */

interface UseReminderCategoriesOptions {
  reminders: ReminderWithDetails[];
  useNewCategorization?: boolean; // Default: false (backward compatible)
}

interface UseReminderCategoriesReturn {
  // Old structure (backward compatible)
  overdueReminders: ReminderWithDetails[];
  upcomingReminders: ReminderWithDetails[];
  scheduledReminders: ReminderWithDetails[];
  expiredContracts: ReminderWithDetails[];
  // New structure (Contract Expiry Control Center)
  criticalReminders: ReminderWithDetails[];
  underWatchReminders: ReminderWithDetails[];
  completedReminders: ReminderWithDetails[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/**
 * Hook for categorizing reminders and managing tab state
 * Automatically selects the first tab with content on initial load
 * 
 * Supports both old and new categorization for gradual migration
 */
export function useReminderCategories({
  reminders,
  useNewCategorization = false,
}: UseReminderCategoriesOptions): UseReminderCategoriesReturn {
  const [activeTab, setActiveTab] = useState<string>('');
  const [tabInitialized, setTabInitialized] = useState(false);

  // Old categorization (backward compatible)
  const {
    overdue: overdueReminders,
    upcoming: upcomingReminders,
    scheduled: scheduledReminders,
    expired: expiredContracts,
  } = useMemo(() => {
    return remindersService.categorizeReminders(reminders);
  }, [reminders]);

  // New categorization (Contract Expiry Control Center)
  const {
    critical: criticalReminders,
    underWatch: underWatchReminders,
    completed: completedReminders,
  } = useMemo(() => {
    return remindersService.categorizeRemindersNew(reminders);
  }, [reminders]);

  // Set default tab based on available reminders (only once on initial load)
  useEffect(() => {
    if (!tabInitialized && reminders.length > 0) {
      if (useNewCategorization) {
        // New tab structure: Critical → Under Watch → Completed
        if (criticalReminders.length > 0) {
          setActiveTab('critical');
        } else if (underWatchReminders.length > 0) {
          setActiveTab('underWatch');
        } else if (completedReminders.length > 0) {
          setActiveTab('completed');
        } else {
          setActiveTab('critical');
        }
      } else {
        // Old tab structure: Overdue → Upcoming → Scheduled → Expired
        if (overdueReminders.length > 0) {
          setActiveTab('overdue');
        } else if (upcomingReminders.length > 0) {
          setActiveTab('upcoming');
        } else if (scheduledReminders.length > 0) {
          setActiveTab('scheduled');
        } else if (expiredContracts.length > 0) {
          setActiveTab('expired');
        } else {
          setActiveTab('overdue');
        }
      }
      setTabInitialized(true);
    }
  }, [
    reminders.length,
    overdueReminders.length,
    upcomingReminders.length,
    scheduledReminders.length,
    expiredContracts.length,
    criticalReminders.length,
    underWatchReminders.length,
    completedReminders.length,
    tabInitialized,
    useNewCategorization,
  ]);

  return {
    // Old structure (backward compatible)
    overdueReminders,
    upcomingReminders,
    scheduledReminders,
    expiredContracts,
    // New structure
    criticalReminders,
    underWatchReminders,
    completedReminders,
    activeTab,
    setActiveTab,
  };
}

