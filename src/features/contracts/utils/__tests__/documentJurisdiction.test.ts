import { describe, expect, it } from 'vitest';

import { SUPPORTED_DOCUMENT_STATES } from '@/config/supportedDocumentStates';
import {
  assertPurchaseDocumentJurisdiction,
  isDocumentPropertyEntryBlocked,
} from '../documentJurisdiction';

describe('document jurisdiction guards', () => {
  it('allows every supported V1 document state', () => {
    for (const state of SUPPORTED_DOCUMENT_STATES) {
      expect(isDocumentPropertyEntryBlocked(state)).toBe(false);
      expect(() => assertPurchaseDocumentJurisdiction(state, state)).not.toThrow();
    }
  });

  it('blocks an existing property in an unsupported state', () => {
    expect(isDocumentPropertyEntryBlocked('OH')).toBe(true);
  });

  it('rejects unsupported or mismatched purchase jurisdictions before save', () => {
    expect(() => assertPurchaseDocumentJurisdiction('OH', 'OH')).toThrow(
      /cannot generate a draft lease\/purchase document/i,
    );
    expect(() => assertPurchaseDocumentJurisdiction('CA', 'TX')).toThrow(
      /property state and governing law must match/i,
    );
  });
});
