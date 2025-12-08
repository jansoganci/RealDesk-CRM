
import { useEffect, useState, useRef } from 'react';
import { meetingsService } from '@/lib/serviceProxy';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const NOTIFICATION_CHECK_INTERVAL = 60 * 1000; // 1 minute

// Check if Notification API is available
const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const useMeetingNotifications = () => {
  const { user, meetingReminderMinutes } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    isNotificationSupported() ? Notification.permission : 'unsupported'
  );
  const notifiedMeetingIds = useRef(new Set<string>());

  // Use user's meeting reminder preference from AuthContext
  const reminderMinutes = meetingReminderMinutes;

  useEffect(() => {
    // Early return if notifications are not supported or user is not logged in
    if (!user || !isNotificationSupported()) {
      console.log('[Notifications] Not supported or user not logged in');
      return;
    }

    const requestPermission = async () => {
      try {
        if (permission !== 'granted') {
          const newPermission = await Notification.requestPermission();
          setPermission(newPermission);
        }
      } catch (error) {
        console.error('[Notifications] Failed to request permission:', error);
        setPermission('denied');
      }
    };

    requestPermission();

    const checkMeetings = async () => {
      if (permission !== 'granted' || !isNotificationSupported()) return;

      try {
        const upcomingMeetings = await meetingsService.getUpcoming(10);
        const now = new Date();

        upcomingMeetings.forEach(meeting => {
          const meetingTime = new Date(meeting.start_time);
          const timeDifference = (meetingTime.getTime() - now.getTime()) / (1000 * 60);

          if (
            timeDifference > 0 &&
            timeDifference <= reminderMinutes &&
            !notifiedMeetingIds.current.has(meeting.id)
          ) {
            try {
              new Notification(`Upcoming Meeting: ${meeting.title}`, {
                body: `Your meeting is in ${formatDistanceToNow(meetingTime)}. Notes: ${meeting.notes || 'None'}`,
                tag: meeting.id, // Use meeting ID as tag to prevent duplicate notifications
              });
              notifiedMeetingIds.current.add(meeting.id);
            } catch (error) {
              console.error('[Notifications] Failed to create notification:', error);
            }
          }
        });
      } catch (error) {
        console.error('[Notifications] Failed to check for meeting notifications:', error);
      }
    };

    // Check immediately and then set an interval
    checkMeetings();
    const intervalId = setInterval(checkMeetings, NOTIFICATION_CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [user, permission, reminderMinutes]);

  return { permission };
};
