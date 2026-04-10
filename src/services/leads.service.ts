import { supabase } from '@/config/supabase';
import type { Database } from '@/types/database.types';
import type {
  PropertyInquiry,
  PropertyInquiryInsert,
  PropertyInquiryUpdate,
  InquiryMatchInsert,
  InquiryWithMatches,
  InquiryMatchWithProperty,
  Property,
  BuyerAgentAgreementStatus,
} from '@/types';
import { insertRow, updateRow } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import { getActiveOrgId, softDelete } from '@/lib/orgHelpers';
import { handleServiceError } from '@/lib/handleServiceError';
import { addDaysToDate, formatDateForDb, getToday } from '@/lib/dates';

export type Lead = Database['public']['Tables']['property_inquiries']['Row'];
export type LeadInsert = Database['public']['Tables']['property_inquiries']['Insert'];
export type LeadUpdate = Database['public']['Tables']['property_inquiries']['Update'];

export type BuyerAgentAgreement = Database['public']['Tables']['buyer_agent_agreements']['Row'];
export type BuyerAgentAgreementInsert = Database['public']['Tables']['buyer_agent_agreements']['Insert'];
export type BuyerAgentAgreementUpdate = Database['public']['Tables']['buyer_agent_agreements']['Update'];

export type ShowingLog = Database['public']['Tables']['showing_logs']['Row'] & {
  feedback_enum?: ShowingFeedback | null;
};
export type ShowingLogInsert = Database['public']['Tables']['showing_logs']['Insert'];
export type ShowingLogUpdate = Database['public']['Tables']['showing_logs']['Update'];

/** Canonical pipeline + legacy statuses stored in `property_inquiries.status`. */
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'active'
  | 'matched'
  | 'under_contract'
  | 'closed_won'
  | 'closed_lost'
  | 'converted';

export type LeadSource =
  | 'zillow'
  | 'realtor_com'
  | 'referral'
  | 'sign_call'
  | 'social_media'
  | 'cold_call'
  | 'open_house'
  | 'other';

export type AgreementStatus = BuyerAgentAgreementStatus;

export type InterestLevel = 'high' | 'medium' | 'low' | 'none';
export type ShowingFeedback = 'loved' | 'interested' | 'pass';

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  inquiry_type: 'rental' | 'sale';
  status?: LeadStatus;
  lead_source?: LeadSource;
  preferred_city?: string;
  preferred_state?: string;
  min_rent_budget?: number;
  max_rent_budget?: number;
  min_sale_budget?: number;
  max_sale_budget?: number;
  pre_approved?: boolean;
  notes?: string;
}

export interface CreateAgreementInput {
  lead_id: string;
  signed_date: Date;
  expiration_date: Date;
  commission_rate?: number;
  commission_type: 'percentage' | 'flat_fee' | 'tiered';
  flat_fee_amount?: number;
  pdf_url?: string;
  status?: BuyerAgentAgreementStatus;
}

export interface CreateShowingLogInput {
  lead_id: string;
  property_id: string;
  showing_date: Date;
  duration_minutes?: number;
  feedback: ShowingFeedback;
  feedback_enum?: ShowingFeedback;
  interest_level?: InterestLevel;
}

export interface LeadWithRelations extends Lead {
  buyer_agent_agreement?: BuyerAgentAgreement;
  showing_logs: ShowingLog[];
  property_matches?: Array<{ property_id: string }>;
}

/** Column order for Kanban / `getLeadsPipeline` grouping. */
export const LEAD_PIPELINE_COLUMNS: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'active',
  'matched',
  'under_contract',
  'closed_won',
  'closed_lost',
  'converted',
];

function emptyPipeline(): Record<LeadStatus, Lead[]> {
  const initial: Record<string, Lead[]> = {};
  for (const key of LEAD_PIPELINE_COLUMNS) {
    initial[key] = [];
  }
  return initial as Record<LeadStatus, Lead[]>;
}

