# RealDesk CRM

Mobile-first real estate CRM for **US solo agents**: properties, rentals, deals (lead → closing), finance, and commissions on **React + Supabase**, packaged for **Cloudflare Pages**. Active development — wire your own Supabase project and deploy using the steps below.

## What it does

- **Runs the listing and rental stack in one app** — US-style addresses and property types, owners (sensitive bank fields encrypted at rest), tenants, and **atomic** tenant+contract creation so half-finished records do not land in Postgres.
- **Tracks purchase and lease deals end-to-end** — deal records, offer rounds and contingencies, transaction milestones and documents, parties, amendments, and notifications tied to the same `user_id` RLS boundary as the rest of the app.
- **Produces and ingests contract paperwork** — PDF generation (US templates), uploads to Supabase Storage with short-lived signed URLs, and **OCR/import** paths via Supabase Edge Functions for legacy PDF/DOCX.
- **Keeps money honest** — income/expense ledger, categories and recurring expenses, commission calculator and recording aligned with post-NAR buyer/listing-side thinking, plus dashboard and finance views built on the same transaction model.
- **Supports the front of the funnel** — lead/inquiry pipeline with property matching, calendar/meetings, buyer-agent agreements and showing logs where the product enforces your workflow rules.

## How I built this

The bulk of the codebase was built with **AI-orchestrated development**: **Cursor** for navigation and multi-file edits, **Claude** for schema/migrations, feature scaffolding, and refactors across `src/features/` and `src/services/`, and **Copilot** for small local completions. I owned what actually shipped: **Postgres/RLS policies** and migration order (`000N_slug.sql` convention), **Zod** boundaries at forms, the **service proxy** rule (consumers import from `src/lib/serviceProxy.ts` only), **English-only i18n** keys under `public/locales/en/`, and product scope for the US solo-agent workflow (deals, commissions, compliance-adjacent flows like buyer-agent agreements). AI drafts; I review diffs, run the app, and decide what merges.

## Tech stack

