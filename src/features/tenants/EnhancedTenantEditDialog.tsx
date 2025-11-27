import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Progress } from '../../components/ui/progress';
import { Users } from 'lucide-react';
import { COLORS } from '@/config/colors';

// Step Components
import { TenantInfoStep } from './steps/TenantInfoStep';
import { ContractDetailsStep } from './steps/ContractDetailsStep';
import { ContractSettingsStep } from './steps/ContractSettingsStep';
import { StepIndicators } from './components/StepIndicators';
import { ContractStatusInfo } from './components/ContractStatusInfo';
import { MultiStepNavigationButtons } from './components/MultiStepNavigationButtons';
import { TenantEditLoadingState } from './components/TenantEditLoadingState';

// Services and Types
import type { TenantWithProperty } from '../../types';

// Validation Schema
import { getTenantEditSchema, type TenantEditFormData } from './schemas/tenantEditSchema';

// Steps Configuration
import { TENANT_EDIT_STEPS } from './constants/tenantSteps';

// Hooks
import { useMultiStepForm } from './hooks/useMultiStepForm';
import { useTenantEditData } from './hooks/useTenantEditData';
import { useTenantEditSubmission } from './hooks/useTenantEditSubmission';
import { usePdfFileManagement } from './hooks/usePdfFileManagement';

interface EnhancedTenantEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantWithProperty;
  onSuccess: () => void;
}

export const EnhancedTenantEditDialog = ({ 
  open, 
  onOpenChange, 
  tenant,
  onSuccess
}: EnhancedTenantEditDialogProps) => {
  const { t } = useTranslation('tenants');

  // PDF file management hook
  const { pdfFile, setPdfFile } = usePdfFileManagement({ open });

  const form = useForm<TenantEditFormData>({
    resolver: zodResolver(getTenantEditSchema(t)),
    defaultValues: {
      tenant: {
        name: '',
        email: '',
        phone: '',
        notes: '',
      },
      contract: {
        property_id: '',
        start_date: '',
        end_date: '',
        rent_amount: null,
        status: 'Active',
        rent_increase_reminder_enabled: false,
        rent_increase_reminder_days: 90,
        expected_new_rent: null,
        reminder_notes: '',
      },
    },
  });

  // Multi-step form hook
  const {
    currentStep,
    handleNext,
    handleBack,
    validateCurrentStep,
    getStepProgress,
    isLastStep,
    isFirstStep,
  } = useMultiStepForm({
    form,
    totalSteps: TENANT_EDIT_STEPS.length,
    stepFields: {
      1: ['tenant.name', 'tenant.email', 'tenant.phone', 'tenant.notes'],
      2: ['contract.property_id', 'contract.start_date', 'contract.end_date', 'contract.rent_amount', 'contract.status'],
      3: [], // Optional step, no validation needed
    },
    open,
    onReset: () => {
      // Reset handled by usePdfFileManagement hook
    },
  });

  // Tenant edit data loading hook
  const { loading, primaryContract } = useTenantEditData({
    open,
    tenant,
    setValue: form.setValue,
  });

  // Tenant edit submission hook
  const { submitting, handleSubmit } = useTenantEditSubmission({
    tenant,
    primaryContract,
    form,
    pdfFile,
    validateCurrentStep,
    onSuccess,
    onOpenChange,
  });


  const renderCurrentStep = () => {
    const commonProps = {
      form,
      isLoading: submitting || loading,
    };

    switch (currentStep) {
      case 1:
        return <TenantInfoStep {...commonProps} />;
      case 2:
        return (
          <ContractDetailsStep 
            {...commonProps}
          />
        );
      case 3:
        return (
          <ContractSettingsStep 
            {...commonProps}
            pdfFile={pdfFile}
            setPdfFile={setPdfFile}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <TenantEditLoadingState open={open} onOpenChange={onOpenChange} />;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className={`h-5 w-5 ${COLORS.primary.text}`} />
            Edit Tenant & Contract
          </DialogTitle>
          <DialogDescription>
            Update tenant and contract information in a single workflow
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Step {currentStep} of {TENANT_EDIT_STEPS.length}</span>
            <span className="text-sm text-gray-500">{Math.round(getStepProgress())}% Complete</span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>

        {/* Step Indicators */}
        <StepIndicators steps={TENANT_EDIT_STEPS} currentStep={currentStep} />

        {/* Contract Status Info */}
        <ContractStatusInfo primaryContract={primaryContract} />

        {/* Step Content */}
        <div className="py-6">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <MultiStepNavigationButtons
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          currentStep={currentStep}
          steps={TENANT_EDIT_STEPS}
          submitting={submitting}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};