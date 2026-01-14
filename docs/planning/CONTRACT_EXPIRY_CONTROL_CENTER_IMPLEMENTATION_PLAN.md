# Contract Expiry Control Center - Implementation Plan

**Date:** 2025-01-14  
**Status:** ✅ **READY FOR PHASED IMPLEMENTATION**  
**Complexity:** Medium (2-3 days of work)  
**Approach:** Phased (6 phases, testable after each)

---

## 🎯 Quick Answer: Are We Ready?

### **YES - Ready with Phased Approach**

**Why Phased:**
1. ✅ **Manageable:** Each phase is 2-4 hours (testable)
2. ✅ **Safe:** Can test after each phase before proceeding
3. ✅ **Reversible:** Can rollback if issues arise
4. ✅ **Incremental:** Builds on previous work

**Plan Quality:**
- ✅ **Detailed:** Each task has file paths, code snippets, dependencies
- ✅ **Testable:** Can verify after each phase
- ✅ **Realistic:** Uses existing components where possible
- ✅ **Clear:** Step-by-step instructions

**Existing Assets We Can Reuse:**
- ✅ `Progress` component (Radix UI) - exists
- ✅ `StatCard` component - exists, can reuse
- ✅ `Card` components (shadcn/ui) - exists
- ✅ Tab structure - exists (needs modification)
- ✅ ReminderCard - exists (needs enhancement)

**What Needs Building:**
- ⚠️ Contract-specific progress bar (wrapper around Progress)
- ⚠️ Alarm status icons (new component)
- ⚠️ Summary cards (can reuse StatCard)
- ⚠️ Updated categorization logic (modify existing)

**Recommendation:** Start with Phase 1 (Foundation) - safest, no UI changes, testable immediately.

---

## 🎯 Implementation Readiness Assessment

### **Current State Analysis:**

**✅ What Already Exists:**
- Tab structure (overdue, upcoming, scheduled, expired)
- ReminderCard component
- Categorization logic (`useReminderCategories`)
- ReminderBadge component (urgency display)
- NotificationContext (badge counts)
- "Mark as Contacted" functionality
- Empty states
- **Progress component** (`src/components/ui/progress.tsx`) - Radix UI based
- **StatCard component** (`src/components/dashboard/StatCard.tsx`) - Can reuse for summary cards
- **Card components** (shadcn/ui) - For card layouts

**❌ What Needs to Be Built:**
- Summary cards at top of page
- Progress bar component
- Alarm status icons (green shield, red bell)
- New tab structure (Critical, Under Watch, Completed)
- Updated categorization logic (30-day fixed threshold)
- Hover tooltips
- "Days until critical zone" display

**⚠️ What Needs to Be Modified:**
- Tab labels and structure
- ReminderCard layout (add progress bar, alarm icons)
- Categorization logic (align with 30-day threshold)
- ReminderBadge (add alarm status icons)

---

## 📋 Phased Implementation Plan

### **Phase 1: Foundation & Data Layer** (Day 1 - 2-3 hours)
**Goal:** Update backend logic and categorization to support new structure

---

#### **Task 1.1: Update Reminder Service Logic**
**File:** `src/services/reminders.service.ts`

**Changes:**
1. Update `categorizeReminders()` to use new structure:
   - **Critical:** `days_until_end <= 30` OR `is_overdue`
   - **Under Watch:** `days_until_end > 30` AND `reminder_enabled = true` AND `contacted = false`
   - **Completed:** `contacted = true`

2. Add helper methods:
   ```typescript
   getCriticalReminders(): ReminderWithDetails[] // days <= 30
   getUnderWatchReminders(): ReminderWithDetails[] // days > 30, enabled, not contacted
   getCompletedReminders(): ReminderWithDetails[] // contacted = true
   ```

3. Add progress calculation method:
   ```typescript
   calculateProgress(reminder: ReminderWithDetails): {
     percentage: number;
     zone: 'safe' | 'approaching' | 'critical';
     daysUntilCritical: number;
   }
   ```

**Dependencies:** None  
**Risk:** Low (service layer only)

---

#### **Task 1.2: Update Categorization Hook**
**File:** `src/features/reminders/hooks/useReminderCategories.ts`

