# Profile.tsx Refactoring Plan

## Current State Analysis

### File Statistics
- **Current Lines**: 456 lines
- **Imports**: 22 imports
- **React Hooks Used**: 7 hooks
  - `useState`: 5 (loading, saveSuccess, refreshingRates, exchangeRates, lastUpdated)
  - `useEffect`: 1 (loading preferences and exchange rates)
  - `useForm`: 1 (form management)
- **Functions**: 5 utility functions
- **Form Fields**: 6 fields
- **UI Sections**: 3 major sections

### Responsibilities (Current Issues)

1. **Profile Data Management** 🔴
   - Loading user preferences
   - Saving user preferences
   - Form state management
   - Success/error handling

2. **Exchange Rates Management** 🔴
   - Loading exchange rates
   - Refreshing exchange rates
   - Displaying exchange rates
   - Formatting last updated timestamp

3. **Form Sections** 🟡
   - Profile header (avatar, email, user ID)
   - Personal info fields (full name, phone)
   - Preferences fields (language, currency, meeting reminder, commission rate)
   - Exchange rates display

4. **Utility Functions** 🟢
   - Language/currency normalization
   - Date formatting
   - User initials extraction

5. **Validation Logic** 🟢
   - Form validation schema (already extracted to `profileSchema.ts`)

### Missing Features (Mentioned in Analysis)
- ❌ **Password change logic** - Not found in current implementation
- ✅ **Business info management** - Partially implemented (full_name, phone_number)
- ✅ **User preferences** - Fully implemented
- ⚠️ **Multiple form sections** - All in one form

---

## Target State

### Goal
- **Target Lines**: ~200 lines (56% reduction)
- **Target Structure**: Modular components with clear separation of concerns
- **Target Hooks**: 3-4 focused hooks (data, exchange rates, form)

---

## Extraction Plan

### Phase 1: Core Hooks (Logic Extraction)

#### **EXTRACTION #1: Profile Data Hook** 🔴 HIGH PRIORITY
**File**: `src/features/profile/hooks/useProfileData.ts`

**What to Extract:**
- `loading` state
- `saveSuccess` state
- `loadPreferences` function (from useEffect)
- `handleSubmit` function
- Success/error handling logic

**Props:**
```typescript
interface UseProfileDataOptions {
  form: UseFormReturn<ProfileFormData>;
  onSuccess?: () => void;
}

interface UseProfileDataReturn {
  loading: boolean;
  saveSuccess: boolean;
  handleSubmit: (data: ProfileFormData) => Promise<void>;
}
```

**Estimated Reduction**: ~35 lines

---

#### **EXTRACTION #2: Exchange Rates Hook** 🔴 HIGH PRIORITY
**File**: `src/features/profile/hooks/useExchangeRates.ts`

**What to Extract:**
- `refreshingRates` state
- `exchangeRates` state
- `lastUpdated` state
- `loadExchangeRates` function
- `handleRefreshRates` function
- `formatLastUpdated` function
- Initial exchange rates loading (from useEffect)

**Props:**
```typescript
interface UseExchangeRatesReturn {
  exchangeRates: Record<string, number>;
  lastUpdated: number | null;
  refreshingRates: boolean;
  handleRefreshRates: () => Promise<void>;
  formatLastUpdated: (timestamp: number | null) => string;
}
```

**Estimated Reduction**: ~55 lines

---

#### **EXTRACTION #3: Profile Form Hook** 🟡 MEDIUM PRIORITY
**File**: `src/features/profile/hooks/useProfileForm.ts`

**What to Extract:**
- Form initialization
- Default values setup
- `normalizeLanguage` function
- `normalizeCurrency` function
- Form reset logic

**Props:**
```typescript
interface UseProfileFormReturn {
  form: UseFormReturn<ProfileFormData>;
  loadPreferences: (preferences: UserPreferences) => void;
}
```

**Estimated Reduction**: ~30 lines

---

### Phase 2: UI Components (Component Extraction)

#### **EXTRACTION #4: Profile Header Component** 🟡 MEDIUM PRIORITY
**File**: `src/features/profile/components/ProfileHeader.tsx`

**What to Extract:**
- Avatar display
- Email display
- Full name and phone preview
- User ID badge
- `getUserInitials` function

**Props:**
```typescript
interface ProfileHeaderProps {
  user: User | null;
  fullName: string;
  phoneNumber: string;
}
```

**Estimated Reduction**: ~35 lines

---

#### **EXTRACTION #5: Personal Info Section Component** 🟡 MEDIUM PRIORITY
**File**: `src/features/profile/components/PersonalInfoSection.tsx`

