/**
 * Contract Creation Service
 * Handles contract creation with automatic entity creation via RPC
 * V2: Uses PostgreSQL atomic transaction
 */

import { supabase } from '@/config/supabase';
import { encrypt, hashTaxId } from './encryption.service';
import { normalizePhone } from './phone.service';
import { normalizeAddress, generateFullAddress } from './address.service';
import type { ContractFormData } from '@/features/contracts/schemas/contractForm.schema';
import type { ContractCreationResult } from '@/types/contract.types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ContractCreation');

/**
 * Create contract with automatic entity creation
 * Uses atomic PostgreSQL transaction via RPC
 *
 * Flow:
 * 1. Encrypt sensitive data (TC, IBAN)
 * 2. Hash TC for lookups
 * 3. Normalize phone numbers
 * 4. Normalize address
 * 5. Call RPC function
 * 6. Return result with creation flags
 *
 * @param formData - Contract form data from UI
 * @param userId - Authenticated user ID
 * @returns Promise with creation result
 */
export async function createContractWithEntities(
  formData: ContractFormData,
  userId: string
): Promise<ContractCreationResult> {
  try {
    // ========================================================================
    // Prepare owner data (US Format)
    // ========================================================================
    const ownerData = {
      name: formData.owner_name,
      tax_id_encrypted: await encrypt(formData.owner_tax_id),
      tax_id_hash: await hashTaxId(formData.owner_tax_id),
      routing_number_encrypted: await encrypt(formData.owner_routing_number.replace(/\D/g, '')),
      account_number_encrypted: await encrypt(formData.owner_account_number.replace(/[\s-]/g, '')),
      phone: normalizePhone(formData.owner_phone),
      email: formData.owner_email || null
    };

    // ========================================================================
    // Prepare tenant data (US Format)
    // ========================================================================
    const tenantData = {
      name: formData.tenant_name,
      tax_id_encrypted: await encrypt(formData.tenant_tax_id),
      tax_id_hash: await hashTaxId(formData.tenant_tax_id),
      phone: normalizePhone(formData.tenant_phone),
      email: formData.tenant_email || null,
      address: formData.tenant_address
    };

    // ========================================================================
    // Prepare property data (US Format)
    // ========================================================================
    const addressComponents = {
      street_address: formData.street_address,
      unit: formData.unit,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code
    };

    const fullAddress = generateFullAddress(addressComponents);
    const normalizedAddressStr = normalizeAddress(fullAddress);

    const propertyData = {
      street_address: formData.street_address,
      unit: formData.unit || null,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
      full_address: fullAddress,
      normalized_address: normalizedAddressStr,
      type: formData.property_type,
      use_purpose: formData.use_purpose || null
    };

    // ========================================================================
    // Prepare contract data
    // ========================================================================
    // Helper to convert date string (dd.mm.yyyy or Date) to ISO format (yyyy-mm-dd)
    const toISODate = (date: string | Date): string => {
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      // Handle Turkish date format: "dd.mm.yyyy" or "dd/mm/yyyy"
      if (typeof date === 'string') {
        const parts = date.split(/[.\/]/);
        if (parts.length === 3) {
          const [day, month, year] = parts;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        // Already in ISO format or other format
        return date;
      }
      return String(date);
    };

    const contractData = {
      start_date: toISODate(formData.start_date),
      end_date: toISODate(formData.end_date),
      rent_amount: formData.rent_amount,
      deposit: formData.deposit,
      currency: formData.currency || 'USD',
      commission_amount: formData.commission_amount || null // Manual commission amount (null = use rent_amount)
    };

    // ========================================================================
    // Prepare contract details (optional)
    // ========================================================================
    // Calculate contract duration in months
    // Parse date from string if needed
    const parseDate = (date: string | Date): Date => {
      if (date instanceof Date) return date;
      if (typeof date === 'string') {
        const parts = date.split(/[.\/]/);
        if (parts.length === 3) {
          const [day, month, year] = parts;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
      return new Date(date);
    };
    const startDate = parseDate(formData.start_date);
    const endDate = parseDate(formData.end_date);
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());

    const contractDetailsData = formData.payment_day_of_month
      ? {
          // Financial details
          deposit_amount: formData.deposit || null,
          deposit_currency: formData.currency || 'USD',
          payment_day_of_month: formData.payment_day_of_month,
          payment_method: formData.payment_method || null,
          annual_rent: formData.rent_amount * 12,

          // Contract details
          contract_duration_months: monthsDiff,
          rent_increase_rate: null, // Can be added to form later
          usage_purpose: formData.use_purpose || 'Mesken',

          // Additional
          special_conditions: formData.special_conditions || null,
          furniture_list: null, // Can be added to form later
          utilities_included: null,
          is_painted: formData.is_painted,

          // Google Drive handover photos URL
          handover_photos_url: formData.handover_photos_url || null
        }
      : null;

    // ========================================================================
    // Call RPC function (atomic transaction)
    // ========================================================================
    // Removed: sensitive console.log statements (security)

    const { data, error } = await supabase.rpc('create_contract_atomic' as any, {
      owner_data: ownerData,
      tenant_data: tenantData,
      property_data: propertyData,
      contract_data: contractData,
      contract_details_data: contractDetailsData,
      user_id_param: userId
    });

    if (error) {
      logger.error('RPC error:', error);
      throw new Error(`Contract creation failed: ${error.message}`);
    }

    if (!data || !(data as any).success) {
      throw new Error('Contract creation failed: No data returned');
    }

    // Removed: console.log with contract data (security)

    const result = data as unknown as ContractCreationResult;

    // Track contract_created event (GA4)
    if (result.contract_id) {
      const { trackContractCreated } = await import('../utils/gtm');
      trackContractCreated(result.contract_id);
    }

    return result;
  } catch (error) {
    logger.error('Contract creation error:', error);
    throw error;
  }
}

/**
 * Get contract with full details
 * Fetches contract with all related entities
 *
 * @param contractId - Contract ID
 * @returns Promise with contract details
 */
export async function getContractWithDetails(contractId: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      tenant:tenants(*),
      property:properties(
        *,
        owner:property_owners(*)
      ),
      details:contract_details(*)
    `)
    .eq('id', contractId)
    .single();

  if (error) throw error;
  return data;
}
