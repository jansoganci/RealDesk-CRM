import * as z from 'zod';
import type { TFunction } from 'i18next';
import {
  isValidAccountNumber,
  isValidRoutingNumber,
  isValidTaxId,
} from '@/lib/serviceProxy';

export const getOwnerSchema = (t: TFunction) => {
  return z
    .object({
      name: z.string().min(1, t('validations.nameRequired')),
      email: z.string().email(t('validations.invalidEmail')),
      phone: z.string().min(1, t('validations.phoneRequired')),
      address: z.string().optional(),
      notes: z.string().optional(),
      routing_number: z.string().optional(),
      account_number: z.string().optional(),
      tax_id: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      const r = data.routing_number?.trim();
      if (r) {
        const digits = r.replace(/\D/g, '');
        if (!isValidRoutingNumber(digits)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validations.invalidRouting'),
            path: ['routing_number'],
          });
        }
      }
      const a = data.account_number?.trim();
      if (a && !isValidAccountNumber(a)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validations.invalidAccount'),
          path: ['account_number'],
        });
      }
      const taxId = data.tax_id?.trim();
      if (taxId && !isValidTaxId(taxId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validations.invalidTaxId'),
          path: ['tax_id'],
        });
      }
    });
};