/**
 * Maps DB `status` to a Kanban column. Legacy `closed` is grouped under `closed_lost`.
 */
function mapDbStatusToPipelineColumn(status: string): LeadStatus {
  if (status === 'closed') return 'closed_lost';
  if (LEAD_PIPELINE_COLUMNS.includes(status as LeadStatus)) {
    return status as LeadStatus;
  }
  return 'new';
}

export class LeadsService {
  /**
   * Asserts the caller’s active org matches `orgId` (prevents cross-tenant calls).
   */
  private async assertOrgMatchesActive(orgId: string): Promise<void> {
    const active = await getActiveOrgId();
    if (active !== orgId) {
      throw new Error('Organization mismatch.');
    }
  }

  /**
   * Ensures the passed `userId` is the authenticated user (for explicit audit-style APIs).
   */
  private async assertUserMatches(userId: string): Promise<void> {
    const uid = await getAuthenticatedUserId();
    if (uid !== userId) {
      throw new Error('User mismatch.');
    }
  }

  private mapFeedbackToInterestLevel(feedback: ShowingFeedback): InterestLevel {
    if (feedback === 'loved') return 'high';
    if (feedback === 'interested') return 'medium';
    return 'low';
  }

  // ---------------------------------------------------------------------------
  // Existing inquiry APIs (unchanged behavior)
  // ---------------------------------------------------------------------------

