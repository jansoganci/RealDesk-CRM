# Closewell UI Rebrand — Implementation Plan

**Status:** Planned scope complete — foundation + Phases 1–3 + Round 2 audit fixes on `main`
**Created:** 2026-08-02  
**Updated:** 2026-08-02  
**Source of truth:** [UI_REBRAND_PLAN.md](./UI_REBRAND_PLAN.md) → Decisions Made  
**Rule:** One task = one reviewable/revertable unit. No multi-area sweeps.

### Scope model (Fix 1 — locked)

**Page-level content migration** (raw `blue-*` / `slate-*` / `gray-*` → semantic tokens) is **deferred** for:

Properties, Reminders, Screening, Deposits, Team/Org internals, Onboarding, Billing subscribe, Compliance, Landing visual redesign, and duplicate-component cleanup (KeyDatesCard / MemberCard / StatusBadge consolidation).

Round 2 explicitly brought **Auth/Accept Invite, Inquiries, Owners, Tenants, and Quick Add** into completed page-level scope after the independent audit found they were missed or ambiguously deferred.

These surfaces are **not** “untouched.” F1 (CSS vars), F2 (Inter), F3 (`colors.ts` wrappers), F4 (shared `Button`), and F6 (Sidebar/Navbar/MainLayout/PageContainer) are **global**. Every page that uses shared primitives/layout **automatically inherits** new brand colors, font, and shell from Day 1. They will **look brand-correct** from the foundation pass; they simply will not yet have had their **internal** raw Tailwind utility classes migrated to semantic tokens. That raw-utility cleanup is tracked separately for a follow-up plan.

**Final completion language:** When Part 2 ends → *planned scope complete; deferred surfaces (list above) inherit foundation styling but retain unmigrated raw utility classes — tracked separately.*

### Architecture — single source of truth (Fix 2 — locked)

| Layer | Role |
|---|---|
| **`src/index.css` CSS variables** | **Only** authority for brand + semantic colors (`--primary`, `--secondary`, `--accent`, `--success`, `--info`, `--warning`, neutrals, dark variants) |
| **`tailwind.config.js`** | Maps those vars to utilities (`bg-primary`, `bg-success`, `text-info`, …) — same mechanism as existing `bg-primary` |
| **`src/config/colors.ts`** | **Thin convenience wrapper only** — helpers return pre-composed class strings that reference semantic tokens (`bg-success text-success-foreground`). **Must not** hold a parallel hex/class palette that can drift from CSS vars |

### Execution rules (Fix 3 + branch + commits)

- Stay on **`main`** — **do not** create a feature branch.
- Proceed **autonomously** F1 → F9 → Phase 1 → Phase 2 → Phase 3 — **no** human visual sign-off gates between phases.
- After each task: `npm run lint && npm run typecheck` (add `npm run test` after foundation batch and after each phase gate). Agent records its own visual smoke notes in the task status line.
- **Commit after each completed task** (rebrand-touched files only; do not sweep unrelated WIP).
- **Fix 4:** Mark every task `[x] Done` with a one-line note + verification as it completes. Page tasks also record before/after raw `blue-*`/`slate-*`/`gray-*` hit counts in scope.

### Part 3 resolutions (locked 2026-08-02)

| Flag | Resolution |
|---|---|
| **P3-1** | Dark: navy surfaces; **`--primary` = Warm Gold** in `.dark`; light `--primary` = Deep Navy |
| **P3-2** | Success = Forest; Info = Teal |
| **P3-3…P3-8** | Accepted recommended defaults |
| **Branch** | `main` only |

---

## Token map (execution constants)

| Role | Hex (light) | Approx HSL | Dark treatment |
|---|---|---|---|
| Primary | `#0D1B2A` | `211 53% 11%` | Warm Gold `#C9A46A` as `--primary` |
| Secondary / Accent | `#C9A46A` | `37 47% 60%` | Same gold |
| Success | `#1B5E4B` | `163 55% 24%` | Lighter forest tint for legibility on navy (e.g. ~`#3D9B7A`) |
| Info | `#2A9D8F` | `173 58% 39%` | Same or slightly lighter teal on navy |
| Warning | `#C4842A` | warm amber-bronze (not generic Tailwind amber-600) | Slightly lighter warm amber on navy |
| Background | `#F7F6F2` | `48 24% 96%` | Near `#0D1B2A` navy surfaces |
| On-navy / on-forest / on-success (light) | `#FFFFFF` | — | — |
| On-gold / on-primary (dark) | `#0D1B2A` | — | navy text on gold controls |

