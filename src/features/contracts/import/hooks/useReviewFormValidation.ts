import { useState, useCallback } from 'react';
import type { ReviewFormData } from '../types/reviewFormTypes';

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

    // Owner validation
    if (!formData.owner_name) errors.owner_name = 'Ev sahibi ismi gerekli';
    if (!formData.owner_tc) errors.owner_tc = 'TC Kimlik No gerekli';
    else if (formData.owner_tc.length !== 11) errors.owner_tc = 'TC Kimlik No 11 rakam olmalı';

    // Tenant validation
    if (!formData.tenant_name) errors.tenant_name = 'Kiracı ismi gerekli';
    if (!formData.tenant_tc) errors.tenant_tc = 'TC Kimlik No gerekli';
    else if (formData.tenant_tc.length !== 11) errors.tenant_tc = 'TC Kimlik No 11 rakam olmalı';

    // Property validation
    if (!formData.mahalle) errors.mahalle = 'Mahalle gerekli';
    if (!formData.ilce) errors.ilce = 'İlçe gerekli';
    if (!formData.il) errors.il = 'İl gerekli';

    // Contract validation
    if (!formData.start_date) errors.start_date = 'Başlangıç tarihi gerekli';
    if (!formData.end_date) errors.end_date = 'Bitiş tarihi gerekli';
    if (!formData.rent_amount) errors.rent_amount = 'Kira bedeli gerekli';

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

