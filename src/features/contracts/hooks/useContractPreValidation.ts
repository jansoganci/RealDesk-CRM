/**
 * useContractPreValidation
 *
 * Custom hook for handling pre-submit validation checks
 * Extracted from ContractCreateForm.tsx for better separation of concerns
 *
 * Handles:
 * - TC number hashing
 * - Duplicate name detection (owner + tenant)
 * - Data change detection (owner + tenant)
 * - Multiple active contracts check
 */

import { toast } from 'sonner';
import {
  hashTC,
  normalizePhone,
  checkDuplicateName,
  checkDataChanges,
  checkMultipleContracts
} from '@/lib/serviceProxy';
import type { ContractFormData } from '@/types/contract.types';

// ============================================================================
// Types
// ============================================================================

export interface PreValidationResult {
  canProceed: boolean;
  ownerTcHash: string;
  tenantTcHash: string;
}

export type ShowConfirmationFn = (title: string, message: string) => Promise<boolean>;

export interface UseContractPreValidationReturn {
  validateBeforeSubmit: (
    data: ContractFormData,
    userId: string,
    showConfirmation: ShowConfirmationFn
  ) => Promise<PreValidationResult>;
}

// ============================================================================
// Hook
// ============================================================================

export function useContractPreValidation(): UseContractPreValidationReturn {

  const validateBeforeSubmit = async (
    data: ContractFormData,
    userId: string,
    showConfirmation: ShowConfirmationFn
  ): Promise<PreValidationResult> => {

    // Step 1: Hash TC numbers for lookups
    const ownerTcHash = await hashTC(data.owner_tc);
    const tenantTcHash = await hashTC(data.tenant_tc);

    // Step 2: Check owner duplicate names
    toast.info('Ev sahibi kontrol ediliyor...');
    const ownerDuplicate = await checkDuplicateName(
      data.owner_name,
      ownerTcHash,
      'owner',
      userId
    );

    if (ownerDuplicate.hasDuplicate) {
      toast.warning(ownerDuplicate.message, { duration: 5000 });
    }

    // Step 3: Check tenant duplicate names
    toast.info('Kiracı kontrol ediliyor...');
    const tenantDuplicate = await checkDuplicateName(
      data.tenant_name,
      tenantTcHash,
      'tenant',
      userId
    );

    if (tenantDuplicate.hasDuplicate) {
      toast.warning(tenantDuplicate.message, { duration: 5000 });
    }

    // Step 4: Check owner data changes
    const ownerChanges = await checkDataChanges(
      ownerTcHash,
      {
        phone: normalizePhone(data.owner_phone),
        email: data.owner_email
      },
      'owner',
      userId
    );

    if (ownerChanges.hasChanges && ownerChanges.message) {
      const confirmed = await showConfirmation(
        'Ev Sahibi Bilgileri Değişti',
        ownerChanges.message
      );
      if (!confirmed) {
        return { canProceed: false, ownerTcHash, tenantTcHash };
      }
    }

    // Step 5: Check tenant data changes
    const tenantChanges = await checkDataChanges(
      tenantTcHash,
      {
        phone: normalizePhone(data.tenant_phone),
        email: data.tenant_email,
        address: data.tenant_address
      },
      'tenant',
      userId
    );

    if (tenantChanges.hasChanges && tenantChanges.message) {
      const confirmed = await showConfirmation(
        'Kiracı Bilgileri Değişti',
        tenantChanges.message
      );
      if (!confirmed) {
        return { canProceed: false, ownerTcHash, tenantTcHash };
      }
    }

    // Step 6: Check multiple active contracts
    const multipleContracts = await checkMultipleContracts(tenantTcHash, userId);

    if (multipleContracts.hasMultiple && multipleContracts.message) {
      const confirmed = await showConfirmation(
        'Birden Fazla Aktif Sözleşme',
        multipleContracts.message
      );
      if (!confirmed) {
        return { canProceed: false, ownerTcHash, tenantTcHash };
      }
    }

    // All checks passed
    return { canProceed: true, ownerTcHash, tenantTcHash };
  };

  return {
    validateBeforeSubmit,
  };
}
