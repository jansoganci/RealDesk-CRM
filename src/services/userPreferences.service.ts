import { supabase } from '../config/supabase';
import { getAuthenticatedUserId } from '../lib/auth';
import type { Database } from '../types/database.types';
import type { BrokerSettings } from '../types';
import { createLogger } from '../lib/logger';

const logger = createLogger('UserPreferences');

type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

type DashboardWelcomePreference = {
  dashboard_welcome_seen_at?: string | null;
};

type UserPreferencesWithDashboardWelcome = UserPreferences & DashboardWelcomePreference;
type UserPreferencesUpdateWithDashboardWelcome = UserPreferencesUpdate & DashboardWelcomePreference;

class UserPreferencesService {
  private getDefaultBrokerSettings(): BrokerSettings {
    return {
      broker_model: 'split_with_cap',
      broker_split_pct: 30,
      annual_cap_amount: null,
      cap_anniversary_date: null,
      franchise_fee_enabled: false,
      franchise_fee_pct: null,
      franchise_fee_cap: null,
      default_transaction_fee: 0,
      eo_fee_type: 'per_deal',
      eo_fee_amount: 0,
      default_tc_fee: 0,
      default_rental_commission_type: 'one_month',
      default_rental_commission_rate: null,
      default_rental_flat_fee: null,
    };
  }

  /**
   * Get current user's preferences
   */
  async getPreferences(): Promise<UserPreferencesWithDashboardWelcome> {
    const userId = await getAuthenticatedUserId();

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching user preferences:', error);
      throw new Error('Failed to fetch preferences');
    }

    // Return default values if no preferences exist
    if (!data) {
      return {
        user_id: userId,
        language: 'en',
        currency: 'USD',
        meeting_reminder_minutes: 30,
        full_name: null,
        phone_number: null,
        commission_rate: 4.0,
        onboarding_banner_dismissed_at: null,
        dashboard_welcome_seen_at: null,
      };
    }

