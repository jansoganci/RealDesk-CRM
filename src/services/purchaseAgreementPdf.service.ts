/**
 * US Letter PDF for the Sprint 6B purchase wizard (English, Helvetica).
 * Summary-style agreement text + lead-paint addendum when required + signature blocks.
 * Every page includes a buyer/seller initials line in the footer (Sprint 6B requirement).
 */

import { jsPDF } from 'jspdf';
import { format, parseISO } from 'date-fns';

import type { PurchaseAgreementFormValues } from '@/features/contracts/schemas/purchaseAgreementForm.schema';
import { formatCurrency } from '@/lib/currency';
import { formatLegalAmount } from '@/lib/numberToWords';
import { formatLocalTimeAtProperty } from '@/lib/propertyTimezone';
import {
  EPA_LEAD_PAMPHLET_TITLE,
  LEAD_DISCLOSURE_CITATION,
} from '@/templates/usPurchasePdfStatutory';

const USD = 'USD';

export type PurchaseAgreementPdfInput = {
  form: PurchaseAgreementFormValues;
  /** Defaults to `new Date()` when omitted. */
  generatedAt?: Date;
};

const FONT = 'helvetica' as const;
const BODY_PT = 10;
const TITLE_PT = 14;
const SECTION_PT = 11;
const MARGIN_MM = 20;
/** Space reserved at bottom of each page for initials footer (content should stay above). */
const FOOTER_RESERVE_MM = 14;

function pageSize(doc: jsPDF): { w: number; h: number } {
  return {
    w: doc.internal.pageSize.getWidth(),
    h: doc.internal.pageSize.getHeight(),
  };
}

function lineHeightMm(fontSizePt: number): number {
  return fontSizePt * 0.4;
}

function fmtDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMMM d, yyyy');
  } catch {
    return iso;
  }
}

function fmtOptionalDateTime(dateIso: string | null | undefined, timeStr: string | null | undefined): string {
  const d = fmtDate(dateIso ?? undefined);
  const t = timeStr?.trim();
  if (!t || t === '—') return d;
  return `${d} ${t}`;
}

function propertyTypeLabel(form: PurchaseAgreementFormValues): string {
  const v = form.property_type;
  switch (v) {
    case 'single_family':
      return 'Single-family home';
    case 'condominium':
      return 'Condominium';
    case 'pud':
      return 'Planned unit development (PUD)';
    case 'duplex':
      return 'Duplex';
    case 'triplex':
      return 'Triplex';
    case 'fourplex':
      return 'Fourplex';
    case 'other': {
      const o = form.property_type_other?.trim();
      return o ? `Other: ${o}` : 'Other';
    }
    default:
      return String(v);
  }
}

function titleTypeLabel(t: PurchaseAgreementFormValues['title_type']): string {
  if (!t) return '—';
  switch (t) {
    case 'tenancy_in_common':
      return 'Tenancy in common';
    case 'joint_tenancy':
      return 'Joint tenancy';
    case 'tenancy_by_entirety':
      return 'Tenancy by the entirety';
    default:
      return String(t);
  }
}

function closingCostsLabel(v: PurchaseAgreementFormValues['closing_costs_responsibility']): string {
  switch (v) {
    case 'buyer':
      return 'Buyer';
    case 'seller':
      return 'Seller';
    case 'both':
      return 'Buyer and seller (as allocated)';
    default:
      return String(v);
  }
}

