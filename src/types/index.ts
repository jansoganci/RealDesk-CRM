import type { Database } from './database.types';

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

export type Deal = Database['public']['Tables']['deals']['Row'];
export type DealInsert = Database['public']['Tables']['deals']['Insert'];
export type DealUpdate = Database['public']['Tables']['deals']['Update'];

export type OfferNegotiation = Database['public']['Tables']['offer_negotiations']['Row'];
export type OfferNegotiationInsert = Database['public']['Tables']['offer_negotiations']['Insert'];
export type OfferNegotiationUpdate = Database['public']['Tables']['offer_negotiations']['Update'];

export type OfferRound = Database['public']['Tables']['offer_rounds']['Row'];
export type OfferRoundInsert = Database['public']['Tables']['offer_rounds']['Insert'];
export type OfferRoundUpdate = Database['public']['Tables']['offer_rounds']['Update'];

export type OfferContingency = Database['public']['Tables']['offer_contingencies']['Row'];
export type OfferContingencyInsert = Database['public']['Tables']['offer_contingencies']['Insert'];
export type OfferContingencyUpdate = Database['public']['Tables']['offer_contingencies']['Update'];

type DealMilestoneRow = Database['public']['Tables']['deal_milestones']['Row'];

export interface DealMilestone extends DealMilestoneRow {
  alert_sent_7d?: boolean;
  alert_sent_3d?: boolean;
  alert_sent_1d?: boolean;
  alert_sent_today?: boolean;
  last_nudge_sent_at?: string | null;
  document_required?: boolean;
  document_path?: string | null;
  document_uploaded_at?: string | null;
}
export type DealMilestoneInsert = Database['public']['Tables']['deal_milestones']['Insert'];
export type DealMilestoneUpdate = Database['public']['Tables']['deal_milestones']['Update'];

export type DealParty = Database['public']['Tables']['deal_parties']['Row'];
export type DealPartyInsert = Database['public']['Tables']['deal_parties']['Insert'];
export type DealPartyUpdate = Database['public']['Tables']['deal_parties']['Update'];

export type DealAmendment = Database['public']['Tables']['deal_amendments']['Row'];
export type DealAmendmentInsert = Database['public']['Tables']['deal_amendments']['Insert'];
export type DealAmendmentUpdate = Database['public']['Tables']['deal_amendments']['Update'];

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

// Sprint 3 — deal / offer enums (validated in DB CHECK + Zod in T4)
export type DealType = 'sale' | 'rental';
export type DealClientRole = 'buyer' | 'seller' | 'dual';
export type DealStage =
  | 'offer_prep'
  | 'submitted'
  | 'negotiating'
  | 'verbal_accepted'
  | 'mutual_acceptance'
  | 'under_contract'
  | 'pending'
  | 'closing_scheduled'
  | 'closed_won'
  | 'fell_through';
export type DealFinancingType =
  | 'cash'
  | 'conventional'
  | 'fha'
  | 'va'
  | 'usda'
  | 'seller_financing'
  | 'other';
export type DealPreapprovalStatus = 'not_started' | 'in_progress' | 'approved' | 'denied';
export type OfferNegotiationStatus = 'active' | 'accepted' | 'rejected' | 'withdrawn';
export type OfferRoundStatus =
  | 'draft'
  | 'submitted'
  | 'verbal_accepted'
  | 'mutual_acceptance'
  | 'rejected'
  | 'expired'
  | 'withdrawn';
export type OfferedBy = 'buyer' | 'seller';
export type ContingencyStatus =
  | 'proposed'
  | 'active'
  | 'satisfied'
  | 'waived'
  | 'expired'
  | 'failed';
export type MilestoneStatus = 'pending' | 'in_progress' | 'complete' | 'overdue' | 'waived';
export type NotificationAlertType =
  | 'overdue'
  | 'due_today'
  | 'due_3d'
  | 'due_7d'
  | 'waiting_on_others'
  | 'closing_soon'
  | 'prerequisite_missing';
export type BuyerAgentAgreementStatus =
  | 'draft'
  | 'sent'
  | 'signed'
  | 'active'
  | 'expired'
  | 'terminated';
export type ShowingLogFeedback = 'loved' | 'interested' | 'pass';

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
  sold_at: string | null;
  sold_price: number | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;
  offer_date: string | null;
  offer_amount: number | null;
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

export interface Notification {
  id: string;
  org_id: string;
  user_id: string;
  deal_id: string | null;
  milestone_id: string | null;
  alert_type: NotificationAlertType;
  title: string;
  body: string;
  action_url: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  snoozed_until: string | null;
  created_at: string;
}

export interface DealHealthCard {
  dealId: string;
  dealName: string;
  propertyAddress: string;
  closingDate: string | null;
  closingCountdownDays: number | null;
  phase: 1 | 2 | 3 | 4;
  nextMilestoneTitle: string | null;
  nextMilestoneDueDate: string | null;
  overdueCount: number;
}

export interface DailyBriefMilestoneItem {
  milestoneId: string;
  dealId: string;
  dealName: string;
  propertyAddress: string;
  milestoneTitle: string;
  dueDate: string;
  responsibleParty: string | null;
  daysUntilDue: number;
}

