# Onboarding Flow Implementation Plan

**Date:** 2025-01-04  
**Status:** Ready for Implementation  
**Tool:** Cursor IDE Plan Mode

---

## Strategy Decisions

### 1. Implementation Phases
**✅ Recommendation: Phase-by-Phase (3 phases)**

**Rationale:**
- Easier to test incrementally
- Catch issues early
- Can demo progress after each phase
- Maintains code quality

**Phases:**
- **Phase 1:** Database + Routing + Step 1 (Foundation)
- **Phase 2:** Step 2 (Organization + Preferences)
- **Phase 3:** Step 3 (Quick Start) + Integration

---

### 2. Data Persistence Approach
**✅ Recommendation: Save Each Step Immediately**

**Rationale:**
- Better UX if user refreshes mid-onboarding
- Enables resume functionality
- Tracks progress for analytics
- Prevents data loss

**Implementation:**
- Step 1 complete → Save `primary_use_case` to `organizations` table
- Step 2 complete → Save `team_size_range` + `language`/`currency` to `user_preferences`
- Step 3 complete → Mark `onboarding_completed = TRUE`

---

### 3. Routing Strategy
**✅ Recommendation: Dedicated Route `/onboarding` with Redirect Logic**

**Rationale:**
- Cleaner separation of concerns
- Better mobile UX (full screen)
- Easier to test
- Can be shown as modal later if needed

**Implementation:**
- Add `/onboarding` route
- ProtectedRoute checks `onboarding_completed` status
- Redirects to `/onboarding` if incomplete
- After completion, redirects to dashboard

---

### 4. i18n Implementation
**✅ Recommendation: Build i18n Support from Start**

**Rationale:**
- Translation structure already defined in strategy doc
- Not much extra work (just translation files)
- Prevents rework later
- Both TR and EN are required

**Implementation:**
- Create `public/locales/tr/onboarding.json`
- Create `public/locales/en/onboarding.json`
- Use `useTranslation('onboarding')` in all components
- Detect user's language preference from `user_preferences`

---

### 5. Component Structure
**✅ Recommendation: Follow Existing Pattern**

```
src/features/onboarding/
├── Onboarding.tsx (main page component)
├── components/
│   ├── OnboardingProgress.tsx (progress indicator)
│   ├── Step1GoalSelection.tsx
│   ├── Step2OrganizationSetup.tsx
│   └── Step3QuickStart.tsx
├── hooks/
│   ├── useOnboarding.ts (state management)
│   └── useOnboardingCompletion.ts (completion logic)
└── services/
    └── onboarding.service.ts (Supabase calls)
```

**Rationale:**
- Matches existing feature structure (e.g., `features/profile/`)
- Clear separation of concerns
- Easy to find and maintain

---

### 6. Task Breakdown
**✅ Recommendation: Full-Stack Incremental**

**Rationale:**
- Each step is complete and testable
- Reduces risk of integration issues
- Can demo after each phase

**Approach:**
- Phase 1: Step 1 (UI + DB + test)
- Phase 2: Step 2 (UI + DB + test)
- Phase 3: Step 3 (UI + integration + test)

---

## Phase-by-Phase Implementation Plan

---

### Phase 1: Foundation + Step 1 (Goal Selection)

**Goal:** Set up database schema, routing, and implement Step 1 with full i18n support

**Tasks:**
1. Create database migration for onboarding tracking
2. Create onboarding service (Supabase calls)
3. Add `/onboarding` route to App.tsx
4. Create Step 1 component (Goal Selection) with i18n
5. Create onboarding translation files (TR + EN)
6. Update ProtectedRoute to check onboarding status
7. Test Step 1 flow (save to DB, navigation)

**Files to create:**
- `supabase/migrations/20250104000001_add_onboarding_tracking.sql`
- `src/features/onboarding/Onboarding.tsx`
- `src/features/onboarding/components/OnboardingProgress.tsx`
- `src/features/onboarding/components/Step1GoalSelection.tsx`
- `src/features/onboarding/hooks/useOnboarding.ts`
- `src/features/onboarding/services/onboarding.service.ts`
- `public/locales/tr/onboarding.json`
- `public/locales/en/onboarding.json`

**Files to modify:**
- `src/config/constants.ts` (add `ONBOARDING: '/onboarding'`)
- `src/App.tsx` (add onboarding route)
- `src/components/common/ProtectedRoute.tsx` (add onboarding check)