**Changes:**
1. Update to use new categories:
   - `criticalReminders` (instead of `overdueReminders`)
   - `underWatchReminders` (instead of `scheduledReminders`)
   - `completedReminders` (new)
   - Keep `expiredContracts` (optional, can merge with completed)

2. Update tab initialization logic:
   - Default to "Critical" if has items
   - Then "Under Watch"
   - Then "Completed"

**Dependencies:** Task 1.1  
**Risk:** Low

---

### **Phase 2: Visual Components** (Day 1-2 - 4-5 hours)
**Goal:** Build new UI components (progress bar, alarm icons, summary cards)

---

#### **Task 2.1: Create Contract Progress Bar Component**
**File:** `src/features/reminders/components/ContractProgressBar.tsx` (NEW)

**Note:** Base `Progress` component exists at `src/components/ui/progress.tsx` (Radix UI)

**Features:**
- Wrapper around existing `Progress` component
- Visual progress bar with color zones
- Percentage display
- "Days until critical zone" text
- Color transitions (green → yellow → orange → red)
- Calculates progress from contract dates

**Props:**
```typescript
interface ContractProgressBarProps {
  startDate: string;
  endDate: string;
  currentDate?: Date; // defaults to today
  showLabel?: boolean;
  showDaysUntilCritical?: boolean;
}
```

**Visual States:**
- Green (0-70%): Safe zone
- Yellow (70-90%): Approaching
- Orange (90-95%): Entering critical
- Red (95-100%): Critical zone

**Implementation:**
- Use existing `Progress` component from `@/components/ui/progress`
- Add color logic based on percentage
- Add label and days calculation

**Dependencies:** None (uses existing Progress component)  
**Risk:** Low (wrapper component)

---

#### **Task 2.2: Create Alarm Status Icon Component**
**File:** `src/features/reminders/components/AlarmStatusIcon.tsx`

**Features:**
- Green shield icon (Under Watch)
- Red bell icon (Critical)
- Gray checkmark (Completed)
- Hover tooltips with explanations

**Props:**
```typescript
interface AlarmStatusIconProps {
  status: 'armed' | 'critical' | 'completed';
  daysUntilEnd?: number;
  className?: string;
}
```

**Tooltips:**
- Armed: "30-day expiry reminder is active. You'll be notified when this contract enters the critical zone."
- Critical: "This contract expires in X days. Action required."
- Completed: "Reminder completed on [date]. No further action needed."

**Dependencies:** None  
**Risk:** Low (new component)

---

#### **Task 2.3: Create Summary Cards Component**
**File:** `src/features/reminders/components/ReminderSummaryCards.tsx` (NEW)

**Note:** `StatCard` component exists at `src/features/dashboard/components/StatCard.tsx` - can reuse pattern

**Features:**
- Three summary cards (Total Active, Critical, Pending Actions)
- Mini-metrics (trends, changes)
- Clickable cards (navigate to tabs)
- Loading states
- Uses Card component from shadcn/ui

**Data Needed:**
- Total active contracts count
- Critical count (matches badge)
- Pending actions count (critical with contacted = false)
- Trends (this week, this month)

**Implementation:**
- Reuse `StatCard` component from `@/components/dashboard/StatCard`
- Or create similar cards using `Card` from `@/components/ui/card`
- Calculate metrics from reminders data
- Add click handlers to navigate to tabs

**Dependencies:** Task 1.1 (for data)  
**Risk:** Low (can reuse existing StatCard component)

---

### **Phase 3: Page Structure Update** (Day 2 - 3-4 hours)
**Goal:** Update Reminders page with new tabs and layout

---

#### **Task 3.1: Update Tab Structure**
**File:** `src/features/reminders/Reminders.tsx`

**Changes:**
1. Update tab configuration:
   ```typescript
   const tabsConfig = [
     { id: 'critical', label: 'Critical (Next 30 Days)', icon: AlertCircle },
     { id: 'underWatch', label: 'Under Watch (Armed)', icon: Shield },
     { id: 'completed', label: 'Completed', icon: CheckCircle },
   ];
   ```

