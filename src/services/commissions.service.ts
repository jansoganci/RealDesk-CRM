import { supabase } from '../config/supabase';
import type {
  BrokerSettings,
  CapProgress,
  Commission,
  CommissionCalculationResult,
  CommissionInsert,
  CommissionStats,
  CommissionWithProperty,
  ForecastResult,
  MonthlyCommissionData,
  PerformanceSummary,
  YTDSummary,
} from '../types';
import { getAuthenticatedUserId } from '../lib/auth';
import { getActiveOrgId, softDelete } from '../lib/orgHelpers';
import {
  calculateCommission as calculateCommissionPure,
  calculateRentalCommission as calculateRentalCommissionPure,
  type CalculateCommissionParams,
  type CalculateRentalCommissionParams,
} from './commissionCalculator';

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

class CommissionsService {
  private getCapResetDate(anniversaryDate: string | null): string | null {
    if (!anniversaryDate) return null;
    const now = new Date();
    const monthDay = anniversaryDate.slice(5);
    const thisYear = new Date(`${now.getFullYear()}-${monthDay}T00:00:00`);
    if (Number.isNaN(thisYear.getTime())) return null;
    const reset = thisYear > now ? thisYear : new Date(`${now.getFullYear() + 1}-${monthDay}T00:00:00`);
    return reset.toISOString().slice(0, 10);
  }
  private getCurrentCapYearStart(anniversaryDate: string | null): string {
    const now = new Date();
    if (!anniversaryDate) {
      return new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    }

    const monthDay = anniversaryDate.slice(5); // MM-DD
    const candidate = new Date(`${now.getFullYear()}-${monthDay}T00:00:00`);
    if (Number.isNaN(candidate.getTime())) {
      return new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    }

    if (candidate > now) {
      return new Date(`${now.getFullYear() - 1}-${monthDay}T00:00:00`).toISOString().slice(0, 10);
    }

    return candidate.toISOString().slice(0, 10);
  }

  private async getBrokerSettings(_orgId: string, userId: string): Promise<BrokerSettings> {
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

    if (error) throw error;

    return {
      broker_model: (data?.broker_model as BrokerSettings['broker_model']) ?? 'split_with_cap',
      broker_split_pct: data?.broker_split_pct ?? 30,
      annual_cap_amount: data?.annual_cap_amount ?? null,
      cap_anniversary_date: data?.cap_anniversary_date ?? null,
      franchise_fee_enabled: data?.franchise_fee_enabled ?? false,
      franchise_fee_pct: data?.franchise_fee_pct ?? null,
      franchise_fee_cap: data?.franchise_fee_cap ?? null,
      default_transaction_fee: data?.default_transaction_fee ?? 0,
      eo_fee_type: (data?.eo_fee_type as BrokerSettings['eo_fee_type']) ?? 'per_deal',
      eo_fee_amount: data?.eo_fee_amount ?? 0,
      default_tc_fee: data?.default_tc_fee ?? 0,
      default_rental_commission_type:
        (data?.default_rental_commission_type as BrokerSettings['default_rental_commission_type']) ?? 'one_month',
      default_rental_commission_rate: data?.default_rental_commission_rate ?? null,
      default_rental_flat_fee: data?.default_rental_flat_fee ?? null,
    };
  }

  private async getCapContext(orgId: string, userId: string, anniversaryDate: string | null): Promise<{
    ytdCompanyDollar: number;
    ytdRoyaltyDollar: number;
  }> {
    const startDate = this.getCurrentCapYearStart(anniversaryDate);
    const { data, error } = await (supabase as any)
      .from('commissions')
      .select('broker_dollar, franchise_fee_amount')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('closing_date', startDate)
      .lte('closing_date', new Date().toISOString().slice(0, 10));

    if (error) throw error;
    const rows = (data ?? []) as Array<{ broker_dollar?: number | null; franchise_fee_amount?: number | null }>;
    return {
      ytdCompanyDollar: rows.reduce((sum, row) => sum + (row.broker_dollar ?? 0), 0),
      ytdRoyaltyDollar: rows.reduce((sum, row) => sum + (row.franchise_fee_amount ?? 0), 0),
    };
  }

