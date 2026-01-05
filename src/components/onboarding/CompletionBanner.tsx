import { useTranslation } from 'react-i18next';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompletionBannerProps {
  onDismiss: () => void;
  onResume: () => void;
}

export function CompletionBanner({ onDismiss, onResume }: CompletionBannerProps) {
  const { t } = useTranslation('common');

  return (
    <div
      className="fixed top-[64px] left-0 right-0 z-40 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-lg lg:left-64"
      role="banner"
      aria-label={t('completionBanner.title')}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 sm:h-14 items-center justify-between gap-2 sm:gap-4">
          {/* Left: Icon + Message */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex-shrink-0 rounded-full bg-white/20 p-1.5 sm:p-2">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs sm:text-sm font-semibold text-white">
                {t('completionBanner.title')}
              </p>
              <p className="hidden sm:block truncate text-xs text-white/90">
                {t('completionBanner.description')}
              </p>
            </div>
          </div>

          {/* Right: CTA Buttons + Close */}
          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            <Button
              size="sm"
              onClick={onResume}
              className="h-7 sm:h-8 rounded-full bg-white px-3 sm:px-4 text-xs sm:text-sm font-semibold text-amber-700 shadow-md hover:bg-white/90 hover:text-amber-800 transition-all"
            >
              {t('completionBanner.completeSetup')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              className="h-7 sm:h-8 rounded-full border-white/30 bg-white/10 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-white/20 transition-all"
            >
              {t('completionBanner.later')}
            </Button>
            <button
              onClick={onDismiss}
              className="rounded-full p-1 sm:p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              aria-label={t('completionBanner.dismiss')}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

