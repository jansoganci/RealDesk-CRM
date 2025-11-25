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
              ${isActive ? `border-blue-500 bg-blue-50` : ''}
              ${isCompleted ? `border-green-500 bg-green-50` : ''}
              ${!isActive && !isCompleted ? 'border-gray-200 bg-gray-50' : ''}
            `}>
              {isCompleted ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <StepIcon className={`h-5 w-5 ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`} />
              )}
            </div>
            <div className="text-center">
              <div className={`text-sm font-medium ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}>
                {step.title}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {step.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

