# RealDesk-CRM — Current Architecture

**Last Updated:** May 2026
**Status:** CURRENT

## Project Identity

- **Name:** RealDesk-CRM
- **Type:** US real estate CRM for solo agents
- **Stack:** React 18.3 + Vite 5.4 + TypeScript 5.5 strict + Supabase + Tailwind 3.4 + shadcn/ui + Cloudflare Pages + Vitest
- **Language:** TypeScript strict mode — no `any`, no `@ts-ignore`
- **Deploy:** Cloudflare Pages via Wrangler 3
- **Testing:** Vitest (`npm run test`)

## Architecture

```
src/
├── components/        — Shared UI (shadcn/ui, Radix, layout, common)
├── features/          — Domain modules (auth, properties, deals, contracts, etc.)
├── services/          — Service classes (Supabase API + business logic)
├── lib/               — Utilities (serviceProxy.ts, auth, db, utils)
├── contexts/          — AuthContext, OrgContext, BillingContext
├── config/            — constants, colors, supabase client
├── hooks/             — Custom React hooks
├── types/             — database.ts (generated), index.ts
└── templates/         — PDF contract templates
```

## Key Patterns

- **Named exports only** — never `export default`
- **Service proxy** — always import from `src/lib/serviceProxy.ts`
- **cn() utility** — from `src/lib/utils.ts` for Tailwind class merging
- **Zod schemas** — all form validation via `@hookform/resolvers/zod`
- **React Context** — AuthContext, OrgContext, BillingContext (no Redux/Zustand)
- **Strict TypeScript** — no `any`, no `@ts-ignore`, no `as unknown as`

## Key Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | `tsc -b && vite build` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | `vitest run` |
| `npm run lint` | ESLint |
| `npm run deploy` | Build + Cloudflare Pages deploy |

## Auth

- Supabase Auth (email/password + magic link)
- AuthContext manages session lifecycle
- Protected routes via `ProtectedRoute` + `OwnerOnlyRoute` components

## i18n

- English only
- i18next with `public/locales/en/` namespace JSON files
- No Turkish locale in repo (Emlak CRM phase completed)

## Database & Migrations

- Supabase PostgreSQL — no ORM
- 33 sequential SQL migrations
- Naming: `0001_*.sql`, `0002_*.sql`, etc.
- RLS on all tables
- After schema change: `npm run gen:types` regenerates `src/types/database.ts`

## Hosting & Deployment

- **Primary:** Cloudflare Pages + Wrangler 3
- **Domain:** emlakcrm.app (production)
- **PWA:** Manifest + service worker (vite-plugin-pwa)

## High-Risk Areas

- Finance data (commissions, billing, deposits)
- Database migrations (destructive changes)
- RLS/auth policies (data access boundaries)
- Auth flows (magic link, session, email confirmation)
- Deal pipeline (status transitions, offer tracking)
- Contract PDF generation (jsPDF)

## Source of Truth

- `AGENTS.md` — first-read AI agent memory
- `CLAUDE.md` — comprehensive project rules
- `.hermes/project-rules.md` — engineering rules
- `package.json` — exact dependencies
