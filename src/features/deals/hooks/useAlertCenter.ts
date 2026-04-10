import { useCallback, useEffect, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { notificationsService } from '@/lib/serviceProxy';
import type { Notification } from '@/types';

export function useAlertCenter(limit = 50) {
  const { currentOrg } = useOrg();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentOrg?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [rows, count] = await Promise.all([
        notificationsService.getAll(limit),
        notificationsService.getUnreadCount(),
      ]);
      setNotifications(rows);
      setUnreadCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    await notificationsService.markRead(id);
    await refresh();
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    await notificationsService.markAllRead();
    await refresh();
  }, [refresh]);

  const dismiss = useCallback(async (id: string) => {
    await notificationsService.dismiss(id);
    await refresh();
  }, [refresh]);

  const snooze = useCallback(async (id: string, hours: number) => {
    await notificationsService.snooze(id, hours);
    await refresh();
  }, [refresh]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
    dismiss,
    snooze,
  };
}
