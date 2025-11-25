# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-11-24

### Added
- **Legacy Contract Import** - Complete import wizard for existing PDF/DOCX contracts
  - OCR-based text extraction using Flavius API
  - Smart data parsing for Turkish contracts
  - Side-by-side PDF preview and form editing
  - Graceful degradation for failed extractions
  - Auto-linking to existing owners/tenants/properties
  - Accessible via `/contracts/import` route

- **Finance Management System** - Comprehensive financial tracking
  - Income and expense tracking with categorization
  - Multi-currency support (TRY, USD, EUR) with live exchange rates
  - Recurring expenses management
  - Budget tracking per category
  - Financial analytics and reports
  - Receipt upload to Supabase Storage
  - Property and contract linkage

- **Calendar & Meetings** - Schedule and track appointments
  - Meeting scheduling with date and time
  - Property and tenant associations
  - Calendar view interface
  - Location tracking
  - Client contact information

- **Commissions Tracking** - Sales and rental commission management
  - Track sale and rental commissions
  - Multi-currency support
  - Property and contract linkage
  - Commission history

- **PDF Auto-Generation** - Generate contract PDFs automatically
  - Turkish rental contract template
  - html2pdf.js integration
  - Turkish font support (Roboto with Turkish characters)
  - Auto-save to Supabase Storage
  - Download to browser

- **PDF Download/Upload Buttons** - Direct PDF management from contracts list
  - Download existing contract PDFs
  - Upload PDFs for contracts without files
  - Signed URL generation for secure access

- **Exchange Rate Integration** - Real-time currency conversion
  - Live USD/EUR exchange rates
  - Manual refresh capability
  - Timestamp tracking
  - Currency preference per user

- **Quick Add Button** - Rapid entity creation from any page
  - Quick add for properties, owners, tenants
  - Accessible from dashboard and main pages

- **Property Inquiries System** - Lead management and property matching
- **Listing URL field** - External listing links for properties
- **Enhanced contract validation** - RPC functions for data validation
- **User preferences table** - Store user settings with RLS policies

### Changed
- **Contract Import UX** - Consolidated import flow with better mobile support
- **PDF handling** - Switched from public to signed URLs for private bucket access
- **Currency display** - Dynamic conversion based on user preferences
- **Dashboard layout** - Added exchange rates bar and quick actions
- **Navigation** - Added prominent import banner on contracts page

### Fixed
- **PDF download 404 error** - Fixed bucket access using signed URLs instead of public URLs
- **Security issues** - Enhanced RLS policies across all tables
- **Photo ordering** - Atomic operations for concurrent updates
- **Turkish character rendering** - Proper font support in generated PDFs
- **Contract creation flow** - Improved validation and error handling

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

