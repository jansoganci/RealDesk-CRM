// =====================================================
// Financial Analytics Service
// Reports, trends, and dashboard data
// =====================================================

import { supabase } from '../../config/supabase';
import { getTransactions } from './transactions.service';
import { getCategories } from './categories.service';
import { getUpcomingRecurringExpenses } from './recurring.service';
import { calculateCategoryBreakdown, NormalizedCategoryBreakdown, calculateNormalizedSum, CalculatedMetric } from './reportCalculator';
import { getActiveOrgId } from '../../lib/orgHelpers';
import { commissionsService } from '../commissions.service';
import type {
  MonthlySummary,
  CategoryBreakdown,
  MonthlyTrend,
  FinancialDashboard,
  FinancialRatios,
  BudgetVsActual,
  YearlySummary,
  TopCategory,
  CashFlowForecast,
  FinancialTransaction,
  UpcomingRecurringExpense,
} from '../../types/financial';

interface PropertySoldRow {
  created_at: string | null;
  sold_at: string | null;
}

interface RentalContractWithProperty {
  start_date: string | null;
  property: { created_at: string | null } | null;
}

interface CommissionClientTypeRow {
  type: string;
  amount: number;
  currency: string;
  created_at: string;
  property: {
    buyer_name: string | null;
  } | null;
  contract: {
    tenant_id: string | null;
  } | null;
}

interface MarketingTransactionRow {
  amount: number;
  currency: string;
  transaction_date: string;
  created_at: string;
  category: string;
}

interface InquiryRow {
  id: string;
  status: string | null;
}

interface InquiryMatchRow {
  inquiry_id: string;
  property_id: string | null;
}

interface MeetingPropertyRow {
  property_id: string | null;
}

interface ContractPropertyRow {
  property_id: string | null;
}

/**
 * Normalized versions of existing types
 */
export interface NormalizedMonthlySummary {
  month: string;
  total_income: CalculatedMetric;
  total_expense: CalculatedMetric;
  net_income: CalculatedMetric;
  transaction_count: number;
}

export interface NormalizedFinancialDashboard {
  current_month: NormalizedMonthlySummary;
  previous_month: NormalizedMonthlySummary;
  year_to_date: {
    total_income: CalculatedMetric;
    total_expense: CalculatedMetric;
    net_income: CalculatedMetric;
  };
  income_by_category: NormalizedCategoryBreakdown[];
  expense_by_category: NormalizedCategoryBreakdown[];
  monthly_trends: MonthlyTrend[]; // Trends still use simple numbers for now as they are aggregates
  upcoming_expenses: UpcomingRecurringExpense[]; // Skip for now
  pending_transactions_count: number;
}

// =====================================================
// Analytics and Summary Methods
// =====================================================

/**
 * Get monthly summary for a specific month (Normalized)
 */
export const getMonthlySummaryNormalized = async (
  month: string,
  displayCurrency: string
): Promise<NormalizedMonthlySummary> => {
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = `${month}-01`;
  const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('financial_transactions')
    .select('id, amount, currency, transaction_date, category, type, payment_status')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .eq('payment_status', 'completed');

  if (error) {
    console.error('Error fetching monthly summary:', error);
    throw error;
  }

  const transactions = data || [];

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  const total_income = await calculateNormalizedSum(incomeTransactions, displayCurrency);
  const total_expense = await calculateNormalizedSum(expenseTransactions, displayCurrency);

  return {
    month,
    total_income,
    total_expense,
    net_income: {
      value: total_income.value - total_expense.value,
      isComplete: total_income.isComplete && total_expense.isComplete,
      missingDates: Array.from(new Set([...total_income.missingDates, ...total_expense.missingDates]))
    },
    transaction_count: transactions.length,
  };
};

/**
 * Get comprehensive financial dashboard data (Normalized)
 */
