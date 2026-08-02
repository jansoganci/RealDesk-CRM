import { describe, expect, it, vi } from 'vitest';

import { getLeaseAgreementFormDefaults } from '@/features/contracts/leaseWizard/leaseAgreementFormDefaults';
import { getPurchaseAgreementFormDefaults } from '@/features/contracts/purchaseWizard/purchaseAgreementFormDefaults';
import type { SupportedDocumentState } from '@/config/supportedDocumentStates';
import { buildLeaseFormContext, buildPurchaseFormContext, getDocumentTemplate } from '@/templates/documentRegistry';

type TextEntry = { page: number; text: string };

// jsPDF assigns `text` (and friends) as an own instance property in its
// constructor rather than on the prototype, so vi.spyOn(jsPDF.prototype, ...)
// can't intercept it. Wrap the real class instead: call through to the real
// constructor, then wrap the instance's own `text` method to record which
// page each call landed on.
let capturedEntries: TextEntry[] = [];
vi.mock('jspdf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jspdf')>();
  class TrackedJsPDF extends actual.jsPDF {
    constructor(...args: ConstructorParameters<typeof actual.jsPDF>) {
      super(...args);
      const originalText = this.text.bind(this);
      this.text = ((...targs: Parameters<typeof originalText>) => {
        const [text] = targs;
        if (typeof text === 'string') {
          capturedEntries.push({ page: this.getCurrentPageInfo().pageNumber, text });
        }
        return originalText(...targs);
      }) as typeof this.text;
    }
  }
  return { ...actual, jsPDF: TrackedJsPDF };
});

const { renderDocumentTemplateToPdf } = await import('../documentPdfRenderer.service');

const STATES: SupportedDocumentState[] = ['CA', 'TX', 'FL', 'NY', 'AZ'];

/**
 * Render a document while recording, for every doc.text() call, the exact
 * page it landed on. Headings and signature labels are short enough to
 * always render as a single text() call (verified below), so we can locate
 * them by exact string match and check page-adjacency against the piece
 * that must stay with them.
 */
function renderAndTrackPages(state: SupportedDocumentState, docType: 'lease' | 'purchase'): TextEntry[] {
  capturedEntries = [];

  const template = getDocumentTemplate(docType, state);
  if (docType === 'lease') {
    const form = { ...getLeaseAgreementFormDefaults(), property_state: state, lead_paint_disclosure_required: false };
    const values = buildLeaseFormContext(form, state);
    renderDocumentTemplateToPdf({
      template,
      values,
      generatedAtLabel: 'Generated 2:57 AM local time at the Property (Pacific Time)',
    });
  } else {
    const form = {
      ...getPurchaseAgreementFormDefaults(),
      property_state: state,
      governing_law_state: state,
      lead_paint_disclosure_required: false,
    };
    const values = buildPurchaseFormContext(form, state);
    renderDocumentTemplateToPdf({
      template,
      values,
      generatedAtLabel: 'Generated 2:57 AM local time at the Property (Pacific Time)',
      initialsFooter: true,
    });
  }

  return capturedEntries;
}

function pageOfExactText(entries: TextEntry[], text: string, fromIndex = 0): { page: number; index: number } {
  const index = entries.findIndex((e, i) => i >= fromIndex && e.text === text);
  if (index === -1) {
    throw new Error(`text not found as a single text() call (may have wrapped to multiple lines): ${text}`);
  }
  return { page: entries[index].page, index };
}

describe('documentPdfRenderer pagination — issue 5 keep-together regression', () => {
  const docTypes: Array<'lease' | 'purchase'> = ['lease', 'purchase'];

  for (const docType of docTypes) {
    for (const state of STATES) {
      it(`${docType} ${state}: no signature label is separated from its own Date line by a page break`, () => {
        const entries = renderAndTrackPages(state, docType);
        const template = getDocumentTemplate(docType, state);
        const signatureSections = template.sections.filter((s) => s.kind === 'signature');
        expect(signatureSections.length).toBeGreaterThan(0);

        let cursor = 0;
        for (const section of signatureSections) {
          const label = section.signatureLabel ?? 'Signature';
          const { page: labelPage, index: labelIndex } = pageOfExactText(entries, label, cursor);
          const { page: datePage } = pageOfExactText(entries, 'Date: _______________', labelIndex + 1);
          expect(datePage, `"${label}" (page ${labelPage}) split from its Date line (page ${datePage})`).toBe(
            labelPage,
          );
          cursor = labelIndex + 1;
        }
      });

      it(`${docType} ${state}: no section heading is orphaned from the first line of its body by a page break`, () => {
        const entries = renderAndTrackPages(state, docType);
        const template = getDocumentTemplate(docType, state);
        const headedSections = template.sections.filter(
          (s) => s.heading && s.body && s.kind !== 'signature' && s.kind !== 'addendum_slot',
        );
        expect(headedSections.length).toBeGreaterThan(0);

        let cursor = 0;
        for (const section of headedSections) {
          const { page: headingPage, index: headingIndex } = pageOfExactText(entries, section.heading!, cursor);
          const nextEntry = entries[headingIndex + 1];
          expect(nextEntry, `no text found after heading "${section.heading}"`).toBeDefined();
          expect(
            nextEntry.page,
            `heading "${section.heading}" (page ${headingPage}) orphaned from its body (page ${nextEntry.page})`,
          ).toBe(headingPage);
          cursor = headingIndex + 1;
        }
      });
    }
  }
});
