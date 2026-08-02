# design-sync notes for RealDesk-CRM / Closewell

## Repo shape

- No Storybook anywhere in this repo (confirmed with the user) — `shape: "package"`.
- This repo is an app (`package.json` `"private": true`), not a published component-library
  package: no `main`/`module`/`exports` fields, and `tsconfig.app.json` has `"noEmit": true`
  (no `.d.ts` ever emitted). There is no dedicated "build the library" command.
- Because of the above, `cfg.entry` points at a hand-authored barrel file,
  `.design-sync/entry.tsx`, which `export * from '@/...'`s exactly the scoped
  components from their real source locations. This is NOT the tool's synth-entry
  fallback (which would scan all of `src/` and force-bundle the entire app) — it's an
  explicit, curated substitute for a real `dist/` entry. Keep it in sync by hand when
  components are added to/removed from scope; there is no auto-discovery here.
  - Because `cfg.entry` is set, `resolveDistEntry` treats it as a real dist file and
    `synthEntry` stays `false` — the component list comes entirely from
    `cfg.componentSrcMap` (42 explicit pins), not from scanning `src/`.
- `cfg.tsconfig: "tsconfig.json"` is required for `@/*` → `./src/*` alias resolution
  in `.design-sync/entry.tsx` and every component file's own imports.

## Scope decision (user-confirmed)

First sync covers exactly:
- `src/components/ui/` (39 files) minus 2 exclusions below = 37 components
- `src/components/layout/`: MainLayout, PageContainer, PageHeader, Sidebar (4 — Navbar
  excluded, see below)
- Total: 41 components

**Batch 1 (this sync) = 37 components.** 5 components were deferred as a second batch,
for two independent reasons layered on top of each other:

1. **esbuild alias-resolution bug**: `tsconfigPathsPlugin` (`.ds-sync/lib/bundle.mjs`)
   probes extensions in order `['', '.ts', ..., '/index.ts', ...]` for `@/`-aliased
   imports, and `existsSync('')` matches a bare *directory* before ever trying
   `/index.ts` — so any `@/`-aliased import pointing at a directory with an `index.ts`
   (a completely normal pattern) fails with "Cannot read file ... is a directory".
   `lib/bundle.mjs` is explicitly off-limits to fork per this skill's own rules. Hit via
   `Navbar` → `AlertCenter` → `@/features/deals/hooks` (dir) and (transitively, via
   several PDF services) → `@/templates/documentRegistry` (dir). **Workaround**:
   appending `/index` to the specific import specifier (e.g.
   `'@/features/deals/hooks'` → `'@/features/deals/hooks/index'`) is a one-line,
   behavior-identical fix (resolves to the exact same file) — user-approved in principle,
   but not applied in this batch since Navbar/MainLayout are deferred anyway (see below).
   If Navbar is revisited, re-apply to: `AlertCenter.tsx`, and the `documentRegistry`
   consumers found via `grep -rn "from '@/templates/documentRegistry'" src`.

