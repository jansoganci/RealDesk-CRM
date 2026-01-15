# Onboarding Data Persistence Investigation Report

**Date:** 2025-01-14  
**Application:** Devash (Emlak CRM)  
**Status:** ✅ **DATA IS BEING SAVED**

---

## Executive Summary

**Answer: YES** - The Devash web application **IS currently saving** user responses from the onboarding process to the database. Data is persisted to **Supabase (PostgreSQL)** across multiple tables.

---

## 1. Onboarding Flow Analysis

### 1.1 Onboarding Components

The onboarding flow consists of **3 steps** implemented in the following components:

| Step | Component | File Path |
|------|-----------|-----------|
| Step 1 | `Step1GoalSelection` | `src/features/onboarding/components/Step1GoalSelection.tsx` |
| Step 2 | `Step2OrganizationSetup` | `src/features/onboarding/components/Step2OrganizationSetup.tsx` |
| Step 3 | `Step3QuickStart` | `src/features/onboarding/components/Step3QuickStart.tsx` |

**Main Orchestrator:**
- `Onboarding.tsx` - `src/features/onboarding/Onboarding.tsx`

**State Management Hook:**
- `useOnboarding` - `src/features/onboarding/hooks/useOnboarding.ts`

**Service Layer:**
- `onboardingService` - `src/features/onboarding/services/onboarding.service.ts`

### 1.2 Data Points Collected

#### Step 1: Goal Selection
- **Question:** "What will you use Emlak CRM for?"
- **Data Collected:**
  - `primary_use_case` (string): One of `'properties'`, `'clients'`, `'contracts'`, `'team'`, or `'all'`
- **Required:** Yes (but can be skipped, defaults to `'all'`)

#### Step 2: Organization Setup
- **Data Collected:**
  1. **Organization Name** (string, 2-255 characters)
  2. **Team Size** (string): One of `'1'`, `'2-5'`, `'6-20'`, or `'21+'`
  3. **Language Preference** (string): `'tr'` or `'en'` (optional, defaults to `'tr'`)
  4. **Currency Preference** (string): `'TRY'`, `'USD'`, or `'EUR'` (optional, defaults to `'TRY'`)

#### Step 3: Quick Start
- **Data Collected:** None (completion tracking only)
- **Action:** Marks onboarding as complete

---

## 2. Data Persistence Investigation

### 2.1 Database Storage ✅

**All onboarding data IS being saved to Supabase (PostgreSQL).**

#### Storage Locations:

| Data Point | Database Table | Column | File Reference |
|------------|---------------|--------|----------------|
| Primary Use Case | `organizations` | `primary_use_case` | `onboarding.service.ts:42-64` |
| Team Size | `organizations` | `team_size_range` | `onboarding.service.ts:173-195` |
| Organization Name | `organizations` | `name` | `organization.service.ts:23-49` |
| Language | `user_preferences` | `language` | `userPreferences.service.ts:50-75` |
| Currency | `user_preferences` | `currency` | `userPreferences.service.ts:50-75` |
| Onboarding Status | `organizations` | `onboarding_completed`, `onboarding_completed_at`, `onboarding_step` | `onboarding.service.ts:136-150` |
| Analytics Events | `onboarding_events` | Full event data (JSONB) | `onboarding.service.ts:98-131` |

### 2.2 Database Schema

#### Organizations Table
```typescript
// From: src/types/database.types.ts (lines 980-1030)
organizations: {
  primary_use_case: string | null
  team_size_range: string | null
  onboarding_completed: boolean | null
  onboarding_completed_at: string | null
  onboarding_step: number | null
  onboarding_skipped: boolean | null
  onboarding_skipped_at: string | null
  name: string
  // ... other fields
}
```

#### User Preferences Table
```typescript
// From: src/services/userPreferences.service.ts
user_preferences: {
  user_id: string
  language: string  // 'tr' | 'en'
  currency: string   // 'TRY' | 'USD' | 'EUR'
  // ... other fields
}
```

#### Onboarding Events Table
```typescript
// From: onboarding.service.ts:98-131
onboarding_events: {
  id: UUID
  org_id: UUID
  user_id: UUID
  step_number: number (1-3)
  step_name: string
  action_taken: 'completed' | 'skipped' | 'abandoned'
  data: JSONB  // Contains step-specific data
  created_at: TIMESTAMPTZ
}
```

### 2.3 Local Storage / Session Storage ❌

**No local storage or session storage is used** for onboarding data persistence.

**Evidence:**
- No `localStorage` or `sessionStorage` calls found in onboarding components
- All data is persisted directly to the database

### 2.4 State Management

**React State (Temporary):**
- Uses React `useState` hooks in `useOnboarding.ts` for UI state
- State is loaded from database on component mount
- State is saved to database immediately when user completes each step

**No Redux or Context API for onboarding data persistence** - only for UI state management.