2. Update tab labels and icons
3. Update default tab selection logic

**Dependencies:** Task 1.2  
**Risk:** Low

---

#### **Task 3.2: Update ReminderSections Component**
**File:** `src/features/reminders/components/ReminderSections.tsx`

**Changes:**
1. Update section names:
   - `overdueReminders` → `criticalReminders`
   - `scheduledReminders` → `underWatchReminders`
   - Add `completedReminders` section

2. Update empty states for each tab
3. Update callout banners (Critical = red, Under Watch = green/blue)

**Dependencies:** Task 1.2, Task 3.1  
**Risk:** Low

---

#### **Task 3.3: Add Summary Cards to Page**
**File:** `src/features/reminders/Reminders.tsx`

**Changes:**
1. Add summary cards above tabs
2. Calculate metrics from reminders data
3. Handle loading states

**Layout:**
```
[Summary Cards Row]
[Tabs]
[Content]
```

**Dependencies:** Task 2.3  
**Risk:** Low

---

### **Phase 4: Reminder Card Enhancement** (Day 2-3 - 3-4 hours)
**Goal:** Update ReminderCard with progress bar and alarm icons

---

#### **Task 4.1: Update ReminderCard Layout**
**File:** `src/features/reminders/components/ReminderCard.tsx`

**Changes:**
1. Add AlarmStatusIcon to card header
2. Add ContractProgressBar to card body
3. Update layout:
   - Left: Alarm icon + Property info
   - Center: Days remaining + Progress bar
   - Right: Owner contact + Actions

4. Update "Days Remaining" display:
   - Critical: Large, red, prominent
   - Under Watch: Smaller, green, "X days until alert"
   - Completed: Gray, "Completed on [date]"

**Dependencies:** Task 2.1, Task 2.2  
**Risk:** Medium (layout changes)

---

#### **Task 4.2: Update ReminderCard for Different Tabs**
**File:** `src/features/reminders/components/ReminderCard.tsx`

**Changes:**
1. Conditional rendering based on tab:
   - Critical: Red styling, urgent actions
   - Under Watch: Green styling, monitoring actions
   - Completed: Gray styling, view-only actions

2. Different action buttons per tab:
   - Critical: "Mark as Contacted", "Add Note", "View Contract"
   - Under Watch: "View Details", "Add Note", "Disable Reminder"
   - Completed: "View Contract", "Re-enable Reminder"

**Dependencies:** Task 4.1  
**Risk:** Low

---

### **Phase 5: Data & Metrics** (Day 3 - 2-3 hours)
**Goal:** Add summary card data and trends

---

#### **Task 5.1: Add Summary Metrics Hook**
**File:** `src/features/reminders/hooks/useReminderMetrics.ts`

**Features:**
- Calculate total active contracts
- Calculate critical count (matches badge)
- Calculate pending actions (critical, not contacted)
- Calculate trends (this week, this month)
- Calculate completion rate

**Data Sources:**
- Use `remindersService.getAllReminders()`
- Filter and aggregate in hook

**Dependencies:** Task 1.1  
**Risk:** Low

---

#### **Task 5.2: Integrate Metrics into Summary Cards**
**File:** `src/features/reminders/components/ReminderSummaryCards.tsx`

**Changes:**
1. Use `useReminderMetrics()` hook
2. Display metrics in cards
3. Show trends (↑/↓ arrows)
4. Handle loading states

**Dependencies:** Task 5.1, Task 2.3  
**Risk:** Low

---

### **Phase 6: Polish & Interactions** (Day 3-4 - 2-3 hours)
**Goal:** Add tooltips, animations, and final touches

---

#### **Task 6.1: Add Hover Tooltips**
**Files:** 
- `src/features/reminders/components/AlarmStatusIcon.tsx`
- `src/features/reminders/components/ContractProgressBar.tsx`

**Features:**
- Tooltip on alarm icons
- Tooltip on progress bars
- Tooltip on summary cards

**Dependencies:** Task 2.1, Task 2.2  
**Risk:** Low

---

#### **Task 6.2: Add Translations**
**Files:**
- `public/locales/tr/reminders.json`
- `public/locales/en/reminders.json`

