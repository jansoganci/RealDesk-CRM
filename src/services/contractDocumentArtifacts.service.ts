import { supabase } from '@/config/supabase';
import { getAuthenticatedUserId } from '@/lib/auth';
import type { DocumentArtifactMeta } from '@/templates/documentRegistry';
import type { Json } from '@/types/database.types';

export type PersistDocumentArtifactInput = {
  orgId: string;
  contractId: string;
  dealId?: string | null;
  storagePath: string | null;
  meta: DocumentArtifactMeta;
  inputSnapshot?: Record<string, unknown> | null;
  counselApprovalRef?: string | null;
};

export type ContractDocumentArtifactRow = {
  id: string;
  org_id: string;
  user_id: string;
  contract_id: string;
  deal_id: string | null;
  doc_type: string;
  jurisdiction: string;
  template_id: string;
  template_version: string;
  generated_at: string;
  source_transaction_id: string;
  storage_path: string | null;
  counsel_approval_ref: string | null;
};

/**
 * Inserts an immutable artifact row and points contracts.current_document_artifact_id at it.
 * Table added in migration 0052.
 */
export async function persistContractDocumentArtifact(
  input: PersistDocumentArtifactInput,
): Promise<ContractDocumentArtifactRow> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('contract_document_artifacts')
    .insert({
      org_id: input.orgId,
      user_id: userId,
      contract_id: input.contractId,
      deal_id: input.dealId ?? null,
      doc_type: input.meta.doc_type,
      jurisdiction: input.meta.jurisdiction,
      template_id: input.meta.template_id,
      template_version: input.meta.template_version,
      generated_at: input.meta.generated_at,
      source_transaction_id: input.contractId,
      storage_path: input.storagePath,
      input_snapshot: (input.inputSnapshot as Json | null) ?? null,
      counsel_approval_ref: input.counselApprovalRef ?? 'pending-attorney-review',
    })
    .select(
      'id, org_id, user_id, contract_id, deal_id, doc_type, jurisdiction, template_id, template_version, generated_at, source_transaction_id, storage_path, counsel_approval_ref',
    )
    .single();

  if (error) throw error;

  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      pdf_generated_at: input.meta.generated_at,
      // Column from migration 0052 — not yet in generated Database types.
      ...({ current_document_artifact_id: data.id } as Record<string, string>),
    })
    .eq('id', input.contractId);

  if (updateError) throw updateError;

  return data;
}
