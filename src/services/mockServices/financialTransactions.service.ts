// =====================================================
// Mock Financial Transactions Service
// Phase 2: Finance Service - Demo Mode
// =====================================================
// Purpose: In-memory service for demo mode with
// realistic sample financial data
// =====================================================

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
} from '../../types/financial';

// =====================================================
// Mock Data Store
// =====================================================

class MockFinancialTransactionsService {
  private transactions: FinancialTransaction[] = [];
  private categories: ExpenseCategory[] = [];
  private recurringExpenses: RecurringExpense[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize categories (subset of defaults for demo)
    this.categories = [
      // Income categories
      {
        id: 'cat-1',
        user_id: null,
        name: 'Rental Commissions',
        type: 'income',
        parent_category: null,
        monthly_budget: null,
        icon: 'home',
        color: '#10b981',
        is_default: true,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cat-2',
        user_id: null,
        name: 'Sale Commissions',
        type: 'income',
        parent_category: null,
        monthly_budget: null,
        icon: 'trending-up',
        color: '#3b82f6',
        is_default: true,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cat-3',
        user_id: null,
        name: 'Monthly Rent',
        type: 'income',
        parent_category: null,
        monthly_budget: null,
        icon: 'calendar',
        color: '#8b5cf6',
        is_default: true,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      // Expense categories
      {
        id: 'cat-4',
        user_id: null,
        name: 'Office Rent',
        type: 'expense',
        parent_category: null,
        monthly_budget: 15000,
        icon: 'building',
        color: '#ef4444',
        is_default: true,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cat-5',
        user_id: null,
        name: 'Electricity',
        type: 'expense',
        parent_category: null,
        monthly_budget: 2000,
        icon: 'zap',
        color: '#f97316',
        is_default: true,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cat-6',
        user_id: null,
        name: 'Digital Marketing',
        type: 'expense',
        parent_category: null,
        monthly_budget: 5000,
        icon: 'megaphone',
        color: '#ec4899',
        is_default: true,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cat-7',
        user_id: null,
        name: 'Salaries & Wages',
        type: 'expense',
        parent_category: null,
        monthly_budget: 50000,
        icon: 'users',
        color: '#3b82f6',
        is_default: true,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cat-8',
        user_id: null,
        name: 'Fuel',
        type: 'expense',
        parent_category: null,
        monthly_budget: 3000,
        icon: 'fuel',
        color: '#f97316',
        is_default: true,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];

    // Initialize sample transactions (last 6 months)
    const today = new Date();
    let transactionId = 1;

    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);

      // Income transactions
      for (let i = 0; i < 5; i++) {
        const day = Math.floor(Math.random() * 28) + 1;
        const txDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);

        this.transactions.push({
          id: `tx-${transactionId++}`,
          user_id: 'demo-user',
          transaction_date: txDate.toISOString().split('T')[0],
          type: 'income',
          category: ['Rental Commissions', 'Sale Commissions', 'Monthly Rent'][i % 3],
          subcategory: null,
          amount: Math.floor(Math.random() * 20000) + 5000,
          currency: 'TRY',
          description: `Commission payment ${i + 1}`,
          notes: null,
          payment_method: 'bank_transfer',
          payment_status: 'completed',
          property_id: null,
          contract_id: null,
          commission_id: null,
          receipt_url: null,
          invoice_number: null,
          is_recurring: false,
          recurring_frequency: null,
          recurring_day: null,
          recurring_end_date: null,
          parent_transaction_id: null,
          created_at: txDate.toISOString(),
          updated_at: txDate.toISOString(),
        });
      }

      // Expense transactions
      const expenseCategories = [
        'Office Rent',
        'Electricity',
        'Digital Marketing',
        'Salaries & Wages',
        'Fuel',
      ];

      for (let i = 0; i < expenseCategories.length; i++) {
        const day = Math.floor(Math.random() * 28) + 1;
        const txDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);

        const amounts: Record<string, number> = {
          'Office Rent': 15000,
          'Electricity': 1500 + Math.floor(Math.random() * 1000),
          'Digital Marketing': 3000 + Math.floor(Math.random() * 3000),
          'Salaries & Wages': 45000 + Math.floor(Math.random() * 10000),
          'Fuel': 2000 + Math.floor(Math.random() * 2000),
        };

        this.transactions.push({
          id: `tx-${transactionId++}`,
          user_id: 'demo-user',
          transaction_date: txDate.toISOString().split('T')[0],
          type: 'expense',
          category: expenseCategories[i],
          subcategory: null,
          amount: amounts[expenseCategories[i]],
          currency: 'TRY',
          description: `${expenseCategories[i]} payment`,
          notes: null,
          payment_method: 'bank_transfer',
          payment_status: 'completed',
          property_id: null,
          contract_id: null,
          commission_id: null,
          receipt_url: null,
          invoice_number: null,
          is_recurring: false,
          recurring_frequency: null,
          recurring_day: null,
          recurring_end_date: null,
          parent_transaction_id: null,
          created_at: txDate.toISOString(),
          updated_at: txDate.toISOString(),
        });
      }
    }

    // Initialize recurring expenses
    this.recurringExpenses = [
      {
        id: 're-1',
        user_id: 'demo-user',
        name: 'Office Rent',
        description: 'Monthly office space rental',
        category: 'Office Rent',
        amount: 15000,
        currency: 'TRY',
        frequency: 'monthly',
        day_of_month: 1,
        start_date: '2025-01-01',
        end_date: null,
        next_due_date: this.getNextMonthFirstDay(),
        last_generated_date: this.getCurrentMonthFirstDay(),
        payment_method: 'bank_transfer',
        is_active: true,
        auto_create_transaction: true,
        reminder_days_before: 3,
        notes: null,
        vendor_name: 'Property Management Co.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 're-2',
        user_id: 'demo-user',
        name: 'Internet & Phone',
        description: 'Monthly internet and phone service',
        category: 'Internet & Phone',
        amount: 500,
        currency: 'TRY',
        frequency: 'monthly',
        day_of_month: 15,
        start_date: '2025-01-15',
        end_date: null,
        next_due_date: this.getNextDate(15),
        last_generated_date: null,
        payment_method: 'bank_transfer',
        is_active: true,
        auto_create_transaction: true,
        reminder_days_before: 5,
        notes: null,
        vendor_name: 'Telecom Provider',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Sort transactions by date descending
    this.transactions.sort(
      (a, b) =>
        new Date(b.transaction_date).getTime() -
        new Date(a.transaction_date).getTime()
    );
  }

  private getNextMonthFirstDay(): string {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth.toISOString().split('T')[0];
  }

  private getCurrentMonthFirstDay(): string {
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return currentMonth.toISOString().split('T')[0];
  }

  private getNextDate(dayOfMonth: number): string {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    if (thisMonth > today) {
      return thisMonth.toISOString().split('T')[0];
    } else {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
      return nextMonth.toISOString().split('T')[0];
    }
  }

  // =====================================================
  // Financial Transactions CRUD
  // =====================================================

  async getTransactions(
    filters?: TransactionFilters
  ): Promise<FinancialTransaction[]> {
    await this.delay(100);

    let filtered = [...this.transactions];

    if (filters?.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    if (filters?.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    if (filters?.payment_status) {
      filtered = filtered.filter(t => t.payment_status === filters.payment_status);
    }
    if (filters?.start_date) {
      filtered = filtered.filter(t => t.transaction_date >= filters.start_date!);
    }
    if (filters?.end_date) {
      filtered = filtered.filter(t => t.transaction_date <= filters.end_date!);
    }
    if (filters?.property_id) {
      filtered = filtered.filter(t => t.property_id === filters.property_id);
    }
    if (filters?.contract_id) {
      filtered = filtered.filter(t => t.contract_id === filters.contract_id);
    }
    if (filters?.min_amount !== undefined) {
      filtered = filtered.filter(t => t.amount >= filters.min_amount!);
    }
    if (filters?.max_amount !== undefined) {
      filtered = filtered.filter(t => t.amount <= filters.max_amount!);
    }

    return filtered;
  }

  async getTransactionById(id: string): Promise<FinancialTransaction | null> {
    await this.delay(100);
    return this.transactions.find(t => t.id === id) || null;
  }

  async createTransaction(
    data: CreateFinancialTransactionInput
  ): Promise<FinancialTransaction> {
    await this.delay(200);

    const newTransaction: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      user_id: 'demo-user',
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.transactions.unshift(newTransaction);
    return newTransaction;
  }

  async updateTransaction(
    id: string,
    data: UpdateFinancialTransactionInput
  ): Promise<FinancialTransaction> {
    await this.delay(200);

    const index = this.transactions.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Transaction not found');
    }

    this.transactions[index] = {
      ...this.transactions[index],
      ...data,
      updated_at: new Date().toISOString(),
    };

    return this.transactions[index];
  }

  async deleteTransaction(id: string): Promise<boolean> {
    await this.delay(200);

    const index = this.transactions.findIndex(t => t.id === id);
    if (index === -1) {
      return false;
    }

    this.transactions.splice(index, 1);
    return true;
  }

  // =====================================================
  // Expense Categories CRUD
  // =====================================================

  async getCategories(type?: 'income' | 'expense'): Promise<ExpenseCategory[]> {
    await this.delay(100);

    if (type) {
      return this.categories.filter(c => c.type === type && c.is_active);
    }

    return this.categories.filter(c => c.is_active);
  }

  async getCategoryById(id: string): Promise<ExpenseCategory | null> {
    await this.delay(100);
    return this.categories.find(c => c.id === id) || null;
  }

  async createCategory(
    data: CreateExpenseCategoryInput
  ): Promise<ExpenseCategory> {
    await this.delay(200);

    const newCategory: ExpenseCategory = {
      id: `cat-${Date.now()}`,
      user_id: 'demo-user',
      name: data.name,
      type: data.type,
      parent_category: data.parent_category || null,
      monthly_budget: data.monthly_budget || null,
      icon: data.icon || null,
      color: data.color || null,
      is_default: false,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
    };

    this.categories.push(newCategory);
    return newCategory;
  }

  async updateCategory(
    id: string,
    data: UpdateExpenseCategoryInput
  ): Promise<ExpenseCategory> {
    await this.delay(200);

    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Category not found');
    }

    this.categories[index] = {
      ...this.categories[index],
      ...data,
    };

    return this.categories[index];
  }

  async deleteCategory(id: string): Promise<boolean> {
    await this.delay(200);

    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1 || this.categories[index].is_default) {
      return false;
    }

    this.categories.splice(index, 1);
    return true;
  }

  // =====================================================
  // Recurring Expenses CRUD
  // =====================================================

  async getRecurringExpenses(
    filters?: RecurringExpenseFilters
  ): Promise<RecurringExpense[]> {
    await this.delay(100);

    let filtered = [...this.recurringExpenses];

    if (filters?.category) {
      filtered = filtered.filter(r => r.category === filters.category);
    }
    if (filters?.frequency) {
      filtered = filtered.filter(r => r.frequency === filters.frequency);
    }
    if (filters?.is_active !== undefined) {
      filtered = filtered.filter(r => r.is_active === filters.is_active);
    }
    if (filters?.auto_create_transaction !== undefined) {
      filtered = filtered.filter(
        r => r.auto_create_transaction === filters.auto_create_transaction
      );
    }

    return filtered;
  }

  async getRecurringExpenseById(id: string): Promise<RecurringExpense | null> {
    await this.delay(100);
    return this.recurringExpenses.find(r => r.id === id) || null;
  }

  async createRecurringExpense(
    data: CreateRecurringExpenseInput
  ): Promise<RecurringExpense> {
    await this.delay(200);

    const newRecurring: RecurringExpense = {
      id: `re-${Date.now()}`,
      user_id: 'demo-user',
      name: data.name,
      description: data.description || null,
      category: data.category,
      amount: data.amount,
      currency: data.currency || 'TRY',
      frequency: data.frequency,
      day_of_month: data.day_of_month || null,
      start_date: data.start_date,
      end_date: data.end_date || null,
      next_due_date: data.start_date,
      last_generated_date: null,
      payment_method: data.payment_method || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
      auto_create_transaction:
        data.auto_create_transaction !== undefined ? data.auto_create_transaction : true,
      reminder_days_before:
        data.reminder_days_before !== undefined ? data.reminder_days_before : 3,
      notes: data.notes || null,
      vendor_name: data.vendor_name || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.recurringExpenses.push(newRecurring);
    return newRecurring;
  }

  async updateRecurringExpense(
    id: string,
    data: UpdateRecurringExpenseInput
  ): Promise<RecurringExpense> {
    await this.delay(200);

    const index = this.recurringExpenses.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error('Recurring expense not found');
    }

    this.recurringExpenses[index] = {
      ...this.recurringExpenses[index],
      ...data,
      updated_at: new Date().toISOString(),
    };

    return this.recurringExpenses[index];
  }

  async deleteRecurringExpense(id: string): Promise<boolean> {
    await this.delay(200);

    const index = this.recurringExpenses.findIndex(r => r.id === id);
    if (index === -1) {
      return false;
    }

    this.recurringExpenses.splice(index, 1);
    return true;
  }

  async processDueRecurringExpenses(): Promise<number> {
    await this.delay(200);
    return 0; // Not implemented in mock
  }

  // =====================================================
  // Analytics and Summary Methods
  // =====================================================

  async getMonthlySummary(month: string): Promise<MonthlySummary> {
    await this.delay(100);

    const [year, monthNum] = month.split('-').map(Number);
    const startDate = `${month}-01`;
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

    const monthTransactions = this.transactions.filter(
      t =>
        t.transaction_date >= startDate &&
        t.transaction_date <= endDate &&
        t.payment_status === 'completed'
    );

    const total_income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const total_expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month,
      total_income,
      total_expense,
      net_income: total_income - total_expense,
      transaction_count: monthTransactions.length,
    };
  }

  async getCategoryBreakdown(
    startDate: string,
    endDate: string,
    type: 'income' | 'expense'
  ): Promise<CategoryBreakdown[]> {
    await this.delay(100);

    const filtered = this.transactions.filter(
      t =>
        t.transaction_date >= startDate &&
        t.transaction_date <= endDate &&
        t.type === type &&
        t.payment_status === 'completed'
    );

    const categoryMap = new Map<string, { total: number; count: number }>();

    filtered.forEach(t => {
      const existing = categoryMap.get(t.category) || { total: 0, count: 0 };
      categoryMap.set(t.category, {
        total: existing.total + t.amount,
        count: existing.count + 1,
      });
    });

    const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);

    const categoryMetadata = new Map(this.categories.map(c => [c.name, c]));

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

    return breakdown.sort((a, b) => b.total_amount - a.total_amount);
  }

  async getMonthlyTrends(months: number = 6): Promise<MonthlyTrend[]> {
    await this.delay(100);

    const today = new Date();

    // Get all monthly summaries in parallel (much faster!)
    const monthPromises = Array.from({ length: months }, (_, i) => {
      const date = new Date(today.getFullYear(), today.getMonth() - (months - 1 - i), 1);
      const month = date.toISOString().slice(0, 7);
      return this.getMonthlySummary(month).then(summary => ({
        month,
        income: summary.total_income,
        expense: summary.total_expense,
        net: summary.net_income,
      }));
    });

    return Promise.all(monthPromises);
  }

  async getUpcomingRecurringExpenses(
    daysAhead: number = 30
  ): Promise<UpcomingRecurringExpense[]> {
    await this.delay(100);

    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];

    const upcoming = this.recurringExpenses
      .filter(r => r.is_active && r.next_due_date <= futureStr)
      .map(expense => {
        const dueDate = new Date(expense.next_due_date);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          recurring_expense: expense,
          days_until_due: diffDays,
          is_overdue: expense.next_due_date < todayStr,
        };
      });

    return upcoming;
  }

  async getFinancialDashboard(): Promise<FinancialDashboard> {
    await this.delay(200);

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

    const [
      currentMonthSummary,
      previousMonthSummary,
      yearToDateTransactions,
      incomeBreakdown,
      expenseBreakdown,
      trends,
      upcomingExpenses,
    ] = await Promise.all([
      this.getMonthlySummary(currentMonth),
      this.getMonthlySummary(previousMonth),
      this.getTransactions({
        start_date: yearStart,
        end_date: yearEnd,
        payment_status: 'completed',
      }),
      this.getCategoryBreakdown(currentMonth + '-01', currentMonthEnd, 'income'),
      this.getCategoryBreakdown(currentMonth + '-01', currentMonthEnd, 'expense'),
      this.getMonthlyTrends(6),
      this.getUpcomingRecurringExpenses(30),
    ]);

    const ytdIncome = yearToDateTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const ytdExpense = yearToDateTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

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
  }

  // =====================================================
  // Utility Methods
  // =====================================================

  async calculateNextDueDate(
    currentDate: string,
    frequency: 'monthly' | 'quarterly' | 'yearly',
    _dayOfMonth?: number | null
  ): Promise<string> {
    await this.delay(100);

    const current = new Date(currentDate);
    let next: Date;

    switch (frequency) {
      case 'monthly':
        next = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate());
        break;
      case 'quarterly':
        next = new Date(current.getFullYear(), current.getMonth() + 3, current.getDate());
        break;
      case 'yearly':
        next = new Date(current.getFullYear() + 1, current.getMonth(), current.getDate());
        break;
      default:
        next = current;
    }

    return next.toISOString().split('T')[0];
  }

  async exportTransactionsToCSV(filters?: TransactionFilters): Promise<string> {
    await this.delay(200);

    const transactions = await this.getTransactions(filters);

    if (transactions.length === 0) {
      return 'No transactions to export';
    }

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

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }

  // =====================================================
  // Phase 3: Advanced Analytics Methods
  // =====================================================

  async getFinancialRatios(month?: string): Promise<FinancialRatios> {
    await this.delay(100);

    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const summary = await this.getMonthlySummary(targetMonth);

    const profit_margin =
      summary.total_income > 0
        ? ((summary.total_income - summary.total_expense) / summary.total_income) * 100
        : 0;

    const expense_ratio =
      summary.total_income > 0
        ? (summary.total_expense / summary.total_income) * 100
        : 0;

    const budgetComparison = await this.getBudgetVsActual(targetMonth);
    const totalBudgeted = budgetComparison.reduce((sum, cat) => sum + cat.budgeted, 0);
    const totalActual = budgetComparison.reduce((sum, cat) => sum + cat.actual, 0);

    const budget_efficiency =
      totalBudgeted > 0
        ? ((totalBudgeted - totalActual) / totalBudgeted) * 100
        : 0;

    const forecast = await this.getCashFlowForecast();
    const cash_flow_forecast_30d = forecast.next_30_days;

    return {
      profit_margin,
      expense_ratio,
      budget_efficiency,
      cash_flow_forecast_30d,
    };
  }

  async getBudgetVsActual(month: string): Promise<BudgetVsActual[]> {
    await this.delay(100);

    const [year, monthNum] = month.split('-').map(Number);
    const startDate = `${month}-01`;
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

    const categoriesWithBudget = this.categories.filter(
      c => c.type === 'expense' && c.monthly_budget && c.monthly_budget > 0
    );

    if (categoriesWithBudget.length === 0) {
      return [];
    }

    const monthTransactions = this.transactions.filter(
      t =>
        t.transaction_date >= startDate &&
        t.transaction_date <= endDate &&
        t.type === 'expense' &&
        t.payment_status === 'completed'
    );

    const actualByCategory = new Map<string, number>();
    monthTransactions.forEach(t => {
      const existing = actualByCategory.get(t.category) || 0;
      actualByCategory.set(t.category, existing + t.amount);
    });

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

    return comparisons.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }

  async getYearlySummary(year?: number): Promise<YearlySummary> {
    await this.delay(100);

    const targetYear = year || new Date().getFullYear();

    // Get monthly summaries for all 12 months in parallel (much faster!)
    const monthPromises = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthStr = `${targetYear}-${month.toString().padStart(2, '0')}`;
      return this.getMonthlySummary(monthStr);
    });

    const months = await Promise.all(monthPromises);

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
  }

  async getTopCategories(
    type: 'income' | 'expense',
    limit: number = 5,
    month?: string
  ): Promise<TopCategory[]> {
    await this.delay(100);

    let startDate: string | undefined;
    let endDate: string | undefined;

    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      startDate = `${month}-01`;
      endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];
    }

    const breakdown = await this.getCategoryBreakdown(
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
  }

  async getCashFlowForecast(): Promise<CashFlowForecast> {
    await this.delay(100);

    const today = new Date();
    const recurringExpenses = await this.getUpcomingRecurringExpenses(30);
    const projected_expenses = recurringExpenses
      .filter(r => !r.is_overdue)
      .reduce((sum, r) => sum + r.recurring_expense.amount, 0);

    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 30);
    const pastStr = pastDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const pastIncomeTransactions = this.transactions.filter(
      t =>
        t.transaction_date >= pastStr &&
        t.transaction_date <= todayStr &&
        t.type === 'income' &&
        t.payment_status === 'completed'
    );

    const pastIncome = pastIncomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgDailyIncome = pastIncome / 30;
    const projected_income = avgDailyIncome * 30;

    const next_30_days = projected_income - projected_expenses;

    const confidence: 'high' | 'medium' | 'low' =
      pastIncomeTransactions.length > 10 && recurringExpenses.length > 0
        ? 'high'
        : pastIncomeTransactions.length > 5
        ? 'medium'
        : 'low';

    return {
      next_30_days,
      projected_income,
      projected_expenses,
      confidence,
    };
  }

  // =====================================================
  // Phase 4: Automation & Reminders
  // =====================================================

  /**
   * Generate recurring transactions (alias for processDueRecurringExpenses)
   * @returns Number of transactions created
   */
  async generateRecurringTransactions(): Promise<number> {
    return this.processDueRecurringExpenses();
  }

  /**
   * Get upcoming bills (alias for getUpcomingRecurringExpenses)
   * @param days - Number of days to look ahead
   * @returns Array of upcoming recurring expenses
   */
  async getUpcomingBills(days: number = 30): Promise<UpcomingRecurringExpense[]> {
    return this.getUpcomingRecurringExpenses(days);
  }

  /**
   * Mark a recurring bill as paid by creating a completed transaction
   * @param recurringExpenseId - ID of the recurring expense
   * @returns Created transaction
   */
  async markBillAsPaid(recurringExpenseId: string): Promise<FinancialTransaction> {
    await this.delay(200);

    const expense = await this.getRecurringExpenseById(recurringExpenseId);

    if (!expense) {
      throw new Error('Recurring expense not found');
    }

    // Create a completed transaction
    const transaction = await this.createTransaction({
      transaction_date: expense.next_due_date,
      type: 'expense',
      category: expense.category,
      amount: expense.amount,
      currency: expense.currency,
      description: `${expense.name} (Paid)`,
      notes: expense.notes || undefined,
      payment_method: expense.payment_method || undefined,
      payment_status: 'completed',
    });

    // Update next due date
    const nextDate = await this.calculateNextDueDate(
      expense.next_due_date,
      expense.frequency,
      expense.day_of_month
    );

    await this.updateRecurringExpense(expense.id, {
      next_due_date: nextDate,
      last_generated_date: new Date().toISOString().split('T')[0],
    });

    return transaction;
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const financialTransactionsService = new MockFinancialTransactionsService();

// Export individual methods for easy import
export const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getRecurringExpenses,
  getRecurringExpenseById,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  processDueRecurringExpenses,
  getMonthlySummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getUpcomingRecurringExpenses,
  getFinancialDashboard,
  calculateNextDueDate,
  exportTransactionsToCSV,
  getFinancialRatios,
  getBudgetVsActual,
  getYearlySummary,
  getTopCategories,
  getCashFlowForecast,
  generateRecurringTransactions,
  getUpcomingBills,
  markBillAsPaid,
} = financialTransactionsService;
