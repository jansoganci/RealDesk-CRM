# Remaining Work Roadmap: Dynamic Fixtures Management

## ✅ Completed Tasks

- **Task 1:** Create FixturesSelector Component ✅
- **Task 2:** Add Multilanguage Support ✅
- **Task 3:** Update ContractDetailsSection (moved to AddressInput) ✅
- **Task 4:** Update useContractPdfHandler ✅
- **Task 8:** Create Utility Functions ✅

---

## 📋 Remaining Tasks (Prioritized)

### 🔴 **CRITICAL PRIORITY** (Must Complete Before Production)

#### **Task 6: Update Contract Edit Flow**
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 1 hour  
**Why Critical:**
- Users need to edit existing contracts with fixtures
- Without this, editing contracts will break or show old textarea
- Core functionality for contract management lifecycle
- **Impact:** High - Blocks production deployment if incomplete

**Files to Modify:**
1. `src/features/contracts/hooks/useContractEditData.ts` (Line 207)
   - Verify `special_conditions` loads correctly from database
   - Ensure comma-separated string is properly passed to form

2. `src/features/contracts/components/ContractEditForm.tsx`
   - Verify it uses `AddressInput` component (which now has FixturesSelector)
   - If it uses a different property section, update accordingly

**What to Verify:**
- ✅ Existing contracts with fixtures load correctly
- ✅ Fixtures display as selected checkboxes + tags
- ✅ Editing fixtures works (add/remove)
- ✅ Saving updates fixtures correctly
- ✅ Empty fixtures state handled properly

---

#### **Task 9: Add Validation & Error Handling**
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 1 hour  
**Why Critical:**
- Prevents data corruption (too many items, too long names)
- Protects database from invalid data
- Provides user feedback for errors
- **Impact:** High - Data integrity and user experience

**Files to Modify:**
1. `src/features/contracts/schemas/contractForm.schema.ts` (Line 159-162)
   - Add validation for max items (20)
   - Add validation for max item length (50 chars)
   - Keep existing max total length (1000 chars)

2. `public/locales/tr/contracts.json`
   - Add `fixtures.validation.maxItemsOrLength` key

3. `public/locales/en/contracts.json`
   - Add corresponding English translation

**Validation Rules:**
- Maximum 20 fixtures
- Each fixture name max 50 characters
- Total string length max 1000 characters
- Empty string allowed (no fixtures)

**User Experience:**
- Show validation error when limit exceeded
- Prevent adding items beyond limits in component
- Display clear error messages

---

### 🟡 **HIGH PRIORITY** (Important for Complete Feature)

#### **Task 10: Testing & QA**
**Priority:** 🟡 HIGH  
**Estimated Time:** 2-3 hours  
**Why Important:**
- Ensures all functionality works end-to-end
- Catches edge cases and bugs
- Validates user experience
- **Impact:** Medium-High - Quality assurance

**Test Scenarios:**

1. **Empty State:**
   - No items selected → PDF shows '-'
   - Form validation passes
   - Component shows empty state message

2. **Common Items:**
   - Select multiple checkboxes → All appear as tags
   - Deselect checkbox → Tag removed
   - Save and reload → Items persist

3. **Custom Items:**
   - Type custom item + Enter → Tag added
   - Type duplicate → Prevented or handled gracefully
   - Type empty → Prevented
   - Remove custom tag → Removed from list

4. **Mixed Selection:**
   - Select common + add custom → Both appear
   - Save and reload → Both persist correctly

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
   - Very long custom item name (test validation)
   - Special characters in custom items
   - Many items (test 20+ items limit)
   - Copy-paste comma-separated list
   - Rapid add/remove operations

---

### 🟢 **MEDIUM PRIORITY** (Nice to Have)

#### **Task 5: Update Contract Import Flow**
**Priority:** 🟢 MEDIUM  
**Estimated Time:** 1 hour  
**Why Medium:**
- Import flow is a secondary feature
- Users can manually edit after import
- Not blocking for core functionality
- **Impact:** Low-Medium - Feature completeness

**Files to Modify:**
1. `src/features/contracts/import/components/ContractSection.tsx` (Lines 92-101)
   - Replace Textarea with FixturesSelector
   - Ensure compatibility with import review flow
   - Handle pre-filled data from PDF extraction

**What to Verify:**
- Imported contracts with fixtures display correctly
- Can edit fixtures during import review
- Imported fixtures save correctly

**Note:** This can be deferred if time is limited, as users can edit fixtures after import.

---

### ⚪ **LOW PRIORITY** (Optional)

#### **Task 7: Update Sale Contract Forms**
**Priority:** ⚪ LOW (Optional)  
**Estimated Time:** 30 minutes  
**Why Low:**
- Sale contracts may not need fixtures management
- Separate module (contractsSale)
- Can be added later if needed
- **Impact:** Low - Feature enhancement

**Files to Consider:**
- `src/features/contractsSale/SaleContractBuilder.tsx` (Line 394-400)
- `src/features/contractsSale/SaleContractEdit.tsx` (Line 422-430)

**Decision Point:**
- Do sale contracts need fixtures? (Usually not)
- If yes, apply same component
- If no, leave as-is (textarea)

**Recommendation:** Skip for now, add later if business requirement arises.

---

## 🎯 Recommended Execution Order

### **Phase 1: Critical Path (2 hours)**
1. **Task 6:** Update Contract Edit Flow (1 hour)
2. **Task 9:** Add Validation & Error Handling (1 hour)

### **Phase 2: Quality Assurance (2-3 hours)**
3. **Task 10:** Testing & QA (2-3 hours)

### **Phase 3: Feature Completeness (1 hour)**
4. **Task 5:** Update Contract Import Flow (1 hour) - *Optional if time limited*

### **Phase 4: Future Enhancement (30 min)**
5. **Task 7:** Update Sale Contract Forms (30 min) - *Skip for now*

---

## 📊 Completion Status

| Task | Priority | Status | Estimated Time |
|------|----------|--------|----------------|
| Task 6: Edit Flow | 🔴 CRITICAL | ⏳ Pending | 1 hour |
| Task 9: Validation | 🔴 CRITICAL | ⏳ Pending | 1 hour |
| Task 10: Testing | 🟡 HIGH | ⏳ Pending | 2-3 hours |
| Task 5: Import Flow | 🟢 MEDIUM | ⏳ Pending | 1 hour |
| Task 7: Sale Contracts | ⚪ LOW | ⏳ Optional | 30 min |

**Total Remaining Time:** 4-5 hours (excluding optional Task 7)

---

## ✅ Definition of Done

The feature is **production-ready** when:

- ✅ Task 6: Edit flow works correctly
- ✅ Task 9: Validation prevents invalid data
- ✅ Task 10: All test scenarios pass
- ✅ PDF generation works (already verified ✅)
- ✅ Multilanguage support works (already implemented ✅)
- ✅ Empty state shows '-' in PDF (already working ✅)

**Optional but Recommended:**
- Task 5: Import flow updated (can be done post-launch)

---

## 🚀 Next Steps

1. **Execute Task 6** - Update Contract Edit Flow
2. **Execute Task 9** - Add Validation & Error Handling
3. **Execute Task 10** - Comprehensive Testing
4. **Review & Deploy** - Production ready!

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-13  
**Status:** Ready for Execution
