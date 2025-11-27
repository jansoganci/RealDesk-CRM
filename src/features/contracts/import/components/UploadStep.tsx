/**
 * Upload Step Component
 * Huge dropzone with clear call-to-action for file upload
 */

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UploadStepProps {
  onFileSelected: (file: File) => void;
  onError: () => void;
}

export const UploadStep = ({ onFileSelected, onError }: UploadStepProps) => {
  const { t } = useTranslation('contracts');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): boolean => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error(t('import.upload.invalidFileType'), {
        description: t('import.upload.invalidFileTypeDescription')
      });
      return false;
    }

    // Validate file size (10 MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('import.upload.fileTooLarge'), {
        description: t('import.upload.fileTooLargeDescription', {
          size: (file.size / 1024 / 1024).toFixed(1)
        })
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onFileSelected(file);
    } else {
      onError();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 md:p-12">
      {/* Huge Dropzone */}
      <div
        className={cn(
          "border-4 border-dashed rounded-3xl",
          "w-full max-w-2xl h-96",
          "flex flex-col items-center justify-center",
          "cursor-pointer transition-all duration-200",
          isDragging
            ? "border-blue-600 bg-blue-50 scale-105"
            : "border-blue-300 hover:border-blue-500 hover:bg-blue-50/50"
        )}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Big Icon */}
        <FileText
          className={cn(
            "h-24 w-24 mb-6 transition-colors",
            isDragging ? "text-blue-600" : "text-blue-400"
          )}
        />

        {/* Primary Text */}
        <p className="text-2xl md:text-3xl font-semibold text-gray-800 mb-2 text-center px-4">
          {isDragging
            ? t('import.upload.dropHere')
            : t('import.upload.dragHere')}
        </p>

        {/* Secondary Text */}
        <p className="text-lg md:text-xl text-gray-500 mb-8 text-center px-4">
          {t('import.upload.orSelect')}
        </p>

        {/* Big Button */}
        <Button
          size="lg"
          className="h-14 px-8 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          <Upload className="mr-2 h-5 w-5" />
          {t('import.upload.selectFromComputer')}
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Help Text */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-sm text-gray-500">
          {t('import.upload.helpText')}
        </p>
        <p className="text-xs text-gray-400">
          {t('import.upload.autoExtract')}
        </p>
      </div>
    </div>
  );
};
