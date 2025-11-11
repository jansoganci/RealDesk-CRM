// =====================================================
// Financial Transactions Service
// Phase 2: Finance Service Logic Implementation
// =====================================================
// Purpose: Service layer for financial tracking with
// full Supabase integration
// =====================================================

import { supabase } from '../config/supabase';
import { insertRow, updateRow } from '../lib/db';
import { getAuthenticatedUserId } from '../lib/auth';
import type {
  FinancialTransaction,
  CreateFinancialTransactionInput,
  UpdateFinancialTransactionInput,
  ExpenseCategory,
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
  RecurringExpense,
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
  TransactionFilters,
  RecurringExpenseFilters,
  MonthlySummary,
  CategoryBreakdown,
  MonthlyTrend,
  UpcomingRecurringExpense,
  FinancialDashboard,
  FinancialRatios,
  BudgetVsActual,
  YearlySummary,
  TopCategory,
  CashFlowForecast,
  PaymentMethod,
} from '../types/financial';

const normalizePaymentMethod = (
  method: string | null | undefined
): PaymentMethod | null => {
  if (!method) return null;
  if (method === 'cash' || method === 'bank_transfer' || method === 'credit_card' || method === 'check') {
    return method;
  }
  return null;
};

// =====================================================
// Financial Transactions CRUD
// =====================================================

/**
 * Get all financial transactions for the current user
 * @param filters - Optional filters to apply
 * @returns Array of financial transactions
 */
export const getTransactions = async (
  filters?: TransactionFilters
): Promise<FinancialTransaction[]> => {
  let query = supabase
    .from('financial_transactions')
    .select('*')
    .order('transaction_date', { ascending: false });

  // Apply filters
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.payment_status) {
    query = query.eq('payment_status', filters.payment_status);
  }
  if (filters?.start_date) {
    query = query.gte('transaction_date', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('transaction_date', filters.end_date);
  }
  if (filters?.property_id) {
    query = query.eq('property_id', filters.property_id);
  }
  if (filters?.contract_id) {
    query = query.eq('contract_id', filters.contract_id);
  }
  if (filters?.min_amount !== undefined) {
    query = query.gte('amount', filters.min_amount);
  }
  if (filters?.max_amount !== undefined) {
    query = query.lte('amount', filters.max_amount);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }

  return (data || []) as FinancialTransaction[];
};

/**
 * Get a single financial transaction by ID
 * @param id - Transaction ID
 * @returns Financial transaction or null
 */
export const getTransactionById = async (
  id: string
): Promise<FinancialTransaction | null> => {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }

  return data as FinancialTransaction | null;
};

/**
 * Create a new financial transaction
 * @param data - Transaction data
 * @returns Created transaction
 */
export const createTransaction = async (
  data: CreateFinancialTransactionInput
): Promise<FinancialTransaction> => {
  const userId = await getAuthenticatedUserId();

  const transaction = await insertRow('financial_transactions', {
    user_id: userId,
    transaction_date: data.transaction_date,
    type: data.type,
    category: data.category,
    subcategory: data.subcategory || null,
    amount: data.amount,
    currency: data.currency || 'TRY',
    description: data.description,
    notes: data.notes || null,
    payment_method: data.payment_method || null,
    payment_status: data.payment_status || 'completed',
    property_id: data.property_id || null,
    contract_id: data.contract_id || null,
    commission_id: data.commission_id || null,
    receipt_url: data.receipt_url || null,
    invoice_number: data.invoice_number || null,
    is_recurring: data.is_recurring || false,
    recurring_frequency: data.recurring_frequency || null,
    recurring_day: data.recurring_day || null,
    recurring_end_date: data.recurring_end_date || null,
    parent_transaction_id: data.parent_transaction_id || null,
  });

  return transaction as FinancialTransaction;
};

/**
 * Update an existing financial transaction
 * @param id - Transaction ID
 * @param data - Updated transaction data
 * @returns Updated transaction
 */
export const updateTransaction = async (
  id: string,
  data: UpdateFinancialTransactionInput
): Promise<FinancialTransaction> => {
  const transaction = await updateRow('financial_transactions', id, {
    transaction_date: data.transaction_date,
    type: data.type,
    category: data.category,
    subcategory: data.subcategory,
    amount: data.amount,
    currency: data.currency,
    description: data.description,
    notes: data.notes,
    payment_method: data.payment_method,
    payment_status: data.payment_status,
    property_id: data.property_id,
    contract_id: data.contract_id,
    commission_id: data.commission_id,
    receipt_url: data.receipt_url,
    invoice_number: data.invoice_number,
    is_recurring: data.is_recurring,
    recurring_frequency: data.recurring_frequency,
    recurring_day: data.recurring_day,
    recurring_end_date: data.recurring_end_date,
  });

  return transaction as FinancialTransaction;
};

