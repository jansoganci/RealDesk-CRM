# Console Log & Error Handling Audit

## 🎯 Purpose
This document serves as a living audit record for the console output and error-handling patterns within the application. The goal is to ensure a high-signal, low-noise environment that improves developer experience (DX) and maintains production stability.

## 🛠️ Audit Philosophy (DEV vs PROD)

### Development (DEV)
- **High Signal:** Logs should clearly trace the "life of a request" (Auth -> Data Fetch -> UI Render).
- **Cleanliness:** Remove redundant "here", "test", or "data: { ... }" logs that clutter the console.
- **Traceability:** Logs should be prefixed with the module name (e.g., `[Auth]`, `[Finance]`).

### Production (PROD)
- **Silence by Default:** The console should be empty during normal operation.
- **Critical Only:** Only non-recoverable errors or security-related warnings should persist.
- **No Sensitive Data:** Never log PII (Personal Identifiable Information), tokens, or raw request bodies.

## 🚥 Log Level Definitions

| Level | Usage | Production Behavior |
| :--- | :--- | :--- |
| **DEBUG** | Detailed flow tracing, state transitions, raw data checks. | **Stripped/Hidden** |
| **INFO** | Significant lifecycle events (e.g., "App Initialized"). | **Visible (Minimal)** |
| **WARN** | Recoverable issues, unexpected but handled edge cases. | **Visible** |
| **ERROR** | Critical failures, RLS violations, API crashes. | **Visible & Alerting** |

## ⚡ Supabase & API Specific Rules

### 1. Expected "Empty" Results (406 / 404 / Empty Array)
- **Classification:** Logical State (not a Bug).
- **Handling:** Catch in the service/hook layer. Return `null` or `[]` to the UI.
- **Logging:** 
  - Silent in PROD.
  - `DEBUG` level in DEV if the empty state is critical to the view logic.

### 2. PostgREST/Auth Errors
- **Handled Errors:** If a user is redirected because of an error, do not log a red `console.error`.
- **Unhandled Errors:** Log as `ERROR` with context (e.g., `[Supabase] Update failed: {message}`).

---

## 📋 Individual Screen Audit Template
*Use this template for each screen audited.*

### [Screen Name]
- **File Path:** `path/to/file.tsx`
- **Current Noise Level:** [None / Low / Medium / High]
- **Findings:**
  - [ ] Finding 1
  - [ ] Finding 2
- **Action Items:**
  - [ ] Fix A
  - [ ] Remove B
- **Status:** [Pending / In Progress / Completed]

---

## 🏁 Progress Tracker
- [x] Auth Module
- [x] Public/Landing Module
- [x] Portfolio Module
- [x] Operations Module
- [x] Business/Settings Module

---

## Auth Module Audit

### Auth Context (Core Infrastructure)
- **File Path:** `src/contexts/AuthContext.tsx`
- **Current Noise Level:** High
- **Findings:**
  - [ ] **Noisy Tracing:** Multiple `console.log` calls (🔍, ✅, 🔄) during every initialization and state change.
  - [ ] **PII Leaks:** `getUser()` result log includes raw email and user ID.
  - [ ] **Redundant Checks:** Multiple confirmation logs for the same state.
- **Action Items:**
  - [ ] Wrap all `🔍`, `✅`, `🔄` tracing logs in `import.meta.env.DEV` or remove them.
  - [ ] Sanitize `getUser()` log to hide user email in production.
- **Status:** Completed

### Login
- **File Path:** `src/features/auth/Login.tsx`
- **Current Noise Level:** None
- **Findings:**
  - [ ] **Clean Implementation:** No explicit `console.log` calls in the component itself.
  - [ ] **Silent Retry Logic:** The session confirmation loop is silent as per standards.
- **Action Items:** None.
- **Status:** Completed

### Register
- **File Path:** `src/features/auth/Register.tsx`
- **Current Noise Level:** None
- **Findings:**
  - [ ] **Clean Implementation:** Error handling uses `toast` exclusively.
- **Action Items:** None.
- **Status:** Completed

### Forgot Password
- **File Path:** `src/features/auth/ForgotPassword.tsx`
- **Current Noise Level:** None
- **Findings:**
  - [ ] **Clean Implementation:** Errors are handled via UI state and toasts.
- **Action Items:** None.
- **Status:** Completed

### Reset Password
- **File Path:** `src/features/auth/ResetPassword.tsx`
- **Current Noise Level:** None
- **Findings:**
  - [ ] **Clean Implementation:** Similar to Forgot Password, uses local state for error display.
- **Action Items:** None.
- **Status:** Completed

### Email Confirmation
- **File Path:** `src/features/auth/EmailConfirmation.tsx`
- **Current Noise Level:** Low
- **Findings:**
  - [ ] **PROD Error:** `console.error` at line 67 for check failures.
- **Action Items:**
  - [ ] Prefix the `console.error` with `[Auth]`.
- **Status:** Completed

