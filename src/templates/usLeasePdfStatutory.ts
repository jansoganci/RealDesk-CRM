/**
 * Federal lead-based paint disclosure language for US residential lease PDFs.
 * Sources: 42 U.S.C. § 4852d; 24 CFR Part 35 Subpart B (HUD/EPA disclosure requirements).
 * This is English statutory / model-form text for PDF output (not UI i18n).
 */

/** Lead Warning Statement — required for pre-1978 target housing (lease). */
export const LEAD_WARNING_STATEMENT_LEASE = `Lead Warning Statement

Housing built before 1978 may contain lead-based paint. Lead from paint, paint chips, and dust can pose health hazards if not managed properly. Lead exposure is especially harmful to young children and pregnant women. Before renting pre-1978 housing, lessors must disclose the presence of known lead-based paint and/or lead-based paint hazards in the dwelling. Lessees must also receive a federally approved pamphlet on lead poisoning prevention.`;

/** Introductory citation line for the disclosure addendum page. */
export const LEAD_DISCLOSURE_CITATION =
  'Disclosure of Information on Lead-Based Paint and/or Lead-Based Paint Hazards — 42 U.S.C. § 4852d; 24 C.F.R. Part 35 Subpart B.';

/** Pamphlet title referenced in federal disclosure (EPA/HUD). */
export const EPA_LEAD_PAMPHLET_TITLE =
  "Protect Your Family From Lead in Your Home (EPA-747-K-12-002) or successor federally approved pamphlet.";
