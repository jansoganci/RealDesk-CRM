# Architecture Documentation

This document provides a comprehensive overview of the Real Estate CRM application architecture.

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [State Management](#state-management)
- [Service Layer Pattern](#service-layer-pattern)
- [Database Design](#database-design)
- [File Structure](#file-structure)
- [Technology Decisions](#technology-decisions)

## Overview

The Real Estate CRM is a modern, full-stack web application built with React and Supabase. It follows a service-oriented architecture with clear separation of concerns.

### Architecture Principles

1. **Modularity**: Features are organized into self-contained modules
2. **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
3. **Type Safety**: Full TypeScript coverage for compile-time safety
4. **Scalability**: Architecture supports growth and feature additions
5. **Mobile-First**: Responsive design with mobile optimization

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │           React Application (Frontend)           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │ Features │  │ Services │  │ Contexts │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS/REST API
                           │
┌─────────────────────────────────────────────────────────┐
│                    Supabase Backend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  PostgreSQL  │  │   Storage    │  │     Auth     │ │
│  │   Database   │  │   (Files)    │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │  RPC Functions│  │  RLS Policies│                   │
│  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Hierarchy

```
App.tsx
├── AuthProvider (Context)
│   └── BrowserRouter
│       ├── Routes
│       │   ├── LandingPage
│       │   ├── Login
│       │   └── ProtectedRoute
│       │       ├── Dashboard
│       │       ├── Properties
│       │       ├── Owners
│       │       ├── Tenants
│       │       ├── Contracts
│       │       ├── Reminders
│       │       └── Inquiries
│       └── Toaster (Notifications)
└── Layout Components
    ├── Sidebar
    ├── Navbar
    └── Main Content Area
```

### Feature Module Structure

Each feature follows a consistent structure:

```
features/
└── feature-name/
    ├── FeatureName.tsx          # Main component
    ├── FeatureNameDialog.tsx    # Create/Edit dialog
    ├── featureNameSchema.ts      # Zod validation schema
    └── types.ts                  # Feature-specific types (if any)
```

### Component Organization

```
src/
├── components/
│   ├── common/          # Shared components (EmptyState, MobileCardView)
│   ├── dashboard/        # Dashboard-specific components
│   ├── layout/           # Layout components (Sidebar, Navbar)
│   ├── properties/       # Property-specific components
│   ├── templates/        # Page templates (ListPageTemplate)
│   └── ui/               # Base UI components (Radix UI wrappers)
```

### State Management

**React Context API**
- `AuthContext`: User authentication state
- Provides authentication status and methods across the app

**Local State**
- Component-level state with `useState` and `useReducer`
- Form state managed by React Hook Form

**No Global State Library**
- Purposefully avoids Redux/Zustand for simplicity
- Context API sufficient for current needs
- Can be extended if needed in the future

## Backend Architecture

### Supabase Services

**PostgreSQL Database**
- Relational database with proper normalization
- Row Level Security (RLS) for data access control
- Custom RPC functions for complex operations

**Storage**
- Supabase Storage buckets for files
- `property-photos`: Property images
- `contract-pdfs`: Contract documents

**Authentication**
- Supabase Auth handles user authentication
- Session management via JWT tokens

### Database Layer

**Tables**
- `property_owners`: Owner information
- `properties`: Property details
- `property_photos`: Photo metadata
- `tenants`: Tenant profiles
- `contracts`: Rental contracts
- `property_inquiries`: Lead inquiries
- `inquiry_matches`: Inquiry-property matches

**Relationships**
```
property_owners (1) ──> (many) properties
properties (1) ──> (many) property_photos
properties (1) ──> (many) contracts
tenants (1) ──> (many) contracts
property_inquiries (1) ──> (many) inquiry_matches
properties (1) ──> (many) inquiry_matches
```

**RPC Functions**
- `create_tenant_with_contract`: Atomic tenant and contract creation
- Contract validation functions
- Photo ordering atomic operations

## Data Flow

### Read Operation Flow

```
1. User Action (e.g., View Properties)
   ↓
2. Component calls service method
   ↓
3. Service method calls Supabase client
   ↓
4. Supabase queries database with RLS
   ↓
5. Database returns data
   ↓
6. Service transforms data
   ↓
7. Component receives data and renders
```

### Write Operation Flow

```
1. User Action (e.g., Create Property)
   ↓
2. Form validation (Zod schema)
   ↓
3. Component calls service method
   ↓
4. Service validates and calls Supabase
   ↓
5. Supabase validates with RLS policies
   ↓
6. Database transaction executes
   ↓
7. Service returns result
   ↓
8. Component shows success/error notification
   ↓
9. UI updates (optimistic or refetch)
```

## Security Architecture

### Authentication

- **JWT Tokens**: Supabase handles token generation and validation
- **Session Management**: Automatic token refresh
- **Protected Routes**: `ProtectedRoute` component checks authentication

### Authorization

**Row Level Security (RLS)**
- All tables have RLS enabled
- Policies check `auth.uid()` for user context
- Users can only access their own data

**Storage Policies**
- File access controlled by RLS policies
- Users can only upload/access files they own
- Public read access for specific resources (if needed)

### Data Validation

**Frontend**
- Zod schemas validate all form inputs
- TypeScript provides compile-time type checking

**Backend**
- Database constraints (NOT NULL, CHECK, FOREIGN KEY)
- RLS policies enforce data access rules
- RPC functions validate business logic

## Service Layer Pattern

### Service Abstraction

The application uses a service layer pattern to abstract data access:

```typescript
// Service interface
class PropertiesService {
  async getAll(): Promise<Property[]>
  async getById(id: string): Promise<Property>
  async create(data: PropertyInsert): Promise<Property>
  async update(id: string, data: PropertyUpdate): Promise<Property>
  async delete(id: string): Promise<void>
}
```

### Service Proxy

The `serviceProxy.ts` provides a unified interface that can switch between:
- **Real Services**: Connect to Supabase
- **Mock Services**: Use in-memory data for development/demo

This allows:
- Development without database connection
- Demo mode for presentations
- Easy testing with mock data

## Database Design

### Schema Principles

1. **Normalization**: Proper 3NF normalization
2. **Referential Integrity**: Foreign keys maintain relationships
3. **Audit Trail**: `created_at` and `updated_at` timestamps
4. **Soft Deletes**: Status fields for soft deletion (if needed)

### Key Tables

**property_owners**
- Stores owner information
- Links to multiple properties

**properties**
- Core entity for properties
- Links to owner, photos, contracts

**contracts**
- Rental agreements
- Links property and tenant
- Tracks dates, amounts, status

**property_inquiries**
- Lead management
- Tracks inquiry status and preferences

### Indexes

Strategic indexes for performance:
- Status fields (for filtering)
- Foreign keys (for joins)
- City/district (for location queries)
- Composite indexes for common queries

## File Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components
│   ├── layout/          # Layout components
│   └── ui/              # Base UI primitives
├── config/             # Configuration files
│   ├── colors.ts       # Design tokens
│   ├── constants.ts    # App constants
│   └── supabase.ts     # Supabase client
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── features/           # Feature modules
│   └── [feature]/      # Feature-specific code
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
│   ├── db.ts           # Database helpers
│   ├── dates.ts        # Date utilities
│   ├── rpc.ts          # RPC helpers
│   └── serviceProxy.ts # Service abstraction
├── locales/            # Translation files
├── services/           # Service layer
│   ├── *.service.ts    # Real services
│   └── mockServices/   # Mock services
└── types/              # TypeScript types
    ├── database.ts     # Database types
    └── index.ts        # General types
```

## Technology Decisions

### Frontend Stack

**React 18.3**
- Modern React with hooks
- Concurrent features support
- Large ecosystem

**TypeScript 5.5**
- Type safety
- Better IDE support
- Compile-time error checking

**Vite 5.4**
- Fast development server
- Optimized production builds
- Modern ES module support

**Tailwind CSS 3.4**
- Utility-first CSS
- Rapid UI development
- Consistent design system

**React Router 7.9**
- Client-side routing
- Protected routes
- Code splitting support

**React Hook Form + Zod**
- Performant form handling
- Schema-based validation
- Type-safe forms

### Backend Stack

**Supabase**
- PostgreSQL database
- Built-in authentication
- File storage
- Real-time subscriptions (future use)

**Why Supabase?**
- Rapid development
- Managed infrastructure
- Built-in security (RLS)
- Generous free tier

### Development Tools

**ESLint**
- Code quality checks
- Consistent coding style

**TypeScript**
- Type checking
- Better refactoring support

## Performance Optimizations

### Frontend

- **Code Splitting**: Route-based lazy loading
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: For large lists (future)
- **Image Optimization**: Proper sizing and lazy loading

### Backend

- **Database Indexes**: Strategic indexing for queries
- **Query Optimization**: Efficient Supabase queries
- **Caching**: Browser caching for static assets
- **RLS Efficiency**: Policies optimized for performance

## Future Architecture Considerations

### Potential Improvements

1. **State Management**: Consider Zustand if state becomes complex
2. **Caching Layer**: React Query for server state caching
3. **Real-time**: Supabase real-time subscriptions for live updates
4. **Offline Support**: Service workers for offline functionality
5. **Microservices**: Split into services if scale requires it

### Scalability Path

Current architecture supports:
- Single user → Multi-user (already supported)
- Small dataset → Large dataset (indexes in place)
- Simple features → Complex features (modular structure)

---

For API documentation, see [API.md](./API.md).
For deployment information, see [DEPLOYMENT.md](./DEPLOYMENT.md).

