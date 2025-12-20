# Cookie Consent Implementation - Task Plan

## Overview

This document breaks down the cookie consent implementation into small, ordered tasks with clear dependencies. Each task is designed to be completed independently with minimal overlap.

**Total Tasks:** 45  
**Estimated Timeline:** 3-4 weeks  
**Dependencies:** Supabase setup, existing i18n infrastructure

---

## Phase 1: Foundation & Database Setup

### Task 1.1: Create Database Migration
**Priority:** Critical  
**Dependencies:** None  
**Estimated Time:** 30 minutes

- [ ] Create migration file: `supabase/migrations/YYYYMMDD_create_consent_logs_table.sql`
- [ ] Define `consent_logs` table structure (id, timestamp, version, categories JSONB, user_id, session_id, user_agent, language, created_at)
- [ ] Add indexes (user_id, session_id, timestamp)
- [ ] Enable RLS (Row Level Security)
- [ ] Create RLS policies (users can view own logs, anyone can insert)
- [ ] Test migration locally

**Files to Create:**
- `supabase/migrations/YYYYMMDD_create_consent_logs_table.sql`

---

### Task 1.2: Create Cookie Configuration File
**Priority:** Critical  
**Dependencies:** None  
**Estimated Time:** 20 minutes

- [ ] Create `src/lib/cookieConfig.ts`
- [ ] Define cookie categories (essential, analytics, marketing)
- [ ] List all cookies with details (name, purpose, duration, thirdParty, provider)
- [ ] Include GTM cookies: `_ga`, `_gid`, `_gtm`
- [ ] Export cookie definitions as TypeScript interface
- [ ] Add GTM container ID constant (GTM-WJW5DW9V)

**Files to Create:**
- `src/lib/cookieConfig.ts`

---

### Task 1.3: Create Consent Types & Interfaces
**Priority:** Critical  
**Dependencies:** Task 1.2  
**Estimated Time:** 15 minutes

- [ ] Create `src/types/cookieConsent.ts`
- [ ] Define `ConsentCategories` interface (essential, analytics, marketing)
- [ ] Define `ConsentRecord` interface (matches database schema)
- [ ] Define `ConsentState` interface (for hook state)
- [ ] Export all types

**Files to Create:**
- `src/types/cookieConsent.ts`

---

## Phase 2: Core Consent Logic

### Task 2.1: Create Consent Storage Utilities
**Priority:** Critical  
**Dependencies:** Task 1.3  
**Estimated Time:** 45 minutes

- [ ] Create `src/lib/cookieConsent.ts`
- [ ] Implement `getConsentFromStorage()` - read from localStorage
- [ ] Implement `saveConsentToStorage()` - write to localStorage
- [ ] Implement `clearConsentFromStorage()` - remove from localStorage
- [ ] Implement `hasConsent()` - check if category is consented
- [ ] Implement `getSessionId()` - generate/retrieve session ID
- [ ] Add TypeScript types and error handling

**Files to Create:**
- `src/lib/cookieConsent.ts`

---

### Task 2.2: Create Consent Hook (State Management)
**Priority:** Critical  
**Dependencies:** Task 2.1  
**Estimated Time:** 1.5 hours

- [ ] Create `src/hooks/useCookieConsent.ts`
- [ ] Implement state: `consent`, `showBanner`, `showPreferences`
- [ ] Implement `acceptAll()` - set all categories to true
- [ ] Implement `rejectAll()` - set analytics/marketing to false
- [ ] Implement `updateConsent()` - update specific categories
- [ ] Implement `openPreferences()` / `closePreferences()`
- [ ] Implement `checkExistingConsent()` - check localStorage on mount
- [ ] Implement GPC (Global Privacy Control) detection
- [ ] Add useEffect to persist consent changes to localStorage

**Files to Create:**
- `src/hooks/useCookieConsent.ts`

---

### Task 2.3: Implement GTM Consent Mode v2 Initialization
**Priority:** Critical  
**Dependencies:** Task 2.2  
**Estimated Time:** 30 minutes

