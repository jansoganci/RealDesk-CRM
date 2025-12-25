/**
 * Locale Detection Utility
 *
 * Detects language and currency based on browser settings for first-time visitors.
 * Uses localStorage to persist detected values across sessions.
 *
 * Priority order:
 * 1. DB Preferences (handled in AuthContext, not here)
 * 2. Previously detected values from localStorage
 * 3. Fresh browser detection (navigator.language)
 * 4. Hardcoded fallback ('tr' / 'TRY')
 */

// Storage keys
const LOCALE_DETECTED_KEY = 'emlak_locale_detected';
const DETECTED_LANGUAGE_KEY = 'emlak_detected_language';
const DETECTED_CURRENCY_KEY = 'emlak_detected_currency';
const MANUAL_LANGUAGE_KEY = 'emlak_language_manual';

// Supported languages and currencies
export type SupportedLanguage = 'tr' | 'en';
export type SupportedCurrency = 'TRY' | 'USD';

// Default fallback
const DEFAULT_LANGUAGE: SupportedLanguage = 'tr';

/**
 * Check if localStorage is available
 *
 * @returns boolean - true if localStorage is available and working
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    const testKey = '__locale_detection_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if this is a first visit (no previous detection)
 *
 * @returns boolean - true if detection has not been run before
 */
function isFirstVisit(): boolean {
  if (!isLocalStorageAvailable()) {
    return true; // Treat as first visit, will use browser detection
  }
  try {
    return window.localStorage.getItem(LOCALE_DETECTED_KEY) !== 'true';
  } catch {
    return true;
  }
}

/**
 * Get stored language from localStorage
 *
 * @returns SupportedLanguage | null - stored language or null if not found
 */
