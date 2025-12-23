/**
 * Cookie Consent Storage Utilities
 * 
 * Handles localStorage operations for cookie consent state.
 * Provides functions to read, write, and check consent status.
 * Includes fallback to in-memory storage when localStorage is unavailable.
 */

import type { ConsentCategories } from '@/types/cookieConsent';
import { CONSENT_VERSION, CONSENT_EXPIRY_ENABLED, CONSENT_EXPIRY_DAYS } from './cookieConfig';
import { createLogger } from './logger';

const logger = createLogger('CookieConsent');

/**
 * Storage key for consent data in localStorage
 */
const CONSENT_STORAGE_KEY = 'cookie-consent';

/**
 * Storage key for session ID in sessionStorage
 */
const SESSION_ID_KEY = 'cookie-consent-session-id';

/**
 * Consent Storage Data Structure
 */
interface ConsentStorageData {
  version: string;
  timestamp: string; // ISO 8601 string
  categories: ConsentCategories;
}

/**
 * Storage availability result
 */
interface StorageAvailability {
  available: boolean;
  error?: 'quota' | 'security' | 'unavailable';
}

/**
 * In-memory fallback storage (used when localStorage is unavailable)
 */
const inMemoryStorage = new Map<string, ConsentStorageData>();

/**
 * Check if storage is available
 * 
 * @param type Storage type to check ('localStorage' | 'sessionStorage')
 * @returns StorageAvailability - Availability status and error type if unavailable
 */
export function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): StorageAvailability {
  try {
    if (typeof window === 'undefined') {
      return { available: false, error: 'unavailable' };
    }

    const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
    const testKey = `__storage_test_${Date.now()}`;

    // Try to set and remove a test item
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);

    return { available: true };
  } catch (error) {
    // Check error type
    if (error instanceof DOMException) {
      if (error.code === 22 || error.code === 1014 || error.name === 'QuotaExceededError') {
        // Quota exceeded
        return { available: false, error: 'quota' };
      } else if (error.code === 18 || error.name === 'SecurityError') {
        // Security error (blocked by browser)
        return { available: false, error: 'security' };
      }
    }

    // Other errors (unavailable)
    return { available: false, error: 'unavailable' };
  }
}

/**
 * Check if localStorage is available, fallback to in-memory
 * 
 * @returns boolean - true if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  return isStorageAvailable('localStorage').available;
}

/**
 * Get consent data from localStorage or in-memory fallback
 * 
 * @returns ConsentStorageData | null if no consent data exists
 */
export function getConsentFromStorage(): ConsentStorageData | null {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    // Try localStorage first
    if (isLocalStorageAvailable()) {
      try {
        const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (!stored) {
          // Check in-memory fallback
          return inMemoryStorage.get(CONSENT_STORAGE_KEY) || null;
        }

        const parsed = JSON.parse(stored) as ConsentStorageData;
        
        // Validate structure
        if (
          parsed &&
          typeof parsed.version === 'string' &&
          typeof parsed.timestamp === 'string' &&
          parsed.categories &&
          typeof parsed.categories.essential === 'boolean' &&
          typeof parsed.categories.analytics === 'boolean' &&
          typeof parsed.categories.marketing === 'boolean'
        ) {
          // Check version and migrate if needed
          if (parsed.version !== CONSENT_VERSION) {
            const migratedCategories = migrateConsentVersion(parsed, CONSENT_VERSION);
            if (migratedCategories === null) {
              // Migration failed, clear and show banner
              clearConsentFromStorage();
              return null;
            }
            // Update stored data with migrated version
            parsed.version = CONSENT_VERSION;
            parsed.categories = migratedCategories;
            parsed.timestamp = new Date().toISOString();
            // Save migrated data
            try {
              localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(parsed));
              inMemoryStorage.set(CONSENT_STORAGE_KEY, parsed);
            } catch (error) {
              logger.debug('Failed to save migrated consent:', error);
            }
          }

          // Check consent expiry (only if feature flag is enabled)
          if (CONSENT_EXPIRY_ENABLED && isConsentExpired(parsed.timestamp)) {
            // Consent has expired, clear it and show banner
            logger.debug(`Consent expired after ${CONSENT_EXPIRY_DAYS} days, clearing storage`);
            clearConsentFromStorage();
            return null;
          }

          return parsed;
        }

        // Invalid structure, clear it
        clearConsentFromStorage();
        return null;
      } catch (error) {
        // localStorage read failed, try in-memory fallback
        logger.debug('localStorage read failed, using in-memory fallback:', error);
        return inMemoryStorage.get(CONSENT_STORAGE_KEY) || null;
      }
    } else {
      // localStorage unavailable, use in-memory fallback
      return inMemoryStorage.get(CONSENT_STORAGE_KEY) || null;
    }
  } catch (error) {
    logger.error('Error reading consent from storage:', error);
    return null;
  }
}

