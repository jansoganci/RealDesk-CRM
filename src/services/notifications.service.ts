import { supabase } from '@/config/supabase';
import { getActiveOrgId } from '@/lib/orgHelpers';
import { getAuthenticatedUserId } from '@/lib/auth';
import { handleServiceError } from '@/lib/handleServiceError';
import type { Notification } from '@/types';

const NOTIFICATIONS_TABLE = 'notifications' as never;
const PRIORITY_ORDER: Record<string, number> = {
  overdue: 1,
  due_today: 2,
  due_3d: 3,
  closing_soon: 4,
  prerequisite_missing: 5,
  waiting_on_others: 6,
  due_7d: 7,
};

function byNotificationPriority(a: Notification, b: Notification): number {
  const pa = PRIORITY_ORDER[a.alert_type] ?? 99;
  const pb = PRIORITY_ORDER[b.alert_type] ?? 99;
  if (pa !== pb) return pa - pb;
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

class NotificationsService {
  async getUnread(): Promise<Notification[]> {
    try {
      const [orgId, userId] = await Promise.all([getActiveOrgId(), getAuthenticatedUserId()]);

      const { data, error } = await supabase
        .from(NOTIFICATIONS_TABLE)
        .select('*')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .eq('is_read', false)
        .eq('is_dismissed', false)
        .or('snoozed_until.is.null,snoozed_until.lt.now()')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ((data ?? []) as unknown as Notification[]).sort(byNotificationPriority);
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch unread notifications');
    }
  }

  async getAll(limit = 50): Promise<Notification[]> {
    try {
      const [orgId, userId] = await Promise.all([getActiveOrgId(), getAuthenticatedUserId()]);

      const { data, error } = await supabase
        .from(NOTIFICATIONS_TABLE)
        .select('*')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return ((data ?? []) as unknown as Notification[]).sort(byNotificationPriority);
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch notifications');
    }
  }

  async markRead(id: string): Promise<Notification> {
    try {
      const [orgId, userId] = await Promise.all([getActiveOrgId(), getAuthenticatedUserId()]);

      const { data, error } = await supabase
        .from(NOTIFICATIONS_TABLE)
        .update({ is_read: true } as never)
        .eq('id', id)
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data as unknown as Notification;
    } catch (error) {
      throw handleServiceError(error, 'Failed to mark notification as read');
    }
  }

  async markAllRead(): Promise<void> {
    try {
      const [orgId, userId] = await Promise.all([getActiveOrgId(), getAuthenticatedUserId()]);

      const { error } = await supabase
        .from(NOTIFICATIONS_TABLE)
        .update({ is_read: true } as never)
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      throw handleServiceError(error, 'Failed to mark all notifications as read');
    }
  }

  async dismiss(id: string): Promise<Notification> {
    try {
      const [orgId, userId] = await Promise.all([getActiveOrgId(), getAuthenticatedUserId()]);

      const { data, error } = await supabase
        .from(NOTIFICATIONS_TABLE)
        .update({ is_dismissed: true } as never)
        .eq('id', id)
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data as unknown as Notification;
    } catch (error) {
      throw handleServiceError(error, 'Failed to dismiss notification');
    }
  }

  async snooze(id: string, hours: number): Promise<Notification> {
    try {
      const [orgId, userId] = await Promise.all([getActiveOrgId(), getAuthenticatedUserId()]);
      const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from(NOTIFICATIONS_TABLE)
        .update({ snoozed_until: snoozedUntil } as never)
        .eq('id', id)
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data as unknown as Notification;
    } catch (error) {
      throw handleServiceError(error, 'Failed to snooze notification');
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const [orgId, userId] = await Promise.all([getActiveOrgId(), getAuthenticatedUserId()]);

      const { count, error } = await supabase
        .from(NOTIFICATIONS_TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .eq('is_read', false)
        .eq('is_dismissed', false)
        .or('snoozed_until.is.null,snoozed_until.lt.now()');

      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch unread notification count');
    }
  }
}

export const notificationsService = new NotificationsService();
