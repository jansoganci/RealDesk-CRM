# Recurring Expenses - Infrastructure Status

**Date:** 2025-01-06  
**Analysis Type:** Infrastructure & Implementation Status

---

## 1. Database Schema

### Table Status: ✅ EXISTS

**Migration File:** `supabase/migrations/20251111130002_create_recurring_expenses_table.sql`

### Columns Present:

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `user_id` | UUID | NOT NULL, FK to auth.users | ✅ Present |
| `org_id` | UUID | FK to organizations | ✅ Added in org migration |
| `name` | VARCHAR(200) | NOT NULL | ✅ Present |
| `description` | TEXT | NULL | ✅ Present |
| `category` | VARCHAR(100) | NOT NULL | ⚠️ String, not FK to expense_categories |
| `amount` | DECIMAL(12,2) | NOT NULL, CHECK > 0 | ✅ Present |
| `currency` | VARCHAR(10) | NOT NULL, DEFAULT 'TRY' | ✅ Present |
| `frequency` | VARCHAR(20) | NOT NULL, CHECK IN ('monthly', 'quarterly', 'yearly') | ✅ Present |
| `day_of_month` | INTEGER | CHECK BETWEEN 1-31 | ✅ Present |
| `start_date` | DATE | NOT NULL | ✅ Present |
| `end_date` | DATE | NULL | ✅ Present (NULL = indefinite) |
| `next_due_date` | DATE | NOT NULL | ✅ Present |
| `last_generated_date` | DATE | NULL | ✅ Present |
| `payment_method` | VARCHAR(50) | NULL | ✅ Present |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | ✅ Present |
| `auto_create_transaction` | BOOLEAN | NOT NULL, DEFAULT true | ✅ Present |
| `reminder_days_before` | INTEGER | DEFAULT 3, CHECK >= 0 | ✅ Present |
| `notes` | TEXT | NULL | ✅ Present |
| `vendor_name` | VARCHAR(200) | NULL | ✅ Present |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | ✅ Present |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | ✅ Present |
| `deleted_at` | TIMESTAMPTZ | NULL | ✅ Added in org migration |

### Foreign Keys:

- ✅ `user_id` → `auth.users(id)` ON DELETE CASCADE
- ✅ `org_id` → `organizations(id)` (added in migration `20251231000002_org_phase1_add_columns.sql`)
- ❌ `category` → **NO FK** to `expense_categories` (uses VARCHAR string)

### Indexes:

- ✅ `idx_recurring_expenses_user_active` on `(user_id, is_active)`
- ✅ `idx_recurring_expenses_next_due` on `(next_due_date, is_active)` WHERE `is_active = true`
- ✅ `idx_recurring_expenses_category` on `(category, is_active)`
- ✅ `idx_recurring_expenses_org_id` on `(org_id)` (added in org migration)
- ✅ `idx_recurring_expenses_not_deleted` on `(id)` WHERE `deleted_at IS NULL` (added in org migration)

### RLS Policies: ✅ CONFIGURED

**Current Policies (from migration `20260104000002_fix_all_rls_policies_use_helper_function.sql`):**

- ✅ `org_select_recurring_expenses` - SELECT using `get_user_org_ids()` helper
- ✅ `org_insert_recurring_expenses` - INSERT with `is_org_owner()` check
- ✅ `org_update_recurring_expenses` - UPDATE with org ownership check
- ✅ `org_delete_recurring_expenses` - DELETE using `softDelete()` (policy returns false)

**Status:** Policies use helper functions and properly enforce org-level access control.

### Database Functions:

- ✅ `calculate_next_due_date(current_due_date, freq, day_of_month)` - Calculates next due date based on frequency
- ✅ `set_initial_next_due_date()` - Trigger function to set `next_due_date` on INSERT if not provided
- ✅ `update_recurring_expenses_updated_at()` - Trigger function to update `updated_at` timestamp

### Issues Found:

1. ⚠️ **Category is VARCHAR, not FK**: The `category` field is a string, not a foreign key to `expense_categories` table. This means:
   - No referential integrity
   - Categories can be misspelled or inconsistent
   - No validation against valid categories

2. ✅ **org_id properly added**: The `org_id` column was added in the org migration and is properly referenced.

---

## 2. Service Layer

### File: `src/services/finance/recurring.service.ts`

### Methods Available:

