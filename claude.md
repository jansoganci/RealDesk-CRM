# Claude Code - Real Estate CRM Technical Documentation

## Project Overview

**Real Estate CRM** (Emlak CRM) is a comprehensive, mobile-first Customer Relationship Management system designed specifically for Turkish real estate agents. The application helps manage properties, owners, tenants, contracts, financial transactions, and reminders through an intuitive, responsive interface optimized for mobile devices.

### Key Information
- **Name**: Real Estate CRM (Emlak CRM - "emlak" means real estate in Turkish)
- **Version**: 1.0.0
- **Type**: Single Page Application (SPA) with PWA support
- **Target Users**: Turkish real estate agents and agencies
- **Primary Language**: Turkish (with English i18n support)
- **License**: MIT

---

## Technology Stack

### Frontend Core
- **React 18.3** - Modern UI library with hooks and concurrent features
- **TypeScript 5.5** - Full type safety across the application
- **Vite 5.4** - Lightning-fast build tool and development server
- **React Router 7.9** - Client-side routing with protected routes

### UI Framework & Design
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled component primitives
- **Lucide React** - Comprehensive icon library (446+ icons)
- **Sonner** - Beautiful toast notifications
- **class-variance-authority** - Component variant management
- **next-themes** - Theme management (supports dark mode)

### Forms & Validation
- **React Hook Form 7.53** - Performant form management
- **Zod 3.23** - TypeScript-first schema validation
- **@hookform/resolvers** - Integration between RHF and Zod

### Backend & Database
- **Supabase 2.58** - Backend as a Service (BaaS)
  - PostgreSQL database
  - Row Level Security (RLS) for data protection
  - Supabase Storage for photos and PDFs
  - Supabase Auth for authentication
  - Real-time subscriptions (not currently used but available)

### Internationalization
- **i18next 25.6** - i18n framework
- **react-i18next 16.2** - React bindings for i18next
- **i18next-browser-languagedetector** - Automatic language detection
- **i18next-http-backend** - Load translations from server

