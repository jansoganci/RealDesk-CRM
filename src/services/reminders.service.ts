import { supabase } from '../config/supabase';
import type { Contract, Tenant, Property, PropertyOwner } from '../types';
import type { PropertyWithOwnerDetails } from '../types';
import { updateRow } from '../lib/db';
import { getToday, parseDateToStartOfDay, addDaysToDate, daysDifference, formatDateForDb } from '../lib/dates';

export interface ReminderWithDetails extends Contract {
  tenant?: Tenant;
  property?: PropertyWithOwnerDetails;
  days_until_end: number;
  reminder_date: string;
  is_overdue: boolean;
}

export type ReminderUrgency = 'expired' | 'urgent' | 'soon' | 'upcoming';

export type ReminderCategories = {
  overdue: ReminderWithDetails[];
  upcoming: ReminderWithDetails[];
  scheduled: ReminderWithDetails[];
  expired: ReminderWithDetails[];
};

export type NewReminderCategories = {
  critical: ReminderWithDetails[];
  underWatch: ReminderWithDetails[];
  completed: ReminderWithDetails[];
};

export type ProgressInfo = {
  percentage: number;
  zone: 'safe' | 'approaching' | 'critical';
  daysUntilCritical: number;
};

class RemindersService {
  private readonly REMINDER_THRESHOLD_URGENT = 30;
  private readonly REMINDER_THRESHOLD_SOON = 60;
  private readonly REMINDER_THRESHOLD_DEFAULT = 90;
  // Fixed 30-day threshold for expiry reminders (Contract Expiry Control Center)
  private readonly EXPIRY_REMINDER_DAYS = 30;
  /**
   * Get all reminders (non-contacted only) - used for active reminders
   * This is the original method, kept for backward compatibility
   */
  async getAllReminders(): Promise<ReminderWithDetails[]> {
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select(`
        id,
        start_date,
        end_date,
        rent_amount,
        rent_increase_reminder_days,
        rent_increase_reminder_enabled,
        rent_increase_reminder_contacted,
        expected_new_rent,
        reminder_notes,
        status,
        tenant:tenants(id, name, email, phone),
        property:properties(id, address, owner:property_owners(id, name, email, phone))
      `)
      .eq('rent_increase_reminder_enabled', true)
      .eq('rent_increase_reminder_contacted', false)
      .in('status', ['Active', 'Inactive'])
      .order('end_date', { ascending: true });

    if (error) throw error;
    if (!contracts) return [];

    const today = getToday();

    interface ContractQueryResult extends Contract {
      tenant?: Tenant;
      property?: Property & { owner?: PropertyOwner };
    }

    const reminders = (contracts as ContractQueryResult[])
      .map((contract) => {
        const endDate = parseDateToStartOfDay(contract.end_date);
        const reminderDays = contract.rent_increase_reminder_days || 90;
        const reminderDate = addDaysToDate(endDate, -reminderDays);

        const daysUntilEnd = daysDifference(endDate, today);
        const isOverdue = today >= reminderDate;

        return {
          ...contract,
          days_until_end: daysUntilEnd,
          reminder_date: formatDateForDb(reminderDate),
          is_overdue: isOverdue,
        };
      })
      .sort((a, b) => a.days_until_end - b.days_until_end);

    return reminders as ReminderWithDetails[];
  }

