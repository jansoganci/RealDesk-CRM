import { useState, useCallback, DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/config/colors';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Upload, X, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PhotoUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  currentPhotoCount?: number;
  uploading?: boolean;
}

export const PhotoUpload = ({
  onFilesSelected,
  maxFiles = 10,
  currentPhotoCount = 0,
  uploading = false,
}: PhotoUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation(['photo']);
  const remainingSlots = maxFiles - currentPhotoCount;

  const validateFiles = (files: File[]): { valid: File[]; error: string | null } => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        return false;
      }
      if (file.size > maxSize) {
        return false;
      }
      return true;
    });

    if (validFiles.length === 0 && files.length > 0) {
      return { valid: [], error: t('upload.validation.invalidFileType') };
    }

    if (validFiles.length > remainingSlots) {
      return { valid: [], error: t('upload.validation.exceededSlots', { remainingSlots, maxFiles }) };
    }

    return { valid: validFiles, error: null };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const { valid, error } = validateFiles(files);

    if (error) {
      setError(error);
      return;
    }

    setError(null);
    setSelectedFiles(valid);
    onFilesSelected(valid);
  };

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const { valid, error } = validateFiles(files);

      if (error) {
        setError(error);
        return;
      }

      setError(null);
      setSelectedFiles(valid);
      onFilesSelected(valid);
    },
    [onFilesSelected, remainingSlots]
  );

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    setError(null);
    onFilesSelected([]);
  };

  if (remainingSlots <= 0) {
    return (
      <Card className={`p-6 ${COLORS.warning.border} ${COLORS.warning.bgLight}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`h-5 w-5 ${COLORS.warning.text} mt-0.5 flex-shrink-0`} />
          <div>
            <p className={`font-medium ${COLORS.warning.textDarker}`}>
              {t('upload.maxReached.title')}
            </p>
            <p className={`text-sm ${COLORS.warning.textDark} mt-1`}>
              {t('upload.maxReached.description', { maxFiles })}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-colors',
          isDragging
            ? `${COLORS.primary.border} ${COLORS.primary.bgLight}`
            : `${COLORS.border.DEFAULT_class} hover:${COLORS.border.dark} ${COLORS.gray.bg50}`,
          uploading && 'pointer-events-none opacity-60'
        )}
      >
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />

        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className={`p-3 ${COLORS.primary.bgLight} rounded-full`}>
            <Upload className={`h-6 w-6 ${COLORS.primary.text}`} />
          </div>
          <div>
            <p className={`text-sm font-medium ${COLORS.gray.text900}`}>
              {isDragging ? t('upload.dropzone.active') : t('upload.dropzone.idle')}
            </p>
            <p className={`text-xs ${COLORS.muted.textLight} mt-1`}>
              {t('upload.dropzone.clickToBrowse')}
            </p>
          </div>
          <div className={`text-xs ${COLORS.muted.textLight} space-y-1`}>
            <p>{t('upload.fileTypes')}</p>
            <p>
              {t('upload.slotsAvailable', { remainingSlots, maxFiles })}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Card className={`p-4 ${COLORS.danger.border} ${COLORS.danger.bgLight}`}>
          <div className="flex items-start gap-2">
            <AlertCircle className={`h-4 w-4 ${COLORS.danger.text} mt-0.5 flex-shrink-0`} />
            <p className={`text-sm ${COLORS.danger.textDark}`}>{error}</p>
          </div>
        </Card>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${COLORS.gray.text900}`}>
              {t('upload.preview.title', { count: selectedFiles.length })}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={uploading}
            >
              {t('upload.preview.clearAll')}
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className={`aspect-square rounded-lg overflow-hidden ${COLORS.gray.bg100} border ${COLORS.gray.border200}`}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  disabled={uploading}
                  className={`absolute top-1 right-1 p-1 ${COLORS.danger.bg} ${COLORS.text.white} rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:${COLORS.danger.dark} disabled:opacity-50`}
                >
                  <X className="h-3 w-3" />
                </button>
                <p className={`text-xs ${COLORS.gray.text600} mt-1 truncate`}>{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
