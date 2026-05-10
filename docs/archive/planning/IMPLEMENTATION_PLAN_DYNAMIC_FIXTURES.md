# Dynamic Fixtures (Demirbaş) Management - Implementation Plan

## 📋 Executive Summary

This document outlines the step-by-step implementation plan for transitioning the "Demirbaş Beyanı" (Fixtures Declaration) from a simple textarea to a dynamic tag-based selection system with checkboxes for common items and custom tag input.

**Key Requirements:**
- Checkbox selection for common fixtures (Kombi, Klima, etc.)
- Tag-style input for custom items (type + Enter to add)
- Empty state handler: sends '-' to PDF if no items selected
- Multilanguage support (TR/EN)
- Maintain compatibility with existing Supabase schema (string-based `special_conditions`)

---

## 🔍 Codebase Analysis

### Files Involved in Contract Creation Flow

#### **Frontend Components**
1. **`src/features/contracts/components/form-sections/ContractDetailsSection.tsx`** (Lines 272-288)
   - Current: Textarea component for `special_conditions`
   - Action: Replace with new `FixturesSelector` component

2. **`src/features/contracts/components/ContractCreateForm.tsx`**
   - Uses `ContractDetailsSection` component
   - Action: No changes needed (uses component)

3. **`src/features/contracts/components/ContractEditForm.tsx`**
   - Uses same form structure
   - Action: Ensure compatibility with edit flow

4. **`src/features/contracts/import/components/ContractSection.tsx`** (Lines 92-101)
   - Import flow also uses `special_conditions` textarea
   - Action: Replace with new component

#### **Form Schema & Validation**
5. **`src/features/contracts/schemas/contractForm.schema.ts`** (Lines 159-162)
   - Current: `special_conditions: z.string().max(1000).optional().or(z.literal(''))`
   - Action: Keep schema as string (for DB compatibility), add internal array state

6. **`src/types/contract.types.ts`** (Line 216)
   - `ContractFormData` interface includes `special_conditions?: string`
   - Action: No type changes needed (maintains string for DB)

#### **Data Preparation & PDF Generation**
7. **`src/features/contracts/hooks/useContractPdfHandler.ts`** (Line 111)
   - Current: `fixtures: formData.special_conditions || 'Kombi, Klima'`
   - Action: Convert array to comma-separated string, handle empty state ('-')

8. **`src/services/contractPdf.service.ts`** (Lines 264-275)
   - Renders `data.fixtures` in PDF
   - Action: No changes needed (already handles string)

#### **Service Layer (Database)**
9. **`src/services/contractCreation.service.ts`** (Line 154)
   - Current: `special_conditions: formData.special_conditions || null`
   - Action: No changes needed (accepts string)

10. **`src/services/contractUpdate.service.ts`**
    - Updates contract details
    - Action: Verify compatibility

11. **`src/features/contracts/hooks/useContractEditData.ts`** (Line 207)
    - Loads existing `special_conditions` for editing
    - Action: Parse string back to array for form state

#### **Database Schema**
12. **`supabase/migrations/20251120_contract_management_v1.sql`** (Line 58)
    - `special_conditions text` (nullable)
    - Action: No migration needed (stays as TEXT)

#### **Localization Files**
13. **`public/locales/tr/contracts.json`**
    - Contains `create.fields.special_conditions` and `create.placeholders.special_conditions`
    - Action: Add new translation keys for fixtures UI

14. **`public/locales/en/contracts.json`**
    - English translations
    - Action: Add corresponding English keys

---

## 🔄 Data Flow Analysis

### Current Flow (String-Based)
```
Form Input (Textarea) 
  → ContractFormData.special_conditions (string)
  → useContractPdfHandler.preparePdfData() 
  → ContractPdfData.fixtures (string, default: 'Kombi, Klima')
  → contractPdf.service.ts renderPage1_InfoTable()
  → PDF Output
```

### Proposed Flow (Array → String Conversion)
```
Form Input (FixturesSelector Component)
  → Internal State: fixturesArray (string[])
  → ContractFormData.special_conditions (string, comma-separated)
  → useContractPdfHandler.preparePdfData()
  → ContractPdfData.fixtures (string, '-' if empty)
  → contractPdf.service.ts renderPage1_InfoTable()
  → PDF Output
```

### Key Conversion Points
1. **Component → Form**: Convert array to comma-separated string before form submission
2. **Form → PDF**: Convert string to array, then back to formatted string (or '-' if empty)
3. **Database → Form**: Parse comma-separated string back to array for editing

