import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { ROUTES } from '../../config/constants';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Home,
  Users2,
  Bell,
  UserPlus,
  Handshake,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  X,
  Calendar,
  CalendarDays,
  DollarSign,
  FileText,
  ClipboardCheck,
  Landmark,
  Shield,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItemConfig {
  key: string;
  href: string;
  icon: LucideIcon;
  ownerOnly?: boolean;
}

interface NavigationGroupConfig {
  label: string;
  items: NavigationItemConfig[];
}

const navigationGroups: NavigationGroupConfig[] = [
  {
    label: 'navGroup.crmCore',
    items: [
      { key: 'dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
      { key: 'leads', href: ROUTES.LEADS, icon: UserPlus },
      { key: 'deals', href: ROUTES.DEALS, icon: Handshake },
      { key: 'timeline', href: ROUTES.TIMELINE, icon: CalendarDays },
      { key: 'calendar', href: ROUTES.CALENDAR, icon: Calendar },
    ],
  },
  {
    label: 'navGroup.properties',
    items: [
      { key: 'properties', href: ROUTES.PROPERTIES, icon: Home },
      { key: 'contracts', href: ROUTES.CONTRACTS_HUB, icon: FileText },
    ],
  },
  {
    label: 'navGroup.rentalTools',
    items: [
      { key: 'screening', href: ROUTES.SCREENING, icon: ClipboardCheck },
      { key: 'deposits', href: ROUTES.DEPOSIT_TRACKER, icon: Landmark },
    ],
  },
  {
    label: 'navGroup.management',
    items: [
      { key: 'reminders', href: ROUTES.REMINDERS, icon: Bell },
      { key: 'finance', href: ROUTES.FINANCE, icon: DollarSign },
      { key: 'compliance', href: ROUTES.CCPA_DASHBOARD, icon: Shield },
      { key: 'team', href: ROUTES.TEAM, icon: Users2, ownerOnly: true },
    ],
  },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { t } = useTranslation('navigation');
  const { signOut, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { currentOrg, isOwner } = useOrg();
  const { reminderCount, unreadMatchesCount } = useNotifications();

  const filteredNavigationGroups = navigationGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.ownerOnly || isOwner),
  }));

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
          'fixed inset-0 bg-foreground/50 z-40 lg:hidden transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-card dark:bg-background border-r border-border/50 z-50 transition-transform duration-300 ease-in-out w-64 flex flex-col shadow-luxury',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )} 
      >
        <div className="flex items-center justify-between px-5 h-[72px] border-b border-white/10 bg-[#0D1B2A] shadow-lg shrink-0">
          <div className="flex flex-col">
            <img src="/brand/closewell-logo-dark.png" alt="Closewell" className="h-8 w-auto" />
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

        <nav className="flex-1 p-4 overflow-y-auto">
          {filteredNavigationGroups.map((group, groupIndex) =>
            group.items.length === 0 ? null : (
              <div
                key={group.label}
                className={cn('space-y-1.5', groupIndex > 0 && 'mt-6')}
              >
                <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(group.label)}
                </p>
                {group.items.map((item) => (
                  <NavLink
                    key={item.key}
                    to={item.href}
                    onClick={() => onClose()}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground hover:text-primary-foreground shadow-md transform scale-[1.02]'
                          : 'text-foreground/80 hover:bg-muted hover:text-foreground hover:shadow-md'
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
                                ? 'bg-primary-foreground text-primary'
                                : 'bg-primary text-primary-foreground'
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
                                ? 'bg-primary-foreground text-destructive'
                                : 'bg-destructive text-destructive-foreground'
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
              </div>
            )
          )}
        </nav>

        <div className="p-4 border-t border-border/50 bg-muted/80">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between gap-2 font-semibold transition-all shadow-sm hover:shadow-md h-auto py-2.5 px-3"
              >
                <span className="truncate text-left text-sm">
                  {user?.email ?? t('profile')}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="top"
              className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 z-[60]"
            >
              <DropdownMenuItem asChild>
                <Link to={ROUTES.PROFILE} onClick={() => onClose()}>
                  {t('viewProfile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-default gap-3 focus:bg-accent"
                onSelect={(e) => e.preventDefault()}
              >
                {isDark ? (
                  <Moon className="h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <Sun className="h-4 w-4 shrink-0" aria-hidden />
                )}
                <span className="flex-1">{t('darkMode')}</span>
                <Switch
                  checked={isDark}
                  onCheckedChange={() => toggleTheme()}
                  aria-label={t('darkMode')}
                />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => {
                  void handleSignOut();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" aria-hidden />
                {t('signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
};
