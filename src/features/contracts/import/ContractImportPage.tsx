/**
 * Contract Import Page
 * Allows users to import legacy contracts by uploading PDF/DOCX files
 *
 * Flow: Upload → Extract → Review → Success
 */

import { useState } from 'react';
import { UploadStep } from './components/UploadStep';
import { ExtractingStep } from './components/ExtractingStep';
import { ReviewStep } from './components/ReviewStep';
import { SuccessStep } from './components/SuccessStep';
import { useContractImport } from './hooks/useContractImport';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';

type ImportStep = 'upload' | 'extracting' | 'review' | 'success';

export const ContractImportPage = () => {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const importState = useContractImport();

  const handleReset = () => {
    setCurrentStep('upload');
    importState.reset();
  };

  return (
    <MainLayout title="Eski Sözleşme Aktarma">
      <PageContainer>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📥 Eski Sözleşme Aktarma
          </h1>
          <p className="text-gray-600">
            PDF veya Word dosyanızdan sözleşme bilgilerini otomatik olarak çıkarıp sisteme aktarın
          </p>
        </div>

      {/* Progress Indicator (Simple) */}
      {currentStep !== 'upload' && (
        <div className="mb-8 flex items-center gap-2 text-sm text-gray-600">
          <span className={currentStep === 'extracting' || currentStep === 'review' || currentStep === 'success' ? 'text-blue-600 font-medium' : ''}>
            1. Yükle
          </span>
          <span>→</span>
          <span className={currentStep === 'review' || currentStep === 'success' ? 'text-blue-600 font-medium' : ''}>
            2. İncele
          </span>
          <span>→</span>
          <span className={currentStep === 'success' ? 'text-blue-600 font-medium' : ''}>
            3. Tamamla
          </span>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {currentStep === 'upload' && (
          <UploadStep
            onFileSelected={async (file) => {
              setCurrentStep('extracting');
              await importState.handleFileUpload(file);
              setCurrentStep('review');
            }}
            onError={() => setCurrentStep('upload')}
          />
        )}

        {currentStep === 'extracting' && (
          <ExtractingStep
            progress={importState.progress}
            status={importState.status}
          />
        )}

        {currentStep === 'review' && (
          <ReviewStep
            uploadedFile={importState.file}
            extractedText={importState.extractedText}
            parsedData={importState.parsedData}
            onSubmit={async (formData) => {
              const success = await importState.submitContract(formData);
              if (success) {
                setCurrentStep('success');
              }
            }}
            onCancel={handleReset}
            isSubmitting={importState.submitting}
          />
        )}

        {currentStep === 'success' && (
          <SuccessStep
            createdData={importState.createdData}
            onImportAnother={handleReset}
          />
        )}
      </div>
      </PageContainer>
    </MainLayout>
  );
};