  /**
   * Get all commissions for the authenticated user
   */
  async getAll(): Promise<Commission[]> {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('org_id', orgId)
      .is('deleted_at', null)
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
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
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
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('commissions')
      .select(`
        *,
        property:properties(*)
      `)
      .eq('org_id', orgId)
      .is('deleted_at', null)
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
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('org_id', orgId)
      .is('deleted_at', null)
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
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .eq('type', type)
      .order('created_at', { ascending: false});

    if (error) {
      console.error(`Error fetching ${type} commissions:`, error);
      throw error;
    }

    return (data || []) as Commission[];
  }

  /**
   * Get commission statistics (all currencies combined)
   */
  async getStats(): Promise<CommissionStats> {
    const commissions = await this.getAll();

    const rentalCommissions = commissions
      .filter((c) => c.type === 'rental')
      .reduce((sum, c) => sum + c.amount, 0);

    const saleCommissions = commissions
      .filter((c) => c.type === 'sale')
      .reduce((sum, c) => sum + c.amount, 0);

    const totalEarnings = rentalCommissions + saleCommissions;

    return {
      totalEarnings,
      rentalCommissions,
      saleCommissions,
      currency: 'MIXED', // Indicates multiple currencies may be included
    };
  }

  /**
   * Create a new commission
   * Security: Always uses authenticated user's ID, ignoring any user_id in commission parameter
   */
  async create(commission: CommissionInsert): Promise<Commission> {
    // Get authenticated user ID with session fallback
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    // Inject user_id and org_id, overriding any provided values for security
    const { data, error } = await supabase
      .from('commissions')
      .insert({
        ...commission,
        user_id: userId, // Force current user's ID
        org_id: orgId,   // Force current org's ID
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
   * Delete a commission (soft delete)
   */
  async delete(id: string): Promise<void> {
    await softDelete('commissions', id);
  }

  /**
   * Get monthly earnings breakdown (all currencies combined)
   */
  async getMonthlyBreakdown(year: number): Promise<Array<{
    month: number;
    earnings: number;
    rentalEarnings: number;
    saleEarnings: number;
  }>> {
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const commissions = (data || []) as Commission[];

    // Group by month (all currencies)
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      earnings: 0,
      rentalEarnings: 0,
      saleEarnings: 0,
    }));

    commissions.forEach((commission) => {
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
   * Get performance summary for a year (all currencies combined)
   */
  async getPerformanceSummary(year: number): Promise<PerformanceSummary> {
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

    const commissions = await this.getByDateRange(startDate, endDate);

    // Calculate totals (all currencies)
    const dealsCount = commissions.length;
    const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);
    const averagePerDeal = dealsCount > 0 ? totalCommission / dealsCount : 0;

    // Calculate rental vs sale percentages
    const rentalTotal = commissions
      .filter((c) => c.type === 'rental')
      .reduce((sum, c) => sum + c.amount, 0);
    const saleTotal = commissions
      .filter((c) => c.type === 'sale')
      .reduce((sum, c) => sum + c.amount, 0);

    const rentalPercentage = totalCommission > 0 ? (rentalTotal / totalCommission) * 100 : 0;
    const salePercentage = totalCommission > 0 ? (saleTotal / totalCommission) * 100 : 0;

    // Find best month
    const monthlyData = await this.getMonthlyBreakdown(year);
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
      currency: 'MIXED', // Multiple currencies may be included
    };
  }

  /**
   * Get monthly commission data for charts (all currencies combined)
   */
  async getMonthlyCommissionData(year: number): Promise<MonthlyCommissionData[]> {
    const monthlyBreakdown = await this.getMonthlyBreakdown(year);

    return monthlyBreakdown.map((data) => ({
      month: data.month,
      monthName: MONTH_NAMES_TR[data.month - 1],
      total: data.earnings,
      rental: data.rentalEarnings,
      sale: data.saleEarnings,
    }));
  }

  async calculateCommission(params: CalculateCommissionParams): Promise<CommissionCalculationResult> {
    return calculateCommissionPure(params);
  }

  async calculateRentalCommission(params: CalculateRentalCommissionParams): Promise<CommissionCalculationResult> {
    return calculateRentalCommissionPure(params);
  }

  async recordCommission(commission: CommissionInsert): Promise<string> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await (supabase as any).rpc('rpc_record_commission_and_close_deal', {
      p_commission: {
        ...commission,
        user_id: userId,
      } as unknown as Record<string, unknown>,
    });

    if (error) {
      console.error('Error recording commission via RPC:', error);
      throw error;
    }

    return data as string;
  }