**New Keys Needed:**
- Tab labels: `tabs.critical`, `tabs.underWatch`, `tabs.completed`
- Summary cards: `summary.totalActive`, `summary.critical`, `summary.pending`
- Tooltips: `tooltips.alarmArmed`, `tooltips.alarmCritical`, `tooltips.progressBar`
- Progress: `progress.daysUntilCritical`, `progress.safeZone`, `progress.criticalZone`

**Dependencies:** None  
**Risk:** Low

---

#### **Task 6.3: Add Smooth Transitions**
**Files:**
- `src/features/reminders/Reminders.tsx`
- `src/features/reminders/components/ReminderCard.tsx`

**Features:**
- Smooth tab transitions
- Fade-in animations for cards
- Progress bar color transitions

**Dependencies:** All previous tasks  
**Risk:** Low (optional enhancement)

---

## 📊 Implementation Roadmap

### **Week 1: Core Functionality**

**Day 1 (Morning):**
- ✅ Task 1.1: Update Reminder Service Logic
- ✅ Task 1.2: Update Categorization Hook

**Day 1 (Afternoon):**
- ✅ Task 2.1: Create Progress Bar Component
- ✅ Task 2.2: Create Alarm Status Icon Component

**Day 2 (Morning):**
- ✅ Task 2.3: Create Summary Cards Component
- ✅ Task 3.1: Update Tab Structure

**Day 2 (Afternoon):**
- ✅ Task 3.2: Update ReminderSections
- ✅ Task 3.3: Add Summary Cards to Page

**Day 3 (Morning):**
- ✅ Task 4.1: Update ReminderCard Layout
- ✅ Task 4.2: Update ReminderCard for Tabs

**Day 3 (Afternoon):**
- ✅ Task 5.1: Add Summary Metrics Hook
- ✅ Task 5.2: Integrate Metrics

**Day 4:**
- ✅ Task 6.1: Add Tooltips
- ✅ Task 6.2: Add Translations
- ✅ Task 6.3: Add Animations (optional)
- ✅ Testing & Bug Fixes

---

## 🔄 Integration Points

### **Current → New Mapping:**

| Current | New | Action |
|---------|-----|--------|
| `overdueReminders` | `criticalReminders` | Rename + update logic |
| `upcomingReminders` | Merge into `criticalReminders` | Combine (both are <= 30 days) |
| `scheduledReminders` | `underWatchReminders` | Rename + update logic |
| `expiredContracts` | Merge into `completedReminders` | Optional: keep separate or merge |
| `ReminderBadge` | `AlarmStatusIcon` | New component (keep badge for urgency) |
| No progress bar | `ContractProgressBar` | New component |
| No summary cards | `ReminderSummaryCards` | New component |

---

## ⚠️ Breaking Changes & Migration

### **Potential Breaking Changes:**

1. **Tab IDs Change:**
   - Old: `overdue`, `upcoming`, `scheduled`, `expired`
   - New: `critical`, `underWatch`, `completed`
   - **Impact:** URL params, saved tab preferences
   - **Solution:** Add migration logic or handle both

2. **Categorization Logic Change:**
   - Old: Uses `rent_increase_reminder_days` (variable)
   - New: Uses fixed 30 days
   - **Impact:** Some reminders may move between tabs
   - **Solution:** This is intentional (part of requirement)

3. **Component Props:**
   - `ReminderCard` may need new props
   - **Impact:** Any custom usage
   - **Solution:** Backward compatible props

---

## 🧪 Testing Strategy

### **Unit Tests:**
- [ ] Reminder service categorization logic
- [ ] Progress bar calculation
- [ ] Summary metrics calculation

### **Integration Tests:**
- [ ] Tab switching works
- [ ] Badge count matches critical count
- [ ] "Mark as Contacted" updates badge immediately

### **Manual Testing:**
- [ ] Create contract with 25 days until expiry → Appears in Critical
- [ ] Create contract with 60 days until expiry → Appears in Under Watch
- [ ] Mark as contacted → Moves to Completed, badge decrements
- [ ] Progress bar color transitions correctly
- [ ] Tooltips show on hover
- [ ] Summary cards show correct counts

