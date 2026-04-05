# CLAUDE.md — RealDesk CRM

Mobile-first Real Estate CRM for US solo agents. Built with **Vite + React + TypeScript**, backed by **Supabase** (Postgres, Auth, Storage, Edge Functions), deployed to **Cloudflare Pages**.

---

## Commands

```bash
npm run dev          # Start dev server → http://localhost:5173
npm run build        # TypeScript check + Vite production build
npm run typecheck    # TypeScript only, no emit
npm run lint         # ESLint
npm run preview      # Preview the dist/ build locally
npm run gen:types    # Regenerate Supabase types → src/types/database.ts
npm run deploy       # Build + deploy to Cloudflare Pages (staging)
npm run deploy:prod  # Build + deploy to Cloudflare Pages (production)
```

**Supabase CLI:**
```bash
supabase db push             # Apply local migrations to remote (see Migration naming below)
supabase functions deploy     # Deploy edge functions
```

---

## Database migrations (naming) — **project rule**

This repo **does not** use Supabase’s default `YYYYMMDDHHmmss_description.sql` naming.

- Every file in `supabase/migrations/` **must** use a **4-digit, zero-padded sequence** prefix, then an underscore, then a short slug:
  - `0001_init_schema.sql`
  - `0002_add_foo.sql`
  - `0003_alter_bar.sql`
- Numbers increase by one for each new migration. **Never** reorder applied migrations; add a new higher number instead.
- **Do not** rename or edit a migration file after it has been applied to any shared environment — add `000N_...` as a follow-up.

**Supabase CLI caveat:** Upstream `supabase db push` only auto-applies filenames that match its own timestamp pattern; it may **skip** `0001_`-style names. If that happens, apply SQL in order via **Supabase SQL Editor**, **`psql`**, or your team’s chosen runner — the **source of truth** for order is still the `0001`, `0002`, `0003` sequence in this folder.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| UI | React 18.3, TypeScript 5.5, Vite 5.4 |
| Styling | Tailwind CSS 3.4, Radix UI, Lucide React, Framer Motion |
| Routing | React Router 7.9 |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL, RLS, Auth, Storage) |
| Edge Functions | Supabase Edge Functions (Deno) |
| PDF | jsPDF + jspdf-autotable |
| i18n | i18next (18 namespaces, EN primary + TR legacy) |
| Deploy | Cloudflare Pages via Wrangler 3 |

---

## Project Structure

```
src/
├── components/        # Shared, reusable UI components only
│   ├── ui/            # 60+ Radix UI base components
│   ├── layout/        # MainLayout, Sidebar, Navbar, PageContainer
│   └── common/        # EmptyState, ErrorBoundary, Skeletons
├── features/          # One folder per domain feature
│   ├── auth/          # Login, AuthCallback
│   ├── dashboard/     # Dashboard with stats + multi-deal overview
│   ├── properties/    # Rental + sale property management (US address)
│   ├── owners/        # Property owner management (US bank fields)
│   ├── tenants/       # Tenant management (multi-step creation)
│   ├── contracts/     # Rental contracts + PDF + import wizard
│   ├── finance/       # Financial tracking, categories, analytics
│   ├── inquiries/     # Lead pipeline with source tracking + auto-matching
│   ├── deals/         # Deal records (lead → closing), offer tracker
│   ├── timeline/      # Transaction timeline (milestones, deadlines, docs)
│   ├── agreements/    # Buyer-agent agreement tracker (post-NAR)
│   ├── showings/      # Showing log with buyer feedback
│   ├── commission/    # Dual-side commission calculator + forecast
│   ├── screening/     # Rental applicant screening tracker
│   ├── calendar/      # Meetings and appointments
│   ├── reminders/     # Auto-generated reminders from contracts
│   ├── quick-add/     # Quick entity creation shortcut
│   ├── profile/       # User profile settings
│   └── landing/       # Public landing page
├── services/          # 23 service classes (Supabase API + business logic)
├── lib/               # Utilities: auth, db, dates, rpc, currency, errors
├── config/            # colors.ts, constants.ts, supabase.ts
├── contexts/          # AuthContext, OrgContext, BillingContext
├── hooks/             # Custom React hooks
├── types/             # index.ts, database.ts (generated), contract.types.ts
└── templates/         # PDF contract text templates (US lease + purchase agreement)

supabase/
├── migrations/        # SQL migrations: 0001_foo.sql, 0002_bar.sql, … (see “Database migrations”)
└── functions/         # Deno edge functions (Stripe, OCR, email, etc.)

public/
└── locales/           # i18n JSON files (tr/, en/) — 18 namespaces each
```

---

