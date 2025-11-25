/**
 * Review Step Component
 * Shows extracted data with inline editing capability
 * Side-by-side layout: PDF preview + Editable form
 */

import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { PDFPreviewSection } from './PDFPreviewSection';
import { OwnerSection } from './OwnerSection';
import { TenantSection } from './TenantSection';
import { PropertySection } from './PropertySection';
import { ContractSection } from './ContractSection';
import { ReviewAlerts } from './ReviewAlerts';
import { useReviewFormState } from '../hooks/useReviewFormState';
import { useReviewFormValidation } from '../hooks/useReviewFormValidation';
import { useReviewFormSubmission } from '../hooks/useReviewFormSubmission';

interface ReviewStepProps {
  uploadedFile: File | null;
  extractedText: string;
  parsedData: any;
  onSubmit: (formData: any) => void;
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
  // Form state hook
  const { formData, updateField } = useReviewFormState(parsedData);

  // Form validation hook
  const { fieldErrors, validateForm, clearFieldError } = useReviewFormValidation();

  // Clear error when field is updated
  const handleFieldUpdate = (field: string, value: any) => {
    updateField(field as keyof typeof formData, value);
    
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
        {/* LEFT SIDE: PDF Preview (1/3 width on desktop) */}
        <PDFPreviewSection uploadedFile={uploadedFile} extractedText={extractedText} />

        {/* RIGHT SIDE: Form (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-semibold">Çıkarılan Bilgiler</h3>
            <span className="text-sm text-gray-500">
              ({extractedCount}/{totalFields} alan dolu)
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
              className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  ✅ Onayla ve Kaydet
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              İptal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