**What to Extract:**
- Full Name field
- Phone Number field
- Form field rendering logic

**Props:**
```typescript
interface PersonalInfoSectionProps {
  form: UseFormReturn<ProfileFormData>;
  loading: boolean;
}
```

**Estimated Reduction**: ~40 lines

---

#### **EXTRACTION #6: Preferences Section Component** 🟡 MEDIUM PRIORITY
**File**: `src/features/profile/components/PreferencesSection.tsx`

**What to Extract:**
- Language field
- Currency field
- Meeting Reminder field
- Commission Rate field
- Form field rendering logic

**Props:**
```typescript
interface PreferencesSectionProps {
  form: UseFormReturn<ProfileFormData>;
  loading: boolean;
}
```

**Estimated Reduction**: ~95 lines

---

#### **EXTRACTION #7: Exchange Rates Section Component** 🟡 MEDIUM PRIORITY
**File**: `src/features/profile/components/ExchangeRatesSection.tsx`

**What to Extract:**
- Exchange rates display
- Refresh button
- Last updated timestamp
- Rate cards (USD, TRY, EUR)

**Props:**
```typescript
interface ExchangeRatesSectionProps {
  exchangeRates: Record<string, number>;
  lastUpdated: number | null;
  refreshingRates: boolean;
  onRefresh: () => Promise<void>;
  formatLastUpdated: (timestamp: number | null) => string;
}
```

**Estimated Reduction**: ~55 lines

---

#### **EXTRACTION #8: Profile Success Alert Component** 🟢 LOW PRIORITY
**File**: `src/features/profile/components/ProfileSuccessAlert.tsx`

**What to Extract:**
- Success alert UI
- Auto-hide logic (if needed)

**Props:**
```typescript
interface ProfileSuccessAlertProps {
  show: boolean;
  message: string;
}
```

**Estimated Reduction**: ~12 lines

---

## Expected Results

### Before
- **Total Lines**: 456 lines
- **Hooks**: 7 hooks (5 useState, 1 useEffect, 1 useForm)
- **Functions**: 5 utility functions
- **Components**: 0 extracted components

### After
- **Profile.tsx**: ~200 lines (56% reduction)
- **Hooks**: 3-4 focused hooks
- **Components**: 5 extracted components
- **Total Files Created**: 8 new modular files

### Files to Create

**Hooks (3):**
- `hooks/useProfileData.ts` (~60 lines)
- `hooks/useExchangeRates.ts` (~80 lines)
- `hooks/useProfileForm.ts` (~50 lines)

**Components (5):**
- `components/ProfileHeader.tsx` (~50 lines)
- `components/PersonalInfoSection.tsx` (~55 lines)
- `components/PreferencesSection.tsx` (~110 lines)
- `components/ExchangeRatesSection.tsx` (~70 lines)
- `components/ProfileSuccessAlert.tsx` (~20 lines)

**Total**: 8 new modular files

---

## Benefits

1. **Maintainability**: Each piece has a single responsibility
2. **Testability**: Independent testing of hooks and components
3. **Reusability**: Components can be reused in other profile contexts
4. **Readability**: Main component focuses on orchestration
5. **Extensibility**: Easy to add new sections (e.g., password change, business info)

---

## Notes

### Missing Features to Consider
- **Password Change Section**: Not currently implemented. Should be added as a separate section component when implemented.
- **Business Info Section**: Currently limited to full_name and phone_number. Could be expanded with:
  - Business name
  - Business address
  - Business license number
  - Tax ID
- **Security Section**: Could include:
  - Password change
  - Two-factor authentication
  - Session management

### Future Enhancements
After refactoring, consider:
1. Adding password change functionality as a new section
2. Expanding business info section with additional fields
3. Creating a security settings section
4. Adding email verification status
5. Adding profile picture upload functionality

---

## Refactoring Order (Recommended)

1. ✅ **Extraction #1**: Profile Data Hook (core functionality)
2. ✅ **Extraction #2**: Exchange Rates Hook (isolated feature)
3. ✅ **Extraction #3**: Profile Form Hook (form setup)
4. ✅ **Extraction #4**: Profile Header Component (UI)
5. ✅ **Extraction #5**: Personal Info Section (form fields)
6. ✅ **Extraction #6**: Preferences Section (form fields)
7. ✅ **Extraction #7**: Exchange Rates Section (UI)
8. ✅ **Extraction #8**: Profile Success Alert (small UI)

---

**Last Updated**: 2025-01-15
**Status**: Planning Complete, Ready for Implementation

