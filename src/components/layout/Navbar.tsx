import { Menu, Bell, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '@/config/colors';
import { ROUTES } from '@/config/constants';
import { useBilling } from '@/contexts/BillingContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { calculateTrialDaysRemaining } from '@/utils/trial';

interface NavbarProps {
  title: string;
  onMenuClick: () => void;
}

export const Navbar = ({ title, onMenuClick }: NavbarProps) => {
  const { t } = useTranslation('navigation');
  const { t: tBilling } = useTranslation('billing');
  const navigate = useNavigate();
  const { billingStatus } = useBilling();
  const { reminderCount, unreadMatchesCount } = useNotifications();
  const trialDaysRemaining = calculateTrialDaysRemaining(billingStatus?.trialEndsAt ?? null);
  const showTrialBadge = billingStatus?.isTrial;

  return (
    <header className={`sticky top-0 z-30 ${COLORS.card.bg} border-b ${COLORS.border.DEFAULT_class} shadow-sm`}>
      <div className="flex items-center justify-between gap-4 px-4 h-[72px] lg:px-6">
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
          {showTrialBadge && (
            <button
              className="hidden sm:flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-900 transition hover:bg-blue-100"
              onClick={() => navigate(ROUTES.PRICING)}
              aria-label={tBilling('trialReminder.badge', { count: trialDaysRemaining ?? 0 })}
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {tBilling('trialReminder.badge', { count: trialDaysRemaining ?? 0 })}
              </span>
            </button>
          )}

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
