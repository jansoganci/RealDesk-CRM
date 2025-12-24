/**
 * Contract Builder V2 Types
 * Types for the new contract templates and instances system
 */

export type ContractType = 'sale' | 'rent' | 'commission' | 'showing';
export type ContractStatus = 'draft' | 'final' | 'signed' | 'archived' | 'cancelled';

/**
 * Contract Template V2 - stored in contract_templates_v2 table
 */
export interface ContractTemplateV2 {
  id: string;
  user_id: string;
  type: ContractType;
  name: string;
  content: string;
  placeholders: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Contract Instance V2 - stored in contract_instances_v2 table
 */
export interface ContractInstanceV2 {
  id: string;
  user_id: string;
  template_id: string | null;
  type: ContractType;
  title: string;
  form_data: Record<string, unknown>;
  rendered_content: string;
  parties: ContractParties;
  status: ContractStatus;
  signed_at: string | null;
  signed_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Parties involved in a contract
 */
export interface ContractParties {
  seller?: PartyInfo;
  buyer?: PartyInfo;
  landlord?: PartyInfo;
  tenant?: PartyInfo;
  agent?: PartyInfo;
}

export interface PartyInfo {
  name: string;
  tc_no?: string;
  phone?: string;
  email?: string;
  address?: string;
}

/**
 * Create instance request payload
 */
export interface CreateContractInstanceRequest {
  type: ContractType;
  template_id?: string;
  title: string;
  form_data: Record<string, unknown>;
  rendered_content: string;
  parties: ContractParties;
  status: ContractStatus;
}

/**
 * Update instance request payload
 */
export interface UpdateContractInstanceRequest {
  title?: string;
  form_data?: Record<string, unknown>;
  rendered_content?: string;
  parties?: ContractParties;
  status?: ContractStatus;
  signed_at?: string;
  signed_by?: string;
}

/**
 * Sale contract form data structure
 */
export interface SaleContractFormData {
  // Title
  title?: string;

  // Seller info
  seller_name: string;
  seller_tc_no: string;
  seller_phone: string;
  seller_email: string;
  seller_address: string;

  // Buyer info
  buyer_name: string;
  buyer_tc_no: string;
  buyer_phone: string;
  buyer_email: string;
  buyer_address: string;

  // Property info
  property_address: string;
  title_deed_no: string;
  parcel_no: string;
  block_no: string;
  square_meters: string;

  // Sale terms
  sale_price: string;
  currency: string;
  payment_method: string;
  deposit_amount: string;
  closing_date: string;

  // Additional
  special_conditions?: string;
}
