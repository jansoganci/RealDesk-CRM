# 🏢 Emlak CRM - Technical Summary

**Last Updated:** January 2025  
**Version:** 1.1.1  
**Project Type:** Real Estate CRM SaaS Application

---

## 📋 Executive Summary

Emlak CRM is a modern, mobile-first Real Estate Customer Relationship Management system built for Turkish real estate agents. The application is a full-stack TypeScript/React application using Supabase as the backend-as-a-service platform, deployed on Cloudflare Pages.

**Key Characteristics:**
- **Architecture:** Single Page Application (SPA) with serverless backend
- **Deployment:** Static frontend (Cloudflare Pages) + Supabase backend
- **Database:** PostgreSQL (via Supabase) with Row Level Security (RLS)
- **Authentication:** Supabase Auth with JWT tokens
- **Multi-tenancy:** Organization-based with role-based access control

---

## 🛠️ Core Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI library |
| **TypeScript** | 5.5.3 | Type safety |
| **Vite** | 5.4.8 | Build tool & dev server |
| **React Router** | 7.9.4 | Client-side routing |
| **Tailwind CSS** | 3.4.13 | Utility-first CSS framework |
| **Radix UI** | Various | Accessible component primitives |
| **React Hook Form** | 7.53.0 | Form management |
| **Zod** | 3.23.8 | Schema validation |
| **i18next** | 25.6.0 | Internationalization (TR/EN) |
| **date-fns** | 3.6.0 | Date utilities |
| **Chart.js** | 4.5.1 | Data visualization |
| **jsPDF** | 3.0.4 | PDF generation |

### Backend & Infrastructure

| Service | Purpose |
|---------|---------|
| **Supabase** | Backend-as-a-Service platform |
| - PostgreSQL Database | Primary data store |
| - Row Level Security (RLS) | Data access control |
| - Storage | File storage (photos, PDFs) |
| - Authentication | User auth & session management |
| - Edge Functions | Serverless functions (Deno runtime) |
| **Cloudflare Pages** | Static site hosting & CDN |
| **Wrangler** | Cloudflare deployment tool |

### Development Tools

- **ESLint** - Code linting
- **TypeScript** - Type checking (`tsc --noEmit`)
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

---

## 🔌 Third-Party Service Integrations

### 1. **Supabase** (Primary Backend)
- **Database:** PostgreSQL with RLS policies
- **Storage Buckets:**
  - `property-photos` - Property images (up to 10 per property)
  - `contract-pdfs` - Contract documents
- **Edge Functions:**
  - `extract-contract-data-v2` - PDF/DOCX text extraction with OCR
  - `fetch-exchange-rates` - Daily currency exchange rate fetching
  - `create-checkout-session` - Stripe checkout session creation
  - `stripe-webhook` - Stripe webhook handler (subscription events)

### 2. **OCR.space API** (Text Extraction)
- **Purpose:** OCR for scanned PDF contracts
- **Integration:** Via Supabase Edge Function
- **Usage:** Fallback when digital PDF text extraction fails
- **Configuration:** Free tier API key (500 requests/day) or custom key via `OCR_SPACE_API_KEY`
- **Location:** `supabase/functions/extract-contract-data-v2/index.ts`

### 3. **Stripe** (Payment Processing)
- **Purpose:** Subscription billing and payment processing
- **Features:**
  - Checkout sessions for new subscriptions
  - Customer portal for subscription management
  - Webhook handlers for subscription events
- **Tables:**
  - `stripe_customers` - Stripe customer mapping
  - `subscriptions` - Subscription data
  - `user_billing` - User billing status
- **Services:**
  - `stripeCheckout.service.ts` - Checkout session creation
  - `billingService.ts` - Billing status management

### 4. **Exchange Rate APIs** (Currency Conversion)
- **Purpose:** Multi-currency support for financial transactions
- **Implementation:** Via Supabase Edge Function (`fetch-exchange-rates`)
- **Storage:** `exchange_rates` table with historical rates
- **Currencies:** TRY (base), USD, EUR
- **Service:** `exchangeRates.service.ts`

### 5. **Google Tag Manager (GTM)** (Analytics)
- **Purpose:** Analytics and tracking
- **Implementation:** Consent Mode v2 with cookie consent
- **Location:** `src/lib/gtmConsent.ts`, `src/components/GTMPageViewTracker.tsx`

### 6. **No Digital Ocean Integration**
- **Note:** No Digital Ocean Spaces or services found in codebase
- **Storage:** All files stored in Supabase Storage

