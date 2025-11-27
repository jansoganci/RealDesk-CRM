# ReviewStep.tsx Refactoring Plan

**Component**: `src/features/contracts/import/components/ReviewStep.tsx`  
**Current State**: 571 lines, 3 useState hooks, 10 imports  
**Target**: ~250 lines (-56% reduction)

---

## Current Structure Analysis

### Main Responsibilities Identified

1. **Form State Management** (~30 lines)
   - Large formData object with 20+ fields
   - Field update logic
   - Error clearing on field update

2. **Form Validation** (~25 lines)
   - Required field validation
   - TC Kimlik No format validation (11 digits)
   - Error message management

3. **PDF Preview Section** (~60 lines)
   - Uploaded file display
   - Extracted text display (collapsible accordion)
   - File info display

4. **Form Sections** (~380 lines)
   - Owner Section (~75 lines)
   - Tenant Section (~65 lines)
   - Property Section (~90 lines)
   - Contract Section (~75 lines)
   - Action Buttons (~30 lines)

5. **Alert Banners** (~20 lines)
   - Success banner (extraction success)
   - Warning banner (few fields extracted)

6. **Utility Functions** (~10 lines)
   - Date format conversion

---

## Refactoring Strategy

### Phase 1: Extract UI Components (Largest Impact)
### Phase 2: Extract Business Logic Hooks
### Phase 3: Extract Utilities

---

## Detailed Extraction Plan

### **EXTRACTION #1: PDF Preview Component** ⚡ START HERE
**File**: `src/features/contracts/import/components/PDFPreviewSection.tsx`

**Extract**:
- Uploaded file card display
- Extracted text accordion
- File info display

**Interface**:
```typescript
interface PDFPreviewSectionProps {
  uploadedFile: File | null;
  extractedText: string;
}
```

**Why First**: Clear separation, no dependencies, immediate ~60 line reduction.

**Estimated Reduction**: -60 lines

---

### **EXTRACTION #2: Form State & Field Update Hook**
**File**: `src/features/contracts/import/hooks/useReviewFormState.ts`

**Extract**:
- `formData` state initialization
- `updateField` function
- Initial form data from parsedData

**Interface**:
```typescript
export function useReviewFormState(parsedData: any) {
  return {
    formData,
    updateField,
    resetForm,
  };
}
```

**Estimated Reduction**: -35 lines

---

### **EXTRACTION #3: Form Validation Hook**
**File**: `src/features/contracts/import/hooks/useReviewFormValidation.ts`

**Extract**:
- `validateForm` function
- Validation rules
- Error state management
- Error clearing logic

**Interface**:
```typescript
export function useReviewFormValidation(formData: ReviewFormData) {
  return {
    validateForm,
    fieldErrors,
    clearFieldError,
    isValid,
  };
}
```

**Estimated Reduction**: -30 lines

---

### **EXTRACTION #4: Owner Section Component**
**File**: `src/features/contracts/import/components/ReviewFormSections/OwnerSection.tsx`

**Extract**:
- Owner form fields
- Owner validation error display
- Owner field rendering

**Interface**:
```typescript
interface OwnerSectionProps {
  formData: ReviewFormData;
  fieldErrors: Record<string, string>;
  onFieldChange: (field: string, value: any) => void;
}
```

**Estimated Reduction**: -75 lines

---

### **EXTRACTION #5: Tenant Section Component**
**File**: `src/features/contracts/import/components/ReviewFormSections/TenantSection.tsx`

**Extract**:
- Tenant form fields
- Tenant validation error display
- Tenant field rendering

**Interface**:
```typescript
interface TenantSectionProps {
  formData: ReviewFormData;
  fieldErrors: Record<string, string>;
  onFieldChange: (field: string, value: any) => void;
}
```

**Estimated Reduction**: -65 lines

---

### **EXTRACTION #6: Property Section Component**
**File**: `src/features/contracts/import/components/ReviewFormSections/PropertySection.tsx`

**Extract**:
- Property form fields
- Property address alert
- Property validation error display

