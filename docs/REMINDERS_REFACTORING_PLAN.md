# Reminders.tsx Refactoring Plan

**Component**: `src/features/reminders/Reminders.tsx`  
**Current State**: 492 lines, 9 useState hooks, 2 useEffect hooks  
**Target**: ~250 lines (-49% reduction)

---

## Current Structure Analysis

### Main Responsibilities Identified

1. **Data Loading** (~15 lines)
   - `reminders` state
   - `loading` state
   - `errorKey` state
   - `loadReminders` function
   - Error handling with toast

2. **Reminder Categorization** (~15 lines)
   - Categorize reminders (overdue, upcoming, scheduled, expired)
   - Tab initialization logic
   - `activeTab` state
   - `tabInitialized` state
   - Tab selection based on available reminders

3. **Reminder Actions** (~15 lines)
   - `actionLoading` state (per reminder ID)
   - `handleMarkAsContacted` function
   - Mark as contacted functionality
   - Loading state management

4. **Dialog Management** (~10 lines)
   - `selectedReminder` state
   - `showContactDialog` state
   - Contact confirmation dialog

5. **Reminder Badge Logic** (~25 lines)
   - `getReminderBadge` function
   - Urgency category determination
   - Badge rendering with different styles

6. **ReminderCard Component** (~123 lines, inline)
   - Complete reminder card rendering
   - Property, tenant, owner information
   - Dates, rent amounts
   - Action buttons
   - Contact information display

7. **LoadingSkeleton Component** (~38 lines, inline)
   - Loading skeleton UI
   - Tab skeleton
   - Card skeletons

8. **UI Rendering** (~230 lines)
   - Main layout and page structure
   - Tab navigation
   - Section rendering (overdue, upcoming, scheduled, expired)
   - Empty states for each section
   - Error state
   - Contact dialog

---

## Refactoring Strategy

### Phase 1: Core Hooks (Logic Extraction) - Priority Order
1. **Extraction #1**: Reminders Data Fetching Hook
2. **Extraction #2**: Reminder Categorization Hook
3. **Extraction #3**: Reminder Actions Hook
4. **Extraction #4**: Reminder Dialog Hook

**After Phase 1 Expected**: ~340 lines (-152 lines)

### Phase 2: UI Components (Component Extraction)
5. **Extraction #5**: Reminder Card Component
6. **Extraction #6**: Reminder Badge Component
7. **Extraction #7**: Loading Skeleton Component
8. **Extraction #8**: Reminder Sections Component

**After Phase 2 Expected**: ~250 lines (-90 lines)

---

## Detailed Extraction Plan

### **EXTRACTION #1: Reminders Data Fetching Hook** 🔴 HIGH PRIORITY
**File**: `src/features/reminders/hooks/useRemindersData.ts`

**What to Extract:**
- `reminders` state
- `loading` state
- `errorKey` state
- `loadReminders` function
- `useEffect` for initial load
- Error handling with toast

**Props:**
```typescript
interface UseRemindersDataReturn {
  reminders: ReminderWithDetails[];
  loading: boolean;
  errorKey: string | null;
  refreshData: () => Promise<void>;
}
```

**Estimated Reduction**: -18 lines

---

### **EXTRACTION #2: Reminder Categorization Hook** 🔴 HIGH PRIORITY
**File**: `src/features/reminders/hooks/useReminderCategories.ts`

**What to Extract:**
- Reminder categorization logic
- `activeTab` state
- `tabInitialized` state
- Tab initialization logic (default tab selection)
- Categorized reminder arrays (overdue, upcoming, scheduled, expired)

**Props:**
```typescript
interface UseReminderCategoriesOptions {
  reminders: ReminderWithDetails[];
}

interface UseReminderCategoriesReturn {
  overdueReminders: ReminderWithDetails[];
  upcomingReminders: ReminderWithDetails[];
  scheduledReminders: ReminderWithDetails[];
  expiredContracts: ReminderWithDetails[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}
```

**Note**: Tab initialization logic automatically selects the first tab with content on initial load.

**Estimated Reduction**: -25 lines

---

### **EXTRACTION #3: Reminder Actions Hook** 🔴 HIGH PRIORITY
**File**: `src/features/reminders/hooks/useReminderActions.ts`

**What to Extract:**
- `actionLoading` state (per reminder ID)
- `handleMarkAsContacted` function
- Loading state management
- Toast notifications

**Props:**
```typescript
interface UseReminderActionsOptions {
  refreshData: () => Promise<void>;
}

interface UseReminderActionsReturn {
  actionLoading: string | null;
  handleMarkAsContacted: (contractId: string) => Promise<void>;
}
```

**Estimated Reduction**: -20 lines

---

### **EXTRACTION #4: Reminder Dialog Hook** 🟡 MEDIUM PRIORITY
**File**: `src/features/reminders/hooks/useReminderDialog.ts`

**What to Extract:**
- `selectedReminder` state
- `showContactDialog` state
- Dialog open/close handlers

**Props:**
```typescript
interface UseReminderDialogReturn {
  selectedReminder: ReminderWithDetails | null;
  showContactDialog: boolean;
  openContactDialog: (reminder: ReminderWithDetails) => void;
  closeContactDialog: () => void;
}
```

