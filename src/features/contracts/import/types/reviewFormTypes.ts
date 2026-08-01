/**
 * Type definitions for Review Step form data
 */

import type { ParsedContractData } from '@/services/textExtraction.service';

export interface ReviewFormData {
  // Owner (US Format)
  owner_name: string;
  owner_tax_id: string;
  owner_phone: string;
  owner_email: string;
  owner_routing_number: string;
  owner_account_number: string;

  // Tenant (US Format)
  tenant_name: string;
  tenant_tax_id: string;
  tenant_phone: string;
  tenant_email: string;
  tenant_address: string;

  // Property (US Format)
  street_address: string;
  unit?: string;
  city: string;
  state: string;
  zip_code: string;
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
  is_painted?: boolean;
}

export type ReviewFormFieldValue = ReviewFormData[keyof ReviewFormData];

/** Legacy flat OCR payload (pre-nested ParsedContractData). */
export interface LegacyFlatParsedData {
  ownerName?: string;
  tenantName?: string;
  startDate?: string;
  endDate?: string;
  rentAmount?: number | string;
  deposit?: number | string;
  propertyAddress?: string;
  [key: string]: string | number | null | undefined;
}

export type ParsedData = ParsedContractData | LegacyFlatParsedData;
