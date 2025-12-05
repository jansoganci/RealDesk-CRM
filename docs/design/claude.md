# Claude Code - Real Estate CRM Technical Documentation

## Project Overview

**Real Estate CRM** (Emlak CRM) is a comprehensive, mobile-first Customer Relationship Management system designed specifically for Turkish real estate agents. The application helps manage properties (both rental and sale), owners, tenants, contracts with PDF generation, financial transactions, commissions, appointments, and property inquiries through an intuitive, responsive interface optimized for mobile devices.

### Key Information
- **Name**: Real Estate CRM (Emlak CRM - "emlak" means real estate in Turkish)
- **Version**: 1.1.0
- **Type**: Single Page Application (SPA) with PWA support
- **Target Users**: Turkish real estate agents and agencies
- **Primary Language**: Turkish (with English i18n support)
- **License**: MIT
- **Database**: 13 tables, 42 migrations
- **Services**: 23 service classes

---

## Technology Stack

### Frontend Core
- **React 18.3** - Modern UI library with hooks and concurrent features
- **TypeScript 5.5** - Full type safety across the application
- **Vite 5.4** - Lightning-fast build tool and development server
- **React Router 7.9** - Client-side routing with protected routes

### UI Framework & Design
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled component primitives (60+ components)
- **Lucide React** - Comprehensive icon library (446+ icons)
- **Sonner** - Beautiful toast notifications
- **class-variance-authority** - Component variant management
- **next-themes** - Theme management (supports dark mode)
- **Framer Motion 12.23** - Animation library

### Forms & Validation
- **React Hook Form 7.53** - Performant form management
- **Zod 3.23** - TypeScript-first schema validation
- **@hookform/resolvers** - Integration between RHF and Zod

### Backend & Database
- **Supabase 2.58** - Backend as a Service (BaaS)
  - PostgreSQL database
  - Row Level Security (RLS) for data protection
  - Supabase Storage for photos, PDFs, and receipts
  - Supabase Auth for authentication
  - Real-time subscriptions (available but not currently used)

### PDF Generation
- **jsPDF 2.5** - PDF document generation
- **jspdf-autotable** - Table generation for PDFs

### Internationalization
- **i18next 25.6** - i18n framework
- **react-i18next 16.2** - React bindings for i18next
- **i18next-browser-languagedetector** - Automatic language detection
- **i18next-http-backend** - Load translations from server
- **18 translation namespaces** - Complete TR/EN coverage

