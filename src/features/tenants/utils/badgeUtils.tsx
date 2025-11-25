import { Badge } from '@/components/ui/badge';
import { getStatusBadgeClasses } from '@/config/colors';
import type { TenantWithProperty } from '@/types';
import { useTranslation } from 'react-i18next';

/**
 * Assignment Badge Utility
 * Provides a reusable function to render assignment badges for tenants
 */

export function getAssignmentBadge(tenant: TenantWithProperty) {
  // This function uses useTranslation, so it needs to be called within a component
  // For this reason, we export a component instead of a pure function
  return <TenantAssignmentBadge tenant={tenant} />;
}

interface TenantAssignmentBadgeProps {
  tenant: TenantWithProperty;
}

export function TenantAssignmentBadge({ tenant }: TenantAssignmentBadgeProps) {
  const { t } = useTranslation('tenants');

  if (tenant.property) {
    return <Badge className={getStatusBadgeClasses('assigned')}>{t('status.assigned')}</Badge>;
  }
  return <Badge className={getStatusBadgeClasses('unassigned')}>{t('status.unassigned')}</Badge>;
}

