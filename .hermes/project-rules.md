# RealDesk-CRM Project Rules

## Project Identity

- **Name:** RealDesk-CRM
- **Type:** Client project — V1 Client Workflow (Nexus V1) is mandatory
- **Repo:** `/Users/jans/Desktop/nexus/RealDesk-CRM`
- **Classification:** US real estate CRM for solo agents — property management, deal pipeline, finance, contracts

## Source Of Truth

Before making assumptions, always check:

1. `CLAUDE.md` — Comprehensive project rules, architecture, routes, database schema
2. Source files — `src/components/`, `src/features/`, `src/services/`, `src/App.tsx`
3. `supabase/migrations/` — Database schema and migration history
4. `package.json` — Exact dependency versions

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18.3 | SPA with Vite 5.4 |
| Language | TypeScript 5.5 | **Strict mode** |
| Build | `tsc -b && vite build` | TypeScript compile + Vite bundle |
| Routing | react-router-dom 7.9 | Routes in `src/App.tsx` |
| Forms | react-hook-form 7 + zod 3 | |
| Backend | Supabase (PostgreSQL) | **No ORM**. Supabase JS client 2.58 |
| Styling | Tailwind CSS 3.4 + shadcn/ui | new-york style, Radix primitives |
| State Mgmt | React Context | AuthContext, OrgContext, BillingContext |
| Charts | Chart.js 4.5 + Recharts 3.4 | |
| PDF | jsPDF 3.0 + jspdf-autotable | |
| i18n | i18next | **English only** — no Turkish locale |
| Auth | Supabase Auth | email/password + magic link |
| Testing | Vitest 3.2 | `npm run test` |
| Hosting | Cloudflare Pages + Wrangler 3 | |
| Animations | Framer Motion | |

## Architecture

```
src/
├── components/           — Shared, reusable UI components
│   ├── ui/               — 60+ Radix UI base components (shadcn)
│   ├── layout/           — MainLayout, Sidebar, Navbar, PageContainer
│   └── common/           — EmptyState, ErrorBoundary, Skeletons
├── features/             — One folder per domain feature (19 modules)
│   ├── auth/             — Login, AuthCallback
│   ├── dashboard/        — Stats + multi-deal overview
│   ├── properties/       — Rental + sale property management
│   ├── deals/            — Deal records, offer tracker
│   ├── contracts/        — Rental contracts + PDF + import
│   ├── finance/          — Financial tracking, categories
│   └── ... (19 total)
├── services/             — 23 service classes (Supabase API + business logic)
├── lib/                  — Utilities: auth, db, dates, rpc, currency, cn()
│   └── serviceProxy.ts   — Single import point for all services
├── config/               — colors.ts, constants.ts, supabase.ts
├── contexts/             — AuthContext, OrgContext, BillingContext
├── hooks/                — Custom React hooks
├── types/                — database.ts (generated), index.ts, contract.types.ts
└── templates/            — PDF contract text templates

supabase/
├── migrations/           — 4-digit sequential SQL files (0001_*.sql, 0002_*.sql)
└── functions/            — Deno edge functions
```

## TypeScript Standards

- Strict mode enforced — no `any`, no `@ts-ignore`
- Named exports only — never `export default`
- Service proxy pattern: import from `src/lib/serviceProxy.ts`, never directly
- Zod schemas for all form validation
- `cn()` utility from `src/lib/utils.ts` for Tailwind class merging
- Generated Supabase types in `src/types/database.ts`

## Supabase Standards

- No ORM — direct Supabase JS client
- All queries must include `getAuthenticatedUserId()` — never trust client-supplied user IDs
- RLS on all tables
- Migration naming: 4-digit sequential (`0001_*.sql`, `0002_*.sql`)
- After migration: run `npm run gen:types` to regenerate `src/types/database.ts`

## Build & Validation Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | `tsc -b && vite build` — final compile + bundle |
| `npm run typecheck` | `tsc --noEmit` — TypeScript only check |
| `npm run test` | `vitest run` |
| `npm run lint` | ESLint check |
| `npm run gen:types` | Regenerate Supabase types |
| `npm run deploy` | Build + Cloudflare Pages deploy (staging) |
| `npm run deploy:prod` | Build + Cloudflare Pages deploy (production) |

Recommended order: `lint` → `typecheck` → `test` → `build`

## Prohibited Actions

- Do NOT disable strict TypeScript
- Do NOT add `any`, `@ts-ignore`, or `@ts-expect-error`
- Do NOT use `export default`
- Do NOT modify generated `src/types/database.ts` by hand — run `npm run gen:types`
- Do NOT hardcode English strings in components — always use i18n
- Do NOT modify `financial_transactions` structure without finance review
- Do NOT run migrations without checking latest migration number first

## Required Verification

After any implementation:
1. `npm run typecheck` — must pass
2. `npm run build` — must pass
3. `npm run test` — should pass (or document regressions)
4. `npm run lint` — should pass (or document new warnings)
5. `git diff --stat main...HEAD` — report what changed
6. For migrations: check SQL syntax, RLS implications, latest migration number

## External State

Hermes tracks workflow state in `.hermes/hermes-state.json`.

- Created per PLAN_ONLY task.
- Updated on every phase change (PLAN_ONLY → WAITING_FOR_APPROVAL → APPROVED_FOR_IMPLEMENTATION → ...).
- Read at session start to recover in-progress work.
- Runtime file — do not commit to git (already in .gitignore).
- Lock file: `.hermes/hermes-state.lock` (also gitignored).
