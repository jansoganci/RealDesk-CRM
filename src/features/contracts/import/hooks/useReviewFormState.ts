import { useState, useCallback, useMemo } from 'react';
import type { ReviewFormData } from '../types/reviewFormTypes';
import { convertDateFormat } from '../utils/dateUtils';
import type { ParsedContractData } from '@/services/textExtraction.service';

interface UseReviewFormStateReturn {
  formData: ReviewFormData;
  updateField: (field: keyof ReviewFormData, value: any) => void;
  resetForm: () => void;
}

/**
 * Helper to safely get nested value or fallback to legacy flat format
 */
function getFieldValue(
  parsedData: ParsedContractData | Record<string, any>,
  nestedPath: string,
  legacyKey?: string
): string {
  // Try new nested format first (e.g., "owner.name")
  const parts = nestedPath.split('.');
  let value: any = parsedData;
  for (const part of parts) {
    value = value?.[part];
    if (value === undefined || value === null) break;
  }

  // If found, return it
  if (value !== undefined && value !== null) {
    return String(value);
  }

  // Fallback to legacy flat format (e.g., "ownerName")
  if (legacyKey && (parsedData as any)[legacyKey]) {
    return String((parsedData as any)[legacyKey]);
  }

  return '';
}

/**
 * Hook for managing review form state
 * Initializes form with parsed data and provides field update functionality
 * Supports both new nested format (ParsedContractData) and legacy flat format
 */
export function useReviewFormState(
  parsedData: ParsedContractData | Record<string, any> = {}
): UseReviewFormStateReturn {

  // Create initial form data from parsed data
  const initialFormData = useMemo<ReviewFormData>(() => ({
    // Owner - from owner object
    owner_name: getFieldValue(parsedData, 'owner.name', 'ownerName'),
    owner_tc: getFieldValue(parsedData, 'owner.tc'),
    owner_phone: getFieldValue(parsedData, 'owner.phone'),
    owner_email: '',
    owner_iban: getFieldValue(parsedData, 'owner.iban'),

    // Tenant - from tenant object
    tenant_name: getFieldValue(parsedData, 'tenant.name', 'tenantName'),
    tenant_tc: getFieldValue(parsedData, 'tenant.tc'),
    tenant_phone: getFieldValue(parsedData, 'tenant.phone'),
    tenant_email: '',
    tenant_address: getFieldValue(parsedData, 'tenant.address'),

    // Property - from property object
    mahalle: getFieldValue(parsedData, 'property.mahalle'),
    cadde_sokak: getFieldValue(parsedData, 'property.sokak'),
    bina_no: getFieldValue(parsedData, 'property.binaNo'),
    daire_no: getFieldValue(parsedData, 'property.daireNo'),
    ilce: getFieldValue(parsedData, 'property.ilce'),
    il: getFieldValue(parsedData, 'property.il'),
    property_type: getFieldValue(parsedData, 'property.type') || 'Daire',
    use_purpose: getFieldValue(parsedData, 'property.usePurpose') || 'Mesken',

    // Contract - from contract object
    start_date: (() => {
      const date = getFieldValue(parsedData, 'contract.startDate', 'startDate');
      return date ? convertDateFormat(date) : '';
    })(),
    end_date: (() => {
      const date = getFieldValue(parsedData, 'contract.endDate', 'endDate');
      return date ? convertDateFormat(date) : '';
    })(),
    rent_amount: getFieldValue(parsedData, 'contract.rentAmount', 'rentAmount'),
    deposit: getFieldValue(parsedData, 'contract.deposit', 'deposit'),
    payment_day_of_month: 1,
    payment_method: getFieldValue(parsedData, 'contract.paymentMethod') || 'bank_transfer',
    special_conditions: '',
  }), [parsedData]);

  const [formData, setFormData] = useState<ReviewFormData>(initialFormData);

  // Update field value
  const updateField = useCallback((field: keyof ReviewFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  return {
    formData,
    updateField,
    resetForm,
  };
}

