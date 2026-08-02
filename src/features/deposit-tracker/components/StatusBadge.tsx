import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DepositStatus } from '@/lib/serviceProxy';

/** held=info · partial=warning · returned=success · disputed=destructive */
const STATUS_CLASSES: Record<DepositStatus, string> = {
  held: 'bg-info/15 text-info',
  partially_returned: 'bg-warning/15 text-warning',
  fully_returned: 'bg-success/15 text-success',
  disputed: 'bg-destructive/15 text-destructive',
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
