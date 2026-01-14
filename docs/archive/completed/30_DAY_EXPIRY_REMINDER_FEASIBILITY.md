# 30-Day Expiry Reminder - Feasibility Analysis

**Date:** 2025-01-14  
**Question:** Is it possible to align notification system with 30-day expiry reminder logic?  
**Answer:** ✅ **YES, it's 90% already implemented!** Only minor logic adjustment needed.

---

## ✅ **FEASIBILITY: HIGHLY FEASIBLE**

**Current Status:** The infrastructure is **already 95% complete**. Only the reminder calculation logic needs a small adjustment.

---

## 📊 Current System Analysis

### **✅ What Already Exists:**

#### **1. Global State System** ✅ **COMPLETE**
- **File:** `src/contexts/NotificationContext.tsx`
- **Status:** ✅ Fully implemented
- **Features:**
  - Centralized state for `reminderCount`
  - Auto-refresh every 60 seconds
  - Used by both Navbar and Sidebar
  - Real-time updates without page refresh

#### **2. Header Bell Icon** ✅ **COMPLETE**
- **File:** `src/components/layout/Navbar.tsx` (Lines 55-68)
- **Status:** ✅ Fully implemented
- **Features:**
  - Bell icon with red badge
  - Shows count: `reminderCount + unreadMatchesCount`
  - Badge appears when count > 0
  - Navigates to `/reminders` on click

#### **3. Sidepanel Counter** ✅ **COMPLETE**
- **File:** `src/components/layout/Sidebar.tsx` (Lines 128-140)
- **Status:** ✅ Fully implemented
- **Features:**
  - Badge next to "Reminders" menu item
  - Shows `reminderCount`
  - Red badge when count > 0
  - Uses same `NotificationContext`

#### **4. Reminders Page** ✅ **COMPLETE**
- **File:** `src/features/reminders/Reminders.tsx`
- **Status:** ✅ Fully implemented
- **Features:**
  - Shows contracts in "Upcoming" and "Overdue" sections
  - Uses same `remindersService` logic
  - "Mark as Contacted" functionality exists

#### **5. "Contacted" Flag Check** ✅ **COMPLETE**
- **File:** `src/services/reminders.service.ts` (Line 46)
- **Status:** ✅ Already filtering by `rent_increase_reminder_contacted = false`
- **Result:** Only shows reminders that haven't been marked as contacted

---

## ⚠️ **What Needs Adjustment:**

### **Issue: Reminder Days Logic**

**Current Logic:**
```typescript
// reminders.service.ts:63-64
const reminderDays = contract.rent_increase_reminder_days || 90;
const reminderDate = addDaysToDate(endDate, -reminderDays);

// getActiveReminders() uses contract's reminder_days
reminder.days_until_end <= (reminder.rent_increase_reminder_days || 90)
```

**Problem:**
- Uses `rent_increase_reminder_days` from contract (can be 30, 60, or 90)
- Default is 90 days if not set
- User wants **fixed 30 days** for expiry reminders

**Current Behavior:**
- Contract with `reminder_days = 90` → Shows reminder 90 days before expiry
- Contract with `reminder_days = 30` → Shows reminder 30 days before expiry
- Contract with `reminder_days = null` → Shows reminder 90 days before expiry (default)

**Desired Behavior:**
- **All contracts** → Show reminder **30 days** before expiry (fixed)

---

## 🔧 **Solution Options**

### **Option A: Fixed 30-Day Logic (Recommended)**

**Approach:** Always use 30 days for expiry reminders, regardless of `rent_increase_reminder_days`.

**Changes Needed:**
1. Modify `getActiveReminders()` to use fixed 30-day threshold
2. Keep `rent_increase_reminder_days` for other purposes (rent increase planning)

**Code Change:**
```typescript
// Current (reminders.service.ts:81-86)
async getActiveReminders(): Promise<ReminderWithDetails[]> {
  const allReminders = await this.getAllReminders();
  return allReminders.filter((reminder) =>
    reminder.is_overdue || reminder.days_until_end <= (reminder.rent_increase_reminder_days || 90)
  );
}

// New (Fixed 30 days)
async getActiveReminders(): Promise<ReminderWithDetails[]> {
  const allReminders = await this.getAllReminders();
  const EXPIRY_REMINDER_DAYS = 30; // Fixed 30-day threshold
  return allReminders.filter((reminder) =>
    reminder.is_overdue || reminder.days_until_end <= EXPIRY_REMINDER_DAYS
  );
}
```

**Pros:**
- ✅ Simple, one-line change
- ✅ Consistent 30-day behavior for all contracts
- ✅ Clear separation: expiry reminders (30 days) vs rent increase planning (custom days)

