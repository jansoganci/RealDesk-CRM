/**
 * Template-driven jsPDF renderer for Closewell V1 draft lease/purchase documents.
 */

import { jsPDF } from 'jspdf';

import type { SupportedDocumentState } from '@/config/supportedDocumentStates';
import {
  buildAttorneyDisclaimer,
  interpolateTemplate,
  type DocumentTemplate,
  type TemplateSection,
} from '@/templates/documentRegistry';

const FONT = 'helvetica' as const;
const BODY_PT = 10;
const TITLE_PT = 14;
const SECTION_PT = 11;
const MARGIN_MM = 18;
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
  doc.setFont(FONT, style);
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
  doc.setFont(FONT, 'normal');
  doc.setFontSize(BODY_PT);
  doc.setLineWidth(0.3);
  if (curY + 12 > pageH - margin) {
    doc.addPage();
    curY = margin;
  }
  doc.line(margin, curY, margin + 80, curY);
  curY += 6;
  return writeParagraph(doc, curY, 'Date: _______________', {
    fontSize: BODY_PT,
    margin,
    maxWidth,
    pageH,
    lineGapMm: 10,
  });
}

export type RenderDocumentPdfInput = {
  template: DocumentTemplate;
  values: Record<string, string>;
  /** Optional fully built lead-paint addendum body; omit to skip addendum_slot. */
  leadAddendumBody?: string | null;
  generatedAtLabel?: string;
  /** When true, stamp buyer/seller initials line above the template footer (purchase). */
  initialsFooter?: boolean;
};

export function renderDocumentTemplateToPdf(input: RenderDocumentPdfInput): Blob {
  const { template, values } = input;
  const state = template.jurisdiction as SupportedDocumentState;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const { w, h } = pageSize(doc);
  const maxW = w - 2 * MARGIN_MM;
  const contentPageH = h - MARGIN_MM - FOOTER_RESERVE_MM;
  let y = MARGIN_MM;

  y = writeParagraph(doc, y, template.title, {
    fontSize: TITLE_PT,
    fontStyle: 'bold',
    margin: MARGIN_MM,
    maxWidth: maxW,
    pageH: contentPageH,
    lineGapMm: 4,
  });

  y = writeParagraph(doc, y, buildAttorneyDisclaimer(state, template.docType), {
    fontSize: 9,
    fontStyle: 'italic',
    margin: MARGIN_MM,
    maxWidth: maxW,
    pageH: contentPageH,
    lineGapMm: 6,
  });

  y = writeParagraph(
    doc,
    y,
    `Template: ${template.id} · Version: ${template.version} · Jurisdiction: ${template.jurisdiction}`,
    {
      fontSize: 8,
      fontStyle: 'normal',
      margin: MARGIN_MM,
      maxWidth: maxW,
      pageH: contentPageH,
      lineGapMm: 6,
    },
  );

  for (const section of template.sections) {
    y = renderSection(doc, y, section, values, {
      maxW,
      contentPageH,
      leadAddendumBody: input.leadAddendumBody,
    });
  }

  if (input.generatedAtLabel) {
    y = writeParagraph(doc, y, input.generatedAtLabel, {
      fontSize: 9,
      fontStyle: 'italic',
      margin: MARGIN_MM,
      maxWidth: maxW,
      pageH: contentPageH,
      lineGapMm: 4,
    });
  }

  // Per-page footer with template id (+ optional initials for purchase)
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    if (input.initialsFooter) {
      doc.setFont(FONT, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(55, 55, 55);
      const initials = "Buyer's Initials _______     Seller's Initials _______";
      const tw = doc.getTextWidth(initials);
      doc.text(initials, (w - tw) / 2, h - 14);
      doc.setTextColor(0, 0, 0);
    }
    doc.setFont(FONT, 'italic');
    doc.setFontSize(8);
    doc.text(
      `${template.title} · ${template.id} · Page ${i} of ${pageCount}`,
      MARGIN_MM,
      h - 8,
      { maxWidth: maxW },
    );
  }

  return doc.output('blob');
}

function renderSection(
  doc: jsPDF,
  y: number,
  section: TemplateSection,
  values: Record<string, string>,
  opts: { maxW: number; contentPageH: number; leadAddendumBody?: string | null },
): number {
  if (section.kind === 'addendum_slot') {
    if (!opts.leadAddendumBody?.trim()) return y;
    let curY = y;
    if (section.heading) {
      curY = writeParagraph(doc, curY, section.heading, {
        fontSize: SECTION_PT,
        fontStyle: 'bold',
        margin: MARGIN_MM,
        maxWidth: opts.maxW,
        pageH: opts.contentPageH,
        lineGapMm: 3,
      });
    }
    return writeParagraph(doc, curY, opts.leadAddendumBody, {
      fontSize: BODY_PT,
      margin: MARGIN_MM,
      maxWidth: opts.maxW,
      pageH: opts.contentPageH,
      lineGapMm: 6,
    });
  }

  if (section.kind === 'signature') {
    return drawSignatureRow(
      doc,
      y,
      section.signatureLabel ?? 'Signature',
      MARGIN_MM,
      opts.maxW,
      opts.contentPageH,
    );
  }

  let curY = y;
  if (section.heading) {
    curY = writeParagraph(doc, curY, section.heading, {
      fontSize: SECTION_PT,
      fontStyle: 'bold',
      margin: MARGIN_MM,
      maxWidth: opts.maxW,
      pageH: opts.contentPageH,
      lineGapMm: 3,
    });
  }

  if (section.body) {
    const body =
      section.kind === 'mapped' ? interpolateTemplate(section.body, values) : section.body.replace(
        /\{\{\s*jurisdiction_placeholder\s*\}\}/g,
        values.jurisdiction ?? '—',
      );
    // also allow {{jurisdiction}} in static via light interpolate
    const resolved = interpolateTemplate(body, values);
    curY = writeParagraph(doc, curY, resolved, {
      fontSize: BODY_PT,
      margin: MARGIN_MM,
      maxWidth: opts.maxW,
      pageH: opts.contentPageH,
      lineGapMm: 6,
    });
  }

  return curY;
}
