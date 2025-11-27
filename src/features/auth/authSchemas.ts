import * as z from 'zod';
import { TFunction } from 'i18next';

/**
 * Password schema with complexity requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const getPasswordSchema = (t: TFunction) =>
  z
    .string()
    .min(8, t('validation.passwordMinLength'))
    .regex(/[A-Z]/, t('validation.passwordUppercase'))
    .regex(/[a-z]/, t('validation.passwordLowercase'))
    .regex(/[0-9]/, t('validation.passwordNumber'));

/**
 * Login form schema - simpler validation (just check not empty)
 */
export const getLoginSchema = (t: TFunction) =>
  z.object({
    email: z.string().min(1, t('validation.emailRequired')).email(t('validation.invalidEmail')),
    password: z.string().min(1, t('validation.passwordRequired')),
  });

export type LoginFormData = z.infer<ReturnType<typeof getLoginSchema>>;

/**
 * Register form schema - full password complexity validation + terms acceptance
 */
export const getRegisterSchema = (t: TFunction) =>
  z
    .object({
      email: z.string().min(1, t('validation.emailRequired')).email(t('validation.invalidEmail')),
      password: getPasswordSchema(t),
      confirmPassword: z.string().min(1, t('validation.confirmPasswordRequired')),
      acceptTerms: z.boolean().refine((val) => val === true, {
        message: t('validation.termsRequired'),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });

export type RegisterFormData = z.infer<ReturnType<typeof getRegisterSchema>>;

/**
 * Forgot password form schema - email only
 */
export const getForgotPasswordSchema = (t: TFunction) =>
  z.object({
    email: z.string().min(1, t('validation.emailRequired')).email(t('validation.invalidEmail')),
  });

export type ForgotPasswordFormData = z.infer<ReturnType<typeof getForgotPasswordSchema>>;

/**
 * Reset password form schema - new password with complexity + confirmation
 */
export const getResetPasswordSchema = (t: TFunction) =>
  z
    .object({
      password: getPasswordSchema(t),
      confirmPassword: z.string().min(1, t('validation.confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });

export type ResetPasswordFormData = z.infer<ReturnType<typeof getResetPasswordSchema>>;
