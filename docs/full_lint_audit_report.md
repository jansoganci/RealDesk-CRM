# Full Lint & Syntax Audit Report

**Date:** 2025-01-XX  
**Scope:** Complete `src/` directory analysis  
**Total Files Analyzed:** 127 TypeScript files

---

## Summary (Error Counts)

| Severity | Count | Files Affected |
|----------|-------|----------------|
| ❌ **Critical** | 7 | 3 files |
| ⚠️ **Warning** | 2 | 1 file |
| ℹ️ **Minor** | 0 | 0 files |

---

## ❌ Critical Errors

### 1. Import Errors - Missing Type Exports

**Issue:** Files importing `Meeting`, `MeetingInsert`, `MeetingUpdate` from `@/types/database` but these types are not exported from that file.

**Root Cause:** `database.ts` only exports the `Database` type. Individual table types (`Meeting`, `Property`, `Tenant`, etc.) are exported from `@/types/index.ts`, not `@/types/database`.

**Files Affected:**

#### `src/services/meetings.service.ts`
- **Line 10:** `Module '"@/types/database"' has no exported member 'Meeting'`
- **Line 11:** `Module '"@/types/database"' has no exported member 'MeetingInsert'`
- **Line 12:** `Module '"@/types/database"' has no exported member 'MeetingUpdate'`

**Current Import:**
```typescript
import type {
  Database,
  Meeting,
  MeetingInsert,
  MeetingUpdate,
} from '@/types/database';
```

**Fix Required:** Change to:
```typescript
import type { Database } from '@/types/database';
import type { Meeting, MeetingInsert, MeetingUpdate } from '@/types';
```

**Likely Cause:** Outdated import pattern - should import from `@/types` index file.

---

#### `src/services/mockServices/mockMeetings.service.ts`
- **Line 2:** `Module '"@/types/database"' has no exported member 'Meeting'`
- **Line 2:** `Module '"@/types/database"' has no exported member 'MeetingInsert'`
- **Line 2:** `Module '"@/types/database"' has no exported member 'MeetingUpdate'`

**Current Import:**
```typescript
import type { Meeting, MeetingInsert, MeetingUpdate } from '@/types/database';
```

**Fix Required:** Change to:
```typescript
import type { Meeting, MeetingInsert, MeetingUpdate } from '@/types';
```

**Likely Cause:** Same as above - incorrect import path.

---

#### `src/components/calendar/AddMeetingDialog.tsx`
- **Line 33:** `Module '"@/types/database"' has no exported member 'Owner'`
- **Line 33:** `Module '"@/types/database"' has no exported member 'Property'`
- **Line 33:** `Module '"@/types/database"' has no exported member 'Tenant'`

**Current Import:**
```typescript
import { Owner, Property, Tenant } from '@/types/database';
```

**Issues:**
1. `Owner` type doesn't exist - should be `PropertyOwner`
2. All three types should be imported from `@/types` not `@/types/database`

**Fix Required:** Change to:
```typescript
import { PropertyOwner, Property, Tenant } from '@/types';
```

**Note:** Update all usages of `Owner` to `PropertyOwner` in this file.

**Likely Cause:** Outdated import pattern + incorrect type name.

---

#### `src/components/calendar/EditMeetingDialog.tsx`
- **Line 33:** `Module '"@/types/database"' has no exported member 'Owner'`
- **Line 33:** `Module '"@/types/database"' has no exported member 'Property'`
- **Line 33:** `Module '"@/types/database"' has no exported member 'Tenant'`
- **Line 33:** `Module '"@/types/database"' has no exported member 'MeetingUpdate'`

**Current Import:**
```typescript
import { Owner, Property, Tenant, MeetingUpdate } from '@/types/database';
```

**Fix Required:** Change to:
```typescript
import { PropertyOwner, Property, Tenant, MeetingUpdate } from '@/types';
```