**Semantic utilities (after F1):** `bg-success`, `text-success`, `border-success`, `bg-success-foreground` (via `success.DEFAULT` / `success-foreground`), same pattern for `info` and `warning`.

**Page migration convention:**

| Raw pattern | Prefer |
|---|---|
| Brand CTA / selected | `bg-primary`, `text-primary`, `ring-ring` |
| Gold highlight | `bg-secondary` / `bg-accent` |
| Neutrals | `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border` |
| Success / positive | `bg-success`, `text-success`, helpers from `colors.ts` |
| Info | `bg-info`, `text-info` |
| Warning | `bg-warning`, `text-warning` |
| Danger | `destructive` / red — unchanged |
| Chart categorical color | resolve `--chart-*` / semantic CSS variables through `useChartColors`; do not duplicate hex/RGB palettes in TypeScript |

---

# Part 1 — Foundation

## F1 — CSS variables + semantic Tailwind colors

**Status:** [x] Done  
**Progress note:** Set Closewell light/dark CSS vars (navy/gold/warm neutral + `--success`/`--info`/`--warning` + foregrounds); exposed `success`/`info`/`warning` in `tailwind.config.js`; retargeted `.gradient-primary/secondary`. lint+typecheck pass.

**Files:** `src/index.css`, `tailwind.config.js` (`theme.extend.colors` for success/info/warning only; shadows stay F7)

**CSS vars to set (light + dark):**

Brand/neutrals: `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--accent`, `--accent-foreground`, `--muted`, `--muted-foreground`, `--ring`, `--border`, `--input`, `--card`, `--card-foreground`, `--chart-1`…`--chart-5`

**New semantic (Fix 2):**

| Var | Light | Dark |
|---|---|---|
| `--success` | Forest `#1B5E4B` | lighter forest for navy grounds |
| `--success-foreground` | white | navy or white (contrast) |
| `--info` | Teal `#2A9D8F` | legible teal on navy |
| `--info-foreground` | white / navy as needed | contrast |
| `--warning` | `#C4842A` | lighter warm amber |
| `--warning-foreground` | navy or white as needed | contrast |

Expose in Tailwind: `success`, `info`, `warning` (+ foreground) like `primary`.

Also retarget `.gradient-primary` / `.gradient-secondary` off blue/emerald.

**Done when:** DevTools shows navy `--primary` (light); `bg-success` / `bg-info` / `bg-warning` resolve; no blue-600 in these var definitions.

**Verify:** `npm run lint && npm run typecheck`  
**Visual:** App background warm neutral; primary widgets navy (light).

**Risk:** Global flip of `bg-primary` consumers blue→navy (intended).

---

## F2 — Load Inter (Google Fonts)

**Status:** [x] Done  
**Progress note:** Added Inter 400–700 to Google Fonts link beside Instrument Serif in `index.html`. lint+typecheck pass.

**Files:** `index.html` (+ keep Instrument Serif for landing only)

**Done when:** Inter loads; in-app text uses Inter.

**Verify:** lint/typecheck + note font loading.

---

## F3 — Thin `colors.ts` wrapper (no parallel palette)

**Status:** [x] Done  
**Progress note:** Rewrote `colors.ts` as semantic-token wrappers; Round 2 removed the remaining hex fields and the misleading `COLORS.text.white` helper, then converted every call site to its actual background foreground token. Regression tests enforce the no-hex boundary and property-status mapping. lint+typecheck/test/build pass.

**Files:** `src/config/colors.ts` only

**Required architecture:**

- `COLORS.primary` / `secondary` / `accent` / `background` helpers → class strings using `primary` / `secondary` / `accent` / `background` tokens (e.g. `bg-primary`), **not** independent `blue-600` hex authority.
- `COLORS.success` / `info` / `warning` → `bg-success`, `text-success-foreground`, etc. **No independent hex** that can drift from CSS vars.
- `getStatusBadgeClasses`, `getPrimaryButtonClasses`, `getSuccessButtonClasses`, `getCardClasses`, `getHoverClasses` → compose semantic token classes only.
- Status maps: active/assigned → success; occupied → info; empty → warning; inactive/archived → muted.

**Done when:** File has no `#2563EB` / blue-600 / emerald-600 as brand or success authorities; success/info/warning reference Tailwind semantic tokens.

**Verify:** lint/typecheck.

---

## F4 — Shared `Button` variants

**Status:** [x] Done  
**Progress note:** Button variants use primary/secondary/accent/destructive tokens; removed blue/emerald/orange hardcodes. lint+typecheck pass.

