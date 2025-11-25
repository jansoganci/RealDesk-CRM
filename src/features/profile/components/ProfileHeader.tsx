import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import type { User } from '@supabase/supabase-js';
import type { UseFormReturn } from 'react-hook-form';
import type { getProfileSchema } from '../profileSchema';
import type * as z from 'zod';

/**
 * Profile Header Component
 * Displays user avatar, email, full name/phone preview, and user ID badge
 */

type ProfileFormData = z.infer<ReturnType<typeof getProfileSchema>>;

interface ProfileHeaderProps {
  user: User | null;
  form: UseFormReturn<ProfileFormData>;
}

export function ProfileHeader({ user, form }: ProfileHeaderProps) {
  const { t } = useTranslation('profile');

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex items-start gap-4 pb-4 border-b">
      <Avatar className="h-14 w-14 border-2 border-gray-200">
        <AvatarFallback className="text-lg font-semibold bg-blue-600 text-white">
          {getUserInitials()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div>
          <p className="text-xs text-gray-500">{t('profile:fields.email')}</p>
          <p className="text-sm font-medium text-slate-900">
            {user?.email || t('profile:fields.notAvailable')}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-gray-500">{t('profile:fields.fullName')}: </span>
            <span className="text-slate-700">
              {form.watch('full_name') || t('profile:fields.notSet')}
            </span>
          </div>
          <div>
            <span className="text-gray-500">{t('profile:fields.phoneNumber')}: </span>
            <span className="text-slate-700">
              {form.watch('phone_number') || t('profile:fields.notSet')}
            </span>
          </div>
        </div>
        <Badge variant="secondary" className="font-mono text-xs mt-1">
          ID: {user?.id.substring(0, 12)}...
        </Badge>
      </div>
    </div>
  );
}

