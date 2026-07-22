export const APP_NAME = 'RealDesk';

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
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_PDF_TYPES = ['application/pdf'];

export const CONTRACT_EXPIRATION_WARNING_DAYS = 30;
export const ITEMS_PER_PAGE = 20;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  CONFIRM_EMAIL: '/confirm-email',
  EMAIL_CHANGED: '/email-changed',
  PRICING: '/pricing',
  ABOUT: '/about',
  CONTACT: '/contact',
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

  // Contracts Hub (NEW)
  CONTRACTS_HUB: '/contracts',

  // Rent contracts (moved to /contracts/rent/*)
  CONTRACTS_RENT: '/contracts/rent',
  CONTRACTS_RENT_CREATE: '/contracts/rent/create',
  CONTRACTS_RENT_EDIT: '/contracts/rent/:id/edit',
  CONTRACTS_RENT_IMPORT: '/contracts/rent/import',
  CONTRACTS_LEASE_NEW: '/contracts/lease/new',
  CONTRACTS_LEASE_DETAIL: '/contracts/lease/:id',
  /** Sprint 6A — US lease agreement wizard (8 steps + PDF / save). */
  CONTRACTS_LEASE_WIZARD: '/contracts/rent/lease-wizard',

  /** Sprint 6B — US purchase agreement wizard (9 steps + PDF; CRM save in T12). */
  CONTRACTS_PURCHASE_NEW: '/contracts/purchase/new',
  /** Sprint 6B T15 — Read-only purchase contract summary + links (contract UUID). */
  CONTRACTS_PURCHASE_DETAIL: '/contracts/purchase/:id',

  // Sale contracts (NEW v2)
  CONTRACTS_SALE: '/contracts/sale',
  CONTRACTS_SALE_CREATE: '/contracts/sale/create',
  CONTRACTS_SALE_EDIT: '/contracts/sale/:id/edit',

  // Legacy aliases (for backwards compatibility with existing rent module code)
  CONTRACTS: '/contracts/rent',
  CONTRACT_DETAIL: '/contracts/rent/:id',
  CONTRACT_NEW: '/contracts/rent/new',
  CONTRACT_CREATE: '/contracts/rent/create',
  CONTRACT_IMPORT: '/contracts/rent/import',

  REMINDERS: '/reminders',
  /** Lead pipeline (replaces legacy inquiries UI). */
  LEADS: '/leads',
  LEAD_DETAIL: '/leads/:id',
  /** Sprint 3 — deal pipeline (offers, milestones). */
  DEALS: '/deals',
  DEAL_DETAIL: '/deals/:id',
  /** @deprecated Use ROUTES.LEADS — kept for redirects and bookmarks */
  INQUIRIES: '/inquiries',
  CALENDAR: '/calendar',
  FINANCE: '/finance',
  PROFILE: '/profile',
  TEAM: '/team',
  BILLING_SUBSCRIBE: '/billing/subscribe',
  ONBOARDING: '/onboarding',
  ACCEPT_INVITE: '/accept-invite',
  AUTH_CALLBACK: '/auth/callback',
} as const;