export const getFinancialDashboardNormalized = async (
  displayCurrency: string
): Promise<NormalizedFinancialDashboard> => {
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 7);

  const yearStart = `${today.getFullYear()}-01-01`;
  const yearEnd = today.toISOString().split('T')[0];

  const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);
  const currentMonthEnd = new Date(currentYear, currentMonthNum, 0).toISOString().split('T')[0];

  // Fetch all raw data first
  const [
    allTransactionsCurrent,
    allTransactionsPrevious,
    yearToDateTransactions,
    categoriesIncome,
    categoriesExpense,
    trends,
    upcomingExpenses,
    pendingCountResult,
  ] = await Promise.all([
    supabase.from('financial_transactions').select('id, amount, currency, transaction_date, category, type, payment_status').gte('transaction_date', currentMonth + '-01').lte('transaction_date', currentMonthEnd).eq('payment_status', 'completed'),
    supabase.from('financial_transactions').select('id, amount, currency, transaction_date, category, type, payment_status').gte('transaction_date', previousMonth + '-01').lte('transaction_date', new Date(today.getFullYear(), today.getMonth() - 1, 0).toISOString().split('T')[0]).eq('payment_status', 'completed'),
    getTransactions({ start_date: yearStart, end_date: yearEnd, payment_status: 'completed' }),
    getCategories('income'),
    getCategories('expense'),
    getMonthlyTrendsNormalized(displayCurrency, 6),
    getUpcomingRecurringExpenses(30),
    supabase
      .from('financial_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'pending'),
  ]);

  const currentMonthTransactions = allTransactionsCurrent.data || [];
  const previousMonthTransactions = allTransactionsPrevious.data || [];

  // Calculate normalized summaries locally instead of re-fetching
  const [currentSummary, previousSummary, ytdIncome, ytdExpense, incomeBreakdown, expenseBreakdown] = await Promise.all([
    // Local calculation for current month
    (async () => {
      const inc = currentMonthTransactions.filter(t => t.type === 'income');
      const exp = currentMonthTransactions.filter(t => t.type === 'expense');
      const total_inc = await calculateNormalizedSum(inc, displayCurrency);
      const total_exp = await calculateNormalizedSum(exp, displayCurrency);
      return {
        month: currentMonth,
        total_income: total_inc,
        total_expense: total_exp,
        net_income: {
          value: total_inc.value - total_exp.value,
          isComplete: total_inc.isComplete && total_exp.isComplete,
          missingDates: Array.from(new Set([...total_inc.missingDates, ...total_exp.missingDates]))
        },
        transaction_count: currentMonthTransactions.length,
      };
    })(),
    // Local calculation for previous month
    (async () => {
      const inc = previousMonthTransactions.filter(t => t.type === 'income');
      const exp = previousMonthTransactions.filter(t => t.type === 'expense');
      const total_inc = await calculateNormalizedSum(inc, displayCurrency);
      const total_exp = await calculateNormalizedSum(exp, displayCurrency);
      return {
        month: previousMonth,
        total_income: total_inc,
        total_expense: total_exp,
        net_income: {
          value: total_inc.value - total_exp.value,
          isComplete: total_inc.isComplete && total_exp.isComplete,
          missingDates: Array.from(new Set([...total_inc.missingDates, ...total_exp.missingDates]))
        },
        transaction_count: previousMonthTransactions.length,
      };
    })(),
    calculateNormalizedSum(yearToDateTransactions.filter(t => t.type === 'income'), displayCurrency),
    calculateNormalizedSum(yearToDateTransactions.filter(t => t.type === 'expense'), displayCurrency),
    calculateCategoryBreakdown(currentMonthTransactions, displayCurrency, 'income'),
    calculateCategoryBreakdown(currentMonthTransactions, displayCurrency, 'expense'),
  ]);

  // Inject metadata into breakdowns
  const categoryMetadataIncome = new Map(categoriesIncome.map(c => [c.name, c]));
  const categoryMetadataExpense = new Map(categoriesExpense.map(c => [c.name, c]));

  const incomeWithMeta = incomeBreakdown.map(b => ({
    ...b,
    icon: categoryMetadataIncome.get(b.category)?.icon || null,
    color: categoryMetadataIncome.get(b.category)?.color || null,
  }));

  const expenseWithMeta = expenseBreakdown.map(b => ({
    ...b,
    icon: categoryMetadataExpense.get(b.category)?.icon || null,
    color: categoryMetadataExpense.get(b.category)?.color || null,
  }));

  return {
    current_month: currentSummary,
    previous_month: previousSummary,
    year_to_date: {
      total_income: ytdIncome,
      total_expense: ytdExpense,
      net_income: {
        value: ytdIncome.value - ytdExpense.value,
        isComplete: ytdIncome.isComplete && ytdExpense.isComplete,
        missingDates: Array.from(new Set([...ytdIncome.missingDates, ...ytdExpense.missingDates]))
      },
    },
    income_by_category: incomeWithMeta,
    expense_by_category: expenseWithMeta,
    monthly_trends: trends,
    upcoming_expenses: upcomingExpenses,
    pending_transactions_count: pendingCountResult.count ?? 0,
  };
};

// =====================================================
// Advanced Analytics Methods
// =====================================================

/**
 * Get financial ratios and KPIs (Normalized)
 */
export const getFinancialRatiosNormalized = async (
  displayCurrency: string,
  month?: string
): Promise<FinancialRatios> => {
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const summary = await getMonthlySummaryNormalized(targetMonth, displayCurrency);

  // Calculate profit margin (using normalized values)
  const profit_margin =
    summary.total_income.value > 0
      ? ((summary.total_income.value - summary.total_expense.value) / summary.total_income.value) * 100
      : 0;

  // Calculate expense ratio
  const expense_ratio =
    summary.total_income.value > 0
      ? (summary.total_expense.value / summary.total_income.value) * 100
      : 0;

  // Get cash flow forecast (Normalized)
  const forecast = await getCashFlowForecastNormalized(displayCurrency);
  const cash_flow_forecast_30d = forecast.next_30_days;

  return {
    profit_margin,
    expense_ratio,
    budget_efficiency: 0, // Placeholder for now
    cash_flow_forecast_30d,
  };
};

/**
 * Get cash flow forecast for next 30 days (Normalized)
 */
export const getCashFlowForecastNormalized = async (
  displayCurrency: string
): Promise<CashFlowForecast> => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 30);

  const todayStr = today.toISOString().split('T')[0];

  // Get upcoming recurring expenses
  const recurringExpenses = await getUpcomingRecurringExpenses(30);
  
  // Normalize recurring expenses
  const projected_expenses_metric = await calculateNormalizedSum(
    recurringExpenses
      .filter(r => !r.is_overdue)
      .map(r => ({
        amount: r.recurring_expense.amount,
        currency: r.recurring_expense.currency || 'USD',
        date: todayStr
      })),
    displayCurrency
  );
  const projected_expenses = projected_expenses_metric.value;

  // Calculate average daily income from last 30 days
  const pastDate = new Date(today);
  pastDate.setDate(pastDate.getDate() - 30);
  const pastStr = pastDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('financial_transactions')
    .select('id, amount, currency, transaction_date, category, type, payment_status')
    .gte('transaction_date', pastStr)
    .lte('transaction_date', todayStr)
    .eq('type', 'income')
    .eq('payment_status', 'completed');

  if (error) {
    console.error('Error forecasting cash flow:', error);
    throw error;
  }

  const pastIncomeMetric = await calculateNormalizedSum(data || [], displayCurrency);
  const avgDailyIncome = pastIncomeMetric.value / 30;
  const projected_income = avgDailyIncome * 30;

  const next_30_days = projected_income - projected_expenses;

  // Determine confidence based on data availability
  let confidence: 'high' | 'medium' | 'low';
  if (data && data.length > 10 && recurringExpenses.length > 0) {
    confidence = 'high';
  } else if (data && data.length > 5) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    next_30_days,
    projected_income,
    projected_expenses,
    confidence,
  };
};