- [ ] Create `src/lib/gtmConsent.ts`
- [ ] Implement `initGTMConsentMode()` - set default denied state
- [ ] Initialize dataLayer before any GTM script loads
- [ ] Set `analytics_storage: 'denied'`, `ad_storage: 'denied'`
- [ ] Call initialization in `App.tsx` or `main.tsx` (before React renders)
- [ ] Add TypeScript declarations for `window.dataLayer` and `gtag`

**Files to Create:**
- `src/lib/gtmConsent.ts`

**Files to Modify:**
- `src/main.tsx` or `src/App.tsx`

---

## Phase 3: Script Loading & Management

### Task 3.1: Remove GTM from index.html
**Priority:** Critical  
**Dependencies:** None  
**Estimated Time:** 5 minutes

- [ ] Remove GTM script from `index.html` `<head>` section
- [ ] Remove GTM noscript fallback from `index.html` `<body>` section
- [ ] Verify no GTM scripts load on page load
- [ ] Test that site still works without GTM

**Files to Modify:**
- `index.html`

---

### Task 3.2: Create Script Loader Utilities
**Priority:** Critical  
**Dependencies:** Task 2.1  
**Estimated Time:** 1 hour

- [ ] Create `src/lib/scriptLoader.ts`
- [ ] Implement `loadScript()` - generic script loader with category check
- [ ] Implement `loadGTM()` - GTM-specific loader with Consent Mode v2
- [ ] Implement `removeScript()` - remove script by category attribute
- [ ] Implement `clearCookies()` - clear cookies by category
- [ ] Implement `clearLocalStorageData()` - clear analytics data from localStorage
- [ ] Add `data-cookie-category` attribute to all loaded scripts
- [ ] Handle noscript fallback for GTM

**Files to Create:**
- `src/lib/scriptLoader.ts`

---

### Task 3.3: Update GTM Utilities to Check Consent
**Priority:** Critical  
**Dependencies:** Task 2.1, Task 3.2  
**Estimated Time:** 30 minutes

- [ ] Modify `src/utils/gtm.ts`
- [ ] Update `trackEvent()` to check consent before firing
- [ ] Update `trackPageView()` to check consent
- [ ] Update all tracking functions (trackLogin, trackSignUp, etc.)
- [ ] Add debug logging when events are blocked
- [ ] Ensure dataLayer exists before pushing events

**Files to Modify:**
- `src/utils/gtm.ts`

---

### Task 3.4: Implement GTM Consent Mode Updates
**Priority:** Critical  
**Dependencies:** Task 2.2, Task 3.2  
**Estimated Time:** 30 minutes

- [ ] Add `updateGTMConsent()` function to `src/lib/gtmConsent.ts`
- [ ] Implement consent update on Accept All (granted for analytics & marketing)
- [ ] Implement consent update on Reject All (denied for analytics & marketing)
- [ ] Implement consent update on Custom Preferences (granular)
- [ ] Call updates from consent hook when consent changes
- [ ] Handle case when GTM not loaded yet (queue updates)

**Files to Modify:**
- `src/lib/gtmConsent.ts`
- `src/hooks/useCookieConsent.ts`

---

### Task 3.5: Implement Script Loading on Consent
**Priority:** Critical  
**Dependencies:** Task 2.2, Task 3.2  
**Estimated Time:** 45 minutes

- [ ] Add useEffect in `useCookieConsent` hook
- [ ] Load GTM when analytics consent granted
- [ ] Load other analytics scripts when consent granted
- [ ] Load marketing scripts when marketing consent granted
- [ ] Handle script removal when consent withdrawn
- [ ] Clear cookies and localStorage when consent withdrawn
- [ ] Prevent duplicate script loading

**Files to Modify:**
- `src/hooks/useCookieConsent.ts`

---

## Phase 4: Backend Integration

### Task 4.1: Create Consent Logging Service
**Priority:** High  
**Dependencies:** Task 1.1, Task 2.1  
**Estimated Time:** 1 hour

