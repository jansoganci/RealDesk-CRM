# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Property Inquiries System - Lead management and property matching
- Multi-currency support (USD, TRY) for properties and contracts
- Listing URL field for properties
- Enhanced contract validation RPC functions
- User preferences table with RLS policies

### Changed
- Updated database schema for better property matching
- Improved contract creation workflow

### Fixed
- Security issues in RLS policies
- Photo ordering atomic operations

## [1.0.0] - 2025-01-05

### Added
- **Initial Release** - Complete Real Estate CRM system
- **Properties Management**
  - Create, edit, and delete properties
  - Property photos management (up to 10 photos)
  - Photo upload, reordering, and deletion
  - Property status tracking (Empty, Occupied, Inactive)
  - Location management (City, District)
  
- **Owners Management**
  - Owner profiles with contact information
  - Address management
  - Property count tracking
  - Owner-property relationships

- **Tenants Management**
  - Comprehensive tenant profiles
  - Contact information (phone, email)
  - Property assignment
  - Enhanced tenant dialog with contract creation
  - Assignment status tracking

- **Contracts Management**
  - Rental contract creation and management
  - Contract PDF upload and storage
  - Start/end date tracking
  - Rent amount management
  - Contract status (Active, Archived, Inactive)
  - Rent increase reminders
  - Expiration warnings (30 days before expiry)

- **Reminders System**
  - Contract expiration reminders
  - Rent increase notifications
  - Reminder settings per contract
  - Visual indicators for upcoming/overdue reminders

- **Dashboard**
  - Property statistics
  - Occupancy rates
  - Contract overview
  - Quick insights and metrics

- **Authentication**
  - Secure login system
  - Protected routes
  - Session management

- **Mobile-First Design**
  - Responsive layouts for all screen sizes
  - Touch-friendly interface (44px+ touch targets)
  - Card-based layout for mobile devices
  - Optimized forms for mobile input
  - Progressive Web App (PWA) support
  - "Add to Home Screen" functionality

- **Internationalization (i18n)**
  - English and Turkish language support
  - Language switching
  - Comprehensive translation coverage

- **Database Features**
  - PostgreSQL database with Supabase
  - Row Level Security (RLS) policies
  - Secure file storage for photos and PDFs
  - Custom RPC functions for complex operations
  - Atomic operations for tenant-contract creation

### Technical Stack
- React 18.3 with TypeScript 5.5
- Vite 5.4 for build tooling
- React Router 7.9 for routing
- Tailwind CSS 3.4 for styling
- Radix UI for accessible components
- React Hook Form 7.53 with Zod 3.23 validation
- Supabase 2.58 for backend
- date-fns 3.6 for date utilities
- i18next for internationalization

### Database Migrations
- Initial schema creation (property_owners, properties, property_photos, tenants, contracts)
- Address fields for property owners
- Contract PDFs storage policies
- Rent increase reminders
- Property photos storage bucket
- Security fixes
- Tenant with contract RPC
- Contract creation RPC
- Photo ordering atomic operations

---

## Version History

- **v1.0.0** (2025-01-05): Initial release with core features
- **v0.x.x** (2024-10-27 to 2025-01-04): Development phase

---

## Release Notes Format

### Breaking Changes
- None in v1.0.0

### Deprecations
- None currently

### Migration Guide
- For upgrading from development versions, run all database migrations in order
- Ensure environment variables are properly configured
- Clear browser cache if experiencing issues after update

---

For detailed technical changes, see the [ARCHITECTURE.md](./docs/ARCHITECTURE.md) and commit history.

