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

// Contract Management Services (V2)
export { createContractWithEntities, getContractWithDetails } from '../services/contractCreation.service';

// Contract Management Services (V3 - Duplicate Detection)
export { checkDuplicateName, checkDataChanges, checkMultipleContracts } from '../services/duplicateCheck.service';
export type { DuplicateNameCheck, DataChangesCheck, MultipleContractsCheck } from '../services/duplicateCheck.service';

// Text Extraction Service
export { extractTextFromFile, extractTextFromFileViaProxy, parseContractFromText } from '../services/textExtraction.service';
export type { ExtractTextRequest, ExtractTextResponse, ExtractTextError, ParsedContractData } from '../services/textExtraction.service';