---

## 📁 Main Folder Structure

```
emlak-crm/
├── public/                          # Static assets
│   ├── locales/                     # i18n translation files (tr/en)
│   ├── manifest.json                # PWA manifest
│   └── vite.svg                     # App icon
│
├── src/
│   ├── assets/                      # Fonts and static assets
│   │   └── fonts/                    # Custom fonts (Roboto)
│   │
│   ├── components/                  # Reusable UI components
│   │   ├── common/                  # Common components
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── skeletons/           # Loading skeletons
│   │   ├── layout/                  # Layout components
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navbar.tsx
│   │   ├── ui/                      # Base UI components (Radix UI)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   └── ... (45 components)
│   │   └── templates/               # Page templates
│   │       └── ListPageTemplate.tsx
│   │
│   ├── config/                      # Configuration files
│   │   ├── colors.ts                # Design tokens
│   │   ├── constants.ts             # App constants & routes
│   │   ├── supabase.ts              # Supabase client
│   │   └── chart.ts                 # Chart.js config
│   │
│   ├── contexts/                    # React Context providers
│   │   ├── AuthContext.tsx          # Authentication state
│   │   ├── OrgContext.tsx           # Organization state
│   │   ├── BillingContext.tsx       # Billing/subscription state
│   │   └── NotificationContext.tsx  # Notifications
│   │
│   ├── features/                    # Feature modules (feature-based)
│   │   ├── auth/                    # Authentication
│   │   ├── dashboard/               # Dashboard
│   │   ├── properties/              # Properties management
│   │   ├── owners/                  # Owners management
│   │   ├── tenants/                 # Tenants management
│   │   ├── contracts/               # Rental contracts
│   │   │   └── import/              # Legacy contract import (OCR)
│   │   ├── contractsHub/            # Contracts hub (entry point)
│   │   ├── contractsSale/           # Sale contracts (v2)
│   │   ├── reminders/               # Reminders system
│   │   ├── finance/                 # Financial tracking
│   │   ├── calendar/                # Calendar & meetings
│   │   ├── inquiries/               # Property inquiries
│   │   ├── organization/            # Team/organization management
│   │   ├── profile/                 # User profile
│   │   ├── billing/                 # Billing/subscription
│   │   ├── onboarding/              # User onboarding
│   │   └── landing/                 # Landing pages
│   │
│   ├── services/                    # API service layer
│   │   ├── properties.service.ts
│   │   ├── owners.service.ts
│   │   ├── tenants.service.ts
│   │   ├── contracts.service.ts
│   │   ├── organization.service.ts
│   │   ├── finance/                 # Finance services
│   │   │   ├── transactions.service.ts
│   │   │   ├── exchangeRates.service.ts
│   │   │   └── ...
│   │   ├── stripeCheckout.service.ts
│   │   ├── textExtraction.service.ts
│   │   └── ...
│   │
│   ├── lib/                         # Utility libraries
│   │   ├── auth.ts                  # Auth helpers
│   │   ├── db.ts                    # Database helpers
│   │   ├── rpc.ts                   # RPC function helpers
│   │   ├── currency.ts              # Currency utilities
│   │   ├── dates.ts                 # Date utilities
│   │   ├── utils.ts                 # General utilities
│   │   └── serviceProxy.ts          # Service exports
│   │
│   ├── types/                       # TypeScript type definitions
│   │   ├── database.ts              # Database types (generated)
│   │   ├── database.types.ts        # Supabase types
│   │   ├── org.ts                   # Organization types
│   │   ├── financial.ts             # Finance types
│   │   └── ...
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useCurrencyConversion.ts
│   │   ├── useMediaQuery.ts
│   │   └── ...
│   │
│   ├── App.tsx                      # Main App component (routing)
│   ├── main.tsx                     # Application entry point
│   └── index.css                    # Global styles
│
├── supabase/
│   ├── functions/                    # Edge Functions (Deno)
│   │   ├── extract-contract-data-v2/
│   │   ├── fetch-exchange-rates/
│   │   └── create-checkout-session/
│   └── migrations/                  # Database migrations (SQL)
│       ├── 20251027*.sql            # Initial tables
│       ├── 20251231*.sql            # Organization system
│       └── 20260109*.sql            # Security fixes
│
├── docs/                            # Documentation
├── scripts/                         # Utility scripts
├── functions/                       # Cloudflare Functions (if any)
├── dist/                            # Production build output
│
├── package.json                     # Dependencies & scripts
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
├── wrangler.toml                    # Cloudflare Pages config
└── tailwind.config.js               # Tailwind CSS config
```

