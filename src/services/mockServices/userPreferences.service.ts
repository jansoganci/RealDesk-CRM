import { Database } from '../../types/database';

type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

class MockUserPreferencesService {
  private preferences: UserPreferences = {
    user_id: 'demo-user',
    language: 'tr',
    currency: 'TRY',
    meeting_reminder_minutes: 30,
    full_name: 'Demo User',
    phone_number: '+90 555 123 4567',
  };

  async getPreferences(): Promise<UserPreferences> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return { ...this.preferences };
  }

  async updatePreferences(
    preferences: Partial<UserPreferencesUpdate>
  ): Promise<UserPreferences> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    this.preferences = { ...this.preferences, ...preferences };
    return { ...this.preferences };
  }

  async updateLanguage(language: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    this.preferences.language = language;
  }

  async updateCurrency(currency: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    this.preferences.currency = currency;
  }

  async updateMeetingReminder(minutes: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    this.preferences.meeting_reminder_minutes = minutes;
  }
}

export const userPreferencesService = new MockUserPreferencesService();