/**
 * Yearly Summary (Normalized)
 */
export interface NormalizedYearlySummary {
  year: number;
  total_income: CalculatedMetric;
  total_expense: CalculatedMetric;
  net_income: CalculatedMetric;
  profit_margin: number;
  months: NormalizedMonthlySummary[];
  previousYear?: NormalizedYearlySummary; // For year-over-year comparison
}

/**
 * Get yearly summary with 12 months of data (Normalized)
 */
export const getYearlySummaryNormalized = async (
  year: number,
  displayCurrency: string
): Promise<NormalizedYearlySummary> => {
  const targetYear = year || new Date().getFullYear();

  // Get monthly summaries for all 12 months in parallel
  const monthPromises = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthStr = `${targetYear}-${month.toString().padStart(2, '0')}`;
    return getMonthlySummaryNormalized(monthStr, displayCurrency);
  });

  const months = await Promise.all(monthPromises);

  // Calculate totals
  let totalIncomeVal = 0;
  let totalExpenseVal = 0;
  let isComplete = true;
  const missingDatesSet = new Set<string>();

  months.forEach(m => {
    totalIncomeVal += m.total_income.value;
    totalExpenseVal += m.total_expense.value;
    if (!m.total_income.isComplete || !m.total_expense.isComplete) {
      isComplete = false;
      m.total_income.missingDates.forEach(d => missingDatesSet.add(d));
      m.total_expense.missingDates.forEach(d => missingDatesSet.add(d));
    }
  });

  const netIncomeVal = totalIncomeVal - totalExpenseVal;
  const profit_margin = totalIncomeVal > 0 ? (netIncomeVal / totalIncomeVal) * 100 : 0;

  return {
    year: targetYear,
    total_income: { value: totalIncomeVal, isComplete, missingDates: Array.from(missingDatesSet) },
    total_expense: { value: totalExpenseVal, isComplete, missingDates: Array.from(missingDatesSet) },
    net_income: { value: netIncomeVal, isComplete, missingDates: Array.from(missingDatesSet) },
    profit_margin,
    months,
  };
};

/**
 * Get total transaction volume (sales volume) for a year
 * Sum of all sold property prices
 */
export const getTransactionVolumeNormalized = async (
  year: number,
  displayCurrency: string
): Promise<CalculatedMetric> => {
  try {
    const orgId = await getActiveOrgId();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data, error } = await supabase
      .from('properties')
      .select('sold_price, currency, sold_at')
      .eq('org_id', orgId)
      .not('sold_at', 'is', null)
      .not('sold_price', 'is', null)
      .gte('sold_at', startDate)
      .lte('sold_at', endDate)
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching transaction volume:', error);
      return { value: 0, isComplete: true, missingDates: [] };
    }

    if (!data || data.length === 0) {
      return { value: 0, isComplete: true, missingDates: [] };
    }

    void displayCurrency;
    let totalValue = 0;
    for (const property of data) {
      totalValue += Number(property.sold_price) || 0;
    }

    return {
      value: totalValue,
      isComplete: true,
      missingDates: [],
    };
  } catch (error) {
    console.error('Error in getTransactionVolumeNormalized:', error);
    return { value: 0, isComplete: true, missingDates: [] };
  }
};

/**
 * Get commission breakdown by property type (rental vs sale)
 */
export interface CommissionByPropertyType {
  rental: CalculatedMetric;
  sale: CalculatedMetric;
  total: CalculatedMetric;
}

export const getCommissionByPropertyType = async (
  year: number,
  displayCurrency: string
): Promise<CommissionByPropertyType> => {
  try {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const commissions = await commissionsService.getByDateRange(startDate, endDate);

    if (!commissions || commissions.length === 0) {
      return {
        rental: { value: 0, isComplete: true, missingDates: [] },
        sale: { value: 0, isComplete: true, missingDates: [] },
        total: { value: 0, isComplete: true, missingDates: [] }
      };
    }

    // Separate by type
    const rentalCommissions = commissions.filter(c => c.type === 'rental');
    const saleCommissions = commissions.filter(c => c.type === 'sale');

    // Calculate normalized sums
    const rentalMetric = await calculateNormalizedSum(rentalCommissions, displayCurrency);
    const saleMetric = await calculateNormalizedSum(saleCommissions, displayCurrency);

    const totalValue = rentalMetric.value + saleMetric.value;
    const isComplete = rentalMetric.isComplete && saleMetric.isComplete;
    const missingDates = [...rentalMetric.missingDates, ...saleMetric.missingDates];

    return {
      rental: rentalMetric,
      sale: saleMetric,
      total: {
        value: totalValue,
        isComplete,
        missingDates: Array.from(new Set(missingDates))
      }
    };
  } catch (error) {
    console.error('Error in getCommissionByPropertyType:', error);
    return {
      rental: { value: 0, isComplete: true, missingDates: [] },
      sale: { value: 0, isComplete: true, missingDates: [] },
      total: { value: 0, isComplete: true, missingDates: [] }
    };
  }
};

/**
 * Get average days to close (from listing to deal closure)
 */
export interface AverageDaysToClose {
  averageDays: number;
  medianDays: number;
  salesAverage: number;
  rentalsAverage: number;
  totalDeals: number;
}

