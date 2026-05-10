import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

export const UserInfoHeader = () => {
  const { t } = useTranslation('profile');
  const { user } = useAuth();

  // Get initials from email
  const initials = user?.email?.charAt(0).toUpperCase() || 'U';

  // Format join date
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    : '';

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-xl border border-blue-200/50 dark:border-slate-600 shadow-lg dark:shadow-black/30">
      {/* Avatar */}
      <Avatar className="h-20 w-20 md:h-32 md:w-32 border-4 border-white dark:border-slate-700 shadow-xl dark:shadow-black/40">
        <AvatarFallback className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">
          {user?.email?.split('@')[0] || t('userInfo.defaultUsername')}
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 mt-1">
          {user?.email}
        </p>
        {joinDate && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {t('userInfo.memberSince', { date: joinDate })}
          </p>
        )}
      </div>
    </div>
  );
};
