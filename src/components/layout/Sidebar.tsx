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
  UserCircle,
  FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { remindersService, inquiriesService } from '../../lib/serviceProxy';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { key: 'dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { key: 'owners', href: ROUTES.OWNERS, icon: Users },
  { key: 'properties', href: ROUTES.PROPERTIES, icon: Home },
  { key: 'tenants', href: ROUTES.TENANTS, icon: UserCheck },
  { key: 'contracts', href: ROUTES.CONTRACTS, icon: FileText },
  { key: 'calendar', href: ROUTES.CALENDAR, icon: Calendar },
  { key: 'inquiries', href: ROUTES.INQUIRIES, icon: Search },
  { key: 'reminders', href: ROUTES.REMINDERS, icon: Bell },
  { key: 'finance', href: ROUTES.FINANCE, icon: DollarSign },
  { key: 'profile', href: ROUTES.PROFILE, icon: UserCircle },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { t } = useTranslation('navigation');
  const { signOut } = useAuth();
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
        <div className="flex items-center justify-between p-5 border-b border-gray-200/50 bg-blue-600 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/20">
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
                    ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]'
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
                          ? 'bg-white text-blue-700'
                          : 'bg-blue-600 text-white'
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
                          ? 'bg-white text-blue-700'
                          : 'bg-red-600 text-white'
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

        <div className="p-4 border-t border-gray-200/50 bg-gray-50">
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
