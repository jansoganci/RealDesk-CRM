# Tenants.tsx Refactoring Plan

## 📋 Overview

**Current State:**
- **File**: `src/features/tenants/Tenants.tsx`
- **Lines**: 336
- **useState hooks**: 12 (too many!)
- **Complexity**: 🟡 MEDIUM-HIGH

**Target State:**
- **Estimated Final Lines**: ~196 lines (42% reduction)
- **Goal**: Match the refactored Properties/Inquiries pattern
- **Structure**: Modular hooks + extracted components

---

## 🔍 Current State Analysis

### File Statistics
- **Current Lines**: 336 lines
- **Imports**: 16 imports
- **React Hooks Used**: 12 useState hooks
- **Functions**: 8 handler functions
- **UI Sections**: Uses `ListPageTemplate` (good!)

### Responsibilities (Current Issues)

1. **Data Management** 🔴 HIGH PRIORITY
   - `tenants` state
   - `loading` state
   - `loadTenants()` function
   - Initial data loading (useEffect)

2. **Filtering Logic** 🔴 HIGH PRIORITY
   - `filteredTenants` state
   - `searchQuery` state
   - `assignmentFilter` state
   - `filterTenants()` function
   - Filter logic useEffect

3. **Dialog Management** 🔴 HIGH PRIORITY
   - `enhancedDialogOpen` state (create)
   - `enhancedEditDialogOpen` state (edit)
   - `deleteDialogOpen` state
   - `selectedTenant` state
   - `tenantToDelete` state
   - Dialog handlers

4. **Action Handlers** 🟡 MEDIUM PRIORITY
   - `actionLoading` state
   - `handleDeleteConfirm()` function
   - `handleEnhancedSubmit()` function
   - `handleEnhancedEditSuccess()` function
   - `handleScheduleMeeting()` function

5. **UI Components** 🟢 LOW PRIORITY
   - `getAssignmentBadge()` utility function
   - Table row rendering (can extract)
   - Card content rendering (can extract)

---

## 🎯 Target State

### Goal
- **Target Lines**: ~196 lines (42% reduction, matching Inquiries.tsx)
- **Target Structure**: 4 hooks + 2 optional components
- **Target Hooks**: Data, Filters, Dialogs, Actions

---

## 📝 Extraction Plan

### Phase 1: Core Hooks (Logic Extraction)

#### **EXTRACTION #1: Tenants Data Hook** 🔴 HIGH PRIORITY
**File**: `src/features/tenants/hooks/useTenantsData.ts`

**What to Extract:**
- `tenants` state
- `loading` state
- `loadTenants()` function
- Initial data loading (useEffect)
- Error handling with toast

**Props:**
```typescript
interface UseTenantsDataReturn {
  tenants: TenantWithProperty[];
  loading: boolean;
  refreshData: () => Promise<void>;
}
```

**Estimated Reduction**: ~15 lines

---

#### **EXTRACTION #2: Tenant Filters Hook** 🔴 HIGH PRIORITY
**File**: `src/features/tenants/hooks/useTenantFilters.ts`

**What to Extract:**
- `searchQuery` state
- `assignmentFilter` state
- `filteredTenants` calculation (useMemo)
- Filter logic (search + assignment filter)

**Props:**
```typescript
interface UseTenantFiltersOptions {
  tenants: TenantWithProperty[];
}

interface UseTenantFiltersReturn {
  filteredTenants: TenantWithProperty[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  assignmentFilter: string;
  setAssignmentFilter: (filter: string) => void;
}
```

**Estimated Reduction**: ~25 lines

---

#### **EXTRACTION #3: Tenant Dialogs Hook** 🔴 HIGH PRIORITY
**File**: `src/features/tenants/hooks/useTenantDialogs.ts`

**What to Extract:**
- `enhancedDialogOpen` state
- `enhancedEditDialogOpen` state
- `deleteDialogOpen` state
- `selectedTenant` state
- `tenantToDelete` state
- Dialog open/close handlers

**Props:**
```typescript
interface UseTenantDialogsReturn {
  // Create dialog
  isCreateOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;

  // Edit dialog
  isEditOpen: boolean;
  selectedTenant: TenantWithProperty | null;
  openEdit: (tenant: TenantWithProperty) => void;
  closeEdit: () => void;

  // Delete dialog
  isDeleteDialogOpen: boolean;
  tenantToDelete: TenantWithProperty | null;
  openDeleteDialog: (tenant: TenantWithProperty) => void;
  closeDeleteDialog: () => void;
}
```

**Estimated Reduction**: ~30 lines

---

#### **EXTRACTION #4: Tenant Actions Hook** 🟡 MEDIUM PRIORITY
**File**: `src/features/tenants/hooks/useTenantActions.ts`

**What to Extract:**
- `actionLoading` state
- `handleDeleteConfirm()` function
- `handleEnhancedSubmit()` function
- `handleEnhancedEditSuccess()` function
- `handleScheduleMeeting()` function (with navigate)
- Success/error handling with toast

**Props:**
```typescript
interface UseTenantActionsOptions {
  refreshData: () => Promise<void>;
  onCloseCreate?: () => void;
  onCloseEdit?: () => void;
  onCloseDelete?: () => void;
}

interface UseTenantActionsReturn {
  handleDeleteConfirm: (tenant: TenantWithProperty) => Promise<void>;
  handleEnhancedSubmit: (result: TenantWithContractResult) => Promise<void>;
  handleEnhancedEditSuccess: () => Promise<void>;
  handleScheduleMeeting: (tenant: TenantWithProperty) => void;
  isLoading: boolean;
}
```

