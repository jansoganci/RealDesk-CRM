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

export type PropertyStatus = 'Empty' | 'Occupied' | 'Inactive';
export type ContractStatus = 'Active' | 'Archived' | 'Inactive';
export type InquiryStatus = 'active' | 'matched' | 'contacted' | 'closed';

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
