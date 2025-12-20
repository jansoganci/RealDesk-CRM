/**
 * Cookie Consent Hook
 * 
 * React hook for managing cookie consent state.
 * Handles consent storage, banner visibility, and preferences modal.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { ConsentCategories, ConsentRecordInsert } from '@/types/cookieConsent';
import {
  getConsentFromStorage,
  saveConsentToStorage,
  getConsentCategories,
  hasConsent,
  getSessionId,
} from '@/lib/cookieConsent';
import { updateGTMConsent } from '@/lib/gtmConsent';
import { loadGTM, cleanupCategory } from '@/lib/scriptLoader';
import { GTM_CONTAINER_ID, CONSENT_VERSION } from '@/lib/cookieConfig';
import { logConsentToDatabase } from '@/lib/consentLogger';

/**
 * Shared state for showPreferences across all hook instances
 * This ensures all components using the hook share the same modal visibility state
 */
let sharedShowPreferences = false;
const showPreferencesListeners = new Set<(value: boolean) => void>();

/**
 * Set shared showPreferences state and notify all listeners
 */
function setSharedShowPreferences(value: boolean) {
  sharedShowPreferences = value;
  showPreferencesListeners.forEach(listener => listener(value));
}

/**
 * Hook return type
 */
export interface UseCookieConsentReturn {
  /** Current consent status for each category */
  consent: ConsentCategories;
  /** Check if user has consented to a specific category */
  hasConsent: (category: keyof ConsentCategories) => boolean;
  /** Accept all cookie categories */
  acceptAll: () => void;
  /** Reject all optional cookie categories (essential remains true) */
  rejectAll: () => void;
  /** Update specific consent categories */
  updateConsent: (categories: Partial<ConsentCategories>) => void;
  /** Withdraw all consent and remove all scripts/cookies/data */
  withdrawConsent: () => void;
  /** Whether to show the initial consent banner */
  showBanner: boolean;
  /** Whether to show the preferences modal */
  showPreferences: boolean;
  /** Open the preferences modal */
  openPreferences: () => void;
  /** Close the preferences modal */
  closePreferences: () => void;
  /** Current error state (if any) */
  error: Error | null;
  /** Clear current error */
  clearError: () => void;
  /** Retry last failed operation */
  retry: () => void;
}

/**
 * Cookie Consent Hook
 * 
 * Manages cookie consent state, localStorage persistence, and GPC detection.
 * 
 * @returns UseCookieConsentReturn - Consent state and methods
 */
