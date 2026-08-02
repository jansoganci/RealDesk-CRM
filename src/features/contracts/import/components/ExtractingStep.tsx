/**
 * Extracting Step Component
 * Shows progress animation while extracting text from document
 */

import { useTranslation } from 'react-i18next';
import { Loader2, FileText, Search, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtractingStepProps {
  progress: number;
  status: string;
}

export const ExtractingStep = ({ progress, status }: ExtractingStepProps) => {
  const { t } = useTranslation('contracts');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      {/* Big Animated Spinner */}
      <Loader2 className="h-32 w-32 text-primary animate-spin mb-8" />

      {/* Status Text */}
      <h2 className="text-3xl font-semibold text-foreground mb-4">
        {status}
      </h2>

      {/* Progress Bar */}
      <div className="w-full max-w-md h-4 bg-muted rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress Percentage */}
      <p className="text-xl text-muted-foreground mb-12">
        {t('import.progress.completed', { progress })}
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
              progress >= 33 ? "bg-primary" : "bg-muted"
            )}
          >
            <FileText
              className={cn(
                "h-8 w-8 transition-colors",
                progress >= 33 ? "text-primary" : "text-muted-foreground/70"
              )}
            />
          </div>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              progress >= 33 ? "text-primary" : "text-muted-foreground"
            )}
          >
            {t('import.progressSteps.uploaded')}
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
              progress >= 66 ? "bg-primary" : "bg-muted"
            )}
          >
            <Search
              className={cn(
                "h-8 w-8 transition-colors",
                progress >= 66 ? "text-primary" : "text-muted-foreground/70"
              )}
            />
          </div>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              progress >= 66 ? "text-primary" : "text-muted-foreground"
            )}
          >
            {t('import.progressSteps.extracting')}
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
              progress >= 100 ? "bg-success/15" : "bg-muted"
            )}
          >
            <CheckCircle
              className={cn(
                "h-8 w-8 transition-colors",
                progress >= 100 ? "text-success" : "text-muted-foreground/70"
              )}
            />
          </div>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              progress >= 100 ? "text-success" : "text-muted-foreground"
            )}
          >
            {t('import.progressSteps.ready')}
          </span>
        </div>
      </div>

      {/* Wait message */}
      <p className="mt-12 text-sm text-muted-foreground">
        {t('import.waitMessage')}
      </p>
    </div>
  );
};
