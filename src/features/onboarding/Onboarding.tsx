import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useOnboarding } from './hooks/useOnboarding';
import { useOrg } from '@/contexts/OrgContext';
import { OnboardingProgress } from './components/OnboardingProgress';
import { Step1GoalSelection } from './components/Step1GoalSelection';
import { Step2OrganizationSetup } from './components/Step2OrganizationSetup';
import { Step3QuickStart } from './components/Step3QuickStart';

export function Onboarding() {
  const { currentStep, nextStep, previousStep, resumeFromStep } = useOnboarding();
  const { refreshOrg } = useOrg();
  const [searchParams] = useSearchParams();

  // Handle resume from query param
  useEffect(() => {
    const shouldResume = searchParams.get('resume') === 'true';
    if (shouldResume) {
      resumeFromStep();
    }
  }, [searchParams, resumeFromStep]);

  const handleComplete = async () => {
    // Refresh org context to update onboarding_completed status
    await refreshOrg();
    // Navigation is handled in Step3QuickStart component
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1GoalSelection onContinue={nextStep} />;
      case 2:
        return <Step2OrganizationSetup onContinue={nextStep} onBack={previousStep} />;
      case 3:
        return <Step3QuickStart onComplete={handleComplete} onBack={previousStep} />;
      default:
        return <Step1GoalSelection onContinue={nextStep} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <PageContainer className="w-full max-w-4xl">
          <div className="space-y-8">
            {/* Progress Indicator */}
            <div className="w-full max-w-2xl mx-auto">
              <OnboardingProgress currentStep={currentStep} />
            </div>

            {/* Current Step Content */}
            {renderCurrentStep()}
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
