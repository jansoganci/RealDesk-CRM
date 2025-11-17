import { useState, useEffect } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, ArrowRight, Check, Users, FileText, Settings } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { toast } from 'sonner';
import { getErrorMessage } from '../../lib/errorMapper';

// Step Components
import { TenantInfoStep } from './steps/TenantInfoStep';
import { ContractDetailsStep } from './steps/ContractDetailsStep';
import { ContractSettingsStep } from './steps/ContractSettingsStep';

// Services and Types
import { tenantsService } from '../../lib/serviceProxy';
import type { TenantWithContractData, TenantWithContractResult } from '../../types';

// Validation Schema Factory
const getEnhancedTenantSchema = (t: (key: string) => string) => z.object({
  // Step 1: Tenant Info
  tenant: z.object({
    name: z.string().min(1, t('errors.tenant.nameRequired')),
    email: z.string().email(t('errors.tenant.invalidEmail')).optional().or(z.literal('')),
    phone: z.string().optional(),
    notes: z.string().optional(),
  }),

  // Step 2 & 3: Contract Details with Settings
  contract: z.object({
    property_id: z.string().min(1, t('errors.tenant.propertyRequired')),
    start_date: z.string().min(1, t('errors.validation.required')),
    end_date: z.string().min(1, t('errors.validation.required')),
    rent_amount: z.number().nullable().optional(),
    status: z.enum(['Active', 'Inactive', 'Archived']).default('Active'),
    rent_increase_reminder_enabled: z.boolean().default(false),
    rent_increase_reminder_days: z.number().default(90),
    expected_new_rent: z.number().nullable().optional(),
    reminder_notes: z.string().optional(),
  }),
}).refine((data) => {
  // End date must be after start date
  if (data.contract.start_date && data.contract.end_date) {
    return new Date(data.contract.end_date) > new Date(data.contract.start_date);
  }
  return true;
}, {
  message: t('enhanced.errors.endDateBeforeStart'),
  path: ['contract', 'end_date'],
});

export type TenantWithContractFormData = z.infer<ReturnType<typeof getEnhancedTenantSchema>>;

interface EnhancedTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: TenantWithContractResult) => void;
  preSelectedPropertyId?: string | null;
}