  async getYTDSummary(): Promise<YTDSummary> {
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();
    const brokerSettings = await this.getBrokerSettings(orgId, userId);
    const startDate = this.getCurrentCapYearStart(brokerSettings.cap_anniversary_date);
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await (supabase as any)
      .from('commissions')
      .select('id, deal_id, property_address, gross_commission, net_commission, broker_dollar, type, closing_date')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .not('closing_date', 'is', null)
      .gte('closing_date', startDate)
      .lte('closing_date', today)
      .order('closing_date', { ascending: true });

    if (error) throw error;
    const rows = (data ?? []) as Array<{
      id: string;
      deal_id: string | null;
      property_address: string;
      gross_commission: number | null;
      net_commission: number | null;
      broker_dollar: number | null;
      type: string;
      closing_date: string | null;
      amount?: number;
    }>;

    const total_gci = rows.reduce((sum, row) => sum + (row.gross_commission ?? 0), 0);
    const total_net = rows.reduce((sum, row) => sum + (row.net_commission ?? row.amount ?? 0), 0);
    const deal_count = rows.length;

    const sales = rows.filter((r) => r.type === 'sale');
    const rentals = rows.filter((r) => r.type === 'rental');

    const monthly = new Map<number, { gci: number; net: number; deal_count: number }>();
    rows.forEach((row) => {
      if (!row.closing_date) return;
      const month = new Date(`${row.closing_date}T00:00:00`).getMonth() + 1;
      const current = monthly.get(month) ?? { gci: 0, net: 0, deal_count: 0 };
      current.gci += row.gross_commission ?? 0;
      current.net += row.net_commission ?? row.amount ?? 0;
      current.deal_count += 1;
      monthly.set(month, current);
    });

    let bestMonth: YTDSummary['best_month'] = null;
    monthly.forEach((v, month) => {
      if (!bestMonth || v.net > bestMonth.net) {
        bestMonth = { month, gci: v.gci, net: v.net, deal_count: v.deal_count };
      }
    });

    let bestDeal: YTDSummary['best_deal'] = null;
    rows.forEach((row) => {
      const net = row.net_commission ?? row.amount ?? 0;
      if (!bestDeal || net > bestDeal.net_commission) {
        bestDeal = {
          commission_id: row.id,
          deal_id: row.deal_id,
          property_address: row.property_address,
          net_commission: net,
        };
      }
    });

    return {
      total_gci,
      total_net,
      deal_count,
      sales_gci: sales.reduce((sum, row) => sum + (row.gross_commission ?? 0), 0),
      rental_gci: rentals.reduce((sum, row) => sum + (row.gross_commission ?? 0), 0),
      sales_net: sales.reduce((sum, row) => sum + (row.net_commission ?? row.amount ?? 0), 0),
      rental_net: rentals.reduce((sum, row) => sum + (row.net_commission ?? row.amount ?? 0), 0),
      avg_net_per_deal: deal_count > 0 ? total_net / deal_count : 0,
      best_month: bestMonth,
      best_deal: bestDeal,
      ytd_company_dollar: rows.reduce((sum, row) => sum + (row.broker_dollar ?? 0), 0),
    };
  }