| Layer | Details |
|--------|---------|
| **Frontend** | React 18.3, TypeScript 5.5, Vite 5.4, React Router 7.9, Tailwind CSS 3.4, Radix UI, Lucide React, Framer Motion, React Hook Form + Zod, i18next (English namespaces in `public/locales/en/`) |
| **Backend** | Supabase (Auth, PostgreSQL, Row Level Security, Storage, Edge Functions/Deno) |
| **Database** | PostgreSQL via Supabase; sequential migrations in `supabase/migrations/` (see **Database Setup** and `CLAUDE.md`) |
| **Integrations** | Stripe (billing/checkout via Edge Functions), Cloudflare Turnstile (site key from env), OCR/text extraction endpoints as documented in `CLAUDE.md` |
| **Deployment** | Static build in `dist/`; **Cloudflare Pages** via Wrangler (`npm run deploy` / `deploy:prod`). Other hosts are covered in `docs/reference/DEPLOYMENT.md`. |

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)
![React](https://img.shields.io/badge/React-18.3-blue.svg)
![Supabase](https://img.shields.io/badge/Supabase-2.58-green.svg)

## Table of contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Mobile-First Design](#mobile-first-design)
- [Database Schema](#database-schema)
- [API & Services](#api--services)
- [Development](#development)
- [Build & Deployment](#build--deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Support](#support)

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** 9.x or higher (or **yarn** / **pnpm**)
- **Supabase account** - [Sign up here](https://supabase.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RealDesk-CRM
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   If `.env.example` is not present, create `.env` manually (see [Environment Variables](#environment-variables)).

4. **Configure environment variables** (see [Environment Variables](#environment-variables))

5. **Run database migrations** (see [Database Setup](#database-setup))

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:5173
   ```

### Environment Variables

Create a `.env` file in the root directory.

**Vite (client-side — required for local dev and production builds):**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_TURNSTILE_SITE_KEY=cloudflare_turnstile_site_key
```

You can find `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your Supabase project settings under **API** → **Project API keys**.

Sensitive-field encryption runs in authenticated Supabase Edge Functions using the server-only `FIELD_ENCRYPTION_KEY_V1` and `FIELD_ENCRYPTION_KEY_V2` secrets. `VITE_TURNSTILE_SITE_KEY` is used where Cloudflare Turnstile is wired in the app (e.g. public forms).

**Supabase Edge Functions (server-side secrets — not `VITE_` prefixed):**

Configure in the Supabase dashboard or CLI as needed for your deployment, for example:

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (billing)
- `OCR_SPACE_API_KEY` (or other OCR provider as used by your functions)

See **`CLAUDE.md` → Environment Variables** for the canonical list.

### Database Setup

The project uses Supabase with PostgreSQL. Database migrations are located in `supabase/migrations/`.

**Naming:** migrations are numbered sequentially: `0001_something.sql`, `0002_something.sql`, … (see root **`CLAUDE.md` → “Database migrations (naming)”**). Do not use `YYYYMMDDHHmmss` prefixes for new files in this repo.

#### Option 1: Using Supabase CLI

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Link your project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Run migrations**
   ```bash
   supabase db push
   ```

   Note: upstream CLI may skip `000N_*.sql` filenames; if so, use Option 2 or apply SQL manually in numeric order (see **CLAUDE.md**).

#### Option 2: Manual Migration

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Run the migration files **in numeric order** (`0001`, then `0002`, …)

#### Migration files

See `supabase/migrations/` — filenames are `0001_…`, `0002_…`, etc.

After schema changes, regenerate types:

```bash
npm run gen:types
```

### Running the Application

#### Development Mode

```bash
npm run dev
```

Starts the Vite dev server with hot module replacement (HMR).

#### Production Build

```bash
npm run build
```

Builds the app for production to the `dist` folder (TypeScript project build + Vite).

#### Preview Production Build

```bash
npm run preview
```

Preview the production build locally.

#### Type Checking

```bash
npm run typecheck
```

Run TypeScript type checking without emitting files (includes Vitest test files per project config).

#### Tests

```bash
npm run test
npm run test:watch
```

#### Linting

```bash
npm run lint
```

#### i18n audit

```bash
npm run check:translations
```

Audits `public/locales/en/*.json` (parse + no empty strings).

#### Cloudflare Pages (Wrangler)

```bash
npm run deploy       # build + deploy (staging/default project)
npm run deploy:prod  # build + deploy with production project name
```

Requires Wrangler configuration and Cloudflare credentials appropriate for your account.

## Project Structure

```
RealDesk-CRM/
├── public/
│   ├── locales/
│   │   └── en/                 # i18n JSON (English only; one file per namespace)
│   ├── manifest.json           # PWA manifest
│   └── …                       # Static assets
├── src/
│   ├── components/             # Shared UI only
│   │   ├── ui/                 # Radix-based primitives
│   │   ├── layout/             # MainLayout, Sidebar, Navbar, PageContainer
│   │   └── common/             # EmptyState, ErrorBoundary, Skeletons
│   ├── config/                 # colors.ts, constants.ts, supabase.ts
│   ├── contexts/               # AuthContext, OrgContext, BillingContext, …
│   ├── features/               # One folder per domain feature
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── properties/
│   │   ├── owners/
│   │   ├── tenants/
│   │   ├── contracts/          # Includes import wizard subfolder
│   │   ├── finance/
│   │   ├── inquiries/
│   │   ├── deals/
│   │   ├── leads/
│   │   ├── calendar/
│   │   ├── reminders/
│   │   ├── quick-add/
│   │   ├── profile/
│   │   ├── landing/
│   │   └── …                   # Other domains as present in repo
│   ├── hooks/
│   ├── lib/                    # auth, db, dates, rpc, currency, serviceProxy, …
│   ├── services/               # Supabase service classes (import via serviceProxy)
│   ├── types/                  # index.ts, database.ts (generated), contract.types.ts, …
│   ├── templates/              # PDF / contract text templates (US)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── migrations/             # 0001_foo.sql, 0002_bar.sql, …
│   └── functions/              # Deno Edge Functions
├── scripts/                    # e.g. check-translations.cjs
├── docs/                       # Documentation, drafts, samples
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── CLAUDE.md                   # Project conventions (migrations, stack, security)
```

## Key Features

### Enhanced Tenant Dialog

The tenant creation process includes a multi-step dialog that combines tenant information and contract creation in a single atomic operation:

1. **Tenant Information** - Basic tenant details
2. **Property & Contract Details** - Property assignment and contract specifics
3. **Contract Upload & Settings** - PDF upload and reminder configuration

This eliminates the need to navigate between separate pages, creating a streamlined workflow.

### Photo Management

- Upload up to 10 photos per property
- Drag-and-drop reordering
- Photo deletion
- Atomic photo ordering operations
- Storage in Supabase Storage

### Contract PDF Management

- **Generated PDFs** — US-oriented lease/purchase flows (see `src/templates/` and PDF services)
- **PDF Upload** — Upload existing contract PDFs
- **PDF Download** — Download contracts with signed URLs
- **Legacy Import** — Import existing contracts from PDF/DOCX with OCR (Edge Functions)
- Store in Supabase Storage
- Secure access with RLS policies

## Mobile-First Design

The application follows a mobile-first approach with the following optimizations:

### Touch Targets

- All buttons meet 44px minimum size on mobile
- Icon buttons sized appropriately for touch interaction
- Desktop sizes preserved using responsive classes

### Layouts

- **Mobile (< 768px)**: Card-based layouts for lists
- **Desktop (≥ 768px)**: Traditional table layouts
- Responsive form grids (1 column mobile, 2 columns desktop)

### Text Handling

- Consistent truncation patterns
- Responsive max-widths (smaller on mobile, larger on desktop)
- Line-clamping for long text

### PWA Features

- Manifest.json configured
- Theme color for browser chrome
- Apple iOS meta tags
- "Add to Home Screen" support

## Database Schema

### Core tables (US-adapted)

| Table | Purpose |
|-------|---------|
| `properties` | `property_type: 'rental' \| 'sale'`; US address fields (street, city, state, zip, MLS, year_built) |
| `property_owners` | Owners; routing/account numbers encrypted (AES-256-GCM) |
| `tenants` | Tenant profiles; US address fields |
| `contracts` | Rental contracts; links to `deal_id` where applicable; deposit fields |
| `contract_details` | Extra fields for PDF generation |
| `property_inquiries` | Lead pipeline + auto-matching |
| `inquiry_matches` | Match results |
| `meetings` | Calendar appointments |
| `commissions` | Dual-side commission tracking |
| `financial_transactions` | Income/expense ledger |
| `expense_categories` | Categories and budgets |
| `user_preferences` | Settings, business info, commission defaults |
| `organizations` | Multi-tenant org support |

### Deal and transaction tables (US V1)

| Table | Purpose |
|-------|---------|
| `deals` | Unified deal (lead → closing), offer/closing fields, commission rates |
| `deal_milestones` | Timeline milestones, due dates, responsible party |
| `deal_documents` | Documents per deal/milestone |
| `deal_parties` | Contacts on a deal (buyer, seller, lender, title, etc.) |
| `deal_amendments` | Amendment log |
| `buyer_agent_agreements` | Post-NAR buyer representation tracking |
| `offers` | Offers / counter-offers (`counter_of` self-FK) |
| `showing_logs` | Showings with buyer feedback |
| `applicant_screenings` | Rental applicant screening fields |

### Key relationships (simplified)

```
property_owners (1) ──┐
                      ├──> (many) properties (1) ──> (many) property_photos
                      │
properties (1) ────> (many) contracts (many) <─── (1) tenants
```

### Security

- Row Level Security (RLS) policies on tables (standard pattern: `auth.uid() = user_id` for CRUD)
- Secure file storage with access policies
- Authenticated user context for data access

For migration source of truth, see `supabase/migrations/` and **`CLAUDE.md`**.

## API & Services

The application uses a **service layer** pattern. For method-level documentation, see [docs/reference/API.md](./docs/reference/API.md).

### Service proxy

Import services **only** from `src/lib/serviceProxy.ts` (not directly from `src/services/*`) so mocks, swaps, and conventions stay centralized.

### Representative service modules

Includes (non-exhaustive): `properties`, `owners`, `tenants`, `contracts`, `contractPdf` / `contractPdfEngine`, `contractCreation`, `contractUpdate`, `textExtraction`, `photos`, `reminders`, `inquiries`, `leads`, `meetings`, `commissions`, `commissionCalculator`, `deals`, `dealParties`, `offerRounds`, `offerContingencies`, `timelineMilestones`, `buyerAgentAgreements`, `showingLogs`, `notifications`, `dailyBrief`, finance (`transactions`, `analytics`, `recurring`, `categories`, `exchangeRates`, `reportCalculator`), `billingService`, `stripeCheckout`, `userPreferences`, `encryption`, `organization`, and related helpers.

### RPC functions

The database includes RPCs for atomic and complex operations (e.g. tenant+contract creation, photo ordering). See [docs/reference/API.md](./docs/reference/API.md) and `src/lib/rpc.ts` / types for names and usage.

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Consistent component structure
- Feature-based folder organization
- Named exports only (no `export default` for app code — see `CLAUDE.md`)

### Adding a New Feature

1. Create feature folder in `src/features/`
2. Add service in `src/services/` and export through `src/lib/serviceProxy.ts`
3. Update routes in `src/config/constants.ts`
4. Add route in `src/App.tsx`
5. Add navigation item in `src/components/layout/Sidebar.tsx`
6. Add `public/locales/en/<namespace>.json` for UI strings

### Component Guidelines

- Use TypeScript for all components
- Follow the design system in `src/config/colors.ts`
- Use Radix UI components from `src/components/ui/`
- Implement responsive design patterns
- Add loading and empty states
- Handle errors gracefully (e.g. toast pattern in `CLAUDE.md`)

## Build & Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### Deployment

**Cloudflare Pages (this repo’s npm scripts):**

```bash
npm run deploy
npm run deploy:prod
```

Uses Wrangler after `npm run build`. Configure your Cloudflare project and secrets to match your setup.

**Other platforms:** For Vercel, Netlify, Supabase Hosting, GitHub Pages, S3/CloudFront, Docker, and troubleshooting, see [docs/reference/DEPLOYMENT.md](./docs/reference/DEPLOYMENT.md).

### Environment Variables for Production

Ensure your production environment includes at least:

```
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

For platform-specific deployment guides, troubleshooting, and best practices, see [docs/reference/DEPLOYMENT.md](./docs/reference/DEPLOYMENT.md).

## Documentation

| Audience | Start here |
|----------|------------|
| **Developers (human)** | This README → [docs/README.md](./docs/README.md) |
| **Coding agents** | [AGENTS.md](./AGENTS.md) → [CLAUDE.md](./CLAUDE.md) |

**Index:** [docs/README.md](./docs/README.md) — reference, planning, archive, research, samples.

**Core references**

- [CHANGELOG.md](./CHANGELOG.md) — release notes
- [CLAUDE.md](./CLAUDE.md) — commands, migrations, conventions, gotchas
- [AGENTS.md](./AGENTS.md) — agent workflow, verify commands, safety rules
- [docs/reference/CURRENT_ARCHITECTURE.md](./docs/reference/CURRENT_ARCHITECTURE.md) — system architecture (current)
- [docs/reference/ARCHITECTURE.md](./docs/reference/ARCHITECTURE.md) — architecture diagrams
- [docs/reference/API.md](./docs/reference/API.md) — services
- [docs/reference/DEPLOYMENT.md](./docs/reference/DEPLOYMENT.md) — deploy guides
- [docs/reference/CONTRIBUTING.md](./docs/reference/CONTRIBUTING.md) — contributing
- [docs/design/claude.md](./docs/design/claude.md) — UI / design rulebook

**Product & history**

- [docs/research/RealDesk_Product_Workflow_Document.md](./docs/research/RealDesk_Product_Workflow_Document.md) — product workflow
- [docs/planning/TEAM_COMMISSION_KPI_PLAN.md](./docs/planning/TEAM_COMMISSION_KPI_PLAN.md) — active plan (see [docs/planning/README.md](./docs/planning/README.md))
- [docs/archive/turkish-market/EmlakCRM_Portfolio.md](./docs/archive/turkish-market/EmlakCRM_Portfolio.md) — legacy portfolio narrative
- [docs/archive/completed/planning/onboarding-migration-analysis.md](./docs/archive/completed/planning/onboarding-migration-analysis.md) — archived onboarding review
- [docs/security/SECURITY_INCIDENT_REPORT.md](./docs/security/SECURITY_INCIDENT_REPORT.md) — security incident record

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./docs/reference/CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Coding standards
- Commit guidelines
- Pull request process

### Quick Start for Contributors

1. Fork the repository
2. Read [docs/reference/CONTRIBUTING.md](./docs/reference/CONTRIBUTING.md)
3. Create a feature branch (`git checkout -b feature/amazing-feature`)
4. Make your changes following our coding standards
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

For detailed guidelines, see [docs/reference/CONTRIBUTING.md](./docs/reference/CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Radix UI](https://www.radix-ui.com) - Accessible component primitives
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Vite](https://vitejs.dev) - Frontend tooling
- [React](https://react.dev) - UI library

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.
