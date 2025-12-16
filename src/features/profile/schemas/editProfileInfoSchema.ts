import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Schema factory for profile info editing
 * Creates a Zod schema with i18n-aware error messages
 */
export const getEditProfileInfoSchema = (t: TFunction) => {
  return z.object({
    full_name: z
      .string()
      .min(2, { message: t('profile:validation.fullNameMin') })
      .max(255, { message: t('profile:validation.fullNameMax') })
      .optional()
      .or(z.literal('')),
    phone_number: z
      .string()
      .regex(/^[\d\s\-\+\(\)]*$/, {
        message: t('profile:validation.phoneInvalid'),
      })
      .max(20, { message: t('profile:validation.phoneMax') })
      .optional()
      .nullable()
      .or(z.literal('')),
    language: z.enum(['en', 'tr'], {
      required_error: t('profile:validation.languageRequired'),
    }),
    currency: z.enum(['USD', 'TRY', 'EUR'], {
      required_error: t('profile:validation.currencyRequired'),
    }),
    meeting_reminder_minutes: z
      .number({
        required_error: t('profile:validation.reminderRequired'),
      })
      .int()
      .refine((val) => [30, 60, 90].includes(val), {
        message: t('profile:validation.reminderInvalid'),
      }),
    commission_rate: z
      .number({
        required_error: t('profile:validation.commissionRateRequired'),
      })
      .min(0.1, {
        message: t('profile:validation.commissionRateMin'),
      })
      .max(20, {
        message: t('profile:validation.commissionRateMax'),
      }),
  });
};

export type EditProfileInfoFormData = z.infer<
  ReturnType<typeof getEditProfileInfoSchema>
>;
