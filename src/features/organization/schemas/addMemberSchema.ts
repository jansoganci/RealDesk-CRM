import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Schema for adding a new team member
 */
export const createAddMemberSchema = (t: TFunction) => {
  return z.object({
    email: z
      .string()
      .min(1, { message: t('team:validation.emailRequired') })
      .email({ message: t('team:validation.emailInvalid') })
      .transform((val) => val.toLowerCase().trim()),
    role: z.enum(['owner', 'member'], {
      required_error: t('team:validation.roleRequired'),
    }),
  });
};

export type AddMemberFormData = z.infer<ReturnType<typeof createAddMemberSchema>>;

/**
 * Schema for changing member role
 */
export const createChangeRoleSchema = (t: TFunction) => {
  return z.object({
    role: z.enum(['owner', 'member'], {
      required_error: t('team:validation.roleRequired'),
    }),
  });
};

export type ChangeRoleFormData = z.infer<ReturnType<typeof createChangeRoleSchema>>;
