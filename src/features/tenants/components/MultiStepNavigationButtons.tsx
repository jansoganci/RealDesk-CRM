import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { COLORS } from '@/config/colors';
import type { TenantEditStep } from '../constants/tenantSteps';

/**
 * Multi-Step Navigation Buttons Component
 * Displays back/next/submit buttons with step indicator badges for multi-step forms
 */

interface MultiStepNavigationButtonsProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  currentStep: number;
  steps: TenantEditStep[];
  submitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function MultiStepNavigationButtons({
  isFirstStep,
  isLastStep,
  currentStep,
  steps,
  submitting,
  onBack,
  onNext,
  onSubmit,
  onCancel,
}: MultiStepNavigationButtonsProps) {
  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={isFirstStep ? onCancel : onBack}
        disabled={submitting}
      >
        {isFirstStep ? (
          'Cancel'
        ) : (
          <>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </>
        )}
      </Button>

      <div className="flex items-center gap-2">
        {/* Step indicator badges */}
        {steps.map((_, index) => (
          <Badge
            key={index}
            variant={currentStep === index + 1 ? 'default' : 'outline'}
            className="w-2 h-2 p-0"
          />
        ))}
      </div>

      <Button
        type="button"
        onClick={isLastStep ? onSubmit : onNext}
        disabled={submitting}
        className={isLastStep ? `${COLORS.success.bg} ${COLORS.success.hover}` : ''}
      >
        {submitting ? (
          'Saving...'
        ) : isLastStep ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Update Tenant & Contract
          </>
        ) : (
          <>
            Next: {steps[currentStep]?.title}
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}

