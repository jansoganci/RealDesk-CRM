import { useState } from 'react';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';

/**
 * Reminder Dialog Hook
 * Handles contact dialog state management
 */

interface UseReminderDialogReturn {
  selectedReminder: ReminderWithDetails | null;
  showContactDialog: boolean;
  openContactDialog: (reminder: ReminderWithDetails) => void;
  closeContactDialog: () => void;
}

/**
 * Hook for managing reminder contact dialog state
 * Handles dialog open/close and selected reminder state
 */
export function useReminderDialog(): UseReminderDialogReturn {
  const [selectedReminder, setSelectedReminder] = useState<ReminderWithDetails | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);

  const openContactDialog = (reminder: ReminderWithDetails) => {
    setSelectedReminder(reminder);
    setShowContactDialog(true);
  };

  const closeContactDialog = () => {
    setShowContactDialog(false);
    setSelectedReminder(null);
  };

  return {
    selectedReminder,
    showContactDialog,
    openContactDialog,
    closeContactDialog,
  };
}

