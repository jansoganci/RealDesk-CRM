# Remaining Gaps Analysis

Date: 2026-05-10
Scope: Full audit request (docs + codebase + required commands)

## 1) Sprint completeness in `docs/sprint-audits.md`

Checked sprint headings and status markers in `docs/sprint-audits.md`.

- Present and marked complete: Sprint 1, 2, 3, 4, 5, 6A, 6B
- Not present / not marked complete:
  - Sprint 7
  - Sprint 8

Conclusion: **Not all sprints (1-6B + 7 + 8) are marked complete in the audit doc.**

## 2) Planned deliverables not fully implemented (plans vs codebase)

Cross-referenced `docs/plans/*` and `docs/sprint-audits.md` against current files/routes/services.

### Implemented (verified)

- Feature folders exist:
  - `src/features/screening/`
  - `src/features/deposit-tracker/`
  - `src/features/compliance/`
- Services exist and are exported via `src/lib/serviceProxy.ts`:
  - `applicantScreeningService`
  - `depositTrackerService`
  - `ccpaService`
- Routes exist in `src/App.tsx`:
  - `ROUTES.SCREENING`
  - `ROUTES.DEPOSIT_TRACKER`
  - `ROUTES.CCPA` (public)
  - `ROUTES.CCPA_DASHBOARD` (protected)
- Sidebar nav entries exist in `src/components/layout/Sidebar.tsx`:
  - screening
  - deposits
  - compliance
- Locales exist:
  - `public/locales/en/screening.json`
  - `public/locales/en/deposit-tracker.json`
  - `public/locales/en/compliance.json`
- Migrations exist:
  - `0036_add_applicant_screening.sql`
  - `0037_add_security_deposit_tracker.sql`
  - `0038_add_ccpa_data_subject_requests.sql`

### Remaining gaps found

1. **Sprint 7 plan item not fully reflected in UI links**
   - Plan asks to add/update links to the public CCPA page (`/privacy`) from existing areas.
   - Current code still points to legal HTML privacy documents in key places:
     - `src/features/auth/Register.tsx`
     - `src/features/profile/components/LegalDocumentsCard.tsx`
     - `src/components/landing/LandingFooter.tsx`
     - `src/components/ui/cookie-notice.tsx`
   - Gap: CCPA page route exists, but these user-facing entry points are not consistently routing to `/privacy`.

2. **Deferred items from prior sprint audit still appear unresolved**
   - `docs/sprint-audits.md` already marks some items deferred.
   - Current code still includes profile currency options beyond USD (`TRY`, `EUR`) in:
     - `src/features/profile/profileSchema.ts`
     - `src/features/profile/schemas/editProfileInfoSchema.ts`
     - `src/features/profile/components/PreferencesSection.tsx`
     - `src/features/profile/components/EditProfileInfoDialog.tsx`
   - Lease PDF full clause-language output remains documented as deferred in plan/audit context.

## 3) Command results

### `npm run typecheck`
- Result: **PASS**
- Exit code: 0

### `npm run build`
- Result: **PASS**
- Exit code: 0
- Notes:
  - Browserslist data outdated warning
  - Vite chunk-size and mixed dynamic/static import warnings
  - Build artifact generated successfully

### `npm run check:translations`
- Result: **PASS**
- Exit code: 0
- Total issues: 0

### `npm run lint`
- Result: **FAIL**
- Exit code: 1
- Summary: **256 problems (196 errors, 60 warnings)**

## 4) `console.log` count in `src/features/`

Count result: **4**

All 4 are in:
- `src/features/billing/components/PricingSection.tsx`

## 5) `APP_NAME` check

In `src/config/constants.ts`:
- `export const APP_NAME = 'RealDesk';`

Result: **Yes, APP_NAME is `RealDesk`.**

## 6) Feature existence + route/nav check

### Applicant screening
- Feature folder: present
- Route: present (`ROUTES.SCREENING`)
- Sidebar nav: present

### Security deposit tracker
- Feature folder: present
- Route: present (`ROUTES.DEPOSIT_TRACKER`)
- Sidebar nav: present

### CCPA compliance
- Feature folder: present
- Routes: present (`ROUTES.CCPA`, `ROUTES.CCPA_DASHBOARD`)
- Sidebar nav: present (dashboard route)

## Final verdict

**Project is not launch-ready yet.**

Primary blockers:

1. `npm run lint` failing with 196 errors (quality gate not green)
2. Sprint 7 and Sprint 8 are not marked complete in `docs/sprint-audits.md`
3. Some Sprint 7 CCPA link-integration plan items are not consistently wired to `/privacy`
4. Deferred audit items still visible in current code (e.g., non-USD profile currency options)

If launch criteria require only type/build/translation gates, the app passes those three checks; however, with lint and documented sprint/audit completeness considered, it is not fully launch-ready.

