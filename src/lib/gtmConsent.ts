/**
 * Google Tag Manager Consent Mode v2
 * 
 * Implements GTM Consent Mode v2 for GDPR/KVKK compliance.
 * Must be initialized before any GTM scripts load.
 */

/**
 * Initialize GTM Consent Mode v2
 * 
 * Sets default consent state to 'denied' for all categories.
 * This must be called BEFORE any GTM scripts load.
 * 
 * Call this function in main.tsx before React renders.
 */
export function initGTMConsentMode(): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    // Initialize dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || [];

    // Define gtag function if it doesn't exist
    // This is needed for Consent Mode v2
    if (typeof window.gtag === 'undefined') {
      window.gtag = function gtag() {
        // @ts-expect-error - dataLayer push
        window.dataLayer.push(arguments);
      };
    }

    // Set default consent state to 'denied'
    // This ensures no cookies are set until user explicitly consents
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      wait_for_update: 500, // Wait 500ms before applying consent
    });

    console.debug('GTM Consent Mode v2 initialized with default denied state');
  } catch (error) {
    console.error('Error initializing GTM Consent Mode:', error);
  }
}

/**
 * Update GTM Consent Mode based on user consent
 * 
 * Call this when user accepts/rejects cookies or updates preferences.
 * 
 * @param categories Consent categories
 */
export function updateGTMConsent(categories: {
  analytics: boolean;
  marketing: boolean;
}): void {
  try {
    if (typeof window === 'undefined' || typeof window.gtag === 'undefined') {
      return;
    }

    // Update consent mode
    window.gtag('consent', 'update', {
      analytics_storage: categories.analytics ? 'granted' : 'denied',
      ad_storage: categories.marketing ? 'granted' : 'denied',
    });

    console.debug('GTM Consent Mode updated:', {
      analytics: categories.analytics ? 'granted' : 'denied',
      marketing: categories.marketing ? 'granted' : 'denied',
    });
  } catch (error) {
    console.error('Error updating GTM Consent Mode:', error);
  }
}



