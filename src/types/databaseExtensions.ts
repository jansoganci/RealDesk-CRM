import type { Database, Json } from './database.types';
import type { Database as FullDatabase } from './database';

type DealRow = Database['public']['Tables']['deals']['Row'];
type OfferNegotiationRow = Database['public']['Tables']['offer_negotiations']['Row'];

type ContractDocumentArtifactRow = {
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
  input_snapshot: Json | null;
  counsel_approval_ref: string | null;
  created_at: string;
};

type ContractDocumentArtifactInsert = {
  id?: string;
  org_id: string;
  user_id: string;
  contract_id: string;
  deal_id?: string | null;
  doc_type: string;
  jurisdiction: string;
  template_id: string;
  template_version: string;
  generated_at?: string;
  source_transaction_id: string;
  storage_path?: string | null;
  input_snapshot?: Json | null;
  counsel_approval_ref?: string | null;
  created_at?: string;
};

type ExtendedTables = Pick<
  FullDatabase['public']['Tables'],
  'commissions' | 'user_preferences'
> & {
  contract_document_artifacts: {
    Row: ContractDocumentArtifactRow;
    Insert: ContractDocumentArtifactInsert;
    Update: Partial<ContractDocumentArtifactInsert>;
    Relationships: [];
  };
};

type ExtendedFunctions = Pick<
  FullDatabase['public']['Functions'],
  'rpc_record_commission_and_close_deal'
>;

export type RpcConvertLeadToDealArgs = {
  p_deal: Json;
  p_lead_id: string;
  p_org_id: string;
  p_property_id: string;
};

export type RpcConvertLeadToDealResult = {
  deal: DealRow;
  negotiation: OfferNegotiationRow;
};

/**
 * App-owned RPC declarations that have not yet been folded into generated types.
 * Keeping them outside database.types.ts lets migrations and client code land together
 * without hand-editing generated Supabase output.
 */
export type AppDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & ExtendedTables;
    Functions: Database['public']['Functions'] & ExtendedFunctions & {
      rpc_convert_lead_to_deal: {
        Args: RpcConvertLeadToDealArgs;
        Returns: RpcConvertLeadToDealResult;
      };
      ccpa_org_link_valid: {
        Args: { p_org_id: string };
        Returns: boolean;
      };
    };
  };
};
