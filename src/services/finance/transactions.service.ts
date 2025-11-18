// =====================================================
// Financial Transactions Service
// CRUD operations for financial transactions
// =====================================================

import { supabase } from '../../config/supabase';
import { insertRow, updateRow } from '../../lib/db';
import { getAuthenticatedUserId } from '../../lib/auth';
import type {
  FinancialTransaction,
  CreateFinancialTransactionInput,
  UpdateFinancialTransactionInput,
  TransactionFilters,
} from '../../types/financial';

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
