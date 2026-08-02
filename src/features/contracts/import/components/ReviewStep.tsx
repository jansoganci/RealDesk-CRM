/**
 * Review Step Component
 * Shows extracted data with inline editing capability
 * Side-by-side layout: Document preview + Editable form
 */

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { DocumentPreviewSection } from './DocumentPreviewSection';
import { OwnerSection } from './OwnerSection';
import { TenantSection } from './TenantSection';
import { PropertySection } from './PropertySection';
import { ContractSection } from './ContractSection';
import { ReviewAlerts } from './ReviewAlerts';
import type { ReviewFormData, ReviewFormFieldValue, ParsedData } from '../types/reviewFormTypes';
import { useReviewFormState } from '../hooks/useReviewFormState';
import { useReviewFormValidation } from '../hooks/useReviewFormValidation';
import { useReviewFormSubmission } from '../hooks/useReviewFormSubmission';

interface ReviewStepProps {
  uploadedFile: File | null;
  extractedText: string;
  parsedData: ParsedData;
  onSubmit: (formData: ReviewFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const ReviewStep = ({
  uploadedFile,
  extractedText,
  parsedData,
  onSubmit,
  onCancel,
  isSubmitting
}: ReviewStepProps) => {
  const { t } = useTranslation('contracts');
  // Form state hook
  const { formData, updateField } = useReviewFormState(parsedData);

  // Form validation hook
  const { fieldErrors, validateForm, clearFieldError } = useReviewFormValidation();

  // Clear error when field is updated
  const handleFieldUpdate = (field: keyof ReviewFormData, value: ReviewFormFieldValue) => {
    updateField(field, value);
    
    // Clear error when user fixes it
    if (value && fieldErrors[field]) {
      clearFieldError(field);
    }
  };

  // Form submission hook
  const { handleSubmit } = useReviewFormSubmission({
    formData,
    validateForm,
    onSubmit,
  });

  // Count extracted vs total fields (for header display)
  const totalFields = Object.keys(formData).length;
  const extractedCount = Object.keys(parsedData).length;

  return (
    <div className="p-6">
      <ReviewAlerts parsedData={parsedData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT SIDE: Document Preview (1/3 width on desktop) */}
        <DocumentPreviewSection uploadedFile={uploadedFile} extractedText={extractedText} />

        {/* RIGHT SIDE: Form (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="h-6 w-6 text-success" />
            <h3 className="text-xl font-semibold">{t('import.sections.extractedData')}</h3>
            <span className="text-sm text-muted-foreground">
              {t('import.fieldsFilled', { extracted: extractedCount, total: totalFields })}
            </span>
          </div>

          {/* Owner Section */}
          <OwnerSection
            formData={formData}
            fieldErrors={fieldErrors}
            onFieldUpdate={handleFieldUpdate}
          />

          {/* Tenant Section */}
          <TenantSection
            formData={formData}
            fieldErrors={fieldErrors}
            onFieldUpdate={handleFieldUpdate}
          />

          {/* Property Section */}
          <PropertySection
            formData={formData}
            fieldErrors={fieldErrors}
            parsedData={parsedData}
            onFieldUpdate={handleFieldUpdate}
          />

          {/* Contract Section */}
          <ContractSection
            formData={formData}
            fieldErrors={fieldErrors}
            onFieldUpdate={handleFieldUpdate}
          />

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 pt-4">
            <Button
              size="lg"
              className="h-14 w-full bg-gradient-to-r from-success to-success/80 text-lg text-success-foreground hover:from-success/90 hover:to-success"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('import.saving')}
                </>
              ) : (
                t('import.confirmAndSave')
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t('create.buttons.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
