/**
 * US Letter PDF generator for the lease wizard — template-driven V1 drafts
 * for SUPPORTED_DOCUMENT_STATES only.
 */

import type { LeaseAgreementFormValues } from '@/features/contracts/schemas/leaseAgreementForm.schema';
import {
  assertSupportedDocumentState,
  UnsupportedDocumentJurisdictionError,
} from '@/config/supportedDocumentStates';
import { formatLocalTimeAtProperty } from '@/lib/propertyTimezone';
import {
  buildLeaseFormContext,
  getDocumentTemplate,
  type DocumentArtifactMeta,
} from '@/templates/documentRegistry';
import {
  EPA_LEAD_PAMPHLET_TITLE,
  LEAD_DISCLOSURE_CITATION,
  LEAD_WARNING_STATEMENT_LEASE,
} from '@/templates/usLeasePdfStatutory';

import { renderDocumentTemplateToPdf } from './documentPdfRenderer.service';

export type LeaseAgreementPdfInput = {
  form: LeaseAgreementFormValues;
  /** Defaults to `new Date()` when omitted. */
  generatedAt?: Date;
};

export type GeneratedLeasePdf = {
  blob: Blob;
  meta: DocumentArtifactMeta;
};

function fmtDate(iso: string | undefined): string {
  if (!iso) return '—';
  return iso;
}

function shouldIncludeLeadPaintAddendum(form: LeaseAgreementFormValues): boolean {
  if (form.lead_paint_disclosure_required) return true;
  const y = form.year_built;
  if (y == null) return true;
  if (typeof y === 'number' && Number.isNaN(y)) return true;
  return y < 1978;
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
    chunks.push('Knowledge not indicated — confirm at signing.');
  }
  chunks.push('');
  chunks.push(
    `Records/reports available: ${form.lead_paint_records_available === true ? 'Yes' : form.lead_paint_records_available === false ? 'No' : 'Not specified'}`,
  );
  if (form.lead_paint_records_available === true && form.lead_paint_records_description?.trim()) {
    chunks.push(`Records description: ${form.lead_paint_records_description.trim()}`);
  }
  chunks.push('');
  chunks.push(`Pamphlet delivered: ${form.lead_paint_pamphlet_delivered ? 'Yes' : 'No'}`);
  if (form.lead_paint_pamphlet_delivered) {
    chunks.push(`Delivery method: ${form.lead_paint_pamphlet_delivery_method ?? '—'}`);
    chunks.push(`Delivery date: ${fmtDate(form.lead_paint_pamphlet_delivery_date ?? undefined)}`);
  }
  return chunks.join('\n');
}

export class LeaseAgreementPdfService {
  /**
   * Builds a multi-page draft PDF for a supported jurisdiction.
   * Throws UnsupportedDocumentJurisdictionError for unsupported states.
   */
  generateDocument(input: LeaseAgreementPdfInput): GeneratedLeasePdf {
    const { form } = input;
    const state = assertSupportedDocumentState(form.property_state);
    const generatedAt = input.generatedAt ?? new Date();
    const template = getDocumentTemplate('lease', state);
    const values = buildLeaseFormContext(form, state);
    const tzPhrase = formatLocalTimeAtProperty(generatedAt, form.property_timezone);

    const blob = renderDocumentTemplateToPdf({
      template,
      values,
      leadAddendumBody: shouldIncludeLeadPaintAddendum(form) ? buildLeadPaintBody(form) : null,
      generatedAtLabel: `Generated ${tzPhrase}`,
    });

    const meta: DocumentArtifactMeta = {
      template_id: template.id,
      template_version: template.version,
      jurisdiction: state,
      doc_type: 'lease',
      generated_at: generatedAt.toISOString(),
    };

    return { blob, meta };
  }

  /** @throws UnsupportedDocumentJurisdictionError */
  generateBlob(input: LeaseAgreementPdfInput): Blob {
    return this.generateDocument(input).blob;
  }
}

export const leaseAgreementPdfService = new LeaseAgreementPdfService();
export { UnsupportedDocumentJurisdictionError };
