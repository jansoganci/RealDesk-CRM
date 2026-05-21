import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { getProfileSchema } from '../profileSchema';
import type { UseFormReturn } from 'react-hook-form';
import type * as z from 'zod';

/**
 * Profile Form Hook
 * Handles form initialization, default values, and normalization functions
 */

type ProfileFormData = z.infer<ReturnType<typeof getProfileSchema>>;

interface UseProfileFormReturn {
  form: UseFormReturn<ProfileFormData>;
  normalizeLanguage: (_lang?: string | null | undefined) => ProfileFormData['language'];
  normalizeCurrency: (value: string | null | undefined) => ProfileFormData['currency'];
}

/**
 * Hook for managing profile form
 * Initializes form with schema, default values, and provides normalization functions
 */
export function useProfileForm(): UseProfileFormReturn {
  const { t } = useTranslation(['profile', 'common']);

  const profileSchema = getProfileSchema(t);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone_number: '',
      language: 'en',
      currency: 'USD',
      meeting_reminder_minutes: 30,
      commission_rate: 4.0,
    },
  });

  const normalizeLanguage = useCallback((_lang?: string | null | undefined): ProfileFormData['language'] => 'en', []);

  const normalizeCurrency = useCallback(
    (_value: string | null | undefined): ProfileFormData['currency'] => 'USD',
    []
  );

  return {
    form,
    normalizeLanguage,
    normalizeCurrency,
  };
}
