import type { Database, Json } from './database.types';

// contracts: rpc_create_lease_contract (Sprint 6A US lease wizard)
export interface RpcCreateLeaseContractParams {
  p_contract: Json;
  p_lease_details: Json;
}
export type RpcCreateLeaseContractResult = string;

// contracts: rpc_create_purchase_contract (Sprint 6B purchase wizard)
export interface RpcCreatePurchaseContractParams {
  p_contract: Json;
  p_purchase_details: Json;
  p_deal_id?: string | null;
}
export interface RpcCreatePurchaseContractResult {
  contract_id: string;
  deal_id: string;
  offer_round_id: string;
}

// contracts: rpc_create_contract_and_update_property
export interface RpcCreateContractAndUpdatePropertyParams {
  p_contract: Database['public']['Tables']['contracts']['Insert'];
}
export type RpcCreateContractAndUpdatePropertyResult = Database['public']['Tables']['contracts']['Row'];

// photos: rpc_property_photo_insert
export interface RpcPropertyPhotoInsertParams {
  p_property_id: string;
  p_file_path: string;
}
export type RpcPropertyPhotoInsertResult = Database['public']['Tables']['property_photos']['Row'];

// photos: rpc_property_photos_reorder
export interface RpcPropertyPhotosReorderParams {
  p_property_id: string;
  p_photo_ids: string[];
}
export type RpcPropertyPhotosReorderResult = void;

// photos: rpc_property_photo_delete (returns file_path)
export interface RpcPropertyPhotoDeleteParams {
  p_property_id: string;
  p_photo_id: string;
}
export type RpcPropertyPhotoDeleteResult = string;

// tenants: rpc_create_tenant_with_contract
export interface RpcCreateTenantWithContractParams {
  p_tenant: Database['public']['Tables']['tenants']['Insert'];
  p_contract: Database['public']['Tables']['contracts']['Insert'];
}
export interface RpcCreateTenantWithContractResult {
  tenant_id: string;
  contract_id: string;
}

// tenants: rpc_rollback_tenant_with_contract
export interface RpcRollbackTenantWithContractParams {
  p_tenant_id: string;
  p_contract_id: string;
}
export type RpcRollbackTenantWithContractResult = void;

// contracts: rpc_update_contract_status
export interface RpcUpdateContractStatusParams {
  p_contract_id: string;
  p_new_status: string;
}
export type RpcUpdateContractStatusResult = Database['public']['Tables']['contracts']['Row'];

// contracts: rpc_delete_contract
export interface RpcDeleteContractParams {
  p_contract_id: string;
}
export interface RpcDeleteContractResult {
  success: boolean;
  property_id: string;
}

// organizations: accept_org_invitation
export interface AcceptOrgInvitationParams {
  p_token: string;
}
export interface AcceptOrgInvitationResult {
  success: boolean;
  message: string;
  error?: string;
  org_id?: string;
}

// organizations: get_invitation_info
export interface GetInvitationInfoParams {
  p_token: string;
}
export interface GetInvitationInfoResult {
  valid: boolean;
  org_name?: string;
  org_logo?: string | null;
  role?: string;
  invited_by_name?: string | null;
  invited_at?: string;
  expires_at?: string;
  expired?: boolean;
}
