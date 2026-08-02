# Closewell UI Rebrand Plan

**Status:** Decisions recorded — granular implementation plan ready for flag resolution + `APPROVE`  
**Created:** 2026-08-02  
**Updated:** 2026-08-02  
**Source:** Full UI/design-system inventory audit (2026-08-02, read-only)  
**Goal:** Align the in-app UI with Closewell branding using the existing Tailwind + shadcn/ui foundation — without replacing that foundation.

**Constraint:** Implement only after explicit `APPROVE`, following [Decisions Made](#decisions-made) and the rollout order. Work on **`main`** only (no feature branch).

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

### Three parallel color systems

1. **shadcn CSS variables** (`src/index.css` + `tailwind.config.js`)  
   Still documented and valued as “Modern Blue & Emerald”: `--primary` ≈ blue-600 `#2563EB`, `--secondary` ≈ emerald-600, `--accent` ≈ orange-500. Semantic Tailwind names (`bg-primary`, etc.) exist but are lightly used (~33 hits for `*-primary` vs hundreds of raw palette utilities).

2. **`src/config/colors.ts` helper layer**  
   String-class tokens (`bg-blue-600`, status/dashboard helpers). Imported in ~96 files. Used alongside (not instead of) raw utilities. `getStatusBadgeClasses` is the main helper in active use; primary/card class helpers are thin.

3. **Raw Tailwind utilities in components**  
   Rough order-of-magnitude off-token usage: `slate-*` ~1757, `gray-*` ~757, `blue-*` ~644, `emerald-*` ~184 — **~3000+** palette utility hits. App UI is mostly painted with these, not with a single semantic token API.

### Closewell navy / gold today

| Where | What |
|---|---|
| Brand assets | Logos / icons under `public/brand/`, `public/icons/`; PWA `theme_color` `#0D1B2A` |
| Landing | Ad-hoc CSS (`Hero.css`, `landing-shared.css`): navy ≈ `#0c1829`, gold ≈ `#c8a96e`, cream `#f0ece4` |
| App chrome | Sidebar header `bg-[#0D1B2A]` + Closewell logo only |

**Not present:** reusable Closewell navy/gold entries in `tailwind.config.js`, CSS vars, or `colors.ts`. Landing navy/gold hex values are also **not identical** to `#0D1B2A`.

### Typography today

| Concern | Finding |
|---|---|
| Body | `index.css` declares `Inter, system-ui, …` but **Inter is never loaded** from Google Fonts (or elsewhere) → effective body face is the system stack |
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

`docs/design/claude.md` still describes the older blue/emerald RealDesk world (and outdated product facts). It does **not** document the three color systems, Closewell assets without tokens, or current routes. Treat inventory + this plan as the working UI baseline until that doc is refreshed after decisions.

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

Do not implement until explicit `APPROVE`. Rows below are the source of truth.

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