**Cons:**
- ⚠️ Ignores `rent_increase_reminder_days` setting (but that's what user wants)

---

### **Option B: Use Contract's Setting (If Already 30)**

**Approach:** Keep current logic but ensure all contracts default to 30 days.

**Changes Needed:**
1. Verify contract creation sets `reminder_days = 30` (already done in `contracts.service.ts:172`)
2. Update existing contracts to have `reminder_days = 30` if null

**Pros:**
- ✅ Respects user's per-contract settings
- ✅ Flexible (can be customized per contract)

**Cons:**
- ⚠️ Requires data migration for existing contracts
- ⚠️ Still uses contract setting (not truly "fixed 30 days")

---

### **Option C: Hybrid Approach**

**Approach:** Use 30 days for badge count, but show all reminders on page.

**Changes Needed:**
1. Create new method: `getExpiryReminders()` - fixed 30 days
2. Use `getExpiryReminders()` for badge count
3. Keep `getActiveReminders()` for Reminders page (shows all)

**Pros:**
- ✅ Badge shows 30-day expiry reminders
- ✅ Page shows all reminders (including 60/90 day ones)

**Cons:**
- ⚠️ More complex
- ⚠️ Badge count might not match page count

---

## 🎯 **Recommended Solution: Option A**

**Why Option A:**
1. ✅ Simplest implementation (1 line change)
2. ✅ Matches user's requirement: "30 days from expiry"
3. ✅ Consistent behavior across all contracts
4. ✅ No data migration needed
5. ✅ Clear and predictable

---

## 📋 **Implementation Steps (If Option A)**

### **Step 1: Update `getActiveReminders()` Method**

**File:** `src/services/reminders.service.ts`

**Change:**
```typescript
// Line 81-86
async getActiveReminders(): Promise<ReminderWithDetails[]> {
  const allReminders = await this.getAllReminders();
  const EXPIRY_REMINDER_DAYS = 30; // Fixed 30-day threshold for expiry reminders
  return allReminders.filter((reminder) =>
    reminder.is_overdue || reminder.days_until_end <= EXPIRY_REMINDER_DAYS
  );
}
```

**Impact:**
- ✅ Badge count will show contracts within 30 days of expiry
- ✅ Sidepanel counter will show contracts within 30 days of expiry
- ✅ Header bell will show contracts within 30 days of expiry
- ✅ Reminders page will show contracts within 30 days of expiry (in "Upcoming" section)

---

### **Step 2: Verify "Contacted" Flag Logic**

**Status:** ✅ **Already correct**

**Current Code:**
```typescript
// reminders.service.ts:45-46
.eq('rent_increase_reminder_enabled', true)
.eq('rent_increase_reminder_contacted', false)  // ✅ Already filtering
```

**Result:** Reminders only show if `contacted = false` ✅

---

### **Step 3: Test Real-Time Updates**

**Status:** ✅ **Already working**

**Current Behavior:**
- NotificationContext refreshes every 60 seconds
- Badge updates automatically
- No page refresh needed

**Verification:**
- Mark a reminder as "Contacted"
- Badge count should decrease within 60 seconds
- Or call `refreshCounts()` manually for instant update

---

## 🔄 **Data Flow (After Fix)**

```
1. Contract Created
   ↓
2. rent_increase_reminder_enabled = true (auto-set)
   ↓
3. User Logs In
   ↓
4. NotificationContext Fetches: remindersService.getActiveReminders()
   ↓
5. getActiveReminders() Filters:
   - reminder_enabled = true ✅
   - contacted = false ✅
   - days_until_end <= 30 ✅ (NEW: Fixed 30 days)
   ↓
6. Returns Count: e.g., 5 contracts
   ↓
7. NotificationContext Updates: reminderCount = 5
   ↓
8. UI Updates Automatically:
   - Header Bell Badge: Shows "5"
   - Sidepanel Counter: Shows "5"
   - Reminders Page: Shows 5 contracts in "Upcoming"
   ↓
9. User Marks as Contacted
   ↓
10. Database Updates: contacted = true
    ↓
11. Next Refresh (60s): reminderCount = 4
    ↓
12. Badge Updates: Shows "4"
```

---

## ✅ **Verification Checklist**

After implementation, verify:

1. ✅ **Badge Count:** Shows contracts within 30 days of expiry
2. ✅ **Sidepanel:** Shows same count as badge
3. ✅ **Header Bell:** Shows same count as badge
4. ✅ **Reminders Page:** Shows contracts in "Upcoming" section
5. ✅ **Contacted Filter:** Reminders disappear after marking as contacted
6. ✅ **Real-Time:** Badge updates without page refresh (within 60s)
7. ✅ **Consistency:** All three locations show same count

---

## 🎯 **Summary**

### **Is It Possible?** ✅ **YES - 95% Already Done!**

### **What Exists:**
- ✅ Global state (NotificationContext)
- ✅ Header bell icon with badge
- ✅ Sidepanel counter with badge
- ✅ Reminders page with categorization
- ✅ "Contacted" flag filtering
- ✅ Auto-refresh mechanism

### **What Needs Change:**
- ⚠️ **One line of code:** Change `getActiveReminders()` to use fixed 30 days instead of contract's `reminder_days`

### **Complexity:** 🟢 **VERY LOW**
- **Time Estimate:** 5-10 minutes
- **Risk:** Very low (simple logic change)
- **Testing:** Verify badge counts match expectations

### **Recommendation:**
**Proceed with Option A** - Fixed 30-day logic. It's the simplest, most predictable solution that matches your exact requirement.

---

**Report Generated:** 2025-01-14  
**Status:** ✅ Feasible - Ready for implementation
