// =====================================================
// Financial Types
// Phase 1: Finance Database Foundation
// =====================================================
// Purpose: TypeScript type definitions for financial
// tracking tables and related entities
// =====================================================

// =====================================================
// Enums and Constants
// =====================================================

export type TransactionType = 'income' | 'expense';
export type PaymentStatus = 'completed' | 'pending' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'check';
export type RecurringFrequency = 'monthly' | 'quarterly' | 'yearly';

// =====================================================
// Financial Transaction Types
// =====================================================

export interface FinancialTransaction {
  id: string;
  user_id: string;

  // Transaction Core Details
  transaction_date: string; // ISO date string
  type: TransactionType;
  category: string;
  subcategory: string | null;

  // Amount Information
  amount: number;
  currency: string;

  // Description & Notes
  description: string;
  notes: string | null;

  // Payment Information
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;

  // Optional References to Other Entities
  property_id: string | null;
  contract_id: string | null;
  commission_id: string | null;

  // Attachment Support
  receipt_url: string | null;
  invoice_number: string | null;

  // Recurring Transaction Support
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  recurring_day: number | null;
  recurring_end_date: string | null; // ISO date string
  parent_transaction_id: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface CreateFinancialTransactionInput {
  transaction_date: string;
  type: TransactionType;
  category: string;
  subcategory?: string | null;
  amount: number;
  currency?: string;
  description: string;
  notes?: string | null;
  payment_method?: PaymentMethod | null;
  payment_status?: PaymentStatus;
  property_id?: string | null;
  contract_id?: string | null;
  commission_id?: string | null;
  receipt_url?: string | null;
  invoice_number?: string | null;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency | null;
  recurring_day?: number | null;
  recurring_end_date?: string | null;
  parent_transaction_id?: string | null;
}

export interface UpdateFinancialTransactionInput {
  transaction_date?: string;
  type?: TransactionType;
  category?: string;
  subcategory?: string | null;
  amount?: number;
  currency?: string;
  description?: string;
  notes?: string | null;
  payment_method?: PaymentMethod | null;
  payment_status?: PaymentStatus;
  property_id?: string | null;
  contract_id?: string | null;
  commission_id?: string | null;
  receipt_url?: string | null;
  invoice_number?: string | null;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency | null;
  recurring_day?: number | null;
  recurring_end_date?: string | null;
}

// =====================================================
// Expense Category Types
// =====================================================

export interface ExpenseCategory {
  id: string;
  user_id: string | null;

  // Category Details
  name: string;
  type: TransactionType;
  parent_category: string | null;

  // Budget Tracking
  monthly_budget: number | null;

  // Display & UI
  icon: string | null;
  color: string | null;

  // System vs User Categories
  is_default: boolean;
  is_active: boolean;

  // Metadata
  created_at: string;
}

export interface CreateExpenseCategoryInput {
  name: string;
  type: TransactionType;
  parent_category?: string | null;
  monthly_budget?: number | null;
  icon?: string | null;
  color?: string | null;
  is_active?: boolean;
}

export interface UpdateExpenseCategoryInput {
  name?: string;
  type?: TransactionType;
  parent_category?: string | null;
  monthly_budget?: number | null;
  icon?: string | null;
  color?: string | null;
  is_active?: boolean;
}

// =====================================================
// Recurring Expense Types
// =====================================================

export interface RecurringExpense {
  id: string;
  user_id: string;

  // Recurring Expense Details
  name: string;
  description: string | null;
  category: string;

  // Amount Information
  amount: number;
  currency: string;

  // Recurrence Configuration
  frequency: RecurringFrequency;
  day_of_month: number | null;
  start_date: string; // ISO date string
  end_date: string | null; // ISO date string

  // Tracking
  next_due_date: string; // ISO date string
  last_generated_date: string | null; // ISO date string

  // Payment Details
  payment_method: PaymentMethod | null;

  // Automation Settings
  is_active: boolean;
  auto_create_transaction: boolean;
  reminder_days_before: number | null;

