import { useState, useCallback, useEffect } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { onboardingService, userPreferencesService } from '@/lib/serviceProxy';
import { onboardingService } from '../services/onboarding.service';
import { organizationService } from '@/lib/serviceProxy';
import { getAuthenticatedUserId } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { toast } from 'sonner';
import type { AgentProfileInput } from '../services/onboarding.service';

const logger = createLogger('OnboardingHook');

export type PrimaryUseCase = 'rentals' | 'sales' | 'both' | 'exploring';
export type TeamSize = '1' | '2-5' | '6-20';
export type CurrencyCode = 'USD';

type LegacyPrimaryUseCase = 'properties' | 'clients' | 'contracts' | 'team' | 'all';
type LegacyTeamSize = TeamSize | '21+';

export interface AgentProfileFormData extends AgentProfileInput {
  currency: CurrencyCode;
}

function normalizePrimaryUseCase(value: string | null | undefined): PrimaryUseCase | null {
  if (!value) return null;

  if (value === 'rentals' || value === 'sales' || value === 'both' || value === 'exploring') {
    return value;
  }

  const legacyValue = value as LegacyPrimaryUseCase;
  switch (legacyValue) {
    case 'properties':
      return 'rentals';
    case 'clients':
    case 'contracts':
      return 'sales';
    case 'team':
    case 'all':
      return 'both';
    default:
      return null;
  }
}