---

## 🎯 Implementation Plan

### **Task 1: Create FixturesSelector Component**
**Priority:** HIGH  
**Estimated Time:** 2-3 hours

**Location:** `src/features/contracts/components/FixturesSelector.tsx` (NEW FILE)

**Requirements:**
- Accepts `value: string` (comma-separated) and `onChange: (value: string) => void`
- Internal state: `selectedItems: string[]` (parsed from value prop)
- Common items checkboxes (Kombi, Klima, Buzdolabı, Çamaşır Makinesi, Ankastre Set, etc.)
- Tag input field for custom items
- Tag display with remove buttons
- Empty state handling (shows placeholder)
- Multilanguage support via `useTranslation('contracts')`

**Component Structure:**
```typescript
interface FixturesSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}
```

**Common Items List (to be defined in translations):**
- Kombi (Boiler)
- Klima (Air Conditioner)
- Buzdolabı (Refrigerator)
- Çamaşır Makinesi (Washing Machine)
- Ankastre Set (Built-in Kitchen Set)
- Bulaşık Makinesi (Dishwasher)
- Fırın (Oven)
- Mikrodalga (Microwave)
- Televizyon (TV)
- Mobilya (Furniture)

**Dependencies:**
- `@/components/ui/checkbox` (existing)
- `@/components/ui/badge` (existing)
- `@/components/ui/input` (existing)
- `@/components/ui/label` (existing)
- `react-i18next` (existing)

---

### **Task 2: Add Multilanguage Support**
**Priority:** HIGH  
**Estimated Time:** 1 hour

**Files to Modify:**
1. `public/locales/tr/contracts.json`
2. `public/locales/en/contracts.json`

**New Translation Keys:**
```json
{
  "create": {
    "fields": {
      "fixtures": "Demirbaş Beyanı",
      "fixturesCommonItems": "Yaygın Demirbaşlar",
      "fixturesCustomItems": "Özel Demirbaşlar"
    },
    "placeholders": {
      "fixtures": "Demirbaş seçin veya özel ekleyin",
      "fixturesCustomInput": "Özel demirbaş eklemek için yazın ve Enter'a basın",
      "fixturesEmpty": "Demirbaş seçilmedi"
    },
    "labels": {
      "fixturesAddCustom": "Özel Ekle",
      "fixturesRemove": "Kaldır"
    },
    "commonFixtures": {
      "kombi": "Kombi",
      "klima": "Klima",
      "buzdolabi": "Buzdolabı",
      "camasirMakinesi": "Çamaşır Makinesi",
      "ankastreSet": "Ankastre Set",
      "bulasikMakinesi": "Bulaşık Makinesi",
      "firin": "Fırın",
      "mikrodalga": "Mikrodalga",
      "televizyon": "Televizyon",
      "mobilya": "Mobilya"
    }
  }
}
```

**English Equivalents:**
- "Fixtures Declaration"
- "Common Fixtures"
- "Custom Fixtures"
- etc.

---

### **Task 3: Update ContractDetailsSection Component**
**Priority:** HIGH  
**Estimated Time:** 1 hour

**File:** `src/features/contracts/components/form-sections/ContractDetailsSection.tsx`

**Changes:**
1. Import new `FixturesSelector` component
2. Replace Textarea (lines 272-288) with `FixturesSelector`
3. Connect to React Hook Form:
   ```typescript
   <FixturesSelector
     value={form.watch('special_conditions') || ''}
     onChange={(value) => form.setValue('special_conditions', value)}
     error={form.formState.errors.special_conditions?.message}
   />
   ```

**Testing:**
- Verify form validation still works
- Test empty state
- Test multiple selections
- Test custom item addition

---

### **Task 4: Update useContractPdfHandler Hook**
**Priority:** HIGH  
**Estimated Time:** 1 hour

**File:** `src/features/contracts/hooks/useContractPdfHandler.ts`

**Changes in `preparePdfData()` function (Line 111):**

**Current:**
```typescript
fixtures: formData.special_conditions || 'Kombi, Klima',
```

**New:**
```typescript
fixtures: formData.special_conditions 
  ? formData.special_conditions.split(',').map(s => s.trim()).join(', ')
  : '-',
```

**Logic:**
1. If `special_conditions` exists and is not empty:
   - Split by comma
   - Trim whitespace
   - Join with ', ' (comma + space) for PDF readability
2. If empty/null/undefined:
   - Use '-' as per requirement

