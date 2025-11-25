# EnhancedTenantEditDialog.tsx Refactoring Plan

## 📋 Overview

**Current State:**
- **File**: `src/features/tenants/EnhancedTenantEditDialog.tsx`
- **Lines**: 518
- **useState hooks**: 5
- **Complexity**: 🔴 HIGH

**Target State:**
- **Estimated Final Lines**: ~150-200 (60-70% reduction)
- **Goal**: Modular, testable, maintainable multi-step dialog component

---

## 🔍 Identified Responsibilities

### 1. **Validation Schema** (Lines 35-65) ✅ CAN EXTRACT
   - Tenant validation rules
   - Contract validation rules
   - Custom refine logic (end date after start date)
   - **Extraction**: Move to `tenantSchemas.ts` or `validations/tenantValidation.ts`

### 2. **Steps Configuration** (Lines 76-95) ✅ CAN EXTRACT
   - Step definitions (id, title, description, icon)
   - **Extraction**: Move to `constants/tenantSteps.ts` or inline constant

### 3. **Multi-Step Form State Management** (Lines 103-107, 231-242)
   - Current step state
   - Step navigation logic (handleNext, handleBack)
   - Step validation logic (validateCurrentStep)
   - Progress calculation
   - **Extraction**: Create `useMultiStepForm.ts` hook

### 4. **Data Loading Logic** (Lines 133-200)
   - Load tenant and contract data
   - Find primary contract
   - Populate form with existing data
   - Set default values for new contracts
   - Loading state management
   - **Extraction**: Create `useTenantEditData.ts` hook

### 5. **Form Submission Logic** (Lines 244-326) 🔴 LARGEST EXTRACTION
   - Final validation
   - Tenant update
   - Contract update/create
   - PDF upload handling
   - Success/error handling
   - **Extraction**: Create `useTenantEditSubmission.ts` hook

### 6. **Form Reset Logic** (Lines 140-147)
   - Reset form when dialog closes
   - Reset step to 1
   - Clear PDF file
   - Clear primary contract
   - **Extraction**: Include in `useMultiStepForm.ts` or create separate hook

### 7. **Dialog UI Components** (Lines 363-516)
   - Loading state UI
   - Progress bar component
   - Step indicators component
   - Contract status info component
   - Navigation buttons component
   - **Extraction**: Extract to separate UI components

---

## 🎯 Extraction Strategy

### Phase 1: Core Hooks (Logic Extraction)
Extract reusable hooks to separate business logic from UI.

### Phase 2: UI Components (Component Extraction)
Extract dialog UI sections into reusable components.

### Phase 3: Utilities & Constants
Extract validation schemas, constants, and utility functions.

---

## 📝 Detailed Extraction Plan

### **EXTRACTION #1: Validation Schema** 🟡 MEDIUM PRIORITY
**File**: `src/features/tenants/schemas/tenantEditSchema.ts` or `src/features/tenants/validations/tenantEditValidation.ts`

**What to Extract:**
- `enhancedTenantEditSchema` (Lines 35-65)
- Export schema factory function (for i18n support)
- Export TypeScript type

**Estimated Reduction**: -30 lines

**Note**: Consider i18n support like in other schemas

---

### **EXTRACTION #2: Steps Configuration** 🟢 LOW PRIORITY
**File**: `src/features/tenants/constants/tenantSteps.ts`

**What to Extract:**
- `STEPS` constant (Lines 76-95)

**Estimated Reduction**: -20 lines

---

### **EXTRACTION #3: Multi-Step Form Hook** 🔴 HIGH PRIORITY
**File**: `src/features/tenants/hooks/useMultiStepForm.ts`

**What to Extract:**
- `currentStep` state
- `handleNext` function
- `handleBack` function
- `validateCurrentStep` function
- `getStepProgress` function
- `isLastStep` calculation
- `isFirstStep` calculation
- Reset logic (step reset, form reset when dialog closes)

**Props:**
```typescript
interface UseMultiStepFormOptions<T extends FieldValues> {
  form: UseFormReturn<T>;
  totalSteps: number;
  stepFields: Record<number, string[]>; // Fields to validate per step
  open: boolean;
}

interface UseMultiStepFormReturn {
  currentStep: number;
  handleNext: () => Promise<void>;
  handleBack: () => void;
  getStepProgress: () => number;
  isLastStep: boolean;
  isFirstStep: boolean;
  reset: () => void;
}
```

**Estimated Reduction**: -50 lines

---

### **EXTRACTION #4: Tenant Edit Data Loading Hook** 🔴 HIGH PRIORITY
**File**: `src/features/tenants/hooks/useTenantEditData.ts`

**What to Extract:**
- `loading` state
- `primaryContract` state
- `loadTenantAndContractData` function
- Form population logic
- Default value setting logic

**Props:**
```typescript
interface UseTenantEditDataOptions {
  open: boolean;
  tenant: TenantWithProperty;
  form: UseFormReturn<TenantEditFormData>;
}

interface UseTenantEditDataReturn {
  loading: boolean;
  primaryContract: Contract | null;
  loadData: () => Promise<void>;
}
```

**Estimated Reduction**: -70 lines

---

### **EXTRACTION #5: Tenant Edit Submission Hook** 🔴 HIGH PRIORITY (LARGEST)
**File**: `src/features/tenants/hooks/useTenantEditSubmission.ts`

**What to Extract:**
- `submitting` state
- `handleSubmit` function (Lines 244-326)
- Tenant update logic
- Contract update/create logic
- PDF upload handling
- Success/error handling