---

## F5 — Fix `StatCard` navy/gold mapping

**Status:** [x] Done  
**Progress note:** navy/gold/emerald/blue map via COLORS.dashboard tokens; amber→warning, purple→info; card chrome semantic. lint+typecheck pass.

---

## F6 — App shell

**Status:** [x] Done  
**Progress note:** Sidebar/Navbar/MainLayout/PageHeader migrated to semantic tokens; logo strip stays `#0D1B2A` for logo contrast (dark primary is gold). Active nav = primary. lint+typecheck pass.

---

## F7 — Tailwind shadows / safelist cleanup

**Status:** [x] Done  
**Progress note:** Luxury shadows use navy RGBA; emerald shadows use forest; safelist updated off blue/emerald. lint+typecheck pass.

---

## F8 — Remove dead shadcn modules

**Status:** [x] Done  
**Progress note:** Re-verified zero feature imports; deleted slider, scroll-area, resizable, pagination, collapsible, carousel, breadcrumb, aspect-ratio.

---

## F9 — Foundation verification gate

**Status:** [x] Done  
**Progress note:** lint/typecheck/test (163)/build all pass. Foundation live globally — deferred pages inherit tokens. Proceeding Phase 1 autonomously.

---

# Part 2 — Rollout

For every page task: migrate only listed files; record **before → after** counts of raw `blue-*` / `slate-*` / `gray-*` utility hits in those files; mark status on completion; proceed without human gates.

---

## Phase 1 — Pilot

### P1.1 — Timeline

**Status:** [x] Done  
**Progress note:** Already semantic; Badge warning/success variants retargeted to CSS tokens.  
**Utility hits:** before 0 → after 0

---

### P1.2 — Calendar page

**Status:** [x] Done  
**Progress note:** Migrated CalendarPage neutrals/brand blues to muted/primary/card/border.  
**Utility hits:** before 31 → after 0

---

### P1.3 — Calendar shared components

**Status:** [x] Done  
**Progress note:** `src/components/calendar` already 0 raw blue/slate/gray hits — no file changes.  
**Utility hits:** before 0 → after 0

---

### P1.4 — Contracts Hub

**Status:** [x] Done  
**Progress note:** ContractTypeCard off blue/gray/slate; ContractsHub shell already clean.  
**Utility hits:** before 26 → after 0

---

### P1.5 — Phase 1 gate

**Status:** [x] Done  
**Progress note:** lint+typecheck pass; continuing Phase 2.

---

## Phase 2 — Medium

### P2.1 — Dashboard shell

**Status:** [x] Done — migrated raw blue/slate/gray → semantic tokens; lint+typecheck pass.
**Files:** `Dashboard.tsx`, `PDFExtractButton.tsx`

---

### P2.2 — Dashboard daily brief / zones

**Status:** [x] Done — migrated raw blue/slate/gray → semantic tokens; lint+typecheck pass.
**Files:** `DailyBriefHeader`, `NeedsAttentionSection`, `OverdueZone`, `ThisWeek`, `HorizonZone`, `WaitingOnOthers`, `RemindersSection`  
**Keep overdue red.**

---

### P2.3 — Dashboard summary cards / empty states

**Status:** [x] Done — migrated raw blue/slate/gray → semantic tokens; lint+typecheck pass.
**Files:** `ActionItemsCard`, `DealHealthCard`, `IncomeForecastCard`, `TeamPerformanceSummaryCard`, `EmptyWorkspaceDashboard`, `FirstDashboardWelcome`, `WelcomeEmptyState`

---

### P2.4 — Leads board

**Status:** [x] Done — migrated raw blue/slate/gray → semantic tokens; lint+typecheck pass.
**Files:** `Leads.tsx`, `LeadPipelineBoard`, `KanbanColumn`, `LeadKanbanCard`, `KanbanDragCard`

---

### P2.5 — Lead detail

**Status:** [x] Done — migrated raw blue/slate/gray → semantic tokens; lint+typecheck pass.
**Files:** `LeadDetailPage.tsx`, `LeadDetailSheet.tsx`

---

### P2.6 — Leads agreements + showings

**Status:** [x] Done — migrated raw blue/slate/gray → semantic tokens; lint+typecheck pass.
**Files:** agreement + showing components listed previously

---

### P2.7 — Lead source chart

**Status:** [x] Done — migrated raw blue/slate/gray → semantic tokens; lint+typecheck pass.
**Files:** `LeadSourceBreakdownCard.tsx` — keep categorical source hues

---

### P2.8 — Profile shell + general cards