function bankLoanLabel(form: PurchaseAgreementFormValues): string {
  if (form.financing_type !== 'bank_financing') return '—';
  const t = form.bank_loan_type;
  if (t === 'other') return form.bank_loan_type_other?.trim() || 'Other';
  if (t === 'conventional') return 'Conventional';
  if (t === 'fha') return 'FHA';
  if (t === 'va') return 'VA';
  return t ?? '—';
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

function shouldIncludeLeadPaintAddendum(form: PurchaseAgreementFormValues): boolean {
  return (
    form.lead_paint_disclosure_required ||
    (form.year_built != null && form.year_built < 1978)
  );
}

function buildPropertyAddress(form: PurchaseAgreementFormValues): string {
  const street = form.property_street?.trim() || '—';
  const line2 = [form.property_city, form.property_state, form.property_zip].filter(Boolean).join(', ');
  return `${street}\n${line2}`;
}

function mailingLines(
  street: string | null | undefined,
  city: string | null | undefined,
  state: string | null | undefined,
  zip: string | null | undefined,
): string {
  const s = street?.trim();
  const rest = [city, state, zip].filter((x) => x != null && String(x).trim() !== '').join(', ');
  if (!s && !rest) return '—';
  if (!s) return rest;
  if (!rest) return s;
  return `${s}, ${rest}`;
}

function buildFinancingLines(form: PurchaseAgreementFormValues): string[] {
  const lines: string[] = [];
  if (form.financing_type === 'all_cash') {
    lines.push('Financing: All cash.');
    lines.push(
      `Proof of funds deadline: ${fmtOptionalDateTime(form.all_cash_proof_deadline_date, form.all_cash_proof_deadline_time)}`,
    );
  } else if (form.financing_type === 'bank_financing') {
    lines.push(`Financing: Bank / institutional (${bankLoanLabel(form)}).`);
    lines.push(`Pre-approval letter date: ${fmtDate(form.bank_preapproval_letter_date ?? undefined)}`);
    if (form.bank_seller_notification_days != null) {
      lines.push(`Seller notification (financing): within ${form.bank_seller_notification_days} days`);
    }
    lines.push(`Contingent on sale of another property: ${form.bank_contingent_on_sale ? 'Yes' : 'No'}`);
    if (form.bank_loan_type === 'fha') {
      lines.push(`FHA addendum on file (wizard): ${form.fha_addendum_uploaded ? 'Yes' : 'No'}`);
    }
    if (form.bank_loan_type === 'va') {
      lines.push(`VA addendum on file (wizard): ${form.va_addendum_uploaded ? 'Yes' : 'No'}`);
    }
  } else if (form.financing_type === 'seller_financing') {
    lines.push('Financing: Seller financing.');
    if (form.seller_financing_loan_amount != null) {
      lines.push(`Loan amount: ${formatCurrency(form.seller_financing_loan_amount, USD)}`);
    }
    if (form.seller_financing_down_payment != null) {
      lines.push(`Down payment: ${formatCurrency(form.seller_financing_down_payment, USD)}`);
    }
    if (form.seller_financing_interest_rate != null) {
      lines.push(`Interest rate: ${form.seller_financing_interest_rate}%`);
    }
    if (form.seller_financing_term_value != null && form.seller_financing_term_unit) {
      lines.push(
        `Term: ${form.seller_financing_term_value} ${form.seller_financing_term_unit === 'months' ? 'months' : 'years'}`,
      );
    }
    lines.push(`Document deadline: ${fmtDate(form.seller_financing_doc_deadline ?? undefined)}`);
    lines.push(`Approval deadline: ${fmtDate(form.seller_financing_approval_deadline ?? undefined)}`);
  }
  return lines;
}

function buildSummaryBody(form: PurchaseAgreementFormValues): string {
  const lines: string[] = [];

  lines.push('PROPERTY');
  lines.push(`Type: ${propertyTypeLabel(form)}`);
  lines.push(`Address:\n${buildPropertyAddress(form)}`);
  if (form.tax_parcel_info?.trim()) lines.push(`Tax parcel / APN: ${form.tax_parcel_info.trim()}`);
  if (form.other_description?.trim()) lines.push(`Legal / other description: ${form.other_description.trim()}`);
  lines.push(`Land included: ${form.land_included ? 'Yes' : 'No'}`);
  if (form.other_property_info?.trim()) {
    lines.push(`Other property information: ${form.other_property_info.trim()}`);
  }
  if (form.year_built != null) lines.push(`Year built: ${form.year_built}`);
  lines.push('');

  lines.push('PARTIES');
  lines.push(`Buyer: ${form.buyer_name?.trim() || '—'}`);
  lines.push(`Mailing: ${mailingLines(form.buyer_mailing_street, form.buyer_mailing_city, form.buyer_mailing_state, form.buyer_mailing_zip)}`);
  lines.push(`Phone: ${form.buyer_phone?.trim() || '—'}  Email: ${form.buyer_email?.trim() || '—'}`);

  const hasBuyer2 = (form.buyer_name_2?.trim() ?? '').length >= 2;
  if (hasBuyer2) {
    lines.push('');
    lines.push(`Co-buyer: ${form.buyer_name_2?.trim() || '—'}`);
    lines.push(`Mailing: ${mailingLines(form.buyer_mailing_street_2, form.buyer_mailing_city_2, form.buyer_mailing_state_2, form.buyer_mailing_zip_2)}`);
    lines.push(`Phone: ${form.buyer_phone_2?.trim() || '—'}  Email: ${form.buyer_email_2?.trim() || '—'}`);
    lines.push(`Title vesting: ${titleTypeLabel(form.title_type)}`);
  }

  lines.push('');
  lines.push(`Seller: ${form.seller_name?.trim() || '—'}`);
  lines.push(`Mailing: ${mailingLines(form.seller_mailing_street, form.seller_mailing_city, form.seller_mailing_state, form.seller_mailing_zip)}`);
  lines.push(`Phone: ${form.seller_phone?.trim() || '—'}  Email: ${form.seller_email?.trim() || '—'}`);

  if ((form.seller_name_2?.trim() ?? '').length >= 2) {
    lines.push('');
    lines.push(`Co-seller: ${form.seller_name_2?.trim() || '—'}`);
    lines.push(`Phone: ${form.seller_phone_2?.trim() || '—'}  Email: ${form.seller_email_2?.trim() || '—'}`);
  }

  lines.push('');
  lines.push(`Buyer’s agent (for execution): ${form.buyer_agent_name?.trim() || '—'}`);
  lines.push(`Seller’s agent (for execution): ${form.seller_agent_name?.trim() || '—'}`);
  lines.push('');

  lines.push('KEY TERMS');
  lines.push(`Effective date: ${fmtDate(form.effective_date)}`);
  lines.push(`Governing law: ${form.governing_law_state}`);
  lines.push(formatLegalAmount(form.purchase_price));
  lines.push(`Earnest money: ${formatCurrency(form.earnest_money_amount, USD)} (due ${fmtDate(form.earnest_money_due_date)})`);
  lines.push(`Earnest money held in escrow: ${form.earnest_money_escrow_required ? 'Yes' : 'No'}`);
  if (form.earnest_money_deadline_time?.trim()) {
    lines.push(`Earnest money deadline time: ${form.earnest_money_deadline_time.trim()}`);
  }
  lines.push(`Earnest money return (days per terms): ${form.earnest_money_return_days}`);
  lines.push('');

  lines.push(...buildFinancingLines(form));
  lines.push('');

  lines.push('PERSONAL PROPERTY / FIXTURES');
  lines.push(
    form.personal_property_description?.trim()
      ? form.personal_property_description.trim()
      : 'None specified.',
  );
  lines.push('');

  lines.push('CLOSING');
  lines.push(`Closing date: ${fmtDate(form.closing_date)}`);
  if (form.closing_time?.trim()) lines.push(`Closing time (local): ${form.closing_time.trim()}`);
  lines.push(`Closing costs allocation: ${closingCostsLabel(form.closing_costs_responsibility)}`);
  if (form.title_company?.trim()) lines.push(`Title company: ${form.title_company.trim()}`);
  lines.push('');

  lines.push('CONTINGENCIES & DATES');
  lines.push(`Contingent on sale of another property: ${form.contingent_on_other_property ? 'Yes' : 'No'}`);
  if (form.contingent_on_other_property && form.contingent_property_address?.trim()) {
    lines.push(`Other property: ${form.contingent_property_address.trim()}`);
    if (form.contingent_property_days != null) lines.push(`Contingency period: ${form.contingent_property_days} days`);
  }
  lines.push(
    `Inspection access deadline: ${fmtOptionalDateTime(form.inspection_contractor_deadline_date, form.inspection_contractor_deadline_time)}`,
  );
  lines.push(
    `Disclosures deadline: ${fmtOptionalDateTime(form.inspection_disclosures_deadline_date, form.inspection_disclosures_deadline_time)}`,
  );
  if (form.inspection_negotiation_days != null) {
    lines.push(`Inspection negotiation period: ${form.inspection_negotiation_days} days`);
  }
  lines.push(`Appraisal contingency: ${form.appraisal_contingency ? 'Yes' : 'No'}`);
  if (form.appraisal_contingency && form.appraisal_negotiation_days != null) {
    lines.push(`Appraisal negotiation days: ${form.appraisal_negotiation_days}`);
  }
  if (form.survey_buyer_notification_days != null) {
    lines.push(`Survey — buyer notification: ${form.survey_buyer_notification_days} days`);
  }
  if (form.survey_seller_remedy_days != null) {
    lines.push(`Survey — seller remedy: ${form.survey_seller_remedy_days} days`);
  }
  lines.push(`Mineral rights transferred: ${form.mineral_rights_transferred ? 'Yes' : 'No'}`);
  if (form.title_buyer_review_days != null) lines.push(`Title review (buyer): ${form.title_buyer_review_days} days`);
  if (form.title_seller_remedy_days != null) lines.push(`Title remedy (seller): ${form.title_seller_remedy_days} days`);
  lines.push(`Offer expiration: ${fmtOptionalDateTime(form.offer_expiration_date, form.offer_expiration_time)}`);
  lines.push('');

  if (form.custom_addendums && form.custom_addendums.length > 0) {
    lines.push('REFERENCED ADDENDA');
    form.custom_addendums.forEach((a, i) => {
      if (a?.trim()) lines.push(`${i + 1}. ${a.trim()}`);
    });
    lines.push('');
  }

  if (form.additional_terms?.trim()) {
    lines.push('ADDITIONAL TERMS');
    lines.push(form.additional_terms.trim());
  }

  return lines.join('\n');
}

function buildLeadPaintBody(form: PurchaseAgreementFormValues): string {
  const chunks: string[] = [LEAD_DISCLOSURE_CITATION, ''];
  chunks.push(
    'Every purchaser of any interest in residential real property on which a residential dwelling was built prior to 1978 is notified that such property may present exposure to lead from lead-based paint that may place young children at risk of developing lead poisoning. Lead poisoning in young children may produce permanent neurological damage, including learning disabilities, reduced intelligence quotient, behavioral problems, and impaired memory. Lead poisoning also poses a particular risk to pregnant women. The seller of any interest in residential real property is required to provide the buyer with any information on lead-based paint hazards from risk assessments or inspections in the seller\'s possession and notify the buyer of any known lead-based paint hazards. A risk assessment or inspection for possible lead-based paint hazards is recommended prior to purchase.',
  );
  chunks.push('');
  chunks.push(
    "BUYER'S RIGHT TO INSPECT: Buyer has been given a 10-day opportunity (or mutually agreed period) to conduct a risk assessment or inspection for the presence of lead-based paint hazards before becoming obligated under this contract. Buyer [ ] has received this opportunity [ ] has waived this opportunity in writing.",
  );
  chunks.push('');
  chunks.push('Seller disclosure section');
  chunks.push(
    `Seller's knowledge: [ ] No knowledge of LBP or hazards [ ] Known LBP or hazards present: ${form.lead_paint_known_hazards ? (form.lead_paint_hazard_description?.trim() || '_______________________') : '_______________________'}`,
  );
  chunks.push(
    `Records and reports available: [ ] None [ ] Provided to Buyer: ${form.lead_paint_records_available ? 'Yes' : '___'}`,
  );
  chunks.push('');
  chunks.push(
    `Seller/Agent confirms EPA pamphlet '${EPA_LEAD_PAMPHLET_TITLE}' was provided to Buyer on: ${fmtDate(form.lead_paint_pamphlet_delivery_date ?? undefined)} via: ${form.lead_paint_pamphlet_delivery_method ?? '_________'}`,
  );
  chunks.push('');
  chunks.push(
    'Agent has informed the seller of obligations and is aware of their responsibility to ensure compliance with federal law.',
  );
  return chunks.join('\n');
}

/**
 * Draws the Sprint 6B initials line on every existing page (call after all content).
 */
function applyPerPageInitialsFooters(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const { w, h } = pageSize(doc);
  const footY = h - 6;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont(FONT, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(55, 55, 55);
    const text = "Buyer's Initials _______     Seller's Initials _______";
    const tw = doc.getTextWidth(text);
    doc.text(text, (w - tw) / 2, footY);
  }
  doc.setTextColor(0, 0, 0);
}

export class PurchaseAgreementPdfService {
  /** Builds a multi-page PDF (US Letter). Caller uploads to storage when ready. */
  generateBlob(input: PurchaseAgreementPdfInput): Blob {
    const { form } = input;
    const generatedAt = input.generatedAt ?? new Date();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const { w, h } = pageSize(doc);
    const maxW = w - 2 * MARGIN_MM;
    const contentPageH = h - MARGIN_MM - FOOTER_RESERVE_MM;
    let y = MARGIN_MM;

    y = writeParagraph(doc, y, 'Residential Purchase Agreement', {
      fontSize: TITLE_PT,
      fontStyle: 'bold',
      margin: MARGIN_MM,
      maxWidth: maxW,
      pageH: contentPageH,
      lineGapMm: 4,
    });
    y = writeParagraph(
      doc,
      y,
      'Summary (wizard output — use with your jurisdiction-specific purchase documents and broker forms).',
      {
        fontSize: BODY_PT,
        fontStyle: 'italic',
        margin: MARGIN_MM,
        maxWidth: maxW,
        pageH: contentPageH,
        lineGapMm: 6,
      },
    );

    y = writeParagraph(doc, y, buildSummaryBody(form), {
      fontSize: BODY_PT,
      margin: MARGIN_MM,
      maxWidth: maxW,
      pageH: contentPageH,
      lineGapMm: 6,
    });

    const tzPhrase = formatLocalTimeAtProperty(generatedAt, form.property_timezone);
    y = writeParagraph(doc, y, `Generated ${tzPhrase}`, {
      fontSize: 9,
      fontStyle: 'italic',
      margin: MARGIN_MM,
      maxWidth: maxW,
      pageH: contentPageH,
      lineGapMm: 8,
    });

    if (shouldIncludeLeadPaintAddendum(form)) {
      doc.addPage();
      y = MARGIN_MM;
      y = writeParagraph(doc, y, 'Lead-Based Paint Disclosure (Sale)', {
        fontSize: SECTION_PT,
        fontStyle: 'bold',
        margin: MARGIN_MM,
        maxWidth: maxW,
        pageH: contentPageH,
        lineGapMm: 4,
      });
      y = writeParagraph(doc, y, buildLeadPaintBody(form), {
        fontSize: BODY_PT,
        margin: MARGIN_MM,
        maxWidth: maxW,
        pageH: contentPageH,
        lineGapMm: 6,
      });
      y = drawSignatureRow(doc, y, 'Seller acknowledgment signature', MARGIN_MM, maxW, contentPageH);
      y = drawSignatureRow(doc, y, 'Agent acknowledgment signature', MARGIN_MM, maxW, contentPageH);
      y = drawSignatureRow(doc, y, 'Buyer 1 acknowledgment signature', MARGIN_MM, maxW, contentPageH);
      if ((form.buyer_name_2?.trim() ?? '').length >= 2) {
        drawSignatureRow(doc, y, 'Buyer 2 acknowledgment signature', MARGIN_MM, maxW, contentPageH);
      }
    }

    doc.addPage();
    y = MARGIN_MM;
    y = writeParagraph(doc, y, 'Signatures', {
      fontSize: SECTION_PT,
      fontStyle: 'bold',
      margin: MARGIN_MM,
      maxWidth: maxW,
      pageH: contentPageH,
      lineGapMm: 8,
    });

    y = drawSignatureRow(doc, y, 'Buyer', MARGIN_MM, maxW, contentPageH);
    if ((form.buyer_name_2?.trim() ?? '').length >= 2) {
      y = drawSignatureRow(doc, y, 'Co-buyer', MARGIN_MM, maxW, contentPageH);
    }
    y = drawSignatureRow(doc, y, 'Seller', MARGIN_MM, maxW, contentPageH);
    if ((form.seller_name_2?.trim() ?? '').length >= 2) {
      y = drawSignatureRow(doc, y, 'Co-seller', MARGIN_MM, maxW, contentPageH);
    }
    if ((form.buyer_agent_name?.trim() ?? '').length >= 1) {
      y = drawSignatureRow(doc, y, 'Buyer’s agent', MARGIN_MM, maxW, contentPageH);
    }
    if ((form.seller_agent_name?.trim() ?? '').length >= 1) {
      drawSignatureRow(doc, y, 'Seller’s agent', MARGIN_MM, maxW, contentPageH);
    }

    applyPerPageInitialsFooters(doc);

    return doc.output('blob');
  }
}

export const purchaseAgreementPdfService = new PurchaseAgreementPdfService();