export const getAverageDaysToClose = async (
  year: number
): Promise<AverageDaysToClose> => {
  try {
    const orgId = await getActiveOrgId();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Get sales: properties with sold_at in year
    const { data: salesData, error: salesError } = await supabase
      .from('properties')
      .select('created_at, sold_at')
      .eq('org_id', orgId)
      .not('sold_at', 'is', null)
      .gte('sold_at', startDate)
      .lte('sold_at', endDate)
      .is('deleted_at', null);

    if (salesError) {
      console.error('Error fetching sales data:', salesError);
    }

    // Get rentals: contracts with start_date in year
    const { data: contractsData, error: contractsError } = await supabase
      .from('contracts')
      .select('start_date, property:properties(created_at)')
      .eq('org_id', orgId)
      .gte('start_date', startDate)
      .lte('start_date', endDate)
      .is('deleted_at', null);

    if (contractsError) {
      console.error('Error fetching contracts data:', contractsError);
    }

    const daysToClose: number[] = [];
    const salesDays: number[] = [];
    const rentalsDays: number[] = [];

    // Calculate days for sales
    if (salesData) {
      salesData.forEach((property: PropertySoldRow) => {
        if (property.created_at && property.sold_at) {
          const created = new Date(property.created_at);
          const sold = new Date(property.sold_at);
          const days = Math.floor((sold.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          if (days >= 0) {
            daysToClose.push(days);
            salesDays.push(days);
          }
        }
      });
    }

    // Calculate days for rentals
    if (contractsData) {
      contractsData.forEach((contract: RentalContractWithProperty) => {
        const property = contract.property;
        if (property && property.created_at && contract.start_date) {
          const created = new Date(property.created_at);
          const start = new Date(contract.start_date);
          const days = Math.floor((start.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          if (days >= 0) {
            daysToClose.push(days);
            rentalsDays.push(days);
          }
        }
      });
    }

    // Calculate averages and median
    const calculateAverage = (arr: number[]) => {
      if (arr.length === 0) return 0;
      return Math.round(arr.reduce((sum, val) => sum + val, 0) / arr.length);
    };

    const calculateMedian = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
        : sorted[mid];
    };

    return {
      averageDays: calculateAverage(daysToClose),
      medianDays: calculateMedian(daysToClose),
      salesAverage: calculateAverage(salesDays),
      rentalsAverage: calculateAverage(rentalsDays),
      totalDeals: daysToClose.length,
    };
  } catch (error) {
    console.error('Error in getAverageDaysToClose:', error);
    return {
      averageDays: 0,
      medianDays: 0,
      salesAverage: 0,
      rentalsAverage: 0,
      totalDeals: 0,
    };
  }
};

/**
 * Get commission breakdown by client type (Owner, Tenant, Buyer)
 */
export interface CommissionByClientType {
  owner: CalculatedMetric;
  tenant: CalculatedMetric;
  buyer: CalculatedMetric;
  total: CalculatedMetric;
}

export const getCommissionByClientType = async (
  year: number,
  displayCurrency: string
): Promise<CommissionByClientType> => {
  try {
    const orgId = await getActiveOrgId();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Get commissions with property and contract data
    const { data: commissionsData, error: commissionsError } = await supabase
      .from('commissions')
      .select(`
        *,
        property:properties(
          id,
          property_type,
          buyer_name,
          owner_id
        ),
        contract:contracts(
          id,
          tenant_id
        )
      `)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .returns<CommissionClientTypeRow[]>();

    if (commissionsError) {
      console.error('Error fetching commissions:', commissionsError);
      return {
        owner: { value: 0, isComplete: true, missingDates: [] },
        tenant: { value: 0, isComplete: true, missingDates: [] },
        buyer: { value: 0, isComplete: true, missingDates: [] },
        total: { value: 0, isComplete: true, missingDates: [] }
      };
    }

    if (!commissionsData || commissionsData.length === 0) {
      return {
        owner: { value: 0, isComplete: true, missingDates: [] },
        tenant: { value: 0, isComplete: true, missingDates: [] },
        buyer: { value: 0, isComplete: true, missingDates: [] },
        total: { value: 0, isComplete: true, missingDates: [] }
      };
    }

    // Categorize commissions by client type
    const ownerCommissions: CommissionClientTypeRow[] = [];
    const tenantCommissions: CommissionClientTypeRow[] = [];
    const buyerCommissions: CommissionClientTypeRow[] = [];

    commissionsData.forEach((commission: CommissionClientTypeRow) => {
      const property = commission.property;
      const contract = commission.contract;

      if (commission.type === 'rental' && contract && contract.tenant_id) {
        // Rental with tenant = Tenant commission
        tenantCommissions.push(commission);
      } else if (commission.type === 'sale' && property && property.buyer_name) {
        // Sale with buyer = Buyer commission
        buyerCommissions.push(commission);
      } else {
        // All others = Owner commission (default)
        ownerCommissions.push(commission);
      }
    });

    // Calculate normalized sums
    const ownerMetric = await calculateNormalizedSum(ownerCommissions, displayCurrency);
    const tenantMetric = await calculateNormalizedSum(tenantCommissions, displayCurrency);
    const buyerMetric = await calculateNormalizedSum(buyerCommissions, displayCurrency);

    const totalValue = ownerMetric.value + tenantMetric.value + buyerMetric.value;
    const isComplete = ownerMetric.isComplete && tenantMetric.isComplete && buyerMetric.isComplete;
    const missingDates = [...ownerMetric.missingDates, ...tenantMetric.missingDates, ...buyerMetric.missingDates];

    return {
      owner: ownerMetric,
      tenant: tenantMetric,
      buyer: buyerMetric,
      total: {
        value: totalValue,
        isComplete,
        missingDates: Array.from(new Set(missingDates))
      }
    };
  } catch (error) {
    console.error('Error in getCommissionByClientType:', error);
    return {
      owner: { value: 0, isComplete: true, missingDates: [] },
      tenant: { value: 0, isComplete: true, missingDates: [] },
      buyer: { value: 0, isComplete: true, missingDates: [] },
      total: { value: 0, isComplete: true, missingDates: [] }
    };
  }
};

/**
 * Get Marketing ROI (Return on Investment)
 */
export interface MarketingROI {
  totalMarketingSpend: CalculatedMetric;
  commissionRevenue: CalculatedMetric;
  roi: number;
  byCategory: Array<{
    category: string;
    spend: CalculatedMetric;
    roi: number;
  }>;
}

export const getMarketingROI = async (
  year: number,
  displayCurrency: string
): Promise<MarketingROI> => {
  try {
    const orgId = await getActiveOrgId();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Marketing expense categories
    const marketingCategories = [
      'Digital Marketing',
      'Print Advertising',
      'Social Media Ads',
      'Website Maintenance',
      'Photography & Videography',
      'Signage & Branding'
    ];

    // Get marketing expenses
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('org_id', orgId)
      .eq('type', 'expense')
      .in('category', marketingCategories)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .is('deleted_at', null);

    if (transactionsError) {
      console.error('Error fetching marketing expenses:', transactionsError);
    }

    // Get commission revenue for the same period
    const commissions = await commissionsService.getByDateRange(startDate, endDate);

    // Calculate total marketing spend
    const marketingTransactions = (transactionsData || []).map((t: MarketingTransactionRow) => ({
      amount: t.amount,
      currency: t.currency,
      created_at: t.transaction_date || t.created_at,
    }));

    const totalMarketingSpend = await calculateNormalizedSum(marketingTransactions, displayCurrency);

    // Calculate commission revenue
    const commissionRevenue = await calculateNormalizedSum(commissions, displayCurrency);

    // Calculate ROI: ((Revenue - Expenses) / Expenses) × 100
    const roi = totalMarketingSpend.value > 0
      ? ((commissionRevenue.value - totalMarketingSpend.value) / totalMarketingSpend.value) * 100
      : 0;

    // Calculate by category
    const byCategory = await Promise.all(
      marketingCategories.map(async (category) => {
        const categoryTransactions = (transactionsData || []).filter(
          (t: MarketingTransactionRow) => t.category === category
        ).map((t: MarketingTransactionRow) => ({
          amount: t.amount,
          currency: t.currency,
          created_at: t.transaction_date || t.created_at,
        }));

        const categorySpend = await calculateNormalizedSum(categoryTransactions, displayCurrency);
        const categoryROI = categorySpend.value > 0
          ? ((commissionRevenue.value - categorySpend.value) / categorySpend.value) * 100
          : 0;

        return {
          category,
          spend: categorySpend,
          roi: categoryROI,
        };
      })
    );

    return {
      totalMarketingSpend,
      commissionRevenue,
      roi,
      byCategory,
    };
  } catch (error) {
    console.error('Error in getMarketingROI:', error);
    return {
      totalMarketingSpend: { value: 0, isComplete: true, missingDates: [] },
      commissionRevenue: { value: 0, isComplete: true, missingDates: [] },
      roi: 0,
      byCategory: [],
    };
  }
};

/**
 * Get conversion funnel metrics (Inquiry → Appointment → Contract)
 */
export interface ConversionFunnelMetrics {
  inquiries: number;
  appointments: number;
  contracts: number;
  rates: {
    leadToAppointment: number;
    appointmentToContract: number;
    overall: number;
  };
}

export const getConversionFunnelMetrics = async (
  year: number
): Promise<ConversionFunnelMetrics> => {
  try {
    const orgId = await getActiveOrgId();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Get inquiries created in year
    const { data: inquiriesData, error: inquiriesError } = await supabase
      .from('property_inquiries')
      .select('id, status')
      .eq('org_id', orgId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .is('deleted_at', null);

    if (inquiriesError) {
      console.error('Error fetching inquiries:', inquiriesError);
    }

    // Get inquiry matches to link inquiries to properties
    const inquiryIds = (inquiriesData || []).map((i: InquiryRow) => i.id);
    const { data: inquiryMatchesData, error: matchesError } = await supabase
      .from('inquiry_matches')
      .select('inquiry_id, property_id')
      .in('inquiry_id', inquiryIds.length > 0 ? inquiryIds : ['00000000-0000-0000-0000-000000000000']);

    if (matchesError) {
      console.error('Error fetching inquiry matches:', matchesError);
    }

    // Get meetings (appointments) in year
    const { data: meetingsData, error: meetingsError } = await supabase
      .from('meetings')
      .select('id, property_id, tenant_id, owner_id')
      .eq('org_id', orgId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .is('deleted_at', null);

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError);
    }

    // Get contracts created in year
    const { data: contractsData, error: contractsError } = await supabase
      .from('contracts')
      .select('id, property_id')
      .eq('org_id', orgId)
      .gte('start_date', startDate)
      .lte('start_date', endDate)
      .is('deleted_at', null);

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
    }

    const inquiries = (inquiriesData || []).length;
    const meetings = (meetingsData || []).length;
    const contracts = (contractsData || []).length;

    // Build maps for matching
    // Map inquiry_id -> property_ids (via inquiry_matches)
    const inquiryToProperties = new Map<string, Set<string>>();
    (inquiryMatchesData || []).forEach((match: InquiryMatchRow) => {
      if (!inquiryToProperties.has(match.inquiry_id)) {
        inquiryToProperties.set(match.inquiry_id, new Set());
      }
      if (match.property_id) {
        inquiryToProperties.get(match.inquiry_id)!.add(match.property_id);
      }
    });

    // Get property IDs from meetings
    const meetingPropertyIds = new Set((meetingsData || []).map((m: MeetingPropertyRow) => m.property_id).filter(Boolean));
    
    // Get property IDs from contracts
    const contractPropertyIds = new Set((contractsData || []).map((c: ContractPropertyRow) => c.property_id).filter(Boolean));

    // Count inquiries that have appointments
    // An inquiry has an appointment if:
    // 1. It has a matched property that has a meeting, OR
    // 2. Its status is 'contacted' or 'closed' (indicates contact was made)
    let inquiriesWithAppointments = 0;
    (inquiriesData || []).forEach((inquiry: InquiryRow) => {
      const inquiryProperties = inquiryToProperties.get(inquiry.id) || new Set();
      const hasMatchingMeeting = Array.from(inquiryProperties).some(propId => meetingPropertyIds.has(propId));
      const isContacted = inquiry.status === 'contacted' || inquiry.status === 'closed';
      
      if (hasMatchingMeeting || isContacted) {
        inquiriesWithAppointments++;
      }
    });

    // Count appointments that have contracts
    // An appointment (meeting) has a contract if its property_id is in contracts
    const appointmentsWithContracts = Array.from(meetingPropertyIds).filter(id => contractPropertyIds.has(id)).length;
    
    // Use the higher count for appointments (either from meetings or from contacted inquiries)
    const appointments = Math.max(inquiriesWithAppointments, meetings);

    // Calculate conversion rates
    const leadToAppointment = inquiries > 0 ? (appointments / inquiries) * 100 : 0;
    const appointmentToContract = appointments > 0 ? (appointmentsWithContracts / appointments) * 100 : 0;
    const overall = inquiries > 0 ? (contracts / inquiries) * 100 : 0;

    return {
      inquiries,
      appointments,
      contracts,
      rates: {
        leadToAppointment,
        appointmentToContract,
        overall,
      },
    };
  } catch (error) {
    console.error('Error in getConversionFunnelMetrics:', error);
    return {
      inquiries: 0,
      appointments: 0,
      contracts: 0,
      rates: {
        leadToAppointment: 0,
        appointmentToContract: 0,
        overall: 0,
      },
    };
  }
};

/**
 * Get top categories by spend or income (Normalized)
 */
export const getTopCategoriesNormalized = async (
  displayCurrency: string,
  type: 'income' | 'expense',
  limit: number = 5,
  month?: string
): Promise<TopCategory[]> => {
  let startDate: string | undefined;
  let endDate: string | undefined;

  if (month) {
    const [year, monthNum] = month.split('-').map(Number);
    startDate = `${month}-01`;
    endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];
  }

  // Use the new calculator for breakdown
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('id, amount, currency, transaction_date, category, type, payment_status')
    .gte('transaction_date', startDate || '1900-01-01')
    .lte('transaction_date', endDate || '2100-12-31')
    .eq('type', type)
    .eq('payment_status', 'completed');

  if (error) {
    console.error('Error fetching top categories:', error);
    throw error;
  }

  const transactions = data || [];
  const normalizedBreakdown = await calculateCategoryBreakdown(transactions, displayCurrency, type);

  // Get category metadata
  const categories = await getCategories(type);
  const categoryMetadata = new Map(categories.map(c => [c.name, c]));

  return normalizedBreakdown.slice(0, limit).map(cat => {
    const metadata = categoryMetadata.get(cat.category);
    return {
      category: cat.category,
      amount: cat.total_amount.value,
      percentage: cat.percentage,
      transaction_count: cat.transaction_count,
      type,
      icon: metadata?.icon || null,
      color: metadata?.color || null,
    };
  });
};

/**
 * Get monthly trends for the last N months (Normalized)
 */
export const getMonthlyTrendsNormalized = async (
  displayCurrency: string,
  months: number = 6
): Promise<MonthlyTrend[]> => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const monthPromises = Array.from({ length: months }, (_, i) => {
    const monthOffset = months - 1 - i;
    let targetMonth = currentMonth - monthOffset;
    let targetYear = currentYear;

    while (targetMonth < 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    const month = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

    return getMonthlySummaryNormalized(month, displayCurrency).then(summary => ({
      month,
      income: summary.total_income.value,
      expense: summary.total_expense.value,
      net: summary.net_income.value,
    }));
  });

  return Promise.all(monthPromises);
};

/**
 * Get budget vs actual comparison for expense categories (Normalized)
 */
export const getBudgetVsActualNormalized = async (
  month: string,
  displayCurrency: string
): Promise<BudgetVsActual[]> => {
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = `${month}-01`;
  const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

  const categories = await getCategories('expense');
  const categoriesWithBudget = categories.filter(c => c.monthly_budget && c.monthly_budget > 0);

  if (categoriesWithBudget.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .eq('type', 'expense')
    .eq('payment_status', 'completed');

  if (error) {
    console.error('Error fetching budget comparison:', error);
    throw error;
  }

  const transactions = data || [];
  const normalizedBreakdown = await calculateCategoryBreakdown(transactions as FinancialTransaction[], displayCurrency, 'expense');
  const actualByCategory = new Map(normalizedBreakdown.map(b => [b.category, b.total_amount.value]));

  // Convert all budgets to displayCurrency (budgets are stored in USD)
  const comparisons: BudgetVsActual[] = await Promise.all(
    categoriesWithBudget.map(async category => {
      const budgetedRaw = category.monthly_budget || 0;

      // Convert budget from USD to displayCurrency using end-of-month rate
      let budgeted = budgetedRaw;
      if (displayCurrency !== 'USD' && budgetedRaw > 0) {
        const budgetMetric = await calculateNormalizedSum(
          [{ amount: budgetedRaw, currency: 'USD', transaction_date: endDate }],
          displayCurrency
        );
        budgeted = budgetMetric.value;
      }

      const actual = actualByCategory.get(category.name) || 0;
      const difference = budgeted - actual;
      const percentage_difference = budgeted > 0 ? (difference / budgeted) * 100 : 0;

      let status: 'under' | 'over' | 'on_track';
      if (Math.abs(percentage_difference) < 5) {
        status = 'on_track';
      } else if (difference >= 0) {
        status = 'under';
      } else {
        status = 'over';
      }

      return {
        category: category.name,
        budgeted,
        actual,
        difference,
        percentage_difference,
        status,
        icon: category.icon,
        color: category.color,
      };
    })
  );

  return comparisons.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
};

// =====================================================
// Original (Legacy) Methods for Compatibility
// =====================================================

/**
 * Get monthly summary for a specific month
 * @deprecated Use getMonthlySummaryNormalized() instead. This method sums amounts without currency conversion.
 * @param month - Month in YYYY-MM format
 * @returns Monthly summary data
 */
export const getMonthlySummary = async (
  month: string
): Promise<MonthlySummary> => {
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = `${month}-01`;
  const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('financial_transactions')
    .select('type, amount, payment_status')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .eq('payment_status', 'completed');

  if (error) {
    console.error('Error fetching monthly summary:', error);
    throw error;
  }

  const transactions = data || [];

  const total_income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const total_expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    month,
    total_income,
    total_expense,
    net_income: total_income - total_expense,
    transaction_count: transactions.length,
  };
};

/**
 * Get category breakdown for a date range
 * @deprecated Use calculateCategoryBreakdown() from reportCalculator instead. This method sums amounts without currency conversion.
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @param type - Transaction type (income/expense)
 * @returns Array of category breakdowns
 */
export const getCategoryBreakdown = async (
  startDate: string,
  endDate: string,
  type: 'income' | 'expense'
): Promise<CategoryBreakdown[]> => {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('category, amount')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .eq('type', type)
    .eq('payment_status', 'completed');

  if (error) {
    console.error('Error fetching category breakdown:', error);
    throw error;
  }

  const transactions = data || [];

  // Group by category
  const categoryMap = new Map<string, { total: number; count: number }>();

  transactions.forEach(t => {
    const existing = categoryMap.get(t.category) || { total: 0, count: 0 };
    categoryMap.set(t.category, {
      total: existing.total + Number(t.amount),
      count: existing.count + 1,
    });
  });

  const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  // Get category metadata
  const categories = await getCategories(type);
  const categoryMetadata = new Map(categories.map(c => [c.name, c]));

  // Convert to array
  const breakdown: CategoryBreakdown[] = Array.from(categoryMap.entries()).map(
    ([category, stats]) => {
      const metadata = categoryMetadata.get(category);
      return {
        category,
        type,
        total_amount: stats.total,
        transaction_count: stats.count,
        percentage: totalAmount > 0 ? (stats.total / totalAmount) * 100 : 0,
        icon: metadata?.icon || null,
        color: metadata?.color || null,
      };
    }
  );

  // Sort by total amount descending
  return breakdown.sort((a, b) => b.total_amount - a.total_amount);
};

/**
 * Get monthly trends for the last N months
 * @deprecated Use getMonthlyTrendsNormalized() instead. This method sums amounts without currency conversion.
 */
export const getMonthlyTrends = async (
  months: number = 6
): Promise<MonthlyTrend[]> => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const monthPromises = Array.from({ length: months }, (_, i) => {
    const monthOffset = months - 1 - i;
    let targetMonth = currentMonth - monthOffset;
    let targetYear = currentYear;

    while (targetMonth < 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    const month = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

    return getMonthlySummary(month).then(summary => ({
      month,
      income: summary.total_income,
      expense: summary.total_expense,
      net: summary.net_income,
    }));
  });

  return Promise.all(monthPromises);
};

/**
 * Get comprehensive financial dashboard data
 * @deprecated Use getFinancialDashboardNormalized() instead. This method sums amounts without currency conversion.
 * @returns Dashboard summary with all metrics
 */
export const getFinancialDashboard = async (): Promise<FinancialDashboard> => {
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 7);

  const yearStart = `${today.getFullYear()}-01-01`;
  const yearEnd = today.toISOString().split('T')[0];

  // Calculate current month end date properly
  const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);
  const currentMonthEnd = new Date(currentYear, currentMonthNum, 0).toISOString().split('T')[0];

  // Fetch all data in parallel
  const [
    currentMonthSummary,
    previousMonthSummary,
    yearToDateTransactions,
    incomeBreakdown,
    expenseBreakdown,
    trends,
    upcomingExpenses,
    pendingCountResult,
  ] = await Promise.all([
    getMonthlySummary(currentMonth),
    getMonthlySummary(previousMonth),
    getTransactions({ start_date: yearStart, end_date: yearEnd, payment_status: 'completed' }),
    getCategoryBreakdown(currentMonth + '-01', currentMonthEnd, 'income'),
    getCategoryBreakdown(currentMonth + '-01', currentMonthEnd, 'expense'),
    getMonthlyTrends(6),
    getUpcomingRecurringExpenses(30),
    supabase
      .from('financial_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'pending'),
  ]);

  const pendingTransactionsCount = pendingCountResult.count ?? 0;

  const ytdIncome = yearToDateTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const ytdExpense = yearToDateTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    current_month: currentMonthSummary,
    previous_month: previousMonthSummary,
    year_to_date: {
      total_income: ytdIncome,
      total_expense: ytdExpense,
      net_income: ytdIncome - ytdExpense,
    },
    income_by_category: incomeBreakdown,
    expense_by_category: expenseBreakdown,
    monthly_trends: trends,
    upcoming_expenses: upcomingExpenses,
    pending_transactions_count: pendingTransactionsCount,
  };
};