**Props:**
```typescript
interface UseTenantEditSubmissionOptions {
  tenant: TenantWithProperty;
  primaryContract: Contract | null;
  form: UseFormReturn<TenantEditFormData>;
  pdfFile: File | null;
  validateCurrentStep: () => Promise<boolean>;
  onSuccess: () => void;
  onOpenChange: (open: boolean) => void;
}

interface UseTenantEditSubmissionReturn {
  submitting: boolean;
  handleSubmit: () => Promise<void>;
}
```

**Estimated Reduction**: -85 lines

---

### **EXTRACTION #6: PDF File Management Hook** 🟡 MEDIUM PRIORITY
**File**: `src/features/tenants/hooks/usePdfFileManagement.ts`

**What to Extract:**
- `pdfFile` state
- `setPdfFile` function
- Reset PDF file on dialog close

**Note**: This is simple enough that it could stay in main component, but extracting provides consistency.

**Estimated Reduction**: -5 lines

---

### **EXTRACTION #7: Step Indicators Component** 🟡 MEDIUM PRIORITY
**File**: `src/features/tenants/components/StepIndicators.tsx`

**What to Extract:**
- Step indicator UI (Lines 403-439)
- Step icons, titles, descriptions
- Active/completed states

**Props:**
```typescript
interface StepIndicatorsProps {
  steps: Array<{ id: number; title: string; description: string; icon: any }>;
  currentStep: number;
}
```

**Estimated Reduction**: -37 lines

---

### **EXTRACTION #8: Contract Status Info Component** 🟡 MEDIUM PRIORITY
**File**: `src/features/tenants/components/ContractStatusInfo.tsx`

**What to Extract:**
- Contract status info UI (Lines 441-459)
- Primary contract display
- No contract message

**Props:**
```typescript
interface ContractStatusInfoProps {
  primaryContract: Contract | null;
}
```

**Estimated Reduction**: -18 lines

---

### **EXTRACTION #9: Navigation Buttons Component** 🟡 MEDIUM PRIORITY
**File**: `src/features/tenants/components/MultiStepNavigationButtons.tsx`

**What to Extract:**
- Navigation buttons UI (Lines 467-515)
- Back/Next/Submit buttons
- Step indicator badges
- Loading states

**Props:**
```typescript
interface MultiStepNavigationButtonsProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  currentStep: number;
  totalSteps: number;
  steps: Array<{ title: string }>;
  submitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}
```

**Estimated Reduction**: -50 lines

---

### **EXTRACTION #10: Loading State Component** 🟢 LOW PRIORITY
**File**: `src/features/tenants/components/TenantEditLoadingState.tsx`

**What to Extract:**
- Loading dialog UI (Lines 363-379)

**Props:**
```typescript
interface TenantEditLoadingStateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Estimated Reduction**: -17 lines

---

## 🔄 Refactoring Sequence

### Phase 1: Core Hooks (Logic Extraction) - Priority Order

1. ✅ **Extraction #3**: Multi-Step Form Hook (foundation for everything)
2. ✅ **Extraction #4**: Tenant Edit Data Loading Hook
3. ✅ **Extraction #5**: Tenant Edit Submission Hook (largest)
4. ✅ **Extraction #6**: PDF File Management Hook (simple)

**After Phase 1 Expected**: ~350 lines (-168 lines)

### Phase 2: Utilities & Constants

5. ✅ **Extraction #1**: Validation Schema
6. ✅ **Extraction #2**: Steps Configuration

**After Phase 2 Expected**: ~300 lines (-50 lines)

### Phase 3: UI Components (Component Extraction)

7. ✅ **Extraction #7**: Step Indicators Component
8. ✅ **Extraction #8**: Contract Status Info Component
9. ✅ **Extraction #9**: Navigation Buttons Component
10. ✅ **Extraction #10**: Loading State Component

**After Phase 3 Expected**: ~175 lines (-125 lines)

---

## 📊 Expected Results

### Final Metrics
- **Original**: 518 lines
- **Final**: ~175 lines
- **Total Reduction**: ~343 lines (66% reduction)

### Files to Create
- **Hooks**: 4 files
  - `useMultiStepForm.ts`
  - `useTenantEditData.ts`
  - `useTenantEditSubmission.ts`
  - `usePdfFileManagement.ts`
- **Components**: 4 files
  - `StepIndicators.tsx`
  - `ContractStatusInfo.tsx`
  - `MultiStepNavigationButtons.tsx`
  - `TenantEditLoadingState.tsx`
- **Utilities**: 2 files
  - `tenantEditSchema.ts` (or validation file)
  - `tenantSteps.ts` (constants)

**Total**: 10 new modular files

---

## ✅ Benefits

1. **Maintainability**: Each piece has a single responsibility
2. **Testability**: Hooks and components can be tested independently
3. **Reusability**: Multi-step form hook can be reused for other multi-step dialogs
4. **Readability**: Main component focuses on orchestration only
5. **Type Safety**: All TypeScript types preserved throughout

---

## 🎯 Key Considerations

1. **Step Components Already Extracted**: The step components (TenantInfoStep, ContractDetailsStep, ContractSettingsStep) are already in `steps/` folder, so we don't need to extract them again.

2. **Schema Type Compatibility**: Ensure the extracted schema matches the form type used in step components.

3. **i18n Support**: Consider extracting schema with i18n support like other schemas in the codebase.

4. **Error Handling**: Maintain all error handling patterns when extracting hooks.

5. **Loading States**: Ensure all loading states are properly managed across hooks.

---

## 📝 Notes

- The step components are already well-extracted and don't need further refactoring
- The multi-step form hook could potentially be reused for EnhancedTenantDialog.tsx as well
- Consider creating a shared multi-step form hook that can be used across both tenant dialogs