/**
 * Delete a financial transaction
 * @param id - Transaction ID
 * @returns True if deleted successfully
 */
export const deleteTransaction = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }

  return true;
};

// =====================================================
// Expense Categories CRUD
// =====================================================

/**
 * Get all expense categories (default + user's custom)
 * @param type - Optional filter by type (income/expense)
 * @returns Array of expense categories
 */
export const getCategories = async (
  type?: 'income' | 'expense'
): Promise<ExpenseCategory[]> => {
  let query = supabase
    .from('expense_categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return (data || []) as ExpenseCategory[];
};

/**
 * Get a single category by ID
 * @param id - Category ID
 * @returns Expense category or null
 */
export const getCategoryById = async (
  id: string
): Promise<ExpenseCategory | null> => {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching category:', error);
    throw error;
  }

  return data as ExpenseCategory | null;
};

/**
 * Create a new custom expense category
 * @param data - Category data
 * @returns Created category
 */
export const createCategory = async (
  data: CreateExpenseCategoryInput
): Promise<ExpenseCategory> => {
  const userId = await getAuthenticatedUserId();

  const category = await insertRow('expense_categories', {
    user_id: userId,
    name: data.name,
    type: data.type,
    parent_category: data.parent_category || null,
    monthly_budget: data.monthly_budget || null,
    icon: data.icon || null,
    color: data.color || null,
    is_default: false,
    is_active: data.is_active !== undefined ? data.is_active : true,
  });

  return category as ExpenseCategory;
};

/**
 * Update a custom expense category
 * @param id - Category ID
 * @param data - Updated category data
 * @returns Updated category
 */
export const updateCategory = async (
  id: string,
  data: UpdateExpenseCategoryInput
): Promise<ExpenseCategory> => {
  const category = await updateRow('expense_categories', id, {
    name: data.name,
    type: data.type,
    parent_category: data.parent_category,
    monthly_budget: data.monthly_budget,
    icon: data.icon,
    color: data.color,
    is_active: data.is_active,
  });

  return category as ExpenseCategory;
};

/**
 * Delete a custom expense category
 * @param id - Category ID
 * @returns True if deleted successfully
 */
export const deleteCategory = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('expense_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }

  return true;
};

// =====================================================
// Recurring Expenses CRUD
// =====================================================

/**
 * Get all recurring expenses for the current user
 * @param filters - Optional filters to apply
 * @returns Array of recurring expenses
 */
export const getRecurringExpenses = async (
  filters?: RecurringExpenseFilters
): Promise<RecurringExpense[]> => {
  let query = supabase
    .from('recurring_expenses')
    .select('*')
    .order('next_due_date', { ascending: true });

  // Apply filters
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.frequency) {
    query = query.eq('frequency', filters.frequency);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }
  if (filters?.auto_create_transaction !== undefined) {
    query = query.eq('auto_create_transaction', filters.auto_create_transaction);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching recurring expenses:', error);
    throw error;
  }

  return (data || []) as RecurringExpense[];
};

/**
 * Get a single recurring expense by ID
 * @param id - Recurring expense ID
 * @returns Recurring expense or null
 */
export const getRecurringExpenseById = async (
  id: string
): Promise<RecurringExpense | null> => {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching recurring expense:', error);
    throw error;
  }

  return data as RecurringExpense | null;
};

/**
 * Create a new recurring expense
 * @param data - Recurring expense data
 * @returns Created recurring expense
 */
export const createRecurringExpense = async (
  data: CreateRecurringExpenseInput
): Promise<RecurringExpense> => {
  const userId = await getAuthenticatedUserId();

  const recurringExpense = await insertRow('recurring_expenses', {
    user_id: userId,
    name: data.name,
    description: data.description || null,
    category: data.category,
    amount: data.amount,
    currency: data.currency || 'TRY',
    frequency: data.frequency,
    day_of_month: data.day_of_month || null,
    start_date: data.start_date,
    end_date: data.end_date || null,
    next_due_date: data.start_date, // Initially set to start_date
    payment_method: data.payment_method || null,
    is_active: data.is_active !== undefined ? data.is_active : true,
    auto_create_transaction: data.auto_create_transaction !== undefined ? data.auto_create_transaction : true,
    reminder_days_before: data.reminder_days_before !== undefined ? data.reminder_days_before : 3,
    notes: data.notes || null,
    vendor_name: data.vendor_name || null,
  });

  return recurringExpense as RecurringExpense;
};

