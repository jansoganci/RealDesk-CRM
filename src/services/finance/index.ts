// =====================================================
// Finance Services - Barrel Export
// Re-exports all finance-related services
// =====================================================

// Transactions CRUD
export {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactionsToCSV,
} from './transactions.service';

// Categories CRUD
export {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categories.service';

// Recurring Expenses
export {
  getRecurringExpenses,
  getRecurringExpenseById,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  processDueRecurringExpenses,
  getUpcomingRecurringExpenses,
  calculateNextDueDate,
  generateRecurringTransactions,
  getUpcomingBills,
  markBillAsPaid,
} from './recurring.service';

// Analytics & Reports
export {
  getMonthlySummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getFinancialDashboard,
  getFinancialRatios,
  getBudgetVsActual,
  getYearlySummary,
  getTopCategories,
  getCashFlowForecast,
} from './analytics.service';
