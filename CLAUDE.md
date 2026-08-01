# CLAUDE.md — RealDesk CRM

Project memory for Claude Code / Cursor: **commands, conventions, and repo-specific gotchas**. Agent workflow, approval gates, and verification order: **[AGENTS.md](./AGENTS.md)**. Long-form docs: **[docs/README.md](./docs/README.md)**.

Mobile-first US solo-agent CRM — **Vite + React + TypeScript**, **Supabase**, **Cloudflare Pages**.

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server → http://localhost:5173 |
| `npm run build` | TypeScript + Vite production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | `vitest run` |
| `npm run test:watch` | Vitest watch |
| `npm run lint` | ESLint |
| `npm run preview` | Preview `dist/` locally |
| `npm run gen:types` | Regenerate `src/types/database.ts` |
| `npm run check:translations` | Audit `public/locales/en/*.json` |
| `npm run deploy` / `deploy:prod` | Cloudflare Pages via Wrangler |

```bash
supabase db push          # may skip 000N_* names — see migrations below
supabase functions deploy
```

---

## Database migrations (project rule)

This repo uses **`0001_slug.sql`**, **`0002_…`**, not Supabase timestamp names.

- Next migration = next 4-digit index in `supabase/migrations/`.
- **Never** reorder or edit migrations already applied in shared envs — add `000N_…` follow-up.
- If `db push` skips numbered files, apply SQL in order via SQL Editor / `psql`. Order in folder is source of truth.

### Migration history notes

Migration numbering: `0035` was never created (intentional gap, no action needed). `0039` is used by two files (`0039_add_agent_profile_fields.sql` and `0039_add_us_onboarding_org_profile_fields.sql`) — both were already applied to production manually. Do not rename either file; do not reuse `0035` or `0039` for future migrations. The next new migration should start at `0047`.

---

## Stack & layout

| Layer | Tech |
|-------|------|
| UI | React 18.3, TS 5.5, Vite 5.4, React Router 7.9, Tailwind, Radix, Framer Motion |
| Forms | React Hook Form + Zod |
| Backend | Supabase (Postgres, RLS, Auth, Storage, Edge Functions) |
| PDF | jsPDF + jspdf-autotable |
| i18n | i18next — **English only** (`public/locales/en/`) |
| Deploy | Cloudflare Pages + Wrangler 3 |

```
src/features/     # domain UI + hooks (one folder per feature)
src/services/     # Supabase access — consumers use src/lib/serviceProxy.ts only
src/components/   # shared UI, layout, ui/
supabase/migrations/   # 0001_*.sql, …
public/locales/en/     # i18n namespaces
```

Schema overview and patterns: [docs/reference/CURRENT_ARCHITECTURE.md](./docs/reference/CURRENT_ARCHITECTURE.md). Service catalog: [docs/reference/API.md](./docs/reference/API.md).

---

## Code conventions

- TypeScript **strict** — no `any`, no `@ts-ignore`, no `export default`
- **Service proxy** — import services from `src/lib/serviceProxy.ts` only
- **Zod** on forms with `zodResolver`; **`cn()`** from `src/lib/utils.ts`
- **i18n** — `useTranslation('namespace')`; keys in matching `public/locales/en/<namespace>.json`
- Components **do not** call services directly — use `src/features/*/hooks/use*Data.ts`
- Services call **`getAuthenticatedUserId()`** — never trust client-supplied user IDs

### New feature checklist

1. `src/features/[name]/…` 2. `src/services/[name].service.ts` 3. export in `serviceProxy.ts` 4. types in `src/types/index.ts` 5. route in `constants.ts` + `App.tsx` 6. nav in `Sidebar.tsx` 7. `public/locales/en/[name].json`

### New table checklist

1. `supabase/migrations/NNNN_description.sql` with RLS (SELECT/INSERT/UPDATE/DELETE) 2. apply migration 3. `npm run gen:types` 4. update service layer

Standard RLS (adapt per table):

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select" ON table_name FOR SELECT USING (auth.uid() = user_id);
-- insert / update / delete similarly with auth.uid() = user_id
```

---

## Environment variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TURNSTILE_SITE_KEY=
# Edge secrets (not VITE_): STRIPE_*, OCR_*, etc.
```

Never commit `.env`.

---

## Edge functions

Base: `${VITE_SUPABASE_URL}/functions/v1/<name>`

| Function | Purpose |
|----------|---------|
| `extract-contract-data-v2` | OCR from PDF/DOCX |
| `create-checkout-session` / `create-portal-session` / `stripe-webhook` | Billing |
| `send-invitation-email` | Org invites |
| `extract-text` | Text extraction helper |
| `fetch-exchange-rates` | Legacy (USD base) |

---

## Design & UX

- Tokens: `src/config/colors.ts`; status badges: `getStatusBadgeClasses()`
- Mobile-first: 44px touch targets; cards on viewports under 768px, tables at 768px and up
- Details: [docs/design/claude.md](./docs/design/claude.md)

---

## Security

- Encrypt sensitive fields through authenticated Supabase Edge Functions before storage
- Zod-validate input before services; signed URLs ~15 min for PDFs/photos
- CCPA-oriented personal data flows where applicable
- Do not change RLS/migrations/encryption without explicit approval

---

## Gotchas

- After schema change: `npm run gen:types`; if types missing, check `database.types.ts`
- Rental property status: `Empty | Occupied | Inactive`; sale: `Available | Under Offer | Sold | Inactive`
- Max **10** photos/property; uploads **5MB**, images jpeg/png/webp
- Atomic rental create: **`createContractWithEntities()`** RPC — not separate entity creates
- Offer **Accepted** → auto-create `deal_milestones` from closing/contingency dates
- Buyer-agent agreement before **showing_log** (post-NAR)
- US **state** = 2-letter uppercase; lead paint if `year_built < 1978`; deposit return by state rules engine

---

## Patterns

**Errors:** `useToast` — not `alert()` / bare `console.error` for user-facing failures.

**Billing:** `useBilling()` from `BillingContext`. `hasActiveAccess` includes trial. `ProtectedRoute` — auth + onboarding only, not subscription gate.

---

## Further reading

- [docs/design/claude.md](./docs/design/claude.md) — design rulebook  
- [docs/reference/ARCHITECTURE.md](./docs/reference/ARCHITECTURE.md) — diagrams  
- [CHANGELOG.md](./CHANGELOG.md)
