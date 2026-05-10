import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { COLORS } from '@/config/colors';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['tenants', 'common']);

  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-800">
      <Button
        type="button"
        variant="outline"
        onClick={isFirstStep ? onCancel : onBack}
        disabled={submitting}
      >
        {isFirstStep ? (
          t('common:cancel')
        ) : (
          <>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common:actions.back')}
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
          t('common:saving')
        ) : isLastStep ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            {t('edit.navigation.update')}
          </>
        ) : (
          <>
            {t('edit.navigation.nextWithStep', { step: steps[currentStep]?.title ?? '' })}
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}