---

## 3. Code Review - Data Persistence Implementation

### 3.1 Step 1: Primary Use Case Saving

**File:** `src/features/onboarding/components/Step1GoalSelection.tsx`

```typescript
// Lines 85-94
await onboardingService.savePrimaryUseCase(currentOrg.id, primaryUseCase);

await onboardingService.trackEvent(
  currentOrg.id,
  userId,
  1,
  'goal_selection',
  'completed',
  { primary_use_case: primaryUseCase }
);
```

**Service Implementation:** `src/features/onboarding/services/onboarding.service.ts:42-64`

```typescript
async savePrimaryUseCase(orgId: string, useCase: string): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({ 
      primary_use_case: useCase,
      onboarding_step: 1,
    })
    .eq('id', orgId);
  // Error handling...
}
```

**Database Operation:** ✅ **UPDATE** to `organizations` table

### 3.2 Step 2: Organization Setup Saving

**File:** `src/features/onboarding/hooks/useOnboarding.ts`

```typescript
// Lines 180-190
// 1. Update organization name
await organizationService.updateName(currentOrg.id, organizationName.trim());

// 2. Save team size
await onboardingService.saveTeamSize(currentOrg.id, teamSize);

// 3. Save preferences (always, even if defaults)
await userPreferencesService.updatePreferences({
  language,
  currency,
});

// 4. Track event
await onboardingService.trackEvent(
  currentOrg.id,
  userId,
  2,
  'organization_setup',
  'completed',
  {
    organization_name: organizationName.trim(),
    team_size: teamSize,
    language,
    currency,
  }
);
```

**Database Operations:**
1. ✅ **UPDATE** `organizations.name` (via `organizationService.updateName`)
2. ✅ **UPDATE** `organizations.team_size_range` (via `onboardingService.saveTeamSize`)
3. ✅ **UPSERT** `user_preferences` (via `userPreferencesService.updatePreferences`)
4. ✅ **INSERT** `onboarding_events` (analytics tracking)

### 3.3 Step 3: Completion Tracking

**File:** `src/features/onboarding/components/Step3QuickStart.tsx`

```typescript
// Lines 36-46
await onboardingService.completeOnboarding(currentOrg.id);

await onboardingService.trackEvent(
  currentOrg.id,
  userId,
  3,
  'quick_start',
  'completed',
  { primary_use_case: primaryUseCase }
);
```

**Service Implementation:** `src/features/onboarding/services/onboarding.service.ts:136-150`

```typescript
async completeOnboarding(orgId: string): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      onboarding_step: 3,
    })
    .eq('id', orgId);
}
```

**Database Operation:** ✅ **UPDATE** to `organizations` table

### 3.4 Analytics Event Tracking

**All steps track events** to the `onboarding_events` table for analytics:

**File:** `src/features/onboarding/services/onboarding.service.ts:98-131`

```typescript
async trackEvent(
  orgId: string,
  userId: string,
  stepNumber: number,
  stepName: string,
  action: 'completed' | 'skipped' | 'abandoned',
  data?: OnboardingEventData
): Promise<void> {
  const { error } = await supabase
    .from('onboarding_events')
    .insert({
      org_id: orgId,
      user_id: userId,
      step_number: stepNumber,
      step_name: stepName,
      action_taken: action,
      data: (data || {}) as any,
    });
}
```

**Database Operation:** ✅ **INSERT** to `onboarding_events` table

---

## 4. Current Implementation Status

### 4.1 Is Data Currently Being Saved? ✅ **YES**

**Evidence:**
1. ✅ All three steps call database save operations
2. ✅ Service methods use Supabase client to persist data
3. ✅ Error handling is in place (throws errors if save fails)
4. ✅ Data is saved immediately when user clicks "Continue" on each step
5. ✅ Database migrations exist for all required tables

### 4.2 Where Data is Saved

| Step | Data Saved | Table | Column(s) |
|------|-----------|-------|-----------|
| Step 1 | Primary use case | `organizations` | `primary_use_case`, `onboarding_step` |
| Step 1 | Event tracking | `onboarding_events` | Full event record |
| Step 2 | Organization name | `organizations` | `name` |
| Step 2 | Team size | `organizations` | `team_size_range`, `onboarding_step` |
| Step 2 | Language preference | `user_preferences` | `language` |
| Step 2 | Currency preference | `user_preferences` | `currency` |
| Step 2 | Event tracking | `onboarding_events` | Full event record |
| Step 3 | Completion status | `organizations` | `onboarding_completed`, `onboarding_completed_at`, `onboarding_step` |
| Step 3 | Event tracking | `onboarding_events` | Full event record |

### 4.3 Data Format

