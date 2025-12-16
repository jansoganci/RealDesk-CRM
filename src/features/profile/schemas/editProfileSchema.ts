import * as z from 'zod';

export const getEmailChangeSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t('editProfile.errors.invalidEmail')),
  });

export const getPasswordChangeSchema = (t: (key: string) => string) =>
  z
    .object({
      currentPassword: z.string().min(1, t('editProfile.errors.currentPasswordRequired')),
      newPassword: z
        .string()
        .min(8, t('editProfile.errors.passwordMinLength'))
        .regex(/[A-Z]/, t('editProfile.errors.passwordUppercase'))
        .regex(/[a-z]/, t('editProfile.errors.passwordLowercase'))
        .regex(/[0-9]/, t('editProfile.errors.passwordNumber')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('editProfile.errors.passwordMismatch'),
      path: ['confirmPassword'],
    });

export type EmailChangeFormData = z.infer<ReturnType<typeof getEmailChangeSchema>>;
export type PasswordChangeFormData = z.infer<ReturnType<typeof getPasswordChangeSchema>>;