### Other Libraries
- **date-fns 3.6** - Modern date utility library
- **recharts 2.12** - Composable charting library
- **chart.js 4.5** - Alternative charting library
- **embla-carousel-react 8.3** - Lightweight carousel
- **react-resizable-panels 2.1** - Resizable panel layouts
- **vaul 1.0** - Drawer component for mobile

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       React Frontend                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Feature-based Components                 │  │
│  │  (properties, owners, tenants, contracts, etc.)      │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Service Proxy Layer                      │  │
│  │  (Central export point for 23 services)              │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Service Layer                            │  │
│  │  (Business logic and Supabase API calls)             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │   Storage    │  │     Auth     │    │
│  │  (13 tables) │  │ (Photos/PDFs)│  │  (Sessions)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
emlak-crm/
├── public/                      # Static assets
│   ├── locales/                 # i18n translation files (18 namespaces)
│   │   ├── tr/                  # Turkish translations
│   │   └── en/                  # English translations
│   └── manifest.json            # PWA manifest
│
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── calendar/            # Calendar-specific components
│   │   ├── common/              # Common components (EmptyState, ErrorBoundary, Skeletons)
│   │   ├── dashboard/           # Dashboard components (StatCard)
│   │   ├── layout/              # Layout components
│   │   │   ├── MainLayout.tsx   # Main app layout wrapper
│   │   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   │   ├── Navbar.tsx       # Top navigation bar
│   │   │   └── PageContainer.tsx # Page wrapper component
│   │   ├── properties/          # Property-related components (PhotoGallery, PhotoManagement)
│   │   ├── templates/           # Page templates (ListPageTemplate)
│   │   └── ui/                  # Base UI components (60 Radix UI components)
│   │
│   ├── config/                  # Configuration files
│   │   ├── colors.ts            # Design system color tokens
│   │   ├── constants.ts         # App-wide constants and routes
│   │   └── supabase.ts          # Supabase client configuration
│   │
│   ├── contexts/                # React contexts
│   │   └── AuthContext.tsx      # Authentication state management
│   │
│   ├── features/                # Feature modules (14 features)
│   │   ├── auth/                # Authentication (Login)
│   │   ├── calendar/            # Calendar and meetings
│   │   ├── contracts/           # Contract management with PDF
│   │   │   ├── components/      # Contract-specific components
│   │   │   │   ├── form-sections/  # Form sections (Owner, Tenant, Contract)
│   │   │   │   ├── AddressInput.tsx
│   │   │   │   ├── ConfirmationDialog.tsx
│   │   │   │   ├── ContractCreateForm.tsx
│   │   │   │   ├── ContractImportBanner.tsx
│   │   │   │   ├── ContractPdfActionButtons.tsx
│   │   │   │   └── ContractStatusBadge.tsx
│   │   │   ├── hooks/           # Contract hooks
│   │   │   ├── import/          # Legacy contract import (PDF/DOCX)
│   │   │   │   ├── components/  # Import step components
│   │   │   │   └── ContractImportPage.tsx
│   │   │   ├── ContractCreate.tsx
│   │   │   └── Contracts.tsx
│   │   ├── dashboard/           # Dashboard with statistics
│   │   ├── finance/             # Financial tracking
│   │   │   ├── components/      # Finance-specific components
│   │   │   └── utils/           # Finance utility functions
│   │   ├── inquiries/           # Property inquiries (rental & sale)
│   │   ├── landing/             # Landing page
│   │   ├── owners/              # Property owner management
│   │   ├── profile/             # User profile settings
│   │   ├── properties/          # Property management (rental & sale)
│   │   │   ├── components/      # Property components
│   │   │   └── hooks/           # Property hooks
│   │   ├── quick-add/           # Quick entity creation
│   │   ├── reminders/           # Reminder system
│   │   └── tenants/             # Tenant management
│   │       ├── components/      # Tenant components
│   │       ├── hooks/           # Tenant hooks
│   │       └── steps/           # Multi-step tenant creation
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-toast.ts         # Toast notification hook
│   │   └── useMeetingNotifications.ts
│   │
│   ├── lib/                     # Utility functions and helpers
│   │   ├── auth.ts              # Authentication utilities
│   │   ├── dates.ts             # Date formatting and manipulation
│   │   ├── db.ts                # Database helper functions
│   │   ├── rpc.ts               # RPC function helpers
│   │   ├── serviceProxy.ts      # Service abstraction layer
│   │   └── utils.ts             # General utility functions
│   │
│   ├── services/                # API service layers (23 services)
│   │   ├── address.service.ts
│   │   ├── commissions.service.ts
│   │   ├── contracts.service.ts
│   │   ├── contractCreation.service.ts
│   │   ├── contractPdf.service.ts
│   │   ├── duplicateCheck.service.ts
│   │   ├── encryption.service.ts
│   │   ├── financialTransactions.service.ts
│   │   ├── inquiries.service.ts
│   │   ├── meetings.service.ts
│   │   ├── owners.service.ts
│   │   ├── pdfFonts.service.ts
│   │   ├── phone.service.ts
│   │   ├── photos.service.ts
│   │   ├── properties.service.ts
│   │   ├── reminders.service.ts
│   │   ├── tenants.service.ts
│   │   ├── textExtraction.service.ts
│   │   ├── userPreferences.service.ts
│   │   └── finance/
│   │       ├── index.ts
│   │       ├── analytics.service.ts
│   │       ├── categories.service.ts
│   │       ├── recurring.service.ts
│   │       └── transactions.service.ts
│   │
│   ├── templates/               # PDF contract templates
│   │   └── contractContent.ts   # Turkish contract text (Genel/Özel Şartlar)
│   │
│   ├── types/
│   │   ├── database.ts          # Auto-generated Supabase types
│   │   ├── index.ts             # Application-wide types
│   │   ├── contract.types.ts    # Contract management types
│   │   └── rpc.ts               # RPC function types
│   │
│   ├── App.tsx                  # Main App component with routes
│   ├── main.tsx                 # Application entry point
│   ├── i18n.ts                  # i18n configuration
│   └── index.css                # Global styles
│
├── supabase/
│   └── migrations/              # 42 migration files
│
├── .claude/
│   ├── commands/                # 7 slash commands
│   └── hooks/                   # Automation hooks
│
└── CLAUDE.md                    # This file
```

---

## Database Schema (13 Tables)

### 1. property_owners
Stores information about property owners with encrypted sensitive data.

```sql
CREATE TABLE property_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  tc_encrypted text,           -- AES-256-GCM encrypted TC Kimlik No
  tc_hash text,                -- SHA-256 hash for duplicate detection
  iban_encrypted text,         -- AES-256-GCM encrypted IBAN
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX property_owners_name_idx ON property_owners(name);
CREATE INDEX idx_owners_tc_hash ON property_owners(tc_hash);