### Other Libraries
- **date-fns 3.6** - Modern date utility library
- **recharts 2.12** - Composable charting library
- **embla-carousel-react** - Lightweight carousel
- **react-resizable-panels** - Resizable panel layouts
- **vaul** - Drawer component for mobile

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
│  │  (Routes between real services and mock services)    │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Service Layer                            │  │
│  │  (Business logic and API calls)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │   Storage    │  │     Auth     │    │
│  │   Database   │  │ (Photos/PDFs)│  │  (Sessions)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
emlak-crm/
├── public/                      # Static assets
│   ├── locales/                 # i18n translation files
│   │   ├── tr/                  # Turkish translations
│   │   └── en/                  # English translations
│   └── manifest.json            # PWA manifest
│
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── calendar/            # Calendar-specific components
│   │   ├── common/              # Common components (EmptyState, etc.)
│   │   ├── dashboard/           # Dashboard components (StatCard)
│   │   ├── layout/              # Layout components
│   │   │   ├── MainLayout.tsx   # Main app layout wrapper
│   │   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   │   ├── Navbar.tsx       # Top navigation bar
│   │   │   └── PageContainer.tsx # Page wrapper component
│   │   ├── properties/          # Property-related components
│   │   ├── templates/           # Page templates
│   │   └── ui/                  # Base UI components (Radix UI)
│   │
│   ├── config/                  # Configuration files
│   │   ├── colors.ts            # Design system color tokens
│   │   ├── constants.ts         # App-wide constants and routes
│   │   └── supabase.ts          # Supabase client configuration
│   │
│   ├── contexts/                # React contexts
│   │   └── AuthContext.tsx      # Authentication state management
│   │
│   ├── data/                    # Static data files
│   │
│   ├── features/                # Feature modules (main app pages)
│   │   ├── auth/                # Authentication (Login)
│   │   ├── calendar/            # Calendar and meetings
│   │   ├── contracts/           # Contract management
│   │   ├── dashboard/           # Dashboard with statistics
│   │   ├── finance/             # Financial tracking
│   │   │   ├── components/      # Finance-specific components
│   │   │   └── utils/           # Finance utility functions
│   │   ├── inquiries/           # Property inquiries
│   │   ├── landing/             # Landing page
│   │   ├── owners/              # Property owner management
│   │   ├── profile/             # User profile settings
│   │   ├── properties/          # Property management
│   │   ├── reminders/           # Reminder system
│   │   └── tenants/             # Tenant management
│   │       └── steps/           # Multi-step tenant creation
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-toast.ts         # Toast notification hook
│   │   └── useMeetingNotifications.ts # Meeting reminder notifications
│   │
│   ├── lib/                     # Utility functions and helpers
│   │   ├── auth.ts              # Authentication utilities
│   │   ├── dates.ts             # Date formatting and manipulation
│   │   ├── db.ts                # Database helper functions
│   │   ├── rpc.ts               # RPC function helpers
│   │   ├── serviceProxy.ts      # Service abstraction layer
│   │   └── utils.ts             # General utility functions
│   │
│   ├── services/                # API service layers
│   │   ├── commissions.service.ts       # Commission tracking
│   │   ├── contracts.service.ts         # Contract CRUD
│   │   ├── financialTransactions.service.ts # Finance management
│   │   ├── inquiries.service.ts         # Property inquiries
│   │   ├── meetings.service.ts          # Calendar meetings
│   │   ├── owners.service.ts            # Owner management
│   │   ├── photos.service.ts            # Photo upload/management
│   │   ├── properties.service.ts        # Property CRUD
│   │   ├── reminders.service.ts         # Reminders
│   │   ├── tenants.service.ts           # Tenant management
│   │   ├── userPreferences.service.ts   # User settings
│   │   └── mockServices/        # Mock services for demo mode
│   │       ├── mockOwners.service.ts
│   │       ├── mockProperties.service.ts
│   │       ├── mockTenants.service.ts
│   │       ├── mockContracts.service.ts
│   │       ├── mockReminders.service.ts
│   │       ├── mockInquiries.service.ts
│   │       ├── mockMeetings.service.ts
│   │       ├── userPreferences.service.ts
│   │       └── financialTransactions.service.ts
│   │
│   ├── types/                   # TypeScript type definitions
│   │   ├── database.ts          # Auto-generated Supabase types
│   │   ├── index.ts             # Application-wide types
│   │   └── rpc.ts               # RPC function types
│   │
│   ├── App.tsx                  # Main App component with routes
│   ├── main.tsx                 # Application entry point
│   ├── i18n.ts                  # i18n configuration
│   └── index.css                # Global styles and Tailwind imports
│
├── supabase/
│   └── migrations/              # Database migration SQL files
│       ├── 20251027*.sql        # Initial schema creation
│       ├── 20251102*.sql        # Multi-currency support
│       ├── 20251104*.sql        # Meetings table
│       ├── 20251110*.sql        # User preferences updates
│       ├── 20251111*.sql        # Financial system
│       ├── 20250103*.sql        # Contract validation RPCs
│       ├── 20250104*.sql        # Property listing URL
│       ├── 20250105*.sql        # Property inquiries
│       ├── 20250110*.sql        # Commissions table
│       └── 20250111*.sql        # User ID and RLS security
│
├── docs/                        # Documentation
│   ├── API.md                   # API documentation
│   ├── ARCHITECTURE.md          # Architecture details
│   ├── BACKEND_TECH_DOC.md      # Backend technical docs
│   ├── FRONTEND_TECH_DOC.md     # Frontend technical docs
│   ├── CONTRIBUTING.md          # Contribution guidelines
│   ├── DEPLOYMENT.md            # Deployment instructions
│   ├── design_plan.md           # Original design plan
│   ├── design_plan_audit.md     # Design audit
│   ├── design_rulebook.md       # Design system rules
│   └── turkish_real_estate_workflow_enhancement.md
│
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite build configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── components.json              # shadcn/ui component config
└── README.md                    # Project documentation
```

---

## Database Schema

### Core Tables

#### 1. **property_owners**
Stores information about property owners.

```sql
CREATE TABLE property_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,  -- Links to authenticated user
  name text NOT NULL,
  phone text,
  email text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 2. **properties**
Central table for property management.

```sql
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,  -- Links to authenticated user
  owner_id uuid NOT NULL REFERENCES property_owners(id) ON DELETE CASCADE,
  address text NOT NULL,
  city text,
  district text,
  status text NOT NULL DEFAULT 'Empty',  -- 'Empty' | 'Occupied' | 'Inactive'
  listing_url text,  -- External listing URL
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_property_status CHECK (status IN ('Empty', 'Occupied', 'Inactive'))
);
```

