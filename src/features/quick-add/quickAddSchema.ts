import { z } from 'zod';
import type { TFunction } from 'i18next';
import { US_STATE_CODES } from '@/features/leads/schemas/lead-form';

export const getQuickAddSchema = (t: TFunction) => {
  return z
    .object({
      ownerMode: z.enum(['select', 'create']),
      owner_id: z.string().optional(),
      ownerName: z.string().optional(),
      ownerPhone: z.string().optional(),
      ownerEmail: z
        .string()
        .email({ message: t('quick-add:validation.invalidEmail') })
        .optional()
        .or(z.literal('')),
      address: z.string().min(3, { message: t('quick-add:validation.addressMin') }),
      city: z.string().optional(),
      state: z.string().optional(),
      zip_code: z.string().optional(),
      property_type: z.enum(['rental', 'sale'], {
        required_error: t('quick-add:validation.propertyTypeRequired'),
      }),
      status: z.string().min(1, { message: t('quick-add:validation.statusRequired') }),
      rent_amount: z.number().optional(),
      sale_price: z.number().optional(),
      currency: z.literal('USD').default('USD'),
      listing_url: z.string().optional(),
      notes: z.string().optional(),
      addTenant: z.boolean().default(false),
      tenantName: z.string().optional(),
      tenantPhone: z.string().optional(),
      tenantEmail: z
        .string()
        .email({ message: t('quick-add:validation.invalidEmail') })
        .optional()
        .or(z.literal('')),
      contractStart: z.date().optional(),
      contractEnd: z.date().optional(),
      contractRent: z.number().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.ownerMode === 'select' && !data.owner_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('quick-add:validation.ownerRequired'),
          path: ['owner_id'],
        });
      }
      if (data.ownerMode === 'create' && (!data.ownerName || data.ownerName.length < 2)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('quick-add:validation.ownerNameMin'),
          path: ['ownerName'],
        });
      }

      const st = data.state?.trim() ?? '';
      if (st.length > 0) {
        const upper = st.toUpperCase();
        if (upper.length !== 2 || !(US_STATE_CODES as readonly string[]).includes(upper)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('quick-add:validation.invalidState'),
            path: ['state'],
          });
        }
      }

      const zc = data.zip_code?.trim() ?? '';
      if (zc.length > 0 && !/^\d{5}(-\d{4})?$/.test(zc)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('quick-add:validation.invalidZip'),
          path: ['zip_code'],
        });
      }

      if (data.property_type === 'rental') {
        if (!data.rent_amount || data.rent_amount <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('quick-add:validation.rentAmountRequired'),
            path: ['rent_amount'],
          });
        }
      }
      if (data.property_type === 'sale') {
        if (!data.sale_price || data.sale_price <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('quick-add:validation.salePriceRequired'),
            path: ['sale_price'],
          });
        }
      }

      if (data.addTenant) {
        if (!data.tenantName || data.tenantName.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('quick-add:validation.tenantNameMin'),
            path: ['tenantName'],
          });
        }
        if (!data.contractStart) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('quick-add:validation.contractStartRequired'),
            path: ['contractStart'],
          });
        }
        if (!data.contractEnd) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('quick-add:validation.contractEndRequired'),
            path: ['contractEnd'],
          });
        }
        if (data.contractStart && data.contractEnd && data.contractEnd <= data.contractStart) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('quick-add:validation.contractEndAfterStart'),
            path: ['contractEnd'],
          });
        }
      }
    });
};

export type QuickAddFormData = z.infer<ReturnType<typeof getQuickAddSchema>>;
