import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DepositStatus } from '@/lib/serviceProxy';

const STATUS_CLASSES: Record<DepositStatus, string> = {
  held: 'bg-blue-100 text-blue-800',
  partially_returned: 'bg-amber-100 text-amber-800',
  fully_returned: 'bg-emerald-100 text-emerald-800',
  disputed: 'bg-red-100 text-red-700',
};

interface StatusBadgeProps {
  status: DepositStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const { t } = useTranslation('deposit-tracker');
  return (
    <Badge className={cn('text-xs font-medium', STATUS_CLASSES[status], className)}>
      {t(`status.${status}`)}
    </Badge>
  );
};
