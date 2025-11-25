/**
 * Type definitions for Review Step form data
 */

export interface ReviewFormData {
  // Owner
  owner_name: string;
  owner_tc: string;
  owner_phone: string;
  owner_email: string;
  owner_iban: string;

  // Tenant
  tenant_name: string;
  tenant_tc: string;
  tenant_phone: string;
  tenant_email: string;
  tenant_address: string;

  // Property
  mahalle: string;
  cadde_sokak: string;
  bina_no: string;
  daire_no: string;
  ilce: string;
  il: string;
  property_type: string;
  use_purpose: string;

  // Contract
  start_date: string;
  end_date: string;
  rent_amount: number | string;
  deposit: number | string;
  payment_day_of_month: number;
  payment_method: string;
  special_conditions: string;
}

export interface ParsedData {
  ownerName?: string;
  tenantName?: string;
  startDate?: string;
  endDate?: string;
  rentAmount?: number | string;
  deposit?: number | string;
  propertyAddress?: string;
  [key: string]: any;
}

