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
    <div className="flex flex-col items-center gap-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-background p-6 shadow-lg md:flex-row md:items-start">
      {/* Avatar */}
      <Avatar className="h-20 w-20 border-4 border-card shadow-xl md:h-32 md:w-32">
        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/90 text-3xl font-bold text-primary-foreground md:text-4xl">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-muted-foreground">
          {user?.email?.split('@')[0] || t('userInfo.defaultUsername')}
        </h1>
        <p className="text-base text-muted-foreground dark:text-muted-foreground mt-1">
          {user?.email}
        </p>
        {joinDate && (
          <p className="text-sm text-muted-foreground dark:text-muted-foreground/70 mt-2">
            {t('userInfo.memberSince', { date: joinDate })}
          </p>
        )}
      </div>
    </div>
  );
};