function getStoredLanguage(): SupportedLanguage | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(DETECTED_LANGUAGE_KEY);
    if (stored === 'tr' || stored === 'en') {
      return stored;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get stored currency from localStorage
 *
 * @returns SupportedCurrency | null - stored currency or null if not found
 */
function getStoredCurrency(): SupportedCurrency | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(DETECTED_CURRENCY_KEY);
    if (stored === 'TRY' || stored === 'USD') {
      return stored;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Detect language from browser settings
 *
 * @returns SupportedLanguage - detected language based on navigator.language
 */
function detectLanguageFromBrowser(): SupportedLanguage {
  try {
    if (typeof navigator === 'undefined') {
      return DEFAULT_LANGUAGE;
    }

    // Get primary language from browser
    const browserLang = navigator.language || (navigator.languages && navigator.languages[0]);

    if (!browserLang) {
      return DEFAULT_LANGUAGE;
    }

    // Extract primary language code (first 2 characters, lowercase)
    const primaryLang = browserLang.substring(0, 2).toLowerCase();

    // If Turkish, return 'tr'; otherwise return 'en'
    return primaryLang === 'tr' ? 'tr' : 'en';
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Get currency based on language
 *
 * @param language - detected or stored language
 * @returns SupportedCurrency - currency matching the language
 */
function getCurrencyForLanguage(language: SupportedLanguage): SupportedCurrency {
  return language === 'tr' ? 'TRY' : 'USD';
}

/**
 * Get country code from Cloudflare cookie
 *
 * @returns string | null - ISO country code (e.g., 'TR', 'US') or null
 */
function getCloudflareCountry(): string | null {
  try {
    if (typeof document === 'undefined') {
      return null;
    }
    const cookies = document.cookie.split('; ');
    const countryCookie = cookies.find(c => c.startsWith('x-visitor-country='));
    if (countryCookie) {
      return countryCookie.split('=')[1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if language was manually selected by user
 *
 * @returns boolean - true if user explicitly selected language via dropdown
 */
function isManualLanguageSelection(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  try {
    return window.localStorage.getItem(MANUAL_LANGUAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark language as manually selected
 * Called when user clicks language dropdown
 *
 * @param language - the language user selected
 */
export function setManualLanguage(language: SupportedLanguage): void {
  if (!isLocalStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.setItem(MANUAL_LANGUAGE_KEY, 'true');
    window.localStorage.setItem(DETECTED_LANGUAGE_KEY, language);
  } catch {
    // Silent fail
  }
}

/**
 * Detect language from Cloudflare country
 *
 * @returns SupportedLanguage | null - 'tr' if Turkey, null otherwise
 */
function detectLanguageFromCountry(): SupportedLanguage | null {
  const country = getCloudflareCountry();
  if (country === 'TR') {
    return 'tr';
  }
  // All other countries default to English
  return country ? 'en' : null;
}

/**
 * Store detected values in localStorage
 *
 * @param language - language to store
 * @param currency - currency to store
 */
function storeDetectedValues(language: SupportedLanguage, currency: SupportedCurrency): void {
  if (!isLocalStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.setItem(DETECTED_LANGUAGE_KEY, language);
    window.localStorage.setItem(DETECTED_CURRENCY_KEY, currency);
    window.localStorage.setItem(LOCALE_DETECTED_KEY, 'true');
  } catch {
    // Silently fail - detection will run again on next visit
  }
}

/**
 * Run locale detection and store results
 *
 * This is the main detection orchestrator. It:
 * 1. Checks if detection has already run (localStorage flag)
 * 2. If first visit: detects from browser and stores
 * 3. Returns the detected/stored values
 *
 * @returns { language: SupportedLanguage, currency: SupportedCurrency }
 */
function detectLocale(): { language: SupportedLanguage; currency: SupportedCurrency } {
  // Check for stored values first (return visitor)
  const storedLanguage = getStoredLanguage();
  const storedCurrency = getStoredCurrency();

  if (storedLanguage && storedCurrency && !isFirstVisit()) {
    return { language: storedLanguage, currency: storedCurrency };
  }

  // First visit or no stored values - detect from browser
  const detectedLanguage = detectLanguageFromBrowser();
  const detectedCurrency = getCurrencyForLanguage(detectedLanguage);

  // Store for future visits
  storeDetectedValues(detectedLanguage, detectedCurrency);

  return { language: detectedLanguage, currency: detectedCurrency };
}

/**
 * Get detected language
 *
 * Returns the detected/stored language with Cloudflare country priority.
 *
 * Precedence:
 * 1. Manual selection (user clicked language dropdown)
 * 2. Cloudflare country detection (CF-IPCountry header)
 * 3. Browser language (navigator.language)
 * 4. Fallback to 'en'
 *
 * @returns SupportedLanguage - 'tr' or 'en'
 */
export function getDetectedLanguage(): SupportedLanguage {
  // Priority 1: Check if user manually selected language
  if (isManualLanguageSelection()) {
    const stored = getStoredLanguage();
    if (stored) {
      return stored;
    }
  }

  // Priority 2: Check Cloudflare country
  const countryLang = detectLanguageFromCountry();
  if (countryLang) {
    // Store for future visits
    storeDetectedValues(countryLang, getCurrencyForLanguage(countryLang));
    return countryLang;
  }

  // Priority 3: Check stored value (return visitor, non-manual)
  const stored = getStoredLanguage();
  if (stored && !isFirstVisit()) {
    return stored;
  }

  // Priority 4: Detect from browser
  const { language } = detectLocale();
  return language;
}

/**
 * Get detected currency
 *
 * Returns the detected/stored currency, running detection if needed.
 * This function is safe to call synchronously during module initialization.
 *
 * @returns SupportedCurrency - 'TRY' or 'USD'
 */
export function getDetectedCurrency(): SupportedCurrency {
  // Check stored value first
  const stored = getStoredCurrency();
  if (stored && !isFirstVisit()) {
    return stored;
  }

  // Run detection
  const { currency } = detectLocale();
  return currency;
}
