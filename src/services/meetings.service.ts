
import { supabase } from '@/config/supabase';
import {
  AppError,
  ERROR_MEETING_NOT_FOUND,
  ERROR_SERVER_ERROR,
} from '@/lib/errorCodes';
import type { Database } from '@/types/database';
import type { Meeting, MeetingInsert, MeetingUpdate } from '@/types';

const MEETINGS_TABLE = 'meetings';

/**
 * The shape of a meeting record when fetched with its relations.
 */
export type MeetingWithRelations = Meeting & {
  tenant: Database['public']['Tables']['tenants']['Row'] | null;
  property: Database['public']['Tables']['properties']['Row'] | null;
  owner: Database['public']['Tables']['property_owners']['Row'] | null;
};

class MeetingsService {
  /**
   * Fetches all meetings for the authenticated user, ordered by start time.
   * @returns A promise that resolves to an array of meetings with their relations.
   */
  async getAll(): Promise<MeetingWithRelations[]> {
    const { data, error } = await supabase
      .from(MEETINGS_TABLE)
      .select('*, tenant:tenants(*), property:properties(*), owner:property_owners(*)')
      .order('start_time', { ascending: true });

    if (error) {
      throw new AppError(ERROR_SERVER_ERROR, 'Failed to fetch meetings');
    }
    return data || [];
  }

  /**
   * Fetches a single meeting by its ID.
   * @param id The UUID of the meeting to fetch.
   * @returns A promise that resolves to the meeting with its relations.
   */
  async getById(id: string): Promise<MeetingWithRelations> {
    const { data, error } = await supabase
      .from(MEETINGS_TABLE)
      .select('*, tenant:tenants(*), property:properties(*), owner:property_owners(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError(ERROR_MEETING_NOT_FOUND, 'Meeting not found');
      }
      throw new AppError(ERROR_SERVER_ERROR, 'Failed to fetch meeting by ID');
    }
    if (!data) {
      throw new AppError(ERROR_MEETING_NOT_FOUND, 'Meeting not found.');
    }
    return data;
  }

  /**
   * Creates a new meeting for the authenticated user.
   * @param meetingData The data for the new meeting.
   * @returns A promise that resolves to the newly created meeting.
   */
  async create(meetingData: MeetingInsert): Promise<Meeting> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new AppError(ERROR_SERVER_ERROR, 'Authentication error: Cannot create meeting.');
    }

    const { data, error } = await supabase
      .from(MEETINGS_TABLE)
      .insert({ ...meetingData, user_id: user.id })
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
    const { error } = await supabase.from(MEETINGS_TABLE).delete().eq('id', id);

    if (error) {
      throw new AppError(ERROR_SERVER_ERROR, 'Failed to delete meeting');
    }
  }

  /**
   * Fetches meetings within a specific date range.
   * @param startDate The start of the date range (ISO string).
   * @param endDate The end of the date range (ISO string).
   * @returns A promise that resolves to an array of meetings within the range.
   */
  async getByDateRange(startDate: string, endDate: string): Promise<MeetingWithRelations[]> {
    const { data, error } = await supabase
      .from(MEETINGS_TABLE)
      .select('*, tenant:tenants(*), property:properties(*), owner:property_owners(*)')
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: true });

    if (error) {
      throw new AppError(ERROR_SERVER_ERROR, 'Failed to fetch meetings by date range');
    }
    return data || [];
  }

  /**
   * Fetches upcoming meetings.
   * @param limit The maximum number of upcoming meetings to fetch. Defaults to 10.
   * @returns A promise that resolves to an array of upcoming meetings.
   */
  async getUpcoming(limit = 10): Promise<MeetingWithRelations[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(MEETINGS_TABLE)
      .select('*, tenant:tenants(*), property:properties(*), owner:property_owners(*)')
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
