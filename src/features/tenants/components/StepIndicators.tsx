import { Check } from 'lucide-react';
import type { TenantEditStep } from '../constants/tenantSteps';

/**
 * Step Indicators Component
 * Displays visual step indicators with icons, titles, and active/completed states
 */

interface StepIndicatorsProps {
  steps: TenantEditStep[];
  currentStep: number;
}

export function StepIndicators({ steps, currentStep }: StepIndicatorsProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const StepIcon = step.icon;

        return (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 mb-2
              ${isActive ? 'border-primary bg-primary/10' : ''}
              ${isCompleted ? 'border-success bg-success/15' : ''}
              ${!isActive && !isCompleted ? 'border-border bg-muted/50' : ''}
            `}>
              {isCompleted ? (
                <Check className="h-5 w-5 text-success" />
              ) : (
                <StepIcon className={`h-5 w-5 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`} />
              )}
            </div>
            <div className="text-center">
              <div className={`text-sm font-medium ${
                isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
              }`}>
                {step.title}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {step.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