  async getCommissionHistory(filters: {
    type?: 'sale' | 'rental';
    side?: 'listing' | 'buyer' | 'dual' | 'rental_listing' | 'rental_tenant';
    month?: number;
    year?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{ rows: Commission[]; total: number }> {
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = (supabase as any)
      .from('commissions')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .not('closing_date', 'is', null)
      .is('deleted_at', null);

    if (filters.type) query = query.eq('type', filters.type);
    if (filters.side) query = query.eq('commission_side', filters.side);
    if (filters.year) {
      const start = `${filters.year}-${String(filters.month ?? 1).padStart(2, '0')}-01`;
      const endMonth = filters.month ?? 12;
      const endDate = new Date(filters.year, endMonth, 0).toISOString().slice(0, 10);
      query = query.gte('closing_date', start).lte('closing_date', endDate);
    }

    const { data, error, count } = await query
      .order('closing_date', { ascending: false, nullsFirst: false })
      .range(from, to);

    if (error) throw error;
    return { rows: ((data ?? []) as unknown[]) as Commission[], total: count ?? 0 };
  }

  async getCapProgress(): Promise<CapProgress> {
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();
    const settings = await this.getBrokerSettings(orgId, userId);
    const cap = settings.annual_cap_amount;
    const { ytdCompanyDollar, ytdRoyaltyDollar } = await this.getCapContext(
      orgId,
      userId,
      settings.cap_anniversary_date
    );

    const pct_to_cap = cap && cap > 0 ? Math.min((ytdCompanyDollar / cap) * 100, 100) : 0;
    const is_capped = cap ? ytdCompanyDollar >= cap : false;
    const remaining = cap ? Math.max(cap - ytdCompanyDollar, 0) : null;
    const capResetDate = this.getCapResetDate(settings.cap_anniversary_date);
    const daysToReset = capResetDate
      ? Math.ceil((new Date(`${capResetDate}T00:00:00`).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    const { data: recent, error } = await (supabase as any)
      .from('commissions')
      .select('gross_commission, broker_dollar')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .not('closing_date', 'is', null)
      .order('closing_date', { ascending: false })
      .limit(12);
    if (error) throw error;

    const recentRows = (recent ?? []) as Array<{ gross_commission?: number | null; broker_dollar?: number | null }>;
    const avgCompanyDollar =
      recentRows.length > 0
        ? recentRows.reduce((sum, row) => sum + (row.broker_dollar ?? 0), 0) / recentRows.length
        : 0;
    const avgGci =
      recentRows.length > 0
        ? recentRows.reduce((sum, row) => sum + (row.gross_commission ?? 0), 0) / recentRows.length
        : 0;

    const historyStartDate = this.getCurrentCapYearStart(settings.cap_anniversary_date);
    const { data: historyRowsRaw, error: historyError } = await (supabase as any)
      .from('commissions')
      .select('id, closing_date, property_address, broker_dollar')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .not('closing_date', 'is', null)
      .gte('closing_date', historyStartDate)
      .order('closing_date', { ascending: true });
    if (historyError) throw historyError;
    const historyRows = (historyRowsRaw ?? []) as Array<{
      id: string;
      closing_date: string | null;
      property_address: string;
      broker_dollar: number | null;
    }>;

    let cumulative = 0;
    const capHistory = historyRows.map((row) => {
      const companyDollar = row.broker_dollar ?? 0;
      const before = cumulative;
      cumulative += companyDollar;
      return {
        commission_id: row.id,
        closing_date: row.closing_date,
        property_address: row.property_address,
        company_dollar: companyDollar,
        cumulative_company_dollar: cumulative,
        triggered_cap: !!cap && cap > 0 && before < cap && cumulative >= cap,
      };
    });

    return {
      ytd_company_dollar: ytdCompanyDollar,
      cap_amount: cap,
      pct_to_cap,
      is_capped,
      remaining_to_cap: remaining,
      deals_to_cap_estimate: remaining && avgCompanyDollar > 0 ? remaining / avgCompanyDollar : null,
      gci_to_cap_estimate: remaining && avgCompanyDollar > 0 && avgGci > 0 ? (remaining / avgCompanyDollar) * avgGci : null,
      cap_reset_date: capResetDate,
      days_to_reset: daysToReset,
      cap_history: capHistory,
      royalty_ytd: ytdRoyaltyDollar,
      royalty_cap: settings.franchise_fee_cap,
    };
  }

  async getForecast(): Promise<ForecastResult> {
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();
    const settings = await this.getBrokerSettings(orgId, userId);
    const capContext = await this.getCapContext(orgId, userId, settings.cap_anniversary_date);

    const { data, error } = await (supabase as any)
      .from('deals')
      .select('id, deal_type, deal_stage, projected_close_date, intended_offer_price, accepted_offer_price')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .in('deal_stage', ['offer_prep', 'submitted', 'negotiating', 'under_contract', 'pending', 'closing_scheduled']);

    if (error) throw error;
    const rows = (data ?? []) as Array<{
      id: string;
      deal_type: 'sale' | 'rental';
      deal_stage: string;
      projected_close_date: string | null;
      intended_offer_price: number | null;
      accepted_offer_price: number | null;
    }>;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const plus90 = new Date(now);
    plus90.setDate(now.getDate() + 90);

    const stageWeights: Record<string, number> = {
      offer_prep: 0.1,
      submitted: 0.25,
      negotiating: 0.35,
      under_contract: 0.8,
      pending: 0.9,
      closing_scheduled: 0.95,
    };

    let committed_this_month_gross = 0;
    let committed_this_month_net = 0;
    let weighted_90_days_gross = 0;
    let weighted_90_days_net = 0;

    rows.forEach((deal) => {
      const gross = deal.accepted_offer_price ?? deal.intended_offer_price ?? 0;
      const calc = calculateCommissionPure({
        salePrice: gross,
        commissionRate: 2.5,
        commissionType: 'percentage',
        side: deal.deal_type === 'rental' ? 'rental_listing' : 'listing',
        referralPct: 0,
        brokerSettings: settings,
        capContext,
      });

      const closeDate = deal.projected_close_date ? new Date(`${deal.projected_close_date}T00:00:00`) : null;
      const weight = stageWeights[deal.deal_stage] ?? 0;

      if (closeDate && closeDate >= monthStart && closeDate <= monthEnd) {
        committed_this_month_gross += gross * 0.85;
        committed_this_month_net += calc.netCommission * 0.85;
      }

      if (closeDate && closeDate >= now && closeDate <= plus90) {
        weighted_90_days_gross += gross * weight;
        weighted_90_days_net += calc.netCommission * weight;
      }
    });

    return {
      committed_this_month_gross,
      committed_this_month_net,
      weighted_90_days_gross,
      weighted_90_days_net,
      active_deals_count: rows.length,
    };
  }

  async exportCSV(year: number): Promise<Blob> {
    const userId = await getAuthenticatedUserId();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const orgId = await getActiveOrgId();
    const { data, error } = await (supabase as any)
      .from('commissions')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('closing_date', startDate)
      .lte('closing_date', endDate)
      .order('closing_date', { ascending: true });

    if (error) throw error;
    const rows = (data ?? []) as Array<{
      closing_date?: string | null;
      property_address?: string | null;
      type?: string | null;
      commission_side?: string | null;
      gross_commission?: number | null;
      referral_fee_amount?: number | null;
      broker_dollar?: number | null;
      franchise_fee_amount?: number | null;
      transaction_fee?: number | null;
      eo_fee?: number | null;
      tc_fee?: number | null;
      other_fees?: number | null;
      net_commission?: number | null;
      notes?: string | null;
    }>;
    const header = [
      'closing_date',
      'property_address',
      'type',
      'commission_side',
      'gross_commission',
      'referral_fee_amount',
      'broker_dollar',
      'franchise_fee_amount',
      'transaction_fee',
      'eo_fee',
      'tc_fee',
      'other_fees',
      'net_commission',
      'notes',
    ];
    const csvRows = rows.map((row) =>
      [
        row.closing_date ?? '',
        row.property_address ?? '',
        row.type ?? '',
        row.commission_side ?? '',
        row.gross_commission ?? '',
        row.referral_fee_amount ?? '',
        row.broker_dollar ?? '',
        row.franchise_fee_amount ?? '',
        row.transaction_fee ?? '',
        row.eo_fee ?? '',
        row.tc_fee ?? '',
        row.other_fees ?? '',
        row.net_commission ?? '',
        row.notes ?? '',
      ]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(',')
    );

    const csv = [header.join(','), ...csvRows].join('\n');
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  async updateCommission(id: string, data: Partial<CommissionInsert>): Promise<Commission> {
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();
    const { data: updated, error } = await supabase
      .from('commissions')
      .update(data)
      .eq('id', id)
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select('*')
      .single();

    if (error) throw error;
    return updated as Commission;
  }
}

export const commissionsService = new CommissionsService();
