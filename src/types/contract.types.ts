/**
 * Contract Management Types
 * Type definitions for contract creation and management
 */

// ============================================================================
// Address Types (US Format)
// ============================================================================

export interface AddressComponents {
  street_address: string;
  unit?: string;
  city: string;
  state: string;
  zip_code: string;
}

// ============================================================================
// Contract Creation Types
// ============================================================================

export interface ContractCreationResult {
  success: boolean;
  owner_id: string;
  tenant_id: string;
  property_id: string;
  contract_id: string;
  contract_details_id?: string;
  created_owner: boolean;
  created_tenant: boolean;
  created_property: boolean;
  message: string;
}

// ============================================================================
// Encrypted Entity Types
// ============================================================================

export interface EncryptedOwner {
  id: string;
  user_id: string;
  name: string;
  tax_id_encrypted: string;
  tax_id_hash: string;
  routing_number_encrypted: string;
  account_number_encrypted: string;
  phone: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface EncryptedTenant {
  id: string;
  user_id: string;
  name: string;
  tax_id_encrypted: string;
  tax_id_hash: string;
  phone: string;
  email?: string;
  address: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Property with Components
// ============================================================================

export interface PropertyWithComponents {
  id: string;
  user_id: string;
  owner_id: string;
  // Database columns (Turkish format - legacy)
  mahalle?: string;
  cadde_sokak?: string;
  bina_no?: string;
  daire_no?: string;
  district_legacy?: string;
  il?: string;
  // US format columns (will be added in migration)
  street_address?: string;
  unit?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  // Common fields
  full_address: string;
  normalized_address: string;
  type: 'apartment' | 'house' | 'commercial';
  use_purpose?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Contract with Details
// ============================================================================

export interface ContractWithDetails {
  id: string;
  user_id: string;
  tenant_id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit: number;
  commission_amount?: number | null; // Manual commission amount (null = use rent_amount)
  status: 'Active' | 'Archived' | 'Inactive';
  created_at: string;
  updated_at: string;
  tenant?: EncryptedTenant;
  property?: PropertyWithComponents;
  details?: ContractDetails;
}

export interface ContractDetails {
  id: string;
  contract_id: string;
  user_id: string;
  payment_day_of_month?: number;
  payment_method?: string;
  annual_rent?: number;
  rent_increase_rate?: number;
  deposit_currency?: 'TRY' | 'USD' | 'EUR';
  special_conditions?: string;
  furniture_list?: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Clause Types (Editable Contract Clauses Feature)
// ============================================================================

export type ClauseType = 'GENEL_SARTLAR' | 'OZEL_SARTLAR' | 'TAHLIYE_TAAHHUTNAMESI';

export interface ClauseTemplate {
  id: string;
  user_id: string;
  clause_type: ClauseType;
  clause_index: number;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClauseOverride {
  id: string;
  contract_id: string;
  user_id: string;
  clause_type: ClauseType;
  clause_index: number;
  custom_content: string;
  created_at: string;
  updated_at: string;
}

export interface MergedClause {
  clause_type: ClauseType;
  clause_index: number;
  content: string;
  is_customized: boolean;
}

export interface EditableClause {
  type: ClauseType;
  index: number;
  content: string;
  isCustomized: boolean;
  isEditing: boolean;
}

export interface TemplateVariables {
  paymentDay?: string;
  ownerIBAN?: string;
  ownerName?: string;
  tenantName?: string;
  contractDate?: string;
}

// ============================================================================
// Form Data Types (used by React Hook Form) — source of truth: contractForm.schema.ts
// ============================================================================

export type { ContractFormData } from '@/features/contracts/schemas/contractForm.schema';

// ============================================================================
// RPC Function Types
// ============================================================================

export interface CreateContractAtomicParams {
  owner_data: {
    name: string;
    tax_id_encrypted: string;
    tax_id_hash: string;
    routing_number_encrypted: string;
    account_number_encrypted: string;
    phone: string;
    email?: string;
  };
  tenant_data: {
    name: string;
    tax_id_encrypted: string;
    tax_id_hash: string;
    phone: string;
    email?: string;
    address: string;
  };
  property_data: {
    street_address: string;
    unit?: string;
    city: string;
    state: string;
    zip_code: string;
    full_address: string;
    normalized_address: string;
    type: string;
    use_purpose?: string;
  };
  contract_data: {
    start_date: string;
    end_date: string;
    rent_amount: number;
    deposit: number;
    commission_amount?: number | null;
  };
  contract_details_data?: {
    payment_day_of_month?: number;
    payment_method?: string;
    annual_rent?: number;
    rent_increase_rate?: number;
    deposit_currency?: string;
    special_conditions?: string;
    furniture_list?: string[];
  };
  user_id_param: string;
}

// ============================================================================
// PDF Generation Types
// ============================================================================

export interface ContractPdfData {
  // Contract
  contractNumber: string;
  contractDate: string;           // "01/01/2025" format
  
  // Property Information (US Format)
  streetAddress: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;           // "Apartment", "House", "Commercial"
  propertyUsage: string;          // "Residential", "Office", "Retail", etc.
  
  // Landlord (Owner)
  ownerName: string;
  ownerTaxId?: string;            // Tax ID (EIN/SSN) for PDF
  ownerPhone?: string;
  ownerRoutingNumber: string;
  ownerAccountNumber: string;

  // Tenant
  tenantName: string;
  tenantTaxId?: string;           // Tax ID (SSN/EIN) for PDF
  tenantAddress: string;
  tenantPhone: string;
  
  // Rent Details
  monthlyRentNumber: number;      // 1500
  monthlyRentText: string;        // "One Thousand Five Hundred"
  yearlyRentNumber: number;       // 18000
  yearlyRentText: string;         // "Eighteen Thousand"
  
  // Dates
  startDate: string;              // "January 01, 2025"
  endDate: string;                // "January 01, 2026"
  paymentDay: string;             // "1" or "5" etc.
  
  // Deposit
  depositAmount: number;          // 3000
  depositText: string;            // "Three Thousand"
  
  // Currency
  currency: 'TRY' | 'USD' | 'EUR';
  
  // Fixtures & Appliances
  fixtures: string;               // "HVAC, Refrigerator, Dishwasher..."

  // Paint Condition
  isPainted: boolean;             // true: painted, false: not painted

  // Eviction Commitment
  evictionDate: string;           // Empty string "" (left blank for manual entry)
  commitmentDate: string;         // "January 01, 2025"

  // Google Drive folder link (for QR code)
  handoverPhotosUrl?: string;
}