### Email Changed
- **File Path:** `src/features/auth/EmailChanged.tsx`
- **Current Noise Level:** None
- **Findings:**
  - [ ] **OK:** Purely presentational component.
- **Action Items:** None.
- **Status:** Completed

---

## Portfolio Module Audit

### Properties
- **File Path:** `src/features/properties/Properties.tsx` & `src/features/properties/hooks/usePropertyActions.ts`
- **Current Noise Level:** Low
- **Findings:**
  - [ ] **Supabase Empty States:** Correctly handled. Empty results return `[]`, which triggers the `<ListPageTemplate>` empty state UI. No console noise for empty lists.
  - [ ] **Error Catching:** Naked `console.error(error)` used in `loadProperties` and throughout `usePropertyActions.ts` hooks.
- **Action Items:**
  - [ ] Prefix `console.error` calls with `[Properties]` or `[PropertyActions]` for better traceability.
- **Status:** Completed

### Owners
- **File Path:** `src/features/owners/Owners.tsx`
- **Current Noise Level:** Low
- **Findings:**
  - [ ] **Supabase Empty States:** Correctly handled. Service returns empty array, UI displays "No owners yet".
  - [ ] **Error Catching:** Naked `console.error(error)` in `loadOwners`, `handleDeleteConfirm`, and `handleSubmit`.
- **Action Items:**
  - [ ] Prefix `console.error` with `[Owners]`.
- **Status:** Completed

### Tenants
- **File Path:** `src/features/tenants/Tenants.tsx` & `src/features/tenants/hooks/useTenantsData.ts`
- **Current Noise Level:** Low
- **Findings:**
  - [ ] **Supabase Empty States:** Correctly handled via empty array return.
  - [ ] **Tracing:** `console.error('Failed to load tenants:', error)` in `useTenantsData.ts` is descriptive but inconsistent with the rest of the app's naked logs.
- **Action Items:**
  - [ ] Standardize the error log prefix to `[Tenants]`.
- **Status:** Completed

---

## Operations Module Audit

### Contracts
- **File Path:** `src/features/contracts/Contracts.tsx` & `src/features/contracts/hooks/useContractsData.ts`
- **Current Noise Level:** Low
- **Findings:**
  - [ ] **Empty States:** Handled via `ListPageTemplate` and `ContractImportBanner`. No console noise for empty lists.
  - [ ] **Error Catching:** `console.error(error)` in `useContractsData.ts` (line 34).
  - [ ] **Recoverable Warnings:** `console.warn('Failed to delete PDF:', error)` in `useContractsActions.ts` (line 55). This is correctly categorized as a warning since the main operation (contract deletion) continues.
- **Action Items:**
  - [ ] Prefix logs with `[Contracts]`.
- **Status:** Completed

### Contract Import (AI/Extraction)
- **File Path:** `src/features/contracts/import/hooks/useContractImport.ts`
- **Current Noise Level:** Medium (during active import)
- **Findings:**
  - [ ] **High Sensitivity:** Contains multiple `console.error` for text extraction and PDF uploads.
  - [ ] **Multi-step Feedback:** Uses state for progress tracking (`progress`, `status`), which is excellent DX.
- **Action Items:**
  - [ ] Prefix logs with `[ContractImport]`.
  - [ ] Ensure "PDF upload failed" remains a `WARN` in PROD as it's non-blocking.
- **Status:** Completed

### Calendar
- **File Path:** `src/features/calendar/CalendarPage.tsx`
- **Current Noise Level:** Low
- **Findings:**
  - [ ] **Error Catching:** `console.error('Failed to fetch meetings:', error)` (line 120).
- **Action Items:**
  - [ ] Standardize prefix to `[Calendar]`.
- **Status:** Completed

### Reminders & Inquiries
- **File Path:** `src/features/reminders/Reminders.tsx`, `src/features/inquiries/Inquiries.tsx`
- **Current Noise Level:** None
- **Findings:**
  - [ ] **UI-First Error Handling:** Both modules use structured error keys and empty state components. Very clean.
- **Action Items:** None.
- **Status:** Completed

---

## Business & Settings Module Audit

### Dashboard
- **File Path:** `src/features/dashboard/Dashboard.tsx` & `src/features/dashboard/hooks/useExchangeRates.ts`
- **Current Noise Level:** Low
- **Findings:**
  - [ ] **Initialization Noise:** `console.error` for exchange rate refresh failures (line 39 of hook).
- **Action Items:**
  - [ ] Prefix with `[Dashboard]`.
- **Status:** Completed

### Finance
- **File Path:** `src/features/finance/FinanceDashboard.tsx` & `src/features/finance/hooks/useFinanceData.ts`
- **Current Noise Level:** Medium
- **Findings:**
  - [ ] **Inconsistent Tagging:** Some logs are already tagged `[useFinanceData]` (lines 48, 54, 56), while others are naked (lines 75, 88, 110).
  - [ ] **Background Fetching:** Correct use of `console.warn` for rate-check failures (line 54).
