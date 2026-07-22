import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'pending';
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge = memo(({
  status,
  showIcon = true,
  size = 'md',
  className
}: StatusBadgeProps) => {
  const { t } = useTranslation('team');

  const isActive = status === 'active';

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
        isActive
          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800'
          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        className
      )}
    >
      {showIcon && (
        isActive
          ? <CheckCircle2 className={cn(iconSize, 'mr-1')} />
          : <Clock className={cn(iconSize, 'mr-1')} />
      )}
      {t(`status.${status}`)}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';