-- RLS Policies
ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own owners" ON property_owners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own owners" ON property_owners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own owners" ON property_owners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own owners" ON property_owners FOR DELETE USING (auth.uid() = user_id);
```

### 2. properties
Central table for property management with rental/sale separation.

```sql
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  owner_id uuid NOT NULL REFERENCES property_owners(id) ON DELETE CASCADE,
  property_type text NOT NULL DEFAULT 'rental',  -- 'rental' | 'sale'
  address text NOT NULL,
  city text,
  district text,
  status text NOT NULL DEFAULT 'Empty',
  -- Rental statuses: 'Empty' | 'Occupied' | 'Inactive'
  -- Sale statuses: 'Available' | 'Under Offer' | 'Sold' | 'Inactive'
  listing_url text,
  rent_amount numeric(10,2),   -- For rental properties
  sale_price numeric(10,2),    -- For sale properties
  currency text DEFAULT 'TRY',
  notes text,

  -- Component-based address (for contract PDF generation)
  mahalle text,                -- Neighborhood
  cadde_sokak text,            -- Street/Avenue
  bina_no text,                -- Building number
  daire_no text,               -- Apartment number
  ilce text,                   -- District
  il text,                     -- City/Province
  full_address text,           -- Generated full address
  normalized_address text,     -- For matching
  type text DEFAULT 'apartment',  -- 'apartment' | 'house' | 'commercial'
  use_purpose text,            -- 'Mesken' | 'İşyeri'

  -- Sale-specific fields
  buyer_name text,
  buyer_phone text,
  buyer_email text,
  offer_date timestamptz,
  offer_amount numeric,
  sold_at timestamptz,
  sold_price numeric,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_property_status CHECK (
    status IN ('Empty', 'Occupied', 'Inactive', 'Available', 'Under Offer', 'Sold')
  ),
  CONSTRAINT valid_property_type CHECK (property_type IN ('rental', 'sale'))
);

-- Indexes
CREATE INDEX properties_owner_id_idx ON properties(owner_id);
CREATE INDEX properties_status_idx ON properties(status);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_type_status ON properties(property_type, status);
```

### 3. property_photos
Stores references to property photos in Supabase Storage.

```sql
CREATE TABLE property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  photo_url text NOT NULL,           -- Path in Supabase Storage
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Note: Maximum 10 photos per property (enforced in application logic)
-- Drag-drop reordering supported via update_photo_ordering RPC
```

### 4. tenants
Tenant information with encrypted TC ID for duplicate detection.

```sql
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  tc_encrypted text,           -- AES-256-GCM encrypted TC Kimlik No
  tc_hash text,                -- SHA-256 hash for duplicate detection
  address text,                -- Tenant's residence address
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tenants_tc_hash ON tenants(tc_hash);
```

### 5. contracts
Rental contracts with PDF support and multi-currency.

```sql
CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  rent_amount numeric(10,2),
  deposit numeric(10,2),
  currency text DEFAULT 'TRY',  -- 'TRY' | 'USD' | 'EUR'
  status text NOT NULL DEFAULT 'Active',  -- 'Active' | 'Archived' | 'Inactive'
  contract_pdf_path text,       -- Path in Supabase Storage
  rent_increase_reminder boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_contract_status CHECK (status IN ('Active', 'Archived', 'Inactive')),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

CREATE INDEX contracts_tenant_id_idx ON contracts(tenant_id);
CREATE INDEX contracts_property_id_idx ON contracts(property_id);
CREATE INDEX contracts_status_idx ON contracts(status);
CREATE INDEX contracts_end_date_idx ON contracts(end_date);
```

### 6. contract_details
Additional contract details for PDF generation.

```sql
CREATE TABLE contract_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid UNIQUE REFERENCES contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Payment details
  payment_day_of_month integer,     -- Day of month rent is due (1-31)
  payment_method text,              -- 'cash' | 'bank_transfer' | 'credit_card'

  -- Financial details
  annual_rent numeric(10,2),
  rent_increase_rate numeric(5,2),  -- e.g., 25.00 for 25%
  deposit_currency text DEFAULT 'TRY',

  -- Legal details
  special_conditions text,
  furniture_list text[],            -- Array of furniture items

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 7. property_inquiries
Property inquiries with rental/sale type separation.

```sql
CREATE TABLE property_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  inquiry_type text NOT NULL DEFAULT 'rental',  -- 'rental' | 'sale'
  client_name text NOT NULL,
  phone text,
  email text,
  desired_location text,

  -- Budget fields (type-specific)
  min_rent_budget numeric(10,2),   -- For rental inquiries
  max_rent_budget numeric(10,2),
  min_sale_budget numeric(10,2),   -- For sale inquiries
  max_sale_budget numeric(10,2),

  requirements text,
  status text DEFAULT 'active',  -- 'active' | 'matched' | 'contacted' | 'closed'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 8. inquiry_matches
Stores automatic matches between inquiries and available properties.

```sql
CREATE TABLE inquiry_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES property_inquiries(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  match_score integer,              -- Matching algorithm score
  status text DEFAULT 'pending',    -- 'pending' | 'contacted' | 'rejected'
  created_at timestamptz DEFAULT now()
);
```

### 9. meetings
Calendar appointments with property/tenant/owner linking.

```sql
CREATE TABLE meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  meeting_date date NOT NULL,
  meeting_time text NOT NULL,       -- e.g., '14:30'
  location text,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES property_owners(id) ON DELETE SET NULL,
  client_name text,                 -- For non-tenant meetings
  client_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 10. commissions
