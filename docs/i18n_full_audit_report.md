# i18n & Localization Audit Report

## Scope & Approach
- Reviewed all UI modules under `src/features/**`, `src/components/**`, root composition (`src/App.tsx`, `src/main.tsx`) and supporting configs (`src/i18n.ts`, `vite.config.ts`).
- Examined translation resources in `src/locales/**` for both `en` and `tr`, and compared key parity.
- Assessed backend-facing layers (`src/services/**`, `src/lib/**`, `supabase/**`) for user-facing error strings.
- Verified language-switcher wiring via `src/components/layout/Navbar.tsx` and `src/contexts/AuthContext.tsx`.
- Confirmed there is no `src/pages` directory; route-level views live in `src/features`.

---

## 1. Frontend Audit

### 1.1 Fully Localized Areas
- `src/features/properties/Properties.tsx:28` and `src/features/properties/PropertyDialog.tsx:29` consume `t()` for labels, toasts, validation, and empty states; all strings map to `properties.*`.
- `src/features/owners/Owners.tsx:13` and `src/features/owners/OwnerDialog.tsx:28` rely entirely on `owners.*` keys for UI copy and feedback.
- `src/features/tenants/Tenants.tsx:19` and `src/features/tenants/TenantDialog.tsx:35` cover list, dialogs, and validation through `tenants.*`, including pluralization.
- `src/components/layout/Sidebar.tsx:43` sources navigation labels, tooltips, and actions from the `navigation` namespace.
- `src/features/contracts/Contracts.tsx:69` and `src/features/contracts/ContractDialog.tsx:79` now route all table copy, dialogs, validation, and toast messaging through the `contracts.*` namespace.

### 1.2 Completely Untranslated Modules
- Tenant onboarding wizards remain English-only:
  - `src/features/tenants/EnhancedTenantDialog.tsx:29`–`315`
  - `src/features/tenants/EnhancedTenantEditDialog.tsx:31`–`326`
  - Step components `src/features/tenants/steps/TenantInfoStep.tsx:20`, `ContractDetailsStep.tsx:31`, `ContractSettingsStep.tsx:38`
- Photo management drawer `src/components/properties/PhotoManagement.tsx:63`–`175` exposes tabs, counts, CTA text, dialogs, and toast feedback in English.

### 1.3 Partially Localized Modules & Components
- **Login screen** `src/features/auth/Login.tsx:84` still ships English placeholders (`"name@example.com"`) and surfaces raw backend errors (`toast.error(error.message)`).
- **Dashboard** `src/features/dashboard/Dashboard.tsx:19` mixes translations with hardcoded strings (`MainLayout title="Dashboard"`, `"Use the navigation menu..."`, badge suffix `"days"`).
- **Layout**:
  - `src/components/layout/MainLayout.tsx:30` demo-mode banner and `sr-only` labels are English.
  - `src/components/layout/Navbar.tsx:69` exposes language names (`"English"`, `"Türkçe"`) and currency codes without translation; no persistence hook to user preferences.
- **Scaffolding** `src/components/templates/ListPageTemplate.tsx:84` ships default fallbacks (`'Search...'`, `'Filter'`, `'Deleting...'`) that bypass i18n. The `'deleting'` key referenced at `src/components/templates/ListPageTemplate.tsx:204` and `src/components/properties/PhotoGallery.tsx:275` is absent in `common.json`, so Turkish users see English.
- **Photo upload** `src/components/properties/PhotoUpload.tsx:43`–`207` shows validator errors, dropzone prompts, and batch controls in English.
- **Photo gallery** `src/components/properties/PhotoGallery.tsx:196` uses `alt="Property photo ${index + 1}"`, leaving accessibility text untranslated.
- **Carousel controls** `src/components/ui/carousel.tsx:190`–`229` use `sr-only` English strings and reference `t('carousel.item')`, yet `common.json` lacks `carousel.item`.
- **APP name & constants** remain English-only (`src/config/constants.ts:1` reuses `"Real Estate CRM"`; status enums surface English when reused outside translated contexts).

### 1.4 Missing Translation Keys / Namespace Mismatches
- Absent keys: `common.deleting`, `common.carousel.item`; both referenced but missing in `src/locales/**/common.json`.
- `i18n` configuration (`src/i18n.ts:12`) registers only `['common','tenants']`. Other namespaces rely on lazy loading; ensure deployments preload required namespaces to avoid flashes of untranslated keys.
- Turkish bundles mirror English keys (Parity pass), but default English fallbacks still leak through when components skip `t()`.

