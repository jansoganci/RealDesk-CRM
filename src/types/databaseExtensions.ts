import type { Database, Json } from './database.types';
import type { Database as FullDatabase } from './database';

type DealRow = Database['public']['Tables']['deals']['Row'];
type OfferNegotiationRow = Database['public']['Tables']['offer_negotiations']['Row'];

type ExtendedTables = Pick<
  FullDatabase['public']['Tables'],
  'commissions' | 'user_preferences'
>;

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
