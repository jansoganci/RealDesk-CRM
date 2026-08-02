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
          <span className={`font-semibold text-base ${COLORS.gray.text900} dark:text-foreground`}>
            {tenant.name}
          </span>
          {tenant.notes && (
            <p className={`text-xs ${COLORS.gray.text500} dark:text-muted-foreground mt-1 line-clamp-2`}>
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
            <span className={`${COLORS.gray.text700} dark:text-foreground truncate`}>{tenant.property.address}</span>
          </div>
        ) : (
          <div className={`flex items-center gap-2 text-sm ${COLORS.muted.textLight} dark:text-muted-foreground`}>
            <UserX className="h-4 w-4" />
            <span>{t('noPropertyAssigned')}</span>
          </div>
        )}

        {/* Contact Actions - Clickable Icons */}
        <div className="flex items-center gap-2">
          {tenant.phone && (
            <a
              href={`tel:${tenant.phone}`}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-success/40 bg-success/15 text-success transition-colors hover:border-success/60 hover:bg-success/25"
              aria-label={t('callTenant')}
            >
              <Phone className="h-5 w-5" />
            </a>
          )}
          {tenant.email && (
            <a
              href={`mailto:${tenant.email}`}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary transition-colors hover:border-primary/60 hover:bg-primary/20"
              aria-label={t('emailTenant')}
            >
              <Mail className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>

      {/* Footer - Actions */}
      <div className="flex gap-2 pt-2 border-t border-border">
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
