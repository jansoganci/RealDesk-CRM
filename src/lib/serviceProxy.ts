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
export * as financialTransactionsService from '../services/financialTransactions.service';


// Re-export types that components depend on
export type { ReminderWithDetails } from '../services/reminders.service';
