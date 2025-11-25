/**
 * Contract Creation Service
 * Handles contract creation with automatic entity creation via RPC
 * V2: Uses PostgreSQL atomic transaction
 */

import { supabase } from '@/config/supabase';
import { encrypt, hashTC } from './encryption.service';
import { normalizePhone } from './phone.service';
import { normalizeAddress, generateFullAddress } from './address.service';
import type { ContractFormData } from '@/features/contracts/schemas/contractForm.schema';
import type { ContractCreationResult } from '@/types/contract.types';

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
    // Prepare owner data
    // ========================================================================
    const ownerData = {
      name: formData.owner_name,
      tc_encrypted: await encrypt(formData.owner_tc),
      tc_hash: await hashTC(formData.owner_tc),
      iban_encrypted: await encrypt(formData.owner_iban),
      phone: normalizePhone(formData.owner_phone),
      email: formData.owner_email || null
    };

    // ========================================================================
    // Prepare tenant data
    // ========================================================================
    const tenantData = {
      name: formData.tenant_name,
      tc_encrypted: await encrypt(formData.tenant_tc),
      tc_hash: await hashTC(formData.tenant_tc),
      phone: normalizePhone(formData.tenant_phone),
      email: formData.tenant_email || null,
      address: formData.tenant_address
    };

    // ========================================================================
    // Prepare property data
    // ========================================================================
    const addressComponents = {
      mahalle: formData.mahalle,
      cadde_sokak: formData.cadde_sokak,
      bina_no: formData.bina_no,
      daire_no: formData.daire_no,
      ilce: formData.ilce,
      il: formData.il
    };

    const fullAddress = generateFullAddress(addressComponents);
    const normalizedAddressStr = normalizeAddress(addressComponents);

    const propertyData = {
      mahalle: formData.mahalle,
      cadde_sokak: formData.cadde_sokak,
      bina_no: formData.bina_no,
      daire_no: formData.daire_no || null,
      ilce: formData.ilce,
      il: formData.il,
      full_address: fullAddress,
      normalized_address: normalizedAddressStr,
      type: formData.property_type,
      use_purpose: formData.use_purpose || null
    };

    // ========================================================================
    // Prepare contract data
    // ========================================================================
    const contractData = {
      start_date: formData.start_date.toISOString().split('T')[0],
      end_date: formData.end_date.toISOString().split('T')[0],
      rent_amount: formData.rent_amount,
      deposit: formData.deposit
    };

    // ========================================================================
    // Prepare contract details (optional)
    // ========================================================================
    // Calculate contract duration in months
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());

    const contractDetailsData = formData.payment_day_of_month
      ? {
          // Tenant info (for PDF)
          tenant_tc_no: formData.tenant_tc,
          tenant_permanent_address: formData.tenant_address,

          // Owner info (for PDF)
          owner_tc_no: formData.owner_tc,
          owner_iban_number: formData.owner_iban || null,

          // Financial details
          deposit_amount: formData.deposit || null,
          deposit_currency: 'TRY',
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
          utilities_included: null
        }
      : null;

    // ========================================================================
    // Call RPC function (atomic transaction)
    // ========================================================================
    console.log('Calling create_contract_atomic RPC...');
    console.log('Owner TC Hash:', await hashTC(formData.owner_tc));
    console.log('Tenant TC Hash:', await hashTC(formData.tenant_tc));
    console.log('Normalized Address:', normalizedAddressStr);

    const { data, error } = await supabase.rpc('create_contract_atomic' as any, {
      owner_data: ownerData,
      tenant_data: tenantData,
      property_data: propertyData,
      contract_data: contractData,
      contract_details_data: contractDetailsData,
      user_id_param: userId
    });

    if (error) {
      console.error('RPC error:', error);
      throw new Error(`Contract creation failed: ${error.message}`);
    }

    if (!data || !(data as any).success) {
      throw new Error('Contract creation failed: No data returned');
    }

    console.log('Contract created successfully:', data);

    return data as unknown as ContractCreationResult;
  } catch (error) {
    console.error('Contract creation error:', error);
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