function normalizeTeamSize(value: string | null | undefined): TeamSize | null {
  if (!value) return null;

  const normalized = value as LegacyTeamSize;
  if (normalized === '1' || normalized === '2-5' || normalized === '6-20') {
    return normalized;
  }

  if (normalized === '21+') {
    return '6-20';
  }

  return null;

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
  teamSize: TeamSize | null;
  currency: CurrencyCode;
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
  saveStep2: (profile: AgentProfileFormData) => Promise<void>;
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
  const [teamSize, setTeamSize] = useState<TeamSize | null>(null);
  const [currency] = useState<CurrencyCode>('USD');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing data if available
  // Try loading from user_onboarding_responses first, fallback to organizations table
  useEffect(() => {
    const loadOnboardingData = async () => {
      if (!currentOrg?.id) return;

      try {
        // Try to load from user_onboarding_responses first (new source)
        const responses = (await onboardingService.getResponses(currentOrg.id)) as Record<string, unknown>;

        // Load primary_use_case from new table, fallback to old table
        const responsePrimaryUseCase =
          typeof responses.primary_use_case === 'string' ? responses.primary_use_case : null;
        const resolvedPrimaryUseCase = normalizePrimaryUseCase(
          responsePrimaryUseCase ?? currentOrg?.primary_use_case
        );
        if (resolvedPrimaryUseCase) {
          setPrimaryUseCase(resolvedPrimaryUseCase);
        }

        // Load team_size from new table, fallback to old table
        const responseTeamSize = typeof responses.team_size === 'string' ? responses.team_size : null;
        const resolvedTeamSize = normalizeTeamSize(responseTeamSize ?? currentOrg?.team_size_range);
        if (resolvedTeamSize) {
          setTeamSize(resolvedTeamSize);
        }

        // Organization name always comes from organizations table (not a survey response)
        if (currentOrg?.name) {
          setOrganizationName(currentOrg.name);
        }

        setBrokerageName(
          typeof responses.brokerage_name === 'string'
            ? responses.brokerage_name
            : currentOrg?.brokerage_name ?? ''
        );
        setLicenseState(
          typeof responses.license_state === 'string'
            ? responses.license_state
            : currentOrg?.license_state ?? ''
        );
        setPrimaryMarketCity(
          typeof responses.primary_market_city === 'string'
            ? responses.primary_market_city
            : currentOrg?.primary_market_city ?? ''
        );
        setPrimaryMarketState(
          typeof responses.primary_market_state === 'string'
            ? responses.primary_market_state
            : currentOrg?.primary_market_state ?? ''
        );
        setBrokerageName(currentOrg?.brokerage_name ?? '');
        setLicenseState(currentOrg?.license_state ?? '');
        setPrimaryMarketCity(currentOrg?.primary_market_city ?? '');
        setPrimaryMarketState(currentOrg?.primary_market_state ?? '');
      } catch (err) {
        // If new table fails, fall back to old table (graceful degradation)
        logger.warn('Failed to load from user_onboarding_responses, using fallback:', err);

        // Fallback to organizations table
        const resolvedPrimaryUseCase = normalizePrimaryUseCase(currentOrg?.primary_use_case);
        if (resolvedPrimaryUseCase) {
          setPrimaryUseCase(resolvedPrimaryUseCase);
        }
        if (currentOrg?.name) {
          setOrganizationName(currentOrg.name);
        }
        const resolvedTeamSize = normalizeTeamSize(currentOrg?.team_size_range);
        if (resolvedTeamSize) {
          setTeamSize(resolvedTeamSize);
        }
        setBrokerageName(currentOrg?.brokerage_name ?? '');
        setLicenseState(currentOrg?.license_state ?? '');
        setPrimaryMarketCity(currentOrg?.primary_market_city ?? '');
        setPrimaryMarketState(currentOrg?.primary_market_state ?? '');
      }
    };

    loadOnboardingData();
  }, [
    currentOrg?.id,
    currentOrg?.primary_use_case,
    currentOrg?.name,
    currentOrg?.team_size_range,
    currentOrg?.brokerage_name,
    currentOrg?.license_state,
    currentOrg?.primary_market_city,
    currentOrg?.primary_market_state,
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

  const saveStep2 = useCallback(async (profile: AgentProfileFormData) => {
  const saveStep2 = useCallback(async (profile: OnboardingOrganizationProfile) => {
    if (!currentOrg?.id) {
      setError('Organization not found');
      return;
    }

    const cleanedOrganizationName = profile.organizationName.trim();
    const cleanedBrokerageName = profile.brokerageName.trim();
    const cleanedLicenseState = profile.licenseState.trim().toUpperCase();
    const cleanedPrimaryMarketCity = profile.primaryMarketCity.trim();
    const cleanedPrimaryMarketState = profile.primaryMarketState.trim().toUpperCase();

    if (!cleanedOrganizationName || cleanedOrganizationName.length < 2) {
    if (!profile.organizationName || profile.organizationName.trim().length < 2) {
      setError('Organization name must be at least 2 characters');
      return;
    }

    if (cleanedOrganizationName.length > 255) {
    if (profile.organizationName.length > 255) {
      setError('Organization name must not exceed 255 characters');
      return;
    }

    if (!profile.teamSize) {
      setError('Please select team size');
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

      // 1. Save agent profile and team setup
      await onboardingService.saveAgentProfile(currentOrg.id, {
        organizationName: cleanedOrganizationName,
        teamSize: profile.teamSize,
        brokerageName: cleanedBrokerageName,
        licenseState: cleanedLicenseState,
        primaryMarketCity: cleanedPrimaryMarketCity,
        primaryMarketState: cleanedPrimaryMarketState,
      });

      // 2. Save preferences (USD only)
      await userPreferencesService.updatePreferences({
        language: 'en',
        currency: 'USD',
      });

      setOrganizationName(cleanedOrganizationName);
      setTeamSize(profile.teamSize);
      setBrokerageName(cleanedBrokerageName);
      setLicenseState(cleanedLicenseState);
      setPrimaryMarketCity(cleanedPrimaryMarketCity);
      setPrimaryMarketState(cleanedPrimaryMarketState);
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
        'agent_profile',
        'completed',
        {
          organization_name: cleanedOrganizationName,
          team_size: profile.teamSize,
          brokerage_name: cleanedBrokerageName || null,
          license_state: cleanedLicenseState,
          primary_market_city: cleanedPrimaryMarketCity,
          primary_market_state: cleanedPrimaryMarketState,
          language: 'en',
          currency: 'USD',
        }
      );

      // 4. Move to next step
      nextStep();
          organization_name: trimmedProfile.organizationName,
          brokerage_name: trimmedProfile.brokerageName,
          license_state: trimmedProfile.licenseState,
          primary_market_city: trimmedProfile.primaryMarketCity,
          primary_market_state: trimmedProfile.primaryMarketState,
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save agent profile';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg?.id, nextStep]);
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
      const responses = (await onboardingService.getResponses(currentOrg.id)) as Record<string, unknown>;

      // Load primary_use_case from new table, fallback to old table
      const responsePrimaryUseCase =
        typeof responses.primary_use_case === 'string' ? responses.primary_use_case : null;
      const resolvedPrimaryUseCase = normalizePrimaryUseCase(
        responsePrimaryUseCase ?? currentOrg.primary_use_case
      );
      if (resolvedPrimaryUseCase) {
        setPrimaryUseCase(resolvedPrimaryUseCase);
      }

      // Load team_size from new table, fallback to old table
      const responseTeamSize = typeof responses.team_size === 'string' ? responses.team_size : null;
      const resolvedTeamSize = normalizeTeamSize(responseTeamSize ?? currentOrg.team_size_range);
      if (resolvedTeamSize) {
        setTeamSize(resolvedTeamSize);
      }
      setBrokerageName(
        typeof responses.brokerage_name === 'string'
          ? responses.brokerage_name
          : currentOrg.brokerage_name ?? ''
      );
      setLicenseState(
        typeof responses.license_state === 'string'
          ? responses.license_state
          : currentOrg.license_state ?? ''
      );
      setPrimaryMarketCity(
        typeof responses.primary_market_city === 'string'
          ? responses.primary_market_city
          : currentOrg.primary_market_city ?? ''
      );
      setPrimaryMarketState(
        typeof responses.primary_market_state === 'string'
          ? responses.primary_market_state
          : currentOrg.primary_market_state ?? ''
      );
    } catch (err) {
      // If new table fails, fall back to old table (graceful degradation)
      logger.warn('Failed to load from user_onboarding_responses in resume, using fallback:', err);

      // Fallback to organizations table
      const resolvedPrimaryUseCase = normalizePrimaryUseCase(currentOrg.primary_use_case);
      if (resolvedPrimaryUseCase) {
        setPrimaryUseCase(resolvedPrimaryUseCase);
      }
      const resolvedTeamSize = normalizeTeamSize(currentOrg.team_size_range);
      if (resolvedTeamSize) {
        setTeamSize(resolvedTeamSize);
      }
      setBrokerageName(currentOrg.brokerage_name ?? '');
      setLicenseState(currentOrg.license_state ?? '');
      setPrimaryMarketCity(currentOrg.primary_market_city ?? '');
      setPrimaryMarketState(currentOrg.primary_market_state ?? '');
    }

    // Organization name always comes from organizations table
    if (currentOrg.name) {
      setOrganizationName(currentOrg.name);
    }
    setBrokerageName(currentOrg.brokerage_name ?? '');
    setLicenseState(currentOrg.license_state ?? '');
    setPrimaryMarketCity(currentOrg.primary_market_city ?? '');
    setPrimaryMarketState(currentOrg.primary_market_state ?? '');

    // Currency is USD only for US onboarding flow
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
    teamSize,
    currency,
    isLoading: isLoading || orgLoading,
    error,
    setPrimaryUseCase,
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
