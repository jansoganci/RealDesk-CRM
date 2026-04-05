import { useState, useCallback } from 'react';
import type { ReviewFormData } from '../types/reviewFormTypes';
import { isValidTaxId, isValidRoutingNumber, isValidAccountNumber } from '@/lib/serviceProxy';

interface UseReviewFormValidationReturn {
  fieldErrors: Record<string, string>;
  validateForm: (formData: ReviewFormData) => boolean;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
}

/**
 * Hook for managing form validation
 * Handles validation rules and error state for the review form
 */
export function useReviewFormValidation(): UseReviewFormValidationReturn {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((formData: ReviewFormData): boolean => {
    const errors: Record<string, string> = {};

    // Owner validation (US Format)
    if (!formData.owner_name) errors.owner_name = 'Owner name required';
    if (!formData.owner_tax_id) errors.owner_tax_id = 'Tax ID (EIN/SSN) required';
    else if (!isValidTaxId(formData.owner_tax_id)) errors.owner_tax_id = 'Invalid Tax ID format';
    if (!isValidRoutingNumber(formData.owner_routing_number)) {
      errors.owner_routing_number = 'Invalid routing number';
    }
    if (!isValidAccountNumber(formData.owner_account_number)) {
      errors.owner_account_number = 'Invalid account number';
    }

    // Tenant validation (US Format)
    if (!formData.tenant_name) errors.tenant_name = 'Tenant name required';
    if (!formData.tenant_tax_id) errors.tenant_tax_id = 'Tax ID (SSN/EIN) required';
    else if (!isValidTaxId(formData.tenant_tax_id)) errors.tenant_tax_id = 'Invalid Tax ID format';

    // Property validation (US Format)
    if (!formData.street_address) errors.street_address = 'Street address required';
    if (!formData.city) errors.city = 'City required';
    if (!formData.state) errors.state = 'State required';
    if (!formData.zip_code) errors.zip_code = 'ZIP code required';

    // Contract validation
    if (!formData.start_date) errors.start_date = 'Start date required';
    if (!formData.end_date) errors.end_date = 'End date required';
    if (!formData.rent_amount) errors.rent_amount = 'Rent amount required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  return {
    fieldErrors,
    validateForm,
    clearFieldError,
    clearAllErrors,
  };
}

