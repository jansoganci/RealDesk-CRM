# Contracts.tsx Refactoring Plan

**Component**: `src/features/contracts/Contracts.tsx`  
**Current State**: 494 lines, 10 useState hooks, 2 useEffect hooks  
**Target**: ~250 lines (-49% reduction)

---

## Current Structure Analysis

### Main Responsibilities Identified

1. **Data Loading** (~12 lines)
   - `loadContracts` function
   - Loading state management
   - Error handling

2. **Filter Logic** (~18 lines)
   - Search query filtering (tenant name, property address)
   - Status filtering
   - `filterContracts` function
   - `useEffect` for filtering

3. **PDF Actions** (~100 lines)
   - PDF upload functionality (file selection, validation, upload)
   - PDF download functionality
   - `PdfActionButtons` inline component (lines 216-260)
   - Upload loading state

4. **Delete Actions** (~30 lines)
   - Delete confirmation dialog state
   - Delete handler with PDF cleanup
   - Action loading state

5. **Utility Functions** (~20 lines)
   - `getStatusBadge` function
   - `isExpiringSoon` function
   - `handleAddContract`, `handleEditContract`

6. **UI Rendering** (~280 lines)
   - ListPageTemplate with all props
   - Table headers
   - Table row rendering
   - Card content rendering
   - Import banner component

---

## Refactoring Strategy

### Phase 1: Extract Data & Filter Hooks (Foundation)
### Phase 2: Extract Actions Hook (Business Logic)
### Phase 3: Extract UI Components (Presentation)

---

## Detailed Extraction Plan

### **EXTRACTION #1: Contracts Data Fetching Hook** 🔴 HIGH PRIORITY
**File**: `src/features/contracts/hooks/useContractsData.ts`

**What to Extract:**
- `contracts` state
- `loading` state
- `loadContracts` function
- `useEffect` for initial load

**Props:**
```typescript
interface UseContractsDataReturn {
  contracts: ContractWithDetails[];
  loading: boolean;
  refreshData: () => Promise<void>;
}
```

**Estimated Reduction**: -15 lines

---

### **EXTRACTION #2: Contracts Filter Hook** 🔴 HIGH PRIORITY
**File**: `src/features/contracts/hooks/useContractsFilters.ts`

**What to Extract:**
- `searchQuery` state & `setSearchQuery`
- `statusFilter` state & `setStatusFilter`
- `filteredContracts` state & calculation
- `filterContracts` function
- `useEffect` for filtering

**Props:**
```typescript
interface UseContractsFiltersOptions {
  contracts: ContractWithDetails[];
}

interface UseContractsFiltersReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  filteredContracts: ContractWithDetails[];
}
```

**Estimated Reduction**: -30 lines

---

### **EXTRACTION #3: Contracts Actions Hook** 🔴 HIGH PRIORITY
**File**: `src/features/contracts/hooks/useContractsActions.ts`

**What to Extract:**
- `deleteDialogOpen` state
- `contractToDelete` state
- `actionLoading` state
- `handleDeleteClick` function
- `handleDeleteConfirm` function
- `handleAddContract` function
- `handleEditContract` function
- `refreshData` callback integration

**Props:**
```typescript
interface UseContractsActionsOptions {
  refreshData: () => Promise<void>;
}

interface UseContractsActionsReturn {
  deleteDialogOpen: boolean;
  contractToDelete: ContractWithDetails | null;
  actionLoading: boolean;
  handleDeleteClick: (contract: ContractWithDetails) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;
  handleAddContract: () => void;
  handleEditContract: (contract: ContractWithDetails) => void;
}
```

**Estimated Reduction**: -45 lines

---

### **EXTRACTION #4: PDF Actions Hook** 🔴 HIGH PRIORITY
**File**: `src/features/contracts/hooks/useContractsPdfActions.ts`

**What to Extract:**
- `uploadingContractId` state
- `handleDownloadPdf` function
- `handleUploadPdfClick` function
- `handlePdfFileSelected` function
- File validation logic
- Upload/download logic

**Props:**
```typescript
interface UseContractsPdfActionsOptions {
  refreshData: () => Promise<void>;
}

interface UseContractsPdfActionsReturn {
  uploadingContractId: string | null;
  actionLoading: boolean;
  handleDownloadPdf: (contract: ContractWithDetails) => Promise<void>;
  handleUploadPdfClick: (contractId: string) => void;
}
```

**Estimated Reduction**: -70 lines

---

