# PropertyDialog.tsx Refactoring Plan

## 📋 Overview

**Current State:**
- **File**: `src/features/properties/PropertyDialog.tsx`
- **Lines**: 533
- **Imports**: 21
- **Complexity**: 🔴 HIGH

**Target State:**
- **Estimated Final Lines**: ~150-180 (70% reduction)
- **Goal**: Modular, testable, maintainable dialog component

---

## 🔍 Identified Responsibilities

### 1. **Dialog Wrapper** (Currently embedded)
   - Dialog structure and layout
   - Header with title/description
   - Footer with action buttons
   - Open/close state management

### 2. **Photo Management Section** (Lines 249-270, 523-530)
   - Photo gallery display
   - Photo management button
   - Photo management dialog integration
   - Photo loading state

### 3. **Owner Selection Logic** (Lines 68-69, 172-182, 285-306)
   - Owner data fetching
   - Owner loading state
   - Owner dropdown selection
   - Owner validation

### 4. **Form State Management** (Lines 74-87, 93-156, 158-170)
   - Form initialization
   - Form reset logic
   - Property type state management
   - Conditional form defaults

### 5. **Property Type Logic** (Lines 55-56, 159-170, 273-283)
   - Property type state (rental/sale)
   - Schema switching based on type
   - Conditional field rendering
   - Default values per type

### 6. **Form Fields** (Lines 272-520)
   - Property type selector (for new properties)
   - Owner selection
   - Address fields (address, city, district)
   - Status selection (conditional based on type)
   - Price fields (rent_amount vs sale_price)
   - Currency selection
   - Listing URL
   - Notes
   - Mark as Sold button (conditional)

### 7. **Form Submission Logic** (Lines 197-235)
   - Data cleaning
   - Type-specific field handling
   - Field removal (rental vs sale fields)

---

## 🎯 Extraction Strategy

### Phase 1: Core Hooks (Logic Extraction)
Extract reusable hooks to separate business logic from UI.

### Phase 2: UI Components (Component Extraction)
Extract form sections into reusable components.

### Phase 3: Cleanup & Optimization
Remove duplicate code, optimize imports, improve type safety.

---

## 📝 Detailed Extraction Plan

### **EXTRACTION #1: Owner Selection Hook** 🔵 HIGH IMPACT
**File**: `src/features/properties/hooks/usePropertyOwnerSelection.ts`

**What to Extract:**
- `owners` state
- `loadingOwners` state
- `loadOwners` function
- Owner fetching logic

**Estimated Reduction**: -15 lines

**Interface:**
```typescript
interface UsePropertyOwnerSelectionReturn {
  owners: PropertyOwner[];
  loadingOwners: boolean;
  loadOwners: () => Promise<void>;
}
```

---

### **EXTRACTION #2: Photo Management Hook** 🔵 HIGH IMPACT
**File**: `src/features/properties/hooks/usePropertyPhotoManagement.ts`

**What to Extract:**
- `photos` state
- `loadingPhotos` state
- `photoManagementOpen` state
- `loadPhotos` function
- Photo fetching logic

**Estimated Reduction**: -20 lines

**Interface:**
```typescript
interface UsePropertyPhotoManagementReturn {
  photos: PropertyPhoto[];
  loadingPhotos: boolean;
  photoManagementOpen: boolean;
  setPhotoManagementOpen: (open: boolean) => void;
  loadPhotos: () => Promise<void>;
}
```

---

### **EXTRACTION #3: Property Type Hook** 🔵 HIGH IMPACT
**File**: `src/features/properties/hooks/usePropertyType.ts`

**What to Extract:**
- `propertyType` state
- `setPropertyType` function
- Property type initialization from existing property
- Schema selection logic

**Estimated Reduction**: -25 lines

**Interface:**
```typescript
interface UsePropertyTypeOptions {
  property: Property | null;
  defaultType?: 'rental' | 'sale';
}

interface UsePropertyTypeReturn {
  propertyType: 'rental' | 'sale';
  setPropertyType: (type: 'rental' | 'sale') => void;
  propertySchema: z.ZodSchema;
  PropertyFormData: z.infer<typeof propertySchema>;
}
```

---

### **EXTRACTION #4: Form Initialization Hook** 🔵 HIGH IMPACT
**File**: `src/features/properties/hooks/usePropertyFormInitialization.ts`

**What to Extract:**
- Form reset logic
- Conditional default values (rental vs sale)
- Form initialization on dialog open
- Form reset on property type change

**Estimated Reduction**: -40 lines

**Interface:**
```typescript
interface UsePropertyFormInitializationOptions {
  open: boolean;
  property: Property | null;
  propertyType: 'rental' | 'sale';
  reset: UseFormReset<PropertyFormData>;
  setValue: UseFormSetValue<PropertyFormData>;
}

interface UsePropertyFormInitializationReturn {
  // No return needed, hook handles side effects
}
```

---

### **EXTRACTION #5: Form Submission Hook** 🔵 HIGH IMPACT
**File**: `src/features/properties/hooks/usePropertyFormSubmission.ts`

**What to Extract:**
- `handleFormSubmit` function
- Data cleaning logic
- Type-specific field handling
- Field removal (rental vs sale fields)

**Estimated Reduction**: -35 lines

**Interface:**
```typescript
interface UsePropertyFormSubmissionOptions {
  onSubmit: (data: any) => Promise<void>;
  propertyType: 'rental' | 'sale';
}

interface UsePropertyFormSubmissionReturn {
  handleFormSubmit: (data: PropertyFormData) => Promise<void>;
}
```

