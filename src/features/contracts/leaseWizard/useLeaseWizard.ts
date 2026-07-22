/**
 * Sprint 6A T9 — Lease wizard: step state, per-step validation, debounced localStorage draft.
 */

import { useCallback, useEffect, useState } from 'react';
import { type FieldPath, type UseFormReturn, useForm } from 'react-hook-form';

import {
  leaseAgreementFormSchema,
  type LeaseAgreementFormValues,
} from '@/features/contracts/schemas/leaseAgreementForm.schema';
import { getLeaseAgreementFormDefaults } from './leaseAgreementFormDefaults';
import { LEASE_WIZARD_STEP_SCHEMAS, LEASE_WIZARD_TOTAL_STEPS } from './leaseWizardStepSchemas';

const DRAFT_DEBOUNCE_MS = 500;
const DRAFT_VERSION = 2;

type LeaseWizardDraftV1 = {
  v: typeof DRAFT_VERSION;
  step: number;
  values: LeaseAgreementFormValues;
};

function draftStorageKey(userId: string): string {
  return `realdesk_lease_draft_${userId}`;
}

export type UseLeaseWizardOptions = {
  /** Required for draft persistence (`realdesk_lease_draft_{userId}`). */
  userId: string | undefined;
};

export type UseLeaseWizardReturn = {
  form: UseFormReturn<LeaseAgreementFormValues>;
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
  handleNext: () => void;
  handleBack: () => void;
  validateCurrentStep: () => boolean;
  /** Full `leaseAgreementFormSchema` parse — use on final submit / PDF / save. */
  validateFullForm: () => boolean;
  getStepProgress: () => number;
  isFirstStep: boolean;
  isLastStep: boolean;
  /** Remove draft from localStorage and reset the form + step. */
  clearDraft: () => void;
  resetWizard: () => void;
};

export function useLeaseWizard({ userId }: UseLeaseWizardOptions): UseLeaseWizardReturn {
  const form = useForm<LeaseAgreementFormValues>({
    defaultValues: getLeaseAgreementFormDefaults(),
    mode: 'onChange',
  });

  const [currentStep, setCurrentStep] = useState(1);

  const storageKey = userId ? draftStorageKey(userId) : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<LeaseWizardDraftV1>;
      if (parsed.v !== DRAFT_VERSION || !parsed.values) return;
      form.reset({
        ...getLeaseAgreementFormDefaults(),
        ...parsed.values,
      });
      if (
        typeof parsed.step === 'number' &&
        parsed.step >= 1 &&
        parsed.step <= LEASE_WIZARD_TOTAL_STEPS
      ) {
        setCurrentStep(parsed.step);
      }
    } catch {
      /* ignore corrupt draft */
    }
  }, [storageKey, form]);

  const watchedValues = form.watch();

  useEffect(() => {
    if (!storageKey) return;
    const t = window.setTimeout(() => {
      try {
        const payload: LeaseWizardDraftV1 = {
          v: DRAFT_VERSION,
          step: currentStep,
          values: watchedValues as LeaseAgreementFormValues,
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        /* quota / private mode */
      }
    }, DRAFT_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [storageKey, currentStep, watchedValues]);

  const clearDraft = useCallback(() => {
    if (!storageKey) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const resetWizard = useCallback(() => {
    form.reset(getLeaseAgreementFormDefaults());
    setCurrentStep(1);
    clearDraft();
  }, [form, clearDraft]);

  const validateCurrentStep = useCallback((): boolean => {
    form.clearErrors();
    const schema = LEASE_WIZARD_STEP_SCHEMAS[currentStep];
    if (!schema) return true;
    const result = schema.safeParse(form.getValues());
    if (result.success) return true;
    for (const issue of result.error.issues) {
      if (issue.path.length === 0) continue;
      const path = issue.path.join('.') as FieldPath<LeaseAgreementFormValues>;
      form.setError(path, { type: 'manual', message: issue.message });
    }
    return false;
  }, [form, currentStep]);

  const validateFullForm = useCallback((): boolean => {
    form.clearErrors();
    const result = leaseAgreementFormSchema.safeParse(form.getValues());
    if (result.success) return true;
    for (const issue of result.error.issues) {
      if (issue.path.length === 0) continue;
      const path = issue.path.join('.') as FieldPath<LeaseAgreementFormValues>;
      form.setError(path, { type: 'manual', message: issue.message });
    }
    return false;
  }, [form]);

  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) return;
    if (currentStep < LEASE_WIZARD_TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
    }
  }, [validateCurrentStep, currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= LEASE_WIZARD_TOTAL_STEPS) {
      setCurrentStep(step);
    }
  }, []);

  const getStepProgress = useCallback(() => {
    return (currentStep / LEASE_WIZARD_TOTAL_STEPS) * 100;
  }, [currentStep]);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === LEASE_WIZARD_TOTAL_STEPS;

  return {
    form,
    currentStep,
    totalSteps: LEASE_WIZARD_TOTAL_STEPS,
    goToStep,
    handleNext,
    handleBack,
    validateCurrentStep,
    validateFullForm,
    getStepProgress,
    isFirstStep,
    isLastStep,
    clearDraft,
    resetWizard,
  };
}
