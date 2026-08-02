/**
 * US Letter PDF for the purchase wizard — template-driven V1 drafts
 * for SUPPORTED_DOCUMENT_STATES only.
 */

import type { PurchaseAgreementFormValues } from '@/features/contracts/schemas/purchaseAgreementForm.schema';
import {
  assertSupportedDocumentState,
  UnsupportedDocumentJurisdictionError,
} from '@/config/supportedDocumentStates';
import { formatLocalTimeAtProperty } from '@/lib/propertyTimezone';
import {
  buildPurchaseFormContext,
  getDocumentTemplate,
  type DocumentArtifactMeta,
} from '@/templates/documentRegistry';
import {
  EPA_LEAD_PAMPHLET_TITLE,
  LEAD_DISCLOSURE_CITATION,
} from '@/templates/usPurchasePdfStatutory';

import { renderDocumentTemplateToPdf } from './documentPdfRenderer.service';

export type PurchaseAgreementPdfInput = {
  form: PurchaseAgreementFormValues;
  /** Defaults to `new Date()` when omitted. */
  generatedAt?: Date;
};

export type GeneratedPurchasePdf = {
  blob: Blob;
  meta: DocumentArtifactMeta;
};

function shouldIncludeLeadPaintAddendum(form: PurchaseAgreementFormValues): boolean {
  return (
    form.lead_paint_disclosure_required ||
    form.year_built == null ||
    (typeof form.year_built === 'number' && form.year_built < 1978)
  );
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
  chunks.push(
    `Seller's knowledge of lead-based paint / hazards: ${
      form.lead_paint_known_hazards === true
        ? `Known hazards — ${form.lead_paint_hazard_description?.trim() || 'see attached'}`
        : form.lead_paint_known_hazards === false
          ? 'Seller reports no knowledge of lead-based paint or hazards'
          : 'Not specified'
    }`,
  );
  chunks.push(
    `Records/reports available: ${form.lead_paint_records_available === true ? 'Yes' : form.lead_paint_records_available === false ? 'No' : 'Not specified'}`,
  );
  chunks.push(
    `EPA pamphlet '${EPA_LEAD_PAMPHLET_TITLE}' delivery: ${form.lead_paint_pamphlet_delivered ? 'Yes' : 'No'}; method ${form.lead_paint_pamphlet_delivery_method ?? '—'}; date ${form.lead_paint_pamphlet_delivery_date ?? '—'}`,
  );
  return chunks.join('\n');
}

export class PurchaseAgreementPdfService {
  /**
   * Builds a multi-page draft PDF for a supported jurisdiction.
   * Requires property_state supported; governing_law_state must match when provided.
   */
  generateDocument(input: PurchaseAgreementPdfInput): GeneratedPurchasePdf {
    const { form } = input;
    const propertyState = assertSupportedDocumentState(form.property_state);
    const governing = (form.governing_law_state ?? '').trim().toUpperCase();
    if (governing && governing !== propertyState) {
      throw new UnsupportedDocumentJurisdictionError(
        `${form.property_state}/${form.governing_law_state} (property state and governing law must match)`,
      );
    }
    if (governing) {
      assertSupportedDocumentState(governing);
    }

    const generatedAt = input.generatedAt ?? new Date();
    const template = getDocumentTemplate('purchase', propertyState);
    const values = buildPurchaseFormContext(form, propertyState);
    const tzPhrase = formatLocalTimeAtProperty(generatedAt, form.property_timezone);

    const blob = renderDocumentTemplateToPdf({
      template,
      values,
      leadAddendumBody: shouldIncludeLeadPaintAddendum(form) ? buildLeadPaintBody(form) : null,
      generatedAtLabel: `Generated ${tzPhrase}`,
      initialsFooter: true,
    });

    const meta: DocumentArtifactMeta = {
      template_id: template.id,
      template_version: template.version,
      jurisdiction: propertyState,
      doc_type: 'purchase',
      generated_at: generatedAt.toISOString(),
    };

    return { blob, meta };
  }

  /** @throws UnsupportedDocumentJurisdictionError */
  generateBlob(input: PurchaseAgreementPdfInput): Blob {
    return this.generateDocument(input).blob;
  }
}

export const purchaseAgreementPdfService = new PurchaseAgreementPdfService();
export { UnsupportedDocumentJurisdictionError };
