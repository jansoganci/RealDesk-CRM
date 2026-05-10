export const APP_NAME = 'RealDesk';

/** Statutory security deposit return deadlines in days, by US state code. */
export const STATE_DEPOSIT_RETURN_DAYS: Record<string, number> = {
  AL: 35, AK: 14, AZ: 14, AR: 60, CA: 21, CO: 30, CT: 30,
  DE: 20, FL: 15, GA: 30, HI: 14, ID: 30, IL: 45, IN: 45,
  IA: 30, KS: 30, KY: 30, LA: 30, ME: 30, MD: 45, MA: 30,
  MI: 30, MN: 21, MS: 45, MO: 30, MT: 30, NE: 30, NV: 30,
  NH: 30, NJ: 30, NM: 30, NY: 14, NC: 30, ND: 30, OH: 30,
  OK: 30, OR: 31, PA: 30, RI: 20, SC: 30, SD: 30, TN: 30,
  TX: 30, UT: 30, VT: 14, VA: 45, WA: 30, WV: 30, WI: 30,
  WY: 30, DC: 30,
};

/**
 * Maximum security deposit as a multiplier of monthly rent, by US state code.
 * null = no statutory cap.
 * Note: CA allows 3× for furnished units; this map uses the unfurnished cap (2×).
 */
export const STATE_DEPOSIT_CAP_MULTIPLIER: Record<string, number | null> = {
  AL: 1, AK: 2, AZ: 1.5, AR: 2, CA: 2,
  CO: 2, CT: 2, DE: 1, FL: null, GA: null,
  HI: 1, ID: null, IL: null, IN: null, IA: 2,
  KS: 1, KY: null, LA: 1, ME: 2, MD: 2,
  MA: null, MI: 1.5, MN: null, MS: null, MO: 2,
  MT: null, NE: 1, NV: 3, NH: 1, NJ: 1.5,
  NM: 1, NY: 1, NC: 2, ND: 1, OH: null,
  OK: null, OR: null, PA: 2, RI: 1, SC: null,
  SD: 1, TN: null, TX: null, UT: null, VT: null,
  VA: 2, WA: null, WV: null, WI: null, WY: null,
  DC: 1,
};

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
  /** Owner list merged into Property Hub — use PROPERTIES + ?tab=owners */
  OWNER_DETAIL: '/owners/:id',
  OWNER_NEW: '/owners/new',
  /** Tenant list merged into Property Hub — use PROPERTIES + ?tab=tenants */
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
  TIMELINE: '/timeline',
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
  /** Sprint 7 — Applicant screening tracker. */
  SCREENING: '/screening',
  /** Sprint 7 — Security deposit tracker. */
  DEPOSIT_TRACKER: '/deposits',
  /** Sprint 7 — CCPA public privacy rights page (no auth required). */
  CCPA: '/privacy',
  /** Sprint 7 — CCPA admin compliance dashboard (auth required). */
  CCPA_DASHBOARD: '/compliance',
} as const;