/**
 * Update an existing recurring expense
 * @param id - Recurring expense ID
 * @param data - Updated recurring expense data
 * @returns Updated recurring expense
 */
export const updateRecurringExpense = async (
  id: string,
  data: UpdateRecurringExpenseInput
): Promise<RecurringExpense> => {
  const recurringExpense = await updateRow('recurring_expenses', id, {
    name: data.name,
    description: data.description,
    category: data.category,
    amount: data.amount,
    currency: data.currency,
    frequency: data.frequency,
    day_of_month: data.day_of_month,
    start_date: data.start_date,
    end_date: data.end_date,
    next_due_date: data.next_due_date,
    last_generated_date: data.last_generated_date,
    payment_method: data.payment_method,
    is_active: data.is_active,
    auto_create_transaction: data.auto_create_transaction,
    reminder_days_before: data.reminder_days_before,
    notes: data.notes,
    vendor_name: data.vendor_name,
  });

  return recurringExpense as RecurringExpense;
};

/**
 * Delete a recurring expense
 * @param id - Recurring expense ID
 * @returns True if deleted successfully
 */
export const deleteRecurringExpense = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('recurring_expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting recurring expense:', error);
    throw error;
  }

  return true;
};

/**
 * Process due recurring expenses and create transactions
 * This should be called periodically (e.g., daily cron job)
 * @returns Number of transactions created
 */
export const processDueRecurringExpenses = async (): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];

  // Get all active recurring expenses due today or earlier
  const { data: dueExpenses, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('is_active', true)
    .eq('auto_create_transaction', true)
    .lte('next_due_date', today);

  if (error) {
    console.error('Error fetching due recurring expenses:', error);
    throw error;
  }

  if (!dueExpenses || dueExpenses.length === 0) {
    return 0;
  }

  let transactionsCreated = 0;

  for (const expense of dueExpenses) {
    try {
      // Create transaction
      const paymentMethod = normalizePaymentMethod(expense.payment_method);

      await createTransaction({
        transaction_date: expense.next_due_date,
        type: 'expense',
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency,
        description: `${expense.name} (Recurring)`,
        notes: expense.notes || undefined,
        payment_method: paymentMethod ?? undefined,
        payment_status: 'pending',
      });

      // Calculate next due date using database function
      const { data: nextDate } = await supabase.rpc('calculate_next_due_date', {
        current_due_date: expense.next_due_date,
        freq: expense.frequency,
        day_of_month: expense.day_of_month,
      });

      // Update recurring expense
      await updateRecurringExpense(expense.id, {
        next_due_date: nextDate || expense.next_due_date,
        last_generated_date: today,
      });

      transactionsCreated++;
    } catch (err) {
      console.error(`Error processing recurring expense ${expense.id}:`, err);
    }
  }

  return transactionsCreated;
};

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
  const trends: MonthlyTrend[] = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const month = date.toISOString().slice(0, 7); // YYYY-MM

    const summary = await getMonthlySummary(month);

    trends.push({
      month,
      income: summary.total_income,
      expense: summary.total_expense,
      net: summary.net_income,
    });
  }

  return trends;
};

/**
 * Get upcoming recurring expenses due soon
 * @param daysAhead - Number of days to look ahead (default: 30)
 * @returns Array of upcoming recurring expenses
 */
export const getUpcomingRecurringExpenses = async (
  daysAhead: number = 30
): Promise<UpcomingRecurringExpense[]> => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const todayStr = today.toISOString().split('T')[0];
  const futureStr = futureDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('is_active', true)
    .lte('next_due_date', futureStr)
    .order('next_due_date', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming recurring expenses:', error);
    throw error;
  }

  const expenses = data || [];

  return expenses.map(expense => {
    const dueDate = new Date(expense.next_due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      recurring_expense: expense as RecurringExpense,
      days_until_due: diffDays,
      is_overdue: expense.next_due_date < todayStr,
    };
  });
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
  ] = await Promise.all([
    getMonthlySummary(currentMonth),
    getMonthlySummary(previousMonth),
    getTransactions({ start_date: yearStart, end_date: yearEnd, payment_status: 'completed' }),
    getCategoryBreakdown(currentMonth + '-01', currentMonthEnd, 'income'),
    getCategoryBreakdown(currentMonth + '-01', currentMonthEnd, 'expense'),
    getMonthlyTrends(6),
    getUpcomingRecurringExpenses(30),
  ]);

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
  };
};

