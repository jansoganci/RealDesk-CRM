import { describe, expect, it } from 'vitest';

import {
  assertSupportedDocumentState,
  isSupportedDocumentState,
  SUPPORTED_DOCUMENT_STATES,
  UnsupportedDocumentJurisdictionError,
} from '../supportedDocumentStates';

describe('supportedDocumentStates', () => {
  it('lists exactly the five product jurisdictions', () => {
    expect([...SUPPORTED_DOCUMENT_STATES].sort()).toEqual(['AZ', 'CA', 'FL', 'NY', 'TX']);
  });

  it('accepts supported states case-insensitively', () => {
    expect(isSupportedDocumentState('ca')).toBe(true);
    expect(assertSupportedDocumentState('ny')).toBe('NY');
  });

  it('rejects unsupported states such as Ohio', () => {
    expect(isSupportedDocumentState('OH')).toBe(false);
    expect(() => assertSupportedDocumentState('OH')).toThrow(UnsupportedDocumentJurisdictionError);
  });
});
