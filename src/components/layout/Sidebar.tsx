import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ROUTES } from '../../config/constants';
import {
  LayoutDashboard,
  Home,
  Users,
  Users2,
  UserCheck,
  Bell,
  UserPlus,
  Handshake,
  LogOut,
  X,
  Calendar,
  DollarSign,
  UserCircle,
  FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { key: 'dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { key: 'owners', href: ROUTES.OWNERS, icon: Users },
  { key: 'properties', href: ROUTES.PROPERTIES, icon: Home },
  { key: 'tenants', href: ROUTES.TENANTS, icon: UserCheck },
  { key: 'contracts', href: ROUTES.CONTRACTS_HUB, icon: FileText },
  { key: 'calendar', href: ROUTES.CALENDAR, icon: Calendar },
  { key: 'leads', href: ROUTES.LEADS, icon: UserPlus },
  { key: 'deals', href: ROUTES.DEALS, icon: Handshake },
  { key: 'reminders', href: ROUTES.REMINDERS, icon: Bell },
  { key: 'finance', href: ROUTES.FINANCE, icon: DollarSign },
  { key: 'team', href: ROUTES.TEAM, icon: Users2, ownerOnly: true },
  { key: 'profile', href: ROUTES.PROFILE, icon: UserCircle },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { t } = useTranslation('navigation');
  const { signOut } = useAuth();
  const { currentOrg, isOwner } = useOrg();
  const { reminderCount, unreadMatchesCount } = useNotifications();

  // Filter navigation items based on user role
  const filteredNavigationItems = navigationItems.filter(
    (item) => !item.ownerOnly || isOwner
  );

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
        <div className="flex items-center justify-between px-5 h-[72px] border-b border-gray-200/50 bg-blue-600 shadow-lg shrink-0">
          <div className="flex flex-col">
            <span className="font-bold text-white text-lg tracking-tight">RealDesk US</span>
            {currentOrg && (
              <span className="text-white/70 text-xs truncate max-w-[180px]">
                {currentOrg.name}
              </span>
            )}
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
          {filteredNavigationItems.map((item) => (
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
                  {item.key === 'leads' && unreadMatchesCount > 0 && (
                    <Badge
                      className={cn(
                        'ml-auto h-5 px-2.5 text-xs font-bold shadow-md',
                        isActive
                          ? 'bg-white text-blue-700'
                          : 'bg-blue-600 text-white'
                      )}
                      aria-label={`${unreadMatchesCount} ${t('leads')}`}
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
