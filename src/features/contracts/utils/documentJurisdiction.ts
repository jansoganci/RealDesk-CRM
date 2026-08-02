import {
  assertSupportedDocumentState,
  isSupportedDocumentState,
  UnsupportedDocumentJurisdictionError,
} from '@/config/supportedDocumentStates';

export function isDocumentPropertyEntryBlocked(state: string | null | undefined): boolean {
  return !isSupportedDocumentState(state);
}

export function assertPurchaseDocumentJurisdiction(
  propertyState: string | null | undefined,
  governingState: string | null | undefined,
): void {
  const supportedPropertyState = assertSupportedDocumentState(propertyState);
  const supportedGoverningState = assertSupportedDocumentState(governingState);

  if (supportedPropertyState !== supportedGoverningState) {
    throw new UnsupportedDocumentJurisdictionError(
      `${supportedPropertyState}/${supportedGoverningState} (property state and governing law must match)`,
    );
  }
}