**Testing:**
- Empty string → '-'
- Single item → "Kombi"
- Multiple items → "Kombi, Klima, Buzdolabı"
- Custom items → "Kombi, Özel Eşya"

---

### **Task 5: Update Contract Import Flow**
**Priority:** MEDIUM  
**Estimated Time:** 1 hour

**File:** `src/features/contracts/import/components/ContractSection.tsx`

**Changes:**
1. Replace Textarea (lines 92-101) with `FixturesSelector`
2. Ensure compatibility with import review flow
3. Test with imported contract data

**Note:** Import flow may have pre-filled data, so ensure component handles initial values correctly.

---

### **Task 6: Update Contract Edit Flow**
**Priority:** MEDIUM  
**Estimated Time:** 1 hour

**File:** `src/features/contracts/hooks/useContractEditData.ts`

**Changes:**
- Line 207: Ensure `special_conditions` is properly loaded
- The component will automatically parse comma-separated string to array
- No additional changes needed if component handles parsing correctly

**File:** `src/features/contracts/components/ContractEditForm.tsx`
- Verify it uses `ContractDetailsSection` (should work automatically)

**Testing:**
- Load existing contract with fixtures
- Verify fixtures display correctly
- Test editing and saving

---

### **Task 7: Update Sale Contract Forms (Optional)**
**Priority:** LOW  
**Estimated Time:** 30 minutes

**Files:**
- `src/features/contractsSale/SaleContractBuilder.tsx` (Line 394-400)
- `src/features/contractsSale/SaleContractEdit.tsx` (Line 422-430)

**Decision Point:**
- If sale contracts also need fixtures management, apply same component
- If not, leave as-is (textarea)

---

### **Task 8: Create Utility Functions**
**Priority:** MEDIUM  
**Estimated Time:** 30 minutes

**Location:** `src/features/contracts/utils/fixturesUtils.ts` (NEW FILE)

**Functions:**
```typescript
/**
 * Parse comma-separated string to array
 */
export function parseFixturesString(value: string): string[]

/**
 * Convert array to comma-separated string
 */
export function formatFixturesArray(items: string[]): string

/**
 * Format fixtures for PDF display
 */
export function formatFixturesForPdf(value: string | null | undefined): string
```

**Usage:**
- Component uses `parseFixturesString()` to convert prop to internal state
- Component uses `formatFixturesArray()` to convert state to form value
- PDF handler uses `formatFixturesForPdf()` for final formatting

---

### **Task 9: Add Validation & Error Handling**
**Priority:** MEDIUM  
**Estimated Time:** 1 hour

**File:** `src/features/contracts/schemas/contractForm.schema.ts`

**Current Validation (Line 159-162):**
```typescript
special_conditions: z.string()
  .max(1000, t('maxChars', { max: 1000 }))
  .optional()
  .or(z.literal('')),
```

**Considerations:**
- Keep max length validation (1000 chars)
- Add validation for max number of items (e.g., 20 items max)
- Validate individual item length (e.g., 50 chars per item)

**New Validation:**
```typescript
special_conditions: z.string()
  .max(1000, t('maxChars', { max: 1000 }))
  .refine((val) => {
    if (!val) return true;
    const items = val.split(',').map(s => s.trim());
    return items.length <= 20 && items.every(item => item.length <= 50);
  }, {
    message: t('fixtures.validation.maxItemsOrLength')
  })
  .optional()
  .or(z.literal('')),
```

**Add Translation Keys:**
- `fixtures.validation.maxItemsOrLength`: "Maksimum 20 demirbaş ve her biri 50 karakterden kısa olmalıdır"

---

### **Task 10: Testing & QA**
**Priority:** HIGH  
**Estimated Time:** 2-3 hours

**Test Scenarios:**

1. **Empty State:**
   - No items selected → PDF shows '-'
   - Form validation passes

2. **Common Items:**
   - Select multiple checkboxes → All appear as tags
   - Deselect checkbox → Tag removed
   - Save and reload → Items persist

3. **Custom Items:**
   - Type custom item + Enter → Tag added
   - Type duplicate → Prevented or handled
   - Type empty → Prevented
   - Remove custom tag → Removed from list

4. **Mixed Selection:**
   - Select common + add custom → Both appear
   - Save and reload → Both persist

5. **Form Integration:**
   - Form submission includes fixtures
   - PDF generation uses correct format
   - Database stores comma-separated string

6. **Edit Flow:**
   - Load existing contract → Fixtures parsed correctly
   - Edit fixtures → Changes save correctly
   - Delete all fixtures → Empty state handled

