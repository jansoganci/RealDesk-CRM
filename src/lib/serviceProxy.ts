/**
 * Service Proxy - Central export point for all services
 * Previously handled demo mode routing, now simplified to direct exports
 */

export { handleServiceError } from './handleServiceError';

// Direct service exports
export { organizationService } from '../services/organization.service';
export { ownersService } from '../services/owners.service';
export { propertiesService } from '../services/properties.service';
export { tenantsService } from '../services/tenants.service';
export { contractsService } from '../services/contracts.service';
export { onboardingService } from '../features/onboarding/services/onboarding.service';
export { leaseAgreementService } from '../services/leaseAgreement.service';
export type {
  CreateLeaseAgreementInput,
  LeaseDetailsPatch,
  LeaseContractWithDetails,
  RegenerateLeasePdfResult,
} from '../services/leaseAgreement.service';
export { purchaseAgreementService } from '../services/purchaseAgreement.service';
export type {
  CloseDealResult,
  CreatePurchaseWithDetailsInput,
  CreatePurchaseAgreementInput,
  PurchaseCounterOfferInput,
  PurchaseContractWithDetailsRelation,
  PurchaseContractWithDetails,
  PurchaseCounterOfferSync,
  PurchaseDetailsWithContract,
  UploadAddendumResult,
} from '../services/purchaseAgreement.service';
export { leaseAgreementPdfService } from '../services/leaseAgreementPdf.service';
export type { LeaseAgreementPdfInput } from '../services/leaseAgreementPdf.service';
export { purchaseAgreementPdfService } from '../services/purchaseAgreementPdf.service';
export type { PurchaseAgreementPdfInput } from '../services/purchaseAgreementPdf.service';
export { remindersService } from '../services/reminders.service';
export { photosService } from '../services/photos.service';
export { inquiriesService } from '../services/inquiries.service';
export { leadsService } from '../services/leads.service';
export { buyerAgentAgreementsService } from '../services/buyerAgentAgreements.service';
export type { BuyerAgentAgreement, CreateAgreementInput, AgreementStatus } from '../services/buyerAgentAgreements.service';
export { showingLogsService } from '../services/showingLogs.service';
export type { ShowingLog, CreateShowingLogInput, InterestLevel, ShowingFeedback } from '../services/showingLogs.service';
export { dealsService } from '../services/deals.service';
export type {
  CreateDealInput,
  DealWithRelations,
  DealStats,
  UpdateDealInput,
} from '../services/deals.service';
export { offerRoundsService } from '../services/offerRounds.service';
export type {
  CreateFirstOfferInput,
  AddCounterOfferInput,
  OfferedBy,
} from '../services/offerRounds.service';
export { offerContingenciesService } from '../services/offerContingencies.service';
export type {
  ContingencyResolution,
  DefaultContingencyTemplate,
} from '../services/offerContingencies.service';
export { dailyBriefService } from '../services/dailyBrief.service';
export { notificationsService } from '../services/notifications.service';
export { dealPartiesService } from '../services/dealParties.service';
export {
  addCustomMilestone,
  addMilestoneNote,
  getByDeal,
  getMilestoneDocument,
  regenerateTimelineMilestones,
  sendNudge,
  updateMilestoneDueDate,
  updateMilestoneStatus,
  uploadMilestoneDocument,
} from '../services/timelineMilestones.service';
export { meetingsService } from '../services/meetings.service';
export { commissionsService } from '../services/commissions.service';
export { calculateCommission } from '../services/commissionCalculator';
export { userPreferencesService } from '../services/userPreferences.service';
export * as financialTransactionsService from '../services/finance';


// Re-export types that components depend on
export type { 
  ReminderWithDetails,
  ReminderCategories,
  NewReminderCategories,
  ProgressInfo,
} from '../services/reminders.service';

// Contract Management Services (V1)
export { encrypt, decrypt, hashTaxId, isValidTaxId, isValidRoutingNumber, isValidAccountNumber, generateEncryptionKey } from '../services/encryption.service';
export { normalizePhone, formatPhoneForDisplay, isValidPhone, detectPhoneFormat, formatPhoneForStorage } from '../services/phone.service';
export { normalizeAddress, generateFullAddress, parseAddress, isValidAddress, addressesMatch, getShortAddress, US_STATES, isValidZipCode, isValidState } from '../services/address.service';
export type { AddressComponents } from '../services/address.service';

// Contract Management Services (V2)
export { createContractWithEntities, getContractWithDetails } from '../services/contractCreation.service';

// Contract Management Services (V3 - Duplicate Detection)
export { checkDuplicateName, checkDataChanges, checkMultipleContracts } from '../services/duplicateCheck.service';
export type { DuplicateNameCheck, DataChangesCheck, MultipleContractsCheck } from '../services/duplicateCheck.service';

// Text Extraction Service
export { extractTextFromFile, extractTextFromFileViaProxy, parseContractFromText } from '../services/textExtraction.service';
export type { ExtractTextRequest, ExtractTextResponse, ExtractTextError, ParsedContractData } from '../services/textExtraction.service';
