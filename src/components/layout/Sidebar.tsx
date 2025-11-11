import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ROUTES, APP_NAME } from '../../config/constants';
import {
  Building2,
  LayoutDashboard,
  Home,
  Users,
  UserCheck,
  Bell,
  Search,
  LogOut,
  X,
  Calendar,
  DollarSign,
  UserCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { remindersService, inquiriesService } from '../../lib/serviceProxy';
import { COLORS } from '@/config/colors';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { key: 'dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { key: 'owners', href: ROUTES.OWNERS, icon: Users },
  { key: 'properties', href: ROUTES.PROPERTIES, icon: Home },
  { key: 'tenants', href: ROUTES.TENANTS, icon: UserCheck },
  { key: 'calendar', href: ROUTES.CALENDAR, icon: Calendar },
  { key: 'inquiries', href: ROUTES.INQUIRIES, icon: Search },
  { key: 'reminders', href: ROUTES.REMINDERS, icon: Bell },
  { key: 'finance', href: ROUTES.FINANCE, icon: DollarSign },
  { key: 'profile', href: ROUTES.PROFILE, icon: UserCircle },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { t } = useTranslation('navigation');
  const { signOut, user } = useAuth();
  const [reminderCount, setReminderCount] = useState(0);
  const [unreadMatchesCount, setUnreadMatchesCount] = useState(0);

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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-gray-900/50 z-40 lg:hidden transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-white border-r border-gray-200/50 z-50 transition-transform duration-300 ease-in-out w-64 flex flex-col shadow-luxury',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200/50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-xl shadow-gold">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">{APP_NAME}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden h-auto w-auto p-1.5 text-white hover:bg-white/20 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.href}
              onClick={() => onClose()}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-gold transform scale-[1.02]'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md'
                )
              }
              title={t(`viewAll${item.key.charAt(0).toUpperCase() + item.key.slice(1)}`)}
              aria-label={t(item.key)}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
                  <span className="flex-1">{t(item.key)}</span>
                  {item.key === 'inquiries' && unreadMatchesCount > 0 && (
                    <Badge
                      className={cn(
                        'ml-auto h-5 px-2.5 text-xs font-bold shadow-md',
                        isActive
                          ? 'bg-white text-amber-700'
                          : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white'
                      )}
                      aria-label={`${unreadMatchesCount} ${t('inquiries')}`}
                    >
                      {unreadMatchesCount > 9 ? '9+' : unreadMatchesCount}
                    </Badge>
                  )}
                  {item.key === 'reminders' && reminderCount > 0 && (
                    <Badge
                      className={cn(
                        'ml-auto h-5 px-2.5 text-xs font-bold shadow-md',
                        isActive
                          ? 'bg-white text-amber-700'
                          : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                      )}
                      aria-label={`${reminderCount} ${t('reminders')}`}
                    >
                      {reminderCount > 9 ? '9+' : reminderCount}
                    </Badge>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200/50 bg-gradient-to-br from-slate-50 to-gray-50">
          <div className="flex items-center gap-3 mb-3 px-3 py-3 bg-white rounded-xl border border-gray-200/50 shadow-sm">
            <div
              className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 flex items-center justify-center shadow-lg"
              aria-label={t('userSettings')}
            >
              <span className="text-sm font-bold text-white">
                {user?.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold text-slate-900 truncate"
                title={user?.email}
                aria-label={`${t('userSettings')}: ${user?.email}`}
              >
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-slate-300 hover:bg-slate-100 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-semibold transition-all shadow-sm hover:shadow-md"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            {t('signOut')}
          </Button>
        </div>
      </aside>
    </>
  );
};