**Estimated Reduction**: ~40 lines

---

### Phase 2: UI Components (Component Extraction) - Optional

#### **EXTRACTION #5: Tenant Table Row Component** 🟢 LOW PRIORITY
**File**: `src/features/tenants/components/TenantTableRow.tsx`

**What to Extract:**
- Table row rendering logic (lines 173-235)
- Contact info display
- Property info display
- Assignment badge logic
- Action buttons

**Props:**
```typescript
interface TenantTableRowProps {
  tenant: TenantWithProperty;
  onEdit: (tenant: TenantWithProperty) => void;
  onDelete: (tenant: TenantWithProperty) => void;
  onScheduleMeeting: (tenant: TenantWithProperty) => void;
  getAssignmentBadge: (tenant: TenantWithProperty) => React.ReactNode;
}
```

**Estimated Reduction**: ~60 lines

---

#### **EXTRACTION #6: Tenant Card Component** 🟢 LOW PRIORITY
**File**: `src/features/tenants/components/TenantCard.tsx`

**What to Extract:**
- Card content rendering logic (lines 236-309)
- Header section
- Body section (property info, contact actions)
- Footer section (action buttons)

**Props:**
```typescript
interface TenantCardProps {
  tenant: TenantWithProperty;
  onEdit: (tenant: TenantWithProperty) => void;
  onDelete: (tenant: TenantWithProperty) => void;
  onScheduleMeeting: (tenant: TenantWithProperty) => void;
  getAssignmentBadge: (tenant: TenantWithProperty) => React.ReactNode;
}
```

**Estimated Reduction**: ~75 lines

---

#### **EXTRACTION #7: Assignment Badge Utility** 🟢 LOW PRIORITY
**File**: `src/features/tenants/utils/badgeUtils.ts`

**What to Extract:**
- `getAssignmentBadge()` function
- Badge rendering logic

**Props:**
```typescript
export function getAssignmentBadge(
  tenant: TenantWithProperty,
  t: (key: string) => string
): React.ReactNode;
```

**Estimated Reduction**: ~5 lines

---

## 📊 Expected Results

### Core Hooks Only (Recommended)
- **Original**: 336 lines
- **After Hooks**: ~196 lines
- **Reduction**: -140 lines (42% reduction)

### With Components (Optional)
- **Original**: 336 lines
- **After All**: ~120 lines
- **Reduction**: -216 lines (64% reduction)

---

## 🎯 Recommended Approach

### Step 1: Core Hooks (Required) ✅
1. Extract `useTenantsData` hook
2. Extract `useTenantFilters` hook
3. Extract `useTenantDialogs` hook
4. Extract `useTenantActions` hook

**Result**: ~196 lines (42% reduction) - **Matches Inquiries.tsx pattern**

### Step 2: UI Components (Optional - Do Later)
5. Extract `TenantTableRow` component (if needed for reuse)
6. Extract `TenantCard` component (if needed for reuse)
7. Extract badge utility (if needed for reuse)

**Result**: ~120 lines (64% reduction) - **Maximum modularity**

---

## 📁 Files to Create

### Required Files (4):
1. `hooks/useTenantsData.ts` (~40 lines)
2. `hooks/useTenantFilters.ts` (~45 lines)
3. `hooks/useTenantDialogs.ts` (~60 lines)
4. `hooks/useTenantActions.ts` (~70 lines)

### Optional Files (3):
5. `components/TenantTableRow.tsx` (~80 lines)
6. `components/TenantCard.tsx` (~90 lines)
7. `utils/badgeUtils.ts` (~20 lines)

**Total**: 4-7 new modular files

---

## 🔄 Refactoring Sequence

### Phase 1: Core Hooks (Do This First)

1. **EXTRACTION #1**: Tenants Data Hook
   - Create `useTenantsData.ts`
   - Extract data fetching logic
   - Update `Tenants.tsx` to use hook

2. **EXTRACTION #2**: Tenant Filters Hook
   - Create `useTenantFilters.ts`
   - Extract filtering logic
   - Update `Tenants.tsx` to use hook

3. **EXTRACTION #3**: Tenant Dialogs Hook
   - Create `useTenantDialogs.ts`
   - Extract dialog management
   - Update `Tenants.tsx` to use hook

4. **EXTRACTION #4**: Tenant Actions Hook
   - Create `useTenantActions.ts`
   - Extract action handlers
   - Update `Tenants.tsx` to use hook

### Phase 2: UI Components (Optional)

5. **EXTRACTION #5**: Tenant Table Row Component
6. **EXTRACTION #6**: Tenant Card Component
7. **EXTRACTION #7**: Assignment Badge Utility

---

## ✅ Success Criteria

After refactoring, `Tenants.tsx` should:

1. ✅ Use `ListPageTemplate` (already done)
2. ✅ Have ~196 lines (42% reduction)
3. ✅ Use 4 focused hooks
4. ✅ Follow Properties/Inquiries pattern
5. ✅ Be easy to test and maintain
6. ✅ Match code style of refactored components

---

## 📝 Notes

- **Follow Properties Pattern**: Use same hook structure as `usePropertyFilters`, `usePropertyDialogs`, etc.
- **Follow Inquiries Pattern**: Similar extraction approach
- **Maintain Functionality**: All existing features must work
- **Type Safety**: Full TypeScript support
- **i18n**: Preserve all translations

---

**Last Updated**: 2025-01-15
**Status**: Ready for Implementation
**Estimated Time**: 2-3 hours for Phase 1 (Core Hooks)