/**
 * Save consent data to localStorage or in-memory fallback
 * 
 * @param categories Consent categories to save
 */
export function saveConsentToStorage(categories: ConsentCategories): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    const data: ConsentStorageData = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      categories: {
        essential: true, // Always true
        analytics: categories.analytics ?? false,
        marketing: categories.marketing ?? false,
      },
    };

    // Try localStorage first
    if (isLocalStorageAvailable()) {
      try {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(data));
        // Also save to in-memory as backup
        inMemoryStorage.set(CONSENT_STORAGE_KEY, data);
      } catch (error) {
        // localStorage write failed, use in-memory fallback
        logger.debug('localStorage write failed, using in-memory fallback:', error);
        inMemoryStorage.set(CONSENT_STORAGE_KEY, data);
      }
    } else {
      // localStorage unavailable, use in-memory fallback
      inMemoryStorage.set(CONSENT_STORAGE_KEY, data);
    }
  } catch (error) {
    logger.error('Error saving consent to storage:', error);
    // Last resort: try in-memory fallback
    try {
      const data: ConsentStorageData = {
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString(),
        categories: {
          essential: true,
          analytics: categories.analytics ?? false,
          marketing: categories.marketing ?? false,
        },
      };
      inMemoryStorage.set(CONSENT_STORAGE_KEY, data);
    } catch (fallbackError) {
      logger.error('In-memory fallback also failed:', fallbackError);
    }
  }
}

/**
 * Clear consent data from localStorage and in-memory fallback
 */
export function clearConsentFromStorage(): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    // Clear from localStorage if available
    if (isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
      } catch (error) {
        logger.debug('localStorage clear failed:', error);
      }
    }

    // Always clear from in-memory fallback
    inMemoryStorage.delete(CONSENT_STORAGE_KEY);
  } catch (error) {
    logger.error('Error clearing consent from storage:', error);
  }
}

/**
 * Check if user has consented to a specific category
 * 
 * @param category Category to check ('essential' | 'analytics' | 'marketing')
 * @returns boolean - true if consented, false otherwise
 */
export function hasConsent(category: keyof ConsentCategories): boolean {
  // Essential cookies are always allowed
  if (category === 'essential') {
    return true;
  }

  const stored = getConsentFromStorage();
  if (!stored) {
    return false;
  }

  return stored.categories[category] === true;
}

/**
 * Generate a cryptographically secure random string
 * Uses crypto.getRandomValues() for security, falls back to Math.random() if unavailable
 * 
 * @param length Length of the random string to generate
 * @returns string - Random base36 string
 */
function generateRandomString(length: number): string {
  try {
    // Use crypto.getRandomValues() for cryptographically secure random bytes
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(Math.ceil(length * 3 / 4)); // Base36 encoding needs ~4/3 bytes per char
      crypto.getRandomValues(bytes);
      
      // Convert bytes to base36 string
      let result = '';
      for (let i = 0; i < bytes.length && result.length < length; i++) {
        const char = bytes[i].toString(36);
        result += char;
      }
      return result.substring(0, length);
    }
  } catch (error) {
    // Fallback to Math.random() if crypto API fails
    logger.warn('crypto.getRandomValues() unavailable, using Math.random() fallback');
  }
  
  // Fallback to Math.random() if crypto is unavailable
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Get or generate a session ID
 * 
 * Session ID is stored in sessionStorage and persists for the browser session.
 * Used to track consent decisions across page loads.
 * Uses cryptographically secure random generation for privacy-sensitive consent logging.
 * 
 * @returns string - Session ID
 */
