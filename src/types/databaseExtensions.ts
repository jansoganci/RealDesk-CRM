import type { Database, Json } from './database.types';

type DealRow = Database['public']['Tables']['deals']['Row'];
type OfferNegotiationRow = Database['public']['Tables']['offer_negotiations']['Row'];

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
    Functions: Database['public']['Functions'] & {
      rpc_convert_lead_to_deal: {
        Args: RpcConvertLeadToDealArgs;
        Returns: RpcConvertLeadToDealResult;
      };
    };
  };
};
