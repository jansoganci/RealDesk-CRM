# Contract Reminder System - Technical Analysis

**Date:** 2025-01-14  
**Question:** Does a "30-Day Contract Expiry Reminder" system exist?  
**Answer:** ✅ **YES, but it's a "Rent Increase Reminder" system, not an automated notification system**

---

## 📋 Executive Summary

### ✅ **System Exists:** YES
### ⚠️ **Type:** In-App Display System (NOT Automated Notifications)
### ❌ **Automated Alerts:** NO (No email, push, or scheduled notifications)

**Key Finding:** The system exists as a **UI-based reminder display** that shows contracts needing attention, but **does NOT automatically send alerts** via email, push notifications, or scheduled tasks.

---

## 🔍 System Architecture

### **1. Database Schema**

**Location:** `supabase/migrations/20251027223441_add_rent_increase_reminders_to_contracts.sql`

**Fields Added to `contracts` Table:**
```sql
- rent_increase_reminder_enabled (boolean, default: false)
- rent_increase_reminder_days (integer, default: 90)
- rent_increase_reminder_contacted (boolean, default: false)
- expected_new_rent (numeric, optional)
- reminder_notes (text, optional)
```

**Purpose:** These fields track whether a contract has reminders enabled and when to show them.

---

### **2. Auto-Enable on Contract Creation**

**Location:** `src/services/contracts.service.ts` (Lines 166-173, 180-186)

**Behavior:**
```typescript
// When creating contract via direct insert
rent_increase_reminder_enabled: contract.rent_increase_reminder_enabled ?? true,
rent_increase_reminder_days: contract.rent_increase_reminder_days ?? 30,

// When creating via RPC
rent_increase_reminder_enabled: contract.rent_increase_reminder_enabled ?? true,
rent_increase_reminder_days: contract.rent_increase_reminder_days ?? 30,
```

**What Happens:**
- ✅ New contracts automatically have `rent_increase_reminder_enabled = true`
- ✅ Default reminder days = **30 days** (not 90 as migration suggests)
- ✅ This is a **static record** - set once at contract creation
- ❌ **NO database trigger** - it's set in application code

---

### **3. Reminder Calculation Logic**

**Location:** `src/services/reminders.service.ts`

**How It Works:**

```typescript
// 1. Query contracts with reminders enabled
const contracts = await supabase
  .from('contracts')
  .select('*')
  .eq('rent_increase_reminder_enabled', true)
  .eq('rent_increase_reminder_contacted', false)
  .in('status', ['Active', 'Inactive']);

// 2. Calculate reminder date dynamically
const reminderDays = contract.rent_increase_reminder_days || 90;
const reminderDate = addDaysToDate(endDate, -reminderDays); // end_date - reminder_days

// 3. Calculate days until contract ends
const daysUntilEnd = daysDifference(endDate, today);

// 4. Check if reminder is overdue
const isOverdue = today >= reminderDate;
```

**Key Points:**
- ✅ **Dynamic calculation** - computed on-demand when user visits Reminders page
- ✅ **No static records** - reminders are calculated from contract data
- ✅ **Real-time** - always shows current status based on today's date

---

### **4. Display Locations**

**Reminders Page:** `/reminders`
- **File:** `src/features/reminders/Reminders.tsx`
- Shows all reminders categorized by urgency:
  - **Overdue:** Past reminder date, not contacted
  - **Upcoming:** Within reminder threshold (30/60/90 days)
  - **Scheduled:** Future reminders
  - **Expired:** Contracts past end date

**Dashboard Widget:** 
- **File:** `src/features/dashboard/components/RemindersSection.tsx`
- Shows top 3 upcoming reminders
- Badge count in sidebar navigation

**Contract List:**
- **File:** `src/features/contracts/Contracts.tsx`
- Can show expiration warnings (uses `CONTRACT_EXPIRATION_WARNING_DAYS = 30`)

---

## ❌ What's MISSING (Not Implemented)

### **1. Automated Notifications**

**Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- ❌ No email notifications (Resend integration exists but not used for reminders)
- ❌ No push notifications
- ❌ No SMS notifications
- ❌ No in-app notification system (no notification bell/alerts)

**Evidence:**
- Resend is only used for organization invitations (`send-invitation-email` Edge Function)
- No Edge Function for contract reminders
- No notification/alert table in database

---

### **2. Scheduled Tasks / Cron Jobs**

**Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- ❌ No Supabase Cron Jobs configured
- ❌ No PostgreSQL `pg_cron` extension
- ❌ No Edge Function scheduled to run daily
- ❌ No database function that runs on schedule

**Evidence:**
- Only Edge Function with cron mention: `fetch-exchange-rates` (for exchange rates, not reminders)
- No scheduled task for reminders in Supabase Dashboard
- No database triggers that create notification records

---

### **3. Database Triggers**

**Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- ❌ No trigger that creates reminder records when contract is created
- ❌ No trigger that sends notifications at reminder date
- ❌ No `reminders` or `notifications` table