  /**
   * Get all reminders including contacted ones - used for new categorization
   * This includes both contacted and non-contacted reminders for the "Completed" tab
   */
  async getAllRemindersIncludingContacted(): Promise<ReminderWithDetails[]> {
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select(`
        id,
        start_date,
        end_date,
        rent_amount,
        rent_increase_reminder_days,
        rent_increase_reminder_enabled,
        rent_increase_reminder_contacted,
        expected_new_rent,
        reminder_notes,
        status,
        tenant:tenants(id, name, email, phone),
        property:properties(id, address, owner:property_owners(id, name, email, phone))
      `)
      .eq('rent_increase_reminder_enabled', true)
      .in('status', ['Active', 'Inactive'])
      .order('end_date', { ascending: true });

    if (error) throw error;
    if (!contracts) return [];

    const today = getToday();

    interface ContractQueryResult extends Contract {
      tenant?: Tenant;
      property?: Property & { owner?: PropertyOwner };
    }

    const reminders = (contracts as ContractQueryResult[])
      .map((contract) => {
        const endDate = parseDateToStartOfDay(contract.end_date);
        const reminderDays = contract.rent_increase_reminder_days || 90;
        const reminderDate = addDaysToDate(endDate, -reminderDays);

        const daysUntilEnd = daysDifference(endDate, today);
        const isOverdue = today >= reminderDate;

        return {
          ...contract,
          days_until_end: daysUntilEnd,
          reminder_date: formatDateForDb(reminderDate),
          is_overdue: isOverdue,
        };
      })
      .sort((a, b) => a.days_until_end - b.days_until_end);

    return reminders as ReminderWithDetails[];
  }

  async getActiveReminders(): Promise<ReminderWithDetails[]> {
    const allReminders = await this.getAllReminders();
    // Fixed 30-day threshold for expiry reminders (used by Bell icon and Sidebar counter)
    const EXPIRY_REMINDER_DAYS = 30;
    return allReminders.filter((reminder) =>
      reminder.is_overdue || reminder.days_until_end <= EXPIRY_REMINDER_DAYS
    );
  }

  async getUpcomingReminders(daysAhead = 30): Promise<ReminderWithDetails[]> {
    const activeReminders = await this.getActiveReminders();
    return activeReminders.filter((reminder) =>
      reminder.days_until_end >= 0 && reminder.days_until_end <= daysAhead
    );
  }

  async getOverdueReminders(): Promise<ReminderWithDetails[]> {
    const activeReminders = await this.getActiveReminders();
    return activeReminders.filter((reminder) => reminder.is_overdue && reminder.days_until_end >= 0);
  }

  async getScheduledReminders(): Promise<ReminderWithDetails[]> {
    const allReminders = await this.getAllReminders();
    return allReminders.filter((reminder) => 
      !reminder.is_overdue && reminder.days_until_end > (reminder.rent_increase_reminder_days || this.REMINDER_THRESHOLD_DEFAULT)
    );
  }

  async getExpiredContracts(): Promise<ReminderWithDetails[]> {
    const allReminders = await this.getAllReminders();
    return allReminders.filter((reminder) => reminder.days_until_end < 0);
  }

  /**
   * Original categorization method - kept for backward compatibility
   */
  categorizeReminders(reminders: ReminderWithDetails[]): ReminderCategories {
    return {
      overdue: reminders.filter((r) => r.is_overdue && r.days_until_end >= 0),
      upcoming: reminders.filter((r) => 
        !r.is_overdue && r.days_until_end >= 0 && r.days_until_end <= (r.rent_increase_reminder_days || this.REMINDER_THRESHOLD_DEFAULT)
      ),
      scheduled: reminders.filter((r) => 
        !r.is_overdue && r.days_until_end > (r.rent_increase_reminder_days || this.REMINDER_THRESHOLD_DEFAULT)
      ),
      expired: reminders.filter((r) => r.days_until_end < 0),
    };
  }

  /**
   * New categorization method for Contract Expiry Control Center
   * Uses fixed 30-day threshold and includes contacted reminders
   * 
   * Categories:
   * - Critical: days_until_end <= 30 OR is_overdue (and not contacted)
   * - Under Watch: days_until_end > 30 AND reminder_enabled = true AND contacted = false
   * - Completed: contacted = true
   */
  categorizeRemindersNew(reminders: ReminderWithDetails[]): NewReminderCategories {
    return {
      critical: reminders.filter((r) => 
        !r.rent_increase_reminder_contacted && 
        (r.is_overdue || r.days_until_end <= this.EXPIRY_REMINDER_DAYS)
      ),
      underWatch: reminders.filter((r) => 
        !r.rent_increase_reminder_contacted && 
        r.days_until_end > this.EXPIRY_REMINDER_DAYS &&
        r.rent_increase_reminder_enabled === true
      ),
      completed: reminders.filter((r) => 
        r.rent_increase_reminder_contacted === true
      ),
    };
  }