Sales and rental commission tracking.

```sql
CREATE TABLE commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  type text NOT NULL,               -- 'sale' | 'rental'
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'TRY',
  property_address text NOT NULL,   -- Denormalized for history
  notes text,
  created_at timestamptz DEFAULT now()
);
```

### 11. financial_transactions
Comprehensive income/expense tracking.

```sql
CREATE TABLE financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_date date NOT NULL,
  type text NOT NULL,               -- 'income' | 'expense'
  category text NOT NULL,
  subcategory text,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'TRY',
  description text NOT NULL,
  notes text,
  payment_method text,              -- 'cash' | 'bank_transfer' | 'credit_card' | 'check'
  payment_status text DEFAULT 'completed',  -- 'completed' | 'pending' | 'cancelled'

  -- Entity references
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  commission_id uuid REFERENCES commissions(id) ON DELETE SET NULL,

  -- Attachments
  receipt_url text,                 -- Path to receipt in storage
  invoice_number text,

  -- Recurring support
  is_recurring boolean DEFAULT false,
  recurring_frequency text,         -- 'monthly' | 'quarterly' | 'yearly'
  recurring_day integer,
  recurring_end_date date,
  parent_transaction_id uuid REFERENCES financial_transactions(id),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_financial_transactions_user_date ON financial_transactions(user_id, transaction_date DESC);
CREATE INDEX idx_financial_transactions_category ON financial_transactions(category, type);
```

### 12. expense_categories
Customizable expense categories with budgets.

```sql
CREATE TABLE expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  type text NOT NULL,               -- 'income' | 'expense'
  parent_category text,
  monthly_budget numeric(10,2),
  icon text,
  color text,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### 13. user_preferences
User settings, business info, and commission rates.

```sql
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_currency text DEFAULT 'TRY',
  meeting_reminder_hours integer DEFAULT 1,

  -- Business info
  business_name text,
  business_phone text,
  business_email text,
  business_address text,
  license_number text,

  -- Commission rates
  default_rental_commission_rate numeric(5,2),  -- e.g., 10.00 for 10%
  default_sale_commission_rate numeric(5,2),    -- e.g., 3.00 for 3%

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Service Layer (23 Services)

### Service Proxy Pattern

The application uses a **Service Proxy** (`src/lib/serviceProxy.ts`) as a central export point for all services:

```typescript
// Direct service exports
export { ownersService } from '../services/owners.service';
export { propertiesService } from '../services/properties.service';
export { tenantsService } from '../services/tenants.service';
export { contractsService } from '../services/contracts.service';
export { remindersService } from '../services/reminders.service';
export { photosService } from '../services/photos.service';
export { inquiriesService } from '../services/inquiries.service';
export { meetingsService } from '../services/meetings.service';
export { commissionsService } from '../services/commissions.service';
export { userPreferencesService } from '../services/userPreferences.service';
export * as financialTransactionsService from '../services/finance';

// Contract Management Services
export { encrypt, decrypt, hashTC, isValidTC, isValidIBAN, generateEncryptionKey } from '../services/encryption.service';
export { normalizePhone, formatPhoneForDisplay, isValidPhone, detectPhoneFormat } from '../services/phone.service';
export { normalizeAddress, generateFullAddress, parseAddress, isValidAddress, addressesMatch, getShortAddress } from '../services/address.service';
export { createContractWithEntities, getContractWithDetails } from '../services/contractCreation.service';
export { checkDuplicateName, checkDataChanges, checkMultipleContracts } from '../services/duplicateCheck.service';
export { extractTextFromFile, extractTextFromFileViaProxy, parseContractFromText } from '../services/textExtraction.service';
```

### Service Categories

#### Core Services
| Service | Description |
|---------|-------------|
| `propertiesService` | Property CRUD with rental/sale separation, statistics, inquiry auto-matching |
| `ownersService` | Owner management with encrypted TC/IBAN support |
| `tenantsService` | Tenant management with encrypted TC, multi-step creation |
| `contractsService` | Contract CRUD with PDF path management |

#### Contract Services
| Service | Description |
|---------|-------------|
| `contractPdfService` | PDF generation with Turkish template (jsPDF + autotable) |
| `contractCreationService` | Atomic creation via RPC (owner + tenant + property + contract) |
| `textExtractionService` | OCR-based import from PDF/DOCX files |
| `pdfFontsService` | Turkish font support (Roboto) for PDF generation |

#### Business Services
| Service | Description |
|---------|-------------|
| `photosService` | Photo upload/delete/reorder (max 10 per property) |
| `remindersService` | Auto-generated reminders from contracts |
| `inquiriesService` | Property inquiry matching system |
| `meetingsService` | Calendar appointments |
| `commissionsService` | Commission tracking (rental & sale) |

#### Financial Services
| Service | Description |
|---------|-------------|
| `financialTransactionsService` | Transaction CRUD |
| `categoriesService` | Expense categories with monthly budgets |
| `recurringExpensesService` | Recurring financial obligations |
| `analyticsService` | Financial reports and summaries |

