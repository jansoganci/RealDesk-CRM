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
              ${isActive ? `border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-400` : ''}
              ${isCompleted ? `border-green-500 bg-green-50 dark:bg-slate-800 dark:border-emerald-500` : ''}
              ${!isActive && !isCompleted ? 'border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/70' : ''}
            `}>
              {isCompleted ? (
                <Check className="h-5 w-5 text-green-600 dark:text-emerald-400" />
              ) : (
                <StepIcon className={`h-5 w-5 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'
                }`} />
              )}
            </div>
            <div className="text-center">
              <div className={`text-sm font-medium ${
                isActive ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-green-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'
              }`}>
                {step.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {step.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

