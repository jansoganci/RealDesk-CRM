import { supabase } from '../config/supabase';
import { getAuthenticatedUserId } from '../lib/auth';
import { Database } from '../types/database';

type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

class UserPreferencesService {
  /**
   * Get current user's preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    const userId = await getAuthenticatedUserId();

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user preferences:', error);
      throw new Error('Failed to fetch preferences');
    }

    // Return default values if no preferences exist
    if (!data) {
      return {
        user_id: userId,
        language: 'tr',
        currency: 'TRY',
        meeting_reminder_minutes: 30,
        full_name: null,
        phone_number: null,
      };
    }

    return data;
  }

  /**
   * Update current user's preferences
   * Uses upsert to handle first-time users
   */
  async updatePreferences(
    preferences: Partial<UserPreferencesUpdate>
  ): Promise<UserPreferences> {
    const userId = await getAuthenticatedUserId();

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: userId,
          ...preferences,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update preferences');
    }

    return data;
  }

  /**
   * Update specific preference field - convenience methods
   */
  async updateLanguage(language: string): Promise<void> {
    await this.updatePreferences({ language });
  }

  async updateCurrency(currency: string): Promise<void> {
    await this.updatePreferences({ currency });
  }

  async updateMeetingReminder(minutes: number): Promise<void> {
    await this.updatePreferences({ meeting_reminder_minutes: minutes });
  }
}

export const userPreferencesService = new UserPreferencesService();