---

## 🎯 Key Features & Current State

### ✅ Core Features (Implemented)

#### 1. **Properties Management**
- ✅ Create, edit, delete properties
- ✅ Photo management (up to 10 photos per property)
- ✅ Property status tracking (Empty, Occupied, Inactive)
- ✅ Location management (City, District)
- ✅ Photo upload, reordering, deletion
- ✅ Property-owner relationships

#### 2. **Owners Management**
- ✅ Owner profiles with contact information
- ✅ Address management
- ✅ Property count tracking
- ✅ Owner-property relationships

#### 3. **Tenants Management**
- ✅ Comprehensive tenant profiles
- ✅ Contact information (phone, email)
- ✅ Property assignment
- ✅ Enhanced tenant dialog with contract creation
- ✅ Multi-step form (Tenant Info → Contract Details → Settings)

#### 4. **Contracts Management**
- ✅ **Rental Contracts:**
  - Create, edit, delete rental contracts
  - Auto-generated PDFs with Turkish template
  - PDF upload and storage
  - Legacy contract import from PDF/DOCX (OCR-based)
  - Start/end date tracking
  - Multi-currency support (TRY, USD, EUR)
  - Contract status (Active, Archived, Inactive)
  - Rent increase reminders
  - Expiration warnings (30 days before expiry)
- ✅ **Sale Contracts (v2):**
  - Sale contract builder
  - Editable clauses system
  - PDF generation for sale contracts

#### 5. **Reminders System**
- ✅ Contract expiration reminders
- ✅ Rent increase notifications
- ✅ Reminder settings per contract
- ✅ Visual indicators for upcoming/overdue reminders

#### 6. **Finance Management**
- ✅ Income and expense tracking
- ✅ Multi-currency support (TRY, USD, EUR)
- ✅ Expense categorization with custom categories
- ✅ Recurring expenses management
- ✅ Budget tracking per category
- ✅ Financial analytics and reports
- ✅ Receipt upload and storage
- ✅ Property and contract linkage
- ✅ Exchange rate management (historical rates)

#### 7. **Calendar & Meetings**
- ✅ Meeting and appointment scheduling
- ✅ Property viewings management
- ✅ Tenant and client associations
- ✅ Location tracking
- ✅ Calendar view interface

#### 8. **Commissions Tracking**
- ✅ Sales commission tracking
- ✅ Rental commission management
- ✅ Multi-currency support
- ✅ Commission history and reports

#### 9. **Property Inquiries**
- ✅ Lead management system
- ✅ Property matching algorithm
- ✅ Client requirements tracking
- ✅ Inquiry status management

#### 10. **Organization Management**
- ✅ Multi-user organization support
- ✅ Team member management
- ✅ Role-based access control (Owner, Member)
- ✅ Member invitation system
- ✅ Organization settings

#### 11. **User Management**
- ✅ Authentication (email/password, Google OAuth)
- ✅ User preferences (language, currency, etc.)
- ✅ Profile management
- ✅ Onboarding flow

#### 12. **Billing & Subscriptions**
- ✅ Stripe integration
- ✅ Subscription management
- ✅ Trial period support
- ✅ Billing status tracking

### 🔄 Recent Changes (Based on Git Status)

**New Features:**
- Recurring expenses system
- Organization/team management
- Security fixes for RLS policies

**Modified Files:**
- `src/App.tsx` - Routing updates
- `src/config/constants.ts` - Route constants
- `src/config/supabase.ts` - Supabase config
- `src/features/finance/FinanceDashboard.tsx` - Finance updates
- `src/services/organization.service.ts` - Organization service
- `src/types/org.ts` - Organization types

**New Migrations:**
- Security verification tests
- Organization membership fixes
- Contract RPC security fixes
- Storage policy fixes

---

## 🚪 Application Entry Points

### 1. **Main Entry Point**
**File:** `src/main.tsx`
```typescript
- Initializes React app
- Sets up GTM Consent Mode v2
- Renders App component
```

### 2. **Application Root**
**File:** `src/App.tsx`
```typescript
- Sets up React Router
- Configures route definitions
- Wraps app with context providers:
  - HelmetProvider (SEO)
  - ErrorBoundary
  - AuthProvider
  - OrgProvider
  - BillingProvider
  - NotificationProvider
- Initializes exchange rates on startup
```

