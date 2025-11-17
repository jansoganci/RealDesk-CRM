import { supabase } from '../config/supabase';
import type {
  PropertyInquiry,
  PropertyInquiryInsert,
  PropertyInquiryUpdate,
  InquiryMatchInsert,
  InquiryWithMatches,
  InquiryMatchWithProperty,
  Property,
} from '../types';
import { insertRow, updateRow } from '../lib/db';
import { getAuthenticatedUserId } from '../lib/auth';

class InquiriesService {
  async getAll(): Promise<PropertyInquiry[]> {
    const { data, error } = await supabase
      .from('property_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inquiries:', error);
      throw error;
    }

    return (data || []) as PropertyInquiry[];
  }

  async getRentalInquiries(): Promise<PropertyInquiry[]> {
    const { data, error } = await supabase
      .from('property_inquiries')
      .select('*')
      .eq('inquiry_type', 'rental')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rental inquiries:', error);
      throw error;
    }

    return (data || []) as PropertyInquiry[];
  }

  async getSaleInquiries(): Promise<PropertyInquiry[]> {
    const { data, error } = await supabase
      .from('property_inquiries')
      .select('*')
      .eq('inquiry_type', 'sale')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sale inquiries:', error);
      throw error;
    }

    return (data || []) as PropertyInquiry[];
  }

  async getById(id: string): Promise<InquiryWithMatches | null> {
    const { data, error } = await supabase
      .from('property_inquiries')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching inquiry:', error);
      throw error;
    }

    if (!data) return null;

    // Fetch matches for this inquiry
    const matches = await this.getMatchesByInquiry(id);

    return {
      ...data,
      matches,
    } as InquiryWithMatches;
  }

  async create(inquiry: PropertyInquiryInsert): Promise<PropertyInquiry> {
    // Get authenticated user ID with session fallback
    const userId = await getAuthenticatedUserId();

    // Inject user_id into inquiry data
    return insertRow('property_inquiries', {
      ...inquiry,
      user_id: userId,
    });
  }

  async update(id: string, inquiry: PropertyInquiryUpdate): Promise<PropertyInquiry> {
    return updateRow('property_inquiries', id, inquiry);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('property_inquiries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async checkMatchesForNewProperty(propertyId: string): Promise<void> {
    try {
      // Fetch the property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propertyError) throw propertyError;
      if (!property) return;

      // Fetch active inquiries
      const activeInquiries = await this.getActiveInquiries();

      // Run matching algorithm
      const matchedInquiryIds = await this.matchInquiryToProperty(
        property as Property,
        activeInquiries
      );

      // Create matches in database
      for (const inquiryId of matchedInquiryIds) {
        await this.createMatch(inquiryId, propertyId);
      }
    } catch (error) {
      console.error('Error in checkMatchesForNewProperty:', error);
      // Don't throw - matching should not block property creation
    }
  }

  async checkMatchesForPropertyUpdate(propertyId: string): Promise<void> {
    // Same logic as checkMatchesForNewProperty
    await this.checkMatchesForNewProperty(propertyId);
  }

  private async matchInquiryToProperty(
    property: Property,
    activeInquiries: PropertyInquiry[]
  ): Promise<string[]> {
    // Filter inquiries by property type first
    const typeMatchedInquiries = activeInquiries.filter(
      (inquiry: any) => inquiry.inquiry_type === property.property_type
    );

    // Status check - only match available properties
    if (property.property_type === 'rental' && property.status !== 'Empty') {
      return [];
    }
    if (property.property_type === 'sale' && property.status !== 'Available') {
      return [];
    }

    const matchedInquiryIds: string[] = [];

    for (const inquiry of typeMatchedInquiries) {
      let matches = true;

      // City match (exact, case-insensitive)
      if (inquiry.preferred_city) {
        if (!property.city) {
          matches = false;
          continue;
        }
        if (
          inquiry.preferred_city.toLowerCase().trim() !==
          property.city.toLowerCase().trim()
        ) {
          matches = false;
          continue;
        }
      }

      // District match (optional, if specified, exact)
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

      // Budget check based on property type
      if (property.property_type === 'rental') {
        // Rental budget logic
        const minBudget = (inquiry as any).min_rent_budget;
        const maxBudget = (inquiry as any).max_rent_budget;

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
        // Sale budget logic
        const minBudget = (inquiry as any).min_sale_budget;
        const maxBudget = (inquiry as any).max_sale_budget;

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
      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from('inquiry_matches')
        .select('id')
        .eq('inquiry_id', inquiryId)
        .eq('property_id', propertyId)
        .maybeSingle();

      if (existingMatch) return; // Match already exists

      // Get user ID to associate with match
      const userId = await getAuthenticatedUserId();

      // Create match
      const matchData: InquiryMatchInsert = {
        inquiry_id: inquiryId,
        property_id: propertyId,
        notification_sent: false,
        contacted: false,
        user_id: userId,
      };

      await insertRow('inquiry_matches', matchData);

      // Update inquiry status to 'matched'
      await this.update(inquiryId, { status: 'matched' });
    } catch (error) {
      console.error('Error creating match:', error);
    }
  }

  async markAsContacted(inquiryId: string): Promise<void> {
    // Update inquiry status to 'contacted'
    await this.update(inquiryId, { status: 'contacted' });

    // Mark all matches for this inquiry as contacted
    const { error } = await supabase
      .from('inquiry_matches')
      .update({ contacted: true })
      .eq('inquiry_id', inquiryId);

    if (error) throw error;
  }

  async markNotificationSent(matchId: string): Promise<void> {
    await updateRow('inquiry_matches', matchId, { notification_sent: true });
  }

  async getStats() {
    const { data, error } = await supabase
      .from('property_inquiries')
      .select('status, inquiry_type');

    if (error) throw error;

    const inquiries = (data || []) as Array<{ status: string; inquiry_type: string }>;

    const stats = {
      total: inquiries.length || 0,
      // Legacy stats (for backward compatibility)
      active: inquiries.filter((i) => i.status === 'active').length || 0,
      matched: inquiries.filter((i) => i.status === 'matched').length || 0,
      contacted: inquiries.filter((i) => i.status === 'contacted').length || 0,
      closed: inquiries.filter((i) => i.status === 'closed').length || 0,
      // Rental inquiry stats
      rental: {
        total: inquiries.filter((i) => i.inquiry_type === 'rental').length || 0,
        active: inquiries.filter((i) => i.inquiry_type === 'rental' && i.status === 'active').length || 0,
        matched: inquiries.filter((i) => i.inquiry_type === 'rental' && i.status === 'matched').length || 0,
        contacted: inquiries.filter((i) => i.inquiry_type === 'rental' && i.status === 'contacted').length || 0,
        closed: inquiries.filter((i) => i.inquiry_type === 'rental' && i.status === 'closed').length || 0,
      },
      // Sale inquiry stats
      sale: {
        total: inquiries.filter((i) => i.inquiry_type === 'sale').length || 0,
        active: inquiries.filter((i) => i.inquiry_type === 'sale' && i.status === 'active').length || 0,
        matched: inquiries.filter((i) => i.inquiry_type === 'sale' && i.status === 'matched').length || 0,
        contacted: inquiries.filter((i) => i.inquiry_type === 'sale' && i.status === 'contacted').length || 0,
        closed: inquiries.filter((i) => i.inquiry_type === 'sale' && i.status === 'closed').length || 0,
      },
    };

    return stats;
  }

  async getActiveInquiries(type?: 'rental' | 'sale'): Promise<PropertyInquiry[]> {
    let query = supabase
      .from('property_inquiries')
      .select('*')
      .eq('status', 'active');

    if (type) {
      query = query.eq('inquiry_type', type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as PropertyInquiry[];
  }

  async getUnreadMatchesCount(): Promise<number> {
    const { count, error } = await supabase
      .from('inquiry_matches')
      .select('*', { count: 'exact', head: true })
      .eq('notification_sent', false);

    if (error) throw error;

    return count || 0;
  }

  async getMatchesByInquiry(inquiryId: string): Promise<InquiryMatchWithProperty[]> {
    const { data, error } = await supabase
      .from('inquiry_matches')
      .select(`
        *,
        property:properties(*)
      `)
      .eq('inquiry_id', inquiryId)
      .order('matched_at', { ascending: false });

    if (error) throw error;

    return (data || []) as InquiryMatchWithProperty[];
  }
}

export const inquiriesService = new InquiriesService();
