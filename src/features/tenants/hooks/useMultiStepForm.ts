import { useState, useEffect, useCallback, useMemo } from 'react';
import { UseFormReturn, FieldPath, FieldValues } from 'react-hook-form';
import * as z from 'zod';

/**
 * Multi-Step Form Hook
 * Manages step navigation, validation, and progress for multi-step forms
 */

interface UseMultiStepFormOptions<T extends FieldValues> {
  form: UseFormReturn<T>;
  totalSteps: number;
  stepFields: Record<number, (keyof T | string)[]>;
  open: boolean;
  onReset?: () => void;
}

interface UseMultiStepFormReturn {
  currentStep: number;
  handleNext: () => Promise<void>;
  handleBack: () => void;
  validateCurrentStep: () => Promise<boolean>;
  getStepProgress: () => number;
  isLastStep: boolean;
  isFirstStep: boolean;
  reset: () => void;
}

/**
 * Hook for managing multi-step form state and navigation
 * Handles step validation, navigation, progress calculation, and reset logic
 */
export function useMultiStepForm<T extends FieldValues>({
  form,
  totalSteps,
  stepFields,
  open,
  onReset,
}: UseMultiStepFormOptions<T>): UseMultiStepFormReturn {
  const [currentStep, setCurrentStep] = useState(1);

  // Validate current step fields
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    try {
      const fieldsToValidate = stepFields[currentStep] || [];
      if (fieldsToValidate.length === 0) {
        // No fields to validate for this step (e.g., optional step)
        return true;
      }
      return await form.trigger(fieldsToValidate as FieldPath<T>[]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const field = err.path.join('.') as FieldPath<T>;
          form.setError(field, { message: err.message });
        });
      }
      return false;
    }
  }, [currentStep, form, stepFields]);

  // Navigate to next step (with validation)
  const handleNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, totalSteps, validateCurrentStep]);

  // Navigate to previous step
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Calculate step progress percentage
  const getStepProgress = useCallback((): number => {
    return (currentStep / totalSteps) * 100;
  }, [currentStep, totalSteps]);

  // Check if current step is the last step
  const isLastStep = useMemo(() => currentStep === totalSteps, [currentStep, totalSteps]);

  // Check if current step is the first step
  const isFirstStep = useMemo(() => currentStep === 1, [currentStep]);

  // Reset form and step when dialog closes
  const reset = useCallback(() => {
    setCurrentStep(1);
    form.reset();
    onReset?.();
  }, [form, onReset]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  return {
    currentStep,
    handleNext,
    handleBack,
    validateCurrentStep,
    getStepProgress,
    isLastStep,
    isFirstStep,
    reset,
  };
}

