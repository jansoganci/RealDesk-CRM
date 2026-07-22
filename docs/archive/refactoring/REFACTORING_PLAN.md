# Component Refactoring Plan

## ✅ COMPLETED: Properties.tsx

### Before → After
- **Lines**: 729 → 279 (-62%)
- **useState hooks**: 16 → 3 (-81%)
- **Responsibilities**: 10 mixed → Separated into focused modules

### Refactoring Approach Used

We followed a **3-Phase Incremental Extraction Strategy**:

#### Phase 1: Extract Business Logic (Hooks)
1. **Filter Logic** → `usePropertyFilters.ts`
2. **Dialog States** → `usePropertyDialogs.ts`
3. **Actions (CRUD)** → `usePropertyActions.ts`
4. **Commission Logic** → `usePropertyCommission.ts`

#### Phase 2: Extract UI Components
5. **Filter UI** → `PropertyFilters.tsx`
6. **Card View** → `PropertyCard.tsx`

#### Phase 3: Extract Table & Utilities
7. **Table Row** → `PropertyTableRow.tsx`
8. **Table Headers** → `PropertyTableHeaders.tsx`
9. **Helper Functions** → `utils/statusUtils.ts`

### Final Structure
```
src/features/properties/
├── hooks/
│   ├── usePropertyFilters.ts
│   ├── usePropertyDialogs.ts
│   ├── usePropertyActions.ts
│   └── usePropertyCommission.ts
├── components/
│   ├── PropertyFilters.tsx
│   ├── PropertyCard.tsx
│   ├── PropertyTableRow.tsx
│   └── PropertyTableHeaders.tsx
├── utils/
│   └── statusUtils.ts
└── Properties.tsx (279 lines)
```

---

## 🎯 NEXT: Inquiries.tsx Refactoring Plan

### Current State
- **Lines**: 409
- **useState hooks**: 15
- **Main Issues**: 
  - Highest hook count relative to file size
  - Filtering logic mixed with component
  - 2 dialogs with state management
  - Property matching logic embedded

### Identified Responsibilities

1. **Filter Logic** (search, type filter, status filter)
2. **Dialog State Management** (inquiry dialog, matches dialog, delete dialog)
3. **Actions** (CRUD operations, load matches)
4. **Matching Logic** (property matching algorithm)
5. **Table Rendering** (table row component)
6. **Helper Functions** (status badges, filter options)

### Refactoring Sequence

#### **EXTRACTION #1: Filter Logic Hook** ⚡ START HERE
**File**: `src/features/inquiries/hooks/useInquiryFilters.ts`

**Extract**:
- `searchQuery` state & handler
- `inquiryTypeFilter` state & handler
- `statusFilter` state & handler
- Filter computation logic
- `filteredInquiries` calculation

**Interface**:
```typescript
export function useInquiryFilters(inquiries: PropertyInquiry[]) {
  return {
    filteredInquiries,
    searchQuery,
    setSearchQuery,
    inquiryTypeFilter,
    setInquiryTypeFilter,
    statusFilter,
    setStatusFilter,
  };
}
```

**Why First**: Simplest extraction, no dependencies, immediate clarity improvement.

---

#### **EXTRACTION #2: Dialog States Hook**
**File**: `src/features/inquiries/hooks/useInquiryDialogs.ts`

**Extract**:
- Inquiry dialog state (create/edit)
- Matches dialog state
- Delete dialog state
- All dialog handlers

**Interface**:
```typescript
export function useInquiryDialogs() {
  return {
    // Inquiry dialog
    isInquiryDialogOpen,
    selectedInquiry,
    openInquiryDialog,
    closeInquiryDialog,
    
    // Matches dialog
    isMatchesDialogOpen,
    selectedInquiryForMatches,
    openMatchesDialog,
    closeMatchesDialog,
    
    // Delete dialog
    isDeleteDialogOpen,
    inquiryToDelete,
    openDeleteDialog,
    closeDeleteDialog,
  };
}
```

**Estimated Reduction**: -50 lines

---

#### **EXTRACTION #3: Inquiry Actions Hook**
**File**: `src/features/inquiries/hooks/useInquiryActions.ts`

**Extract**:
- `handleCreate` / `handleUpdate`
- `handleDelete`
- `handleLoadMatches`
- All toast notifications
- Loading states

**Interface**:
```typescript
export function useInquiryActions(onSuccess?: () => void) {
  return {
    handleCreate,
    handleUpdate,
    handleDelete,
    handleLoadMatches,
    isLoading,
    matchesLoading,
  };
}
```

**Estimated Reduction**: -60 lines

---

#### **EXTRACTION #4: Matching Logic Hook** (Optional but Recommended)
**File**: `src/features/inquiries/hooks/usePropertyMatching.ts`

**Extract**:
- Property matching algorithm
- Match scoring logic
- Match filtering

**Interface**:
```typescript
export function usePropertyMatching() {
  return {
    findMatches,
    scoreMatch,
  };
}
```

**Estimated Reduction**: -40 lines

---

#### **EXTRACTION #5: Inquiry Table Row Component**
**File**: `src/features/inquiries/components/InquiryTableRow.tsx`

**Extract**:
- Single inquiry row rendering
- Status badge
- Contact info display
- Budget display
- Action buttons

**Estimated Reduction**: -80 lines

---

#### **EXTRACTION #6: Helper Utilities**
**File**: `src/features/inquiries/utils/inquiryUtils.ts`