#### 3. **property_photos**
Stores references to property photos in Supabase Storage.

```sql
CREATE TABLE property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  photo_url text NOT NULL,  -- Path in Supabase Storage
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

**Note**: Maximum 10 photos per property (enforced in application logic).

#### 4. **tenants**
Stores tenant information.

```sql
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 5. **contracts**
Rental contracts linking properties and tenants.

```sql
CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  rent_amount numeric(10,2),
  currency text DEFAULT 'TRY',  -- 'TRY' | 'USD' | 'EUR'
  status text NOT NULL DEFAULT 'Active',  -- 'Active' | 'Archived' | 'Inactive'
  contract_pdf_path text,  -- Path in Supabase Storage
  rent_increase_reminder boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_contract_status CHECK (status IN ('Active', 'Archived', 'Inactive')),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);
```

#### 6. **property_inquiries**
Tracks property inquiries and matches.

```sql
CREATE TABLE property_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_name text NOT NULL,
  phone text,
  email text,
  desired_location text,
  budget_min numeric(10,2),
  budget_max numeric(10,2),
  requirements text,
  matched_properties jsonb,  -- Array of property IDs
  status text DEFAULT 'Active',  -- 'Active' | 'Closed'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 7. **meetings**
Calendar meetings and appointments.

```sql
CREATE TABLE meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  meeting_date date NOT NULL,
  meeting_time text NOT NULL,
  location text,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  client_name text,
  client_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 8. **commissions**
Tracks sales and rental commissions.

