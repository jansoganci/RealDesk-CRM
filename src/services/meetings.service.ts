
import { supabase } from '@/config/supabase';
import {
  AppError,
  ERROR_MEETING_NOT_FOUND,
  ERROR_SERVER_ERROR,
} from '@/lib/errorCodes';
import type { Meeting, MeetingInsert, MeetingUpdate } from '@/types';
import { getAuthenticatedUserId } from '@/lib/auth';
import { getActiveOrgId, softDelete } from '@/lib/orgHelpers';

const MEETINGS_TABLE = 'meetings';

/**
 * Partial types matching the actual select projections used in queries
 */
type TenantPartial = { id: string; name: string; email: string | null; phone: string | null };
type PropertyPartial = { id: string; address: string; city: string | null; district: string | null };
type OwnerPartial = { id: string; name: string; email: string | null; phone: string | null };

/**
 * The shape of a meeting record when fetched with its relations.
 */
export type MeetingWithRelations = Meeting & {
  tenant: TenantPartial | null;
  property: PropertyPartial | null;
  owner: OwnerPartial | null;
};

class MeetingsService {
  /**
   * Fetches all meetings for the authenticated user, ordered by start time.
   * @returns A promise that resolves to an array of meetings with their relations.
   */
  async getAll(): Promise<MeetingWithRelations[]> {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from(MEETINGS_TABLE)
      .select('*, tenant:tenants(id, name, email, phone), property:properties(id, address, city, district), owner:property_owners(id, name, email, phone)')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('start_time', { ascending: true });

    if (error) {
      throw new AppError(ERROR_SERVER_ERROR, 'Failed to fetch meetings');
    }
    return data || [];
  }

  async getById(id: string): Promise<MeetingWithRelations> {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from(MEETINGS_TABLE)
      .select('*, tenant:tenants(id, name, email, phone), property:properties(id, address, city, district), owner:property_owners(id, name, email, phone)')
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new AppError(ERROR_SERVER_ERROR, 'Failed to fetch meeting by ID');
    }
    if (!data) {
      throw new AppError(ERROR_MEETING_NOT_FOUND, 'Meeting not found');
    }
    return data;
  }

  /**
   * Creates a new meeting for the authenticated user.
   * @param meetingData The data for the new meeting.
   * @returns A promise that resolves to the newly created meeting.
   */
  async create(meetingData: MeetingInsert): Promise<Meeting> {
    // Get authenticated user ID with session fallback
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from(MEETINGS_TABLE)
      .insert({ ...meetingData, user_id: userId, org_id: orgId })
      .select()
      .single();

    if (error) {
      throw new AppError(ERROR_SERVER_ERROR, 'Failed to create meeting');
    }
    return data;
  }

  /**
   * Updates an existing meeting.
   * @param id The UUID of the meeting to update.
   * @param updates The data to update.
   * @returns A promise that resolves to the updated meeting.
   */
  async update(id: string, updates: MeetingUpdate): Promise<Meeting> {
    const { data, error } = await supabase
      .from(MEETINGS_TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(ERROR_SERVER_ERROR, 'Failed to update meeting');
    }
    return data;
  }

  /**
   * Deletes a meeting by its ID.
   * @param id The UUID of the meeting to delete.
   */
  async delete(id: string): Promise<void> {
    await softDelete(MEETINGS_TABLE, id);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<MeetingWithRelations[]> {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from(MEETINGS_TABLE)
      .select('*, tenant:tenants(id, name, email, phone), property:properties(id, address, city, district), owner:property_owners(id, name, email, phone)')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: true });

    if (error) {
      throw new AppError(ERROR_SERVER_ERROR, 'Failed to fetch meetings by date range');
    }
    return data || [];
  }

  async getUpcoming(limit = 10): Promise<MeetingWithRelations[]> {
    const orgId = await getActiveOrgId();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from(MEETINGS_TABLE)
      .select('*, tenant:tenants(id, name, email, phone), property:properties(id, address, city, district), owner:property_owners(id, name, email, phone)')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) {
      throw new AppError(ERROR_SERVER_ERROR, 'Failed to fetch upcoming meetings');
    }
    return data || [];
  }
}

export const meetingsService = new MeetingsService();
