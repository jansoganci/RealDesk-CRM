import { useState, useCallback } from 'react';
import type { ReviewFormData, ParsedData } from '../types/reviewFormTypes';
import { convertDateFormat } from '../utils/dateUtils';

interface UseReviewFormStateOptions {
  parsedData?: ParsedData;
}

interface UseReviewFormStateReturn {
  formData: ReviewFormData;
  updateField: (field: keyof ReviewFormData, value: any) => void;
  resetForm: () => void;
}

/**
 * Hook for managing review form state
 * Initializes form with parsed data and provides field update functionality
 */
export function useReviewFormState(
  parsedData: ParsedData = {}
): UseReviewFormStateReturn {
  // Initialize form data with parsed data or empty defaults
  const [formData, setFormData] = useState<ReviewFormData>({
    // Owner
    owner_name: parsedData.ownerName || '',
    owner_tc: '',
    owner_phone: '',
    owner_email: '',
    owner_iban: '',

    // Tenant
    tenant_name: parsedData.tenantName || '',
    tenant_tc: '',
    tenant_phone: '',
    tenant_email: '',
    tenant_address: '',

    // Property
    mahalle: '',
    cadde_sokak: '',
    bina_no: '',
    daire_no: '',
    ilce: '',
    il: '',
    property_type: 'Daire',
    use_purpose: 'Mesken',

    // Contract
    start_date: parsedData.startDate ? convertDateFormat(parsedData.startDate) : '',
    end_date: parsedData.endDate ? convertDateFormat(parsedData.endDate) : '',
    rent_amount: parsedData.rentAmount || '',
    deposit: parsedData.deposit || '',
    payment_day_of_month: 1,
    payment_method: 'bank_transfer',
    special_conditions: '',
  });

  // Update field value
  const updateField = useCallback((field: keyof ReviewFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData({
      owner_name: parsedData.ownerName || '',
      owner_tc: '',
      owner_phone: '',
      owner_email: '',
      owner_iban: '',
      tenant_name: parsedData.tenantName || '',
      tenant_tc: '',
      tenant_phone: '',
      tenant_email: '',
      tenant_address: '',
      mahalle: '',
      cadde_sokak: '',
      bina_no: '',
      daire_no: '',
      ilce: '',
      il: '',
      property_type: 'Daire',
      use_purpose: 'Mesken',
      start_date: parsedData.startDate ? convertDateFormat(parsedData.startDate) : '',
      end_date: parsedData.endDate ? convertDateFormat(parsedData.endDate) : '',
      rent_amount: parsedData.rentAmount || '',
      deposit: parsedData.deposit || '',
      payment_day_of_month: 1,
      payment_method: 'bank_transfer',
      special_conditions: '',
    });
  }, [parsedData]);

  return {
    formData,
    updateField,
    resetForm,
  };
}