/**
 * Get financial ratios and KPIs
 * @deprecated Use getFinancialRatiosNormalized() instead. This method sums amounts without currency conversion.
 */
export const getFinancialRatios = async (
  month?: string
): Promise<FinancialRatios> => {
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const summary = await getMonthlySummary(targetMonth);

  // Calculate profit margin
  const profit_margin =
    summary.total_income > 0
      ? ((summary.total_income - summary.total_expense) / summary.total_income) * 100
      : 0;

  // Calculate expense ratio
  const expense_ratio =
    summary.total_income > 0
      ? (summary.total_expense / summary.total_income) * 100
      : 0;

  return {
    profit_margin,
    expense_ratio,
    budget_efficiency: 0,
    cash_flow_forecast_30d: 0,
  };
};

/**
 * Get budget vs actual comparison for expense categories
 * @deprecated Use getBudgetVsActualNormalized() instead. This method sums amounts without currency conversion.
 */
export const getBudgetVsActual = async (
  month: string
): Promise<BudgetVsActual[]> => {
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = `${month}-01`;
  const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

  // Get all expense categories with budgets
  const categories = await getCategories('expense');
  const categoriesWithBudget = categories.filter(c => c.monthly_budget && c.monthly_budget > 0);

  if (categoriesWithBudget.length === 0) {
    return [];
  }

  // Get actual spending for the month
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('category, amount')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .eq('type', 'expense')
    .eq('payment_status', 'completed');

  if (error) {
    console.error('Error fetching budget comparison:', error);
    throw error;
  }

  const transactions = data || [];

  // Group actual spending by category
  const actualByCategory = new Map<string, number>();
  transactions.forEach(t => {
    const existing = actualByCategory.get(t.category) || 0;
    actualByCategory.set(t.category, existing + Number(t.amount));
  });

  // Build comparison array
  const comparisons: BudgetVsActual[] = categoriesWithBudget.map(category => {
    const budgeted = category.monthly_budget || 0;
    const actual = actualByCategory.get(category.name) || 0;
    const difference = budgeted - actual;
    const percentage_difference = budgeted > 0 ? (difference / budgeted) * 100 : 0;

    let status: 'under' | 'over' | 'on_track';
    if (Math.abs(percentage_difference) < 5) {
      status = 'on_track';
    } else if (difference >= 0) {
      status = 'under';
    } else {
      status = 'over';
    }

    return {
      category: category.name,
      budgeted,
      actual,
      difference,
      percentage_difference,
      status,
      icon: category.icon,
      color: category.color,
    };
  });

  // Sort by absolute difference (biggest variances first)
  return comparisons.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
};

