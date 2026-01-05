import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { userPreferencesService } from '@/services/userPreferences.service';
import { ROUTES } from '@/config/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface UseOnboardingBannerReturn {
  shouldShowBanner: boolean;
  dismissBanner: () => Promise<void>;
  resumeOnboarding: () => void;
  isLoading: boolean;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function useOnboardingBanner(): UseOnboardingBannerReturn {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load dismissal timestamp
  useEffect(() => {
    const loadDismissal = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const timestamp = await userPreferencesService.getOnboardingBannerDismissal();
        setDismissedAt(timestamp);
      } catch (error) {
        console.error('Failed to load banner dismissal:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDismissal();
  }, [user]);

  const shouldShowBanner = useMemo(() => {
    if (isLoading) return false;
    if (!currentOrg) return false;
    if (currentOrg.onboarding_completed) return false;
    if (!currentOrg.onboarding_skipped) return false;

    // If not dismissed, show banner
    if (!dismissedAt) return true;

    // Check if 7 days have passed since dismissal
    const now = Date.now();
    return (now - dismissedAt) >= SEVEN_DAYS_MS;
  }, [currentOrg, dismissedAt, isLoading]);

  const dismissBanner = useCallback(async () => {
    try {
      const timestamp = Date.now();
      await userPreferencesService.updateOnboardingBannerDismissal(timestamp);
      setDismissedAt(timestamp);
    } catch (error) {
      console.error('Failed to dismiss banner:', error);
      throw error;
    }
  }, []);

  const resumeOnboarding = useCallback(() => {
    navigate(`${ROUTES.ONBOARDING}?resume=true`);
  }, [navigate]);

  return {
    shouldShowBanner,
    dismissBanner,
    resumeOnboarding,
    isLoading,
  };
}

