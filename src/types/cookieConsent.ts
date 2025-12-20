/**
 * Cookie Consent TypeScript Types
 * 
 * Type definitions for cookie consent system.
 * Matches database schema in consent_logs table.
 */

/**
 * Consent Categories
 * Represents user consent for each cookie category
 */
export interface ConsentCategories {
  /** Essential cookies - always true, required for site functionality */
  essential: boolean;
  /** Analytics cookies - opt-in required (GTM, Google Analytics) */
  analytics: boolean;
  /** Marketing cookies - opt-in required (Meta Pixel, etc.) */
  marketing: boolean;
}

/**
 * Consent Record
 * Matches the database schema for consent_logs table
 */
export interface ConsentRecord {
  /** Unique identifier for the consent record */
  id: string;
  /** When the consent decision was made */
  timestamp: Date;
  /** Version of the consent banner implementation */
  version: string;
  /** Consent status for each category */
  categories: ConsentCategories;
  /** User ID if authenticated, undefined for anonymous users */
  userId?: string;
  /** Unique session identifier */
  sessionId: string;
  /** Browser user agent string */
  userAgent?: string;
  /** Language in which consent was given */
  language: 'tr' | 'en';
  /** Database record creation timestamp */
  createdAt?: Date;
}

/**
 * Consent State
 * State managed by the useCookieConsent hook
 */
export interface ConsentState {
  /** Current consent status for each category */
  consent: ConsentCategories;
  /** Whether to show the initial consent banner */
  showBanner: boolean;
  /** Whether to show the preferences modal */
  showPreferences: boolean;
}

/**
 * Consent Record Insert
 * Type for inserting new consent records (without id and createdAt)
 */
export type ConsentRecordInsert = Omit<ConsentRecord, 'id' | 'createdAt'>;



