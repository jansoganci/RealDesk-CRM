import { useState, useEffect, useMemo } from 'react';
import { remindersService } from '../../../lib/serviceProxy';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';

/**
 * Reminder Categorization Hook
 * Handles categorization of reminders into categories and tab initialization logic
 */

interface UseReminderCategoriesOptions {
  reminders: ReminderWithDetails[];
}

interface UseReminderCategoriesReturn {
  overdueReminders: ReminderWithDetails[];
  upcomingReminders: ReminderWithDetails[];
  scheduledReminders: ReminderWithDetails[];
  expiredContracts: ReminderWithDetails[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/**
 * Hook for categorizing reminders and managing tab state
 * Automatically selects the first tab with content on initial load
 */
export function useReminderCategories({
  reminders,
}: UseReminderCategoriesOptions): UseReminderCategoriesReturn {
  const [activeTab, setActiveTab] = useState<string>('');
  const [tabInitialized, setTabInitialized] = useState(false);

  // Categorize reminders using service method
  const {
    overdue: overdueReminders,
    upcoming: upcomingReminders,
    scheduled: scheduledReminders,
    expired: expiredContracts,
  } = useMemo(() => {
    return remindersService.categorizeReminders(reminders);
  }, [reminders]);

  // Set default tab based on available reminders (only once on initial load)
  useEffect(() => {
    if (!tabInitialized && reminders.length > 0) {
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
      setTabInitialized(true);
    }
  }, [
    reminders.length,
    overdueReminders.length,
    upcomingReminders.length,
    scheduledReminders.length,
    expiredContracts.length,
    tabInitialized,
  ]);

  return {
    overdueReminders,
    upcomingReminders,
    scheduledReminders,
    expiredContracts,
    activeTab,
    setActiveTab,
  };
}