2. **`src/config/supabase.ts` throws at module-import time** if
   `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are unset — and since this converter uses
   esbuild (not Vite), `import.meta.env.VITE_*` is never replaced, so it's always
   `undefined` here. Because all 42 components ship in one shared bundle, this ONE throw
   breaks bundle initialization for every card, not just the ones that need it
   (`[BUNDLE_EXPORT] 42/42 not a component on window.Closewell`). Traced to exactly 5
   components: `CookiePreferences`, `CookieSettingsLink` (via `useCookieConsent` →
   `consentLogger` → `supabase`), and `MainLayout`, `Navbar`, `Sidebar` (via
   `AuthContext`/`OrgContext`/`NotificationContext`/`AlertCenter` → `supabase`).
   `PageContainer` and `PageHeader` are clean. **Real fix, user-facing decision, not
   applied**: make `supabase.ts`'s client creation lazy (defer the throw from
   import-time to first actual use) — a well-understood pattern that doesn't change real
   app behavior, but touches the single most-used config file in the codebase, so it
   needs explicit sign-off when revisited, not a sync-time judgment call.

**Deferred component list**: `CookiePreferences`, `CookieSettingsLink`, `MainLayout`,
`Navbar`, `Sidebar`. Re-add to `.design-sync/entry.tsx` + `cfg.componentSrcMap` once (2)
is resolved; Navbar additionally needs workaround (1) or its `AlertCenter` embed
decoupled.

**Excluded from `ui/`:**
- `cookie-notice.tsx` — uses `export default function CookieNotice()`, which violates
  this repo's own "no export default" convention (CLAUDE.md). A default export is
  invisible to `export * from` re-exports, so it can't ride the entry barrel as-is.
  Fixing the source to a named export would be a legitimate, low-risk follow-up (it's
  literally aligning with an existing repo rule) but was left out of this sync's scope
  rather than bundled in as an unrelated code change. Flagged to the user.
- `use-toast.ts` — exports `useToast`/`toast`, a hook + trigger function, not a
  component. Not a real omission, just doesn't belong in a component list.

**Explicitly out of scope for this pass** (per the rebrand plan's documented deferred
surfaces, or just not "design system" material):
- `src/components/landing/` and `src/features/landing/` — one-off marketing sections,
  not reusable components. `Hero.css` in particular has its own deliberate `--hero-*`
  illustration palette that would be actively misleading if picked up as "the design
  system."
- Properties, Screening, Deposits, Onboarding, Compliance, Team/Org pages — still carry
  raw pre-rebrand Tailwind classes per `npm run check:colors`.
- `src/components/templates/ListPageTemplate.tsx` — page-composition scaffold tied to
  routing/data-fetching, not a presentational primitive. Candidate for a later "patterns"
  pass once the primitive layer is solid.

## Design tokens (for cross-reference, not re-derivation)

- Tokens live in `src/index.css` (`:root` + `.dark`, HSL triples) and are mapped to
  Tailwind utilities in `tailwind.config.js`. `src/config/colors.ts` is a thin,
  non-authoritative wrapper — do not treat its `hex:` fields as a second source of truth.
- `cfg.cssEntry` points at the Vite-compiled stylesheet under `dist/assets/index-*.css`
  (NOT the raw `src/index.css` source — that lacks the actual generated Tailwind
  utility classes like `.bg-primary`, which only exist post-PostCSS/Tailwind processing).
  **This filename is content-hashed and changes on every `npm run build`** — before
  each sync/re-sync, run `rm -rf dist && npm run build` and re-check
  `ls dist/assets/index-*.css`, updating `cfg.cssEntry` if the hash changed.
- Inter is the app font; Instrument Serif is scoped to the landing page only (out of
  this sync's scope anyway). Inter is loaded via a Google Fonts `<link>` in
  `index.html`, not a local `@font-face` — there's no local font file to ship, so
  `cfg.runtimeFontPrefixes: ["Inter", "Avenir"]` suppresses the `[FONT_MISSING]`
  warning (Avenir is just a macOS-system fallback in the font stack, never actually
  shipped by anyone).

## `cfg.provider` doesn't work for this repo's synth-entry setup — self-wrap instead

`cfg.provider` (global provider wrap for every preview) failed for `Tooltip` with
`Error: 'Tooltip' must be used within 'TooltipProvider'` even though `TooltipProvider`
was correctly exported and correctly referenced in the generated wrap code
(`h(window.Closewell.TooltipProvider, {}, h(window.__dsPreview[key]))`). Root cause:
preview `.tsx` files compile as their own SEPARATE esbuild bundle from `_ds_bundle.js`
(confirmed — "Two independent build paths" in the base skill doc). Since my preview
imports `Tooltip`/`TooltipTrigger`/`TooltipContent` directly via `@/components/ui/tooltip`
(not via `window.Closewell.*`), that gets its own fresh copy of
`@radix-ui/react-tooltip`'s React Context — a different object than the one
`window.Closewell.TooltipProvider` (from the main bundle) provides. Two different bundle
evaluations of the same source = two different Context instances = the Provider can't
satisfy the Consumer.

**Fix, and the pattern for any future context-dependent preview**: import the provider
from the SAME module as the component it wraps, and wrap it INSIDE the preview file
itself (see `.design-sync/previews/Tooltip.tsx`) — never rely on `cfg.provider` when
previews compile from raw `@/` source rather than a real `dist/` bundle. `cfg.provider`
was removed from config entirely; if `Sidebar`/`MainLayout`/`Navbar` are revisited later
(they need `AuthContext`/`OrgContext`/`NotificationContext`/`ThemeContext`), self-wrap
each preview file the same way rather than reaching for `cfg.provider`.

## Found while authoring previews (not a sync bug — real app finding)

`Checkbox` (`src/components/ui/checkbox.tsx`) uses `rounded-sm` at `h-4 w-4` (16px). With
`--radius: 0.75rem` (12px), `rounded-sm` computes to `calc(0.75rem - 4px)` = 8px — exactly
half of 16px, so checkboxes render as perfect circles rather than rounded squares. This is
the REAL component's REAL current behavior (faithfully reproduced in the preview, not a
sync artifact) — flagging for the user to decide whether that's intentional.

## Re-sync risks

- The hand-authored `entry.tsx` and the `componentSrcMap` list are NOT auto-derived —
  a component added to `src/components/ui/` or `src/components/layout/` after this sync
  will NOT appear in a later re-sync until both are updated by hand.
- `cssEntry`'s hashed filename (above) is the most likely thing to silently go stale.
- `cookie-notice.tsx`'s default-export exclusion should be revisited if that component
  is ever wanted in the design system — the fix (named export) is small and repo-rule-
  aligned, just deferred here to keep this sync's diff to sync-only files.
