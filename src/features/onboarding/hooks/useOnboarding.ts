import { useState, useCallback, useEffect } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { onboardingService } from '../services/onboarding.service';
import { organizationService } from '@/services/organization.service';
import { userPreferencesService } from '@/services/userPreferences.service';
import { getAuthenticatedUserId } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { toast } from 'sonner';

const logger = createLogger('OnboardingHook');

export type PrimaryUseCase = 'properties' | 'clients' | 'contracts' | 'team' | 'all';
export type TeamSize = '1' | '2-5' | '6-20' | '21+';

interface UseOnboardingReturn {
  // State
  currentStep: number;
  primaryUseCase: PrimaryUseCase | null;
  organizationName: string;
  teamSize: TeamSize | null;
  language: 'tr' | 'en';
  currency: 'TRY' | 'USD' | 'EUR';
  isLoading: boolean;
  error: string | null;

  // Actions
  setPrimaryUseCase: (useCase: PrimaryUseCase) => void;
  setOrganizationName: (name: string) => void;
  setTeamSize: (size: TeamSize) => void;
  setLanguage: (lang: 'tr' | 'en') => void;
  setCurrency: (curr: 'TRY' | 'USD' | 'EUR') => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;

  // Save methods
  saveStep1: () => Promise<void>;
  saveStep2: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resumeFromStep: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
  const { currentOrg, loading: orgLoading } = useOrg();
  const [currentStep, setCurrentStep] = useState(1);
  const [primaryUseCase, setPrimaryUseCase] = useState<PrimaryUseCase | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [teamSize, setTeamSize] = useState<TeamSize | null>(null);
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [currency, setCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

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

        // Load team_size from new table, fallback to old table
        if (responses.team_size) {
          setTeamSize(responses.team_size as TeamSize);
        } else if (currentOrg?.team_size_range) {
          // Fallback to organizations table (backward compatibility)
          setTeamSize(currentOrg.team_size_range as TeamSize);
        }

        // Organization name always comes from organizations table (not a survey response)
        if (currentOrg?.name) {
          setOrganizationName(currentOrg.name);
        }
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
        if (currentOrg?.team_size_range) {
          setTeamSize(currentOrg.team_size_range as TeamSize);
        }
      }
    };

    loadOnboardingData();
  }, [currentOrg?.id, currentOrg?.primary_use_case, currentOrg?.name, currentOrg?.team_size_range]);

  // Load user preferences (language/currency)
  useEffect(() => {
    const loadPreferences = async () => {
      if (preferencesLoaded) return;
      
      try {
        const prefs = await userPreferencesService.getPreferences();
        setLanguage(prefs.language as 'tr' | 'en');
        setCurrency(prefs.currency as 'TRY' | 'USD' | 'EUR');
        setPreferencesLoaded(true);
      } catch (err) {
        // Use defaults if preferences can't be loaded
        logger.warn('Failed to load preferences, using defaults');
        setPreferencesLoaded(true);
      }
    };

    if (!preferencesLoaded) {
      loadPreferences();
    }
  }, [preferencesLoaded]);

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

  const saveStep2 = useCallback(async () => {
    if (!currentOrg?.id) {
      setError('Organization not found');
      return;
    }

    if (!organizationName || organizationName.trim().length < 2) {
      setError('Organization name must be at least 2 characters');
      return;
    }

    if (organizationName.length > 255) {
      setError('Organization name must not exceed 255 characters');
      return;
    }

    if (!teamSize) {
      setError('Please select team size');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userId = await getAuthenticatedUserId();

      // 1. Update organization name
      await organizationService.updateName(currentOrg.id, organizationName.trim());

      // 2. Save team size
      await onboardingService.saveTeamSize(currentOrg.id, teamSize);

      // 3. Save preferences (always, even if defaults)
      await userPreferencesService.updatePreferences({
        language,
        currency,
      });

      // 4. Track event
      await onboardingService.trackEvent(
        currentOrg.id,
        userId,
        2,
        'organization_setup',
        'completed',
        {
          organization_name: organizationName.trim(),
          team_size: teamSize,
          language,
          currency,
        }
      );

      // 5. Move to next step
      nextStep();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save organization setup';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg?.id, organizationName, teamSize, language, currency, nextStep]);

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

      // Load team_size from new table, fallback to old table
      if (responses.team_size) {
        setTeamSize(responses.team_size as TeamSize);
      } else if (currentOrg.team_size_range) {
        setTeamSize(currentOrg.team_size_range as TeamSize);
      }
    } catch (err) {
      // If new table fails, fall back to old table (graceful degradation)
      logger.warn('Failed to load from user_onboarding_responses in resume, using fallback:', err);
      
      // Fallback to organizations table
      if (currentOrg.primary_use_case) {
        setPrimaryUseCase(currentOrg.primary_use_case as PrimaryUseCase);
      }
      if (currentOrg.team_size_range) {
        setTeamSize(currentOrg.team_size_range as TeamSize);
      }
    }

    // Organization name always comes from organizations table
    if (currentOrg.name) {
      setOrganizationName(currentOrg.name);
    }

    // Language/currency will be loaded from user_preferences via existing useEffect
    setError(null);
  }, [currentOrg]);

  return {
    currentStep,
    primaryUseCase,
    organizationName,
    teamSize,
    language,
    currency,
    isLoading: isLoading || orgLoading,
    error,
    setPrimaryUseCase,
    setOrganizationName,
    setTeamSize,
    setLanguage,
    setCurrency,
    goToStep,
    nextStep,
    previousStep,
    saveStep1,
    saveStep2,
    completeOnboarding,
    resumeFromStep,
  };
}