    return data;
  }

  /**
   * Update current user's preferences
   * Uses upsert to handle first-time users
   */
  async updatePreferences(
    preferences: Partial<UserPreferencesUpdateWithDashboardWelcome>
  ): Promise<UserPreferencesWithDashboardWelcome> {
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
      logger.error('Error updating user preferences:', error);
      throw new Error('Failed to update preferences');
    }

    return data;
  }

  async getDashboardWelcomeSeenAt(): Promise<string | null> {
    const preferences = await this.getPreferences();
    return preferences.dashboard_welcome_seen_at ?? null;
  }

  async markDashboardWelcomeSeen(): Promise<string> {
    const seenAt = new Date().toISOString();
    await this.updatePreferences({ dashboard_welcome_seen_at: seenAt });
    return seenAt;
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

  /**
   * Update onboarding banner dismissal timestamp
   */
  async updateOnboardingBannerDismissal(dismissedAt: number): Promise<void> {
    await this.updatePreferences({ onboarding_banner_dismissed_at: dismissedAt });
  }

  /**
   * Get onboarding banner dismissal timestamp
   */
  async getOnboardingBannerDismissal(): Promise<number | null> {
    const prefs = await this.getPreferences();
    const v = prefs.onboarding_banner_dismissed_at;
    if (v == null) return null;
    return typeof v === 'number' ? v : new Date(v).getTime();
  }

  /**
   * Fetch commission-specific broker settings
   */
  async getBrokerSettings(): Promise<BrokerSettings> {
    const userId = await getAuthenticatedUserId();

    const { data, error } = await (supabase as any)
      .from('user_preferences')
      .select(
        `
        broker_model,
        broker_split_pct,
        annual_cap_amount,
        cap_anniversary_date,
        franchise_fee_enabled,
        franchise_fee_pct,
        franchise_fee_cap,
        default_transaction_fee,
        eo_fee_type,
        eo_fee_amount,
        default_tc_fee,
        default_rental_commission_type,
        default_rental_commission_rate,
        default_rental_flat_fee
      `
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching broker settings:', error);
      throw new Error('Failed to fetch broker settings');
    }

    if (!data) return this.getDefaultBrokerSettings();

    const defaults = this.getDefaultBrokerSettings();
    return {
      broker_model: (data.broker_model as BrokerSettings['broker_model']) ?? defaults.broker_model,
      broker_split_pct: data.broker_split_pct ?? defaults.broker_split_pct,
      annual_cap_amount: data.annual_cap_amount ?? defaults.annual_cap_amount,
      cap_anniversary_date: data.cap_anniversary_date ?? defaults.cap_anniversary_date,
      franchise_fee_enabled: data.franchise_fee_enabled ?? defaults.franchise_fee_enabled,
      franchise_fee_pct: data.franchise_fee_pct ?? defaults.franchise_fee_pct,
      franchise_fee_cap: data.franchise_fee_cap ?? defaults.franchise_fee_cap,
      default_transaction_fee: data.default_transaction_fee ?? defaults.default_transaction_fee,
      eo_fee_type: (data.eo_fee_type as BrokerSettings['eo_fee_type']) ?? defaults.eo_fee_type,
      eo_fee_amount: data.eo_fee_amount ?? defaults.eo_fee_amount,
      default_tc_fee: data.default_tc_fee ?? defaults.default_tc_fee,
      default_rental_commission_type:
        (data.default_rental_commission_type as BrokerSettings['default_rental_commission_type']) ??
        defaults.default_rental_commission_type,
      default_rental_commission_rate:
        data.default_rental_commission_rate ?? defaults.default_rental_commission_rate,
      default_rental_flat_fee: data.default_rental_flat_fee ?? defaults.default_rental_flat_fee,
    };
  }

  /**
   * Update broker settings with model-specific validation
   */
  async updateBrokerSettings(data: Partial<BrokerSettings>): Promise<BrokerSettings> {
    const userId = await getAuthenticatedUserId();
    const current = await this.getBrokerSettings();
    const merged: BrokerSettings = { ...current, ...data };

    if (merged.broker_model === 'split_with_cap' && (merged.annual_cap_amount == null || merged.annual_cap_amount <= 0)) {
      throw new Error('Annual cap amount is required for split-with-cap model');
    }

    if (merged.broker_model === 'flat_fee_100pct') {
      merged.broker_split_pct = 0;
      merged.annual_cap_amount = 0;
    }

    const { error } = await (supabase as any)
      .from('user_preferences')
      .upsert(
        {
          user_id: userId,
          broker_model: merged.broker_model,
          broker_split_pct: merged.broker_split_pct,
          annual_cap_amount: merged.annual_cap_amount,
          cap_anniversary_date: merged.cap_anniversary_date,
          franchise_fee_enabled: merged.franchise_fee_enabled,
          franchise_fee_pct: merged.franchise_fee_pct,
          franchise_fee_cap: merged.franchise_fee_cap,
          default_transaction_fee: merged.default_transaction_fee,
          eo_fee_type: merged.eo_fee_type,
          eo_fee_amount: merged.eo_fee_amount,
          default_tc_fee: merged.default_tc_fee,
          default_rental_commission_type: merged.default_rental_commission_type,
          default_rental_commission_rate: merged.default_rental_commission_rate,
          default_rental_flat_fee: merged.default_rental_flat_fee,
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      logger.error('Error updating broker settings:', error);
      throw new Error('Failed to update broker settings');
    }

    return merged;
  }

  /**
   * Convenience helper for rental defaults used by Commission Sheet prefill
   */
  async getDefaultRentalCommission(): Promise<Pick<
    BrokerSettings,
    'default_rental_commission_type' | 'default_rental_commission_rate' | 'default_rental_flat_fee'
  >> {
    const settings = await this.getBrokerSettings();
    return {
      default_rental_commission_type: settings.default_rental_commission_type,
      default_rental_commission_rate: settings.default_rental_commission_rate,
      default_rental_flat_fee: settings.default_rental_flat_fee,
    };
  }
}

export const userPreferencesService = new UserPreferencesService();
