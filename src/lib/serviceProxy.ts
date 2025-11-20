/**
 * Service Proxy - Central export point for all services
 * Previously handled demo mode routing, now simplified to direct exports
 */

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


// Re-export types that components depend on
export type { ReminderWithDetails } from '../services/reminders.service';

// Contract Management Services (V1)
export { encrypt, decrypt, hashTC, isValidTC, isValidIBAN, generateEncryptionKey } from '../services/encryption.service';
export { normalizePhone, formatPhoneForDisplay, isValidPhone, detectPhoneFormat } from '../services/phone.service';
export { normalizeAddress, generateFullAddress, parseAddress, isValidAddress, addressesMatch, getShortAddress } from '../services/address.service';
export type { AddressComponents } from '../services/address.service';