---

### **EXTRACTION #6: Owner Selection Component** 🟢 MEDIUM IMPACT
**File**: `src/features/properties/components/OwnerSelectField.tsx`

**What to Extract:**
- Owner dropdown UI
- Owner selection logic
- Error display

**Estimated Reduction**: -25 lines

**Props:**
```typescript
interface OwnerSelectFieldProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  owners: PropertyOwner[];
  loading: boolean;
  disabled?: boolean;
  error?: string;
}
```

---

### **EXTRACTION #7: Photo Gallery Section Component** 🟢 MEDIUM IMPACT
**File**: `src/features/properties/components/PropertyPhotoSection.tsx`

**What to Extract:**
- Photo gallery display section
- Photo management button
- Photo management dialog wrapper

**Estimated Reduction**: -30 lines

**Props:**
```typescript
interface PropertyPhotoSectionProps {
  property: Property;
  photos: PropertyPhoto[];
  loading: boolean;
  onManagePhotosClick: () => void;
  onPhotosChange: () => void;
  photoManagementOpen: boolean;
  onPhotoManagementOpenChange: (open: boolean) => void;
}
```

---

### **EXTRACTION #8: Property Form Fields Component** 🟡 LOWER PRIORITY
**File**: `src/features/properties/components/PropertyFormFields.tsx`

**What to Extract:**
- All form field inputs (address, city, district, status, price, currency, etc.)
- Conditional rendering based on property type
- Mark as Sold button

**Estimated Reduction**: -200 lines

**Props:**
```typescript
interface PropertyFormFieldsProps {
  propertyType: 'rental' | 'sale';
  property: Property | null;
  register: UseFormRegister<PropertyFormData>;
  setValue: UseFormSetValue<PropertyFormData>;
  watch: UseFormWatch<PropertyFormData>;
  errors: FieldErrors<PropertyFormData>;
  loading?: boolean;
  onMarkAsSold?: (property: PropertyWithOwner) => void;
}
```

**Note**: This is a large extraction. Consider breaking into sub-components:
- `AddressFields.tsx`
- `StatusField.tsx`
- `PriceFields.tsx` (rental vs sale)
- `AdditionalFields.tsx` (listing_url, notes)

---

### **EXTRACTION #9: Property Type Selector Component** 🟢 ALREADY EXISTS
**File**: `src/features/properties/PropertyTypeSelector.tsx`

**Status**: ✅ Already extracted

---

## 🔄 Refactoring Sequence

### Phase 1: Core Hooks (Logic Extraction)
1. ✅ **Extraction #1**: Owner Selection Hook
2. ✅ **Extraction #2**: Photo Management Hook
3. ✅ **Extraction #3**: Property Type Hook
4. ✅ **Extraction #4**: Form Initialization Hook
5. ✅ **Extraction #5**: Form Submission Hook

**After Phase 1 Expected**: ~400 lines (-130 lines)

### Phase 2: UI Components (Component Extraction)
6. ✅ **Extraction #6**: Owner Selection Component
7. ✅ **Extraction #7**: Photo Gallery Section Component
8. ✅ **Extraction #8**: Property Form Fields Component (or sub-components)

**After Phase 2 Expected**: ~200 lines (-200 lines)

### Phase 3: Cleanup
- Remove unused imports
- Optimize type definitions
- Add JSDoc comments
- Final code review

**Final Expected**: ~150-180 lines

---

## 📊 Expected Results

### Metrics
- **Current**: 533 lines
- **Target**: 150-180 lines
- **Reduction**: ~353-383 lines (66-72%)
- **Files Created**: 8 new files (5 hooks + 3 components)

### Benefits
1. **Modularity**: Each hook and component has a single responsibility
2. **Reusability**: Hooks can be reused in other property-related components
3. **Testability**: Smaller units are easier to test in isolation
4. **Maintainability**: Changes to one section don't affect others
5. **Readability**: Main component focuses on orchestration

---

## ⚠️ Risks & Considerations

### 1. **Form Type Safety**
- Property form data types vary between rental and sale
- Need careful type handling in hooks and components
- Consider using discriminated unions

### 2. **Photo Management Integration**
- PhotoManagement dialog is already extracted
- Need to ensure state synchronization
- Consider lifting state up or using a shared hook

### 3. **Conditional Rendering**
- Many fields are conditional based on property type
- Need to ensure all conditionals are preserved
- Consider using a form field registry pattern

### 4. **Form Reset Logic**
- Complex reset logic based on property type
- Need to ensure all edge cases are handled
- Test thoroughly with both rental and sale properties

---

## ✅ Success Criteria

1. ✅ All 5 hooks extracted and tested
2. ✅ All 3 components extracted and tested
3. ✅ Dialog functionality unchanged
4. ✅ Form validation still works
5. ✅ Photo management still works
6. ✅ No TypeScript errors
7. ✅ No runtime errors
8. ✅ Code is more maintainable

---

## 📅 Execution Plan

**Recommended Approach:**
- Start with Phase 1 (hooks) for maximum impact
- Extract hooks one at a time, testing after each
- Move to Phase 2 (components) after hooks are stable
- Phase 3 (cleanup) can be done incrementally

**Estimated Time:**
- Phase 1: 2-3 hours
- Phase 2: 2-3 hours
- Phase 3: 30 minutes
- **Total**: ~5-7 hours

---

## 🚀 Ready to Start?

Begin with **Extraction #1: Owner Selection Hook** as it's:
- Self-contained
- Low risk
- Provides immediate value
- Sets pattern for other hooks

