/**
 * Default step renderer for the purchase wizard (T8+). Override via `PurchaseWizard` `renderStep` when testing.
 */

import { useTranslation } from 'react-i18next';

import { Step1Property } from './steps/Step1Property';
import { Step2Parties } from './steps/Step2Parties';
import { Step3PersonalProperty } from './steps/Step3PersonalProperty';
import { Step4EarnestMoney } from './steps/Step4EarnestMoney';
import { Step5Financing } from './steps/Step5Financing';
import { Step6Closing } from './steps/Step6Closing';
import { Step7Conditions } from './steps/Step7Conditions';
import { PurchaseStep8Legal } from './steps/PurchaseStep8Legal';
import { PurchaseStep9Disclosures } from './steps/PurchaseStep9Disclosures';

type PurchaseWizardStepContentProps = {
  step: number;
  onEditStep?: (targetStep: number) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
  pendingFhaFile?: File | null;
  pendingVaFile?: File | null;
  onPendingFhaFile?: (file: File | null) => void;
  onPendingVaFile?: (file: File | null) => void;
};

export function PurchaseWizardStepContent({
  step,
  onEditStep,
  onGenerate,
  isGenerating,
  pendingFhaFile = null,
  pendingVaFile = null,
  onPendingFhaFile = () => {},
  onPendingVaFile = () => {},
}: PurchaseWizardStepContentProps) {
  const { t } = useTranslation('contracts');

  switch (step) {
    case 1:
      return <Step1Property />;
    case 2:
      return <Step2Parties />;
    case 3:
      return <Step3PersonalProperty />;
    case 4:
      return <Step4EarnestMoney />;
    case 5:
      return <Step5Financing />;
    case 6:
      return <Step6Closing />;
    case 7:
      return <Step7Conditions />;
    case 8:
      return <PurchaseStep8Legal />;
    case 9:
      return (
        <PurchaseStep9Disclosures
          onEditStep={onEditStep}
          onGenerate={onGenerate}
          isGenerating={isGenerating}
          pendingFhaFile={pendingFhaFile}
          pendingVaFile={pendingVaFile}
          onPendingFhaFile={onPendingFhaFile}
          onPendingVaFile={onPendingVaFile}
        />
      );
    default:
      return (
        <p className="text-sm text-muted-foreground">
          {t('purchaseWizard.placeholderStep', { step })}
        </p>
      );
  }
}