| Method | Purpose | Status |
|--------|---------|--------|
| `getRecurringExpenses(filters?)` | Get all recurring expenses with optional filters | ✅ EXISTS |
| `getRecurringExpenseById(id)` | Get single recurring expense by ID | ✅ EXISTS |
| `createRecurringExpense(data)` | Create new recurring expense | ✅ EXISTS |
| `updateRecurringExpense(id, data)` | Update existing recurring expense | ✅ EXISTS |
| `deleteRecurringExpense(id)` | Soft delete recurring expense | ✅ EXISTS |
| `processDueRecurringExpenses()` | Process due expenses and create transactions | ✅ EXISTS |
| `getUpcomingRecurringExpenses(daysAhead?)` | Get upcoming bills (default 30 days) | ✅ EXISTS |
| `calculateNextDueDate(...)` | Calculate next due date | ✅ EXISTS |
| `generateRecurringTransactions()` | Alias for `processDueRecurringExpenses` | ✅ EXISTS |
| `getUpcomingBills()` | Alias for `getUpcomingRecurringExpenses` | ✅ EXISTS |
| `markBillAsPaid(recurringExpenseId)` | Mark bill as paid and create transaction | ✅ EXISTS |

### org_id Injection: ✅ FIXED

**Status:** The `createRecurringExpense` method properly injects `org_id`:

```typescript
const recurringExpense = await insertRow('recurring_expenses', {
  user_id: userId,
  org_id: orgId,  // ✅ Properly injected
  // ... other fields
});
```

All queries use `getActiveOrgId()` to filter by organization.

### Filtering Capabilities:

- ✅ Filter by `category` (string match)
- ✅ Filter by `frequency` (monthly, quarterly, yearly)
- ✅ Filter by `is_active` (boolean)
- ✅ Filter by `auto_create_transaction` (boolean)
- ✅ Automatic filtering by `org_id` and `deleted_at IS NULL`

### Missing Methods:

- ❌ No method to bulk update multiple recurring expenses
- ❌ No method to get recurring expenses by date range
- ❌ No method to get statistics/summary (total amount, count by frequency, etc.)

---

## 3. UI Components

### Management Page: ❌ MISSING

**Status:** There is **NO dedicated page/tab** for managing recurring expenses.

**Current Finance Dashboard Tabs:**
- `overview` - Overview with summary cards
- `transactions` - Transaction list and management
- `analytics` - Analytics including Upcoming Bills widget

**Missing:** A dedicated "Recurring Expenses" or "Automation" tab for:
- Listing all recurring expenses
- Creating new recurring expenses
- Editing existing recurring expenses
- Viewing recurring expense history

### Form Components: ❌ MISSING

**Status:** There are **NO form components** for creating or editing recurring expenses.

**What exists:**
- ✅ `TransactionDialog` - For creating/editing transactions (not recurring expenses)
- ✅ `UpcomingBills` - Display widget only (read-only)

**What's missing:**
- ❌ `RecurringExpenseDialog` - Form for creating/editing recurring expenses
- ❌ `RecurringExpenseForm` - Reusable form component
- ❌ `RecurringExpensesList` - Table/list view of all recurring expenses

### Dashboard Widgets: ✅ EXISTS (Partial)

**Upcoming Bills Widget:**
- ✅ **File:** `src/features/finance/components/UpcomingBills.tsx`
- ✅ **Location:** Shown in Analytics tab (`FinanceAnalytics` component)
- ✅ **Features:**
  - Displays upcoming bills for next 30 days (configurable)
  - Shows overdue, due soon, and upcoming bills with badges
  - "Mark as Paid" button for each bill
  - Empty state when no bills
  - Loading states
- ⚠️ **Limitations:**
  - Read-only (cannot create/edit recurring expenses from here)
  - Only shows upcoming bills, not all recurring expenses
  - No way to manage inactive or past recurring expenses

**Other Widgets:**
- ❌ No widget in Overview tab
- ❌ No widget in main Dashboard
- ❌ No summary card showing total recurring expenses count/amount

---

## 4. Automation

### Cron/Edge Function: ❌ MISSING

**Status:** There is **NO automated cron job or Supabase Edge Function** to process recurring expenses.

**What exists:**
- ✅ `processDueRecurringExpenses()` service method - The logic exists and works
- ❌ No scheduled task to call this method automatically