**Success criteria:**
- [ ] Database migration runs successfully
- [ ] User redirected to `/onboarding` after signup (if incomplete)
- [ ] Step 1 UI renders correctly (Turkish + English)
- [ ] Goal selection saves to `organizations.primary_use_case`
- [ ] Progress indicator shows "Step 1 of 3"
- [ ] Navigation to Step 2 works
- [ ] Skip button works (defaults to "all")

**Time:** ~2-3 hours

---

### Phase 2: Step 2 (Organization Setup + Preferences)

**Goal:** Implement Step 2 with organization name, team size, and language/currency preferences

**Tasks:**
1. Create Step 2 component (Organization Setup + Preferences)
2. Integrate with OrgContext to get current org name
3. Add language/currency dropdowns (optional section)
4. Save preferences to `user_preferences` table
5. Update organization name via `organizationService`
6. Test Step 2 flow (all fields save correctly)

**Files to create:**
- `src/features/onboarding/components/Step2OrganizationSetup.tsx`

**Files to modify:**
- `src/features/onboarding/hooks/useOnboarding.ts` (add Step 2 state)
- `src/features/onboarding/services/onboarding.service.ts` (add Step 2 save methods)
- `public/locales/tr/onboarding.json` (add Step 2 translations)
- `public/locales/en/onboarding.json` (add Step 2 translations)

**Success criteria:**
- [ ] Step 2 UI renders correctly
- [ ] Organization name is pre-filled and editable
- [ ] Team size selection works
- [ ] Language dropdown works (Turkish/English)
- [ ] Currency dropdown works (TRY/USD/EUR)
- [ ] All data saves to database correctly
- [ ] Language preference updates i18n immediately
- [ ] Navigation to Step 3 works
- [ ] Back button returns to Step 1

**Time:** ~2-3 hours

---

### Phase 3: Step 3 (Quick Start) + Integration

**Goal:** Implement Step 3 with dynamic actions based on Step 1 selection, complete onboarding flow

**Tasks:**
1. Create Step 3 component (Quick Start with dynamic CTAs)
2. Implement navigation logic based on `primary_use_case`
3. Mark onboarding as complete after Step 3
4. Add completion tracking to `onboarding_events` table
5. Update dashboard to hide onboarding after completion
6. Test full flow end-to-end
7. Add error handling and loading states

**Files to create:**
- `src/features/onboarding/components/Step3QuickStart.tsx`
- `src/features/onboarding/hooks/useOnboardingCompletion.ts`

**Files to modify:**
- `src/features/onboarding/Onboarding.tsx` (add Step 3)
- `src/features/onboarding/hooks/useOnboarding.ts` (add completion logic)
- `src/features/onboarding/services/onboarding.service.ts` (add completion method)
- `src/features/dashboard/Dashboard.tsx` (check onboarding status)
- `public/locales/tr/onboarding.json` (add Step 3 translations)
- `public/locales/en/onboarding.json` (add Step 3 translations)

**Success criteria:**
- [ ] Step 3 UI renders correctly
- [ ] CTA buttons match Step 1 selection (properties/clients/contracts/team)
- [ ] Skip button works (shows dashboard with empty state)
- [ ] Action buttons navigate to correct forms
- [ ] Onboarding marked as complete in database
- [ ] User redirected to dashboard after completion
- [ ] Onboarding never shows again after completion
- [ ] Analytics events saved to `onboarding_events` table
- [ ] Full flow works in both Turkish and English

**Time:** ~2-3 hours

---

## Additional Implementation Details

### Database Migration Structure

```sql
-- File: supabase/migrations/20250104000001_add_onboarding_tracking.sql

-- Add onboarding columns to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS primary_use_case TEXT,
ADD COLUMN IF NOT EXISTS team_size_range TEXT,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_skipped_at TIMESTAMPTZ;

-- Create onboarding events table (for analytics)
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  action_taken TEXT NOT NULL, -- 'completed', 'skipped', 'abandoned'
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_events_org_id ON onboarding_events(org_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id ON onboarding_events(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_onboarding_completed 
ON organizations(onboarding_completed) 
WHERE onboarding_completed = FALSE;
```

### Service Layer Structure

