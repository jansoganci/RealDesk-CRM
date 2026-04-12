/**
 * US Letter PDF generator for the Sprint 6A lease wizard (English, Helvetica).
 * Includes federal lead-paint disclosure language when required and signature blocks
 * for landlord, primary tenant, optional second tenant, and optional co-signer/guarantor.
 */

import { jsPDF } from 'jspdf';
import { format, parseISO } from 'date-fns';

import type { LeaseAgreementFormValues } from '@/features/contracts/schemas/leaseAgreementForm.schema';
import { formatCurrency } from '@/lib/currency';
import { formatLocalTimeAtProperty } from '@/lib/propertyTimezone';
import {
  EPA_LEAD_PAMPHLET_TITLE,
  LEAD_DISCLOSURE_CITATION,
  LEAD_WARNING_STATEMENT_LEASE,
} from '@/templates/usLeasePdfStatutory';

const USD = 'USD';

export type LeaseAgreementPdfInput = {
  form: LeaseAgreementFormValues;
  /** Defaults to `new Date()` when omitted. */
  generatedAt?: Date;
};

const FONT = 'helvetica' as const;
const BODY_PT = 10;
const TITLE_PT = 14;
const SECTION_PT = 11;
const MARGIN_MM = 20;

function pageSize(doc: jsPDF): { w: number; h: number } {
  return {
    w: doc.internal.pageSize.getWidth(),
    h: doc.internal.pageSize.getHeight(),
  };
}

function lineHeightMm(fontSizePt: number): number {
  return fontSizePt * 0.4;
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMMM d, yyyy');
  } catch {
    return iso;
  }
}

function leaseTypeLabel(v: LeaseAgreementFormValues['lease_type']): string {
  switch (v) {
    case 'standard':
      return 'Standard (fixed term)';
    case 'month_to_month':
      return 'Month-to-month';
    default:
      return String(v);
  }
}

function lateFeeSummary(form: LeaseAgreementFormValues): string {
  if (form.late_fee_type === 'none') return 'Late fee: None.';
  if (form.late_fee_type === 'fixed') {
    const per = form.late_fee_per === 'day' ? 'per day' : 'per occurrence';
    return `Late fee: ${formatCurrency(form.late_fee_amount ?? 0, USD)} (${per})`;
  }
  if (form.late_fee_type === 'interest') {
    return `Late fee: ${form.late_fee_interest_pct ?? 0}% interest (annualized as specified in lease)`;
  }
  return 'Late fee: —';
}

function setFontStyle(doc: jsPDF, style: 'normal' | 'bold' | 'italic'): void {
  doc.setFont(FONT, style);
}

function writeParagraph(
  doc: jsPDF,
  y: number,
  text: string,
  opts: {
    fontSize: number;
    fontStyle?: 'normal' | 'bold' | 'italic';
    margin: number;
    maxWidth: number;
    pageH: number;
    lineGapMm?: number;
  },
): number {
  const style = opts.fontStyle ?? 'normal';
  setFontStyle(doc, style);
  doc.setFontSize(opts.fontSize);
  const lh = lineHeightMm(opts.fontSize);
  const lines = doc.splitTextToSize(text.trim(), opts.maxWidth);
  let curY = y;
  for (const line of lines) {
    if (curY + lh > opts.pageH - opts.margin) {
      doc.addPage();
      curY = opts.margin;
    }
    doc.text(line, opts.margin, curY);
    curY += lh;
  }
  return curY + (opts.lineGapMm ?? 2);
}

function drawSignatureRow(
  doc: jsPDF,
  y: number,
  label: string,
  margin: number,
  maxWidth: number,
  pageH: number,
): number {
  let curY = writeParagraph(doc, y, label, {
    fontSize: BODY_PT,
    fontStyle: 'bold',
    margin,
    maxWidth,
    pageH,
    lineGapMm: 6,
  });
  setFontStyle(doc, 'normal');
  doc.setFontSize(BODY_PT);
  doc.setLineWidth(0.3);
  if (curY + 12 > pageH - margin) {
    doc.addPage();
    curY = margin;
  }
  doc.line(margin, curY, margin + 80, curY);
  curY += 6;
  curY = writeParagraph(doc, curY, 'Date: _______________', {
    fontSize: BODY_PT,
    margin,
    maxWidth,
    pageH,
    lineGapMm: 10,
  });
  return curY;
}

function shouldIncludeLeadPaintAddendum(form: LeaseAgreementFormValues): boolean {
  if (form.lead_paint_disclosure_required) return true;
  const y = form.year_built;
  if (y == null) return true;
  if (typeof y === 'number' && Number.isNaN(y)) return true;
  return y < 1978;
}

function buildPropertyAddress(form: LeaseAgreementFormValues): string {
  const unit = form.property_unit?.trim();
  const street = form.property_street?.trim() || '—';
  const line1 = unit ? `${street}, ${unit}` : street;
  const line2 = [form.property_city, form.property_state, form.property_zip]
    .filter(Boolean)
    .join(', ');
  return `${line1}\n${line2}`;
}

