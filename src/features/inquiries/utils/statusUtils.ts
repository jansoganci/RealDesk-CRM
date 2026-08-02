import { COLORS } from '@/config/colors';

/**
 * Badge styles for lead / inquiry pipeline status (`property_inquiries.status`).
 * Mapping: new/matched → primary · contacted → warning · qualified → info ·
 * active → success · under_contract → warning · closed_won/converted → success ·
 * closed_lost → destructive · closed → muted
 */
export function getLeadStatusBadgeClasses(status: string): string {
  const statusColors: Record<string, string> = {
    new: `${COLORS.primary.bg} text-primary-foreground`,
    contacted: `${COLORS.warning.bg} text-warning-foreground`,
    qualified: `${COLORS.info.bg} text-info-foreground`,
    active: `${COLORS.success.bg} text-success-foreground`,
    matched: `${COLORS.primary.bg} text-primary-foreground`,
    under_contract: `${COLORS.warning.bg} text-warning-foreground`,
    closed_won: `${COLORS.success.bg} text-success-foreground`,
    closed_lost: `${COLORS.danger.bg} text-destructive-foreground`,
    converted: `${COLORS.success.bg} text-success-foreground`,
    closed: `${COLORS.status.inactive.bg} ${COLORS.text.white}`,
  };
  return statusColors[status] || `${COLORS.status.inactive.bg} ${COLORS.text.white}`;
}

/** @deprecated Use {@link getLeadStatusBadgeClasses} */
export const getInquiryStatusBadgeClasses = getLeadStatusBadgeClasses;