**Note:** Update all usages of `Owner` to `PropertyOwner` in this file.

**Likely Cause:** Same as above - incorrect import path + wrong type name.

---

### 2. Type Error - Count Query Return Type

#### `src/services/inquiries.service.ts`
- **Line 264:** `Type '{ id: string; }[]' is not assignable to type 'number'`

**Current Code:**
```typescript
async getUnreadMatchesCount(): Promise<number> {
  const { data, error } = await supabase
    .from('inquiry_matches')
    .select('id', { count: 'exact', head: true })
    .eq('notification_sent', false);

  if (error) throw error;

  return data || 0;  // ❌ ERROR: data is array, not count
}
```

**Problem:** 
- When using `{ count: 'exact', head: true }`, Supabase returns `{ count, error }` not `{ data, error }`
- `data` will be `null` when using `head: true`
- The count should be accessed from the `count` property

**Reference Pattern** (from `photos.service.ts` line 106-112):
```typescript
async getPhotoCount(propertyId: string): Promise<number> {
  const { count, error } = await supabase  // ✅ Correct pattern
    .from('property_photos')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', propertyId);

  if (error) throw error;
  return count || 0;  // ✅ Returns count, not data
}
```

**Fix Required:**
```typescript
async getUnreadMatchesCount(): Promise<number> {
  const { count, error } = await supabase  // Change data to count
    .from('inquiry_matches')
    .select('*', { count: 'exact', head: true })  // Remove 'id' from select
    .eq('notification_sent', false);

  if (error) throw error;
  return count || 0;  // Return count instead of data
}
```

**Likely Cause:** Real code mistake - incorrect Supabase query pattern.

---

## ⚠️ Warnings

### Unused Imports

#### `src/services/inquiries.service.ts`
- **Line 6:** `'InquiryMatch' is declared but never used`
- **Line 8:** `'InquiryMatchUpdate' is declared but never used`

**Current Import:**
```typescript
import type {
  PropertyInquiry,
  PropertyInquiryInsert,
  PropertyInquiryUpdate,
  InquiryMatch,        // ⚠️ Unused
  InquiryMatchInsert,
  InquiryMatchUpdate,  // ⚠️ Unused
  InquiryWithMatches,
  InquiryMatchWithProperty,
  Property,
} from '../types';
```

**Analysis:**
- `InquiryMatch` is imported but not directly used in the file
- `InquiryMatchUpdate` is imported but not directly used in the file
- However, `InquiryMatchWithProperty` extends `InquiryMatch` (line 87 in index.ts), so it might be needed indirectly
- `InquiryMatchInsert` IS used (line 191)

**Fix Required:** Remove unused imports:
```typescript
import type {
  PropertyInquiry,
  PropertyInquiryInsert,
  PropertyInquiryUpdate,
  InquiryMatchInsert,  // Keep this - used on line 191
  InquiryWithMatches,
  InquiryMatchWithProperty,
  Property,
} from '../types';
```

**Likely Cause:** Code cleanup needed - leftover imports from development.

---

## ℹ️ Minor Issues

**None found.** Code formatting and style appear consistent.

---

## Analysis by Category

### Import Path Issues

**Pattern Identified:**
- Files importing from `@/types/database` expect individual types
- `database.ts` only exports `Database` type
- Individual types (`Meeting`, `Property`, `Tenant`, etc.) are exported from `@/types/index.ts`

**Affected Files:**
1. `src/services/meetings.service.ts` - 3 errors
2. `src/services/mockServices/mockMeetings.service.ts` - 3 errors
3. `src/components/calendar/AddMeetingDialog.tsx` - 3 errors (also wrong type name)
4. `src/components/calendar/EditMeetingDialog.tsx` - 4 errors (also wrong type name)

**Root Cause:** Inconsistent import pattern. Should follow:
- `Database` → from `@/types/database`
- `Meeting`, `Property`, `Tenant`, etc. → from `@/types`

