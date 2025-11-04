import { useState, useEffect } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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

// Step Components
import { TenantInfoStep } from './steps/TenantInfoStep';
import { ContractDetailsStep } from './steps/ContractDetailsStep';
import { ContractSettingsStep } from './steps/ContractSettingsStep';

// Services and Types
import { tenantsService, contractsService } from '../../lib/serviceProxy';
import type { 
  TenantWithProperty, 
  Contract, 
  TenantUpdate, 
  ContractUpdate,
  ContractStatus,
} from '../../types';

// Validation Schema (same as creation dialog)
const enhancedTenantEditSchema = z.object({
  // Step 1: Tenant Info
  tenant: z.object({
    name: z.string().min(1, 'Tenant name is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    notes: z.string().optional(),
  }),
  
  // Step 2 & 3: Contract Details with Settings
  contract: z.object({
    property_id: z.string().min(1, 'Property selection is required'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
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
  message: 'End date must be after start date',
  path: ['contract', 'end_date'],
});

export type TenantEditFormData = z.infer<typeof enhancedTenantEditSchema>;

interface EnhancedTenantEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantWithProperty;
  onSuccess: () => void;
}

const STEPS = [
  {
    id: 1,
    title: 'Tenant Information',
    description: 'Basic tenant details',
    icon: Users,
  },
  {
    id: 2,
    title: 'Property & Contract',
    description: 'Property selection and contract details',
    icon: FileText,
  },
  {
    id: 3,
    title: 'Contract Settings',
    description: 'Reminders and document upload',
    icon: Settings,
  },
];

export const EnhancedTenantEditDialog = ({ 
  open, 
  onOpenChange, 
  tenant,
  onSuccess
}: EnhancedTenantEditDialogProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [primaryContract, setPrimaryContract] = useState<Contract | null>(null);

  const form = useForm<TenantEditFormData>({
    resolver: zodResolver(enhancedTenantEditSchema),
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

  // Load tenant and contract data when dialog opens
  useEffect(() => {
    if (open && tenant) {
      loadTenantAndContractData();
    }
  }, [open, tenant]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setPdfFile(null);
      setPrimaryContract(null);
      form.reset();
    }
  }, [open, form]);

  const loadTenantAndContractData = async () => {
    try {
      setLoading(true);
      
      // Load tenant's contracts
      const contracts = await contractsService.getByTenantId(tenant.id);
      
      // Find primary contract (most recent active, or most recent if no active)
      let primary = contracts.find(c => c.status === 'Active');
      if (!primary && contracts.length > 0) {
        primary = contracts[0]; // Most recent contract
      }
      
      setPrimaryContract(primary || null);
      
      // Populate form with tenant data
      form.setValue('tenant.name', tenant.name || '');
      form.setValue('tenant.email', tenant.email || '');
      form.setValue('tenant.phone', tenant.phone || '');
      form.setValue('tenant.notes', tenant.notes || '');
      
      // Populate form with contract data if exists
      if (primary) {
        form.setValue('contract.property_id', primary.property_id || '');
        form.setValue('contract.start_date', primary.start_date || '');
        form.setValue('contract.end_date', primary.end_date || '');
        form.setValue('contract.rent_amount', primary.rent_amount);
        form.setValue('contract.status', (primary.status as ContractStatus) || 'Active');
        form.setValue('contract.rent_increase_reminder_enabled', primary.rent_increase_reminder_enabled || false);
        form.setValue('contract.rent_increase_reminder_days', primary.rent_increase_reminder_days || 90);
        form.setValue('contract.expected_new_rent', primary.expected_new_rent);
        form.setValue('contract.reminder_notes', primary.reminder_notes || '');
      } else {
        // No contract exists - set default values for new contract
        form.setValue('contract.property_id', tenant.property_id || '');
        form.setValue('contract.start_date', '');
        form.setValue('contract.end_date', '');
        form.setValue('contract.rent_amount', null);
        form.setValue('contract.status', 'Active');
        form.setValue('contract.rent_increase_reminder_enabled', false);
        form.setValue('contract.rent_increase_reminder_days', 90);
        form.setValue('contract.expected_new_rent', null);
        form.setValue('contract.reminder_notes', '');
      }
      
    } catch (error) {
      console.error('Failed to load tenant and contract data:', error);
      toast.error('Failed to load tenant and contract data');
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    try {
      switch (currentStep) {
        case 1:
          // Validate tenant info
          return await form.trigger(['tenant.name', 'tenant.email', 'tenant.phone', 'tenant.notes']);
          
        case 2:
          // Validate contract details
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
          const field = err.path.join('.') as FieldPath<TenantEditFormData>;
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
      
      // Update tenant
      const tenantUpdateData: TenantUpdate = {
        name: formData.tenant.name,
        email: formData.tenant.email || null,
        phone: formData.tenant.phone || null,
        notes: formData.tenant.notes || null,
        property_id: formData.contract.property_id, // Update property assignment
      };
      
      await tenantsService.update(tenant.id, tenantUpdateData);
      
      // Update or create contract
      if (primaryContract) {
        // Update existing contract
        const contractUpdateData: ContractUpdate = {
          property_id: formData.contract.property_id,
          start_date: formData.contract.start_date,
          end_date: formData.contract.end_date,
          rent_amount: formData.contract.rent_amount,
          status: formData.contract.status,
          rent_increase_reminder_enabled: formData.contract.rent_increase_reminder_enabled,
          rent_increase_reminder_days: formData.contract.rent_increase_reminder_enabled 
            ? formData.contract.rent_increase_reminder_days 
            : null,
          expected_new_rent: formData.contract.expected_new_rent,
          reminder_notes: formData.contract.reminder_notes || null,
        };
        
        await contractsService.update(primaryContract.id, contractUpdateData);
      } else {
        // Create new contract if none exists
        const contractInsertData = {
          tenant_id: tenant.id,
          property_id: formData.contract.property_id,
          start_date: formData.contract.start_date,
          end_date: formData.contract.end_date,
          rent_amount: formData.contract.rent_amount,
          status: formData.contract.status,
          rent_increase_reminder_enabled: formData.contract.rent_increase_reminder_enabled,
          rent_increase_reminder_days: formData.contract.rent_increase_reminder_enabled 
            ? formData.contract.rent_increase_reminder_days 
            : null,
          rent_increase_reminder_contacted: false,
          expected_new_rent: formData.contract.expected_new_rent,
          reminder_notes: formData.contract.reminder_notes || null,
        };
        
        await contractsService.create(contractInsertData);
      }
      
      // Handle PDF upload if provided
      if (pdfFile && primaryContract) {
        try {
          await contractsService.uploadContractPdfAndPersist(pdfFile, primaryContract.id);
        } catch (uploadError) {
          console.error('PDF upload failed:', uploadError);
          toast.error('Tenant and contract updated, but PDF upload failed');
        }
      }
      
      // Success!
      toast.success(`Tenant ${formData.tenant.name} updated successfully!`);
      onSuccess();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Failed to update tenant and contract:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update tenant and contract');
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
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
            <DialogDescription>
              Loading tenant and contract information...
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
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

        {/* Contract Status Info */}
        {primaryContract && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>Editing Contract:</strong> {primaryContract.status} contract 
              {primaryContract.start_date && primaryContract.end_date && 
                ` (${primaryContract.start_date} to ${primaryContract.end_date})`
              }
            </p>
          </div>
        )}
        
        {!primaryContract && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">
              <strong>No Contract Found:</strong> A new contract will be created for this tenant.
            </p>
          </div>
        )}

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
              'Cancel'
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
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
            className={isLastStep ? `${COLORS.success.bg} hover:${COLORS.success.dark}` : ''}
          >
            {submitting ? (
              'Saving...'
            ) : isLastStep ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Update Tenant & Contract
              </>
            ) : (
              <>
                Next: {STEPS[currentStep]?.title}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};