#### Utility Services
| Service | Description |
|---------|-------------|
| `encryptionService` | TC ID hashing (SHA-256), AES-256-GCM encryption |
| `duplicateCheckService` | Detect duplicate owners/tenants by TC hash |
| `phoneService` | Phone normalization (Turkish format: 05XX XXX XX XX) |
| `addressService` | Address parsing, normalization, component extraction |
| `userPreferencesService` | User settings management |

### Service Pattern Example

```typescript
// src/services/properties.service.ts
class PropertiesService {
  private transformProperties(data: any[]): PropertyWithOwner[] {
    return data.map((property) => {
      const contracts = Array.isArray(property.contracts) ? property.contracts : [];
      const activeContractData = contracts.find((c: any) => c?.status === 'Active');
      const activeTenant = activeContractData?.tenant || null;
      const activeContract = activeContractData ? {
        id: activeContractData.id,
        rent_amount: activeContractData.rent_amount,
        currency: activeContractData.currency,
        end_date: activeContractData.end_date,
        status: activeContractData.status,
      } : null;

      const { contracts: _, ...rest } = property;
      return { ...rest, activeTenant, activeContract } as PropertyWithOwner;
    });
  }

  async getAll(): Promise<PropertyWithOwner[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:property_owners(*),
        photos:property_photos(*),
        contracts(id, status, rent_amount, currency, end_date, tenant:tenants(*))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return this.transformProperties(data || []);
  }

  async getRentalProperties(): Promise<PropertyWithOwner[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`*, owner:property_owners(*), photos:property_photos(*), contracts(...)`)
      .eq('property_type', 'rental')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return this.transformProperties(data || []);
  }

  async getSaleProperties(): Promise<PropertyWithOwner[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`*, owner:property_owners(*), photos:property_photos(*)`)
      .eq('property_type', 'sale')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as PropertyWithOwner[];
  }

  async create(property: Omit<PropertyInsert, 'user_id'>): Promise<Property> {
    // Validation
    if (property.property_type === 'rental' && !property.rent_amount) {
      throw new Error('Rent amount is required for rental properties');
    }
    if (property.property_type === 'sale' && !property.sale_price) {
      throw new Error('Sale price is required for sale properties');
    }

    // Auto-inject user_id
    const userId = await getAuthenticatedUserId();
    const newProperty = await insertRow('properties', { ...property, user_id: userId });

    // Trigger inquiry matching if available
    const shouldMatch =
      (newProperty.property_type === 'rental' && newProperty.status === 'Empty') ||
      (newProperty.property_type === 'sale' && newProperty.status === 'Available');

    if (shouldMatch) {
      const { inquiriesService } = await import('../lib/serviceProxy');
      await inquiriesService.checkMatchesForNewProperty(newProperty.id);
    }

    return newProperty;
  }

  async getStats() {
    const { data, error } = await supabase.from('properties').select('*');
    if (error) throw error;

    const properties = (data || []).map(p => ({ status: p.status, property_type: p.property_type }));

    return {
      total: properties.length,
      rental: {
        total: properties.filter(p => p.property_type === 'rental').length,
        empty: properties.filter(p => p.property_type === 'rental' && p.status === 'Empty').length,
        occupied: properties.filter(p => p.property_type === 'rental' && p.status === 'Occupied').length,
        inactive: properties.filter(p => p.property_type === 'rental' && p.status === 'Inactive').length,
      },
      sale: {
        total: properties.filter(p => p.property_type === 'sale').length,
        available: properties.filter(p => p.property_type === 'sale' && p.status === 'Available').length,
        underOffer: properties.filter(p => p.property_type === 'sale' && p.status === 'Under Offer').length,
        sold: properties.filter(p => p.property_type === 'sale' && p.status === 'Sold').length,
      },
    };
  }
}

export const propertiesService = new PropertiesService();
```

---

## Key Features

### Property Type Separation
- **Rental Properties**
  - Statuses: `Empty` → `Occupied` → `Inactive`
  - Fields: `rent_amount`, `currency`
  - Auto-matching with rental inquiries

- **Sale Properties**
  - Statuses: `Available` → `Under Offer` → `Sold` → `Inactive`
  - Fields: `sale_price`, `buyer_*`, `offer_*`, `sold_*`
  - Auto-matching with sale inquiries

### Contract PDF Generation
Turkish rental contract PDF with 5 pages:

1. **Page 1: Info Table**
   - Contract number, property address
   - Owner/tenant names and contacts
   - Monthly/yearly rent with Turkish text
   - Deposit amount, fixtures list

2. **Page 2: General Conditions (Genel Şartlar)**
   - Standard rental law terms
   - Maintenance responsibilities
   - Termination conditions

3. **Pages 3-4: Special Conditions (Özel Şartlar)**
   - Payment terms with IBAN
   - TÜFE increase clause
   - Custom conditions