**Organizations Table:**
- `primary_use_case`: TEXT (string: 'properties', 'clients', 'contracts', 'team', 'all')
- `team_size_range`: TEXT (string: '1', '2-5', '6-20', '21+')
- `onboarding_completed`: BOOLEAN
- `onboarding_completed_at`: TIMESTAMPTZ (ISO string)
- `onboarding_step`: INTEGER (0-3)

**User Preferences Table:**
- `language`: TEXT (string: 'tr', 'en')
- `currency`: TEXT (string: 'TRY', 'USD', 'EUR')

**Onboarding Events Table:**
- `data`: JSONB (contains step-specific data as JSON object)

---

## 5. Unused Database Table

### 5.1 `user_onboarding_responses` Table

**Status:** ❌ **NOT CURRENTLY USED**

**Location:** `supabase/migrations/20260114000003_add_user_onboarding_responses.sql`

**Table Schema:**
```sql
CREATE TABLE IF NOT EXISTS public.user_onboarding_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    question_key TEXT NOT NULL,
    answer JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, question_key)
);
```

**Purpose (from migration comments):**
> "Stores user responses to onboarding survey questions for business intelligence."

**Current Status:**
- ✅ Table exists in database (migration has been run)
- ❌ **No code references this table** (grep search found 0 matches in `src/`)
- ❌ **No service methods** save data to this table
- ❌ **Not integrated** into onboarding flow

**Conclusion:** This appears to be a **planned feature** for flexible survey response storage that has not been implemented yet. The current implementation uses direct column updates to `organizations` and `user_preferences` tables instead.

---

## 6. Recommendations

### 6.1 Current Implementation ✅

The current implementation is **working correctly** and saving all onboarding data to the database. No changes are needed for basic functionality.

### 6.2 Optional Enhancements

#### 6.2.1 Implement `user_onboarding_responses` Table Usage

If you want to use the existing `user_onboarding_responses` table for more flexible response storage:

**Benefits:**
- Store responses in a normalized format
- Easier to add new questions without schema changes
- Better for analytics/BI queries

**Implementation Steps:**
1. Add methods to `onboarding.service.ts`:
   ```typescript
   async saveResponse(questionKey: string, answer: any): Promise<void> {
     const userId = await getAuthenticatedUserId();
     const { error } = await supabase
       .from('user_onboarding_responses')
       .upsert({
         user_id: userId,
         org_id: currentOrg.id,
         question_key: questionKey,
         answer: answer,
       }, {
         onConflict: 'user_id,question_key'
       });
   }
   ```

2. Call this method in addition to (or instead of) direct column updates
3. Use question keys like: `'primary_use_case'`, `'team_size'`, `'language'`, `'currency'`

#### 6.2.2 Add Data Validation

Consider adding more robust validation:
- Validate data types before saving
- Add database constraints if not already present
- Add retry logic for failed saves

#### 6.2.3 Add Data Loading on Resume

The code already loads saved data when resuming onboarding (see `useOnboarding.ts:253-277`), but you could enhance it to also load from `user_onboarding_responses` if implemented.

---

## 7. Summary

### ✅ **YES - Data IS Being Saved**

**All onboarding responses are currently being saved to Supabase database:**

1. ✅ **Step 1 data** → `organizations.primary_use_case`
2. ✅ **Step 2 data** → `organizations.name`, `organizations.team_size_range`, `user_preferences.language`, `user_preferences.currency`
3. ✅ **Step 3 data** → `organizations.onboarding_completed`, `onboarding_completed_at`
4. ✅ **Analytics** → `onboarding_events` table (all steps)

**Storage Mechanism:** Supabase (PostgreSQL) via Supabase JavaScript client

**Persistence Timing:** Immediate (saved when user clicks "Continue" on each step)

**Resume Capability:** ✅ Yes - Data is loaded from database when user returns to onboarding

---

## 8. File Reference Summary

### Key Files

| File | Purpose |
|------|---------|
| `src/features/onboarding/components/Step1GoalSelection.tsx` | Step 1 UI and save logic |
| `src/features/onboarding/components/Step2OrganizationSetup.tsx` | Step 2 UI |
| `src/features/onboarding/components/Step3QuickStart.tsx` | Step 3 UI and completion |
| `src/features/onboarding/hooks/useOnboarding.ts` | State management and save methods |
| `src/features/onboarding/services/onboarding.service.ts` | Database operations for onboarding |
| `src/services/organization.service.ts` | Organization name updates |
| `src/services/userPreferences.service.ts` | User preferences (language/currency) |
| `supabase/migrations/20260114000003_add_user_onboarding_responses.sql` | Unused table migration |

### Database Tables Used

1. `organizations` - Primary onboarding data
2. `user_preferences` - User-level preferences
3. `onboarding_events` - Analytics tracking
4. `user_onboarding_responses` - **EXISTS BUT UNUSED**

---

**Report Generated:** 2025-01-14  
**Investigation Method:** Code analysis, database schema review, service layer inspection
