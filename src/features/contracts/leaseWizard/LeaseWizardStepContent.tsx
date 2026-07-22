/**
 * Default step renderer for the lease wizard.
 * 5 UX steps (merged from the original 8 field groups).
 */

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Separator } from '@/components/ui/separator';

import { Step1Property } from './steps/Step1Property';
import { Step2Parties } from './steps/Step2Parties';
import { Step3LeaseTerm } from './steps/Step3LeaseTerm';
import { Step4Financials } from './steps/Step4Financials';
import { Step5PaymentUtilities } from './steps/Step5PaymentUtilities';
import { Step6PropertyDetails } from './steps/Step6PropertyDetails';
import { Step7Policies } from './steps/Step7Policies';
import { Step8NoticesDisclosures } from './steps/Step8NoticesDisclosures';

type LeaseWizardStepContentProps = {
  step: number;
};

function CombinedSections({ children }: { children: ReactNode }) {
  return <div className="space-y-8">{children}</div>;
}

export function LeaseWizardStepContent({ step }: LeaseWizardStepContentProps) {
  const { t } = useTranslation('contracts');

  switch (step) {
    case 1:
      return (
        <CombinedSections>
          <Step1Property />
          <Separator />
          <Step6PropertyDetails />
        </CombinedSections>
      );
    case 2:
      return <Step2Parties />;
    case 3:
      return (
        <CombinedSections>
          <Step3LeaseTerm />
          <Separator />
          <Step4Financials />
        </CombinedSections>
      );
    case 4:
      return (
        <CombinedSections>
          <Step5PaymentUtilities />
          <Separator />
          <Step7Policies />
        </CombinedSections>
      );
    case 5:
      return <Step8NoticesDisclosures />;
    default:
      return (
        <p className="text-sm text-muted-foreground">
          {t('leaseWizard.placeholderStep', { step })}
        </p>
      );
  }
}
