# RealDesk-CRM Review Checklists

## Universal Checklist (Every Change)

- [ ] Does the change follow the existing code conventions (named exports, no `any`, strict TypeScript)?
- [ ] Does it avoid adding unnecessary dependencies?
- [ ] Does `npm run typecheck` pass?
- [ ] Does `npm run build` pass?
- [ ] Does `npm run test` pass (or document regressions)?
- [ ] Does `npm run lint` pass?
- [ ] Are i18n keys used instead of hardcoded English strings?
- [ ] Is the service proxy pattern used (`src/lib/serviceProxy.ts`)?

## TypeScript Checklist

- [ ] No `any` types added
- [ ] No `@ts-ignore` or `@ts-expect-error` added
- [ ] No broad casts (`as unknown as`, `as any`)
- [ ] No `export default` used
- [ ] Public component props are typed
- [ ] Generated Supabase types used for DB entities (from `src/types/database.ts`)
- [ ] Strict mode preserved
- [ ] tsconfig not modified

## Frontend / UI Change Checklist

- [ ] Are Radix UI primitives preserved? (from `src/components/ui/`)
- [ ] Is Tailwind CSS 3.4 syntax used? (not v4 syntax)
- [ ] Is the component responsive? (Mobile + desktop)
- [ ] Are Lucide icons used?
- [ ] Is the change consistent with existing shadcn/ui new-york style?
- [ ] Are React Hook Form + Zod used for forms?
- [ ] Is `useTranslation` used for all user-visible text?
- [ ] Are loading, empty, and error states handled?
- [ ] Are Framer Motion animations consistent with existing patterns?

## Supabase Query / API Change Checklist

- [ ] Are queries scoped to the authenticated user? (`getAuthenticatedUserId()`)
- [ ] Are mutations protected by RLS?
- [ ] Is `@supabase/supabase-js` used (not raw SQL)?
- [ ] Is error handling graceful and user-friendly?
- [ ] Are Zod schemas used for validation?
- [ ] Is the service proxy pattern followed? (service class → export instance → add to `serviceProxy.ts`)

## Migration / Database Change Checklist

- [ ] Is the migration file numbered sequentially after the latest existing migration?
- [ ] Is the SQL reversible? (Include a `--- REVERT` section)
- [ ] Are RLS policies applied to new tables (SELECT, INSERT, UPDATE, DELETE)?
- [ ] Do new columns have appropriate defaults or NOT NULL constraints?
- [ ] Is `npm run gen:types` run after migration?
- [ ] Are generated type diffs reviewed?
- [ ] Are finance-sensitive tables flagged and reviewed carefully?

## Auth / Role Change Checklist

- [ ] Are changes reflected in `src/contexts/AuthContext`?
- [ ] Are route-level guards updated?
- [ ] Are UI-level guards updated (conditional rendering based on auth state)?
- [ ] Are Supabase RLS policies updated to match new roles?
- [ ] Are magic link / email/password flows preserved?

## Test Checklist

- [ ] Are tests added or updated for changed business logic?
- [ ] Are regression tests added for bug fixes?
- [ ] Are tests deterministic? (No reliance on real Supabase credentials)
- [ ] Is `npm run test` passing?
- [ ] Are mock boundaries appropriate? (Mock Supabase at service layer, not deep in UI)

## Build / Deploy Checklist

- [ ] Does `npm run build` succeed? (tsc -b + vite build)
- [ ] Does `npm run typecheck` pass?
- [ ] Are environment variables correctly set for Cloudflare Pages?
- [ ] Is the PWA manifest and service worker intact?
- [ ] Are Sentry errors reviewed if applicable?

## Final Release Checklist

- [ ] All checklists above completed
- [ ] `git diff --stat main...HEAD` reviewed
- [ ] `git diff --name-status main...HEAD` reviewed
- [ ] No unintended files modified
- [ ] No secrets or credentials exposed in diff