### 1.5 Additional Observations
- No automated guard (lint rule/test) prevents regressions; new hardcoded strings can slip in unnoticed.
- Mixed use of `toast.error(error.message)` means backend English phrasing surfaces even where UI text is localized.

---

## 2. Frontend Error Behavior

| Location | Lines | Message surfaced | Notes |
|----------|-------|------------------|-------|
| `src/features/contracts/Contracts.tsx` | 87,124,129,153-173 | `t('contracts.toasts.*')`, `t('contracts.errors.*')` | ✅ Toast and error channels now use localized keys. |
| `src/features/contracts/ContractDialog.tsx` | 172,353 | `t('contracts.dialog.form.*')` helpers | ✅ Dialog labels, alerts, and validation surfaced through `contracts.*`. |
| `src/features/reminders/Reminders.tsx` | 70-217,441-459 | `t('reminders.toasts.*')`, `t('reminders.actions.markContacted')` | ✅ Tabs, dialogs, and CTAs now fully localized. |
| `src/features/tenants/EnhancedTenantDialog.tsx` | 225-240 | `"Tenant ... created successfully!"`, `"Failed to create tenant and contract"` | Success/error toasts bypass i18n. |
| `src/features/tenants/steps/ContractSettingsStep.tsx` | 38-52 | `alert('Please select a PDF file.')`, `"File size must be less than 10MB."` | Browser alerts only in English. |
| `src/components/properties/PhotoManagement.tsx` | 76-145 | `"Failed to load photos"`, `"photo(s) uploaded successfully"` | Upload feedback is hardcoded English. |
| `src/features/auth/Login.tsx` | 49 | `toast.error(error.message)` | Supabase errors bubble up untranslated. |

All user-facing error states should route through localized keys (e.g., `t('errors.photoUploadFailed')`) to ensure consistent language switching.

---

## 3. Backend Audit

- **Services emitting English errors**:
  - `src/services/photos.service.ts:30` / `:34` / `:67` throw `"Invalid file type..."`, `"File size exceeds 5MB limit."`, `"Photo not found"`; UI surfaces these via `error.message`.
  - `src/services/tenants.service.ts:116-143` raise validation errors (`"Tenant name is required"`, `"Property selection is required"`, `"Invalid email format"`), and downstream flows display them verbatim (`EnhancedTenantDialog`, `EnhancedTenantEditDialog`).
  - `src/services/tenants.service.ts:187` / `:212` throw `"Invalid response from database..."` and `"PDF upload failed..."`, potentially shown to end users.
- **Developer-only logs**: `console.warn` / `console.error` in services remain English; acceptable if not exposed to UI.
- No evidence of localized payloads or structured error codes. To support multi-language responses, services should map errors to codes that the frontend resolves to `t()` keys, rather than free-form English strings.

---

## 4. Language Switcher Review

- Implementation: `src/components/layout/Navbar.tsx:64` renders a dropdown calling `i18n.changeLanguage(lng)`. LanguageDetector + `i18next-http-backend` (`src/i18n.ts:6-21`) manage persistence (localStorage) and remote loading (files copied to `/locales` via `vite.config.ts:6`).
- Gaps:
  - No hook to user preferences: `Navbar` never calls `useAuth().setLanguage`; `AuthContext` stores language but nothing syncs `language` back into `i18n` on load, so server-side preference is ignored.
  - Labels for `"English"` / `"Türkçe"` (`src/components/layout/Navbar.tsx:69`) are hardcoded; they should come from `navigation.language.english` etc.
  - Menu does not indicate current selection; no ARIA feedback or check mark.
  - Currency switcher shares the dropdown but also lacks localization.
  - `debug: true` in `src/i18n.ts:11` should be disabled for production to avoid noisy console output.
- Behavior expectations: With current setup, language persists between refreshes via localStorage, but cross-device persistence depends on wiring `setLanguage`/`language` from `AuthContext` back into i18next.

---

## 5. i18n Coverage Table

