import type { Database } from './database';

export type PropertyOwner = Database['public']['Tables']['property_owners']['Row'];
export type PropertyOwnerInsert = Database['public']['Tables']['property_owners']['Insert'];
export type PropertyOwnerUpdate = Database['public']['Tables']['property_owners']['Update'];

export type Property = Database['public']['Tables']['properties']['Row'];
export type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
export type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

export type PropertyPhoto = Database['public']['Tables']['property_photos']['Row'];
export type PropertyPhotoInsert = Database['public']['Tables']['property_photos']['Insert'];
export type PropertyPhotoUpdate = Database['public']['Tables']['property_photos']['Update'];

export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type TenantInsert = Database['public']['Tables']['tenants']['Insert'];
export type TenantUpdate = Database['public']['Tables']['tenants']['Update'];

export type Contract = Database['public']['Tables']['contracts']['Row'];
export type ContractInsert = Database['public']['Tables']['contracts']['Insert'];
export type ContractUpdate = Database['public']['Tables']['contracts']['Update'];

export type PropertyInquiry = Database['public']['Tables']['property_inquiries']['Row'];
export type PropertyInquiryInsert = Database['public']['Tables']['property_inquiries']['Insert'];
export type PropertyInquiryUpdate = Database['public']['Tables']['property_inquiries']['Update'];

export type InquiryMatch = Database['public']['Tables']['inquiry_matches']['Row'];
export type InquiryMatchInsert = Database['public']['Tables']['inquiry_matches']['Insert'];
export type InquiryMatchUpdate = Database['public']['Tables']['inquiry_matches']['Update'];

// Property type definitions
export type PropertyType = 'rental' | 'sale';
export type RentalPropertyStatus = 'Empty' | 'Occupied' | 'Inactive';
export type SalePropertyStatus = 'Available' | 'Under Offer' | 'Sold' | 'Inactive';
export type PropertyStatus = RentalPropertyStatus | SalePropertyStatus;

// Inquiry type definitions
export type InquiryType = 'rental' | 'sale';

// Other status types
export type ContractStatus = 'Active' | 'Archived' | 'Inactive';
export type InquiryStatus = 'active' | 'matched' | 'contacted' | 'closed';

// Type-specific property interfaces
export interface RentalProperty extends Omit<Property, 'property_type' | 'status'> {
  property_type: 'rental';
  status: RentalPropertyStatus;
  rent_amount: number;
  currency: string;
}

export interface SaleProperty extends Omit<Property, 'property_type' | 'status' | 'sold_at' | 'sold_price'> {
  property_type: 'sale';
  status: SalePropertyStatus;
  sale_price: number;
  currency: string;
  sold_at?: string | null;
  sold_price?: number | null;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  buyer_email?: string | null;
  offer_date?: string | null;
  offer_amount?: number | null;
}

export interface PropertyWithOwner extends Property {
  owner?: PropertyOwner;
  photos?: PropertyPhoto[];
  activeTenant?: Tenant;
  activeContract?: {
    id: string;
    rent_amount: number | null;
    currency: string | null;
    end_date: string;
    status: ContractStatus;
  };
}

export interface RentalPropertyWithOwner extends PropertyWithOwner {
  property_type: 'rental';
  status: RentalPropertyStatus;
}

export interface SalePropertyWithOwner extends PropertyWithOwner {
  property_type: 'sale';
  status: SalePropertyStatus;
}

export interface PropertyWithOwnerDetails extends Property {
  owner: PropertyOwner;
  photos?: PropertyPhoto[];
}

export interface TenantWithProperty extends Tenant {
  property?: Property;
}

export interface ContractWithDetails extends Contract {
  tenant?: Tenant;
  property?: Property;
}

export interface DashboardStats {
  totalProperties: number;
  emptyProperties: number;
  occupiedProperties: number;
  inactiveProperties: number;
  activeContracts: number;
  expiringContracts: number;
}

// Enhanced tenant dialog types
export interface TenantWithContractData {
  tenant: TenantInsert;
  contract: ContractInsert;
  pdfFile?: File;
}

export interface TenantWithContractResult {
  tenant: Tenant;
  contract: Contract;
}

// Type-specific inquiry interfaces
export interface RentalInquiry extends Omit<PropertyInquiry, 'inquiry_type'> {
  inquiry_type: 'rental';
  min_rent_budget: number | null;
  max_rent_budget: number | null;
}

export interface SaleInquiry extends Omit<PropertyInquiry, 'inquiry_type'> {
  inquiry_type: 'sale';
  min_sale_budget: number | null;
  max_sale_budget: number | null;
}

export interface InquiryWithMatches extends PropertyInquiry {
  matches?: InquiryMatchWithProperty[];
}

export interface InquiryMatchWithProperty extends InquiryMatch {
  property?: Property;
}

export type Meeting = Database['public']['Tables']['meetings']['Row'];
export type MeetingInsert = Database['public']['Tables']['meetings']['Insert'];
export type MeetingUpdate = Database['public']['Tables']['meetings']['Update'];

export interface MeetingWithRelations extends Meeting {
  tenant?: Tenant;
  property?: Property;
  owner?: PropertyOwner;
}

// Commission types for finance tracking
export type CommissionType = 'rental' | 'sale';

export interface Commission {
  id: string;
  property_id: string;
  contract_id?: string | null;
  type: CommissionType;
  amount: number;
  currency: string;
  property_address: string;
  notes?: string | null;
  created_at: string;
  user_id: string;
}

export interface CommissionInsert {
  property_id: string;
  contract_id?: string | null;
  type: CommissionType;
  amount: number;
  currency?: string;
  property_address: string;
  notes?: string | null;
  user_id: string;
}

export interface CommissionWithProperty extends Commission {
  property?: Property;
}

export interface CommissionStats {
  totalEarnings: number;
  rentalCommissions: number;
  saleCommissions: number;
  currency: string;
}

export interface PerformanceSummary {
  year: number;
  dealsCount: number;
  totalCommission: number;
  averagePerDeal: number;
  bestMonth: {
    month: number;
    monthName: string;
    amount: number;
  } | null;
  rentalPercentage: number;
  salePercentage: number;
  currency: string;
}

export interface MonthlyCommissionData {
  month: number;
  monthName: string;
  total: number;
  rental: number;
  sale: number;
}