---

## 📝 File Structure (After Implementation)

```
src/features/reminders/
├── Reminders.tsx (updated)
├── components/
│   ├── ReminderCard.tsx (updated)
│   ├── ReminderSections.tsx (updated)
│   ├── ReminderBadge.tsx (keep for urgency)
│   ├── AlarmStatusIcon.tsx (NEW)
│   ├── ContractProgressBar.tsx (NEW)
│   ├── ReminderSummaryCards.tsx (NEW)
│   └── ReminderLoadingSkeleton.tsx (existing)
├── hooks/
│   ├── useRemindersData.ts (existing)
│   ├── useReminderCategories.ts (updated)
│   ├── useReminderActions.ts (existing)
│   ├── useReminderDialog.ts (existing)
│   └── useReminderMetrics.ts (NEW)
└── utils/
    └── (progress calculation helpers - NEW)
```

---

## ✅ Implementation Checklist

### **Phase 1: Foundation** (2-3 hours)
- [ ] Update `reminders.service.ts` categorization
- [ ] Add progress calculation method
- [ ] Update `useReminderCategories` hook
- [ ] Test categorization logic

### **Phase 2: Components** (4-5 hours)
- [ ] Create `ContractProgressBar` component
- [ ] Create `AlarmStatusIcon` component
- [ ] Create `ReminderSummaryCards` component
- [ ] Add tooltips to components

### **Phase 3: Page Structure** (3-4 hours)
- [ ] Update tab structure in `Reminders.tsx`
- [ ] Update `ReminderSections` component
- [ ] Add summary cards to page
- [ ] Update empty states

### **Phase 4: Card Enhancement** (3-4 hours)
- [ ] Update `ReminderCard` layout
- [ ] Add progress bar to cards
- [ ] Add alarm icons to cards
- [ ] Update action buttons per tab

### **Phase 5: Data & Metrics** (2-3 hours)
- [ ] Create `useReminderMetrics` hook
- [ ] Integrate metrics into summary cards
- [ ] Add trend calculations
- [ ] Test data accuracy

### **Phase 6: Polish** (2-3 hours)
- [ ] Add all translations
- [ ] Add hover tooltips
- [ ] Add smooth animations
- [ ] Final testing

**Total Estimated Time:** 16-22 hours (2-3 days)

---

## 🎯 Success Criteria

### **Functional:**
- ✅ Three tabs work correctly (Critical, Under Watch, Completed)
- ✅ Summary cards show accurate counts
- ✅ Badge count matches Critical tab count
- ✅ Progress bars show correct percentages and colors
- ✅ Alarm icons show correct status
- ✅ "Mark as Contacted" updates badge immediately

### **UX:**
- ✅ User can instantly see if alarm is set (green shield visible)
- ✅ User feels confident system is working (badge counts match)
- ✅ User knows what needs attention (Critical tab is clear)
- ✅ User feels in control (immediate feedback)

---

## 🚀 Ready to Implement?

### **Answer: YES, with phased approach**

**Why Phased:**
1. **Manageable:** Each phase is 2-4 hours
2. **Testable:** Can test after each phase
3. **Reversible:** Can rollback if issues
4. **Incremental:** Builds on previous work

**Recommended Approach:**
1. **Start with Phase 1** (Foundation) - Test categorization
2. **Then Phase 2** (Components) - Build reusable components
3. **Then Phase 3** (Structure) - Update page layout
4. **Then Phase 4** (Cards) - Enhance individual cards
5. **Then Phase 5** (Metrics) - Add summary data
6. **Finally Phase 6** (Polish) - Add finishing touches

**Each phase can be tested independently before moving to next.**

---

## 📋 Next Steps

1. **Review this plan** - Confirm approach and priorities
2. **Start Phase 1** - Update service logic (safest, no UI changes)
3. **Test Phase 1** - Verify categorization works
4. **Continue with Phase 2** - Build components
5. **Iterate** - Test each phase before proceeding

**Ready to begin Phase 1 when you are!**

---

**Document Version:** 1.0  
**Status:** ✅ Ready for Implementation  
**Estimated Total Time:** 16-22 hours (2-3 days)