4. **Page 5: Eviction Commitment (Tahliye Taahhütnamesi)**
   - Tenant commitment to vacate
   - Legal binding document

**Features:**
- Turkish character support (Roboto font via base64)
- Auto-saved to Supabase Storage
- Number-to-text conversion in Turkish
- Professional table layouts (jspdf-autotable)

### Legacy Contract Import
OCR-based text extraction from existing contracts:

1. **Upload Step** - Drag-drop PDF/DOCX file
2. **Extracting Step** - OCR processing with progress
3. **Review Step** - Edit extracted data:
   - Owner section (name, TC, IBAN, phone)
   - Tenant section (name, TC, phone, address)
   - Property section (address components)
   - Contract section (dates, amounts)
4. **Success Step** - Confirmation with links

### Multi-Tenant Architecture with RLS
All 13 tables have `user_id` column and RLS policies:

```sql
-- Standard RLS pattern for all tables
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own [entities]"
  ON [table_name] FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own [entities]"
  ON [table_name] FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own [entities]"
  ON [table_name] FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own [entities]"
  ON [table_name] FOR DELETE
  USING (auth.uid() = user_id);
```

### Financial Tracking System
- **Multi-currency**: TRY, USD, EUR
- **Categories**: Customizable with monthly budgets
- **Recurring**: Daily/weekly/monthly/yearly expenses
- **Receipts**: Upload to Supabase Storage
- **Entity linking**: Properties, contracts, commissions
- **Reports**: Income/expense analytics

### Inquiry Matching System
1. Client submits inquiry with requirements
2. System searches for matching properties:
   - Location match (city/district)
   - Budget range match
   - Property type match (rental/sale)
3. Matches stored in `inquiry_matches` table
4. Agent can view and contact matches

### i18n (18 Namespaces)
Full Turkish/English support:

| Namespace | Description |
|-----------|-------------|
| `auth` | Login, register, logout |
| `calendar` | Calendar and meetings |
| `common` | Shared labels, buttons |
| `components.tableActions` | Table action labels |
| `contracts` | Contract management |
| `dashboard` | Dashboard statistics |
| `errors` | Error messages |
| `finance` | Financial tracking |
| `inquiries` | Property inquiries |
| `landing` | Landing page |
| `navigation` | Menu items |
| `owners` | Owner management |
| `photo` | Photo management |
| `profile` | User profile |
| `properties` | Property management |
| `quick-add` | Quick entity creation |
| `reminders` | Reminder system |
| `tenants` | Tenant management |

### Mobile-First Design
- 44px touch targets on mobile
- Responsive layouts:
  - Mobile (<768px): Card-based views
  - Desktop (≥768px): Table layouts
- PWA support (manifest.json)
- Drawer navigation on mobile (vaul)

---

## Design System

### Color Palette (src/config/colors.ts)

```typescript
export const COLORS = {
  // Primary: Modern Blue
  primary: {
    DEFAULT: 'blue-600',
    hex: '#2563EB',
    bgGradient: 'bg-gradient-to-r from-blue-600 to-blue-700',
    bgGradientHover: 'hover:from-blue-700 hover:to-blue-800',
    shadow: 'shadow-blue-600/30',
  },

  // Secondary: Emerald Green
  secondary: {
    DEFAULT: 'emerald-600',
    hex: '#059669',
  },

  // Success: Emerald
  success: {
    DEFAULT: 'emerald-600',
    hex: '#059669',
  },

  // Danger: Red
  danger: {
    DEFAULT: 'red-600',
    hex: '#dc2626',
  },

  // Warning: Amber
  warning: {
    DEFAULT: 'amber-600',
    hex: '#D97706',
  },

  // Status Colors
  status: {
    empty: {
      bg: 'bg-orange-500',
      text: 'text-white',
      gradient: 'bg-gradient-to-r from-orange-500 to-orange-600',
    },
    occupied: {
      bg: 'bg-blue-500',
      text: 'text-white',
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
    },
    active: {
      bg: 'bg-emerald-600',
      text: 'text-white',
      gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    },
    inactive: {
      bg: 'bg-gray-600',
      text: 'text-white',
      gradient: 'bg-gradient-to-r from-gray-600 to-gray-700',
    },
    archived: {
      bg: 'bg-gray-600',
      text: 'text-white',
      gradient: 'bg-gradient-to-r from-gray-600 to-gray-700',
    },
  },

  // Dashboard Card Gradients
  dashboard: {
    properties: {
      gradient: 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800',
      shadow: 'shadow-lg shadow-blue-600/20',
    },
    occupied: {
      gradient: 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800',
      shadow: 'shadow-lg shadow-emerald-600/20',
    },
    tenants: {
      gradient: 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800',
      shadow: 'shadow-lg shadow-blue-600/20',
    },
    contracts: {
      gradient: 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700',
      shadow: 'shadow-lg shadow-orange-500/20',
    },
  },

  // Reminders
  reminders: {
    overdue: 'bg-red-600',
    upcoming: 'bg-blue-600',
    scheduled: 'bg-blue-600',
    expired: 'bg-gray-600',
  },
};

// Helper Functions
export const getPrimaryButtonClasses = () =>
  `${COLORS.primary.bg} ${COLORS.text.white} ${COLORS.primary.hover} ${COLORS.primary.shadow}`;

export const getSuccessButtonClasses = () =>
  `${COLORS.success.bg} ${COLORS.text.white} ${COLORS.success.hover}`;

export const getStatusBadgeClasses = (status: 'empty' | 'occupied' | 'active' | 'inactive' | 'archived') =>
  `${COLORS.status[status].bg} ${COLORS.status[status].text}`;

export const getCardClasses = () =>
  `shadow-lg ${COLORS.border.color} ${COLORS.card.bgBlur} hover:shadow-xl transition-shadow`;
```

