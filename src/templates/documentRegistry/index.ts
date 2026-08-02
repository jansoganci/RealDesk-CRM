import {
  assertSupportedDocumentState,
  type SupportedDocumentState,
} from '@/config/supportedDocumentStates';

import { buildLeaseTemplate } from './buildLeaseTemplate';
import { buildPurchaseTemplate } from './buildPurchaseTemplate';
import type { DocumentDocType, DocumentTemplate } from './types';

export type { DocumentArtifactMeta, DocumentDocType, DocumentTemplate, TemplateSection } from './types';
export { buildAttorneyDisclaimer } from './disclaimer';
export { buildLeaseFormContext } from './leaseFormContext';
export { buildPurchaseFormContext } from './purchaseFormContext';
export { interpolateTemplate } from './interpolate';
export { LEASE_TEMPLATE_VERSION } from './buildLeaseTemplate';
export { PURCHASE_TEMPLATE_VERSION } from './buildPurchaseTemplate';

export function getDocumentTemplate(
  docType: DocumentDocType,
  jurisdiction: string,
): DocumentTemplate {
  const state: SupportedDocumentState = assertSupportedDocumentState(jurisdiction);
  return docType === 'lease' ? buildLeaseTemplate(state) : buildPurchaseTemplate(state);
}