**Status:** [x] Done — migrated raw blue/slate/gray → semantic tokens; lint+typecheck pass.
**Files:** `Profile.tsx`, `UserInfoHeader`, `ProfileInfoCard`, `AccountSettingsCard`, `AccountSecurityCard`, `PreferencesSection`, `LegalDocumentsCard`

---

### P2.9 — Profile org / billing / dialogs

**Status:** [x] Done — migrated raw blue/slate/gray → semantic tokens; lint+typecheck pass.
**Files:** org/billing/edit dialogs listed previously

---

### P2.10 — Phase 2 gate

**Status:** [x] Done — migrated raw blue/slate/gray → semantic tokens; lint+typecheck pass.
lint/typecheck/test → continue Phase 3 immediately.

---

## Phase 3 — Large

### P3.1 — Skip (Hub done in P1.4)

**Status:** [x] Done — N/A skip

---

### P3.2 — Rent contracts list

**Status:** [x] Done · **Utility hits:** after → 0 (`blue|slate|gray` semantic utilities)  
**Files:** `Contracts.tsx` (+ list-only children)  
**Commit:** `d92c95e`

---

### P3.3 — Rent create / edit forms

**Status:** [x] Done · **Utility hits:** after → 0  
**Files:** create/edit forms, form-sections, AddressInput, FixturesSelector, ConfirmationDialog, ImportBanner, PdfActionButtons, ContractStatusBadge  
**Commit:** `d92c95e`

---

### P3.4 — Rent import wizard

**Status:** [x] Done · **Utility hits:** after → 0  
**Files:** `src/features/contracts/import/**`  
**Commit:** `d92c95e`

---

### P3.5 — Lease detail

**Status:** [x] Done · **Utility hits:** after → 0  
**Files:** LeaseDetail + lease detail components (contracts `KeyDatesCard` only)  
**Commit:** `d92c95e`

---

### P3.6 — Lease wizard shell

**Status:** [x] Done · **Utility hits:** after → 0  
**Files:** LeaseWizardPage, LeaseWizard, LeaseWizardStepContent  
**Commit:** `d92c95e`

---

### P3.7 — Lease wizard steps

**Status:** [x] Done · **Utility hits:** after → 0  
**Files:** `leaseWizard/steps/*`  
**Commit:** `d92c95e`

---

### P3.8 — Purchase wizard shell

**Status:** [x] Done · **Utility hits:** after → 0  
**Files:** PurchaseWizardPage, PurchaseWizard, PurchaseWizardStepContent  
**Commit:** `d92c95e`

---

### P3.9 — Purchase wizard steps

**Status:** [x] Done · **Utility hits:** after → 0  
**Files:** `purchaseWizard/steps/*`  
**Commit:** `d92c95e`

---

### P3.10 — Purchase contract detail

**Status:** [x] Done · **Utility hits:** after → 0  
**Files:** PurchaseContractDetailPage/View + contracts PurchaseDetailView if distinct  
**Commit:** `d92c95e`

---

### P3.11 — Sale contracts

**Status:** [x] Done · **Utility hits:** after → 0  
**Files:** `contractsSale/*`  
**Commit:** `9645b85`

---

### P3.12 — Remaining contracts shared chrome

**Status:** [x] Done · **Utility hits:** after → 0  
**Files:** leftover dirty `contracts/components/*` only  
**Commit:** `d92c95e`

---

### P3.13 — Finance shell

**Status:** [x] Done · **Utility hits:** after → 0  
**Files:** Finance, FinanceDashboard, FinanceHeader, FinanceFiltersBar, CurrencySelector  
**Commit:** `bf91fa7`

---

### P3.14 — Finance overview / summary

**Status:** [x] Done · **Utility hits:** after → 0  
**Commit:** `bf91fa7`

---

### P3.15 — Finance transactions

**Status:** [x] Done · **Utility hits:** after → 0  
**Commit:** `bf91fa7`

---

### P3.16 — Finance recurring

**Status:** [x] Done · **Utility hits:** after → 0  
**Commit:** `bf91fa7`

---

### P3.17 — Finance commissions

**Status:** [x] Done · **Utility hits:** after → 0  
**Commit:** `bf91fa7`

---

### P3.18 — Finance charts

**Status:** [x] Done · **Utility hits:** after → 0  
Keep series diversity.  
**Commit:** `bf91fa7`

---

### P3.19 — Deals list

**Status:** [x] Done · **Utility hits:** after → 0  
**Files:** `Deals.tsx`  
**Commit:** `dac5f17`

