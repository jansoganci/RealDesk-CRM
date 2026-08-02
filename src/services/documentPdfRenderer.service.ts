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

function measureParagraphHeight(
  doc: jsPDF,
  text: string,
  opts: { fontSize: number; fontStyle?: 'normal' | 'bold' | 'italic'; maxWidth: number; lineGapMm?: number },
): number {
  const style = opts.fontStyle ?? 'normal';
  doc.setFont(FONT, style);
  doc.setFontSize(opts.fontSize);
  const lh = lineHeightMm(opts.fontSize);
  const lines = doc.splitTextToSize(text.trim(), opts.maxWidth);
  return lines.length * lh + (opts.lineGapMm ?? 2);
}

/**
 * Reserve `blockHeightMm` as one atomic unit: if it won't fit in the space
 * remaining on the current page, break to a fresh page before drawing
 * anything, so a multi-piece block (signature label + line + date, or a
 * heading + the start of its body) never splits across the page boundary.
 */
function withKeepTogether(
  doc: jsPDF,
  y: number,
  pageH: number,
  margin: number,
  blockHeightMm: number,
  draw: (startY: number) => number,
): number {
  let startY = y;
  if (startY + blockHeightMm > pageH - margin) {
    doc.addPage();
    startY = margin;
  }
  return draw(startY);
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

const SIGNATURE_LINE_ROW_MM = 12;

function drawSignatureRow(
  doc: jsPDF,
  y: number,
  label: string,
  margin: number,
  maxWidth: number,
  pageH: number,
): number {
  const labelHeight = measureParagraphHeight(doc, label, {
    fontSize: BODY_PT,
    fontStyle: 'bold',
    maxWidth,
    lineGapMm: 6,
  });
  const dateHeight = measureParagraphHeight(doc, 'Date: _______________', {
    fontSize: BODY_PT,
    maxWidth,
    lineGapMm: 10,
  });

  return withKeepTogether(
    doc,
    y,
    pageH,
    margin,
    labelHeight + SIGNATURE_LINE_ROW_MM + dateHeight,
    (startY) => {
      let curY = writeParagraph(doc, startY, label, {
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
      doc.line(margin, curY, margin + 80, curY);
      curY += 6;
      return writeParagraph(doc, curY, 'Date: _______________', {
        fontSize: BODY_PT,
        margin,
        maxWidth,
        pageH,
        lineGapMm: 10,
      });
    },
  );
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

/**
 * Draw a section heading, reserving enough space for the heading plus at
 * least one line of the body that follows it — otherwise the heading can be
 * left as the last line on a page (an orphaned heading) with its entire body
 * pushed to the next page. Does not force the whole body to stay on the same
 * page; only the heading + first body line are kept together.
 */
function writeHeadingKeptWithBody(
  doc: jsPDF,
  y: number,
  heading: string,
  hasBody: boolean,
  opts: { maxW: number; contentPageH: number },
): number {
  const headingHeight = measureParagraphHeight(doc, heading, {
    fontSize: SECTION_PT,
    fontStyle: 'bold',
    maxWidth: opts.maxW,
    lineGapMm: 3,
  });
  const bodyLeadInHeight = hasBody ? lineHeightMm(BODY_PT) : 0;
  return withKeepTogether(
    doc,
    y,
    opts.contentPageH,
    MARGIN_MM,
    headingHeight + bodyLeadInHeight,
    (startY) =>
      writeParagraph(doc, startY, heading, {
        fontSize: SECTION_PT,
        fontStyle: 'bold',
        margin: MARGIN_MM,
        maxWidth: opts.maxW,
        pageH: opts.contentPageH,
        lineGapMm: 3,
      }),
  );
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
      curY = writeHeadingKeptWithBody(doc, curY, section.heading, true, opts);
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

  let resolvedBody: string | undefined;
  if (section.body) {
    const body =
      section.kind === 'mapped' ? interpolateTemplate(section.body, values) : section.body.replace(
        /\{\{\s*jurisdiction_placeholder\s*\}\}/g,
        values.jurisdiction ?? '—',
      );
    // also allow {{jurisdiction}} in static via light interpolate
    resolvedBody = interpolateTemplate(body, values);
  }

  if (section.heading) {
    curY = writeHeadingKeptWithBody(doc, curY, section.heading, resolvedBody != null, opts);
  }

  if (resolvedBody != null) {
    curY = writeParagraph(doc, curY, resolvedBody, {
      fontSize: BODY_PT,
      margin: MARGIN_MM,
      maxWidth: opts.maxW,
      pageH: opts.contentPageH,
      lineGapMm: 6,
    });
  }

  return curY;
}
