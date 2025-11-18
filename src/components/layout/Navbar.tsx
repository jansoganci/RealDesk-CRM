import { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { remindersService, inquiriesService } from '../../lib/serviceProxy';
import { COLORS } from '@/config/colors';

interface NavbarProps {
  title: string;
  onMenuClick: () => void;
}

export const Navbar = ({ title, onMenuClick }: NavbarProps) => {
  const { t } = useTranslation('navigation');
  const [reminderCount, setReminderCount] = useState(0);
  const [unreadMatchesCount, setUnreadMatchesCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadCounts();
    const interval = setInterval(loadCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadCounts = async () => {
    try {
      const [reminders, unreadMatches] = await Promise.all([
        remindersService.getActiveReminders(),
        inquiriesService.getUnreadMatchesCount(),
      ]);
      setReminderCount(reminders.length);
      setUnreadMatchesCount(unreadMatches);
    } catch (error) {
      console.error('Failed to load counts:', error);
    }
  };

  return (
    <header className={`sticky top-0 z-30 ${COLORS.card.bg} border-b ${COLORS.border.DEFAULT_class} shadow-sm`}>
      <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className={`text-xl font-semibold ${COLORS.gray.text900}`}>{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications Button - Square (like StatCard icons) */}
          {/* Mobile/Tablet: 44px for touch targets, Desktop: 40px for mouse */}
          <button
            className="h-11 w-11 md:h-10 md:w-10 relative flex items-center justify-center rounded-md border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => navigate('/reminders')}
            aria-label={t('notifications')}
          >
            <Bell className="h-6 w-6" />
            {(reminderCount + unreadMatchesCount) > 0 && (
              <Badge className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 ${COLORS.danger.bg} ${COLORS.text.white} text-xs border-2 border-white rounded-full`}>
                {(reminderCount + unreadMatchesCount) > 9 ? '9+' : (reminderCount + unreadMatchesCount)}
              </Badge>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