**Extract**:
- `getStatusBadge()` function
- `getStatusFilterOptions()` function
- Status configuration

**Estimated Reduction**: -30 lines

---

### Expected Final Results

- **Target**: 409 → ~200 lines (-51%)
- **useState hooks**: 15 → 2 (-87%)
- **New files created**: 6 (4 hooks + 1 component + 1 utils)

---

## 📊 NEXT: Dashboard.tsx Refactoring Plan

### Current State
- **Lines**: 566
- **useState hooks**: 8
- **Main Issues**:
  - 9 different data queries in `loadStats()`
  - Exchange rate handling mixed with dashboard
  - Complex statistics aggregation
  - Action items calculation embedded

### Identified Responsibilities

1. **Data Fetching** (all 9 queries)
2. **Statistics Aggregation** (combining results)
3. **Exchange Rate Management** (loading, refreshing, display)
4. **Action Items Calculation** (missing info detection)
5. **Reminders Management** (loading, display)
6. **UI Components** (stat cards, action item cards)

### Refactoring Sequence

#### **EXTRACTION #1: Data Fetching Hook** ⚡ START HERE
**File**: `src/features/dashboard/hooks/useDashboardData.ts`

**Extract**:
- All 9 data queries
- Loading states
- Error handling
- Data transformation

**Interface**:
```typescript
export function useDashboardData() {
  return {
    stats,
    actionItems,
    reminders,
    loading,
    refreshData,
  };
}
```

**Why First**: Centralizes all data fetching, biggest impact on code clarity.

**Estimated Reduction**: -120 lines

---

#### **EXTRACTION #2: Exchange Rate Hook**
**File**: `src/features/dashboard/hooks/useExchangeRates.ts`

**Extract**:
- Exchange rate state
- Loading rates
- Refreshing rates
- Last updated timestamp
- Formatting utilities

**Interface**:
```typescript
export function useExchangeRates() {
  return {
    exchangeRates,
    lastUpdated,
    refreshingRates,
    refreshRates,
    formatLastUpdated,
  };
}
```

**Estimated Reduction**: -40 lines

---

#### **EXTRACTION #3: Statistics Aggregation Hook**
**File**: `src/features/dashboard/hooks/useStatistics.ts`

**Extract**:
- Stats calculation logic
- Transforming raw data into stats object
- Property type breakdowns

**Interface**:
```typescript
export function useStatistics(rawData: DashboardRawData) {
  return {
    stats,
    calculateStats,
  };
}
```

**Estimated Reduction**: -60 lines

---

#### **EXTRACTION #4: Action Items Component**
**File**: `src/features/dashboard/components/ActionItemsCard.tsx`

**Extract**:
- Action items display
- Missing info cards
- Navigate handlers

**Estimated Reduction**: -80 lines

---

#### **EXTRACTION #5: Reminders Section Component**
**File**: `src/features/dashboard/components/RemindersSection.tsx`

**Extract**:
- Reminders list rendering
- Reminder cards
- Empty states

**Estimated Reduction**: -60 lines

---

#### **EXTRACTION #6: Exchange Rates Card Component**
**File**: `src/features/dashboard/components/ExchangeRatesCard.tsx`

**Extract**:
- Exchange rates display
- Refresh button
- Last updated timestamp

**Estimated Reduction**: -40 lines

---

### Expected Final Results

- **Target**: 566 → ~250 lines (-56%)
- **useState hooks**: 8 → 1 (-87.5%)
- **New files created**: 6 (3 hooks + 3 components)

---

## 🔄 Refactoring Methodology

### General Rules

1. **Extract in Order of Dependencies**
   - Hooks first (business logic)
   - Components second (UI)
   - Utils last (pure functions)

2. **One Responsibility Per File**
   - Each hook = one concern
   - Each component = one UI piece

3. **Test After Each Extraction**
   - Verify functionality still works
   - Check TypeScript compilation
   - Ensure no runtime errors

4. **Incremental Approach**
   - Extract one thing at a time
   - Commit after each successful extraction
   - Review before next step

### Extraction Checklist

For each extraction:
- [ ] Create new file with extracted code
- [ ] Update main component to use extraction
- [ ] Remove old code from main component
- [ ] Update imports
- [ ] Verify TypeScript compiles
- [ ] Test functionality
- [ ] Check line count reduction
- [ ] Commit changes

### Safety Guidelines

1. **Preserve Functionality**: Never change behavior during extraction
2. **Maintain Types**: Keep all TypeScript types intact
3. **Keep Tests Passing**: If tests exist, they should still pass
4. **Incremental Commits**: Commit after each successful extraction

---

## 📈 Success Metrics

### Properties.tsx (✅ Achieved)
- ✅ 62% line reduction (729 → 279)
- ✅ 81% hook reduction (16 → 3)
- ✅ 9 new focused files
- ✅ Zero functionality loss

### Inquiries.tsx (Target)
- 🎯 51% line reduction (409 → ~200)
- 🎯 87% hook reduction (15 → 2)
- 🎯 6 new focused files

### Dashboard.tsx (Target)
- 🎯 56% line reduction (566 → ~250)
- 🎯 87.5% hook reduction (8 → 1)
- 🎯 6 new focused files

---

## 🚀 Next Steps

1. **Start with Inquiries.tsx** (smaller, more straightforward)
2. **Follow the 6 extractions in order**
3. **Test thoroughly after each step**
4. **Move to Dashboard.tsx** after Inquiries is complete

Would you like me to start with Inquiries.tsx refactoring?

