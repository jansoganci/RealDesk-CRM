/**
 * Federal lead-based paint disclosure language for US residential **sale** PDFs.
 * Sources: 42 U.S.C. § 4852d; 24 CFR Part 35 (HUD/EPA).
 * English statutory text for PDF output (not UI i18n).
 */

export { EPA_LEAD_PAMPHLET_TITLE, LEAD_DISCLOSURE_CITATION } from '@/templates/usLeasePdfStatutory';

/** Lead Warning Statement — pre-1978 target housing (purchase / transfer). */
export const LEAD_WARNING_STATEMENT_PURCHASE = `Lead Warning Statement

Housing built before 1978 may contain lead-based paint. Lead from paint, paint chips, and dust can pose health hazards if not managed properly. Lead exposure is especially harmful to young children and pregnant women. Before buying pre-1978 housing, sellers must disclose the presence of known lead-based paint and/or lead-based paint hazards in the dwelling. Buyers must also receive a federally approved pamphlet on lead poisoning prevention.`;
