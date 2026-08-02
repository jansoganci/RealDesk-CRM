import type { SupportedDocumentState } from '@/config/supportedDocumentStates';

export type DocumentDocType = 'lease' | 'purchase';

export type TemplateSectionKind = 'static' | 'mapped' | 'signature' | 'addendum_slot';

export type TemplateSection = {
  key: string;
  kind: TemplateSectionKind;
  /** Section heading shown in the PDF (optional). */
  heading?: string;
  /**
   * Body text. May include {{field_path}} placeholders for mapped sections.
   * Must be original RealDesk draft language (or public statute notice text where required).
   */
  body?: string;
  /** Signature block label for kind=signature */
  signatureLabel?: string;
};

export type DocumentTemplate = {
  id: string;
  docType: DocumentDocType;
  jurisdiction: SupportedDocumentState;
  version: string;
  title: string;
  counselApprovalRef: string;
  sections: TemplateSection[];
};

export type DocumentArtifactMeta = {
  template_id: string;
  template_version: string;
  jurisdiction: SupportedDocumentState;
  doc_type: DocumentDocType;
  generated_at: string;
};