export const EnhancedTenantDialog = ({
  open,
  onOpenChange,
  onSuccess,
  preSelectedPropertyId = null
}: EnhancedTenantDialogProps) => {
  const { t } = useTranslation(['tenants', 'errors', 'common']);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const STEPS = [
    {
      id: 1,
      title: t('enhanced.steps.info.title'),
      description: t('enhanced.steps.info.description'),
      icon: Users,
    },
    {
      id: 2,
      title: t('enhanced.steps.contract.title'),
      description: t('enhanced.steps.contract.description'),
      icon: FileText,
    },
    {
      id: 3,
      title: t('enhanced.steps.settings.title'),
      description: t('enhanced.steps.settings.description'),
      icon: Settings,
    },
  ];

  const form = useForm<TenantWithContractFormData>({
    resolver: zodResolver(getEnhancedTenantSchema(t)),
    defaultValues: {
      tenant: {
        name: '',
        email: '',
        phone: '',
        notes: '',
      },
      contract: {
        property_id: preSelectedPropertyId || '',
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

  // Pre-fill property when dialog opens
  useEffect(() => {
    if (open && preSelectedPropertyId) {
      form.setValue('contract.property_id', preSelectedPropertyId);
    }
  }, [open, preSelectedPropertyId, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setPdfFile(null);
      form.reset();
    }
  }, [open, form]);


  const validateCurrentStep = async (): Promise<boolean> => {
    try {
      switch (currentStep) {
        case 1:
          // Validate tenant info - trigger form validation for tenant fields
          return await form.trigger(['tenant.name', 'tenant.email', 'tenant.phone', 'tenant.notes']);
          
        case 2:
          // Validate contract details - trigger form validation for contract fields
          return await form.trigger(['contract.property_id', 'contract.start_date', 'contract.end_date', 'contract.rent_amount', 'contract.status']);
          
        case 3:
          // Validate settings (optional fields, so always valid)
          return true;
          
        default:
          return true;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const field = err.path.join('.') as FieldPath<TenantWithContractFormData>;
          form.setError(field, { message: err.message });
        });
      }
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Final validation
      const isValid = await validateCurrentStep();
      if (!isValid) return;

      const formData = form.getValues();
      
      // Prepare data for service
      // user_id is injected automatically by the RPC function on the database side
      const tenantWithContractData: TenantWithContractData = {
        tenant: {
          name: formData.tenant.name,
          email: formData.tenant.email || null,
          phone: formData.tenant.phone || null,
          notes: formData.tenant.notes || null,
          // property_id is not part of TenantInsert - tenants are related to properties via contracts
        } as any,
        contract: {
          tenant_id: '', // Will be set by the service
          property_id: formData.contract.property_id,
          start_date: formData.contract.start_date,
          end_date: formData.contract.end_date,
          rent_amount: formData.contract.rent_amount,
          status: formData.contract.status,
          notes: null, // Contract notes not implemented in this flow
          rent_increase_reminder_enabled: formData.contract.rent_increase_reminder_enabled,
          rent_increase_reminder_days: formData.contract.rent_increase_reminder_enabled 
            ? formData.contract.rent_increase_reminder_days 
            : null,
          rent_increase_reminder_contacted: false,
          expected_new_rent: formData.contract.expected_new_rent,
          reminder_notes: formData.contract.reminder_notes || null,
        } as any,
        pdfFile: pdfFile || undefined,
      };

      // Call the service
      const result = await tenantsService.createTenantWithContract(tenantWithContractData);

      // Success!
      toast.success(t('toasts.addTenantWithContractSuccess', { tenantName: result.tenant.name }));
      onSuccess(result);
      onOpenChange(false);

    } catch (error) {
      console.error('Failed to create tenant and contract:', error);

      // Check for duplicate active contract conflict
      const err = error as { code?: string; originalCode?: string; message?: string };
      if (err.code === '23505' || err.originalCode === '23505' || (err.message && err.message.includes('uniq_active_contract_per_property'))) {
        toast.error(t('enhanced.errors.duplicateActiveContract'));
        return;
      }

      // Show localized error message using error mapper
      toast.error(getErrorMessage(error, t));
    } finally {
      setSubmitting(false);
    }
  };

  const getStepProgress = () => {
    return (currentStep / STEPS.length) * 100;
  };

  const isLastStep = currentStep === STEPS.length;
  const isFirstStep = currentStep === 1;

  const renderCurrentStep = () => {
    const commonProps = {
      form,
      isLoading: submitting,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className={`h-5 w-5 ${COLORS.primary.text}`} />
            {t('addTenantButton')}
          </DialogTitle>
          <DialogDescription>
            {t('enhanced.steps.info.sectionDescription')}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Step {currentStep} of {STEPS.length}</span>
            <span className="text-sm text-gray-500">{Math.round(getStepProgress())}% Complete</span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {STEPS.map((step) => {
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

        {/* Step Content */}
        <div className="py-6">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={isFirstStep ? () => onOpenChange(false) : handleBack}
            disabled={submitting}
          >
            {isFirstStep ? (
              t('cancel', { ns: 'common' })
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('enhanced.navigation.back')}
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            {/* Step indicator badges */}
            {STEPS.map((_, index) => (
              <Badge
                key={index}
                variant={currentStep === index + 1 ? 'default' : 'outline'}
                className="w-2 h-2 p-0"
              />
            ))}
          </div>

          <Button
            type="button"
            onClick={isLastStep ? handleSubmit : handleNext}
            disabled={submitting}
            className={isLastStep ? `${COLORS.success.bg} ${COLORS.success.hover}` : ''}
          >
            {submitting ? (
              t('enhanced.navigation.submitting')
            ) : isLastStep ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('enhanced.navigation.submit')}
              </>
            ) : (
              <>
                {t('enhanced.navigation.next')}: {STEPS[currentStep]?.title}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};