function buildSummaryBody(form: LeaseAgreementFormValues): string {
  const lines: string[] = [];
  lines.push(`Property:\n${buildPropertyAddress(form)}`);
  if (form.year_built != null) {
    lines.push(`Year built: ${form.year_built}`);
  }
  lines.push('');
  lines.push(`Landlord: ${form.landlord_name?.trim() || '—'}`);
  const lm = [form.landlord_mailing_street, form.landlord_mailing_city, form.landlord_mailing_state, form.landlord_mailing_zip]
    .filter((x) => x != null && String(x).trim() !== '')
    .join(', ');
  if (lm) lines.push(`Mailing: ${lm}`);
  lines.push(`Phone: ${form.landlord_phone?.trim() || '—'}  Email: ${form.landlord_email?.trim() || '—'}`);
  lines.push('');
  lines.push(`Tenant (primary): ${form.tenant_name?.trim() || '—'}`);
  lines.push(`Phone: ${form.tenant_phone?.trim() || '—'}  Email: ${form.tenant_email?.trim() || '—'}`);

  const hasTenant2 = (form.tenant_name_2?.trim() ?? '').length >= 2;
  if (hasTenant2) {
    lines.push('');
    lines.push(`Tenant (secondary): ${form.tenant_name_2?.trim() || '—'}`);
    lines.push(`Phone: ${form.tenant_phone_2?.trim() || '—'}  Email: ${form.tenant_email_2?.trim() || '—'}`);
  }

  const hasCosigner = (form.co_signer_name?.trim() ?? '').length >= 2;
  if (hasCosigner) {
    const roleLabel = form.co_signer_role === 'guarantor' ? 'Guarantor' : 'Co-signer';
    lines.push('');
    lines.push(`${roleLabel}: ${form.co_signer_name?.trim() || '—'}`);
    lines.push(`Phone: ${form.co_signer_phone?.trim() || '—'}  Email: ${form.co_signer_email?.trim() || '—'}`);
  }

  if (form.additional_occupants.length > 0) {
    lines.push('');
    lines.push(`Additional occupants: ${form.additional_occupants.join(', ')}`);
  }

  lines.push('');
  lines.push(`Lease type: ${leaseTypeLabel(form.lease_type)}`);
  lines.push(`Term: ${fmtDate(form.start_date)} through ${fmtDate(form.end_date)}`);
  if (form.lease_type === 'month_to_month' && form.termination_notice_days != null) {
    lines.push(`Termination notice: ${form.termination_notice_days} days`);
  }
  if (form.lease_type === 'standard' && form.after_term_action != null) {
    lines.push(
      `After term: ${form.after_term_action === 'terminate' ? 'Terminate' : 'Convert to month-to-month'}`,
    );
  }
  lines.push(`Monthly rent: ${formatCurrency(form.rent_amount, USD)} (due on day ${form.rent_due_day} of each month)`);
  lines.push(lateFeeSummary(form));

  if (form.security_deposit_enabled && form.security_deposit_amount != null) {
    lines.push(
      `Security deposit: ${formatCurrency(form.security_deposit_amount, USD)}` +
        (form.security_deposit_return_days != null
          ? ` (return within ${form.security_deposit_return_days} days after move-out where applicable)`
          : ''),
    );
  } else {
    lines.push('Security deposit: Not set / waived in this summary');
  }

  if (form.nsf_fee_enabled && form.nsf_fee_amount != null) {
    lines.push(`Returned payment (NSF) fee: ${formatCurrency(form.nsf_fee_amount, USD)}`);
  }

  lines.push(`Pets: ${form.pets_allowed ? 'Allowed' : 'Not allowed'}`);
  if (form.pets_allowed && form.pets_deposit_amount != null && form.pets_deposit_amount > 0) {
    lines.push(`Pet deposit: ${formatCurrency(form.pets_deposit_amount, USD)}`);
  }
  lines.push(`Smoking: ${form.smoking_allowed ? 'Allowed' : 'Not allowed'}`);

  if (form.additional_terms?.trim()) {
    lines.push('');
    lines.push(`Additional terms: ${form.additional_terms.trim()}`);
  }

  return lines.join('\n');
}