| File | i18n Integrated | Hardcoded Strings | Language(s) Detected | Status |
|------|-----------------|-------------------|----------------------|--------|
| `src/features/auth/Login.tsx` | ⚠️ Partial | ~3 en placeholders/raw errors | en,tr | Needs placeholders + error mapping |
| `src/features/contracts/Contracts.tsx` | ✅ Yes | 0 | en,tr | Fully translated |
| `src/features/contracts/ContractDialog.tsx` | ✅ Yes | 0 | en,tr | Fully translated |
| `src/features/dashboard/Dashboard.tsx` | ⚠️ Partial | ~6 en (title, CTA, badge suffix) | en,tr | Mixed copy |
| `src/features/properties/Properties.tsx` | ✅ Yes | 0 | en,tr | Fully translated |
| `src/features/properties/PropertyDialog.tsx` | ✅ Yes | 0 | en,tr | Fully translated |
| `src/features/owners/Owners.tsx` | ✅ Yes | 0 | en,tr | Fully translated |
| `src/features/owners/OwnerDialog.tsx` | ✅ Yes | 0 | en,tr | Fully translated |
| `src/features/tenants/Tenants.tsx` | ✅ Yes | 0 | en,tr | Fully translated |
| `src/features/tenants/TenantDialog.tsx` | ✅ Yes | 0 | en,tr | Fully translated |
| `src/features/tenants/EnhancedTenantDialog.tsx` | 🟥 No | ~70 en (wizard steps, toasts) | en | Hardcoded |
| `src/features/tenants/EnhancedTenantEditDialog.tsx` | 🟥 No | ~80 en | en | Hardcoded |
| `src/features/tenants/steps/TenantInfoStep.tsx` | 🟥 No | ~15 en | en | Hardcoded |
| `src/features/tenants/steps/ContractDetailsStep.tsx` | 🟥 No | ~20 en | en | Hardcoded |
| `src/features/tenants/steps/ContractSettingsStep.tsx` | 🟥 No | ~25 en + alerts | en | Hardcoded |
| `src/features/reminders/Reminders.tsx` | ✅ Yes | 0 | en,tr | Fully translated |
| `src/components/layout/MainLayout.tsx` | ⚠️ Partial | Demo banner, sr-only en | en | Needs localization |
| `src/components/layout/Navbar.tsx` | ⚠️ Partial | Language labels en, no persistence | en | Needs localization |
| `src/components/layout/Sidebar.tsx` | ✅ Yes | 0 | en,tr | Fully translated |
| `src/components/templates/ListPageTemplate.tsx` | ⚠️ Partial | `'Search...'`, `'Filter'`, missing `deleting` | en | Fallbacks bypass i18n |
| `src/components/properties/PhotoManagement.tsx` | 🟥 No | ~25 en (tabs, toasts) | en | Hardcoded |
| `src/components/properties/PhotoUpload.tsx` | ⚠️ Partial | ~15 en (validation, dropzone) | en | Needs localization |
| `src/components/properties/PhotoGallery.tsx` | ⚠️ Partial | alt text en | en,tr | Mostly translated, fix alt |
| `src/components/ui/carousel.tsx` | ⚠️ Partial | sr-only en, missing key | en | Accessibility strings unlocalized |
| `src/config/constants.ts` | ⚠️ Partial | App name + status literals | en | Brand OK, statuses reused elsewhere |

Totals (user-facing subset = 25 files): Fully translated 10 (40%), Partial 9 (36%), Not localized 6 (24%).

---

## 6. ✅ Completed Tasks

- 2025-11-02 — Contracts module fully internationalized (titles, dialogs, validations, toasts).
- 2025-11-02 — Reminders module fully localized (tabs, dialogs, toasts, validations).

## 7. Summary & Next Steps

- **📈 Coverage**: 40% of reviewed user-facing files are fully localized; the remaining 60% still leak English copy.
- **🚨 Hardcoded text**: Concentrated in tenant onboarding (`src/features/tenants/EnhancedTenantDialog.tsx` + steps) and photo management (`src/components/properties/PhotoManagement.tsx`, `PhotoUpload.tsx`).
- **🌐 Language switcher**: Runtime switching works via i18next, but labels remain English and backend preference sync is missing—users lose chosen language across devices.
- **⚙️ Backend consistency**: Service-layer errors (`src/services/photos.service.ts:30`, `src/services/tenants.service.ts:116`) emit English; UI forwards these verbatim, undermining localization.
- **🧩 Actionable To-Do List**:
  1. Externalize all strings in tenant onboarding flows into dedicated namespaces; wire zod schemas and toast messages to `t()` keys.
  2. Localize shared scaffolding (ListPageTemplate defaults, MainLayout banner, Navbar dropdown labels, photo upload/galleries) and add missing keys (`common.deleting`, `common.carousel.item`).
  3. Update photo upload validation to use translated error IDs and pass backend errors through a localization map before displaying.
  4. Connect `useAuth().setLanguage` to the language switcher, and hydrate `i18n` from stored preference during AuthProvider initialization.
  5. Introduce lint/tests (e.g., eslint-plugin-i18next or a custom AST check) to block new hardcoded UI strings and verify translation parity.
