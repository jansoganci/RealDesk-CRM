import { COLORS } from '@/config/colors';

/**
 * Badge styles for lead / inquiry pipeline status (`property_inquiries.status`).
 */
export function getLeadStatusBadgeClasses(status: string): string {
  const statusColors: Record<string, string> = {
    new: `${COLORS.primary.bg} ${COLORS.text.white}`,
    contacted: `${COLORS.warning.bg} ${COLORS.text.white}`,
    qualified: 'bg-purple-600 text-white',
    active: `${COLORS.success.bg} ${COLORS.text.white}`,
    matched: `${COLORS.primary.bg} ${COLORS.text.white}`,
    under_contract: 'bg-orange-600 text-white',
    closed_won: 'bg-emerald-600 text-white',
    closed_lost: 'bg-red-600 text-white',
    converted: 'bg-teal-700 text-white',
    closed: `${COLORS.status.inactive.bg} ${COLORS.text.white}`,
  };
  return statusColors[status] || `${COLORS.status.inactive.bg} ${COLORS.text.white}`;
}

/** @deprecated Use {@link getLeadStatusBadgeClasses} */
export const getInquiryStatusBadgeClasses = getLeadStatusBadgeClasses;
