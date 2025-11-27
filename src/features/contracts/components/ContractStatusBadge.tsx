import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { getStatusBadgeClasses, COLORS } from '@/config/colors';
import { useTranslation } from 'react-i18next';

/**
 * Contract Status Badge Component
 * Renders a contract status badge with optional PDF indicator
 */

interface ContractStatusBadgeProps {
  status: string;
  hasPdf?: boolean;
  className?: string;
}

export function ContractStatusBadge({
  status,
  hasPdf = false,
  className,
}: ContractStatusBadgeProps) {
  const { t } = useTranslation('contracts');

  const statusConfig = {
    Active: { label: t('status.active'), className: getStatusBadgeClasses('active') },
    Inactive: { label: t('status.inactive'), className: getStatusBadgeClasses('inactive') },
    Archived: { label: t('status.archived'), className: getStatusBadgeClasses('archived') },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Active;

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Badge className={config.className}>
        {config.label}
      </Badge>
      {hasPdf && (
        <span title={t('table.pdfAttached')}>
          <FileText className={`h-4 w-4 ${COLORS.primary.text}`} />
        </span>
      )}
    </div>
  );
}