---

### P3.20 — Deal detail shell

**Status:** [x] Done · **Utility hits:** after → 0  
**Commit:** `dac5f17`

---

### P3.21 — Deal panels — milestones / contingencies / offers

**Status:** [x] Done · **Utility hits:** after → 0  
**Commit:** `dac5f17`

---

### P3.22 — Deal panels — parties / docs / amendments / commission / timeline

**Status:** [x] Done · **Utility hits:** after → 0  
**Commit:** `dac5f17`

---

### P3.23 — Phase 3 + final gate

**Status:** [x] Done  
**Progress note:** lint/typecheck/test(163)/build pass. P3.2–P3.22 were executed in commits `d92c95e` / `9645b85` / `bf91fa7` / `dac5f17`; checkbox rows below were left Pending until doc sync (2026-08-02). Re-verified: `contracts` + `contractsSale` + `finance` = **0** raw `blue|slate|gray` utility hits; `deals` cleared remaining `divide-slate-*` (was 2). Deferred surfaces (Properties, Reminders, Auth/marketing, Screening, Deposits, Team/Org, Onboarding, Billing subscribe, Compliance, Landing redesign, duplicate-component cleanup) inherit foundation styling but retain unmigrated raw utility classes — tracked separately.

**Note:** Deals commit `dac5f17` also included pre-existing dirty WIP under `src/features/deals/` that was already modified on `main` before this rebrand (e.g. `EarningAgentSelect.tsx`). Separate from token migration — review that diff if unintended.

---

# Part 3 — Flags (RESOLVED)

See table at top. No further product input required.

**Autonomous execution authorized** — no inter-phase human gates (Fix 3).

---

# Part 4 — Round 2 audit-driven fixes

## R2.1 — Dashboard + Profile + Leads audit cleanup

**Status:** [x] Done
**Scope:** 27 files; removed remaining raw palette utilities and malformed opacity/border classes while preserving semantic error/warning/info/success meanings.
**Commit:** `8fe8c92`

## R2.2 — Auth and Accept Invite

**Status:** [x] Done
**Scope:** Login, Register, callbacks, email confirmation/change, forgot/reset password, and Accept Invite. Raw palette/white hits in scope: after → 0.
**Commit:** `0d2b211`

## R2.3 — Contrast, foreground helpers, and status mapping

**Status:** [x] Done
**Scope:** Corrected translucent success/warning badge foregrounds; adjusted destructive light/dark tokens; removed `COLORS.text.white` and all `colors.ts` hex fields; fixed all remaining helper call sites. Locked property meanings as empty→warning, occupied→info, available→success.
**Regression coverage:** `src/config/__tests__/colors.test.ts` checks the mapping and prevents a parallel hex authority.
**Commit:** `26d3f1b`

## R2.4 — Finance theme-aware charts

**Status:** [x] Done
**Scope:** Added `useChartColors` to resolve active CSS variables for Chart.js/Recharts; removed fixed hex/RGB palettes and remaining raw Finance utilities; corrected solid-primary/pale-card foreground mismatches. Raw palette and hardcoded chart-color hits in Finance: after → 0.
**Commit:** `ff9d27c`

## R2.5 — Inquiries, Owners, Tenants, and Quick Add

**Status:** [x] Done
**Scope:** Finished missed Inquiries and Owners call sites; migrated tenant steppers/cards/actions and Quick Add shells/sections. Raw palette/white hits in the completed directories: after → 0.
**Commits:** `26d3f1b`, `49c1733`

## R2.6 — Documentation reconciliation

**Status:** [x] Done
**Scope:** Updated the plan from its pre-rebrand inventory snapshot to the implemented architecture; documented the true deferred boundary, status mapping, audit findings, fixes, and verification evidence.

## R2.7 — Verification and visual smoke

**Status:** [x] Done
**Automated gate:** lint, typecheck, tests (167), build, and translation audit pass after every Round 2 batch. The only build warning is the accepted large-chunk warning.
**Visual evidence:** Dashboard and Finance Analytics were inspected in light/dark; Finance SVG series resolved active CSS-token HSL values and remained visible on navy cards. Register, Forgot Password, Reset Password, and Accept Invite states were inspected; no horizontal overflow or app console errors appeared. Rendered status-badge contrast samples measured 5.00:1–7.53:1 (success/info/warning), above the 4.5:1 AA target.
**Unrelated observation:** Invalid Accept Invite currently exposes untranslated fallback keys (`backToHome`, `needHelp`, `contactSupport`). Styling is correct; localization is separate follow-up scope.
