
import { useEffect, useState, useRef } from 'react';
import { meetingsService } from '@/lib/serviceProxy';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const NOTIFICATION_CHECK_INTERVAL = 60 * 1000; // 1 minute

export const useMeetingNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState(Notification.permission);
  const notifiedMeetingIds = useRef(new Set<string>());

  // TODO: Fetch this preference from AuthContext/user_preferences
  const reminderMinutes = 30; 

  useEffect(() => {
    if (!user) return;

    const requestPermission = async () => {
      if (permission !== 'granted') {
        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);
      }
    };

    requestPermission();

    const checkMeetings = async () => {
      if (permission !== 'granted') return;

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
            new Notification(`Upcoming Meeting: ${meeting.title}` , {
              body: `Your meeting is in ${formatDistanceToNow(meetingTime)}. Notes: ${meeting.notes || 'None'}`,
              tag: meeting.id, // Use meeting ID as tag to prevent duplicate notifications
            });
            notifiedMeetingIds.current.add(meeting.id);
          }
        });
      } catch (error) {
        console.error('Failed to check for meeting notifications:', error);
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