/**
 * Get yearly summary with 12 months of data
 * @deprecated Use getYearlySummaryNormalized() instead. This method sums amounts without currency conversion.
 */
export const getYearlySummary = async (
  year?: number
): Promise<YearlySummary> => {
  const targetYear = year || new Date().getFullYear();

  // Get monthly summaries for all 12 months in parallel
  const monthPromises = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthStr = `${targetYear}-${month.toString().padStart(2, '0')}`;
    return getMonthlySummary(monthStr);
  });

  const months = await Promise.all(monthPromises);

  // Calculate totals
  const total_income = months.reduce((sum, m) => sum + m.total_income, 0);
  const total_expense = months.reduce((sum, m) => sum + m.total_expense, 0);
  const net_income = total_income - total_expense;
  const profit_margin = total_income > 0 ? (net_income / total_income) * 100 : 0;

  return {
    year: targetYear,
    total_income,
    total_expense,
    net_income,
    profit_margin,
    months,
  };
};

/**
 * Get top categories by spend or income
 * @deprecated Use getTopCategoriesNormalized() instead. This method sums amounts without currency conversion.
 */
export const getTopCategories = async (
  type: 'income' | 'expense',
  limit: number = 5,
  month?: string
): Promise<TopCategory[]> => {
  let startDate: string | undefined;
  let endDate: string | undefined;

  if (month) {
    const [year, monthNum] = month.split('-').map(Number);
    startDate = `${month}-01`;
    endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];
  }

  const breakdown = await getCategoryBreakdown(
    startDate || '1900-01-01',
    endDate || '2100-12-31',
    type
  );

  return breakdown.slice(0, limit).map(cat => ({
    category: cat.category,
    amount: cat.total_amount,
    percentage: cat.percentage,
    transaction_count: cat.transaction_count,
    type,
    icon: cat.icon,
    color: cat.color,
  }));
};