7. **Multilanguage:**
   - Switch language → Labels update
   - Common items translated
   - Error messages translated

8. **Edge Cases:**
   - Very long custom item name
   - Special characters in custom items
   - Many items (test 20+ items)
   - Copy-paste comma-separated list

---

## 🏗️ Architecture Decisions

### **State Management Strategy**

**Option A: Component-Level State (RECOMMENDED)**
- Component maintains internal `selectedItems: string[]` state
- Converts to/from string for form integration
- Pros: Encapsulated, reusable, clean separation
- Cons: Requires parsing logic

**Option B: Form-Level Array State**
- Add `fixturesArray: string[]` to form schema
- Convert to string only for DB submission
- Pros: Type-safe, no parsing needed
- Cons: Requires schema changes, more complex

**Decision: Option A** - Maintains backward compatibility with existing string-based schema.

---

### **Data Formatting Strategy**

**Storage Format (Database):**
- Comma-separated string: `"Kombi, Klima, Buzdolabı"`
- Empty: `null` or `''`

**PDF Format:**
- Formatted string: `"Kombi, Klima, Buzdolabı"` (comma + space)
- Empty: `"-"` (dash)

**Component Format:**
- Internal array: `["Kombi", "Klima", "Buzdolabı"]`
- Prop value: `"Kombi,Klima,Buzdolabı"` (comma, no space for storage efficiency)

---

### **Component Reusability**

**Create:**
- `src/features/contracts/components/FixturesSelector.tsx`
- Can be reused in:
  - Contract creation form
  - Contract edit form
  - Contract import flow
  - Sale contract forms (if needed)

---

## 📝 Implementation Checklist

### Phase 1: Core Component (Tasks 1, 2, 8)
- [ ] Create `FixturesSelector` component
- [ ] Add multilanguage translations
- [ ] Create utility functions
- [ ] Unit test component

### Phase 2: Integration (Tasks 3, 4)
- [ ] Update `ContractDetailsSection`
- [ ] Update `useContractPdfHandler`
- [ ] Test form submission
- [ ] Test PDF generation

### Phase 3: Additional Flows (Tasks 5, 6)
- [ ] Update import flow
- [ ] Update edit flow
- [ ] Test edit with existing data

### Phase 4: Polish (Tasks 7, 9, 10)
- [ ] Update sale contracts (if needed)
- [ ] Add validation
- [ ] Comprehensive testing
- [ ] Documentation

---

## 🔧 Technical Considerations

### **Performance**
- Component should handle 20+ items efficiently
- Tag rendering should be optimized (virtual scrolling if needed)
- No unnecessary re-renders

### **Accessibility**
- Keyboard navigation for checkboxes
- Screen reader support
- Focus management for tag input
- ARIA labels for all interactive elements

### **Browser Compatibility**
- Test in Chrome, Firefox, Safari, Edge
- Ensure tag input works on mobile devices
- Handle Enter key consistently across browsers

### **Error Handling**
- Invalid input handling
- Duplicate prevention
- Max length validation
- Network error handling (if component fetches common items from API in future)

---

## 🚀 Future Enhancements (Out of Scope)

1. **API-Driven Common Items:**
   - Fetch common fixtures from database
   - User/organization-specific common items
   - Analytics on most-used fixtures

2. **Fixtures Categories:**
   - Group by type (Kitchen, Living Room, etc.)
   - Visual icons for each category

3. **Fixtures Templates:**
   - Save common combinations
   - Quick apply templates

4. **Fixtures Photos:**
   - Attach photos to fixtures
   - Photo gallery in PDF

---

## 📚 References

- Existing component patterns: `src/components/ui/checkbox.tsx`, `src/components/ui/badge.tsx`
- Form integration: `src/features/contracts/components/form-sections/ContractDetailsSection.tsx`
- PDF generation: `src/services/contractPdf.service.ts`
- Multilanguage: `public/locales/tr/contracts.json`, `public/locales/en/contracts.json`

---

## ✅ Success Criteria

1. ✅ User can select common fixtures via checkboxes
2. ✅ User can add custom fixtures via tag input
3. ✅ Empty state shows '-' in PDF
4. ✅ Multilanguage support works (TR/EN)
5. ✅ Form validation works correctly
6. ✅ Edit flow loads and saves fixtures correctly
7. ✅ PDF displays fixtures in readable format
8. ✅ Database stores data as comma-separated string
9. ✅ No breaking changes to existing contracts
10. ✅ Component is reusable across forms

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-13  
**Author:** Implementation Planning Team
