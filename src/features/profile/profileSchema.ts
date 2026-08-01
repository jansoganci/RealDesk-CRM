import { z } from 'zod';
import type { TFunction } from 'i18next';

export const getProfileSchema = (t: TFunction) => {
  return z.object({
    full_name: z.string()
      .min(2, { message: t('profile.validation.fullNameMin', 'Name must be at least 2 characters') })
      .max(255, { message: t('profile.validation.fullNameMax', 'Name must not exceed 255 characters') })
      .optional()
      .or(z.literal('')),
    phone_number: z.string()
      .regex(/^[\d\s\-+()]+$/, {
        message: t('profile.validation.phoneInvalid', 'Invalid phone number format')
      })
      .min(7, { message: t('profile.validation.phoneMin', 'Phone number must be at least 7 characters') })
      .max(20, { message: t('profile.validation.phoneMax', 'Phone number must not exceed 20 characters') })
      .optional()
      .or(z.literal('')),
    language: z.literal('en'),
    currency: z.literal('USD', {
      required_error: t('profile.validation.currencyRequired', 'Currency is required'),
    }),
    meeting_reminder_minutes: z.number({
      required_error: t('profile.validation.reminderRequired', 'Meeting reminder is required'),
    }).refine(
      (val) => [30, 60, 90].includes(val),
      {
        message: t('profile.validation.reminderInvalid', 'Invalid reminder time'),
      }
    ),
    commission_rate: z.number({
      required_error: t('profile.validation.commissionRateRequired', 'Commission rate is required'),
    }).min(0.1, {
      message: t('profile.validation.commissionRateMin', 'Commission rate must be at least 0.1%'),
    }).max(20, {
      message: t('profile.validation.commissionRateMax', 'Commission rate must not exceed 20%'),
    }),
  });
};