  /**
   * Get critical reminders (next 30 days or overdue, not contacted)
   */
  getCriticalReminders(reminders: ReminderWithDetails[]): ReminderWithDetails[] {
    return reminders.filter((r) => 
      !r.rent_increase_reminder_contacted && 
      (r.is_overdue || r.days_until_end <= this.EXPIRY_REMINDER_DAYS)
    );
  }

  /**
   * Get under watch reminders (more than 30 days away, enabled, not contacted)
   */
  getUnderWatchReminders(reminders: ReminderWithDetails[]): ReminderWithDetails[] {
    return reminders.filter((r) => 
      !r.rent_increase_reminder_contacted && 
      r.days_until_end > this.EXPIRY_REMINDER_DAYS &&
      r.rent_increase_reminder_enabled === true
    );
  }

  /**
   * Get completed reminders (contacted = true)
   */
  getCompletedReminders(reminders: ReminderWithDetails[]): ReminderWithDetails[] {
    return reminders.filter((r) => 
      r.rent_increase_reminder_contacted === true
    );
  }

  /**
   * Calculate progress information for a contract reminder
   * Returns percentage, zone, and days until critical zone
   */
  calculateProgress(reminder: ReminderWithDetails): ProgressInfo {
    const { start_date, end_date, days_until_end } = reminder;
    
    if (!start_date || !end_date) {
      return {
        percentage: 0,
        zone: 'safe',
        daysUntilCritical: 0,
      };
    }

    const startDate = parseDateToStartOfDay(start_date);
    const endDate = parseDateToStartOfDay(end_date);
    const today = getToday();

    // Calculate total contract duration in days
    const totalDays = daysDifference(endDate, startDate);
    
    // Calculate days elapsed
    const daysElapsed = daysDifference(today, startDate);
    
    // Calculate percentage (0-100)
    const percentage = totalDays > 0 
      ? Math.max(0, Math.min(100, (daysElapsed / totalDays) * 100))
      : 0;

    // Determine zone based on percentage
    let zone: 'safe' | 'approaching' | 'critical';
    if (percentage < 70) {
      zone = 'safe';
    } else if (percentage < 95) {
      zone = 'approaching';
    } else {
      zone = 'critical';
    }

    // Calculate days until critical zone (30 days before end)
    const daysUntilCritical = Math.max(0, days_until_end - this.EXPIRY_REMINDER_DAYS);

    return {
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      zone,
      daysUntilCritical,
    };
  }

  getReminderUrgencyCategory(daysUntilEnd: number): ReminderUrgency {
    if (daysUntilEnd < 0) return 'expired';
    if (daysUntilEnd <= this.REMINDER_THRESHOLD_URGENT) return 'urgent';
    if (daysUntilEnd <= this.REMINDER_THRESHOLD_SOON) return 'soon';
    return 'upcoming';
  }

  async markAsContacted(contractId: string): Promise<void> {
    await updateRow('contracts', contractId, { rent_increase_reminder_contacted: true });
  }

  async markAsNotContacted(contractId: string): Promise<void> {
    await updateRow('contracts', contractId, { rent_increase_reminder_contacted: false });
  }

  async updateReminderSettings(
    contractId: string,
    settings: {
      rent_increase_reminder_enabled?: boolean;
      rent_increase_reminder_days?: number;
      expected_new_rent?: number;
      reminder_notes?: string;
    }
  ): Promise<void> {
    await updateRow('contracts', contractId, settings);
  }
}

export const remindersService = new RemindersService();