---

## Constants (src/config/constants.ts)

```typescript
export const APP_NAME = 'Real Estate CRM';

export const PROPERTY_STATUS = {
  EMPTY: 'Empty',
  OCCUPIED: 'Occupied',
  INACTIVE: 'Inactive',
} as const;

export const CONTRACT_STATUS = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  INACTIVE: 'Inactive',
} as const;

export const MAX_PHOTOS_PER_PROPERTY = 10;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;  // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_PDF_TYPES = ['application/pdf'];

export const CONTRACT_EXPIRATION_WARNING_DAYS = 30;
export const ITEMS_PER_PAGE = 20;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROPERTIES: '/properties',
  PROPERTY_DETAIL: '/properties/:id',
  PROPERTY_NEW: '/properties/new',
  OWNERS: '/owners',
  OWNER_DETAIL: '/owners/:id',
  OWNER_NEW: '/owners/new',
  TENANTS: '/tenants',
  TENANT_DETAIL: '/tenants/:id',
  TENANT_NEW: '/tenants/new',
  CONTRACTS: '/contracts',
  CONTRACT_DETAIL: '/contracts/:id',
  CONTRACT_NEW: '/contracts/new',
  CONTRACT_IMPORT: '/contracts/import',
  REMINDERS: '/reminders',
  INQUIRIES: '/inquiries',
  CALENDAR: '/calendar',
  FINANCE: '/finance',
  PROFILE: '/profile',
} as const;
```

---

## Type Definitions (src/types/index.ts)

```typescript
// Property types
export type PropertyType = 'rental' | 'sale';
export type RentalPropertyStatus = 'Empty' | 'Occupied' | 'Inactive';
export type SalePropertyStatus = 'Available' | 'Under Offer' | 'Sold' | 'Inactive';
export type PropertyStatus = RentalPropertyStatus | SalePropertyStatus;

// Contract types
export type ContractStatus = 'Active' | 'Archived' | 'Inactive';

// Inquiry types
export type InquiryType = 'rental' | 'sale';
export type InquiryStatus = 'active' | 'matched' | 'contacted' | 'closed';

// Commission types
export type CommissionType = 'rental' | 'sale';

// Extended interfaces
export interface PropertyWithOwner extends Property {
  owner?: PropertyOwner;
  photos?: PropertyPhoto[];
  activeTenant?: Tenant;
  activeContract?: {
    id: string;
    rent_amount: number | null;
    currency: string | null;
    end_date: string;
    status: ContractStatus;
  };
}

export interface RentalPropertyWithOwner extends PropertyWithOwner {
  property_type: 'rental';
  status: RentalPropertyStatus;
}

export interface SalePropertyWithOwner extends PropertyWithOwner {
  property_type: 'sale';
  status: SalePropertyStatus;
}

export interface ContractWithDetails extends Contract {
  tenant?: Tenant;
  property?: Property;
}

export interface MeetingWithRelations extends Meeting {
  tenant?: Tenant;
  property?: Property;
  owner?: PropertyOwner;
}

export interface InquiryWithMatches extends PropertyInquiry {
  matches?: InquiryMatchWithProperty[];
}

export interface Commission {
  id: string;
  property_id: string;
  contract_id?: string | null;
  type: CommissionType;
  amount: number;
  currency: string;
  property_address: string;
  notes?: string | null;
  created_at: string;
  user_id: string;
}

export interface CommissionStats {
  totalEarnings: number;
  rentalCommissions: number;
  saleCommissions: number;
  currency: string;
}
```

---

## Authentication Flow

1. **Login**: User authenticates via Supabase Auth (email/password)
2. **Session**: Session stored in localStorage
3. **Context**: `AuthContext` provides user state globally
4. **Protected Routes**: `ProtectedRoute` component wraps authenticated pages
5. **RLS**: Database enforces access via `auth.uid()`

```typescript
// src/contexts/AuthContext.tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage in components
const { user } = useAuth();
```

---

## Slash Commands