## Code Style & Conventions

- **TypeScript strict mode** — no `any` types
- **Named exports only** — never `export default`
- **Functional components** with hooks — no class components
- **Service proxy pattern** — always import services from `src/lib/serviceProxy.ts`, never directly from `src/services/`
- **Zod schemas** for all form validation; pair with `zodResolver` from `@hookform/resolvers`
- **`cn()` utility** from `src/lib/utils.ts` for merging Tailwind classes
- **i18n required** — all user-facing strings must use `useTranslation('[namespace]')`. English (`en/`) is the primary locale; Turkish (`tr/`) is legacy-only. New features only need `en/` translations.

---

## Architecture Rules

### Adding a New Feature

1. Create `src/features/[feature-name]/[FeatureName].tsx`
2. Create `src/services/[feature-name].service.ts` as a class, export an instance
3. Export service from `src/lib/serviceProxy.ts`
4. Add types to `src/types/index.ts`
5. Add route constant to `src/config/constants.ts`
6. Register route in `src/App.tsx`
7. Add nav item to `src/components/layout/Sidebar.tsx`
8. Create `public/locales/en/[feature-name].json` (Turkish counterpart only if updating existing feature)

### Adding a Database Table

1. Create `supabase/migrations/[NNNN]_description.sql` with the **next** 4-digit index (e.g. `0007_add_widget_table.sql`). See **Database migrations (naming)** above.
2. Add RLS policies for all 4 operations (SELECT, INSERT, UPDATE, DELETE)
3. Apply the migration to your database (see CLI caveat under **Database migrations** if `db push` skips numbered files)
4. Run `npm run gen:types` to regenerate `src/types/database.ts`
5. Update service layer

### Service Pattern

```typescript
// src/services/example.service.ts
class ExampleService {
  async getAll() {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('example_table')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }
}
export const exampleService = new ExampleService();
```

Services **always** call `getAuthenticatedUserId()` — never trust client-supplied user IDs.

---

## Database Key Tables

### Core (existing, adapted for US)

| Table | Purpose |
|-------|---------|
| `properties` | Properties with `property_type: 'rental' \| 'sale'`; US address fields (street_address, city, state, zip_code, mls_id, year_built) |
| `property_owners` | Owners — routing_number + account_number stored AES-256-GCM encrypted (TC/IBAN removed) |
| `tenants` | Tenants — US address fields; TC fields removed |
| `contracts` | Rental contracts + deal_id FK, deposit_amount, deposit_return_deadline |
| `contract_details` | Extra contract fields for PDF generation |
| `property_inquiries` | Lead pipeline with source tracking + auto-matching to properties |
| `inquiry_matches` | Match results between inquiries and properties |
| `meetings` | Calendar appointments linked to property/tenant/owner |
| `commissions` | Dual-side commission tracking (listing-side + buyer-side, post-NAR) |
| `financial_transactions` | Income/expense ledger with receipt storage |
| `expense_categories` | Customizable categories with monthly budgets |
| `user_preferences` | User settings, business info, commission rates |
| `organizations` | Multi-tenant org support |

### New (US V1)

| Table | Purpose |
|-------|---------|
| `deals` | Unified deal record (lead → closing): deal_type, status, offer_price, closing_date, commission rates |
| `deal_milestones` | Transaction timeline milestones with due_date, status, responsible_party (enum: mutual_acceptance … closing_day) |
| `deal_documents` | Per-milestone document uploads linked to deal + milestone |
| `deal_parties` | Contact directory per deal: buyer, seller, lender, title_co, inspector, etc. |
| `deal_amendments` | Contract amendments log with effective_date |
| `buyer_agent_agreements` | Buyer-agent agreement tracker (post-NAR Aug 2024): commission_rate, expiration_date, exclusivity_type |
| `offers` | Offer tracking with counter-offer history (self-referencing counter_of FK) |
| `showing_logs` | Property showing records with buyer feedback (loved/interested/pass) |
| `applicant_screenings` | Rental applicant tracking: credit_check, background_check, income_verified, decision |

All tables have **Row Level Security** with `user_id` column. Standard RLS pattern:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select" ON table_name FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert" ON table_name FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update" ON table_name FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete" ON table_name FOR DELETE USING (auth.uid() = user_id);
```

---

## Environment Variables

```env
# Required — Vite client-side
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ENCRYPTION_KEY=64_hex_chars_32_bytes_for_AES256GCM
VITE_TURNSTILE_SITE_KEY=cloudflare_turnstile_key

