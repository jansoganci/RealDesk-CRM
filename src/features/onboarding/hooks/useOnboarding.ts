import { useState, useCallback, useEffect } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { onboardingService } from '../services/onboarding.service';
import { organizationService } from '@/lib/serviceProxy';
import { getAuthenticatedUserId } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { toast } from 'sonner';

const logger = createLogger('OnboardingHook');

export type PrimaryUseCase = 'rentals' | 'sales' | 'both' | 'exploring';

export interface OnboardingOrganizationProfile {
  organizationName: string;
  brokerageName: string;
  licenseState: string;
  primaryMarketCity: string;
  primaryMarketState: string;
}

interface UseOnboardingReturn {
  // State
  currentStep: number;
  primaryUseCase: PrimaryUseCase | null;
  organizationName: string;
  brokerageName: string;
  licenseState: string;
  primaryMarketCity: string;
  primaryMarketState: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  setPrimaryUseCase: (useCase: PrimaryUseCase) => void;
  setOrganizationName: (name: string) => void;
  setBrokerageName: (name: string) => void;
  setLicenseState: (state: string) => void;
  setPrimaryMarketCity: (city: string) => void;
  setPrimaryMarketState: (state: string) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;

  // Save methods
  saveStep1: () => Promise<void>;
  saveStep2: (profile: OnboardingOrganizationProfile) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resumeFromStep: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
  const { currentOrg, loading: orgLoading, refreshOrg } = useOrg();
  const [currentStep, setCurrentStep] = useState(1);
  const [primaryUseCase, setPrimaryUseCase] = useState<PrimaryUseCase | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [brokerageName, setBrokerageName] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [primaryMarketCity, setPrimaryMarketCity] = useState('');
  const [primaryMarketState, setPrimaryMarketState] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing data if available
  // Try loading from user_onboarding_responses first, fallback to organizations table
  useEffect(() => {
    const loadOnboardingData = async () => {
      if (!currentOrg?.id) return;

      try {
        // Try to load from user_onboarding_responses first (new source)
        const responses = await onboardingService.getResponses(currentOrg.id);
        
        // Load primary_use_case from new table, fallback to old table
        if (responses.primary_use_case) {
          setPrimaryUseCase(responses.primary_use_case as PrimaryUseCase);
        } else if (currentOrg?.primary_use_case) {
          // Fallback to organizations table (backward compatibility)
          setPrimaryUseCase(currentOrg.primary_use_case as PrimaryUseCase);
        }

        // Organization name always comes from organizations table (not a survey response)
        if (currentOrg?.name) {
          setOrganizationName(currentOrg.name);
        }
        setBrokerageName(currentOrg?.brokerage_name ?? '');
        setLicenseState(currentOrg?.license_state ?? '');
        setPrimaryMarketCity(currentOrg?.primary_market_city ?? '');
        setPrimaryMarketState(currentOrg?.primary_market_state ?? '');
      } catch (err) {
        // If new table fails, fall back to old table (graceful degradation)
        logger.warn('Failed to load from user_onboarding_responses, using fallback:', err);
        
        // Fallback to organizations table
        if (currentOrg?.primary_use_case) {
          setPrimaryUseCase(currentOrg.primary_use_case as PrimaryUseCase);
        }
        if (currentOrg?.name) {
          setOrganizationName(currentOrg.name);
        }
        setBrokerageName(currentOrg?.brokerage_name ?? '');
        setLicenseState(currentOrg?.license_state ?? '');
        setPrimaryMarketCity(currentOrg?.primary_market_city ?? '');
        setPrimaryMarketState(currentOrg?.primary_market_state ?? '');
      }
    };

    loadOnboardingData();
  }, [
    currentOrg?.brokerage_name,
    currentOrg?.id,
    currentOrg?.license_state,
    currentOrg?.name,
    currentOrg?.primary_market_city,
    currentOrg?.primary_market_state,
    currentOrg?.primary_use_case,
  ]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(step);
      setError(null);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      setError(null);
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => Math.max(prev - 1, 1));
      setError(null);
    }
  }, [currentStep]);

  const saveStep1 = useCallback(async () => {
    if (!currentOrg?.id) {
      setError('Organization not found');
      return;
    }

    if (!primaryUseCase) {
      setError('Please select a use case');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userId = await getAuthenticatedUserId();

      // Save primary use case
      await onboardingService.savePrimaryUseCase(currentOrg.id, primaryUseCase);

      // Track event
      await onboardingService.trackEvent(
        currentOrg.id,
        userId,
        1,
        'goal_selection',
        'completed',
        { primary_use_case: primaryUseCase }
      );

      // Move to next step
      nextStep();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save selection';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg?.id, primaryUseCase, nextStep]);

  const saveStep2 = useCallback(async (profile: OnboardingOrganizationProfile) => {
    if (!currentOrg?.id) {
      setError('Organization not found');
      return;
    }

    if (!profile.organizationName || profile.organizationName.trim().length < 2) {
      setError('Organization name must be at least 2 characters');
      return;
    }

    if (profile.organizationName.length > 255) {
      setError('Organization name must not exceed 255 characters');
      return;
    }

    if (
      !profile.brokerageName.trim() ||
      !profile.licenseState ||
      !profile.primaryMarketCity.trim() ||
      !profile.primaryMarketState
    ) {
      setError('Please complete all required organization profile fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userId = await getAuthenticatedUserId();
      const trimmedProfile: OnboardingOrganizationProfile = {
        organizationName: profile.organizationName.trim(),
        brokerageName: profile.brokerageName.trim(),
        licenseState: profile.licenseState.trim().toUpperCase(),
        primaryMarketCity: profile.primaryMarketCity.trim(),
        primaryMarketState: profile.primaryMarketState.trim().toUpperCase(),
      };

      // 1. Update organization profile
      await organizationService.updateOnboardingProfile(currentOrg.id, trimmedProfile);

      // 2. Advance onboarding step
      await onboardingService.updateOnboardingStep(currentOrg.id, 2);

      setOrganizationName(trimmedProfile.organizationName);
      setBrokerageName(trimmedProfile.brokerageName);
      setLicenseState(trimmedProfile.licenseState);
      setPrimaryMarketCity(trimmedProfile.primaryMarketCity);
      setPrimaryMarketState(trimmedProfile.primaryMarketState);
      await refreshOrg({ silent: true });

      // 3. Track event
      await onboardingService.trackEvent(
        currentOrg.id,
        userId,
        2,
        'organization_setup',
        'completed',
        {
          organization_name: trimmedProfile.organizationName,
          brokerage_name: trimmedProfile.brokerageName,
          license_state: trimmedProfile.licenseState,
          primary_market_city: trimmedProfile.primaryMarketCity,
          primary_market_state: trimmedProfile.primaryMarketState,
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save organization setup';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg?.id, refreshOrg]);

  const completeOnboarding = useCallback(async () => {
    if (!currentOrg?.id) {
      setError('Organization not found');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userId = await getAuthenticatedUserId();

      // Mark onboarding as complete
      await onboardingService.completeOnboarding(currentOrg.id);

      // Track completion event
      await onboardingService.trackEvent(
        currentOrg.id,
        userId,
        3,
        'quick_start',
        'completed',
        { primary_use_case: primaryUseCase }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete onboarding';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg?.id, primaryUseCase]);

  const resumeFromStep = useCallback(async () => {
    if (!currentOrg) {
      setCurrentStep(1);
      return;
    }

    const lastStep = currentOrg.onboarding_step ?? 0;
    // Resume from next incomplete step
    const nextStep = Math.min(lastStep + 1, 3);
    setCurrentStep(nextStep);

    // Load saved data - try new table first, fallback to old table
    try {
      const responses = await onboardingService.getResponses(currentOrg.id);
      
      // Load primary_use_case from new table, fallback to old table
      if (responses.primary_use_case) {
        setPrimaryUseCase(responses.primary_use_case as PrimaryUseCase);
      } else if (currentOrg.primary_use_case) {
        setPrimaryUseCase(currentOrg.primary_use_case as PrimaryUseCase);
      }

    } catch (err) {
      // If new table fails, fall back to old table (graceful degradation)
      logger.warn('Failed to load from user_onboarding_responses in resume, using fallback:', err);
      
      // Fallback to organizations table
      if (currentOrg.primary_use_case) {
        setPrimaryUseCase(currentOrg.primary_use_case as PrimaryUseCase);
      }
    }

    // Organization name always comes from organizations table
    if (currentOrg.name) {
      setOrganizationName(currentOrg.name);
    }
    setBrokerageName(currentOrg.brokerage_name ?? '');
    setLicenseState(currentOrg.license_state ?? '');
    setPrimaryMarketCity(currentOrg.primary_market_city ?? '');
    setPrimaryMarketState(currentOrg.primary_market_state ?? '');

    setError(null);
  }, [currentOrg]);

  return {
    currentStep,
    primaryUseCase,
    organizationName,
    brokerageName,
    licenseState,
    primaryMarketCity,
    primaryMarketState,
    isLoading: isLoading || orgLoading,
    error,
    setPrimaryUseCase,
    setOrganizationName,
    setBrokerageName,
    setLicenseState,
    setPrimaryMarketCity,
    setPrimaryMarketState,
    goToStep,
    nextStep,
    previousStep,
    saveStep1,
    saveStep2,
    completeOnboarding,
    resumeFromStep,
  };
}