export interface WaitingOnOthersItem extends DailyBriefMilestoneItem {
  counterpartyName: string | null;
  lastNudgeSentAt: string | null;
}

export interface DailyBriefData {
  overdue: DailyBriefMilestoneItem[];
  dueToday: DailyBriefMilestoneItem[];
  due3Days: DailyBriefMilestoneItem[];
  due7Days: DailyBriefMilestoneItem[];
  waitingOnOthers: WaitingOnOthersItem[];
  dealHealthCards: DealHealthCard[];
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

export type ShowingLog = Database['public']['Tables']['showing_logs']['Row'] & {
  feedback_enum?: ShowingLogFeedback;
};

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
  deal_id?: string | null;
  contract_id?: string | null;
  type: CommissionType;
  amount: number;
  currency: string;
  property_address: string;
  commission_side?: 'listing' | 'buyer' | 'dual' | 'rental_listing' | 'rental_tenant' | null;
  commission_type?: 'percentage' | 'flat_fee' | null;
  commission_rate?: number | null;
  sale_price?: number | null;
  gross_commission?: number | null;
  referral_fee_pct?: number | null;
  referral_fee_amount?: number | null;
  referral_to?: string | null;
  post_referral_gci?: number | null;
  broker_split_pct?: number | null;
  broker_dollar?: number | null;
  capped_at_close?: boolean | null;
  franchise_fee_amount?: number | null;
  transaction_fee?: number | null;
  eo_fee?: number | null;
  tc_fee?: number | null;
  other_fees?: number | null;
  net_commission?: number | null;
  closing_date?: string | null;
  notes?: string | null;
  created_at: string;
  user_id: string;
  org_id?: string;
  deleted_at?: string | null;
}

export interface CommissionInsert {
  property_id: string;
  deal_id?: string | null;
  contract_id?: string | null;
  type: CommissionType;
  amount: number;
  currency?: string;
  property_address: string;
  commission_side?: 'listing' | 'buyer' | 'dual' | 'rental_listing' | 'rental_tenant' | null;
  commission_type?: 'percentage' | 'flat_fee' | null;
  commission_rate?: number | null;
  sale_price?: number | null;
  gross_commission?: number | null;
  referral_fee_pct?: number | null;
  referral_fee_amount?: number | null;
  referral_to?: string | null;
  post_referral_gci?: number | null;
  broker_split_pct?: number | null;
  broker_dollar?: number | null;
  capped_at_close?: boolean | null;
  franchise_fee_amount?: number | null;
  transaction_fee?: number | null;
  eo_fee?: number | null;
  tc_fee?: number | null;
  other_fees?: number | null;
  net_commission?: number | null;
  closing_date?: string | null;
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

export interface BrokerSettings {
  broker_model: 'split_with_cap' | 'traditional_split' | 'flat_fee_100pct';
  broker_split_pct: number;
  annual_cap_amount: number | null;
  cap_anniversary_date: string | null;
  franchise_fee_enabled: boolean;
  franchise_fee_pct: number | null;
  franchise_fee_cap: number | null;
  default_transaction_fee: number;
  eo_fee_type: 'per_deal' | 'monthly' | 'annual_excluded';
  eo_fee_amount: number;
  default_tc_fee: number;
  default_rental_commission_type: 'one_month' | 'annual_pct' | 'flat_fee';
  default_rental_commission_rate: number | null;
  default_rental_flat_fee: number | null;
}

export interface CommissionCalculationResult {
  dealGCI: number;
  referralFeeAmount: number;
  postReferralGCI: number;
  brokerDollar: number;
  franchiseFee: number;
  transactionFee: number;
  eoFee: number;
  tcFee: number;
  otherFees: number;
  netCommission: number;
  cappedAtClose: boolean;
}

export interface YTDSummary {
  total_gci: number;
  total_net: number;
  deal_count: number;
  sales_gci: number;
  rental_gci: number;
  sales_net: number;
  rental_net: number;
  avg_net_per_deal: number;
  best_month: {
    month: number;
    gci: number;
    net: number;
    deal_count: number;
  } | null;
  best_deal: {
    commission_id: string;
    deal_id: string | null;
    property_address: string;
    net_commission: number;
  } | null;
  ytd_company_dollar: number;
}

export interface CapProgress {
  ytd_company_dollar: number;
  cap_amount: number | null;
  pct_to_cap: number;
  is_capped: boolean;
  remaining_to_cap: number | null;
  deals_to_cap_estimate: number | null;
  gci_to_cap_estimate: number | null;
  cap_reset_date: string | null;
  days_to_reset: number | null;
  cap_history: Array<{
    commission_id: string;
    closing_date: string | null;
    property_address: string;
    company_dollar: number;
    cumulative_company_dollar: number;
    triggered_cap: boolean;
  }>;
  royalty_ytd: number;
  royalty_cap: number | null;
}

export interface ForecastResult {
  committed_this_month_gross: number;
  committed_this_month_net: number;
  weighted_90_days_gross: number;
  weighted_90_days_net: number;
  active_deals_count: number;
}

// Contract Management types
export * from './contract.types';

// Cookie Consent types
export * from './cookieConsent';

// Organization types
export * from './org';
