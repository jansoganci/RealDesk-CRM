/**
 * Jurisdictions for which RealDesk may generate V1 draft lease/purchase PDFs.
 * Unsupported states must fail generation — never emit a silent generic summary.
 */

export const SUPPORTED_DOCUMENT_STATES = ['CA', 'TX', 'FL', 'NY', 'AZ'] as const;

export type SupportedDocumentState = (typeof SUPPORTED_DOCUMENT_STATES)[number];

export const SUPPORTED_DOCUMENT_STATE_SET = new Set<string>(SUPPORTED_DOCUMENT_STATES);

export function isSupportedDocumentState(state: string | null | undefined): state is SupportedDocumentState {
  if (!state) return false;
  return SUPPORTED_DOCUMENT_STATE_SET.has(state.trim().toUpperCase());
}

export function normalizeUsStateCode(state: string | null | undefined): string {
  return (state ?? '').trim().toUpperCase();
}

export class UnsupportedDocumentJurisdictionError extends Error {
  readonly code = 'UNSUPPORTED_DOCUMENT_JURISDICTION' as const;
  readonly state: string;

  constructor(state: string) {
    const normalized = normalizeUsStateCode(state) || '(missing)';
    super(
      `RealDesk cannot generate a draft lease/purchase document for jurisdiction "${normalized}". Supported states: ${SUPPORTED_DOCUMENT_STATES.join(', ')}.`,
    );
    this.name = 'UnsupportedDocumentJurisdictionError';
    this.state = normalized;
  }
}

export function assertSupportedDocumentState(state: string | null | undefined): SupportedDocumentState {
  const normalized = normalizeUsStateCode(state);
  if (!isSupportedDocumentState(normalized)) {
    throw new UnsupportedDocumentJurisdictionError(normalized);
  }
  return normalized;
}
