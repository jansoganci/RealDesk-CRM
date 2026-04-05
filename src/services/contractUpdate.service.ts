/**
 * Contract Update Service
 * Handles contract updates including related entities
 */

import { supabase } from '@/config/supabase';
import { encrypt, hashTaxId } from './encryption.service';
import { normalizePhone } from './phone.service';
import { normalizeAddress, generateFullAddress } from './address.service';
import { getActiveOrgId } from '@/lib/orgHelpers';
import type { ContractFormData } from '@/features/contracts/schemas/contractForm.schema';

// ============================================================================
// Types
// ============================================================================

interface UpdateContractParams {
  contractId: string;
  tenantId: string;
  propertyId: string;
  ownerId: string;
  formData: ContractFormData;
  userId: string;
}

interface UpdateContractResult {
  success: boolean;
  ownerUpdated: boolean;
  tenantUpdated: boolean;
  propertyUpdated: boolean;
  contractUpdated: boolean;
  dataChanged: boolean;
  message: string;
}

// ============================================================================
// Main Update Function
// ============================================================================

export async function updateContractWithEntities(
  params: UpdateContractParams
): Promise<UpdateContractResult> {
  const { contractId, tenantId, propertyId, ownerId, formData, userId } = params;

  let ownerUpdated = false;
  let tenantUpdated = false;
  let propertyUpdated = false;
  let contractUpdated = false;

  try {
    // ========================================================================
    // Update Owner (US Format)
    // ========================================================================
    const ownerData = {
      name: formData.owner_name,
      tax_id_encrypted: await encrypt(formData.owner_tax_id),
      tax_id_hash: await hashTaxId(formData.owner_tax_id),
      routing_number_encrypted: await encrypt(formData.owner_routing_number.replace(/\D/g, '')),
      account_number_encrypted: await encrypt(formData.owner_account_number.replace(/[\s-]/g, '')),
      phone: normalizePhone(formData.owner_phone),
      email: formData.owner_email || null,
      updated_at: new Date().toISOString(),
    };

    const { error: ownerError } = await supabase
      .from('property_owners')
      .update(ownerData)
      .eq('id', ownerId)
      .eq('user_id', userId);

    if (ownerError) {
      // Removed: console.error (security)
      throw new Error(`Failed to update owner: ${ownerError.message}`);
    }
    ownerUpdated = true;

    // ========================================================================
    // Update Tenant (US Format)
    // ========================================================================
    const tenantData = {
      name: formData.tenant_name,
      tax_id_encrypted: await encrypt(formData.tenant_tax_id),
      tax_id_hash: await hashTaxId(formData.tenant_tax_id),
      phone: normalizePhone(formData.tenant_phone),
      email: formData.tenant_email || null,
      address: formData.tenant_address,
      updated_at: new Date().toISOString(),
    };

    const { error: tenantError } = await supabase
      .from('tenants')
      .update(tenantData)
      .eq('id', tenantId)
      .eq('user_id', userId);

    if (tenantError) {
      // Removed: console.error (security)
      throw new Error(`Failed to update tenant: ${tenantError.message}`);
    }
    tenantUpdated = true;

    // ========================================================================
    // Update Property (US Format)
    // ========================================================================
    const addressComponents = {
      street_address: formData.street_address,
      unit: formData.unit,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
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
      address: fullAddress,
      type: formData.property_type,
      use_purpose: formData.use_purpose || null,
      updated_at: new Date().toISOString(),
    };

    const { error: propertyError } = await supabase
      .from('properties')
      .update(propertyData)
      .eq('id', propertyId)
      .eq('user_id', userId);

    if (propertyError) {
      console.error('Property update error:', propertyError);
      throw new Error(`Failed to update property: ${propertyError.message}`);
    }
    propertyUpdated = true;

    // ========================================================================
    // Update Contract
    // ========================================================================
    const contractData = {
      start_date: formData.start_date.toISOString().split('T')[0],
      end_date: formData.end_date.toISOString().split('T')[0],
      rent_amount: formData.rent_amount,
      deposit: formData.deposit,
      commission_amount: formData.commission_amount || null, // Save commission_amount (null = use rent_amount)
      updated_at: new Date().toISOString(),
    };

    const { error: contractError } = await supabase
      .from('contracts')
      .update(contractData)
      .eq('id', contractId)
      .eq('user_id', userId);

    if (contractError) {
      console.error('Contract update error:', contractError);
      throw new Error(`Failed to update contract: ${contractError.message}`);
    }
    contractUpdated = true;

    // ========================================================================
    // Update Contract Details (if exists)
    // ========================================================================
    if (formData.payment_day_of_month) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                         (endDate.getMonth() - startDate.getMonth());

      const detailsData = {
        deposit_amount: formData.deposit || null,
        deposit_currency: formData.currency || 'TRY',
        payment_day_of_month: formData.payment_day_of_month,
        payment_method: formData.payment_method || null,
        annual_rent: formData.rent_amount * 12,
        contract_duration_months: monthsDiff,
        usage_purpose: formData.use_purpose || 'Mesken',
        special_conditions: formData.special_conditions || null,
        is_painted: formData.is_painted,
        handover_photos_url: formData.handover_photos_url || null,
        updated_at: new Date().toISOString(),
      };

      // Try to update existing details (using 'as any' for table not in generated types)
      const { error: detailsError } = await supabase
        .from('contract_details' as any)
        .update(detailsData)
        .eq('contract_id', contractId)
        .eq('user_id', userId);

      if (detailsError) {
        // If no existing details, insert new one
        const orgId = await getActiveOrgId();
        const { error: insertError } = await supabase
          .from('contract_details' as any)
          .insert({
            ...detailsData,
            contract_id: contractId,
            user_id: userId,
            org_id: orgId,
          });

        if (insertError) {
          console.warn('Contract details update/insert failed:', insertError);
          // Don't throw - contract details are optional
        }
      }
    }

    return {
      success: true,
      ownerUpdated,
      tenantUpdated,
      propertyUpdated,
      contractUpdated,
      dataChanged: true,
      message: 'Contract updated successfully',
    };

  } catch (error) {
    console.error('Contract update error:', error);
    throw error;
  }
}