| Command | Description |
|---------|-------------|
| `/add-migration` | Create database migration with RLS policies |
| `/add-service` | Generate service class following patterns |
| `/add-component` | Create React component with design system |
| `/add-form` | Build form with React Hook Form + Zod |
| `/add-feature` | Generate complete feature boilerplate |
| `/add-translation` | Add i18n keys (TR + EN) |
| `/review-rls` | Audit RLS policies for security |

---

## Development

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run deploy       # Cloudflare Pages (staging)
npm run deploy:prod  # Cloudflare Pages (production)
```

---

## Common Development Patterns

### Creating a New Feature

1. Create feature folder: `src/features/[feature-name]/`
2. Create main page component: `[FeatureName].tsx`
3. Create service: `src/services/[feature-name].service.ts`
4. Add types to `src/types/index.ts`
5. Export from `src/lib/serviceProxy.ts`
6. Add route to `src/config/constants.ts`
7. Add route to `src/App.tsx`
8. Add navigation to `src/components/layout/Sidebar.tsx`
9. Create i18n files: `public/locales/tr/[feature-name].json` and `en/`

### Database Changes

1. Create migration: `supabase/migrations/[timestamp]_[description].sql`
2. Add table/column changes with SQL
3. Add RLS policies (all 4 operations: SELECT, INSERT, UPDATE, DELETE)
4. Update `src/types/database.ts` (regenerate if needed)
5. Update service layer
6. Run: `supabase db push`

### Adding a Form

```typescript
// 1. Define Zod schema
const formSchema = z.object({
  name: z.string().min(1, t('validation.required')),
  email: z.string().email(t('validation.invalidEmail')),
  phone: z.string().optional(),
});

// 2. Create form with React Hook Form
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { name: '', email: '', phone: '' },
});

// 3. Handle submission
const onSubmit = async (data: z.infer<typeof formSchema>) => {
  try {
    await service.create(data);
    toast.success(t('success'));
    navigate(-1);
  } catch (error) {
    toast.error(t('error'));
  }
};

// 4. Render form
<form onSubmit={form.handleSubmit(onSubmit)}>
  <Input {...form.register('name')} placeholder={t('name')} />
  {form.formState.errors.name && (
    <span className="text-red-500">{form.formState.errors.name.message}</span>
  )}
  <Button type="submit">{t('submit')}</Button>
</form>
```

---

## Security

### Current Implementations

1. **Row Level Security (RLS)** - All 13 tables have all 4 policies
2. **user_id injection** - Services auto-inject authenticated user ID
3. **Signed URLs** - For PDF and photo access via Supabase Storage
4. **TC ID hashing** - SHA-256 hash for duplicate detection (never stored in plain)
5. **IBAN/TC encryption** - AES-256-GCM for sensitive data
6. **Zod validation** - All forms validated before submission
7. **SQL injection prevention** - Parameterized queries via Supabase client

### Best Practices

1. Never expose sensitive keys in client-side code
2. Validate all user input with Zod schemas
3. Use RLS policies for all new tables
4. Sanitize file uploads (check types, sizes)
5. Use `getAuthenticatedUserId()` in all service methods

---

## Common Issues & Solutions

### Issue: RLS Policy Prevents Data Access
**Solution**: Ensure `user_id` is correctly injected in service layer
```typescript
const userId = await getAuthenticatedUserId();
await insertRow('table_name', { ...data, user_id: userId });
```

### Issue: Photos Not Uploading
**Solution**: Check Supabase Storage bucket policies and file limits
```typescript
MAX_FILE_SIZE = 5 * 1024 * 1024;  // 5MB
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
```

### Issue: i18n Translations Not Loading
**Solution**: Verify translation files exist in `public/locales/[lang]/[namespace].json`
```typescript
const { t } = useTranslation('properties');  // Namespace must match filename
```

### Issue: Type Errors with Supabase
**Solution**: Regenerate types from Supabase
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### Issue: Turkish Characters in PDF
**Solution**: Use Roboto font via pdfFonts.service.ts
```typescript
import { addTurkishFonts, setFontBold, setFontNormal } from './pdfFonts';
addTurkishFonts(doc);  // Must call before any text rendering
```

### Issue: Contract Creation Fails
**Solution**: Use atomic RPC function for all-or-nothing creation
```typescript
const result = await createContractWithEntities({
  owner_data: { ... },
  tenant_data: { ... },
  property_data: { ... },
  contract_data: { ... },
  user_id_param: userId,
});
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Future Enhancement Opportunities

1. **Real-time Features** - Supabase Realtime for live updates
2. **Advanced Analytics** - Dashboard charts with recharts
3. **Mobile App** - React Native version sharing service layer
4. **Email Notifications** - Supabase Edge Functions + SendGrid
5. **Document Templates** - More PDF templates (receipts, invoices)
6. **Advanced Search** - Full-text search with PostgreSQL
7. **Integration APIs** - Sahibinden, Emlakjet listing sync
8. **Multi-language** - Add more languages beyond TR/EN

---

**Last Updated**: 2025-11-25
**Version**: 1.1.0
