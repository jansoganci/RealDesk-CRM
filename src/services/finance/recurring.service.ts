// =====================================================
// Recurring Expenses Service
// CRUD and automation for recurring expenses
// =====================================================

import { supabase } from '../../config/supabase';
import { insertRow, updateRow } from '../../lib/db';
import { getAuthenticatedUserId } from '../../lib/auth';
import { createTransaction } from './transactions.service';
import type {
  RecurringExpense,
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
  RecurringExpenseFilters,
  UpcomingRecurringExpense,
  FinancialTransaction,
  PaymentMethod,
} from '../../types/financial';

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

// =====================================================
// Automation & Processing
// =====================================================

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

// =====================================================
// Aliases for backward compatibility
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