export function useCookieConsent(): UseCookieConsentReturn {
  // Get i18n for language detection and translations
  const { i18n, t } = useTranslation('cookie');

  // Initialize state from localStorage or defaults
  const [consent, setConsent] = useState<ConsentCategories>(() => {
    return getConsentCategories();
  });

  const [showBanner, setShowBanner] = useState<boolean>(() => {
    // Check for stored consent first
    const stored = getConsentFromStorage();
    if (stored) {
      // Consent exists, don't show banner
      return false;
    }
    
    // No stored consent - check GPC signal synchronously to prevent banner flash
    try {
      // @ts-expect-error - globalPrivacyControl may not be in TypeScript types yet
      if (navigator.globalPrivacyControl === true) {
        // GPC signal detected - don't show banner (will be handled in useEffect)
        return false;
      }
    } catch (error) {
      // GPC check failed, continue with normal flow
      console.debug('[useCookieConsent] GPC check failed in initial state:', error);
    }
    
    // No consent and no GPC - show banner
    return true;
  });

  // Use shared state for showPreferences so all hook instances stay in sync
  const [showPreferences, setShowPreferences] = useState<boolean>(sharedShowPreferences);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to shared state changes
  useEffect(() => {
    const listener = (value: boolean) => {
      setShowPreferences(value);
    };
    showPreferencesListeners.add(listener);
    return () => {
      showPreferencesListeners.delete(listener);
    };
  }, []);

  // Track if scripts have been loaded to prevent duplicates
  const scriptsLoadedRef = useRef<{
    analytics: boolean;
    marketing: boolean;
  }>({
    analytics: false,
    marketing: false,
  });

  // Track previous consent state to detect withdrawals
  const previousConsentRef = useRef<ConsentCategories>(consent);

  // Track last operation for retry
  const lastOperationRef = useRef<(() => void) | null>(null);

  /**
   * Log consent decision to database
   * 
   * Helper function to build ConsentRecordInsert and log to database.
   * Uses fire-and-forget pattern to avoid blocking UI.
   * 
   * @param categories Consent categories to log
   */
  const logConsentDecision = useCallback((categories: ConsentCategories) => {
    try {
      const consentRecord: ConsentRecordInsert = {
        timestamp: new Date(),
        version: CONSENT_VERSION,
        categories: categories,
        sessionId: getSessionId(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        language: (i18n.language === 'tr' || i18n.language === 'en') ? i18n.language : 'tr',
      };

      // Fire and forget - don't await to avoid blocking UI
      logConsentToDatabase(consentRecord).catch((error) => {
        // Silently handle errors - logging failures shouldn't affect UX
        console.debug('[useCookieConsent] Failed to log consent:', error);
      });
    } catch (error) {
      // Silently handle errors - logging failures shouldn't affect UX
      console.debug('[useCookieConsent] Error building consent record:', error);
    }
  }, [i18n.language]);

  /**
   * Check Global Privacy Control (GPC) signal
   * If GPC is enabled, automatically reject non-essential cookies
   */
  const checkGPC = useCallback(() => {
    try {
      // Check for GPC signal (navigator.globalPrivacyControl)
      // @ts-expect-error - globalPrivacyControl may not be in TypeScript types yet
      if (navigator.globalPrivacyControl === true) {
        // GPC signal detected - automatically reject non-essential cookies
        const gpcConsent: ConsentCategories = {
          essential: true,
          analytics: false,
          marketing: false,
        };
        
        setConsent(gpcConsent);
        saveConsentToStorage(gpcConsent);
        setShowBanner(false);
        
        // Log GPC-based consent decision
        logConsentDecision(gpcConsent);
      }
    } catch (error) {
      // GPC check failed, continue with normal flow
      console.debug('GPC check failed:', error);
    }
  }, [logConsentDecision]);

  /**
   * Check for existing consent on mount
   */
  useEffect(() => {
    const stored = getConsentFromStorage();
    
    if (stored) {
      // Consent exists, update state and hide banner
      const storedConsent: ConsentCategories = {
        essential: true,
        analytics: stored.categories.analytics ?? false,
        marketing: stored.categories.marketing ?? false,
      };
      
      setConsent(storedConsent);
      setShowBanner(false);
      
      // Load scripts if consent was previously granted
      if (storedConsent.analytics) {
        loadGTM(GTM_CONTAINER_ID)
          .then((result) => {
            if (result.success) {
              scriptsLoadedRef.current.analytics = true;
            } else {
              console.warn('[useCookieConsent] GTM failed to load:', result.error, result.message);
            }
          })
          .catch((error) => {
            console.error('[useCookieConsent] Error loading GTM:', error);
          });
      }
      if (storedConsent.marketing) {
        // Currently no marketing scripts to load
        scriptsLoadedRef.current.marketing = true;
      }
    } else {
      // No consent, check for GPC signal
      checkGPC();
    }
  }, [checkGPC]);

  /**
   * Persist consent changes to localStorage and log to database
   */
  useEffect(() => {
    // Don't save on initial mount (handled by checkExistingConsent)
    if (showBanner) {
      return;
    }

    // Save consent whenever it changes
    saveConsentToStorage(consent);

    // Log consent decision if it changed (not initial mount)
    // Compare with previous consent to detect actual changes
    const prevConsent = previousConsentRef.current;
    const consentChanged = 
      prevConsent.analytics !== consent.analytics ||
      prevConsent.marketing !== consent.marketing ||
      prevConsent.essential !== consent.essential;

    if (consentChanged) {
      logConsentDecision(consent);
      previousConsentRef.current = consent;
    }
  }, [consent, showBanner, logConsentDecision]);

  /**
   * Load/remove scripts based on analytics consent
   */
  useEffect(() => {
    // Skip on initial mount if banner is showing (user hasn't made a choice yet)
    if (showBanner) {
      return;
    }

    if (consent.analytics) {
      // Load GTM if consent granted and not already loaded
      if (!scriptsLoadedRef.current.analytics) {
        loadGTM(GTM_CONTAINER_ID)
          .then((result) => {
            if (result.success) {
              scriptsLoadedRef.current.analytics = true;
            } else {
              console.warn('[useCookieConsent] GTM failed to load:', result.error, result.message);
            }
          })
          .catch((error) => {
            console.error('[useCookieConsent] Error loading GTM:', error);
          });
      }
    } else {
      // Remove scripts and clear data if consent withdrawn
      if (scriptsLoadedRef.current.analytics) {
        cleanupCategory('analytics');
        scriptsLoadedRef.current.analytics = false;
      }
    }
  }, [consent.analytics, showBanner]);

  /**
   * Load/remove scripts based on marketing consent
   */
  useEffect(() => {
    // Skip on initial mount if banner is showing (user hasn't made a choice yet)
    if (showBanner) {
      return;
    }

    if (consent.marketing) {
      // Load marketing scripts if consent granted and not already loaded
      if (!scriptsLoadedRef.current.marketing) {
        // Currently no marketing scripts to load
        // Add marketing script loading here when implemented
        scriptsLoadedRef.current.marketing = true;
      }
    } else {
      // Remove scripts and clear data if consent withdrawn
      if (scriptsLoadedRef.current.marketing) {
        cleanupCategory('marketing');
        scriptsLoadedRef.current.marketing = false;
      }
    }
  }, [consent.marketing, showBanner]);

  /**
   * Accept all cookie categories
   */
  const acceptAll = useCallback(() => {
    try {
      setError(null);
      const newConsent: ConsentCategories = {
        essential: true,
        analytics: true,
        marketing: true,
      };

      setConsent(newConsent);
      saveConsentToStorage(newConsent);
      
      // Update GTM Consent Mode - grant analytics & marketing
      updateGTMConsent({
        analytics: true,
        marketing: true,
      });
      
      // Log consent decision to database
      logConsentDecision(newConsent);
      
      setShowBanner(false);
      setSharedShowPreferences(false);
      
      // Store operation for retry
      lastOperationRef.current = acceptAll;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useCookieConsent] Error in acceptAll:', error);
    }
  }, [logConsentDecision]);

  /**
   * Reject all optional cookie categories
   * Essential cookies remain true (always required)
   */
  const rejectAll = useCallback(() => {
    try {
      setError(null);
      const newConsent: ConsentCategories = {
        essential: true,
        analytics: false,
        marketing: false,
      };

      setConsent(newConsent);
      saveConsentToStorage(newConsent);
      
      // Update GTM Consent Mode - deny analytics & marketing
      updateGTMConsent({
        analytics: false,
        marketing: false,
      });
      
      // Log consent decision to database
      logConsentDecision(newConsent);
      
      setShowBanner(false);
      setSharedShowPreferences(false);
      
      // Store operation for retry
      lastOperationRef.current = rejectAll;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useCookieConsent] Error in rejectAll:', error);
    }
  }, [logConsentDecision]);

  /**
   * Update specific consent categories
   * 
   * @param categories Partial consent categories to update
   */
  const updateConsent = useCallback((categories: Partial<ConsentCategories>) => {
    try {
      setError(null);
      setConsent((prev) => {
        const newConsent: ConsentCategories = {
          essential: true, // Always true
          analytics: categories.analytics ?? prev.analytics,
          marketing: categories.marketing ?? prev.marketing,
        };

        saveConsentToStorage(newConsent);
        
        // Update GTM Consent Mode - granular updates based on categories
        updateGTMConsent({
          analytics: newConsent.analytics,
          marketing: newConsent.marketing,
        });
        
        // Log consent decision to database
        logConsentDecision(newConsent);
        
        // Store operation for retry
        lastOperationRef.current = () => updateConsent(categories);
        
        return newConsent;
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useCookieConsent] Error in updateConsent:', error);
    }
  }, [logConsentDecision]);

  /**
   * Open preferences modal
   */
  const openPreferences = useCallback(() => {
    setSharedShowPreferences(true);
  }, []);

  /**
   * Close preferences modal
   */
  const closePreferences = useCallback(() => {
    setSharedShowPreferences(false);
  }, []);

  /**
   * Withdraw all consent and remove all scripts, cookies, and data
   * 
   * Removes all analytics and marketing scripts, clears cookies and localStorage,
   * updates GTM Consent Mode to 'denied', and logs withdrawal to database.
   */
  const withdrawConsent = useCallback(() => {
    try {
      setError(null);
      const withdrawnConsent: ConsentCategories = {
        essential: true,
        analytics: false,
        marketing: false,
      };

      // Cleanup analytics category (scripts, cookies, localStorage)
      if (scriptsLoadedRef.current.analytics) {
        cleanupCategory('analytics');
        scriptsLoadedRef.current.analytics = false;
      }

      // Cleanup marketing category (scripts, cookies, localStorage)
      if (scriptsLoadedRef.current.marketing) {
        cleanupCategory('marketing');
        scriptsLoadedRef.current.marketing = false;
      }

      // Update consent state
      setConsent(withdrawnConsent);
      saveConsentToStorage(withdrawnConsent);

      // Update GTM Consent Mode - deny analytics & marketing
      updateGTMConsent({
        analytics: false,
        marketing: false,
      });

      // Log withdrawal decision to database
      logConsentDecision(withdrawnConsent);

      // Show success toast notification
      toast.success(t('withdrawal.success'), {
        description: t('withdrawal.description'),
        duration: 5000,
      });

      // Close preferences modal if open
      setSharedShowPreferences(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useCookieConsent] Error in withdrawConsent:', error);
      toast.error(t('withdrawal.error') || 'Failed to withdraw consent', {
        description: error.message,
        duration: 5000,
      });
    }
  }, [logConsentDecision, t]);

  /**
   * Check if user has consented to a specific category
   */
  const hasConsentForCategory = useCallback(
    (category: keyof ConsentCategories): boolean => {
      return hasConsent(category);
    },
    [consent]
  );

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
    lastOperationRef.current = null;
  }, []);

  /**
   * Retry last failed operation
   */
  const retry = useCallback(() => {
    if (lastOperationRef.current) {
      setError(null);
      try {
        lastOperationRef.current();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('[useCookieConsent] Error in retry:', error);
      }
    }
  }, []);

  return {
    consent,
    hasConsent: hasConsentForCategory,
    acceptAll,
    rejectAll,
    updateConsent,
    withdrawConsent,
    showBanner,
    showPreferences,
    openPreferences,
    closePreferences,
    error,
    clearError,
    retry,
  };
}

