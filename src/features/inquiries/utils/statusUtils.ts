import { COLORS } from '@/config/colors';

/**
 * Returns the CSS classes for an inquiry status badge
 */
export function getInquiryStatusBadgeClasses(status: string): string {
  const statusColors = {
    active: `${COLORS.success.bg} ${COLORS.text.white}`,
    matched: `${COLORS.primary.bg} ${COLORS.text.white}`,
    contacted: `${COLORS.warning.bg} ${COLORS.text.white}`,
    closed: `${COLORS.status.inactive.bg} ${COLORS.text.white}`,
  };
  return statusColors[status as keyof typeof statusColors] || `${COLORS.status.inactive.bg} ${COLORS.text.white}`;
}