- [ ] Create `src/lib/consentLogger.ts`
- [ ] Implement `logConsentToDatabase()` function
- [ ] Use Supabase client to insert consent record
- [ ] Include: timestamp, version, categories, sessionId, userAgent, language, userId
- [ ] Handle errors gracefully (log but don't block UI)
- [ ] Add retry logic for failed requests
- [ ] Return success/failure status

**Files to Create:**
- `src/lib/consentLogger.ts`

---

### Task 4.2: Integrate Database Logging into Hook
**Priority:** High  
**Dependencies:** Task 4.1, Task 2.2  
**Estimated Time:** 30 minutes

- [ ] Call `logConsentToDatabase()` from consent hook
- [ ] Log on Accept All, Reject All, and Custom Preferences
- [ ] Log consent changes (withdrawal)
- [ ] Don't block UI if logging fails
- [ ] Add user ID if authenticated (from AuthContext)

**Files to Modify:**
- `src/hooks/useCookieConsent.ts`

---

## Phase 5: UI Components - Translation Files

### Task 5.1: Create Translation Files
**Priority:** Critical  
**Dependencies:** None  
**Estimated Time:** 30 minutes

- [ ] Create `public/locales/tr/cookie.json`
- [ ] Add banner translations (title, description, buttons, links)
- [ ] Add preferences modal translations
- [ ] Add KVKK-specific text: "Açık rızanız olmadan çerezler kullanılmayacaktır"
- [ ] Create `public/locales/en/cookie.json`
- [ ] Add English translations (same structure)
- [ ] Verify translation keys match component usage

**Files to Create:**
- `public/locales/tr/cookie.json`
- `public/locales/en/cookie.json`

**Files to Modify:**
- `src/i18n.ts` (already updated, verify namespace included)

---

## Phase 6: UI Components - Banner

### Task 6.1: Create Cookie Banner Component
**Priority:** Critical  
**Dependencies:** Task 2.2, Task 5.1  
**Estimated Time:** 2 hours

- [ ] Create `src/components/ui/cookie-notice.tsx` (already exists, verify)
- [ ] Use `useCookieConsent` hook
- [ ] Use `useTranslation('cookie')` for i18n
- [ ] Display banner only when `showBanner === true`
- [ ] Add Accept All button (blue-600, size="lg")
- [ ] Add Reject All button (outline variant, size="lg", equal styling)
- [ ] Add "Manage Preferences" link
- [ ] Add links: Cookie Policy, Privacy Policy, KVKK Aydınlatma Metni (TR only)
- [ ] Display KVKK notice text prominently (TR only)
- [ ] Position: fixed bottom-center, responsive
- [ ] Use brand colors (blue-600 primary)
- [ ] Add Cookie icon from lucide-react
- [ ] Handle Accept/Reject clicks (hide banner, update consent)

**Files to Verify/Create:**
- `src/components/ui/cookie-notice.tsx`

---

### Task 6.2: Create Cookie Preferences Modal Component
**Priority:** Critical  
**Dependencies:** Task 6.1, Task 2.2  
**Estimated Time:** 2 hours

- [ ] Create `src/components/ui/cookie-preferences.tsx`
- [ ] Use Dialog component from shadcn/ui
- [ ] Display Essential cookies (always active, no toggle)
- [ ] Display Analytics cookies (toggle, shows current state)
- [ ] Display Marketing cookies (toggle, shows current state)
- [ ] Add Save Preferences button
- [ ] Add Cancel button
- [ ] Show current consent state in toggles
- [ ] Update consent on Save
- [ ] Close modal after save
- [ ] Use translations from cookie.json
- [ ] Match brand styling

**Files to Create:**
- `src/components/ui/cookie-preferences.tsx`

**Files to Modify:**
- `src/components/ui/cookie-notice.tsx` (integrate preferences modal)

---

### Task 6.3: Create Footer Cookie Settings Link Component
**Priority:** Medium  
**Dependencies:** Task 6.2  
**Estimated Time:** 30 minutes

- [ ] Create `src/components/ui/cookie-settings-link.tsx`
- [ ] Simple link/button component
- [ ] Opens preferences modal on click
- [ ] Use translation: "Cookie Settings" / "Çerez Ayarları"
- [ ] Match footer link styling (blue-600)
- [ ] Add to landing footer and app footer

**Files to Create:**
- `src/components/ui/cookie-settings-link.tsx`

**Files to Modify:**
- `src/components/landing/LandingFooter.tsx`
- `src/components/layout/MainLayout.tsx` (if footer exists)

---

## Phase 7: App Integration

### Task 7.1: Integrate Cookie Banner into App
**Priority:** Critical  
**Dependencies:** Task 6.1, Task 2.3  
**Estimated Time:** 30 minutes

- [ ] Import CookieNotice component in `App.tsx`
- [ ] Add `<CookieNotice />` to App component (outside routes)
- [ ] Ensure GTM Consent Mode initialized before banner renders
- [ ] Test banner appears on first visit
- [ ] Test banner doesn't appear after consent

**Files to Modify:**
- `src/App.tsx`
- `src/main.tsx` (GTM consent mode init)

---

### Task 7.2: Integrate Footer Links
**Priority:** Medium  
**Dependencies:** Task 6.3  
**Estimated Time:** 30 minutes

- [ ] Add Cookie Settings link to landing footer
- [ ] Add Cookie Settings link to app footer (if exists)
- [ ] Verify links open preferences modal
- [ ] Test on both TR and EN versions

**Files to Modify:**
- `src/components/landing/LandingFooter.tsx`
- Footer components (if any)

---

## Phase 8: Consent Withdrawal & Cleanup

### Task 8.1: Implement Consent Withdrawal Logic
**Priority:** Critical  
**Dependencies:** Task 3.2, Task 3.4  
**Estimated Time:** 1 hour

- [ ] Add `withdrawConsent()` function to consent hook
- [ ] Remove all scripts with `data-cookie-category` attribute
- [ ] Clear analytics cookies (`_ga`, `_gid`, `_gtm`, etc.)
- [ ] Clear marketing cookies (`_fbp`, etc.)
- [ ] Clear localStorage analytics data
- [ ] Update GTM Consent Mode to 'denied'
- [ ] Update consent state
- [ ] Log withdrawal to database
- [ ] Show confirmation message

**Files to Modify:**
- `src/hooks/useCookieConsent.ts`
- `src/lib/scriptLoader.ts`

---

## Phase 9: Testing & Validation

### Task 9.1: Functional Testing
**Priority:** High  
**Dependencies:** All previous tasks  
**Estimated Time:** 2 hours

- [ ] Test banner appears on first visit
- [ ] Test banner doesn't appear after consent
- [ ] Test Accept All enables all categories
- [ ] Test Reject All disables optional categories
- [ ] Test Custom preferences save correctly
- [ ] Test scripts load ONLY after consent
- [ ] Test scripts do NOT load if rejected
- [ ] Test GTM does NOT load from index.html
- [ ] Test GTM loads dynamically after analytics consent
- [ ] Test GTM Consent Mode v2 default state is 'denied'
- [ ] Test GTM consent updates correctly on Accept/Reject
- [ ] Test GTM events blocked when consent withdrawn
- [ ] Test Cookie Settings reopens preferences
- [ ] Test preferences persist across sessions
- [ ] Test language switches correctly

**Test Checklist:**
- Use browser DevTools to verify script loading
- Check localStorage for consent data
- Verify database logs are created
- Test on incognito mode

---

### Task 9.2: Compliance Testing
**Priority:** High  
**Dependencies:** All previous tasks  
**Estimated Time:** 1 hour

- [ ] Verify buttons are visually equal (same size, same prominence)
- [ ] Verify no pre-checked boxes (except Essential)
- [ ] Verify scrolling does NOT trigger consent
- [ ] Verify timeout does NOT trigger consent
- [ ] Verify consent logged to database
- [ ] Verify consent record includes timestamp + version
- [ ] Verify GPC signal respected (if browser supports)
- [ ] Verify site works with all cookies rejected
- [ ] Verify Cookie Policy linked correctly
- [ ] Verify KVKK Aydınlatma Metni linked (Turkish)

**Compliance Checklist:**
- No dark patterns detected
- All legal requirements met
- Button equality verified

---

### Task 9.3: Cross-Browser Testing
**Priority:** Medium  
**Dependencies:** All previous tasks  
**Estimated Time:** 1.5 hours

- [ ] Test on Chrome/Edge (Chromium)
- [ ] Test on Firefox
- [ ] Test on Safari (iOS + macOS)
- [ ] Test on mobile browsers (iOS Safari, Chrome Mobile)
- [ ] Verify responsive design on mobile
- [ ] Verify banner doesn't block critical UI
- [ ] Test touch interactions

---

### Task 9.4: Accessibility Testing
**Priority:** High  
**Dependencies:** All previous tasks  
**Estimated Time:** 1 hour

- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test screen reader compatibility (ARIA labels)
- [ ] Verify focus visible on all interactive elements
- [ ] Test color contrast (WCAG AA compliance)
- [ ] Verify banner is accessible via keyboard
- [ ] Test modal accessibility (focus trap, escape to close)

---

## Phase 10: Documentation & Polish

### Task 10.1: Create Implementation README
**Priority:** Medium  
**Dependencies:** All implementation tasks  
**Estimated Time:** 1 hour

- [ ] Create `docs/COOKIE_CONSENT_README.md`
- [ ] Document setup instructions
- [ ] Document configuration options
- [ ] Document API/hook usage
- [ ] Document script loading patterns
- [ ] Add troubleshooting section
- [ ] Add FAQ section

**Files to Create:**
- `docs/COOKIE_CONSENT_README.md`

---

### Task 10.2: Update Cookie Policy Pages
**Priority:** Medium  
**Dependencies:** Task 1.2  
**Estimated Time:** 30 minutes

- [ ] Review `public/legal/cookie-policy-tr.html`
- [ ] Review `public/legal/cookie-policy-en.html`
- [ ] Update cookie list with actual cookies from config
- [ ] Add GTM cookies to policy
- [ ] Verify all cookies listed match implementation
- [ ] Update last modified date

**Files to Modify:**
- `public/legal/cookie-policy-tr.html`
- `public/legal/cookie-policy-en.html`

---

### Task 10.3: Code Review & Refactoring
**Priority:** Medium  
**Dependencies:** All implementation tasks  
**Estimated Time:** 1 hour

- [ ] Review all TypeScript types
- [ ] Verify no hardcoded strings (all i18n)
- [ ] Check error handling
- [ ] Verify no console.logs in production code
- [ ] Optimize bundle size
- [ ] Remove unused imports
- [ ] Add JSDoc comments where needed

---

## Phase 11: Edge Cases & Error Handling

### Task 11.1: Handle Edge Cases
**Priority:** Medium  
**Dependencies:** All previous tasks  
**Estimated Time:** 1 hour

- [ ] Handle localStorage disabled/blocked
- [ ] Handle incognito mode restrictions
- [ ] Handle ad blockers blocking scripts
- [ ] Handle VPN users (geolocation)
- [ ] Handle users with JavaScript disabled
- [ ] Handle consent version changes
- [ ] Handle database logging failures gracefully

**Files to Modify:**
- `src/lib/cookieConsent.ts`
- `src/lib/consentLogger.ts`
- `src/hooks/useCookieConsent.ts`

---

### Task 11.2: Add Error Boundaries
**Priority:** Low  
**Dependencies:** All previous tasks  
**Estimated Time:** 30 minutes

- [ ] Wrap cookie components in error boundary
- [ ] Handle consent hook errors gracefully
- [ ] Show fallback UI if consent system fails
- [ ] Log errors for debugging

**Files to Modify:**
- `src/components/ui/cookie-notice.tsx`
- `src/components/common/ErrorBoundary.tsx` (if needed)

---

## Phase 12: Performance Optimization

### Task 12.1: Optimize Bundle Size
**Priority:** Low  
**Dependencies:** All previous tasks  
**Estimated Time:** 30 minutes

- [ ] Verify bundle size < 5KB gzipped
- [ ] Lazy load consent components
- [ ] Remove unused dependencies
- [ ] Optimize translation loading
- [ ] Code split if needed

---

### Task 12.2: Performance Testing
**Priority:** Low  
**Dependencies:** All previous tasks  
**Estimated Time:** 30 minutes

- [ ] Test initial page load time
- [ ] Test consent banner render time
- [ ] Test script loading performance
- [ ] Verify no performance regressions

---

## Task Dependency Graph

```
Phase 1 (Foundation)
├── 1.1 Database Migration
├── 1.2 Cookie Config
└── 1.3 Types & Interfaces

Phase 2 (Core Logic)
├── 2.1 Storage Utilities (depends: 1.3)
├── 2.2 Consent Hook (depends: 2.1)
└── 2.3 GTM Consent Mode Init (depends: 2.2)

Phase 3 (Scripts)
├── 3.1 Remove GTM from HTML
├── 3.2 Script Loader (depends: 2.1)
├── 3.3 Update GTM Utils (depends: 2.1, 3.2)
├── 3.4 GTM Consent Updates (depends: 2.2, 3.2)
└── 3.5 Script Loading on Consent (depends: 2.2, 3.2)

Phase 4 (Backend)
├── 4.1 Consent Logger (depends: 1.1, 2.1)
└── 4.2 Integrate Logging (depends: 4.1, 2.2)

Phase 5 (Translations)
└── 5.1 Translation Files

Phase 6 (UI Components)
├── 6.1 Cookie Banner (depends: 2.2, 5.1)
├── 6.2 Preferences Modal (depends: 6.1, 2.2)
└── 6.3 Footer Link (depends: 6.2)

Phase 7 (Integration)
├── 7.1 Integrate Banner (depends: 6.1, 2.3)
└── 7.2 Integrate Footer (depends: 6.3)

Phase 8 (Withdrawal)
└── 8.1 Withdrawal Logic (depends: 3.2, 3.4)

Phase 9 (Testing)
├── 9.1 Functional Tests (depends: all)
├── 9.2 Compliance Tests (depends: all)
├── 9.3 Cross-Browser Tests (depends: all)
└── 9.4 Accessibility Tests (depends: all)

Phase 10 (Documentation)
├── 10.1 README (depends: all)
├── 10.2 Update Policies (depends: 1.2)
└── 10.3 Code Review (depends: all)

Phase 11 (Edge Cases)
├── 11.1 Edge Cases (depends: all)
└── 11.2 Error Boundaries (depends: all)

Phase 12 (Performance)
├── 12.1 Bundle Optimization (depends: all)
└── 12.2 Performance Tests (depends: all)
```

---

## Critical Path

**Must complete in order:**
1. Task 1.1 → 1.2 → 1.3 (Foundation)
2. Task 2.1 → 2.2 → 2.3 (Core Logic)
3. Task 3.1 (Remove GTM immediately - legal requirement)
4. Task 3.2 → 3.3 → 3.4 → 3.5 (Script Management)
5. Task 5.1 (Translations)
6. Task 6.1 → 6.2 → 6.3 (UI Components)
7. Task 7.1 (App Integration)
8. Task 9.1 → 9.2 (Testing)

**Can be done in parallel:**
- Task 4.1 & 4.2 (Backend) can run parallel with UI development
- Task 10.1 & 10.2 (Documentation) can run parallel with testing
- Task 11.1 & 11.2 (Edge Cases) can run parallel with testing

---

## Estimated Timeline

**Week 1:**
- Phase 1: Foundation (Day 1-2)
- Phase 2: Core Logic (Day 2-3)
- Phase 3: Script Management (Day 3-4)
- Phase 4: Backend Integration (Day 4-5)

**Week 2:**
- Phase 5: Translations (Day 1)
- Phase 6: UI Components (Day 1-3)
- Phase 7: App Integration (Day 3-4)
- Phase 8: Withdrawal Logic (Day 4-5)

**Week 3:**
- Phase 9: Testing (Day 1-3)
- Phase 10: Documentation (Day 3-4)
- Phase 11: Edge Cases (Day 4-5)

**Week 4:**
- Phase 12: Performance (Day 1-2)
- Final review & deployment (Day 3-4)
- Buffer for issues (Day 5)

---

## Notes

- **GTM Removal (Task 3.1)** should be done FIRST to avoid GDPR/KVKK violations
- **Database Migration (Task 1.1)** should be done early to allow backend development
- **Translations (Task 5.1)** should be done before UI components
- All tasks marked "Critical" must be completed before production deployment
- Testing should be done incrementally, not all at the end

---

## Success Criteria

- ✅ All 45 tasks completed
- ✅ Zero linter errors
- ✅ All tests passing
- ✅ Compliance verified
- ✅ Performance targets met (< 5KB gzipped)
- ✅ Documentation complete