/**
 * Get cash flow forecast for next 30 days
 * @deprecated Use getCashFlowForecastNormalized() instead. This method sums amounts without currency conversion.
 */
export const getCashFlowForecast = async (): Promise<CashFlowForecast> => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 30);

  const todayStr = today.toISOString().split('T')[0];

  // Get upcoming recurring expenses
  const recurringExpenses = await getUpcomingRecurringExpenses(30);
  const projected_expenses = recurringExpenses
    .filter(r => !r.is_overdue)
    .reduce((sum, r) => sum + r.recurring_expense.amount, 0);

  // Calculate average daily income from last 30 days
  const pastDate = new Date(today);
  pastDate.setDate(pastDate.getDate() - 30);
  const pastStr = pastDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('financial_transactions')
    .select('amount')
    .gte('transaction_date', pastStr)
    .lte('transaction_date', todayStr)
    .eq('type', 'income')
    .eq('payment_status', 'completed');

  if (error) {
    console.error('Error forecasting cash flow:', error);
    throw error;
  }

  const pastIncome = (data || []).reduce((sum, t) => sum + Number(t.amount), 0);
  const avgDailyIncome = pastIncome / 30;
  const projected_income = avgDailyIncome * 30;

  const next_30_days = projected_income - projected_expenses;

  return {
    next_30_days,
    projected_income,
    projected_expenses,
    confidence: 'medium',
  };
};