### 3. **Route Structure**
**File:** `src/config/constants.ts` (ROUTES object)

**Public Routes:**
- `/` - Landing page
- `/login` - Login
- `/register` - Registration
- `/pricing` - Pricing page
- `/about` - About page
- `/contact` - Contact page

**Protected Routes:**
- `/dashboard` - Main dashboard
- `/properties` - Properties list
- `/owners` - Owners list
- `/tenants` - Tenants list
- `/contracts` - Contracts hub
- `/contracts/rent` - Rental contracts
- `/contracts/sale` - Sale contracts
- `/reminders` - Reminders
- `/finance` - Finance dashboard
- `/calendar` - Calendar
- `/inquiries` - Property inquiries
- `/profile` - User profile
- `/team` - Team members
- `/onboarding` - Onboarding flow
- `/billing/subscribe` - Billing subscription

### 4. **Authentication Flow**
1. User visits `/login` or `/register`
2. `AuthContext` manages authentication state
3. `ProtectedRoute` component checks authentication
4. On success, redirects to `/dashboard`
5. Session stored in Supabase Auth (JWT tokens)

---

## 🔄 Primary Data Flow

### **Read Operation Flow**

```
1. User Action (e.g., View Properties)
   ↓
2. Component calls service method
   (e.g., propertiesService.getAll())
   ↓
3. Service method calls Supabase client
   (supabase.from('properties').select())
   ↓
4. Supabase queries database with RLS
   (Row Level Security policies applied)
   ↓
5. Database returns filtered data
   (based on user's org_id)
   ↓
6. Service transforms/validates data
   ↓
7. Component receives data and renders
   ↓
8. React updates UI
```

### **Write Operation Flow**

```
1. User Action (e.g., Create Property)
   ↓
2. Form validation (Zod schema)
   ↓
3. Component calls service method
   (e.g., propertiesService.create())
   ↓
4. Service validates and enriches data
   (adds user_id, org_id, timestamps)
   ↓
5. Service calls Supabase
   (supabase.from('properties').insert())
   ↓
6. Supabase validates with RLS policies
   (checks user permissions)
   ↓
7. Database transaction executes
   ↓
8. Service returns result
   ↓
9. Component shows success/error notification
   (Toast notification via Sonner)
   ↓
10. UI updates (optimistic or refetch)
```

### **Authentication Flow**

```
1. User submits login form
   ↓
2. AuthContext.signIn() called
   ↓
3. Supabase Auth API called
   (supabase.auth.signInWithPassword())
   ↓
4. Supabase validates credentials
   ↓
5. JWT token generated
   ↓
6. Session stored in localStorage
   ↓
7. AuthContext updates state
   ↓
8. User redirected to /dashboard
   ↓
9. Protected routes now accessible
```

### **Organization Context Flow**

```
1. User logs in
   ↓
2. OrgContext.refreshOrg() called
   ↓
3. Queries org_members table
   (finds user's active organization)
   ↓
4. Loads organization data
   (name, settings, etc.)
   ↓
5. Sets currentOrg and membership state
   ↓
6. All subsequent queries filter by org_id
   (via RLS policies)
```

### **File Upload Flow (Photos/PDFs)**

```
1. User selects file
   ↓
2. File validated (type, size)
   ↓
3. Service method called
   (e.g., photosService.upload())
   ↓
4. File uploaded to Supabase Storage
   (supabase.storage.from('bucket').upload())
   ↓
5. Storage policy validates access
   ↓
6. File metadata saved to database
   (e.g., property_photos table)
   ↓
7. Public URL generated (signed URL)
   ↓
8. Component receives URL and displays file
```

### **Contract PDF Generation Flow**

```
1. User creates/edits contract
   ↓
2. Contract data validated
   ↓
3. contractPdf.service.generatePdf() called
   ↓
4. PDF generated using jsPDF
   (Turkish template with fonts)
   ↓
5. PDF uploaded to Supabase Storage
   (contract-pdfs bucket)
   ↓
6. Database record updated with PDF path
   ↓
7. User can download/view PDF
```

### **OCR Text Extraction Flow**

