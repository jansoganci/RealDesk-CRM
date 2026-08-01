/**
 * Contract Creation Service
 * Handles contract creation with automatic entity creation via RPC
 * V2: Uses PostgreSQL atomic transaction
 */

import { supabase } from '@/config/supabase';
import { normalizePhone } from './phone.service';
import { normalizeAddress, generateFullAddress } from './address.service';
import { getActiveOrgId } from '@/lib/orgHelpers';
import {
  batchEncryptSensitiveFields,
  requireEncryptResult,
} from './sensitiveFields.service';
import type { ContractFormData } from '@/features/contracts/schemas/contractForm.schema';
import type { ContractCreationResult } from '@/types/contract.types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ContractCreation');

function isContractCreationResult(value: unknown): value is ContractCreationResult {
  if (typeof value !== 'object' || value === null) return false;
  const result = value as Record<string, unknown>;
  return result.success === true
    && typeof result.owner_id === 'string'
    && typeof result.tenant_id === 'string'
    && typeof result.property_id === 'string'
    && typeof result.contract_id === 'string'
    && typeof result.created_owner === 'boolean'
    && typeof result.created_tenant === 'boolean'
    && typeof result.created_property === 'boolean'
    && typeof result.message === 'string';
}

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
    const orgId = await getActiveOrgId();
    const encryptedFields = await batchEncryptSensitiveFields(orgId, [
      {
        requestId: 'owner-tax-id',
        entityType: 'property_owner',
        field: 'tax_id',
        plaintext: formData.owner_tax_id,
      },
      {
        requestId: 'owner-routing-number',
        entityType: 'property_owner',
        field: 'routing_number',
        plaintext: formData.owner_routing_number.replace(/\D/g, ''),
      },
      {
        requestId: 'owner-account-number',
        entityType: 'property_owner',
        field: 'account_number',
        plaintext: formData.owner_account_number.replace(/[\s-]/g, ''),
      },
      {
        requestId: 'tenant-tax-id',
        entityType: 'tenant',
        field: 'tax_id',
        plaintext: formData.tenant_tax_id,
      },
    ]);
    const ownerTax = requireEncryptResult(encryptedFields, 'owner-tax-id');
    const ownerRouting = requireEncryptResult(encryptedFields, 'owner-routing-number');
    const ownerAccount = requireEncryptResult(encryptedFields, 'owner-account-number');
    const tenantTax = requireEncryptResult(encryptedFields, 'tenant-tax-id');
    if (!ownerTax.lookupHash || !tenantTax.lookupHash) {
      throw new Error('TAX_ID_HASH_MISSING');
    }

    // ========================================================================
    // Prepare owner data (US Format)
    // ========================================================================
    const ownerData = {
      name: formData.owner_name,
      tc_encrypted: ownerTax.ciphertext,
      tc_hash: ownerTax.lookupHash,
      routing_number_encrypted: ownerRouting.ciphertext,
      account_number_encrypted: ownerAccount.ciphertext,
      phone: normalizePhone(formData.owner_phone),
      email: formData.owner_email || null
    };

    // ========================================================================
    // Prepare tenant data (US Format)
    // ========================================================================
    const tenantData = {
      name: formData.tenant_name,
      tc_encrypted: tenantTax.ciphertext,
      tc_hash: tenantTax.lookupHash,
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
        const parts = date.split(/[./]/);
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
        const parts = date.split(/[./]/);
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

    const { data, error } = await supabase.rpc('create_contract_atomic', {
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

    if (!isContractCreationResult(data)) {
      throw new Error('Contract creation failed: No data returned');
    }

    // Removed: console.log with contract data (security)

    const result = data;

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
