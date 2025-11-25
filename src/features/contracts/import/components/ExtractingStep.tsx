/**
 * Extracting Step Component
 * Shows progress animation while extracting text from PDF
 */

import { Loader2, FileText, Search, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtractingStepProps {
  progress: number;
  status: string;
}

export const ExtractingStep = ({ progress, status }: ExtractingStepProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      {/* Big Animated Spinner */}
      <Loader2 className="h-32 w-32 text-blue-600 animate-spin mb-8" />

      {/* Status Text */}
      <h2 className="text-3xl font-semibold text-gray-800 mb-4">
        {status}
      </h2>

      {/* Progress Bar */}
      <div className="w-full max-w-md h-4 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress Percentage */}
      <p className="text-xl text-gray-600 mb-12">
        {progress}% tamamlandı
      </p>

      {/* Visual Progress Steps */}
      <div className="flex gap-8 md:gap-16">
        {/* Step 1: Upload */}
        <div
          className={cn(
            "flex flex-col items-center transition-all duration-300",
            progress >= 33 ? "opacity-100 scale-100" : "opacity-30 scale-95"
          )}
        >
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors",
              progress >= 33 ? "bg-blue-100" : "bg-gray-100"
            )}
          >
            <FileText
              className={cn(
                "h-8 w-8 transition-colors",
                progress >= 33 ? "text-blue-600" : "text-gray-400"
              )}
            />
          </div>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              progress >= 33 ? "text-blue-600" : "text-gray-500"
            )}
          >
            PDF Yüklendi
          </span>
        </div>

        {/* Step 2: Extracting */}
        <div
          className={cn(
            "flex flex-col items-center transition-all duration-300",
            progress >= 66 ? "opacity-100 scale-100" : "opacity-30 scale-95"
          )}
        >
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors",
              progress >= 66 ? "bg-blue-100" : "bg-gray-100"
            )}
          >
            <Search
              className={cn(
                "h-8 w-8 transition-colors",
                progress >= 66 ? "text-blue-600" : "text-gray-400"
              )}
            />
          </div>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              progress >= 66 ? "text-blue-600" : "text-gray-500"
            )}
          >
            Metin Çıkarılıyor
          </span>
        </div>

        {/* Step 3: Done */}
        <div
          className={cn(
            "flex flex-col items-center transition-all duration-300",
            progress >= 100 ? "opacity-100 scale-100" : "opacity-30 scale-95"
          )}
        >
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors",
              progress >= 100 ? "bg-green-100" : "bg-gray-100"
            )}
          >
            <CheckCircle
              className={cn(
                "h-8 w-8 transition-colors",
                progress >= 100 ? "text-green-600" : "text-gray-400"
              )}
            />
          </div>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              progress >= 100 ? "text-green-600" : "text-gray-500"
            )}
          >
            Hazır
          </span>
        </div>
      </div>

      {/* Wait message */}
      <p className="mt-12 text-sm text-gray-500">
        Lütfen bekleyin, bu işlem birkaç saniye sürebilir...
      </p>
    </div>
  );
};
