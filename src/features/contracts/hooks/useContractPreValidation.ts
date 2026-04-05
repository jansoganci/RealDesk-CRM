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
import { useTranslation } from 'react-i18next';
import {
  hashTaxId,
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
  ownerTaxIdHash: string;
  tenantTaxIdHash: string;
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
  const { t } = useTranslation('contracts');

  const validateBeforeSubmit = async (
    data: ContractFormData,
    _userId: string,
    showConfirmation: ShowConfirmationFn
  ): Promise<PreValidationResult> => {

    // Step 1: Hash Tax IDs for lookups
    const ownerTaxIdHash = await hashTaxId(data.owner_tax_id);
    const tenantTaxIdHash = await hashTaxId(data.tenant_tax_id);

    // Step 2: Check owner duplicate names
    toast.info(t('validation.checkingOwner'));
    const ownerDuplicate = await checkDuplicateName(
      data.owner_name,
      ownerTaxIdHash,
      'owner'
    );

    if (ownerDuplicate.hasDuplicate) {
      toast.warning(ownerDuplicate.message, { duration: 5000 });
    }

    // Step 3: Check tenant duplicate names
    toast.info(t('validation.checkingTenant'));
    const tenantDuplicate = await checkDuplicateName(
      data.tenant_name,
      tenantTaxIdHash,
      'tenant'
    );

    if (tenantDuplicate.hasDuplicate) {
      toast.warning(tenantDuplicate.message, { duration: 5000 });
    }

    // Step 4: Check owner data changes
    const ownerChanges = await checkDataChanges(
      ownerTaxIdHash,
      {
        phone: normalizePhone(data.owner_phone),
        email: data.owner_email
      },
      'owner'
    );

    if (ownerChanges.hasChanges && ownerChanges.message) {
      const confirmed = await showConfirmation(
        t('validation.ownerDataChanged'),
        ownerChanges.message
      );
      if (!confirmed) {
        return { canProceed: false, ownerTaxIdHash, tenantTaxIdHash };
      }
    }

    // Step 5: Check tenant data changes
    const tenantChanges = await checkDataChanges(
      tenantTaxIdHash,
      {
        phone: normalizePhone(data.tenant_phone),
        email: data.tenant_email,
        address: data.tenant_address
      },
      'tenant'
    );

    if (tenantChanges.hasChanges && tenantChanges.message) {
      const confirmed = await showConfirmation(
        t('validation.tenantDataChanged'),
        tenantChanges.message
      );
      if (!confirmed) {
        return { canProceed: false, ownerTaxIdHash, tenantTaxIdHash };
      }
    }

    // Step 6: Check multiple active contracts
    const multipleContracts = await checkMultipleContracts(tenantTaxIdHash);

    if (multipleContracts.hasMultiple && multipleContracts.message) {
      const confirmed = await showConfirmation(
        t('validation.multipleContracts'),
        multipleContracts.message
      );
      if (!confirmed) {
        return { canProceed: false, ownerTaxIdHash, tenantTaxIdHash };
      }
    }

    // All checks passed
    return { canProceed: true, ownerTaxIdHash, tenantTaxIdHash };
  };

  return {
    validateBeforeSubmit,
  };
}
