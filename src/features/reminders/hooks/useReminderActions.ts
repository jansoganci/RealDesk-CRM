import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { remindersService } from '../../../lib/serviceProxy';
import { useNotifications } from '../../../contexts/NotificationContext';

/**
 * Reminder Actions Hook
 * Handles reminder actions: mark as contacted
 */

interface UseReminderActionsOptions {
  refreshData: () => Promise<void>;
  onActionComplete?: () => void;
}

interface UseReminderActionsReturn {
  actionLoading: string | null;
  handleMarkAsContacted: (contractId: string) => Promise<void>;
}

/**
 * Hook for managing reminder actions
 * Handles mark as contacted action with per-reminder loading state
 */
export function useReminderActions({
  refreshData,
  onActionComplete,
}: UseReminderActionsOptions): UseReminderActionsReturn {
  const { t } = useTranslation('reminders');
  const { refreshCounts } = useNotifications(); // Get refreshCounts to update badge counts immediately
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleMarkAsContacted = useCallback(
    async (contractId: string) => {
      try {
        setActionLoading(contractId);
        await remindersService.markAsContacted(contractId);
        toast.success(t('toasts.markedContacted'));
        
        // Refresh both Reminders page data and NotificationContext badge counts
        await Promise.all([
          refreshData(), // Refresh Reminders page
          refreshCounts(), // Immediately update Bell icon and Sidebar counter
        ]);
        
        onActionComplete?.();
      } catch (error) {
        console.error('Failed to mark as contacted:', error);
        toast.error(t('toasts.updateFailed'));
      } finally {
        setActionLoading(null);
      }
    },
    [refreshData, refreshCounts, onActionComplete, t]
  );

  return {
    actionLoading,
    handleMarkAsContacted,
  };
}

