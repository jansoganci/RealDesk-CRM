// =====================================================
// Financial Analytics Service
// Reports, trends, and dashboard data
// =====================================================

import { supabase } from '../../config/supabase';
import { getTransactions } from './transactions.service';
import { getCategories } from './categories.service';
import { getUpcomingRecurringExpenses } from './recurring.service';
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
} from '../../types/financial';

// =====================================================
// Analytics and Summary Methods
// =====================================================

/**
 * Get monthly summary for a specific month
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
 * @param months - Number of months to retrieve (default: 6)
 * @returns Array of monthly trends
 */
export const getMonthlyTrends = async (
  months: number = 6
): Promise<MonthlyTrend[]> => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed (0 = January, 10 = November)

  // Get all monthly summaries in parallel (much faster!)
  const monthPromises = Array.from({ length: months }, (_, i) => {
    // Calculate the month offset from current month
    // i=0 should be (months-1) months ago, i=(months-1) should be current month
    const monthOffset = months - 1 - i;

    // Calculate year and month
    let targetMonth = currentMonth - monthOffset;
    let targetYear = currentYear;

    // Handle year rollover for negative months
    while (targetMonth < 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    // Format as YYYY-MM
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

// =====================================================
// Advanced Analytics Methods
// =====================================================

/**
 * Get financial ratios and KPIs
 * @param month - Month in YYYY-MM format (defaults to current month)
 * @returns Financial ratios object
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

  // Get budget vs actual for efficiency calculation
  const budgetComparison = await getBudgetVsActual(targetMonth);
  const totalBudgeted = budgetComparison.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalActual = budgetComparison.reduce((sum, cat) => sum + cat.actual, 0);

  const budget_efficiency =
    totalBudgeted > 0
      ? ((totalBudgeted - totalActual) / totalBudgeted) * 100
      : 0;

  // Get cash flow forecast
  const forecast = await getCashFlowForecast();
  const cash_flow_forecast_30d = forecast.next_30_days;

  return {
    profit_margin,
    expense_ratio,
    budget_efficiency,
    cash_flow_forecast_30d,
  };
};

/**
 * Get budget vs actual comparison for expense categories
 * @param month - Month in YYYY-MM format
 * @returns Array of budget comparisons
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
 * @param year - Year (defaults to current year)
 * @returns Yearly summary data
 */
export const getYearlySummary = async (
  year?: number
): Promise<YearlySummary> => {
  const targetYear = year || new Date().getFullYear();

  // Get monthly summaries for all 12 months in parallel (much faster!)
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
 * @param type - Transaction type (income or expense)
 * @param limit - Number of top categories to return (default: 5)
 * @param month - Optional month filter (YYYY-MM format)
 * @returns Array of top categories
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
 * @returns Cash flow forecast
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
