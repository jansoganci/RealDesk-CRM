/**
 * Contract Management Types
 * Type definitions for contract creation and management
 */

// ============================================================================
// Address Types
// ============================================================================

export interface AddressComponents {
  mahalle: string;
  cadde_sokak: string;
  bina_no: string;
  daire_no?: string;
  ilce: string;
  il: string;
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
  tc_encrypted: string;
  tc_hash: string;
  iban_encrypted: string;
  phone: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface EncryptedTenant {
  id: string;
  user_id: string;
  name: string;
  tc_encrypted: string;
  tc_hash: string;
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
  mahalle: string;
  cadde_sokak: string;
  bina_no: string;
  daire_no?: string;
  ilce: string;
  il: string;
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
  status: 'draft' | 'active' | 'expired' | 'terminated';
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
// Form Data Types (used by React Hook Form)
// ============================================================================

export interface ContractFormData {
  // Owner
  owner_name: string;
  owner_tc: string;
  owner_iban: string;
  owner_phone: string;
  owner_email?: string;

  // Tenant
  tenant_name: string;
  tenant_tc: string;
  tenant_phone: string;
  tenant_email?: string;
  tenant_address: string;

  // Property
  mahalle: string;
  cadde_sokak: string;
  bina_no: string;
  daire_no?: string;
  ilce: string;
  il: string;
  property_type: 'apartment' | 'house' | 'commercial';
  use_purpose?: string;

  // Contract
  start_date: Date;
  end_date: Date;
  rent_amount: number;
  deposit: number;

  // Details (optional)
  payment_day_of_month?: number;
  payment_method?: string;
  special_conditions?: string;
}

// ============================================================================
// RPC Function Types
// ============================================================================

export interface CreateContractAtomicParams {
  owner_data: {
    name: string;
    tc_encrypted: string;
    tc_hash: string;
    iban_encrypted: string;
    phone: string;
    email?: string;
  };
  tenant_data: {
    name: string;
    tc_encrypted: string;
    tc_hash: string;
    phone: string;
    email?: string;
    address: string;
  };
  property_data: {
    mahalle: string;
    cadde_sokak: string;
    bina_no: string;
    daire_no?: string;
    ilce: string;
    il: string;
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
  // Sözleşme
  contractNumber: string;
  contractDate: string;           // "01/01/2025" formatında
  
  // Mülk Bilgileri
  mahalle: string;
  ilce: string;
  il: string;
  sokak: string;
  binaNo: string;
  daireNo: string;
  propertyType: string;           // "Daire", "Dükkan", etc.
  propertyUsage: string;          // "Mesken", "İşyeri", etc.
  
  // Kiraya Veren (Mal Sahibi)
  ownerName: string;
  ownerTC?: string;               // TC Kimlik No (PDF için gerekli)
  ownerPhone?: string;
  ownerIBAN: string;

  // Kiracı
  tenantName: string;
  tenantTC?: string;              // TC Kimlik No (PDF için gerekli)
  tenantAddress: string;
  tenantPhone: string;
  
  // Kira Detayları
  monthlyRentNumber: number;      // 15000
  monthlyRentText: string;        // "ONBEŞBİN"
  yearlyRentNumber: number;       // 180000
  yearlyRentText: string;         // "YÜZSEKSENBİN"
  
  // Tarihler
  startDate: string;              // "01 Ocak 2025"
  endDate: string;                // "01 Ocak 2026"
  paymentDay: string;             // "1" veya "5" etc.
  
  // Depozito
  depositAmount: number;          // 30000
  depositText: string;            // "OTUZBİN"
  
  // Demirbaş
  fixtures: string;               // "Kombi, Klima, Ankastre Set..."
  
  // Tahliye Taahhütnamesi
  evictionDate: string;           // "01 Ocak 2026"
  commitmentDate: string;         // "01 Ocak 2025"
}