function buildLeadPaintBody(form: LeaseAgreementFormValues): string {
  const chunks: string[] = [LEAD_DISCLOSURE_CITATION, '', LEAD_WARNING_STATEMENT_LEASE, ''];
  chunks.push(`Federally approved pamphlet: ${EPA_LEAD_PAMPHLET_TITLE}`);
  chunks.push('');
  chunks.push('Lessor knowledge of lead-based paint and/or hazards:');
  if (form.lead_paint_known_hazards === true) {
    chunks.push('Lessor has knowledge of lead-based paint and/or lead-based paint hazards in the housing.');
    if (form.lead_paint_hazard_description?.trim()) {
      chunks.push(`Description: ${form.lead_paint_hazard_description.trim()}`);
    }
  } else if (form.lead_paint_known_hazards === false) {
    chunks.push('Lessor has no knowledge of lead-based paint and/or lead-based paint hazards in the housing.');
  } else {
    chunks.push('Knowledge not indicated on this summary — confirm at signing.');
  }
  chunks.push('');
  chunks.push(
    `Records/reports available: ${form.lead_paint_records_available === true ? 'Yes' : form.lead_paint_records_available === false ? 'No' : 'Not specified'}`,
  );
  if (form.lead_paint_records_available === true && form.lead_paint_records_description?.trim()) {
    chunks.push(`Records description: ${form.lead_paint_records_description.trim()}`);
  }
  chunks.push('');
  chunks.push(
    `Pamphlet delivered: ${form.lead_paint_pamphlet_delivered ? 'Yes' : 'No'}`,
  );
  if (form.lead_paint_pamphlet_delivered) {
    const method = form.lead_paint_pamphlet_delivery_method ?? '—';
    chunks.push(`Delivery method: ${method}`);
    chunks.push(`Delivery date: ${fmtDate(form.lead_paint_pamphlet_delivery_date ?? undefined)}`);
  }
  return chunks.join('\n');
}

export class LeaseAgreementPdfService {
  /**
   * Builds a multi-page PDF (US Letter). Caller uploads to storage when ready.
   */
  generateBlob(input: LeaseAgreementPdfInput): Blob {
    const { form } = input;
    const generatedAt = input.generatedAt ?? new Date();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const { w, h } = pageSize(doc);
    const maxW = w - 2 * MARGIN_MM;
    let y = MARGIN_MM;

    y = writeParagraph(doc, y, 'Residential Lease Agreement', {
      fontSize: TITLE_PT,
      fontStyle: 'bold',
      margin: MARGIN_MM,
      maxWidth: maxW,
      pageH: h,
      lineGapMm: 4,
    });
    y = writeParagraph(
      doc,
      y,
      'Summary (wizard output — use with your jurisdiction-specific lease documents).',
      {
        fontSize: BODY_PT,
        fontStyle: 'italic',
        margin: MARGIN_MM,
        maxWidth: maxW,
        pageH: h,
        lineGapMm: 6,
      },
    );

    y = writeParagraph(doc, y, buildSummaryBody(form), {
      fontSize: BODY_PT,
      margin: MARGIN_MM,
      maxWidth: maxW,
      pageH: h,
      lineGapMm: 6,
    });

    const tzPhrase = formatLocalTimeAtProperty(generatedAt, form.property_timezone);
    y = writeParagraph(doc, y, `Generated ${tzPhrase}`, {
      fontSize: 9,
      fontStyle: 'italic',
      margin: MARGIN_MM,
      maxWidth: maxW,
      pageH: h,
      lineGapMm: 8,
    });

    if (shouldIncludeLeadPaintAddendum(form)) {
      doc.addPage();
      y = MARGIN_MM;
      y = writeParagraph(doc, y, 'Lead-Based Paint Disclosure (Lease)', {
        fontSize: SECTION_PT,
        fontStyle: 'bold',
        margin: MARGIN_MM,
        maxWidth: maxW,
        pageH: h,
        lineGapMm: 4,
      });
      y = writeParagraph(doc, y, buildLeadPaintBody(form), {
        fontSize: BODY_PT,
        margin: MARGIN_MM,
        maxWidth: maxW,
        pageH: h,
        lineGapMm: 6,
      });
    }

    doc.addPage();
    y = MARGIN_MM;
    y = writeParagraph(doc, y, 'Signatures', {
      fontSize: SECTION_PT,
      fontStyle: 'bold',
      margin: MARGIN_MM,
      maxWidth: maxW,
      pageH: h,
      lineGapMm: 8,
    });

    y = drawSignatureRow(doc, y, 'Landlord', MARGIN_MM, maxW, h);
    y = drawSignatureRow(doc, y, 'Tenant (primary)', MARGIN_MM, maxW, h);
    if ((form.tenant_name_2?.trim() ?? '').length >= 2) {
      y = drawSignatureRow(doc, y, 'Tenant (secondary)', MARGIN_MM, maxW, h);
    }
    if ((form.co_signer_name?.trim() ?? '').length >= 2) {
      const lab =
        form.co_signer_role === 'guarantor' ? 'Guarantor' : 'Co-signer';
      y = drawSignatureRow(doc, y, lab, MARGIN_MM, maxW, h);
    }

    const { w: fw, h: fh } = pageSize(doc);
    setFontStyle(doc, 'italic');
    doc.setFontSize(8);
    const foot = doc.splitTextToSize(`Generated ${tzPhrase}`, fw - 2 * MARGIN_MM);
    doc.text(foot, MARGIN_MM, fh - 12);

    return doc.output('blob');
  }
}

export const leaseAgreementPdfService = new LeaseAgreementPdfService();
