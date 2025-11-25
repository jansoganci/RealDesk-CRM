import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { userPreferencesService } from '../../../lib/serviceProxy';
import type { UseFormReturn } from 'react-hook-form';
import type * as z from 'zod';
import type { getProfileSchema } from '../profileSchema';

/**
 * Profile Data Hook
 * Handles loading and saving user profile preferences, managing loading state and success feedback
 */

type ProfileFormData = z.infer<ReturnType<typeof getProfileSchema>>;

interface UseProfileDataOptions {
  form: UseFormReturn<ProfileFormData>;
  normalizeLanguage: (lang: string | null | undefined) => ProfileFormData['language'];
  normalizeCurrency: (value: string | null | undefined) => ProfileFormData['currency'];
}

interface UseProfileDataReturn {
  loading: boolean;
  saveSuccess: boolean;
  handleSubmit: (data: ProfileFormData) => Promise<void>;
  loadPreferences: () => Promise<void>;
}

/**
 * Hook for managing profile data operations
 * Handles loading preferences, saving preferences, and success/error states
 */
export function useProfileData({
  form,
  normalizeLanguage,
  normalizeCurrency,
}: UseProfileDataOptions): UseProfileDataReturn {
  const { t } = useTranslation(['profile', 'common']);
  const { user, setLanguage, setCurrency } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const prefs = await userPreferencesService.getPreferences();
      form.reset({
        full_name: prefs.full_name || '',
        phone_number: prefs.phone_number || '',
        language: normalizeLanguage(prefs.language),
        currency: normalizeCurrency(prefs.currency),
        meeting_reminder_minutes: prefs.meeting_reminder_minutes || 30,
        commission_rate: prefs.commission_rate || 4.0,
      });
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error(t('profile:messages.loadError'));
    }
  }, [user, form, normalizeLanguage, normalizeCurrency, t]);

  const handleSubmit = useCallback(
    async (data: ProfileFormData) => {
      setLoading(true);
      setSaveSuccess(false);

      try {
        await userPreferencesService.updatePreferences({
          full_name: data.full_name || null,
          phone_number: data.phone_number || null,
          language: data.language,
          currency: data.currency,
          meeting_reminder_minutes: data.meeting_reminder_minutes,
          commission_rate: data.commission_rate,
        });

        await setLanguage(data.language);
        await setCurrency(data.currency);

        toast.success(t('profile:messages.saveSuccess'));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error) {
        console.error('Profile update failed:', error);
        toast.error(t('profile:messages.saveError'));
      } finally {
        setLoading(false);
      }
    },
    [setLanguage, setCurrency, t]
  );

  return {
    loading,
    saveSuccess,
    handleSubmit,
    loadPreferences,
  };
}