# Supabase Edge Functions secrets (not Vite-prefixed)
# STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, OCR_SPACE_API_KEY
```

---

## Edge Functions (Supabase)

Called via `${VITE_SUPABASE_URL}/functions/v1/<name>`:

| Function | Purpose |
|----------|---------|
| `extract-contract-data-v2` | OCR text extraction from PDF/DOCX |
| `create-checkout-session` | Stripe subscription checkout |
| `create-portal-session` | Stripe customer portal |
| `stripe-webhook` | Handle Stripe events |
| `fetch-exchange-rates` | Auto-update exchange rates (legacy — USD is base currency in US build) |
| `send-invitation-email` | Org team invite emails |
| `extract-text` | Raw text extraction helper |

---

## Design System

- **Primary color**: `blue-600` (#2563EB)
- **Secondary**: `emerald-600` (#059669)
- **Dark mode**: Supported via `next-themes` and Tailwind `dark:` variants
- **Mobile-first**: 44px touch targets on mobile; card-based views < 768px, table layouts ≥ 768px
- **Color tokens**: Use `src/config/colors.ts` constants — never hardcode hex values directly
- **Status badges**: Use `getStatusBadgeClasses()` from `src/config/colors.ts`

---

## Security Rules

- **NEVER** commit `.env` files
- **NEVER** modify applied migration files — always add the next numbered file (`000N_...`). See **Database migrations (naming)**.
- Sensitive data (bank routing number, account number) must use `encrypt()` from `encryption.service.ts` before storing (AES-256-GCM)
- All user input must be validated with Zod before hitting the service layer
- Signed URLs (15 min expiry) for all PDF and photo access via Supabase Storage
- **CCPA compliance** required for California users — personal data access/deletion flows must be supported

---

## Common Gotchas

- **`database.ts` may be stale** — after schema changes, run `npm run gen:types`. If org/v2 tables are missing, check `database.types.ts` instead.
- **Property statuses differ by type**: Rental → `Empty | Occupied | Inactive`; Sale → `Available | Under Offer | Sold | Inactive`
- **i18n namespace must match file name**: `useTranslation('properties')` loads `public/locales/en/properties.json` (English is primary locale)
- **Photo limit**: Max 10 photos per property — enforced in application logic, not DB
- **PDF generation**: US PDFs use standard Latin fonts — no Turkish font setup needed for new features. Legacy contracts may still call `addTurkishFonts(doc)`.
- **Atomic contract creation**: Use `createContractWithEntities()` RPC to create owner + tenant + property + contract in one transaction — never create these entities separately
- **File upload limits**: 5MB max; allowed image types: `jpeg, jpg, png, webp`
- **Transaction Timeline auto-generation**: When an offer status → `Accepted`, the system must auto-create all `deal_milestones` rows with calculated due dates based on closing_date and contingency periods
- **Buyer-agent agreement required before showings** (post-NAR Aug 2024): Always check `buyer_agent_agreements` status before creating a `showing_log` entry
- **US state code**: Always store as 2-letter uppercase (e.g. `CA`, `TX`, `NY`) — validated at form layer
- **Lead paint disclosure**: Auto-include for properties with `year_built < 1978` — enforced in lease PDF generator
- **Deposit return deadline**: State-specific (CA: 21 days, NY: 14 days, TX: 30 days) — apply via state rules engine, not hardcoded

---

## Error Handling Pattern

User-facing errors use `useToast` — never `alert()` or bare `console.error`:

```typescript
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

try {
  await someService.doSomething();
} catch (err) {
  toast({
    title: t('error.title'),
    description: err instanceof Error ? err.message : t('error.unknown'),
    variant: 'destructive',
  });
}
```

---

## Data Fetching Pattern

Components **never** call services directly — always through a feature-local hook:

```
src/features/[feature-name]/hooks/use[FeatureName]Data.ts
```

The hook owns `loading`, `error`, and `data` state and calls the service. Components consume the hook. See `src/features/dashboard/hooks/useDashboardData.ts` as the canonical example.

---

## Billing / Access Gates

Use `useBilling()` from `BillingContext` to gate premium features:

```typescript
import { useBilling } from '@/contexts/BillingContext';

const { billingStatus } = useBilling();

if (!billingStatus?.hasActiveAccess) {
  // show upgrade prompt — do NOT render the feature
}
```

`hasActiveAccess` is `true` for active subscribers **and** users within their trial period. Check `ProtectedRoute.tsx` for the app-level gate pattern.

---

## Detailed Reference

See `@docs/design/claude.md` for full schema, service examples, type definitions, and feature deep-dives.
See `@docs/reference/ARCHITECTURE.md` for system architecture diagrams.
See `@docs/reference/API.md` for service/API documentation.
See `@CHANGELOG.md` for version history.