// =====================================================
// Utility Methods
// =====================================================

/**
 * Calculate next due date for a recurring expense
 * @param currentDate - Current due date
 * @param frequency - Recurrence frequency
 * @param dayOfMonth - Optional specific day of month
 * @returns Next due date (ISO string)
 */
export const calculateNextDueDate = async (
  currentDate: string,
  frequency: 'monthly' | 'quarterly' | 'yearly',
  dayOfMonth?: number | null
): Promise<string> => {
  const { data, error } = await supabase.rpc('calculate_next_due_date', {
    current_due_date: currentDate,
    freq: frequency,
    day_of_month: dayOfMonth || null,
  });

  if (error) {
    console.error('Error calculating next due date:', error);
    throw error;
  }

  return data ?? currentDate;
};

/**
 * Export transactions to CSV
 * @param filters - Optional filters to apply
 * @returns CSV string
 */
export const exportTransactionsToCSV = async (
  filters?: TransactionFilters
): Promise<string> => {
  const transactions = await getTransactions(filters);

  if (transactions.length === 0) {
    return 'No transactions to export';
  }

  // CSV Headers
  const headers = [
    'Date',
    'Type',
    'Category',
    'Subcategory',
    'Description',
    'Amount',
    'Currency',
    'Payment Method',
    'Payment Status',
    'Notes',
  ];

  // CSV Rows
  const rows = transactions.map(t => [
    t.transaction_date,
    t.type,
    t.category,
    t.subcategory || '',
    t.description,
    t.amount.toString(),
    t.currency,
    t.payment_method || '',
    t.payment_status,
    t.notes || '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csvContent;
};

// =====================================================
// Phase 3: Advanced Analytics Methods
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

  // Get monthly summaries for all 12 months
  const months: MonthlySummary[] = [];
  for (let month = 1; month <= 12; month++) {
    const monthStr = `${targetYear}-${month.toString().padStart(2, '0')}`;
    const summary = await getMonthlySummary(monthStr);
    months.push(summary);
  }

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

// =====================================================
// Phase 4: Automation & Reminders
// =====================================================

/**
 * Generate recurring transactions (alias for processDueRecurringExpenses)
 * Creates transactions for all due recurring expenses
 * @returns Number of transactions created
 */
export const generateRecurringTransactions = processDueRecurringExpenses;

/**
 * Get upcoming bills (alias for getUpcomingRecurringExpenses)
 * @param days - Number of days to look ahead
 * @returns Array of upcoming recurring expenses
 */
export const getUpcomingBills = getUpcomingRecurringExpenses;

/**
 * Mark a recurring bill as paid by creating a completed transaction
 * @param recurringExpenseId - ID of the recurring expense
 * @returns Created transaction
 */
export const markBillAsPaid = async (
  recurringExpenseId: string
): Promise<FinancialTransaction> => {
  // Get the recurring expense
  const expense = await getRecurringExpenseById(recurringExpenseId);

  if (!expense) {
    throw new Error('Recurring expense not found');
  }

  // Create a completed transaction
  const paymentMethod = normalizePaymentMethod(expense.payment_method);

  const transaction = await createTransaction({
    transaction_date: expense.next_due_date,
    type: 'expense',
    category: expense.category,
    amount: expense.amount,
    currency: expense.currency,
    description: `${expense.name} (Paid)`,
    notes: expense.notes || undefined,
    payment_method: paymentMethod ?? undefined,
    payment_status: 'completed',
  });

  // Calculate next due date using database function
  const { data: nextDate } = await supabase.rpc('calculate_next_due_date', {
    current_due_date: expense.next_due_date,
    freq: expense.frequency,
    day_of_month: expense.day_of_month,
  });

  // Update recurring expense
  await updateRecurringExpense(expense.id, {
    next_due_date: nextDate || expense.next_due_date,
    last_generated_date: new Date().toISOString().split('T')[0],
  });

  return transaction;
};
