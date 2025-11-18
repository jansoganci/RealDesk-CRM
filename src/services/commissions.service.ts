import { supabase } from '../config/supabase';
import type { Commission, CommissionInsert, CommissionStats, CommissionWithProperty, PerformanceSummary, MonthlyCommissionData } from '../types';
import { getAuthenticatedUserId } from '../lib/auth';

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

class CommissionsService {
  /**
   * Get all commissions for the authenticated user
   */
  async getAll(): Promise<Commission[]> {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching commissions:', error);
      throw error;
    }

    return (data || []) as Commission[];
  }

  /**
   * Get commission by ID
   */
  async getById(id: string): Promise<Commission | null> {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching commission:', error);
      throw error;
    }

    return data as Commission | null;
  }

  /**
   * Get commissions with property details
   */
  async getAllWithProperties(): Promise<CommissionWithProperty[]> {
    const { data, error } = await supabase
      .from('commissions')
      .select(`
        *,
        property:properties(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching commissions with properties:', error);
      throw error;
    }

    return (data || []) as CommissionWithProperty[];
  }

  /**
   * Get commissions by date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Commission[]> {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching commissions by date range:', error);
      throw error;
    }

    return (data || []) as Commission[];
  }

  /**
   * Get commissions by type (rental or sale)
   */
  async getByType(type: 'rental' | 'sale'): Promise<Commission[]> {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false});

    if (error) {
      console.error(`Error fetching ${type} commissions:`, error);
      throw error;
    }

    return (data || []) as Commission[];
  }

  /**
   * Get commission statistics
   */
  async getStats(currency: string = 'USD'): Promise<CommissionStats> {
    const commissions = await this.getAll();

    // Filter by currency and calculate totals
    const filteredCommissions = commissions.filter((c) => c.currency === currency);

    const rentalCommissions = filteredCommissions
      .filter((c) => c.type === 'rental')
      .reduce((sum, c) => sum + c.amount, 0);

    const saleCommissions = filteredCommissions
      .filter((c) => c.type === 'sale')
      .reduce((sum, c) => sum + c.amount, 0);

    const totalEarnings = rentalCommissions + saleCommissions;

    return {
      totalEarnings,
      rentalCommissions,
      saleCommissions,
      currency,
    };
  }

  /**
   * Create a new commission
   * Security: Always uses authenticated user's ID, ignoring any user_id in commission parameter
   */
  async create(commission: CommissionInsert): Promise<Commission> {
    // Get authenticated user ID with session fallback
    const userId = await getAuthenticatedUserId();

    // Inject user_id, overriding any provided value for security
    const { data, error } = await supabase
      .from('commissions')
      .insert({
        ...commission,
        user_id: userId, // Force current user's ID
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating commission:', error);
      throw error;
    }

    return data as Commission;
  }

  /**
   * Create sale commission and mark property as sold
   * Calls the database RPC function
   */
  async createSaleCommission(
    propertyId: string,
    salePrice: number,
    currency: string = 'USD'
  ): Promise<string> {
    const { data, error } = await supabase.rpc('create_sale_commission', {
      p_property_id: propertyId,
      p_sale_price: salePrice,
      p_currency: currency,
    });

    if (error) {
      console.error('Error creating sale commission:', error);
      throw error;
    }

    return data as string; // Returns commission ID
  }

  /**
   * Delete a commission
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('commissions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting commission:', error);
      throw error;
    }
  }

  /**
   * Get monthly earnings breakdown
   */
  async getMonthlyBreakdown(year: number, currency: string = 'USD'): Promise<Array<{
    month: number;
    earnings: number;
    rentalEarnings: number;
    saleEarnings: number;
  }>> {
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

    const commissions = await this.getByDateRange(startDate, endDate);
    const filteredCommissions = commissions.filter((c) => c.currency === currency);

    // Group by month
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      earnings: 0,
      rentalEarnings: 0,
      saleEarnings: 0,
    }));

    filteredCommissions.forEach((commission) => {
      const month = new Date(commission.created_at).getMonth();
      monthlyData[month].earnings += commission.amount;

      if (commission.type === 'rental') {
        monthlyData[month].rentalEarnings += commission.amount;
      } else {
        monthlyData[month].saleEarnings += commission.amount;
      }
    });

    return monthlyData;
  }

  /**
   * Get performance summary for a year
   */
  async getPerformanceSummary(year: number, currency: string = 'TRY'): Promise<PerformanceSummary> {
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

    const commissions = await this.getByDateRange(startDate, endDate);
    const filteredCommissions = commissions.filter((c) => c.currency === currency);

    // Calculate totals
    const dealsCount = filteredCommissions.length;
    const totalCommission = filteredCommissions.reduce((sum, c) => sum + c.amount, 0);
    const averagePerDeal = dealsCount > 0 ? totalCommission / dealsCount : 0;

    // Calculate rental vs sale percentages
    const rentalTotal = filteredCommissions
      .filter((c) => c.type === 'rental')
      .reduce((sum, c) => sum + c.amount, 0);
    const saleTotal = filteredCommissions
      .filter((c) => c.type === 'sale')
      .reduce((sum, c) => sum + c.amount, 0);

    const rentalPercentage = totalCommission > 0 ? (rentalTotal / totalCommission) * 100 : 0;
    const salePercentage = totalCommission > 0 ? (saleTotal / totalCommission) * 100 : 0;

    // Find best month
    const monthlyData = await this.getMonthlyBreakdown(year, currency);
    let bestMonth: PerformanceSummary['bestMonth'] = null;

    monthlyData.forEach((data) => {
      if (data.earnings > 0 && (!bestMonth || data.earnings > bestMonth.amount)) {
        bestMonth = {
          month: data.month,
          monthName: MONTH_NAMES_TR[data.month - 1],
          amount: data.earnings,
        };
      }
    });

    return {
      year,
      dealsCount,
      totalCommission,
      averagePerDeal,
      bestMonth,
      rentalPercentage,
      salePercentage,
      currency,
    };
  }

  /**
   * Get monthly commission data for charts
   */
  async getMonthlyCommissionData(year: number, currency: string = 'TRY'): Promise<MonthlyCommissionData[]> {
    const monthlyBreakdown = await this.getMonthlyBreakdown(year, currency);

    return monthlyBreakdown.map((data) => ({
      month: data.month,
      monthName: MONTH_NAMES_TR[data.month - 1],
      total: data.earnings,
      rental: data.rentalEarnings,
      sale: data.saleEarnings,
    }));
  }
}

export const commissionsService = new CommissionsService();
