/**
 * Sprint 6B T7 — Purchase wizard: step state, per-step validation, debounced localStorage draft.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { type FieldPath, type UseFormReturn, useForm } from 'react-hook-form';
import type { ZodError, ZodIssue } from 'zod';

import {
  purchaseAgreementFormSchema,
  type PurchaseAgreementFormValues,
} from '@/features/contracts/schemas/purchaseAgreementForm.schema';
import { getPurchaseAgreementFormDefaults } from './purchaseAgreementFormDefaults';
import { PURCHASE_WIZARD_STEP_SCHEMAS, PURCHASE_WIZARD_TOTAL_STEPS } from './purchaseWizardStepSchemas';

const DRAFT_DEBOUNCE_MS = 500;
const DRAFT_VERSION = 1;

type PurchaseWizardDraftV1 = {
  v: typeof DRAFT_VERSION;
  step: number;
  values: PurchaseAgreementFormValues;
};

function draftStorageKey(userId: string): string {
  return `realdesk_purchase_draft_${userId}`;
}

/** Expands `invalid_union` issues so nested branch errors (with real field paths) are not skipped. */
function flattenZodIssues(error: ZodError): ZodIssue[] {
  const out: ZodIssue[] = [];

  const walk = (issues: ZodIssue[]) => {
    for (const issue of issues) {
      if (issue.code === 'invalid_union' && issue.unionErrors.length > 0) {
        for (const ue of issue.unionErrors) {
          walk(ue.issues);
        }
        continue;
      }
      out.push(issue);
    }
  };

  walk(error.issues);
  return out;
}

function applyZodIssuesToPurchaseForm(
  form: UseFormReturn<PurchaseAgreementFormValues>,
  error: ZodError,
): void {
  const seen = new Set<string>();
  for (const issue of flattenZodIssues(error)) {
    if (issue.path.length === 0) continue;
    const path = issue.path.join('.') as FieldPath<PurchaseAgreementFormValues>;
    if (seen.has(path)) continue;
    seen.add(path);
    form.setError(path, { type: 'manual', message: issue.message });
  }
}

export type UsePurchaseWizardOptions = {
  userId: string | undefined;
};

export type UsePurchaseWizardReturn = {
  form: UseFormReturn<PurchaseAgreementFormValues>;
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
  handleNext: () => void;
  handleBack: () => void;
  validateCurrentStep: () => boolean;
  validateFullForm: () => boolean;
  getStepProgress: () => number;
  isFirstStep: boolean;
  isLastStep: boolean;
  clearDraft: () => void;
  resetWizard: () => void;
  /** Writes the current step and values to localStorage immediately (for “Save and finish later”). */
  persistDraftNow: () => void;
};

export function usePurchaseWizard({ userId }: UsePurchaseWizardOptions): UsePurchaseWizardReturn {
  const form = useForm<PurchaseAgreementFormValues>({
    defaultValues: getPurchaseAgreementFormDefaults(),
    mode: 'onChange',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const watchedFinancingType = form.watch('financing_type');
  const previousFinancingType = useRef<PurchaseAgreementFormValues['financing_type'] | null>(null);

  const storageKey = userId ? draftStorageKey(userId) : null;

  useEffect(() => {
    if (previousFinancingType.current === null) {
      previousFinancingType.current = watchedFinancingType;
      return;
    }
    if (previousFinancingType.current === watchedFinancingType) return;
    previousFinancingType.current = watchedFinancingType;

    if (watchedFinancingType === 'all_cash') {
      form.setValue('bank_loan_type', null);
      form.setValue('bank_loan_type_other', null);
      form.setValue('bank_preapproval_letter_date', null);
      form.setValue('bank_seller_notification_days', null);
      form.setValue('bank_contingent_on_sale', false);

      form.setValue('seller_financing_loan_amount', null);
      form.setValue('seller_financing_down_payment', null);
      form.setValue('seller_financing_interest_rate', null);
      form.setValue('seller_financing_term_value', null);
      form.setValue('seller_financing_term_unit', null);
      form.setValue('seller_financing_doc_deadline', null);
      form.setValue('seller_financing_approval_deadline', null);
    }

    if (watchedFinancingType === 'bank_financing') {
      form.setValue('all_cash_proof_deadline_date', null);
      form.setValue('all_cash_proof_deadline_time', null);

      form.setValue('seller_financing_loan_amount', null);
      form.setValue('seller_financing_down_payment', null);
      form.setValue('seller_financing_interest_rate', null);
      form.setValue('seller_financing_term_value', null);
      form.setValue('seller_financing_term_unit', null);
      form.setValue('seller_financing_doc_deadline', null);
      form.setValue('seller_financing_approval_deadline', null);
    }

    if (watchedFinancingType === 'seller_financing') {
      form.setValue('all_cash_proof_deadline_date', null);
      form.setValue('all_cash_proof_deadline_time', null);

      form.setValue('bank_loan_type', null);
      form.setValue('bank_loan_type_other', null);
      form.setValue('bank_preapproval_letter_date', null);
      form.setValue('bank_seller_notification_days', null);
      form.setValue('bank_contingent_on_sale', false);
    }
  }, [watchedFinancingType, form]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PurchaseWizardDraftV1>;
      if (parsed.v !== DRAFT_VERSION || !parsed.values) return;
      form.reset({
        ...getPurchaseAgreementFormDefaults(),
        ...parsed.values,
      });
      if (
        typeof parsed.step === 'number' &&
        parsed.step >= 1 &&
        parsed.step <= PURCHASE_WIZARD_TOTAL_STEPS
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
        const payload: PurchaseWizardDraftV1 = {
          v: DRAFT_VERSION,
          step: currentStep,
          values: watchedValues as PurchaseAgreementFormValues,
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

  const persistDraftNow = useCallback(() => {
    if (!storageKey) return;
    try {
      const payload: PurchaseWizardDraftV1 = {
        v: DRAFT_VERSION,
        step: currentStep,
        values: form.getValues(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [storageKey, currentStep, form]);

  const resetWizard = useCallback(() => {
    form.reset(getPurchaseAgreementFormDefaults());
    setCurrentStep(1);
    clearDraft();
  }, [form, clearDraft]);

  const validateCurrentStep = useCallback((): boolean => {
    form.clearErrors();
    const schema = PURCHASE_WIZARD_STEP_SCHEMAS[currentStep];
    if (!schema) return true;
    const result = schema.safeParse(form.getValues());
    if (result.success) return true;
    applyZodIssuesToPurchaseForm(form, result.error);
    return false;
  }, [form, currentStep]);

  const validateFullForm = useCallback((): boolean => {
    form.clearErrors();
    const result = purchaseAgreementFormSchema.safeParse(form.getValues());
    if (result.success) return true;
    applyZodIssuesToPurchaseForm(form, result.error);
    return false;
  }, [form]);

  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) return;
    if (currentStep < PURCHASE_WIZARD_TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
    }
  }, [validateCurrentStep, currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= PURCHASE_WIZARD_TOTAL_STEPS) {
      setCurrentStep(step);
    }
  }, []);

  const getStepProgress = useCallback(() => {
    return (currentStep / PURCHASE_WIZARD_TOTAL_STEPS) * 100;
  }, [currentStep]);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === PURCHASE_WIZARD_TOTAL_STEPS;

  return {
    form,
    currentStep,
    totalSteps: PURCHASE_WIZARD_TOTAL_STEPS,
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
    persistDraftNow,
  };
}