### **EXTRACTION #5: PDF Action Buttons Component** 🟡 MEDIUM PRIORITY
**File**: `src/features/contracts/components/ContractPdfActionButtons.tsx`

**What to Extract:**
- `PdfActionButtons` inline component (lines 216-260)
- Upload/download button rendering
- Loading states

**Props:**
```typescript
interface ContractPdfActionButtonsProps {
  contract: ContractWithDetails;
  uploadingContractId: string | null;
  actionLoading: boolean;
  onDownload: (contract: ContractWithDetails) => void;
  onUpload: (contractId: string) => void;
  onEdit: (contract: ContractWithDetails) => void;
  onDelete: (contract: ContractWithDetails) => void;
}
```

**Estimated Reduction**: -50 lines

---

### **EXTRACTION #6: Contract Status Badge Component** 🟡 MEDIUM PRIORITY
**File**: `src/features/contracts/components/ContractStatusBadge.tsx`

**What to Extract:**
- `getStatusBadge` function
- Status badge rendering logic

**Props:**
```typescript
interface ContractStatusBadgeProps {
  status: string;
  hasPdf?: boolean;
}
```

**Estimated Reduction**: -20 lines

---

### **EXTRACTION #7: Contract Utilities** 🟢 LOW PRIORITY
**File**: `src/features/contracts/utils/contractUtils.ts`

**What to Extract:**
- `isExpiringSoon` function
- Status badge configuration
- Other utility functions

**Estimated Reduction**: -15 lines

---

### **EXTRACTION #8: Contract Import Banner Component** 🟢 LOW PRIORITY
**File**: `src/features/contracts/components/ContractImportBanner.tsx`

**What to Extract:**
- Import banner UI (lines 283-303)
- Banner message and button

**Props:**
```typescript
interface ContractImportBannerProps {
  onImportClick: () => void;
}
```

**Estimated Reduction**: -25 lines

---

## 🔄 Refactoring Sequence

### Phase 1: Core Hooks (Logic Extraction) - Priority Order

1. **Extraction #1**: Contracts Data Fetching Hook (foundation)
2. **Extraction #2**: Contracts Filter Hook (depends on #1)
3. **Extraction #3**: Contracts Actions Hook (depends on #1)
4. **Extraction #4**: PDF Actions Hook (depends on #1)

**After Phase 1 Expected**: ~330 lines (-164 lines)

### Phase 2: UI Components (Component Extraction)

5. **Extraction #5**: PDF Action Buttons Component
6. **Extraction #6**: Contract Status Badge Component
7. **Extraction #7**: Contract Utilities
8. **Extraction #8**: Contract Import Banner Component

**After Phase 2 Expected**: ~250 lines (-80 lines)

---

## 📊 Expected Results

### Final Metrics
- **Original**: 494 lines
- **Final**: ~250 lines
- **Total Reduction**: ~244 lines (49% reduction)

### Files to Create
- **Hooks**: 4 files
  - `useContractsData.ts`
  - `useContractsFilters.ts`
  - `useContractsActions.ts`
  - `useContractsPdfActions.ts`
- **Components**: 3 files
  - `ContractPdfActionButtons.tsx`
  - `ContractStatusBadge.tsx`
  - `ContractImportBanner.tsx`
- **Utils**: 1 file
  - `contractUtils.ts`

**Total**: 8 new modular files

---

## ✅ Benefits

1. **Maintainability**: Each piece has a single responsibility
2. **Testability**: Hooks and components can be tested independently
3. **Reusability**: PDF actions hook can be reused in other contract contexts
4. **Readability**: Main component focuses on orchestration only
5. **Type Safety**: All TypeScript types preserved throughout

---

## 🎯 Key Considerations

1. **Similar Patterns**: Follow patterns from Dashboard and Properties refactoring
2. **PDF Actions**: The PDF upload/download logic is complex and should be isolated
3. **Action Loading**: Multiple actions share the same loading state - consolidate
4. **Refresh Pattern**: All hooks should accept a `refreshData` callback for consistency
5. **Error Handling**: Maintain existing error handling and toast notifications

---

## 📝 Notes

- The `PdfActionButtons` component is currently inline (lines 216-260) - this is a clear candidate for extraction
- Delete confirmation dialog state management can be simplified with a hook
- PDF upload validation (file type, size) is currently inline - should be in the hook
- Status badge logic is repeated in multiple places - extract to component

---

**Created**: 2025-01-11  
**Status**: Planning Complete - Ready for Implementation

