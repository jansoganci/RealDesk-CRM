# Closewell UI Rebrand Plan

**Status:** Planned scope complete; Round 2 audit fixes complete on `main`
**Created:** 2026-08-02  
**Updated:** 2026-08-02  
**Source:** Full UI/design-system inventory audit (2026-08-02, read-only)  
**Goal:** Align the in-app UI with Closewell branding using the existing Tailwind + shadcn/ui foundation — without replacing that foundation.

**Constraint:** Work on **`main`** only (no feature branch). Deferred page-level raw-utility migrations remain tracked separately.

**Execution plan:** [UI_REBRAND_IMPLEMENTATION.md](./UI_REBRAND_IMPLEMENTATION.md) (Part 1 foundation → Part 2 page tasks → Part 3 flags).

---

## Current State

### Foundation (keep)

| Layer | What exists |
|---|---|
| Styling | Tailwind CSS `^3.4.13` |
| Component kit | shadcn/ui **New York** (`components.json`) wrapping Radix primitives in `src/components/ui/` (~47 files) |
| Variants / utils | `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate` |
| Icons | `lucide-react` (~201 import sites); `@radix-ui/react-icons` only inside shadcn wrappers |
| Motion / chrome | Framer Motion, Sonner, Vaul, next-themes |

**Do not replace** this stack (no daisyUI swap, no alternate component library). Rebrand work should extend tokens and usage patterns on top of it.

### Color system after implementation

1. **CSS variables are authoritative** (`src/index.css` + `tailwind.config.js`)
   Closewell navy/gold and the success/info/warning/destructive roles are defined once as light/dark CSS variables and exposed through semantic Tailwind utilities.

2. **`src/config/colors.ts` is a thin wrapper**
   It composes semantic class names only. It contains no independent hex values, and a regression test enforces that boundary.

3. **Raw Tailwind utilities are contained, not globally eliminated**
   All Round 1 areas plus the Round 2 audit areas (Auth, Dashboard, Profile, Leads/Inquiries, Finance, Owners, Tenants, Quick Add) have been migrated. Raw palette utilities remain in explicitly deferred surfaces such as Properties, Reminders, Screening, Deposits, Team/Org internals, Onboarding, Billing, Compliance, and landing visual CSS. Those are follow-up scope; they do not change the semantic-token source of truth.

### Closewell navy / gold

| Where | What |
|---|---|
| Brand assets | Logos / icons under `public/brand/`, `public/icons/`; PWA `theme_color` `#0D1B2A` |
| Landing | Landing-specific CSS remains visually independent; Hero variables are prefixed `--hero-*` so they cannot collide with app tokens |
| App | `--primary` is Deep Navy in light mode and Warm Gold in dark mode; `--secondary` / `--accent` are Warm Gold |
| Semantic accents | Forest success, teal info, warm-amber warning, and contrast-correct destructive tokens |

### Typography today

| Concern | Finding |
|---|---|
| Body | Inter 400–700 is loaded and used for in-app UI |
| Marketing | Instrument Serif loaded in `index.html`; used via `.ld-serif` / Hero CSS on landing only |
| Tailwind | No `fontFamily` theme extension |

### Layout / spacing (baseline)

- Shared shell is relatively consistent: `MainLayout` (`py-4 lg:py-8`) + `PageContainer` (`px-4 lg:px-6`, `space-y-6`).
- Arbitrary padding is rare; most `[Npx]` values are widths/heights (charts, columns, touch targets).
- Landing uses a separate rhythm (`py-32`, custom CSS islands).

### Page surface (for rollout sizing)

| Rough size | Areas |
|---|---|
| Large | Contracts (~59 TSX), Finance (~33), Deals (~23) |
| Medium | Dashboard (~16), Profile (~16), Leads (~13), Properties/tenants/org |
| Small / pilot-friendly | Timeline, Calendar, Contracts Hub, Screening, Deposits |

### Design docs gap

This plan and [UI_REBRAND_IMPLEMENTATION.md](./UI_REBRAND_IMPLEMENTATION.md) record the implemented token architecture and rollout boundary. `docs/design/claude.md` is broader historical guidance and should not override the token source of truth in `src/index.css`.

---

## Open Decisions

