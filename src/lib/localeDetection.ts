/**
 * Locale helpers — English-only app (US market).
 * Browser locale and stored legacy language values do not change the UI language.
 */

export type SupportedLanguage = 'en';
export type SupportedCurrency = 'USD';

const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
const DEFAULT_CURRENCY: SupportedCurrency = 'USD';

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
 * @returns Always English (`en`). Ignores browser `navigator.language`.
 */
export function getDetectedLanguage(): SupportedLanguage {
  return DEFAULT_LANGUAGE;
}

/**
 * @returns Default USD for the US market (no geographic or browser-based switching).
 */
export function getDetectedCurrency(): SupportedCurrency {
  return DEFAULT_CURRENCY;
}

/** Persists manual language for compatibility; only English is supported. */
export function setManualLanguage(language: SupportedLanguage): void {
  if (!isLocalStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.setItem('emlak_language_manual', 'true');
    window.localStorage.setItem('emlak_detected_language', language);
  } catch {
    // Silent fail
  }
}

export function setManualCurrency(currency: SupportedCurrency): void {
  if (!isLocalStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.setItem('emlak_currency_manual', 'true');
    window.localStorage.setItem('emlak_detected_currency', currency);
  } catch {
    // Silent fail
  }
}
