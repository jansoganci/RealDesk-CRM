/**
 * Sale Contract Form Schema
 * Zod validation schema for sale contract form
 */

import { z } from 'zod';

export const saleContractFormSchema = z.object({
  // Seller info
  seller_name: z.string().min(1, 'Satici adi zorunlu'),
  seller_tc: z.string().min(11, 'TC 11 haneli olmali').max(11, 'TC 11 haneli olmali'),
  seller_phone: z.string().min(10, 'Telefon numarasi zorunlu'),
  seller_email: z.string().email('Gecerli e-posta girin').optional().or(z.literal('')),
  seller_address: z.string().min(1, 'Adres zorunlu'),

  // Buyer info
  buyer_name: z.string().min(1, 'Alici adi zorunlu'),
  buyer_tc: z.string().min(11, 'TC 11 haneli olmali').max(11, 'TC 11 haneli olmali'),
  buyer_phone: z.string().min(10, 'Telefon numarasi zorunlu'),
  buyer_email: z.string().email('Gecerli e-posta girin').optional().or(z.literal('')),
  buyer_address: z.string().min(1, 'Adres zorunlu'),

  // Property info
  property_address: z.string().min(1, 'Tasinmaz adresi zorunlu'),
  title_deed_no: z.string().optional().or(z.literal('')),
  parcel_info: z.string().optional().or(z.literal('')),
  square_meters: z.number().optional(),

  // Sale terms
  sale_price: z.number().min(1, 'Satis bedeli zorunlu'),
  currency: z.enum(['TRY', 'USD', 'EUR']).default('TRY'),
  payment_method: z.enum(['cash', 'bank_transfer', 'installment', 'mortgage']).default('bank_transfer'),
  deposit_amount: z.number().optional(),
  closing_date: z.string().optional().or(z.literal('')),

  // Additional
  title: z.string().optional().or(z.literal('')),
  special_conditions: z.string().optional().or(z.literal('')),
});

export type SaleContractFormData = z.infer<typeof saleContractFormSchema>;