  // Additional Information
  notes: string | null;
  vendor_name: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringExpenseInput {
  name: string;
  description?: string | null;
  category: string;
  amount: number;
  currency?: string;
  frequency: RecurringFrequency;
  day_of_month?: number | null;
  start_date: string;
  end_date?: string | null;
  payment_method?: PaymentMethod | null;
  is_active?: boolean;
  auto_create_transaction?: boolean;
  reminder_days_before?: number | null;
  notes?: string | null;
  vendor_name?: string | null;
}

export interface UpdateRecurringExpenseInput {
  name?: string;
  description?: string | null;
  category?: string;
  amount?: number;
  currency?: string;
  frequency?: RecurringFrequency;
  day_of_month?: number | null;
  start_date?: string;
  end_date?: string | null;
  next_due_date?: string;
  last_generated_date?: string | null;
  payment_method?: PaymentMethod | null;
  is_active?: boolean;
  auto_create_transaction?: boolean;
  reminder_days_before?: number | null;
  notes?: string | null;
  vendor_name?: string | null;
}

// =====================================================
// Query and Filter Types
// =====================================================

export interface TransactionFilters {
  type?: TransactionType;
  category?: string;
  payment_status?: PaymentStatus;
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  property_id?: string;
  contract_id?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface RecurringExpenseFilters {
  category?: string;
  frequency?: RecurringFrequency;
  is_active?: boolean;
  auto_create_transaction?: boolean;
}

// =====================================================
// Analytics and Summary Types
// =====================================================

export interface MonthlySummary {
  month: string; // Format: YYYY-MM
  total_income: number;
  total_expense: number;
  net_income: number;
  transaction_count: number;
}

export interface CategoryBreakdown {
  category: string;
  type: TransactionType;
  total_amount: number;
  transaction_count: number;
  percentage: number; // Percentage of total for this type
  icon?: string | null;
  color?: string | null;
}

export interface MonthlyTrend {
  month: string; // Format: YYYY-MM
  income: number;
  expense: number;
  net: number;
}

export interface UpcomingRecurringExpense {
  recurring_expense: RecurringExpense;
  days_until_due: number;
  is_overdue: boolean;
}

// =====================================================
// Dashboard Summary Type
// =====================================================

export interface FinancialDashboard {
  current_month: MonthlySummary;
  previous_month: MonthlySummary;
  year_to_date: {
    total_income: number;
    total_expense: number;
    net_income: number;
  };
  income_by_category: CategoryBreakdown[];
  expense_by_category: CategoryBreakdown[];
  monthly_trends: MonthlyTrend[]; // Last 6 months
  upcoming_expenses: UpcomingRecurringExpense[];
  pending_transactions_count: number; // Count of transactions with payment_status = 'pending'
}

// =====================================================
// Phase 3: Analytics Types
// =====================================================

export interface FinancialRatios {
  profit_margin: number; // Percentage: (revenue - expenses) / revenue * 100
  expense_ratio: number; // Percentage: expenses / revenue * 100
  budget_efficiency: number; // Percentage: (budgeted - actual) / budgeted * 100
  cash_flow_forecast_30d: number; // Projected net income for next 30 days
}

export interface BudgetVsActual {
  category: string;
  budgeted: number;
  actual: number;
  difference: number;
  percentage_difference: number; // Negative = over budget
  status: 'under' | 'over' | 'on_track';
  icon?: string | null;
  color?: string | null;
}

export interface YearlySummary {
  year: number;
  total_income: number;
  total_expense: number;
  net_income: number;
  profit_margin: number;
  months: MonthlySummary[];
}

export interface TopCategory {
  category: string;
  amount: number;
  percentage: number;
  transaction_count: number;
  type: TransactionType;
  icon?: string | null;
  color?: string | null;
}

export interface CashFlowForecast {
  next_30_days: number;
  projected_income: number;
  projected_expenses: number;
  confidence: 'high' | 'medium' | 'low';
}
