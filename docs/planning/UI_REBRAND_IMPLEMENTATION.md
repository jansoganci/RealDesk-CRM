# Closewell UI Rebrand — Implementation Plan

**Status:** In execution — autonomous F1→P3.23 on `main`  
**Created:** 2026-08-02  
**Updated:** 2026-08-02  
**Source of truth:** [UI_REBRAND_PLAN.md](./UI_REBRAND_PLAN.md) → Decisions Made  
**Rule:** One task = one reviewable/revertable unit. No multi-area sweeps.

### Scope model (Fix 1 — locked)

**Page-level content migration** (raw `blue-*` / `slate-*` / `gray-*` → semantic tokens) is **deferred** for:

Properties, Reminders, Auth/marketing pages, Screening, Deposits, Team/Org, Onboarding, Billing subscribe, Compliance, Landing visual redesign, and duplicate-component cleanup (KeyDatesCard / MemberCard / StatusBadge consolidation).

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
| Chart categorical hex | leave unless leftover brand-blue theme |

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

**Status:** [ ] Pending  
**Progress note:** _(filled on completion)_

**Files:** `index.html` (+ keep Instrument Serif for landing only)

**Done when:** Inter loads; in-app text uses Inter.

**Verify:** lint/typecheck + note font loading.

---

## F3 — Thin `colors.ts` wrapper (no parallel palette)

**Status:** [ ] Pending  
**Progress note:** _(filled on completion)_

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

**Status:** [ ] Pending  
**Progress note:** _(filled on completion)_

**Files:** `src/components/ui/button.tsx`

| Variant | Target |
|---|---|
| `default` | `bg-primary text-primary-foreground` |
| `secondary` | `bg-secondary text-secondary-foreground` |
| `ghost` | gold-tint hover |
| `link` | `text-primary` |
| `outline` | border/background tokens |
| `destructive` | unchanged |

**Done when:** No hardcoded `blue-600` / `emerald-600` / `orange-500` in variants.

**Verify:** lint/typecheck.

---

## F5 — Fix `StatCard` navy/gold mapping

**Status:** [ ] Pending  
**Progress note:** _(filled on completion)_

**Files:** `src/components/dashboard/StatCard.tsx`

**Done when:** `navy`/`gold` props map to Closewell navy/gold (via tokenized `COLORS.dashboard` or semantic classes).

**Verify:** lint/typecheck.

---

## F6 — App shell

**Status:** [ ] Pending  
**Progress note:** _(filled on completion)_

**Files:** `Sidebar.tsx`, `Navbar.tsx`, `MainLayout.tsx`, `PageContainer.tsx`, `PageHeader.tsx` (under `src/components/layout/`)

**Done when:** Active nav uses primary (not `blue-600`); shell neutrals semantic; header `bg-primary` preferred over raw hex.

**Verify:** lint/typecheck. Visual note: dashboard shell.

**Risk:** Unrelated local WIP may exist in `Sidebar.tsx` — only change rebrand classes; preserve other WIP behavior.

---

## F7 — Tailwind shadows / safelist cleanup

**Status:** [ ] Pending  
**Progress note:** _(filled on completion)_

**Files:** `tailwind.config.js` (shadows + safelist; success/info/warning already added in F1)

**Done when:** No blue-600 RGB in luxury/emerald shadow defs.

**Verify:** lint/typecheck.

---

## F8 — Remove dead shadcn modules

**Status:** [ ] Pending  
**Progress note:** _(filled on completion)_

**Pre-check zero usage, then delete if still zero:**

`slider`, `scroll-area`, `resizable`, `pagination`, `collapsible`, `carousel`, `breadcrumb`, `aspect-ratio` (under `src/components/ui/`)

**Verify:** `npm run lint && npm run typecheck && npm run test && npm run build`

---

## F9 — Foundation verification gate

**Status:** [ ] Pending  
**Progress note:** _(filled on completion)_

**Run:** `npm run lint && npm run typecheck && npm run test && npm run build`

**Visual smoke (agent-recorded, no human gate):**

- Planned-scope: `/login`, `/dashboard`, `/contracts`, dark toggle once  
- **Deferred surfaces inherit foundation** — quick render check: `/properties`, `/reminders`, `/screening`, `/deposits`, `/team`, `/onboarding`, `/compliance`, `/profile` (auth shell already via login)

**Done when:** Commands pass; smoke notes recorded. Proceed immediately to Phase 1 (no approval stop).

---

# Part 2 — Rollout

For every page task: migrate only listed files; record **before → after** counts of raw `blue-*` / `slate-*` / `gray-*` utility hits in those files; mark status on completion; proceed without human gates.

---

## Phase 1 — Pilot

### P1.1 — Timeline

**Status:** [ ] Pending  
**Progress note:** _(_)_  
**Utility hits:** before _ → after _

**Files:** `src/features/timeline/TimelinePage.tsx`  
**Exclude:** layout/ui/services  
**Visual:** `/timeline`

---

### P1.2 — Calendar page

**Status:** [ ] Pending  
**Progress note:** _(_)_  
**Utility hits:** before _ → after _

**Files:** `src/features/calendar/CalendarPage.tsx`  
**Exclude:** `src/components/calendar/*`  
**Visual:** `/calendar`

---

### P1.3 — Calendar shared components

**Status:** [ ] Pending  
**Progress note:** _(_)_  
**Utility hits:** before _ → after _

**Files:** `src/components/calendar/**`  
**Exclude:** `ui/calendar.tsx` unless raw blue remains  
**Visual:** add/edit meeting