**Interface**:
```typescript
interface PropertySectionProps {
  formData: ReviewFormData;
  fieldErrors: Record<string, string>;
  parsedData: any;
  onFieldChange: (field: string, value: any) => void;
}
```

**Estimated Reduction**: -90 lines

---

### **EXTRACTION #7: Contract Section Component**
**File**: `src/features/contracts/import/components/ReviewFormSections/ContractSection.tsx`

**Extract**:
- Contract form fields
- Contract validation error display
- Date and financial fields

**Interface**:
```typescript
interface ContractSectionProps {
  formData: ReviewFormData;
  fieldErrors: Record<string, string>;
  onFieldChange: (field: string, value: any) => void;
}
```

**Estimated Reduction**: -75 lines

---

### **EXTRACTION #8: Alert Banners Component**
**File**: `src/features/contracts/import/components/ReviewAlerts.tsx`

**Extract**:
- Success banner (extraction success)
- Warning banner (few fields extracted)
- Extraction stats display

**Interface**:
```typescript
interface ReviewAlertsProps {
  extractedCount: number;
  totalFields: number;
}
```

**Estimated Reduction**: -20 lines

---

### **EXTRACTION #9: Utility Functions**
**File**: `src/features/contracts/import/utils/dateUtils.ts`

**Extract**:
- `convertDateFormat` function
- Date formatting utilities

**Estimated Reduction**: -10 lines

---

### **EXTRACTION #10: Form Submission Logic Hook** (Optional)
**File**: `src/features/contracts/import/hooks/useReviewFormSubmission.ts`

**Extract**:
- Form submission handler
- Validation before submit
- Submit state management

**Interface**:
```typescript
export function useReviewFormSubmission(
  formData: ReviewFormData,
  validateForm: () => boolean,
  onSubmit: (data: any) => void
) {
  return {
    handleSubmit,
    canSubmit,
  };
}
```

**Estimated Reduction**: -15 lines

---

## Expected Final Results

- **Target**: 571 → ~250 lines (-56%)
- **useState hooks**: 3 → 1-2 (-33-67%)
- **New files created**: 10-11 (2-3 hooks + 6 components + 1 util)
- **Maintainability**: ✅ Significantly improved
- **Testability**: ✅ Each component/hook can be tested independently

---

## Refactoring Sequence

### Step 1: Extract UI Components (Largest Impact First)
1. PDF Preview Section (Extraction #1)
2. Form Sections (Extractions #4-7)
3. Alert Banners (Extraction #8)

### Step 2: Extract Business Logic
4. Form State Hook (Extraction #2)
5. Validation Hook (Extraction #3)
6. Submission Hook (Extraction #10)

### Step 3: Extract Utilities
7. Date Utils (Extraction #9)

---

## Type Definitions Needed

```typescript
interface ReviewFormData {
  // Owner
  owner_name: string;
  owner_tc: string;
  owner_phone: string;
  owner_email: string;
  owner_iban: string;

  // Tenant
  tenant_name: string;
  tenant_tc: string;
  tenant_phone: string;
  tenant_email: string;
  tenant_address: string;

  // Property
  mahalle: string;
  cadde_sokak: string;
  bina_no: string;
  daire_no: string;
  ilce: string;
  il: string;
  property_type: string;
  use_purpose: string;

  // Contract
  start_date: string;
  end_date: string;
  rent_amount: number | string;
  deposit: number | string;
  payment_day_of_month: number;
  payment_method: string;
  special_conditions: string;
}
```

---

## Success Criteria

✅ Each form section is independently testable  
✅ PDF preview can be reused in other contexts  
✅ Validation logic is pure and testable  
✅ Form state management is centralized  
✅ ReviewStep.tsx is < 250 lines  
✅ Zero functionality loss  
✅ Type safety maintained  

---

## Notes

- **Special Consideration**: The component uses side-by-side layout (PDF preview on left, form on right)
- **Responsive Design**: Ensure mobile layout is preserved after extraction
- **Error Display**: Field-level error display must be preserved
- **Inline Editing**: Field update logic must remain seamless
- **Parsed Data Integration**: Initial form population from parsedData must work correctly

