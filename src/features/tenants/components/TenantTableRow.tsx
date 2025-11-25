import { useTranslation } from 'react-i18next';
import { TableCell, TableRow } from '@/components/ui/table';
import { TableActionButtons } from '@/components/common/TableActionButtons';
import { Phone, Mail, Building2, UserX, CalendarPlus } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { TenantAssignmentBadge } from '../utils/badgeUtils';
import type { TenantWithProperty } from '@/types';

interface TenantTableRowProps {
  tenant: TenantWithProperty;
  onEdit: (tenant: TenantWithProperty) => void;
  onDelete: (tenant: TenantWithProperty) => void;
  onScheduleMeeting: (tenant: TenantWithProperty) => void;
}

export function TenantTableRow({
  tenant,
  onEdit,
  onDelete,
  onScheduleMeeting,
}: TenantTableRowProps) {
  const { t } = useTranslation('tenants');

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{tenant.name}</div>
          {tenant.notes && (
            <div className={`text-xs ${COLORS.muted.textLight} mt-1 line-clamp-1`}>
              {tenant.notes}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          {tenant.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className={`h-3 w-3 ${COLORS.muted.textLight}`} />
              <span className={`${COLORS.gray.text600}`}>{tenant.phone}</span>
            </div>
          )}
          {tenant.email && (
            <div className="flex items-center gap-2 text-sm min-w-0">
              <Mail className={`h-3 w-3 ${COLORS.muted.textLight} flex-shrink-0`} />
              <span className={`${COLORS.gray.text600} truncate max-w-[150px] md:max-w-[250px]`}>{tenant.email}</span>
            </div>
          )}
          {!tenant.phone && !tenant.email && (
            <span className={`${COLORS.muted.textLight} text-sm`}>-</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        {tenant.property ? (
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Building2 className={`h-3 w-3 ${COLORS.primary.text} flex-shrink-0`} />
            <span className={`${COLORS.gray.text700} truncate max-w-[150px] md:max-w-[250px]`}>{tenant.property.address}</span>
          </div>
        ) : (
          <div className={`flex items-center gap-2 text-sm ${COLORS.muted.textLight}`}>
            <UserX className="h-3 w-3" />
            <span>{t('noProperty')}</span>
          </div>
        )}
      </TableCell>
      <TableCell>
        <TenantAssignmentBadge tenant={tenant} />
      </TableCell>
      <TableCell>
        <TableActionButtons
          onEdit={() => onEdit(tenant)}
          onDelete={() => onDelete(tenant)}
          showView={false}
          customActions={[
            {
              icon: <CalendarPlus className="h-4 w-4" />,
              tooltip: t('scheduleMeeting'),
              onClick: () => onScheduleMeeting(tenant),
            },
          ]}
        />
      </TableCell>
    </TableRow>
  );
}