_(a)–(c) and extras decided 2026-08-02 — see [Decisions Made](#decisions-made). No further product input required before a token/foundation implementation pass can be proposed for `APPROVE`._

---

## Tracked Cleanup (not urgent)

Found during the 2026-08-02 audit. Items marked **rebrand pass** are in scope when implementation starts; the rest stay deferred.

| Item | Notes |
|---|---|
| Duplicate `KeyDatesCard` | `contracts` + `deals` copies — **out of rebrand pass**; separate future cleanup |
| `MemberCard` vs `TeamMemberCard` | Near-duplicate org cards — **out of rebrand pass**; separate future cleanup |
| Multiple StatusBadge paths | Shared `ui/badge` + helpers + feature badges — **out of rebrand pass**; separate future cleanup |
| Dead / unused shadcn UI modules | `slider`, `scroll-area`, `resizable`, `pagination`, `collapsible`, `carousel`, `breadcrumb`, `aspect-ratio` — **rebrand pass**: remove after re-confirming zero feature imports |
| `StatCard` `navy` / `gold` props | Currently map to blue/orange via `COLORS.dashboard.*` — **rebrand pass**: map to actual Closewell navy/gold |
| Landing vs app spacing | Landing `py-32` may stay more spacious than app `space-y-4/6` — **decided OK**; not required to unify |

---

## Decisions Made

Historical decision record. Implementation was approved and completed on `main`; rows below remain the source of truth for the chosen design direction.

| Date | Decision ID | Choice | Notes |
|---|---|---|---|
| 2026-08-02 | (a) Token strategy | **Rework existing shadcn CSS vars** (not parallel Closewell-* tokens) | `--primary` → Deep Navy `#0D1B2A`; `--secondary` / `--accent` → Warm Gold `#C9A46A`; limited secondary accents Forest Green `#1B5E4B`, Teal `#2A9D8F`; background/neutral Warm Neutral `#F7F6F2`. Redirect `config/colors.ts` helpers to these same tokens (not a separate palette). Migrate raw `blue-*` / `slate-*` / `gray-*` to semantic tokens **gradually, page by page** per rollout phase — not a global find-replace. |
| 2026-08-02 | (a+) Dark primary | **Dark `--primary` = Warm Gold** | Light mode `--primary` stays Deep Navy. Dark surfaces navy; gold for primary CTAs/selected controls on dark. |
| 2026-08-02 | (b) Body font | **Load Inter** for all in-app UI | Fix declared-but-unloaded Inter (dashboard, forms, app shell). Keep **Instrument Serif only** for large marketing headlines on landing — do not use serif in-app. Rationale: 50+ users; readability and clear numerals matter (finance-heavy). |
| 2026-08-02 | (c) Rollout order | **Small → medium → large** | **1.** Pilot: Timeline, Calendar, Hub. **2.** Medium: Dashboard, Leads, Profile. **3.** Large (last): Contracts, Finance, Deals. |
| 2026-08-02 | Extras — dead shadcn | **Remove** unused modules listed above | Re-confirm zero feature imports immediately before delete. |
| 2026-08-02 | Extras — StatCard | **Fix** `navy` / `gold` mappings to Closewell values | Currently incorrect (blue/orange). |
| 2026-08-02 | Extras — spacing | Landing rhythm may stay more spacious | Not required to fully unify marketing vs in-app spacing. |
| 2026-08-02 | Extras — duplicates | **Defer** KeyDatesCard / MemberCard / StatusBadge consolidation | Remain in Tracked Cleanup only; not part of this rebrand pass. |
| 2026-08-02 | Git | **Stay on `main`** | Do not open a feature branch for this rebrand. |

---

## Phase Log

| Date | Item | Status change | Evidence / notes |
|---|---|---|---|
| 2026-08-02 | Plan | Created | UI inventory audit summarized; open decisions (a)–(c) listed; cleanup backlog tracked; no design decisions recorded. |
| 2026-08-02 | Decisions (a)(b)(c) + extras | Finalized | Token CSS-var rework (navy/gold + accents + warm neutral); Inter in-app / Instrument Serif landing-only; rollout Small→Medium→Large; remove dead shadcn + fix StatCard in pass; defer duplicate-component cleanup; landing spacing may stay looser. No code changes. |
| 2026-08-02 | Implementation plan | Created | `UI_REBRAND_IMPLEMENTATION.md`: F1–F9 foundation units; Phase 1–3 page tasks; Part 3 blockers (dark mode, semantic success/info, etc.). No code changes. |
| 2026-08-02 | Part 3 flags | Resolved | P3-1 dark = navy + gold + contrast; P3-2 success=forest / info=teal; P3-3…P3-8 accept defaults. Awaiting APPROVE to start F1. |
| 2026-08-02 | Dark primary + branch | Locked | Dark `--primary` = Warm Gold (light stays navy). Execute on `main` — no feature branch. |
| 2026-08-02 | Implementation plan fixes 1–4 | Applied | Scope inheritance clarified; success/info/warning CSS-first; no human phase gates; per-task status + utility hit counts. Execution started on `main`. |
| 2026-08-02 | Foundation F1–F9 | Complete | CSS vars + Inter + colors.ts + Button + StatCard + shell + shadows + dead shadcn removal; lint/typecheck/test/build green. |
| 2026-08-02 | Phases 1–3 page migration | Complete | Timeline/Calendar/Hub → Dashboard/Leads/Profile → Contracts/Finance/Deals. Planned scope complete; deferred surfaces inherit foundation but retain unmigrated raw utilities — tracked separately. |
| 2026-08-02 | Round 2 independent audit | Findings confirmed | Found contrast failures in translucent badges, a mode-dependent `COLORS.text.white` bug, fixed Finance chart colors, status-map documentation drift, and missed Profile/Inquiries plus ambiguous Owners/Tenants/Quick Add surfaces. |
| 2026-08-02 | Round 2 foundation fixes | Complete | Corrected badge/alert foregrounds and destructive tokens; removed `COLORS.text.white`; removed all hex values from `colors.ts`; locked empty→warning, occupied→info, available→success with tests. Commits `8fe8c92`, `26d3f1b`. |
| 2026-08-02 | Round 2 page fixes | Complete | Auth/Accept Invite, Finance charts, Inquiries, Owners, Tenants, and Quick Add migrated to semantic tokens. Finance canvas/SVG colors now resolve live CSS variables for light/dark mode. Commits `0d2b211`, `ff9d27c`, `49c1733`. |
| 2026-08-02 | Round 2 verification | Complete | Per-batch lint, typecheck, tests, build, and translation audit passed; final browser light/dark smoke pass tracked in the implementation plan. |