**Edge Functions Check:**
- `supabase/functions/` contains:
  - `stripe-webhook/`
  - `extract-contract-data-v2/`
  - `extract-text/`
  - `fetch-exchange-rates/`
  - `create-checkout-session/`
  - `create-portal-session/`
- ❌ **NO** `process-recurring-expenses/` or similar function

**Supabase Cron Jobs:**
- No evidence of pg_cron or Supabase scheduled functions configured

### Manual Trigger: ❌ MISSING

**Status:** There is **NO manual "Generate Transactions" button** in the UI.

**What's needed:**
- A button in Finance dashboard to manually trigger `processDueRecurringExpenses()`
- Should show count of transactions generated
- Should handle errors gracefully

### Due Date Calculation: ✅ IMPLEMENTED

**Status:** Due date calculation is properly implemented.

**Implementation:**
- ✅ Database function `calculate_next_due_date()` handles:
  - Monthly (with optional `day_of_month`)
  - Quarterly
  - Yearly
- ✅ Service method `calculateNextDueDate()` wraps the RPC call
- ✅ Automatically called when:
  - Processing due expenses (`processDueRecurringExpenses`)
  - Marking bill as paid (`markBillAsPaid`)

---

## 5. Feature Completeness Assessment

| Feature | Status | Notes |
|---------|--------|-------|
| ✅ Create recurring expense | ❌ **MISSING UI** | Service method exists, but no form/dialog |
| ✅ Edit recurring expense | ❌ **MISSING UI** | Service method exists, but no form/dialog |
| ✅ Delete/deactivate recurring expense | ❌ **MISSING UI** | Service method exists, but no UI to trigger |
| ✅ List all recurring expenses | ❌ **MISSING UI** | Service method exists, but no list component |
| ✅ Automatic transaction generation | ❌ **NO AUTOMATION** | Service method exists, but no cron/edge function |
| ✅ Upcoming bills preview (next 30 days) | ✅ **EXISTS** | `UpcomingBills` widget in Analytics tab |
| ✅ Frequency options (Monthly, Quarterly, Yearly) | ✅ **EXISTS** | Database constraint and service support |
| ✅ Category assignment | ⚠️ **PARTIAL** | Uses string, not FK to expense_categories |
| ✅ Multi-currency support | ✅ **EXISTS** | `currency` field with default 'TRY' |

### Summary:

- **Backend/Service Layer:** ✅ **90% Complete** - All CRUD operations exist
- **Database Schema:** ✅ **95% Complete** - Well-designed, minor issue with category FK
- **UI Components:** ❌ **20% Complete** - Only read-only widget exists
- **Automation:** ❌ **0% Complete** - No scheduled processing

---

## 6. Implementation Plan

### Priority 1: Core Management UI (Critical)

**Goal:** Allow users to create, view, edit, and delete recurring expenses.

1. **Create RecurringExpenseDialog Component**
   - File: `src/features/finance/components/RecurringExpenseDialog.tsx`
   - Form fields:
     - Name (required)
     - Description (optional)
     - Category (dropdown from expense_categories)
     - Amount (required, > 0)
     - Currency (dropdown, default TRY)
     - Frequency (monthly/quarterly/yearly)
     - Day of month (optional, 1-31)
     - Start date (required)
     - End date (optional)
     - Payment method (optional)
     - Vendor name (optional)
     - Notes (optional)
     - Auto-create transaction (checkbox, default true)
     - Reminder days before (number, default 3)
     - Is active (checkbox, default true)
   - Validation using zod schema
   - Support create and edit modes

2. **Create RecurringExpensesList Component**
   - File: `src/features/finance/components/RecurringExpensesList.tsx`
   - Table/list view showing:
     - Name, Category, Amount, Frequency, Next Due Date, Status (active/inactive)
     - Actions: Edit, Delete/Deactivate, View Details
   - Filters: Active/Inactive, Category, Frequency
   - Empty state when no recurring expenses

3. **Add "Recurring Expenses" Tab to Finance Dashboard**
   - File: `src/features/finance/FinanceDashboard.tsx`
   - Add new tab: `'recurring'` with icon (Repeat or Calendar)
   - Tab content: `RecurringExpensesList` component
   - Add "Add Recurring Expense" button in header

4. **Update FinanceHeader Component**
   - Add "Add Recurring Expense" button (or combine with existing actions)

5. **Add Translation Keys**
   - File: `public/locales/en/finance.json` and `tr/finance.json`
   - Keys for:
     - Tab label
     - Form labels and placeholders
     - Validation messages
     - Success/error messages
     - Table headers

