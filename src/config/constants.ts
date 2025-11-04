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
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
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
  REMINDERS: '/reminders',
  INQUIRIES: '/inquiries',
  CALENDAR: '/calendar',
} as const;