- **Action Items:**
  - [ ] Standardize all logs to use `[Finance]` prefix.
- **Status:** Completed

### Profile & Billing
- **File Path:** `src/features/profile/Profile.tsx`, `src/features/billing/BillingSubscribe.tsx`
- **Current Noise Level:** Low
- **Findings:**
  - [ ] **Preference Loading:** `console.error('Failed to load preferences:', error)` (line 61).
  - [ ] **Billing:** Purely UI-based (PricingSection), zero console noise found.
- **Action Items:**
  - [ ] Prefix profile error with `[Profile]`.
- **Status:** Completed

---

## Final Audit Summary

### Overall Noise Level: Low-to-Medium
The application is generally very well-behaved. Most screens are silent during normal operation. The primary sources of "noise" are the Auth context tracing and inconsistent error logging patterns in hooks.

### Top 5 Log Patterns to Remove/Fix Globally
1. **Naked Errors:** `console.error(error)` without prefixes.
2. **Auth Tracing:** Remove `🔍`, `✅`, `🔄` logs from `AuthContext` in production.
3. **PII in Logs:** Stop logging raw `user` objects that contain emails and IDs.
4. **Redundant Logic Tracing:** "Starting initialization...", "getUser() result:".
5. **Inconsistent Naming:** Standardize on `[Module]` prefixes for all persistent logs.

---

## 🔧 Implementation Plan (Phase by Phase)

### Phase 1 – Global Logging Infrastructure [COMPLETED]
**Goal:** Establish a standard way to log across the application that automatically handles environment filtering (DEV vs PROD).

- **Modules to touch:** `src/lib/` (New utility)
- **Changes:**
  - Create a lightweight `Logger` utility.
  - Implement methods: `debug`, `info`, `warn`, `error`.
  - Add automatic prefixing logic (e.g., `[Auth]`).
  - Logic to suppress `debug` and `info` in production builds using `import.meta.env.PROD`.
- **Acceptance Criteria:**
  - [ ] `Logger.debug` does not appear in production console.
  - [ ] All logs are consistently prefixed.
- **Risk Notes:** Minimal. Standard utility creation.

### Phase 2 – AuthContext Silence & Security [COMPLETED]
**Goal:** Eliminate high-frequency tracing and prevent PII leakage in the application's most critical core module.

- **Modules to touch:** `src/contexts/AuthContext.tsx`
- **Changes:**
  - Replace all `console.log` (🔍, ✅, 🔄) with `Logger.debug`.
  - Sanitize the `getUser()` result log to remove raw email/ID before logging.
  - Remove redundant state confirmation logs.
- **Acceptance Criteria:**
  - [ ] Console remains silent during auth initialization in production.
  - [ ] No user emails appear in the console logs.
- **Risk Notes:** Critical path. Must ensure that removing logs doesn't obscure real auth failures.

### Phase 3 – Hook-level Error Standardization [COMPLETED]
**Goal:** Systematically clean up all "naked" console logs across feature hooks and ensure consistent traceability.

- **Modules to touch:** 
  - `src/features/properties/hooks/`
  - `src/features/contracts/hooks/`
  - `src/features/finance/hooks/`
  - `src/features/tenants/hooks/`
- **Changes:**
  - Replace `console.error(error)` with `Logger.error(error, 'ModuleName')`.
  - Standardize error messages to be descriptive yet concise.
  - Ensure background warnings (like PDF deletion failures) use `Logger.warn`.
- **Acceptance Criteria:**
  - [ ] No `console.*` calls remaining in targeted hooks.
  - [ ] All errors are identifiable by their module prefix.
- **Status:** Pending

### Phase 4 – Supabase 406 & Empty-State Alignment [COMPLETED]
**Goal:** Ensure that "expected empty" responses from Supabase are handled silently and don't trigger false-positive error logs.

- **Modules to touch:** `src/lib/serviceProxy.ts` (or individual service files)
- **Changes:**
  - Audit service layer for `.single()` calls that might return 406/404.
  - Ensure these specific error codes return `null` and are logged only at `DEBUG` level.
  - Verify that UI `ListPageTemplate` receives empty arrays correctly without triggering errors.
- **Acceptance Criteria:**
  - [ ] Fetching an empty list or missing optional profile results in a clean console.
- **Risk Notes:** Must distinguish between "row not found" (OK) and "permission denied" (ERROR).

### Phase 5 – Production Verification Pass [COMPLETED]
**Goal:** Final quality assurance to confirm the application is truly "production-silent."

- **Modules to touch:** Entire Workspace (Audit only)
- **Changes:**
  - Run a production build (`npm run build`).
  - Perform a full "smoke test" of the app (Login -> Create Property -> Edit Finance -> Logout).
  - Verify the console is 100% empty during these successful flows.
- **Acceptance Criteria:**
  - [ ] Zero logs/warnings in production console during happy path.
- **Risk Notes:** None.