```sql
CREATE TABLE commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  type text NOT NULL,  -- 'sale' | 'rental'
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'TRY',
  property_address text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

#### 9. **financial_transactions**
Comprehensive financial tracking system.

```sql
CREATE TABLE financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,  -- 'income' | 'expense'
  category_id uuid REFERENCES expense_categories(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'TRY',
  transaction_date date NOT NULL,
  description text,
  payment_method text,  -- 'cash' | 'bank_transfer' | 'credit_card' | 'check'
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  is_recurring boolean DEFAULT false,
  recurring_expense_id uuid REFERENCES recurring_expenses(id) ON DELETE SET NULL,
  receipt_url text,  -- Path to receipt in storage
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 10. **expense_categories**
Expense categorization system.

```sql
CREATE TABLE expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  type text NOT NULL,  -- 'income' | 'expense'
  parent_category text,
  monthly_budget numeric(10,2),
  icon text,
  color text,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

#### 11. **recurring_expenses**
Manage recurring financial obligations.

```sql
CREATE TABLE recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category_id uuid REFERENCES expense_categories(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'TRY',
  frequency text NOT NULL,  -- 'daily' | 'weekly' | 'monthly' | 'yearly'
  start_date date NOT NULL,
  end_date date,
  day_of_month integer,
  day_of_week integer,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  payment_method text,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 12. **user_preferences**
User settings and preferences.

```sql
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_currency text DEFAULT 'TRY',
  meeting_reminder_hours integer DEFAULT 1,
  business_name text,
  business_phone text,
  business_email text,
  business_address text,
  license_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Database Relationships

```
┌─────────────────┐
│ property_owners │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐       ┌──────────────────┐
│   properties    │◄──────│ property_photos  │
└────────┬────────┘  1:N  └──────────────────┘
         │ 1:N
         ├──────────┐
         │          │
         ▼          ▼
┌─────────────┐  ┌────────────────┐
│  contracts  │  │    meetings    │
└──────┬──────┘  └────────────────┘
       │ N:1
       ▼
┌─────────────┐
│   tenants   │
└─────────────┘

┌──────────────────────────┐
│ financial_transactions   │
└──────────┬───────────────┘
           │
           ├──► properties (N:1)
           ├──► contracts (N:1)
           ├──► expense_categories (N:1)
           └──► recurring_expenses (N:1)
```

### Important RPC Functions

#### 1. **create_tenant_with_contract**
Atomic creation of tenant with associated contract.

```sql
create_tenant_with_contract(
  tenant_data: json,
  contract_data: json
) RETURNS json
```

#### 2. **update_photo_ordering**
Atomic photo reordering operation.

```sql
update_photo_ordering(
  property_id: uuid,
  photo_orders: json[]
) RETURNS void
```

---

## Service Layer Architecture

### Service Proxy Pattern

The application uses a sophisticated **Service Proxy Pattern** to enable seamless switching between real Supabase services and mock services for demo mode.

**File**: `src/lib/serviceProxy.ts`

#### How It Works

1. **Demo Mode Detection**: Checks `window.__DEMO_MODE__` flag
2. **Proxy Interception**: Uses JavaScript Proxy to intercept service calls
3. **Dynamic Routing**: Routes to mock or real service based on mode
4. **Method Binding**: Ensures `this` context is correct for methods

```typescript
export const propertiesService = new Proxy(realPropertiesService, {
  get(target, prop) {
    const service = isDemoMode() ? mockPropertiesService : target;
    const value = (service as any)[prop];

    if (typeof value === 'function') {
      return value.bind(service);
    }

    return value;
  }
}) as typeof realPropertiesService;
```

### Service Pattern

Each service follows a consistent pattern:

```typescript
// Example: properties.service.ts
class PropertiesService {
  async getAll(): Promise<PropertyWithOwner[]> {
    // Fetch data with relationships
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:property_owners(*),
        photos:property_photos(*),
        contracts(id, status, tenant:tenants(*))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to application format
    return transformProperties(data);
  }

  async getById(id: string): Promise<PropertyWithOwner | null> {
    // Similar pattern with single record
  }

  async create(property: PropertyInsert): Promise<Property> {
    // Inject user_id for RLS
    const userId = await getAuthenticatedUserId();
    return await insertRow('properties', { ...property, user_id: userId });
  }

  async update(id: string, property: PropertyUpdate): Promise<Property> {
    return await updateRow('properties', id, property);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}

export const propertiesService = new PropertiesService();
```

### Available Services

1. **propertiesService** - Property CRUD and statistics
2. **ownersService** - Owner management
3. **tenantsService** - Tenant management with contract creation
4. **contractsService** - Contract management and PDF handling
5. **photosService** - Photo upload, reorder, delete (max 10 per property)
6. **remindersService** - Automatic reminder generation from contracts
7. **inquiriesService** - Property inquiry matching system
8. **meetingsService** - Calendar appointments
9. **commissionsService** - Commission tracking
10. **financialTransactionsService** - Comprehensive financial tracking
11. **userPreferencesService** - User settings management

---

## Key Features Deep Dive

### 1. Multi-Tenant Architecture with RLS

Every table includes a `user_id` column that links data to authenticated users. Row Level Security (RLS) policies ensure users can only access their own data.

**Pattern**:
```sql
-- Example RLS policy
CREATE POLICY "Users can only view their own properties"
  ON properties
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own properties"
  ON properties
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Application Layer**:
```typescript
// Services automatically inject user_id
async create(property: PropertyInsert): Promise<Property> {
  const userId = await getAuthenticatedUserId();
  return await insertRow('properties', {
    ...property,
    user_id: userId,  // Auto-injected
  });
}
```

### 2. Photo Management System

Properties can have up to 10 photos stored in Supabase Storage.

**Features**:
- Upload photos to Supabase Storage bucket `property-photos`
- Drag-and-drop reordering with atomic updates
- Delete photos (removes from storage and database)
- Display order tracking (`display_order` column)
- Automatic URL generation with storage paths

**Atomic Reordering**:
```sql
-- RPC function for atomic photo ordering
CREATE OR REPLACE FUNCTION update_photo_ordering(
  property_id uuid,
  photo_orders json[]
)
RETURNS void AS $$
BEGIN
  -- Update all photo orders in a single transaction
  UPDATE property_photos
  SET display_order = (orders.value->>'order')::integer
  FROM json_array_elements(photo_orders) AS orders
  WHERE property_photos.id = (orders.value->>'id')::uuid
    AND property_photos.property_id = $1;
END;
$$ LANGUAGE plpgsql;
```

### 3. Contract Management with Reminders

Contracts automatically generate reminders for:
- **Rent increase** (configurable via `rent_increase_reminder` boolean)
- **Contract expiration** (30 days before end_date)

**Contract Creation Flow**:
1. User creates tenant + contract (atomic operation via RPC)
2. Contract is linked to property and tenant
3. Property status automatically updates to "Occupied"
4. Reminders are auto-generated based on contract dates

**Tenant with Contract RPC**:
```sql
CREATE OR REPLACE FUNCTION create_tenant_with_contract(
  tenant_data json,
  contract_data json
)
RETURNS json AS $$
DECLARE
  new_tenant tenants;
  new_contract contracts;
BEGIN
  -- Insert tenant
  INSERT INTO tenants (user_id, name, phone, email)
  VALUES (
    (tenant_data->>'user_id')::uuid,
    tenant_data->>'name',
    tenant_data->>'phone',
    tenant_data->>'email'
  )
  RETURNING * INTO new_tenant;

  -- Insert contract
  INSERT INTO contracts (user_id, tenant_id, property_id, ...)
  VALUES (...)
  RETURNING * INTO new_contract;

  -- Return both
  RETURN json_build_object(
    'tenant', row_to_json(new_tenant),
    'contract', row_to_json(new_contract)
  );
END;
$$ LANGUAGE plpgsql;
```

### 4. Financial Tracking System

Comprehensive financial management with:

**Transaction Types**:
- Income (commissions, rental income)
- Expenses (maintenance, utilities, taxes, etc.)

**Features**:
- Multi-currency support (TRY, USD, EUR)
- Categorization with customizable categories
- Recurring expenses with frequency options
- Receipt upload to Supabase Storage
- Property and contract linkage
- Payment method tracking
- Budget tracking per category
- Financial reports and analytics

**Recurring Expense Processing**:
```typescript
// Example: Generate transactions from recurring expenses
async processRecurringExpense(recurringExpenseId: string) {
  const recurring = await getRecurringExpense(recurringExpenseId);

  // Calculate next occurrence based on frequency
  const nextDate = calculateNextOccurrence(
    recurring.frequency,
    recurring.start_date,
    recurring.day_of_month,
    recurring.day_of_week
  );

  // Create transaction
  await createTransaction({
    type: 'expense',
    amount: recurring.amount,
    currency: recurring.currency,
    transaction_date: nextDate,
    recurring_expense_id: recurringExpenseId,
    // ... other fields
  });
}
```

### 5. Property Inquiry Matching System

Automatically matches property inquiries with available properties.

**Matching Algorithm**:
1. Client submits inquiry with requirements (location, budget)
2. System searches for properties with status "Empty"
3. Matches based on:
   - Location (city/district)
   - Budget range (rent_amount)
4. Stores matched property IDs in `matched_properties` JSONB column
5. Agent can view matches and contact client

### 6. Internationalization (i18n)

Full bilingual support for Turkish and English.

**Structure**:
```
public/locales/
├── tr/
│   ├── common.json
│   ├── properties.json
│   ├── owners.json
│   ├── tenants.json
│   ├── contracts.json
│   ├── finance.json
│   ├── calendar.json
│   ├── dashboard.json
│   ├── auth.json
│   ├── navigation.json
│   ├── errors.json
│   └── ...
└── en/
    └── (same structure)
```

**Usage in Components**:
```typescript
import { useTranslation } from 'react-i18next';

function PropertyList() {
  const { t } = useTranslation('properties');

  return <h1>{t('title')}</h1>;  // "Mülkler" or "Properties"
}
```

### 7. Mobile-First Design

**Touch Target Requirements**:
- Minimum 44px touch targets on mobile
- Responsive sizing: `h-11 md:h-9` (larger on mobile)

**Responsive Patterns**:
- Mobile (<768px): Card-based layouts
- Desktop (≥768px): Table layouts
- Forms: Single column mobile, multi-column desktop

**PWA Features**:
- `manifest.json` configured
- Installable as home screen app
- Offline-ready structure (can be enhanced with service worker)

---

## Design System

### Color Palette

The design uses a luxury color scheme defined in `src/config/colors.ts`.

**Primary Colors**:
- **Luxury Navy**: `slate-900` (#0f172a) - Professional primary color
- **Luxury Gold**: `amber-600` (#d97706) - Premium accent color
- **Emerald Green**: `emerald-600` (#059669) - Success color
- **Red**: `red-600` (#dc2626) - Danger color

**Status Colors**:
- Empty: Amber gradient
- Occupied: Emerald gradient
- Inactive: Slate gradient
- Active: Emerald gradient
- Archived: Slate gradient

**Dashboard Card Gradients**:
```typescript
dashboard: {
  properties: 'bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900',
  occupied: 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800',
  tenants: 'bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900',
  contracts: 'bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700',
}
```

### Component Patterns

**Standard Button**:
```tsx
<Button className={`${COLORS.primary.bgGradient} ${COLORS.primary.shadow}`}>
  {t('submit')}
</Button>
```

**Status Badge**:
```tsx
<Badge className={getStatusBadgeClasses(status)}>
  {status}
</Badge>
```

**Card**:
```tsx
<Card className={getCardClasses()}>
  {/* content */}
</Card>
```

---

## Authentication Flow

1. **Login**: User authenticates via Supabase Auth
2. **Session**: Session stored in localStorage
3. **Context**: `AuthContext` provides user state globally
4. **Protected Routes**: `ProtectedRoute` component wraps authenticated pages
5. **RLS**: Database enforces access via `auth.uid()`

**AuthContext**:
```typescript
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
```

---

## Routing Structure

**File**: `src/App.tsx`

```typescript
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<Login />} />

  {/* Protected routes */}
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
  <Route path="/owners" element={<ProtectedRoute><Owners /></ProtectedRoute>} />
  <Route path="/tenants" element={<ProtectedRoute><Tenants /></ProtectedRoute>} />
  <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
  <Route path="/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
  <Route path="/inquiries" element={<ProtectedRoute><Inquiries /></ProtectedRoute>} />
  <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
  <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
</Routes>
```

All routes are defined in `src/config/constants.ts` as `ROUTES` constant.

---

## State Management

The application uses **React Context** for global state and **React Hook Form** for form state.

### Global State (Context)
- **AuthContext**: User authentication state
- Component-level state using `useState` for local UI state

### Form State
- **React Hook Form** with Zod validation
- Controlled components with `useForm` hook

```typescript
const form = useForm<PropertyFormData>({
  resolver: zodResolver(propertySchema),
  defaultValues: {
    address: '',
    city: '',
    district: '',
    status: 'Empty',
  },
});

const onSubmit = async (data: PropertyFormData) => {
  await propertiesService.create(data);
  toast.success(t('success'));
};
```

---

## Common Development Patterns

### 1. Creating a New Feature

**Steps**:
1. Create feature folder: `src/features/[feature-name]/`
2. Create main page component: `[FeatureName].tsx`
3. Create service: `src/services/[feature-name].service.ts`
4. Add types to `src/types/index.ts`
5. Add route to `src/config/constants.ts`
6. Add route to `src/App.tsx`
7. Add navigation item to `src/components/layout/Sidebar.tsx`
8. Create i18n files: `public/locales/tr/[feature-name].json`

### 2. Database Changes

**Steps**:
1. Create migration file: `supabase/migrations/[timestamp]_[description].sql`
2. Write SQL for table/column changes
3. Add RLS policies
4. Update TypeScript types in `src/types/database.ts`
5. Update service layer
6. Run migration: `supabase db push`

### 3. Adding a Service Method

```typescript
// 1. Add to service class
class PropertiesService {
  async customMethod(id: string): Promise<Property> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
}

// 2. Export service
export const propertiesService = new PropertiesService();

// 3. Add to service proxy (if needed)
// Already handled by Proxy pattern in serviceProxy.ts
```

### 4. Creating a Form

```typescript
// 1. Define schema
const formSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
});

// 2. Create form
const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: { name: '', email: '' },
});

// 3. Render form
<form onSubmit={form.handleSubmit(onSubmit)}>
  <Input {...form.register('name')} />
  <Input {...form.register('email')} />
  <Button type="submit">Submit</Button>
</form>
```

---

## Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Accessing in Code**:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

---

## Build & Deployment

### Development
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

### Production
```bash
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build
```

### Deployment Targets
- Vercel (recommended)
- Netlify
- Supabase Hosting
- AWS S3 + CloudFront
- Docker

See `DEPLOYMENT.md` for detailed instructions.

---

## Testing Strategy

**Current State**: No automated tests (opportunity for enhancement)

**Recommended**:
- Unit tests: Vitest
- Component tests: React Testing Library
- E2E tests: Playwright or Cypress
- API tests: Supertest with Supabase mock

---

## Performance Optimizations

1. **Code Splitting**: React.lazy() for route-based splitting (can be added)
2. **Image Optimization**: Compress photos before upload
3. **Database Indexes**: Created on foreign keys and frequently queried columns
4. **Pagination**: ITEMS_PER_PAGE constant (20 items)
5. **Memo/Callback**: Use React.memo for expensive components
6. **Supabase Edge Functions**: Offload heavy computation (future enhancement)

---

## Security Considerations

### Current Implementations

1. **Row Level Security (RLS)**
   - All tables have RLS policies
   - Users can only access their own data
   - Foreign key cascades prevent orphaned records

2. **Storage Security**
   - Bucket policies restrict access to authenticated users
   - File paths include user_id for additional security

3. **SQL Injection Prevention**
   - Parameterized queries via Supabase client
   - No raw SQL from user input

4. **XSS Prevention**
   - React's default XSS protection
   - User input sanitized before rendering

5. **Authentication**
   - Supabase Auth handles session management
   - JWT tokens for API requests
   - Automatic token refresh

### Best Practices for Development

1. **Never expose sensitive keys** in client-side code
2. **Validate all user input** with Zod schemas
3. **Use RLS policies** for all new tables
4. **Sanitize file uploads** (check file types, sizes)
5. **Implement rate limiting** (can use Supabase Edge Functions)

---

## Common Issues & Solutions

### Issue: RLS Policy Prevents Data Access
**Solution**: Ensure `user_id` is correctly injected in service layer
```typescript
const userId = await getAuthenticatedUserId();
await insertRow('table_name', { ...data, user_id: userId });
```

### Issue: Photos Not Uploading
**Solution**: Check Supabase Storage bucket policies and file size limits
```typescript
MAX_FILE_SIZE = 5 * 1024 * 1024;  // 5MB
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
```

### Issue: i18n Translations Not Loading
**Solution**: Verify translation files exist in `public/locales/[lang]/[namespace].json`
```typescript
// Correct usage
const { t } = useTranslation('properties');  // Namespace must match filename
```

### Issue: Type Errors with Supabase
**Solution**: Regenerate types from Supabase
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

---

## Future Enhancement Opportunities

1. **Real-time Features**
   - Use Supabase Realtime for live updates
   - Collaborative editing of properties

2. **Advanced Analytics**
   - Dashboard with charts (recharts already installed)
   - Revenue forecasting
   - Occupancy trends

3. **Mobile App**
   - React Native version
   - Share service layer code

4. **Email Notifications**
   - Supabase Edge Functions + SendGrid
   - Automatic reminders via email

5. **Document Generation**
   - PDF contract templates
   - Invoice generation

6. **Advanced Search**
   - Full-text search with PostgreSQL
   - Filters and saved searches

7. **Integration APIs**
   - Property listing platforms (Sahibinden, Emlakjet)
   - Accounting software integration

8. **Multi-language Expansion**
   - Add more languages beyond TR/EN
   - RTL support for Arabic

---

## Important Files Reference

### Configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS theme and plugins
- `tsconfig.json` - TypeScript compiler options
- `components.json` - shadcn/ui component configuration

### Core Application
- `src/main.tsx` - Application entry point
- `src/App.tsx` - Route configuration
- `src/i18n.ts` - Internationalization setup
- `src/index.css` - Global styles and Tailwind imports

### Key Services
- `src/lib/serviceProxy.ts` - Service proxy pattern implementation
- `src/lib/auth.ts` - Authentication utilities
- `src/lib/db.ts` - Database helper functions
- `src/contexts/AuthContext.tsx` - Global auth state

### Design System
- `src/config/colors.ts` - Complete color palette and utilities
- `src/components/ui/` - Radix UI base components

---

## Glossary

**Emlak**: Turkish word for "real estate"
**RLS**: Row Level Security (PostgreSQL security feature)
**PWA**: Progressive Web App
**RPC**: Remote Procedure Call (Supabase database functions)
**BaaS**: Backend as a Service
**SPA**: Single Page Application
**i18n**: Internationalization
**CRUD**: Create, Read, Update, Delete

---

## Development Workflow

### Starting Development
```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Start development server
npm run dev

# 4. Access application
# Open http://localhost:5173
```

### Database Migrations
```bash
# Link Supabase project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Generate TypeScript types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### Before Committing
```bash
npm run lint       # Check for linting errors
npm run typecheck  # Verify TypeScript types
npm run build      # Ensure production build works
```

---

## Contact & Resources

- **Documentation**: See `/docs` folder for detailed guides
- **API Reference**: `/docs/API.md`
- **Architecture**: `/docs/ARCHITECTURE.md`
- **Contributing**: `/docs/CONTRIBUTING.md`
- **Deployment**: `/DEPLOYMENT.md`

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
**Maintained By**: Development Team
