import { useCallback } from 'react';
import type { ReviewFormData } from '../types/reviewFormTypes';

interface UseReviewFormSubmissionOptions {
  formData: ReviewFormData;
  validateForm: (formData: ReviewFormData) => boolean;
  onSubmit: (formData: ReviewFormData) => void;
}

interface UseReviewFormSubmissionReturn {
  handleSubmit: () => void;
}

/**
 * Hook for managing form submission
 * Handles validation before submitting the form
 */
export function useReviewFormSubmission({
  formData,
  validateForm,
  onSubmit,
}: UseReviewFormSubmissionOptions): UseReviewFormSubmissionReturn {
  const handleSubmit = useCallback(() => {
    if (validateForm(formData)) {
      onSubmit(formData);
    }
  }, [formData, validateForm, onSubmit]);

  return {
    handleSubmit,
  };
}