  /** Returns all non-deleted inquiries for the active org. */
  async getAll(): Promise<PropertyInquiry[]> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('property_inquiries')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as PropertyInquiry[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch inquiries');
    }
  }

  /** Rental inquiries only. */
  async getRentalInquiries(): Promise<PropertyInquiry[]> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('property_inquiries')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .eq('inquiry_type', 'rental')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as PropertyInquiry[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch rental inquiries');
    }
  }

  /** Sale inquiries only. */
  async getSaleInquiries(): Promise<PropertyInquiry[]> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('property_inquiries')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .eq('inquiry_type', 'sale')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as PropertyInquiry[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch sale inquiries');
    }
  }

  /** Single inquiry with property matches. */
  async getById(id: string): Promise<InquiryWithMatches | null> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('property_inquiries')
        .select('*')
        .eq('id', id)
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      const matches = await this.getMatchesByInquiry(id);

      return {
        ...data,
        matches,
      } as InquiryWithMatches;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch inquiry');
    }
  }

  /** Creates an inquiry for the current user and org. */
  async create(inquiry: Omit<PropertyInquiryInsert, 'user_id' | 'org_id'>): Promise<PropertyInquiry> {
    try {
      const userId = await getAuthenticatedUserId();
      const orgId = await getActiveOrgId();

      return insertRow('property_inquiries', {
        ...inquiry,
        status: inquiry.status ?? 'new',
        user_id: userId,
        org_id: orgId,
      });
    } catch (error) {
      throw handleServiceError(error, 'Failed to create inquiry');
    }
  }

  /** Updates an inquiry row. */
  async update(id: string, inquiry: PropertyInquiryUpdate): Promise<PropertyInquiry> {
    try {
      return updateRow('property_inquiries', id, inquiry);
    } catch (error) {
      throw handleServiceError(error, 'Failed to update inquiry');
    }
  }

  /** Soft-deletes an inquiry. */
  async delete(id: string): Promise<void> {
    try {
      await softDelete('property_inquiries', id);
    } catch (error) {
      throw handleServiceError(error, 'Failed to delete inquiry');
    }
  }

  /** Re-runs matching when a new property is created (non-blocking on failure). */
  async checkMatchesForNewProperty(propertyId: string): Promise<void> {
    try {
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propertyError) throw propertyError;
      if (!property) return;

      const activeInquiries = await this.getActiveInquiries();

      const matchedInquiryIds = await this.matchInquiryToProperty(property as Property, activeInquiries);

      for (const inquiryId of matchedInquiryIds) {
        await this.createMatch(inquiryId, propertyId);
      }
    } catch (error) {
      console.error('Error in checkMatchesForNewProperty:', error);
    }
  }

  /** Same as {@link checkMatchesForNewProperty}. */
  async checkMatchesForPropertyUpdate(propertyId: string): Promise<void> {
    await this.checkMatchesForNewProperty(propertyId);
  }

  private async matchInquiryToProperty(
    property: Property,
    activeInquiries: PropertyInquiry[]
  ): Promise<string[]> {
    const typeMatchedInquiries = activeInquiries.filter(
      (inquiry) => inquiry.inquiry_type === property.property_type
    );

    if (property.property_type === 'rental' && property.status !== 'Empty') {
      return [];
    }
    if (property.property_type === 'sale' && property.status !== 'Available') {
      return [];
    }

    const matchedInquiryIds: string[] = [];

    for (const inquiry of typeMatchedInquiries) {
      let matches = true;

      if (inquiry.preferred_city) {
        if (!property.city) {
          matches = false;
          continue;
        }
        if (
          inquiry.preferred_city.toLowerCase().trim() !== property.city.toLowerCase().trim()
        ) {
          matches = false;
          continue;
        }
      }

      if (inquiry.preferred_district) {
        if (!property.district) {
          matches = false;
          continue;
        }
        if (
          inquiry.preferred_district.toLowerCase().trim() !==
          property.district.toLowerCase().trim()
        ) {
          matches = false;
          continue;
        }
      }

      if (property.property_type === 'rental') {
        const minBudget = inquiry.min_rent_budget;
        const maxBudget = inquiry.max_rent_budget;

        if (minBudget || maxBudget) {
          const propertyRent = property.rent_amount;
          if (!propertyRent) {
            matches = false;
            continue;
          }
          if (minBudget && propertyRent < minBudget) {
            matches = false;
            continue;
          }
          if (maxBudget && propertyRent > maxBudget) {
            matches = false;
            continue;
          }
        }
      } else if (property.property_type === 'sale') {
        const minBudget = inquiry.min_sale_budget;
        const maxBudget = inquiry.max_sale_budget;

        if (minBudget || maxBudget) {
          const propertySalePrice = property.sale_price;
          if (!propertySalePrice) {
            matches = false;
            continue;
          }
          if (minBudget && propertySalePrice < minBudget) {
            matches = false;
            continue;
          }
          if (maxBudget && propertySalePrice > maxBudget) {
            matches = false;
            continue;
          }
        }
      }

      if (matches) {
        matchedInquiryIds.push(inquiry.id);
      }
    }

    return matchedInquiryIds;
  }

  private async createMatch(inquiryId: string, propertyId: string): Promise<void> {
    try {
      const { data: existingMatch } = await supabase
        .from('inquiry_matches')
        .select('id')
        .eq('inquiry_id', inquiryId)
        .eq('property_id', propertyId)
        .maybeSingle();

      if (existingMatch) return;

      const userId = await getAuthenticatedUserId();
      const orgId = await getActiveOrgId();

      const matchData: InquiryMatchInsert = {
        inquiry_id: inquiryId,
        property_id: propertyId,
        notification_sent: false,
        contacted: false,
        user_id: userId,
        org_id: orgId,
      };

      await insertRow('inquiry_matches', matchData);

      await this.update(inquiryId, { status: 'matched' });
    } catch (error) {
      console.error('Error creating match:', error);
    }
  }

  /** Marks inquiry as contacted and flags matched properties as contacted. */
  async markAsContacted(inquiryId: string): Promise<void> {
    try {
      await this.update(inquiryId, { status: 'contacted' });

      const { error } = await supabase
        .from('inquiry_matches')
        .update({ contacted: true })
        .eq('inquiry_id', inquiryId);

      if (error) throw error;
    } catch (error) {
      throw handleServiceError(error, 'Failed to mark inquiry as contacted');
    }
  }

  async markNotificationSent(matchId: string): Promise<void> {
    try {
      await updateRow('inquiry_matches', matchId, { notification_sent: true });
    } catch (error) {
      throw handleServiceError(error, 'Failed to mark notification sent');
    }
  }

  /** Inquiry counts by status and type (legacy `closed` included). */
  async getStats() {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('property_inquiries')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null);

      if (error) throw error;

      const inquiries = (data || []).map((i) => ({
        status: i.status,
        inquiry_type: i.inquiry_type,
      })) as Array<{ status: string; inquiry_type: string }>;

      const stats = {
        total: inquiries.length || 0,
        active: inquiries.filter((i) => i.status === 'active').length || 0,
        matched: inquiries.filter((i) => i.status === 'matched').length || 0,
        contacted: inquiries.filter((i) => i.status === 'contacted').length || 0,
        closed: inquiries.filter((i) => i.status === 'closed').length || 0,
        rental: {
          total: inquiries.filter((i) => i.inquiry_type === 'rental').length || 0,
          active:
            inquiries.filter((i) => i.inquiry_type === 'rental' && i.status === 'active').length ||
            0,
          matched:
            inquiries.filter((i) => i.inquiry_type === 'rental' && i.status === 'matched').length ||
            0,
          contacted:
            inquiries.filter((i) => i.inquiry_type === 'rental' && i.status === 'contacted')
              .length || 0,
          closed:
            inquiries.filter((i) => i.inquiry_type === 'rental' && i.status === 'closed').length ||
            0,
        },
        sale: {
          total: inquiries.filter((i) => i.inquiry_type === 'sale').length || 0,
          active:
            inquiries.filter((i) => i.inquiry_type === 'sale' && i.status === 'active').length || 0,
          matched:
            inquiries.filter((i) => i.inquiry_type === 'sale' && i.status === 'matched').length || 0,
          contacted:
            inquiries.filter((i) => i.inquiry_type === 'sale' && i.status === 'contacted').length ||
            0,
          closed:
            inquiries.filter((i) => i.inquiry_type === 'sale' && i.status === 'closed').length || 0,
        },
      };

      return stats;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch inquiry stats');
    }
  }

  /** Inquiries currently in `active` status (optionally filtered by inquiry type). */
  async getActiveInquiries(type?: 'rental' | 'sale'): Promise<PropertyInquiry[]> {
    try {
      const orgId = await getActiveOrgId();

      let query = supabase
        .from('property_inquiries')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .eq('status', 'active');

      if (type) {
        query = query.eq('inquiry_type', type);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as PropertyInquiry[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch active inquiries');
    }
  }

  /** Count of inquiry matches where notification was not sent yet. */
  async getUnreadMatchesCount(): Promise<number> {
    try {
      const orgId = await getActiveOrgId();

      const { count, error } = await supabase
        .from('inquiry_matches')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .eq('notification_sent', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch unread matches count');
    }
  }

  /** Matches for one inquiry, with property summary. */
  async getMatchesByInquiry(inquiryId: string): Promise<InquiryMatchWithProperty[]> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('inquiry_matches')
        .select(`
        *,
        property:properties(id, address, city, district, status, property_type, rent_amount, sale_price, currency)
      `)
        .eq('inquiry_id', inquiryId)
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('matched_at', { ascending: false });

      if (error) throw error;

      return (data || []) as unknown as InquiryMatchWithProperty[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch inquiry matches');
    }
  }

  // ---------------------------------------------------------------------------
  // Lead pipeline
  // ---------------------------------------------------------------------------

  /** Lists leads for an org filtered by pipeline status. */
  async getLeadsByStatus(orgId: string, status: LeadStatus): Promise<Lead[]> {
    try {
      await this.assertOrgMatchesActive(orgId);

      const { data, error } = await supabase
        .from('property_inquiries')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as Lead[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch leads by status');
    }
  }

  /** All non-deleted leads for the org, grouped by Kanban column. */
  async getLeadsPipeline(orgId: string): Promise<Record<LeadStatus, Lead[]>> {
    try {
      await this.assertOrgMatchesActive(orgId);

      const { data, error } = await supabase
        .from('property_inquiries')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pipeline = emptyPipeline();

      for (const row of data || []) {
        const lead = row as Lead;
        const column = mapDbStatusToPipelineColumn(lead.status);
        pipeline[column].push(lead);
      }

      return pipeline;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch lead pipeline');
    }
  }

  /**
   * Updates lead status, scoped to the owning user row (`user_id`) and active org.
   */
  async updateLeadStatus(leadId: string, newStatus: LeadStatus, userId: string): Promise<Lead> {
    try {
      await this.assertUserMatches(userId);
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('property_inquiries')
        .update({ status: newStatus })
        .eq('id', leadId)
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .select()
        .single();

      if (error) throw error;

      return data as Lead;
    } catch (error) {
      throw handleServiceError(error, 'Failed to update lead status');
    }
  }

  /** Creates a lead with default `new` status. */
  async createLead(data: CreateLeadInput, userId: string, orgId: string): Promise<Lead> {
    try {
      await this.assertUserMatches(userId);
      await this.assertOrgMatchesActive(orgId);

      const insert: LeadInsert = {
        name: data.name,
        phone: data.phone,
        email: data.email ?? null,
        inquiry_type: data.inquiry_type,
        lead_source: data.lead_source ?? null,
        preferred_city: data.preferred_city ?? null,
        preferred_state: data.preferred_state ?? null,
        min_rent_budget: data.min_rent_budget ?? null,
        max_rent_budget: data.max_rent_budget ?? null,
        min_sale_budget: data.min_sale_budget ?? null,
        max_sale_budget: data.max_sale_budget ?? null,
        pre_approved: data.pre_approved ?? null,
        notes: data.notes ?? null,
        status: data.status ?? 'new',
        user_id: userId,
        org_id: orgId,
      };

      return insertRow('property_inquiries', insert);
    } catch (error) {
      throw handleServiceError(error, 'Failed to create lead');
    }
  }

  /**
   * Lead with buyer agreement (latest), showings, and property match ids.
   */
  async getLeadWithDetails(leadId: string): Promise<LeadWithRelations> {
    try {
      const orgId = await getActiveOrgId();

      const { data: lead, error: leadError } = await supabase
        .from('property_inquiries')
        .select('*')
        .eq('id', leadId)
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .maybeSingle();

      if (leadError) throw leadError;
      if (!lead) {
        throw new Error('Lead not found');
      }

      const [agreementRes, showingsRes, matchesRes] = await Promise.all([
        supabase
          .from('buyer_agent_agreements')
          .select('*')
          .eq('lead_id', leadId)
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('showing_logs')
          .select('*')
          .eq('lead_id', leadId)
          .eq('org_id', orgId)
          .order('showing_date', { ascending: false }),
        supabase
          .from('inquiry_matches')
          .select('property_id')
          .eq('inquiry_id', leadId)
          .eq('org_id', orgId)
          .is('deleted_at', null),
      ]);

      if (agreementRes.error) throw agreementRes.error;
      if (showingsRes.error) throw showingsRes.error;
      if (matchesRes.error) throw matchesRes.error;

      const agreement = agreementRes.data?.[0] ?? null;

      return {
        ...(lead as Lead),
        buyer_agent_agreement: agreement ?? undefined,
        showing_logs: (showingsRes.data || []) as ShowingLog[],
        property_matches: (matchesRes.data || []) as Array<{ property_id: string }>,
      };
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch lead details');
    }
  }

  // ---------------------------------------------------------------------------
  // Source tracking
  // ---------------------------------------------------------------------------

  /** Leads filtered by `lead_source`. */
  async getLeadsBySource(orgId: string, source: LeadSource): Promise<Lead[]> {
    try {
      await this.assertOrgMatchesActive(orgId);

      const { data, error } = await supabase
        .from('property_inquiries')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .eq('lead_source', source)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as Lead[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch leads by source');
    }
  }

  /** Aggregated lead counts per source, optionally within a created_at window. */
  async getSourceBreakdown(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ source: LeadSource; count: number }>> {
    try {
      await this.assertOrgMatchesActive(orgId);

      let query = supabase
        .from('property_inquiries')
        .select('lead_source')
        .eq('org_id', orgId)
        .is('deleted_at', null);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const counts: Partial<Record<LeadSource, number>> = {};

      for (const row of data || []) {
        const src = row.lead_source as LeadSource | null;
        if (!src) continue;
        counts[src] = (counts[src] || 0) + 1;
      }

      return (Object.entries(counts) as Array<[LeadSource, number]>).map(([source, count]) => ({
        source,
        count,
      }));
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch lead source breakdown');
    }
  }

  // ---------------------------------------------------------------------------
  // Buyer–agent agreements
  // ---------------------------------------------------------------------------

  /** Inserts a buyer–agent agreement for a lead. */
  async createBuyerAgentAgreement(
    data: CreateAgreementInput,
    userId: string,
    orgId: string
  ): Promise<BuyerAgentAgreement> {
    try {
      await this.assertUserMatches(userId);
      await this.assertOrgMatchesActive(orgId);

      const insert = {
        lead_id: data.lead_id,
        user_id: userId,
        org_id: orgId,
        signed_date: formatDateForDb(data.signed_date),
        expiration_date: formatDateForDb(data.expiration_date),
        commission_rate: data.commission_rate ?? null,
        commission_type: data.commission_type,
        flat_fee_amount: data.flat_fee_amount ?? null,
        pdf_url: data.pdf_url ?? null,
        status: data.status ?? 'draft',
      };

      return insertRow('buyer_agent_agreements', insert as unknown as BuyerAgentAgreementInsert);
    } catch (error) {
      throw handleServiceError(error, 'Failed to create buyer-agent agreement');
    }
  }

  /** Latest agreement for a lead (if any). */
  async getAgreementByLeadId(leadId: string): Promise<BuyerAgentAgreement | null> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('buyer_agent_agreements')
        .select('*')
        .eq('lead_id', leadId)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      return data?.[0] ?? null;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch buyer-agent agreement');
    }
  }

  /**
   * Active agreements whose expiration is between today and today + `daysThreshold`.
   */
  async getExpiringAgreements(
    orgId: string,
    daysThreshold: number = 30
  ): Promise<BuyerAgentAgreement[]> {
    try {
      await this.assertOrgMatchesActive(orgId);

      const todayStart = getToday();
      const horizonEnd = addDaysToDate(todayStart, daysThreshold);
      const todayStr = formatDateForDb(todayStart);
      const horizonStr = formatDateForDb(horizonEnd);

      const { data, error } = await supabase
        .from('buyer_agent_agreements')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .gte('expiration_date', todayStr)
        .lte('expiration_date', horizonStr)
        .order('expiration_date', { ascending: true });

      if (error) throw error;

      return (data || []) as BuyerAgentAgreement[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch expiring agreements');
    }
  }

  async getExpiringSoon(daysThreshold: number = 14): Promise<BuyerAgentAgreement[]> {
    try {
      const orgId = await getActiveOrgId();
      const userId = await getAuthenticatedUserId();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + daysThreshold);

      const { data, error } = await supabase
        .from('buyer_agent_agreements')
        .select('*')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .lte('expiration_date', cutoff.toISOString().split('T')[0])
        .gte('expiration_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;
      return (data || []) as BuyerAgentAgreement[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch expiring-soon agreements');
    }
  }

  /** Updates agreement status (draft / sent / signed / active / expired / terminated). */
  async updateAgreementStatus(
    agreementId: string,
    status: AgreementStatus
  ): Promise<BuyerAgentAgreement> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('buyer_agent_agreements')
        .update({ status })
        .eq('id', agreementId)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) throw error;

      return data as BuyerAgentAgreement;
    } catch (error) {
      throw handleServiceError(error, 'Failed to update agreement status');
    }
  }

  // ---------------------------------------------------------------------------
  // Showing logs
  // ---------------------------------------------------------------------------

  /** Records a property showing for a lead. */
  async createShowingLog(
    data: CreateShowingLogInput,
    userId: string,
    orgId: string
  ): Promise<ShowingLog> {
    try {
      await this.assertUserMatches(userId);
      await this.assertOrgMatchesActive(orgId);

      const insert = {
        lead_id: data.lead_id,
        property_id: data.property_id,
        user_id: userId,
        org_id: orgId,
        showing_date: data.showing_date.toISOString(),
        duration_minutes: data.duration_minutes ?? null,
        feedback_enum: data.feedback_enum ?? data.feedback,
        interest_level: data.interest_level ?? this.mapFeedbackToInterestLevel(data.feedback),
      };

      const row = await insertRow('showing_logs', insert as unknown as ShowingLogInsert);
      return row as ShowingLog;
    } catch (error) {
      throw handleServiceError(error, 'Failed to create showing log');
    }
  }

  /** All showings for a lead. */
  async getShowingsByLeadId(leadId: string): Promise<ShowingLog[]> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('showing_logs')
        .select('*')
        .eq('lead_id', leadId)
        .eq('org_id', orgId)
        .order('showing_date', { ascending: false });

      if (error) throw error;

      return (data || []) as ShowingLog[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch showings for lead');
    }
  }

  /** All showings recorded for a property. */
  async getShowingsByPropertyId(propertyId: string): Promise<ShowingLog[]> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('showing_logs')
        .select('*')
        .eq('property_id', propertyId)
        .eq('org_id', orgId)
        .order('showing_date', { ascending: false });

      if (error) throw error;

      return (data || []) as ShowingLog[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch showings for property');
    }
  }

  /** Updates feedback and interest on a showing row. */
  async updateShowingFeedback(
    showingId: string,
    feedback: ShowingFeedback
  ): Promise<ShowingLog> {
    try {
      const orgId = await getActiveOrgId();

      const { data, error } = await supabase
        .from('showing_logs')
        .update({
          feedback_enum: feedback,
          interest_level: this.mapFeedbackToInterestLevel(feedback),
        })
        .eq('id', showingId)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) throw error;

      return data as ShowingLog;
    } catch (error) {
      throw handleServiceError(error, 'Failed to update showing feedback');
    }
  }

  // ---------------------------------------------------------------------------
  // Pipeline analytics
  // ---------------------------------------------------------------------------

  /** Conversion funnel metrics for reporting. */
  async getLeadConversionStats(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalLeads: number;
    qualified: number;
    underContract: number;
    closedWon: number;
    closedLost: number;
    conversionRate: number;
  }> {
    try {
      await this.assertOrgMatchesActive(orgId);

      let query = supabase
        .from('property_inquiries')
        .select('status')
        .eq('org_id', orgId)
        .is('deleted_at', null);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const rows = data || [];
      const totalLeads = rows.length;
      let qualified = 0;
      let underContract = 0;
      let closedWon = 0;
      let closedLost = 0;

      for (const row of rows) {
        switch (row.status) {
          case 'qualified':
            qualified += 1;
            break;
          case 'under_contract':
            underContract += 1;
            break;
          case 'closed_won':
            closedWon += 1;
            break;
          case 'closed_lost':
          case 'closed':
            closedLost += 1;
            break;
          default:
            break;
        }
      }

      const conversionRate = totalLeads > 0 ? closedWon / totalLeads : 0;

      return {
        totalLeads,
        qualified,
        underContract,
        closedWon,
        closedLost,
        conversionRate,
      };
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch lead conversion stats');
    }
  }
}

export const leadsService = new LeadsService();
