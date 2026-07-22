import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrgRole } from '@/types/org';

interface RoleBadgeProps {
  role: OrgRole;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const RoleBadge = memo(({
  role,
  showIcon = true,
  size = 'md',
  className
}: RoleBadgeProps) => {
  const { t } = useTranslation('team');

  const isOwner = role === 'owner';

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-0.5 text-xs';

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <Badge
      variant="outline"
      className={cn(
        sizeClasses,
        'font-medium border',
        isOwner
          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
          : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
        className
      )}
    >
      {showIcon && (
        isOwner
          ? <Shield className={cn(iconSize, 'mr-1')} />
          : <User className={cn(iconSize, 'mr-1')} />
      )}
      {t(`roles.${role}`)}
    </Badge>
  );
});

RoleBadge.displayName = 'RoleBadge';