### Priority 2: Automation (High)

**Goal:** Automatically process due recurring expenses daily.

1. **Create Supabase Edge Function**
   - File: `supabase/functions/process-recurring-expenses/index.ts`
   - Function:
     - Get all organizations
     - For each org, call `processDueRecurringExpenses()` (requires service refactor)
     - Log results
     - Handle errors gracefully
   - **Alternative:** Create a database function that processes all orgs

2. **Set Up Supabase Cron Job**
   - Use Supabase Dashboard → Database → Cron Jobs
   - Schedule: Daily at 2 AM (or preferred time)
   - Call: `SELECT process_all_recurring_expenses();` (if using DB function)
   - OR: HTTP request to Edge Function (if using Edge Function)

3. **Add Manual Trigger Button (Optional but Recommended)**
   - Location: Finance Dashboard → Recurring Expenses tab
   - Button: "Generate Transactions Now"
   - Calls: `processDueRecurringExpenses()`
   - Shows toast with count of transactions created
   - Disabled while processing

### Priority 3: Enhancements (Medium)

1. **Fix Category Foreign Key**
   - Migration to add `category_id UUID REFERENCES expense_categories(id)`
   - Keep `category` VARCHAR for backward compatibility (or migrate data)
   - Update service to use `category_id` instead of `category` string
   - Update UI to use category dropdown

2. **Add Recurring Expenses Summary Card**
   - Location: Finance Overview tab
   - Shows: Total active recurring expenses, Total monthly amount, Next due date

3. **Add Recurring Expense History**
   - Show list of transactions generated from each recurring expense
   - Link from recurring expense detail view

4. **Add Bulk Actions**
   - Select multiple recurring expenses
   - Bulk activate/deactivate
   - Bulk delete

5. **Add Recurring Expense Statistics**
   - Total monthly recurring expenses
   - Breakdown by category
   - Breakdown by frequency

### Priority 4: Polish (Low)

1. **Add Recurring Expense Templates**
   - Pre-defined templates (Electricity, Internet, Office Rent, etc.)
   - Quick create from template

2. **Add Recurring Expense Notifications**
   - Email/notification when bill is due soon (using `reminder_days_before`)
   - Requires notification system integration

3. **Add Recurring Expense Reports**
   - Export recurring expenses to CSV
   - Annual recurring expense forecast

---

## 7. Technical Notes

### Service Method Dependencies

The `processDueRecurringExpenses()` method requires:
- User authentication context (for `getActiveOrgId()`)
- This makes it unsuitable for direct cron/edge function calls without refactoring

**Solution Options:**
1. Create a database function that processes all orgs (bypasses RLS)
2. Refactor service to accept `orgId` as parameter
3. Create admin service that can process all orgs

### Category Field Issue

The `category` field is VARCHAR(100), not a foreign key. This means:
- No referential integrity
- Categories can be inconsistent ("Electricity" vs "Electric")
- No validation against valid categories

**Recommendation:** Add `category_id` FK in future migration, but keep `category` for backward compatibility during transition.

### Translation Keys Status

**Existing keys:**
- `finance:automation.upcomingBills`
- `finance:automation.upcomingBillsDesc`
- `finance:automation.frequencies.*`
- `finance:automation.markAsPaid`
- `finance:automation.billMarkedPaid`

**Missing keys needed for full UI:**
- Form labels and placeholders
- Tab label
- Table headers
- Action buttons
- Validation messages

---

## 8. Conclusion

**Overall Status:** **Backend is well-implemented, but UI is missing.**

The recurring expenses feature has a solid foundation:
- ✅ Complete database schema with proper indexes and RLS
- ✅ Comprehensive service layer with all CRUD operations
- ✅ Working automation logic (just needs scheduling)
- ✅ Read-only widget for upcoming bills

**Critical Gaps:**
- ❌ No UI for managing recurring expenses (create/edit/delete)
- ❌ No automated processing (cron/edge function)
- ⚠️ Category field should be FK instead of VARCHAR

**Estimated Effort:**
- Priority 1 (Core UI): **8-12 hours**
- Priority 2 (Automation): **4-6 hours**
- Priority 3 (Enhancements): **6-10 hours**
- **Total: 18-28 hours** for complete implementation

**Recommendation:** Start with Priority 1 to unblock users, then add automation (Priority 2) for full feature completeness.