```typescript
// src/features/onboarding/services/onboarding.service.ts

class OnboardingService {
  // Step 1: Save primary use case
  async savePrimaryUseCase(orgId: string, useCase: string): Promise<void>
  
  // Step 2: Save organization setup
  async saveOrganizationSetup(
    orgId: string, 
    name: string, 
    teamSize: string
  ): Promise<void>
  
  // Step 2: Save user preferences (language/currency)
  async saveUserPreferences(
    userId: string,
    language: string,
    currency: string
  ): Promise<void>
  
  // Step 3: Mark onboarding complete
  async completeOnboarding(orgId: string): Promise<void>
  
  // Track onboarding event (analytics)
  async trackEvent(
    orgId: string,
    userId: string,
    stepNumber: number,
    stepName: string,
    action: 'completed' | 'skipped' | 'abandoned',
    data?: Record<string, unknown>
  ): Promise<void>
  
  // Check onboarding status
  async getOnboardingStatus(orgId: string): Promise<OnboardingStatus>
}
```

### Hook Structure

```typescript
// src/features/onboarding/hooks/useOnboarding.ts

interface UseOnboardingReturn {
  currentStep: number;
  primaryUseCase: string | null;
  organizationName: string;
  teamSize: string | null;
  language: 'tr' | 'en';
  currency: 'TRY' | 'USD' | 'EUR';
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setPrimaryUseCase: (useCase: string) => void;
  setOrganizationName: (name: string) => void;
  setTeamSize: (size: string) => void;
  setLanguage: (lang: 'tr' | 'en') => void;
  setCurrency: (curr: 'TRY' | 'USD' | 'EUR') => void;
  
  // Step navigation
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Save actions
  saveStep1: () => Promise<void>;
  saveStep2: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}
```

### ProtectedRoute Integration

```typescript
// Add to ProtectedRoute.tsx

// After billing check, before rendering children:
const { currentOrg } = useOrg();

// Check onboarding status
if (currentOrg && !currentOrg.onboarding_completed) {
  // Don't redirect if already on onboarding page
  if (location.pathname !== ROUTES.ONBOARDING) {
    return <Navigate to={ROUTES.ONBOARDING} replace />;
  }
}
```

---

## Testing Checklist

### Phase 1 Testing
- [ ] New user signup → Redirects to `/onboarding`
- [ ] Step 1 renders in Turkish (default)
- [ ] Step 1 renders in English (if language changed)
- [ ] Goal selection saves to database
- [ ] Progress indicator shows correctly
- [ ] Skip button works (defaults to "all")

### Phase 2 Testing
- [ ] Organization name pre-filled from org context
- [ ] Organization name editable
- [ ] Team size selection saves
- [ ] Language dropdown updates UI immediately
- [ ] Currency dropdown saves correctly
- [ ] All data persists after refresh
- [ ] Back button works

### Phase 3 Testing
- [ ] Step 3 shows correct CTA based on Step 1
- [ ] Action buttons navigate to correct pages
- [ ] Skip button shows dashboard
- [ ] Onboarding marked complete in DB
- [ ] User never sees onboarding again
- [ ] Analytics events saved

### Integration Testing
- [ ] Full flow: Signup → Step 1 → Step 2 → Step 3 → Dashboard
- [ ] Refresh mid-onboarding → Resumes at correct step
- [ ] Language switching works throughout
- [ ] Mobile responsive (test on mobile device)
- [ ] Error handling (network errors, validation)

---

## Estimated Total Time

- **Phase 1:** 2-3 hours
- **Phase 2:** 2-3 hours
- **Phase 3:** 2-3 hours
- **Testing & Bug Fixes:** 1-2 hours

**Total:** 7-11 hours (1-1.5 days)

---

## Risk Mitigation

### Potential Issues
1. **Onboarding check conflicts with billing check**
   - **Solution:** Check onboarding AFTER billing check, but before rendering

2. **Language switching mid-onboarding**
   - **Solution:** Update i18n immediately when language changes in Step 2

3. **User refreshes mid-onboarding**
   - **Solution:** Save each step immediately, resume from last completed step

4. **Mobile UX issues**
   - **Solution:** Test on mobile early, use responsive design patterns

---

## Next Steps

1. **Review this plan** - Confirm approach and timeline
2. **Start Phase 1** - Use Cursor Plan mode to implement foundation
3. **Test Phase 1** - Verify all success criteria
4. **Continue to Phase 2** - Implement Step 2
5. **Continue to Phase 3** - Complete onboarding flow
6. **Final testing** - End-to-end testing with real users

---

**Document Status:** Ready for Implementation  
**Last Updated:** 2025-01-04

