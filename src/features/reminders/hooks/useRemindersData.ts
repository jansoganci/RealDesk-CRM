import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { remindersService } from '../../../lib/serviceProxy';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';

/**
 * Reminders Data Fetching Hook
 * Handles loading reminders data, managing loading state, error state, and providing refresh functionality
 */

interface UseRemindersDataReturn {
  reminders: ReminderWithDetails[];
  loading: boolean;
  errorKey: string | null;
  refreshData: () => Promise<void>;
}

/**
 * Hook for fetching and managing reminders data
 * Handles data loading, error handling with error keys, and provides refresh functionality
 */
export function useRemindersData(): UseRemindersDataReturn {
  const { t } = useTranslation('reminders');
  const [reminders, setReminders] = useState<ReminderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const loadReminders = useCallback(async () => {
    try {
      setLoading(true);
      setErrorKey(null);
      const data = await remindersService.getAllReminders();
      setReminders(data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
      setErrorKey('errors.loadDetailed');
      toast.error(t('toasts.loadFailed'));
      setReminders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load reminders on mount
  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  return {
    reminders,
    loading,
    errorKey,
    refreshData: loadReminders,
  };
}