```
1. User uploads PDF/DOCX for import
   ↓
2. extractTextFromFileViaProxy() called
   ↓
3. File sent to Supabase Edge Function
   (extract-contract-data-v2)
   ↓
4. Edge Function:
   - Attempts digital extraction (officeparser)
   - If fails, uses OCR.space API
   ↓
5. Extracted text returned
   ↓
6. parseContractFromText() parses data
   (regex patterns for Turkish contracts)
   ↓
7. Parsed data populated in form
   ↓
8. User reviews and confirms
```

---

## 🔐 Security Architecture

### **Row Level Security (RLS)**
- All tables have RLS enabled
- Policies filter data by `org_id` and `user_id`
- Users can only access data from their organization

### **Authentication**
- JWT tokens via Supabase Auth
- Session management with auto-refresh
- Protected routes check authentication

### **Data Encryption**
- Sensitive data (TC, IBAN) encrypted at rest
- Encryption service: `encryption.service.ts`
- Uses AES encryption with user-specific keys

### **File Storage Security**
- Storage buckets have access policies
- Signed URLs for temporary access
- Files scoped to user's organization

---

## 📊 Database Schema Overview

### **Core Tables**
- `organizations` - Organization data
- `org_members` - Organization membership
- `property_owners` - Property owners
- `properties` - Properties
- `property_photos` - Property photos
- `tenants` - Tenants
- `contracts` / `contract_details` - Rental contracts
- `sale_contracts` - Sale contracts
- `meetings` - Calendar appointments
- `property_inquiries` - Lead inquiries
- `commissions` - Commission tracking
- `financial_transactions` - Income/expenses
- `expense_categories` - Expense categories
- `recurring_expenses` - Recurring expenses
- `exchange_rates` - Currency exchange rates
- `user_preferences` - User settings
- `user_billing` - Billing status
- `stripe_customers` - Stripe customer mapping
- `subscriptions` - Stripe subscriptions

### **Key Relationships**
```
organizations (1) ──> (many) org_members
org_members (1) ──> (1) users (via user_id)

property_owners (1) ──> (many) properties
properties (1) ──> (many) property_photos
properties (1) ──> (many) contracts
tenants (1) ──> (many) contracts
```

---

## 🚀 Deployment

### **Build Process**
```bash
npm run build
# - TypeScript compilation (tsc -b)
# - Vite production build
# - Output: dist/ folder
```

### **Deployment**
```bash
npm run deploy
# - Builds application
# - Deploys to Cloudflare Pages via Wrangler
```

### **Environment Variables**
Required in production:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

Supabase Edge Functions require:
- `OCR_SPACE_API_KEY` - OCR.space API key (optional)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

---

## 📝 Development Workflow

### **Adding a New Feature**
1. Create feature folder in `src/features/`
2. Add service in `src/services/`
3. Update routes in `src/config/constants.ts`
4. Add route in `src/App.tsx`
5. Add navigation item in `src/components/layout/Sidebar.tsx`
6. Create database migration if needed

### **Database Migrations**
- Location: `supabase/migrations/`
- Naming: `YYYYMMDDHHMMSS_description.sql`
- Run via Supabase CLI: `supabase db push`

### **Type Generation**
```bash
npm run gen:types
# Generates TypeScript types from Supabase schema
# Output: src/types/database.ts
```

---

## 🔍 Debugging Tips

### **Common Entry Points for Debugging**

1. **Authentication Issues:**
   - Check `src/contexts/AuthContext.tsx`
   - Verify Supabase Auth configuration
   - Check session storage in browser DevTools

2. **Data Fetching Issues:**
   - Check service files in `src/services/`
   - Verify RLS policies in Supabase dashboard
   - Check network tab for API errors

3. **Organization Context Issues:**
   - Check `src/contexts/OrgContext.tsx`
   - Verify `org_members` table data
   - Check RLS policies on `organizations` table

4. **File Upload Issues:**
   - Check storage bucket policies
   - Verify file size/type validation
   - Check Supabase Storage logs

5. **PDF Generation Issues:**
   - Check `src/services/contractPdf.service.ts`
   - Verify font loading
   - Check PDF template in `src/templates/`

---

## 📚 Additional Resources

- **Architecture Docs:** `docs/ARCHITECTURE.md`
- **API Documentation:** `docs/API.md`
- **Deployment Guide:** `DEPLOYMENT.md`
- **Contributing Guide:** `docs/CONTRIBUTING.md`
- **Design System:** `docs/design/claude.md`, `docs/design/EmlakCRM_Tasarim_Sistemi_Analizi.md`

---

**Document Generated:** January 2025  
**For:** Development team reference and onboarding