**Estimated Reduction**: -15 lines

---

### **EXTRACTION #5: Reminder Card Component** 🟡 MEDIUM PRIORITY
**File**: `src/features/reminders/components/ReminderCard.tsx`

**What to Extract:**
- Inline `ReminderCard` component (lines 134-257)
- Property, tenant, owner information display
- Dates, rent amounts display
- Action buttons
- Contact information section
- Notes section

**Props:**
```typescript
interface ReminderCardProps {
  reminder: ReminderWithDetails;
  actionLoading: string | null;
  onMarkAsContacted: (reminder: ReminderWithDetails) => void;
}
```

**Estimated Reduction**: -125 lines

---

### **EXTRACTION #6: Reminder Badge Component** 🟡 MEDIUM PRIORITY
**File**: `src/features/reminders/components/ReminderBadge.tsx`

**What to Extract:**
- `getReminderBadge` function
- Urgency category determination
- Badge rendering logic

**Props:**
```typescript
interface ReminderBadgeProps {
  reminder: ReminderWithDetails;
}
```

**Estimated Reduction**: -28 lines

---

### **EXTRACTION #7: Loading Skeleton Component** 🟢 LOW PRIORITY
**File**: `src/features/reminders/components/ReminderLoadingSkeleton.tsx`

**What to Extract:**
- Inline `LoadingSkeleton` component (lines 259-297)
- Tab skeleton
- Card skeletons

**Props:**
```typescript
// No props needed - standalone component
```

**Estimated Reduction**: -40 lines

---

### **EXTRACTION #8: Reminder Sections Component** 🟢 LOW PRIORITY
**File**: `src/features/reminders/components/ReminderSections.tsx`

**What to Extract:**
- Tab section rendering logic
- Empty states for each section
- Callout banners (overdue, expired)
- Section content rendering

**Props:**
```typescript
interface ReminderSectionsProps {
  activeTab: string;
  overdueReminders: ReminderWithDetails[];
  upcomingReminders: ReminderWithDetails[];
  scheduledReminders: ReminderWithDetails[];
  expiredContracts: ReminderWithDetails[];
  actionLoading: string | null;
  onMarkAsContacted: (reminder: ReminderWithDetails) => void;
  renderReminderCard: (reminder: ReminderWithDetails) => React.ReactNode;
}
```

**Note**: This extraction may be optional if sections are simple enough to keep in main component.

**Estimated Reduction**: -80 lines (optional)

---

## Expected Results

### Final Metrics
- **Original**: 492 lines
- **Final**: ~250 lines
- **Total Reduction**: ~242 lines (49% reduction)

### Files to Create
- **Hooks**: 4 files
  - `hooks/useRemindersData.ts`
  - `hooks/useReminderCategories.ts`
  - `hooks/useReminderActions.ts`
  - `hooks/useReminderDialog.ts`

- **Components**: 3-4 files
  - `components/ReminderCard.tsx`
  - `components/ReminderBadge.tsx`
  - `components/ReminderLoadingSkeleton.tsx`
  - `components/ReminderSections.tsx` (optional)

**Total**: 7-8 new modular files

---

## Benefits

1. **Maintainability**: Each piece has a single responsibility
2. **Testability**: Hooks and components can be tested independently
3. **Reusability**: Reminder card and badge can be reused elsewhere
4. **Readability**: Main component focuses on orchestration only
5. **Consistency**: Follows patterns from Properties, Inquiries, Dashboard, and Contracts refactoring

---

## Key Considerations

1. **Categorization Logic**: Uses `remindersService.categorizeReminders()` - ensure this is preserved
2. **Tab Initialization**: Complex logic for selecting default tab - extract carefully
3. **Action Loading**: Per-reminder loading state (string | null) pattern
4. **Refresh Pattern**: All hooks should accept a `refreshData` callback for consistency
5. **Error Handling**: Maintain existing error handling and toast notifications
6. **Service Usage**: `remindersService` methods are used - ensure imports are correct

---

## Refactoring Sequence

### Phase 1: Core Hooks (Logic Extraction) - Priority Order

1. ✅ **Extraction #1**: Reminders Data Fetching Hook (foundation)
2. ✅ **Extraction #2**: Reminder Categorization Hook (depends on #1)
3. ✅ **Extraction #3**: Reminder Actions Hook (depends on #1)
4. ✅ **Extraction #4**: Reminder Dialog Hook (independent)

**After Phase 1 Expected**: ~340 lines (-152 lines)

### Phase 2: UI Components (Component Extraction)

5. ✅ **Extraction #5**: Reminder Card Component
6. ✅ **Extraction #6**: Reminder Badge Component
7. ✅ **Extraction #7**: Loading Skeleton Component
8. ⚠️ **Extraction #8**: Reminder Sections Component (optional, evaluate complexity)

**After Phase 2 Expected**: ~250 lines (-90 lines)

---

## Similar Patterns from Previous Refactorings

Following patterns from:
- **Contracts.tsx**: Data hooks, action hooks, dialog hooks
- **Properties.tsx**: Component extraction, filter hooks
- **Inquiries.tsx**: Dialog hooks, action hooks
- **Dashboard.tsx**: Data hooks, categorization logic

