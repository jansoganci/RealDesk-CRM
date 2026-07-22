/**
 * Sale Contract Form Schema
 * Zod validation schema for sale contract form
 */

import { z } from 'zod';

export const saleContractFormSchema = z.object({
  // Agent info
  agent_name: z.string().min(1, 'Agent name is required'),

  // Seller info
  seller_name: z.string().min(1, 'Seller name is required'),
  seller_tc: z.string().min(11, 'Seller tax ID must be 11 characters').max(11, 'Seller tax ID must be 11 characters'),
  seller_phone: z.string().optional().or(z.literal('')),
  seller_email: z.string().optional().or(z.literal('')),
  seller_address: z.string().optional().or(z.literal('')),

  // Buyer info
  buyer_name: z.string().min(1, 'Buyer name is required'),
  buyer_tc: z.string().min(11, 'Buyer tax ID must be 11 characters').max(11, 'Buyer tax ID must be 11 characters'),
  buyer_phone: z.string().optional().or(z.literal('')),
  buyer_email: z.string().optional().or(z.literal('')),
  buyer_address: z.string().optional().or(z.literal('')),

  // Property info
  property_address: z.string().optional().or(z.literal('')),
  province_district: z.string().min(1, 'City/county is required'),
  neighborhood: z.string().min(1, 'Neighborhood is required'),
  ada_no: z.string().optional().or(z.literal('')),
  parsel_no: z.string().optional().or(z.literal('')),
  parcel_info: z.string().optional().or(z.literal('')),
  title_deed_no: z.string().optional().or(z.literal('')),
  square_meters: z.number().optional(),

  // Sale terms
  sale_price: z.number().min(1, 'Sale price is required'),
  currency: z.literal('USD').default('USD'),
  payment_method: z.enum(['cash', 'bank_transfer', 'installment', 'mortgage']).default('bank_transfer'),
  deposit_amount: z.number().optional(),
  closing_date: z.string().optional().or(z.literal('')),

  // Additional
  title: z.string().optional().or(z.literal('')),
  special_conditions: z.string().optional().or(z.literal('')),
});

export type SaleContractFormData = z.infer<typeof saleContractFormSchema>;
