import { useTranslation } from 'react-i18next';
import { TableActionButtons } from '@/components/common/TableActionButtons';
import { Phone, Mail, Building2, UserX, CalendarPlus } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { TenantAssignmentBadge } from '../utils/badgeUtils';
import { useOrg } from '@/contexts/OrgContext';
import type { TenantWithProperty } from '@/types';

interface TenantCardProps {
  tenant: TenantWithProperty;
  onEdit: (tenant: TenantWithProperty) => void;
  onDelete: (tenant: TenantWithProperty) => void;
  onScheduleMeeting: (tenant: TenantWithProperty) => void;
}

export function TenantCard({
  tenant,
  onEdit,
  onDelete,
  onScheduleMeeting,
}: TenantCardProps) {
  const { t } = useTranslation(['tenants', 'common']);
  const { isMember } = useOrg();

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <span className={`font-semibold text-base ${COLORS.gray.text900} dark:text-slate-100`}>
            {tenant.name}
          </span>
          {tenant.notes && (
            <p className={`text-xs ${COLORS.gray.text500} dark:text-slate-400 mt-1 line-clamp-2`}>
              {tenant.notes}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <TenantAssignmentBadge tenant={tenant} />
        </div>
      </div>

      {/* Body */}
      <div className="space-y-2">
        {/* Property Info */}
        {tenant.property ? (
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Building2 className={`h-4 w-4 ${COLORS.primary.text} flex-shrink-0`} />
            <span className={`${COLORS.gray.text700} dark:text-slate-200 truncate`}>{tenant.property.address}</span>
          </div>
        ) : (
          <div className={`flex items-center gap-2 text-sm ${COLORS.muted.textLight} dark:text-slate-400`}>
            <UserX className="h-4 w-4" />
            <span>{t('noPropertyAssigned')}</span>
          </div>
        )}

        {/* Contact Actions - Clickable Icons */}
        <div className="flex items-center gap-2">
          {tenant.phone && (
            <a
              href={`tel:${tenant.phone}`}
              className="h-11 w-11 flex items-center justify-center rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-slate-800/70 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
              aria-label={t('callTenant')}
            >
              <Phone className="h-5 w-5" />
            </a>
          )}
          {tenant.email && (
            <a
              href={`mailto:${tenant.email}`}
              className="h-11 w-11 flex items-center justify-center rounded-md border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-slate-800/70 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              aria-label={t('emailTenant')}
            >
              <Mail className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>

      {/* Footer - Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-slate-800">
        <TableActionButtons
          onEdit={() => onEdit(tenant)}
          onDelete={() => onDelete(tenant)}
          showView={false}
          disabledEdit={isMember}
          disabledDelete={isMember}
          disabledEditTooltip={isMember ? t('common:readOnlyMode') : undefined}
          disabledDeleteTooltip={isMember ? t('common:readOnlyMode') : undefined}
          customActions={[
            {
              icon: <CalendarPlus className="h-4 w-4" />,
              tooltip: isMember ? t('common:readOnlyMode') : t('scheduleMeeting'),
              onClick: () => onScheduleMeeting(tenant),
              disabled: isMember,
            },
          ]}
        />
      </div>
    </div>
  );
}

