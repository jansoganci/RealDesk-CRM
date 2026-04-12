/**
 * Default step renderer for the lease wizard (T10+). Override via `LeaseWizard` `renderStep` when testing.
 */

import { useTranslation } from 'react-i18next';

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

export function LeaseWizardStepContent({ step }: LeaseWizardStepContentProps) {
  const { t } = useTranslation('contracts');

  switch (step) {
    case 1:
      return <Step1Property />;
    case 2:
      return <Step2Parties />;
    case 3:
      return <Step3LeaseTerm />;
    case 4:
      return <Step4Financials />;
    case 5:
      return <Step5PaymentUtilities />;
    case 6:
      return <Step6PropertyDetails />;
    case 7:
      return <Step7Policies />;
    case 8:
      return <Step8NoticesDisclosures />;
    default:
      return (
        <p className="text-sm text-muted-foreground">
          {t('leaseWizard.placeholderStep', { step })}
        </p>
      );
  }
}