**Evidence:**
- All triggers in migrations are for:
  - `updated_at` timestamps
  - Commission creation
  - User billing creation
  - **NONE for reminders**

---

### **4. Notification Service**

**Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- ❌ No service method to send reminder emails
- ❌ No service method to send push notifications
- ❌ No notification queue system

**Evidence:**
- `reminders.service.ts` only has:
  - `getAllReminders()` - Query contracts
  - `markAsContacted()` - Update flag
  - `updateReminderSettings()` - Update settings
  - **NO `sendReminderNotification()` method**

---

## 🔄 How the System Actually Works

### **Current Workflow:**

```
1. Contract Created
   ↓
2. Auto-Enable Reminder (rent_increase_reminder_enabled = true, days = 30)
   ↓
3. User Visits /reminders Page
   ↓
4. Frontend Calls: remindersService.getAllReminders()
   ↓
5. Service Queries: contracts WHERE reminder_enabled = true AND contacted = false
   ↓
6. Service Calculates: reminder_date = end_date - reminder_days
   ↓
7. Service Calculates: days_until_end = end_date - today
   ↓
8. Service Categorizes: overdue/upcoming/scheduled/expired
   ↓
9. UI Displays: Reminders in categorized sections
   ↓
10. User Clicks "Mark as Contacted"
    ↓
11. Frontend Calls: remindersService.markAsContacted(contractId)
    ↓
12. Database Updates: rent_increase_reminder_contacted = true
    ↓
13. Reminder Disappears from List
```

**Key Characteristics:**
- ✅ **On-Demand:** Reminders calculated when user visits page
- ✅ **Real-Time:** Always shows current status
- ✅ **Manual:** User must visit page to see reminders
- ❌ **No Automation:** No alerts sent automatically

---

## 📊 System Comparison

| Feature | Expected (30-Day Expiry Reminder) | Actual (Rent Increase Reminder) |
|---------|-----------------------------------|----------------------------------|
| **Purpose** | Alert 30 days before contract ends | Remind to contact owner about rent increase |
| **Default Days** | 30 days | 30 days (but can be 90) |
| **Auto-Enable** | ✅ Yes | ✅ Yes |
| **Static Record** | ❌ No | ❌ No (calculated dynamically) |
| **Email Alerts** | ❌ No | ❌ No |
| **Push Notifications** | ❌ No | ❌ No |
| **Scheduled Tasks** | ❌ No | ❌ No |
| **Database Triggers** | ❌ No | ❌ No |
| **UI Display** | ✅ Yes | ✅ Yes |
| **Manual Check Required** | ✅ Yes | ✅ Yes |

---

## 🎯 What Was Mentioned vs. What Exists

### **What Was Mentioned:**
> "A system was implemented to set a reminder 30 days before a contract's end date"

### **What Actually Exists:**
1. ✅ **Reminder fields** in contracts table
2. ✅ **Auto-enable** on contract creation (30 days default)
3. ✅ **UI display** on Reminders page
4. ✅ **Dynamic calculation** of reminder dates
5. ❌ **NO automated notifications**
6. ❌ **NO scheduled tasks**
7. ❌ **NO email/push alerts**

---

## 🔧 Technical Breakdown

### **Static vs. Dynamic:**

**Static Record (What You Expected):**
```sql
-- A record created once at contract creation
INSERT INTO reminders (contract_id, reminder_date, notified) 
VALUES ('contract-123', '2025-02-14', false);
```

**Dynamic Calculation (What Actually Exists):**
```typescript
// Calculated on-demand when user visits page
const reminderDate = addDaysToDate(contract.end_date, -contract.reminder_days);
const isOverdue = today >= reminderDate;
```

**Result:** No static records - everything is calculated from contract data in real-time.

---

### **Notification Service:**

**Expected:**
- Resend email service
- Push notification service
- Scheduled cron job

**Actual:**
- ✅ Resend exists (for organization invitations only)
- ❌ No push notification service
- ❌ No cron job for reminders

---

## 📝 Summary

### **✅ What EXISTS:**
1. Database fields for reminder settings
2. Auto-enable on contract creation (30 days default)
3. Reminder calculation logic
4. UI display on Reminders page
5. Dashboard widget showing upcoming reminders
6. Manual "Mark as Contacted" functionality

### **❌ What's MISSING:**
1. Automated email notifications
2. Push notifications
3. Scheduled cron jobs
4. Database triggers
5. Notification queue system
6. Static reminder records

### **🎯 Conclusion:**

**The system exists as a UI-based reminder display**, but it's **NOT an automated notification system**. Users must:
- Visit the `/reminders` page to see reminders
- Manually check for contracts needing attention
- No alerts are sent automatically

**To make it a true "30-Day Contract Expiry Reminder" system, you would need to add:**
1. Scheduled cron job (daily scan)
2. Email notification service (Resend integration)
3. Push notification service (optional)
4. Notification queue/table (optional, for tracking)

---

**Report Generated:** 2025-01-14  
**Status:** System exists but incomplete (missing automation)
