/**
 * NotificationContext
 *
 * Centralizes badge count fetching for Navbar and Sidebar.
 * Eliminates duplicate network calls by providing a single source of truth
 * for reminder counts and unread inquiry matches counts.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { remindersService, inquiriesService } from '@/lib/serviceProxy';

// ============================================================================
// Types
// ============================================================================

interface NotificationContextValue {
  reminderCount: number;
  unreadMatchesCount: number;
  isLoading: boolean;
  error: string | null;
  refreshCounts: () => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const REFRESH_INTERVAL_MS = 60_000; // 60 seconds

// ============================================================================
// Context
// ============================================================================

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [reminderCount, setReminderCount] = useState(0);
  const [unreadMatchesCount, setUnreadMatchesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted to avoid state updates after unmount
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  const refreshCounts = useCallback(async () => {
    // Don't fetch if no user is logged in or already fetching
    if (!userId || isFetchingRef.current) {
      if (!userId) {
        setReminderCount(0);
        setUnreadMatchesCount(0);
        setIsLoading(false);
        setError(null);
      }
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const [reminders, unreadMatches] = await Promise.all([
        remindersService.getActiveReminders(),
        inquiriesService.getUnreadMatchesCount(),
      ]);

      // Only update state if still mounted
      if (isMountedRef.current) {
        setReminderCount(reminders.length);
        setUnreadMatchesCount(unreadMatches);
      }
    } catch (err) {
      console.error('[NotificationContext] Failed to load counts:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load notification counts');
      }
    } finally {
      isFetchingRef.current = false;
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  // Initial fetch and interval setup
  useEffect(() => {
    isMountedRef.current = true;

    // Fetch immediately on mount (if user exists)
    if (userId) {
      refreshCounts();
    }

    // Set up interval for periodic refresh
    const intervalId = setInterval(() => {
      if (userId) {
        refreshCounts();
      }
    }, REFRESH_INTERVAL_MS);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [userId, refreshCounts]);

  // Reset counts when user logs out
  useEffect(() => {
    if (!userId) {
      setReminderCount(0);
      setUnreadMatchesCount(0);
      setError(null);
    }
  }, [userId]);

  const value = useMemo(() => ({
    reminderCount,
    unreadMatchesCount,
    isLoading,
    error,
    refreshCounts,
  }), [reminderCount, unreadMatchesCount, isLoading, error, refreshCounts]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
