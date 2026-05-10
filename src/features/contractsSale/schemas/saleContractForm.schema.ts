/**
 * Sale Contract Form Schema
 * Zod validation schema for sale contract form
 */

import { z } from 'zod';

export const saleContractFormSchema = z.object({
  // Agent info
  agent_name: z.string().min(1, 'Araci adi zorunlu'),

  // Seller info
  seller_name: z.string().min(1, 'Satici adi zorunlu'),
  seller_tc: z.string().min(11, 'TC 11 haneli olmali').max(11, 'TC 11 haneli olmali'),
  seller_phone: z.string().optional().or(z.literal('')),
  seller_email: z.string().optional().or(z.literal('')),
  seller_address: z.string().optional().or(z.literal('')),

  // Buyer info
  buyer_name: z.string().min(1, 'Alici adi zorunlu'),
  buyer_tc: z.string().min(11, 'TC 11 haneli olmali').max(11, 'TC 11 haneli olmali'),
  buyer_phone: z.string().optional().or(z.literal('')),
  buyer_email: z.string().optional().or(z.literal('')),
  buyer_address: z.string().optional().or(z.literal('')),

  // Property info
  property_address: z.string().optional().or(z.literal('')),
  province_district: z.string().min(1, 'Il/Ilce zorunlu'),
  neighborhood: z.string().min(1, 'Mahalle zorunlu'),
  ada_no: z.string().optional().or(z.literal('')),
  parsel_no: z.string().optional().or(z.literal('')),
  parcel_info: z.string().optional().or(z.literal('')),
  title_deed_no: z.string().optional().or(z.literal('')),
  square_meters: z.number().optional(),

  // Sale terms
  sale_price: z.number().min(1, 'Satis bedeli zorunlu'),
  currency: z.literal('USD').default('USD'),
  payment_method: z.enum(['cash', 'bank_transfer', 'installment', 'mortgage']).default('bank_transfer'),
  deposit_amount: z.number().optional(),
  closing_date: z.string().optional().or(z.literal('')),

  // Additional
  title: z.string().optional().or(z.literal('')),
  special_conditions: z.string().optional().or(z.literal('')),
});

export type SaleContractFormData = z.infer<typeof saleContractFormSchema>;