export function getSessionId(): string {
  try {
    if (typeof window === 'undefined') {
      // Server-side: generate a temporary ID
      return `session-${Date.now()}-${generateRandomString(7)}`;
    }

    // Check if session ID already exists
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

    if (!sessionId) {
      // Generate new session ID using cryptographically secure random string
      sessionId = `session-${Date.now()}-${generateRandomString(13)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    return sessionId;
  } catch (error) {
    logger.error('Error getting session ID:', error);
    // Fallback: generate a temporary ID
    return `session-${Date.now()}-${generateRandomString(7)}`;
  }
}

/**
 * Get current consent categories from storage
 * 
 * @returns ConsentCategories - Current consent state, defaults to all false except essential
 */
export function getConsentCategories(): ConsentCategories {
  const stored = getConsentFromStorage();
  
  if (!stored) {
    return {
      essential: true,
      analytics: false,
      marketing: false,
    };
  }

  return {
    essential: true, // Always true
    analytics: stored.categories.analytics ?? false,
    marketing: stored.categories.marketing ?? false,
  };
}

/**
 * Check if storage is using fallback (in-memory)
 * 
 * @returns boolean - true if using in-memory fallback
 */
export function isUsingStorageFallback(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  return !isLocalStorageAvailable();
}

/**
 * Check if consent has expired based on timestamp
 * Only used when CONSENT_EXPIRY_ENABLED is true
 * 
 * @param timestamp ISO 8601 timestamp string from consent storage
 * @returns boolean - true if consent has expired, false otherwise
 */
function isConsentExpired(timestamp: string): boolean {
  try {
    const consentDate = new Date(timestamp);
    const now = new Date();
    const daysSinceConsent = Math.floor((now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceConsent >= CONSENT_EXPIRY_DAYS;
  } catch (error) {
    // If timestamp parsing fails, treat as expired to be safe
    logger.warn('Failed to parse consent timestamp, treating as expired:', error);
    return true;
  }
}

/**
 * Migrate consent data from old version to new version
 * 
 * @param oldData Old consent storage data
 * @param newVersion New consent version
 * @returns ConsentCategories | null - Migrated consent categories, or null if migration fails
 */
function migrateConsentVersion(
  oldData: ConsentStorageData,
  newVersion: string
): ConsentCategories | null {
  try {
    // If versions match, no migration needed
    if (oldData.version === newVersion) {
      return oldData.categories;
    }

    // Log migration event
    logger.debug(`Migrating consent from ${oldData.version} to ${newVersion}`);

    // Validate that a migration path exists
    // Currently supported versions: v1.0
    const supportedVersions = ['v1.0'];
    const isOldVersionSupported = supportedVersions.includes(oldData.version);
    const isNewVersionSupported = supportedVersions.includes(newVersion);

    if (!isOldVersionSupported) {
      logger.warn(
        `Migration validation failed: old version '${oldData.version}' is not supported. ` +
        `Supported versions: ${supportedVersions.join(', ')}. ` +
        `User will need to re-consent.`
      );
      return null;
    }

    if (!isNewVersionSupported) {
      logger.warn(
        `Migration validation failed: new version '${newVersion}' is not supported. ` +
        `Supported versions: ${supportedVersions.join(', ')}. ` +
        `User will need to re-consent.`
      );
      return null;
    }

    // Check if explicit migration path exists
    // For now, we only support v1.0, so if both versions are v1.0, no migration needed (handled above)
    // When adding new versions, add migration logic here
    // Example:
    // if (oldData.version === 'v1.0' && newVersion === 'v2.0') {
    //   // Migrate v1.0 to v2.0
    //   return {
    //     essential: oldData.categories.essential ?? true,
    //     analytics: oldData.categories.analytics ?? false,
    //     marketing: oldData.categories.marketing ?? false,
    //     functional: false, // New category defaults to false
    //   };
    // }

    // If we reach here, versions are different but no explicit migration path exists
    // This should not happen if version validation is correct, but log it explicitly
    logger.warn(
      `Migration path not implemented: ${oldData.version} -> ${newVersion}. ` +
      `Both versions are supported but no migration logic exists. ` +
      `User will need to re-consent.`
    );
    return null;
  } catch (error) {
    logger.error('Error migrating consent version:', error);
    return null;
  }
}

