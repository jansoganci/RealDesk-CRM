# Ornet ERP - Operations Platform for a Physical Security Company
**Built solo. Live in production. Full-stack, role-based, multi-module.**

## 1) The Problem
A physical security company was managing 100+ customers, field technicians, alarm subscriptions, and equipment through spreadsheets and WhatsApp.  
There was no clear view of overdue payments, open jobs, or installed equipment by site.  
Operations, finance, and field teams were working with fragmented data.

## 2) What I Built
- **Work Order Management**: Keşif, montaj, servis, bakım work types with a status machine, technician assignment, and materials tracking.
- **Customer Management**: Multi-site customer records with account numbers and full service history.
- **Subscription Billing**: Monthly and yearly alarm or camera rental contracts with a monthly payment grid and overdue tracking.
- **SIM Card Inventory**: Tracking for 2,500+ SIM cards in security devices, including location, owner, revenue, and status.
- **Site Assets / Equipment Lifecycle**: Equipment registration per customer site, with installation and removal events linked to work orders.
- **Finance Module**: Income, expenses, VAT, TCMB exchange rates, and P&L reporting.
- **Proposals / Quotes**: Offer generation with PDF export, connected to work order flow.
- **Customer Situation Board**: Real-time customer health states as critical, warning, or healthy based on overdue days and open work order age.
- **Notifications**: In-app alerts triggered by system events.
- **Role-based access**: Admin, accountant, and field technician views with role-specific permissions.

## 3) Tech Stack
| Layer | Tools |
| --- | --- |
| Frontend | React 19, Vite 7, React Router 7 |
| Data Fetching | TanStack Query 5 |
| Forms and Validation | react-hook-form, zod |
| Backend | Supabase (PostgreSQL, RLS, Storage) |
| UI | Tailwind CSS 4, lucide-react |
| Localization and UX | i18next, sonner |
| Utilities | date-fns |

## 4) Architecture Highlights
- Feature-module architecture. Each domain has its own `api.js`, `hooks.js`, and `schema.js` for clear boundaries.
- All data access runs through Supabase Row Level Security. Roles are enforced in the database layer, not only in the UI.
- React Query is used across modules for optimistic updates, cache invalidation, and background refetch.
- Zod schemas validate data before writes and also power UI-level validation.

## 5) What This Proves
- I can build multi-role dashboards with permission-specific views.
- I can design status-based workflows for approval and completion.
- I can build inventory systems that update automatically after job completion.
- I can implement recurring billing with clear payment tracking.
- I can ship health and status monitoring across large record sets.
- I can generate PDFs from structured operational data.
- I can take a product from zero to production solo.

## 6) Live Demo
[Demo link - available on request]

Credentials provided on request. Read-only demo account available.

## 7) Footer
Built by Umur - available for new projects on Upwork.
