import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { useBilling } from '@/contexts/BillingContext';
import { calculateTrialDaysRemaining } from '@/utils/trial';
import { ROUTES } from '@/config/constants';

const TRIAL_BANNER_DISMISS_KEY = 'trial_banner_dismissed_at';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

type BannerUrgency = 'default' | 'warning' | 'urgent' | 'critical';

interface BannerConfig {
  urgency: BannerUrgency;
  icon: React.ReactNode;
  titleKey: string;
  messageKey: string;
  gradient: string;
  isDismissible: boolean;
}

const getBannerConfig = (daysRemaining: number | null): BannerConfig => {
  if (daysRemaining === null || daysRemaining >= 8) {
    // 14-8 days: Default state
    return {
      urgency: 'default',
      icon: <Sparkles className="h-4 w-4" />,
      titleKey: 'stickyBanner.title.default',
      messageKey: 'stickyBanner.message.default',
      gradient: 'from-blue-600 via-blue-500 to-indigo-500',
      isDismissible: true,
    };
  }

  if (daysRemaining >= 4) {
    // 7-4 days: Warning state
    return {
      urgency: 'warning',
      icon: <Clock className="h-4 w-4" />,
      titleKey: 'stickyBanner.title.warning',
      messageKey: 'stickyBanner.message.warning',
      gradient: 'from-amber-500 via-orange-500 to-amber-600',
      isDismissible: true,
    };
  }

  if (daysRemaining >= 2) {
    // 3-2 days: Urgent state
    return {
      urgency: 'urgent',
      icon: <AlertTriangle className="h-4 w-4" />,
      titleKey: 'stickyBanner.title.urgent',
      messageKey: 'stickyBanner.message.urgent',
      gradient: 'from-orange-500 via-red-500 to-orange-600',
      isDismissible: true,
    };
  }

  // 1 day or less: Critical state - non-dismissible
  return {
    urgency: 'critical',
    icon: <AlertCircle className="h-4 w-4 animate-pulse" />,
    titleKey: 'stickyBanner.title.critical',
    messageKey: 'stickyBanner.message.critical',
    gradient: 'from-red-600 via-rose-500 to-red-600',
    isDismissible: false,
  };
};

const getDismissedAt = (): number | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(TRIAL_BANNER_DISMISS_KEY);
  if (!stored) return null;
  const timestamp = parseInt(stored, 10);
  return Number.isNaN(timestamp) ? null : timestamp;
};

const setDismissedAt = (timestamp: number): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TRIAL_BANNER_DISMISS_KEY, timestamp.toString());
  }
};

const clearDismissedAt = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TRIAL_BANNER_DISMISS_KEY);
  }
};

const shouldShowBanner = (dismissedAt: number | null): boolean => {
  if (dismissedAt === null) return true;
  const now = Date.now();
  return now - dismissedAt >= TWENTY_FOUR_HOURS_MS;
};

export const TrialBanner = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('billing');
  const { billingStatus, billingLoading } = useBilling();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const trialDaysRemaining = useMemo(
    () => calculateTrialDaysRemaining(billingStatus?.trialEndsAt ?? null),
    [billingStatus?.trialEndsAt]
  );

  const bannerConfig = useMemo(
    () => getBannerConfig(trialDaysRemaining),
    [trialDaysRemaining]
  );

  // Check localStorage on mount and set visibility
  useEffect(() => {
    if (billingLoading) return;

    // Only show for trial users
    if (!billingStatus?.isTrial) {
      setIsVisible(false);
      return;
    }

    const dismissedAt = getDismissedAt();

    // If banner is non-dismissible (critical state), always show and clear any dismissed state
    if (!bannerConfig.isDismissible) {
      clearDismissedAt();
      setIsDismissed(false);
      setIsVisible(true);
      return;
    }

    // Check if 24 hours have passed since dismissal
    if (shouldShowBanner(dismissedAt)) {
      if (dismissedAt !== null) {
        clearDismissedAt();
      }
      setIsDismissed(false);
      setIsVisible(true);
    } else {
      setIsDismissed(true);
      setIsVisible(false);
    }
  }, [billingStatus?.isTrial, billingLoading, bannerConfig.isDismissible]);

  const handleDismiss = useCallback(() => {
    if (!bannerConfig.isDismissible) return;
    setDismissedAt(Date.now());
    setIsDismissed(true);
    setIsVisible(false);
  }, [bannerConfig.isDismissible]);

  const handleViewPlans = useCallback(() => {
    navigate(ROUTES.PRICING);
  }, [navigate]);

  // Don't render if not visible or still loading
  if (!isVisible || billingLoading || isDismissed) {
    return null;
  }

  return (
    <div
      className={`sticky top-0 z-40 w-full bg-gradient-to-r ${bannerConfig.gradient} shadow-lg`}
      role="banner"
      aria-label={t('stickyBanner.ariaLabel')}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 sm:h-14 items-center justify-between gap-2 sm:gap-4">
          {/* Left: Icon + Message */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex-shrink-0 rounded-full bg-white/20 p-1.5 sm:p-2">
              <span className="text-white">{bannerConfig.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs sm:text-sm font-semibold text-white">
                {t(bannerConfig.titleKey, { count: trialDaysRemaining ?? 0 })}
              </p>
              <p className="hidden sm:block truncate text-xs text-white/90">
                {t(bannerConfig.messageKey)}
              </p>
            </div>
          </div>

          {/* Right: CTA + Close */}
          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            <Button
              size="sm"
              onClick={handleViewPlans}
              className="h-7 sm:h-8 rounded-full bg-white px-3 sm:px-4 text-xs sm:text-sm font-semibold text-blue-600 shadow-md hover:bg-white/90 hover:text-blue-700 transition-all"
            >
              {t('stickyBanner.cta')}
            </Button>

            {bannerConfig.isDismissible && (
              <button
                onClick={handleDismiss}
                className="rounded-full p-1 sm:p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                aria-label={t('stickyBanner.dismiss')}
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
