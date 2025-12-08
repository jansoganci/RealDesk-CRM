# 🏢 Real Estate CRM

Modern, mobile-first Real Estate Customer Relationship Management (CRM) system built for Turkish real estate agents. Manage properties, owners, tenants, contracts, and reminders with an intuitive, responsive interface optimized for mobile devices.

![Version](https://img.shields.io/badge/version-1.1.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)
![React](https://img.shields.io/badge/React-18.3-blue.svg)
![Supabase](https://img.shields.io/badge/Supabase-2.58-green.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [Project Structure](#-project-structure)
- [Key Features](#-key-features)
- [Mobile-First Design](#-mobile-first-design)
- [Database Schema](#-database-schema)
- [API & Services](#-api--services)
- [Development](#-development)
- [Build & Deployment](#-build--deployment)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Modules

- **🏠 Properties Management**
  - Create, edit, and delete properties
  - Property photos management (up to 10 photos per property)
  - Property status tracking (Empty, Occupied, Inactive)
  - Location management (City, District)
  - Photo upload, reordering, and deletion
  - Property-owner relationships

- **👥 Owners Management**
  - Owner profiles with contact information
  - Address management
  - Property count tracking
  - Owner-property relationships

- **🏘️ Tenants Management**
  - Comprehensive tenant profiles
  - Contact information (phone, email)
  - Property assignment
  - Enhanced tenant dialog with contract creation
  - Assignment status tracking

- **📄 Contracts Management**
  - Rental contract creation and management
  - Auto-generated contract PDFs with Turkish template
  - Contract PDF upload and storage
  - Legacy contract import from PDF/DOCX (OCR-based extraction)
  - Start/end date tracking
  - Rent amount management with multi-currency support
  - Contract status (Active, Archived, Inactive)
  - Rent increase reminders
  - Expiration warnings (30 days before expiry)
  - Download/upload PDFs directly from list

- **🔔 Reminders System**
  - Contract expiration reminders
  - Rent increase notifications
  - Reminder settings per contract
  - Visual indicators for upcoming/overdue reminders

- **📊 Dashboard**
  - Property statistics
  - Occupancy rates
  - Contract overview
  - Quick insights and metrics
  - Real-time currency exchange rates (USD/EUR/TRY)
  - Quick add button for rapid entity creation

- **💰 Finance Management**
  - Income and expense tracking
  - Multi-currency support (TRY, USD, EUR)
  - Expense categorization with custom categories
  - Recurring expenses management
  - Budget tracking per category
  - Financial analytics and reports
  - Receipt upload and storage
  - Property and contract linkage

- **📅 Calendar & Meetings**
  - Meeting and appointment scheduling
  - Property viewings management
  - Tenant and client associations
  - Location tracking
  - Calendar view interface

- **💼 Commissions Tracking**
  - Sales commission tracking
  - Rental commission management
  - Multi-currency support
  - Commission history and reports

- **🔍 Property Inquiries**
  - Lead management system
  - Property matching algorithm
  - Client requirements tracking
  - Inquiry status management

### User Experience

- **🔐 Authentication**
  - Secure login system
  - Protected routes
  - Session management

- **📱 Mobile-First Design**
  - Responsive layouts for all screen sizes
  - Touch-friendly interface (44px+ touch targets)
  - Card-based layout for mobile devices
  - Optimized forms for mobile input
  - Progressive Web App (PWA) support
  - "Add to Home Screen" functionality

- **🎨 Modern UI/UX**
  - Clean, intuitive interface
  - Consistent design system
  - Smooth animations and transitions
  - Toast notifications
  - Loading states and skeletons
  - Empty state handling

## 🛠️ Technology Stack

### Frontend

- **React 18.3** - UI library
- **TypeScript 5.5** - Type safety
- **Vite 5.4** - Build tool and dev server
- **React Router 7.9** - Client-side routing
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **React Hook Form 7.53** - Form management
- **Zod 3.23** - Schema validation
- **Sonner** - Toast notifications
- **date-fns 3.6** - Date utilities
- **html2pdf.js** - PDF generation
- **i18next** - Internationalization (TR/EN)

### Backend & Database

- **Supabase 2.58** - Backend as a Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Storage for photos and PDFs
  - Authentication

### Development Tools

- **ESLint** - Code linting
- **TypeScript** - Type checking
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 📸 Screenshots

> Add screenshots here when available

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** 9.x or higher (or **yarn** / **pnpm**)
- **Supabase account** - [Sign up here](https://supabase.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd emlak-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

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

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under "API" → "Project API keys".

### Database Setup

The project uses Supabase with PostgreSQL. Database migrations are located in `supabase/migrations/`.

#### Option 1: Using Supabase CLI (Recommended)

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

#### Option 2: Manual Migration

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Run the migration files in order (from `supabase/migrations/`)

#### Migration Files

The project includes the following migrations:

- `20251027212110_create_property_owners_table.sql`
- `20251027212128_create_properties_table.sql`
- `20251027212207_create_property_photos_table.sql`
- `20251027212222_create_tenants_table.sql`
- `20251027212239_create_contracts_table.sql`
- `20251027214804_add_address_to_property_owners.sql`
- `20251027221845_create_contract_pdfs_storage_policies.sql`
- `20251027223441_add_rent_increase_reminders_to_contracts.sql`
- `20251028072523_create_property_photos_storage_bucket.sql`
- `20251028125634_fix_security_issues.sql`
- `20251030_create_tenant_with_contract_rpc.sql`
- `20250103000000_add_contract_validation_rpcs.sql`
- `20251030120000_add_contract_create_rpc.sql`
- `20251030123000_photo_ordering_atomic.sql`
- `20251102*.sql` - Multi-currency support
- `20251104*.sql` - Meetings table
- `20251110*.sql` - User preferences updates
- `20251111*.sql` - Financial system
- `20250105*.sql` - Property inquiries and commissions
- `20251120*.sql` - Contract management enhancements

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

Builds the app for production to the `dist` folder.

#### Preview Production Build

```bash
npm run preview
```

Preview the production build locally.

#### Type Checking

```bash
npm run typecheck
```

Run TypeScript type checking without emitting files.

#### Linting

```bash
npm run lint
```

Run ESLint to check code quality.

## 📁 Project Structure

```
emlak-crm/
├── public/                  # Static assets
│   ├── manifest.json       # PWA manifest
│   └── vite.svg            # App icon
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Common components (EmptyState, etc.)
│   │   ├── dashboard/      # Dashboard-specific components
│   │   ├── layout/         # Layout components (Sidebar, Navbar, etc.)
│   │   ├── properties/     # Property-related components
│   │   ├── templates/      # Page templates (ListPageTemplate)
│   │   └── ui/             # Base UI components (from Radix UI)
│   ├── config/             # Configuration files
│   │   ├── colors.ts       # Color scheme and design tokens
│   │   ├── constants.ts    # App constants and routes
│   │   └── supabase.ts     # Supabase client configuration
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── features/           # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── calendar/       # Calendar and meetings
│   │   ├── contracts/      # Contracts management
│   │   │   └── import/     # Legacy contract import
│   │   ├── dashboard/      # Dashboard
│   │   ├── finance/        # Financial tracking
│   │   ├── inquiries/      # Property inquiries
│   │   ├── owners/         # Owners management
│   │   ├── properties/     # Properties management
│   │   ├── reminders/      # Reminders system
│   │   └── tenants/        # Tenants management
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   │   ├── dates.ts       # Date utilities
│   │   ├── db.ts           # Database helpers
│   │   ├── rpc.ts          # RPC function helpers
│   │   ├── serviceProxy.ts # Service abstraction layer
│   │   └── utils.ts        # General utilities
│   ├── services/           # API service layers
│   │   ├── contracts.service.ts
│   │   ├── owners.service.ts
│   │   ├── photos.service.ts
│   │   ├── properties.service.ts
│   │   ├── reminders.service.ts
│   │   ├── tenants.service.ts
│   │   └── mockServices/   # Mock services for development
│   ├── types/              # TypeScript type definitions
│   │   ├── database.ts     # Database types
│   │   ├── index.ts        # General types
│   │   └── rpc.ts          # RPC function types
│   ├── App.tsx             # Main App component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── supabase/
│   └── migrations/         # Database migration files
├── docs/                   # Documentation
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── tailwind.config.js     # Tailwind CSS configuration
```

## 🔑 Key Features

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

- **Auto-generated PDFs** - Turkish rental contract template with html2pdf.js
- **PDF Upload** - Upload existing contract PDFs
- **PDF Download** - Download contracts with signed URLs
- **Legacy Import** - Import existing contracts from PDF/DOCX with OCR
- **Turkish Font Support** - Proper rendering of Turkish characters (İ, Ş, Ğ, Ü, Ö, Ç)
- Store in Supabase Storage
- Secure access with RLS policies

### Mobile-First Design

The application is fully optimized for mobile devices:

- **Touch Targets**: All interactive elements meet 44px minimum touch target size
- **Responsive Layouts**: Cards on mobile, tables on desktop
- **Form Optimization**: Single-column forms on mobile, multi-column on desktop
- **Truncation**: Smart text truncation to prevent overflow
- **PWA Support**: Installable as a Progressive Web App

## 📱 Mobile-First Design

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

## 🗄️ Database Schema

### Core Tables

- **property_owners** - Property owner information
- **properties** - Property details and status
- **property_photos** - Property photo references
- **tenants** - Tenant profiles
- **contracts** - Rental contracts with relationships
- **meetings** - Calendar appointments and property viewings
- **property_inquiries** - Lead management and property matching
- **commissions** - Sales and rental commission tracking
- **financial_transactions** - Income and expense tracking
- **expense_categories** - Financial categorization system
- **recurring_expenses** - Recurring financial obligations
- **user_preferences** - User settings and preferences

### Key Relationships

```
property_owners (1) ──┐
                       ├──> (many) properties (1) ──> (many) property_photos
                       │
properties (1) ────> (many) contracts (many) <─── (1) tenants
```

### Security

- Row Level Security (RLS) policies on all tables
- Secure file storage with access policies
- Authenticated user context for data access

## 🔌 API & Services

The application uses a service layer pattern. For complete API documentation, see [docs/API.md](./docs/API.md).

### Service Files

- `properties.service.ts` - Property CRUD operations
- `owners.service.ts` - Owner management
- `tenants.service.ts` - Tenant operations
- `contracts.service.ts` - Contract management
- `contractPdf.service.ts` - PDF generation and management
- `textExtraction.service.ts` - OCR text extraction from PDFs
- `photos.service.ts` - Photo upload and management
- `reminders.service.ts` - Reminder operations
- `inquiries.service.ts` - Property inquiry management
- `meetings.service.ts` - Calendar and meeting management
- `commissions.service.ts` - Commission tracking
- `financialTransactions.service.ts` - Financial tracking
- `userPreferences.service.ts` - User settings management

### Service Proxy

The `serviceProxy.ts` provides a unified interface for services, allowing easy switching between mock and real services during development.

### RPC Functions

The database includes custom RPC functions for complex operations:

- `create_tenant_with_contract` - Atomic tenant and contract creation
- Contract validation functions
- Photo ordering atomic operations

For detailed API documentation including method signatures, parameters, return types, and examples, see [docs/API.md](./docs/API.md).

## 💻 Development

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Consistent component structure
- Feature-based folder organization

### Adding a New Feature

1. Create feature folder in `src/features/`
2. Add service in `src/services/`
3. Update routes in `src/config/constants.ts`
4. Add route in `src/App.tsx`
5. Add navigation item in `src/components/layout/Sidebar.tsx`

### Component Guidelines

- Use TypeScript for all components
- Follow the design system in `src/config/colors.ts`
- Use Radix UI components from `src/components/ui/`
- Implement responsive design patterns
- Add loading and empty states
- Handle errors gracefully

## 🚢 Build & Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

The application can be deployed to:

- **Vercel** - Zero-config deployment (recommended)
- **Netlify** - Automatic deployments
- **Supabase Hosting** - Integrated with backend
- **GitHub Pages** - Free hosting for public repos
- **AWS S3 + CloudFront** - Scalable static hosting
- **Docker** - Containerized deployment
- **Any static hosting service**

### Environment Variables for Production

Ensure your production environment has:

```
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

For platform-specific deployment guides, troubleshooting, and best practices, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📚 Documentation

Comprehensive documentation is available for developers:

- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Technical architecture and system design
- **[docs/API.md](./docs/API.md)** - Complete API documentation for all services
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guides for various platforms
- **[docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)** - Contribution guidelines and development workflow
- **[docs/design_rulebook.md](./docs/design_rulebook.md)** - Design system and UI guidelines

### Quick Links

- **Getting Started**: See [Installation](#installation) section
- **Architecture**: See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **API Reference**: See [docs/API.md](./docs/API.md)
- **Deploying**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Contributing**: See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./docs/CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Coding standards
- Commit guidelines
- Pull request process

### Quick Start for Contributors

1. Fork the repository
2. Read [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)
3. Create a feature branch (`git checkout -b feature/amazing-feature`)
4. Make your changes following our coding standards
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

For detailed guidelines, see [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./docs/LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Radix UI](https://www.radix-ui.com) - Accessible component primitives
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Vite](https://vitejs.dev) - Next-generation frontend tooling
- [React](https://react.dev) - UI library

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Built with ❤️ for Turkish Real Estate Agents**