---

### P1.4 — Contracts Hub

**Status:** [ ] Pending  
**Progress note:** _(_)_  
**Utility hits:** before _ → after _

**Files:** `ContractsHub.tsx`, `ContractTypeCard.tsx`  
**Visual:** `/contracts`

---

### P1.5 — Phase 1 gate

**Status:** [ ] Pending  
**Progress note:** _(_)_

lint/typecheck/test + agent visual: Timeline, Calendar, Hub → continue Phase 2 immediately.

---

## Phase 2 — Medium

### P2.1 — Dashboard shell

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** `Dashboard.tsx`, `PDFExtractButton.tsx`

---

### P2.2 — Dashboard daily brief / zones

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** `DailyBriefHeader`, `NeedsAttentionSection`, `OverdueZone`, `ThisWeek`, `HorizonZone`, `WaitingOnOthers`, `RemindersSection`  
**Keep overdue red.**

---

### P2.3 — Dashboard summary cards / empty states

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** `ActionItemsCard`, `DealHealthCard`, `IncomeForecastCard`, `TeamPerformanceSummaryCard`, `EmptyWorkspaceDashboard`, `FirstDashboardWelcome`, `WelcomeEmptyState`

---

### P2.4 — Leads board

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** `Leads.tsx`, `LeadPipelineBoard`, `KanbanColumn`, `LeadKanbanCard`, `KanbanDragCard`

---

### P2.5 — Lead detail

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** `LeadDetailPage.tsx`, `LeadDetailSheet.tsx`

---

### P2.6 — Leads agreements + showings

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** agreement + showing components listed previously

---

### P2.7 — Lead source chart

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** `LeadSourceBreakdownCard.tsx` — keep categorical source hues

---

### P2.8 — Profile shell + general cards

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** `Profile.tsx`, `UserInfoHeader`, `ProfileInfoCard`, `AccountSettingsCard`, `AccountSecurityCard`, `PreferencesSection`, `LegalDocumentsCard`

---

### P2.9 — Profile org / billing / dialogs

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** org/billing/edit dialogs listed previously

---

### P2.10 — Phase 2 gate

**Status:** [ ] Pending  
lint/typecheck/test → continue Phase 3 immediately.

---

## Phase 3 — Large

### P3.1 — Skip (Hub done in P1.4)

**Status:** [x] Done — N/A skip

---

### P3.2 — Rent contracts list

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** `Contracts.tsx` (+ list-only children)

---

### P3.3 — Rent create / edit forms

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** create/edit forms, form-sections, AddressInput, FixturesSelector, ConfirmationDialog, ImportBanner, PdfActionButtons, ContractStatusBadge

---

### P3.4 — Rent import wizard

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** `src/features/contracts/import/**`

---

### P3.5 — Lease detail

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** LeaseDetail + lease detail components (contracts `KeyDatesCard` only)

---

### P3.6 — Lease wizard shell

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** LeaseWizardPage, LeaseWizard, LeaseWizardStepContent

---

### P3.7 — Lease wizard steps

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** `leaseWizard/steps/*`

---

### P3.8 — Purchase wizard shell

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** PurchaseWizardPage, PurchaseWizard, PurchaseWizardStepContent

---

### P3.9 — Purchase wizard steps

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** `purchaseWizard/steps/*`

---

### P3.10 — Purchase contract detail

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** PurchaseContractDetailPage/View + contracts PurchaseDetailView if distinct

---

### P3.11 — Sale contracts

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** `contractsSale/*`

---

### P3.12 — Remaining contracts shared chrome

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** leftover dirty `contracts/components/*` only

---

### P3.13 — Finance shell

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** Finance, FinanceDashboard, FinanceHeader, FinanceFiltersBar, CurrencySelector

---

### P3.14 — Finance overview / summary

**Status:** [ ] Pending · **Utility hits:** before _ → after _

---

### P3.15 — Finance transactions

**Status:** [ ] Pending · **Utility hits:** before _ → after _

---

### P3.16 — Finance recurring

**Status:** [ ] Pending · **Utility hits:** before _ → after _

---

### P3.17 — Finance commissions

**Status:** [ ] Pending · **Utility hits:** before _ → after _

---

### P3.18 — Finance charts

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
Keep series diversity.

---

### P3.19 — Deals list

**Status:** [ ] Pending · **Utility hits:** before _ → after _  
**Files:** `Deals.tsx`

---

### P3.20 — Deal detail shell

**Status:** [ ] Pending · **Utility hits:** before _ → after _

---

### P3.21 — Deal panels — milestones / contingencies / offers

**Status:** [ ] Pending · **Utility hits:** before _ → after _

---

### P3.22 — Deal panels — parties / docs / amendments / commission / timeline

**Status:** [ ] Pending · **Utility hits:** before _ → after _

---

### P3.23 — Phase 3 + final gate

**Status:** [ ] Pending  
**Progress note:** _(filled on completion)_

**Run:** lint + typecheck + test + build  

**Completion statement to record:**  
*Planned scope complete; deferred surfaces (Properties, Reminders, Auth/marketing, Screening, Deposits, Team/Org, Onboarding, Billing subscribe, Compliance, Landing redesign, duplicate-component cleanup) inherit foundation styling but retain unmigrated raw utility classes — tracked separately.*

Update `UI_REBRAND_PLAN.md` Phase Log with that wording.

---

# Part 3 — Flags (RESOLVED)

See table at top. No further product input required.

**Autonomous execution authorized** — no inter-phase human gates (Fix 3).