---

### Type Name Issues

**Pattern Identified:**
- Components use `Owner` type name
- Actual exported type is `PropertyOwner`
- `Owner` type doesn't exist

**Affected Files:**
1. `src/components/calendar/AddMeetingDialog.tsx`
2. `src/components/calendar/EditMeetingDialog.tsx`

**Fix:** Replace `Owner` with `PropertyOwner` in:
- Import statements
- Type annotations
- Variable declarations

---

### Query Pattern Issues

**Pattern Identified:**
- `getUnreadMatchesCount()` uses incorrect Supabase count query pattern
- Should destructure `{ count, error }` not `{ data, error }`
- Should use `select('*')` not `select('id')` for count queries

**Affected Files:**
1. `src/services/inquiries.service.ts` - 1 error

**Reference:** Correct pattern exists in `photos.service.ts` line 106-112

---

## Suggested Next Steps

### Priority 1: Fix Import Errors (Critical)

1. **Update `meetings.service.ts`:**
   - Change imports from `@/types/database` to `@/types` for Meeting types
   - Keep `Database` import from `@/types/database`

2. **Update `mockMeetings.service.ts`:**
   - Change all Meeting type imports to `@/types`

3. **Update `AddMeetingDialog.tsx`:**
   - Change imports from `@/types/database` to `@/types`
   - Replace `Owner` with `PropertyOwner` throughout file

4. **Update `EditMeetingDialog.tsx`:**
   - Change imports from `@/types/database` to `@/types`
   - Replace `Owner` with `PropertyOwner` throughout file

**Estimated Time:** 15 minutes

---

### Priority 2: Fix Count Query (Critical)

1. **Update `inquiries.service.ts` line 256-264:**
   - Change `{ data, error }` to `{ count, error }`
   - Change `.select('id', ...)` to `.select('*', ...)`
   - Change `return data || 0` to `return count || 0`

**Estimated Time:** 5 minutes

---

### Priority 3: Clean Up Unused Imports (Warning)

1. **Update `inquiries.service.ts`:**
   - Remove `InquiryMatch` and `InquiryMatchUpdate` from imports
   - Keep `InquiryMatchInsert` (used on line 191)

**Estimated Time:** 2 minutes

---

## Impact Assessment

### Build Status
- ❌ **Will NOT build** - 7 critical TypeScript errors block compilation
- All errors are in service/component layer, not database layer

### Runtime Impact
- ⚠️ **Calendar feature broken** - Cannot import Meeting types
- ⚠️ **Calendar dialogs broken** - Cannot import Owner/Property/Tenant types
- ⚠️ **Inquiries count broken** - Wrong return type will cause runtime error

### Data Integrity
- ✅ **No data issues** - All errors are TypeScript type errors, not runtime logic

---

## Files Summary

| File | Errors | Warnings | Status |
|------|--------|----------|--------|
| `src/services/meetings.service.ts` | 3 | 0 | ❌ Broken |
| `src/services/mockServices/mockMeetings.service.ts` | 3 | 0 | ❌ Broken |
| `src/services/inquiries.service.ts` | 1 | 2 | ❌ Broken |
| `src/components/calendar/AddMeetingDialog.tsx` | 3 | 0 | ❌ Broken |
| `src/components/calendar/EditMeetingDialog.tsx` | 4 | 0 | ❌ Broken |

**Total:** 14 issues across 5 files

---

## Conclusion

**All errors are fixable import/type issues** - no structural problems detected.

**Root Cause:** Inconsistent import patterns after database.ts regeneration. Files need to:
1. Import `Database` from `@/types/database`
2. Import individual types (`Meeting`, `Property`, etc.) from `@/types`
3. Use correct type names (`PropertyOwner` not `Owner`)

**Estimated Fix Time:** ~20 minutes total

**Recommendation:** Fix all import errors first, then fix the count query, then clean up unused imports.

---

**Report End**

