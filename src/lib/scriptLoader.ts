/**
 * Script Loader Utilities
 * 
 * Handles dynamic loading and removal of third-party scripts based on cookie consent.
 * Ensures scripts only load after user consent and can be removed when consent is withdrawn.
 */

import { hasConsent } from './cookieConsent';
import { createLogger } from './logger';

const logger = createLogger('ScriptLoader');

/**
 * Cookie category type
 */
type CookieCategory = 'analytics' | 'marketing';

/**
 * Script loading result
 */
export interface ScriptLoadResult {
  success: boolean;
  error?: 'blocked' | 'timeout' | 'network' | 'unknown';
  message?: string;
}

/**
 * Load a generic script dynamically
 * 
 * @param src Script source URL
 * @param category Cookie category (analytics or marketing)
 * @returns HTMLScriptElement | null - The loaded script element, or null if consent not granted
 */
export function loadScript(
  src: string,
  category: CookieCategory
): HTMLScriptElement | null {
  // Check consent before loading
  if (!hasConsent(category)) {
    logger.debug(`Script blocked: no ${category} consent`, src);
    return null;
  }

  // Check if script already exists
  const existingScript = document.querySelector(
    `script[src="${src}"][data-cookie-category="${category}"]`
  );
  if (existingScript) {
    logger.debug('Script already loaded:', src);
    return existingScript as HTMLScriptElement;
  }

  try {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.setAttribute('data-cookie-category', category);
    document.head.appendChild(script);

    logger.debug(`Script loaded: ${src} (${category})`);
    return script;
  } catch (error) {
    logger.error('Error loading script:', error);
    return null;
  }
}

/**
 * Load Google Tag Manager dynamically with failure detection
 * 
 * @param containerId GTM container ID (e.g., 'GTM-WJW5DW9V')
 * @returns Promise<ScriptLoadResult> - Detailed result with success status and error type
 */
export function loadGTM(containerId: string): Promise<ScriptLoadResult> {
  // Check analytics consent
  if (!hasConsent('analytics')) {
    logger.debug('GTM blocked: no analytics consent');
    return Promise.resolve({ success: false, error: 'blocked', message: 'No analytics consent' });
  }

  // Check if GTM already loaded
  const existingGTM = document.querySelector(
    `script[src*="googletagmanager.com/gtm.js"][data-cookie-category="analytics"]`
  );
  if (existingGTM) {
    logger.debug('GTM already loaded');
    return Promise.resolve({ success: true });
  }

  return new Promise<ScriptLoadResult>((resolve) => {
    try {
      // Ensure dataLayer exists
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js',
      });

      // Load GTM script dynamically
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
      script.async = true;
      script.setAttribute('data-cookie-category', 'analytics');

      // Load noscript fallback
      const noscript = document.createElement('noscript');
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${containerId}`;
      iframe.height = '0';
      iframe.width = '0';
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
      iframe.setAttribute('data-cookie-category', 'analytics');
      noscript.appendChild(iframe);
      document.body.insertBefore(noscript, document.body.firstChild);

      // Set up timeout (5 seconds)
      const timeout = setTimeout(() => {
        script.remove();
        // Also remove noscript element on timeout
        if (noscript && noscript.parentNode) {
          noscript.remove();
        }
        logger.warn('GTM load timeout after 5 seconds');
        resolve({ success: false, error: 'timeout', message: 'Script load timeout' });
      }, 5000);

      // Handle successful load
      script.onload = () => {
        clearTimeout(timeout);
        logger.debug('GTM loaded:', containerId);
        resolve({ success: true });
      };

      // Handle load errors (ad blocker, network issues)
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        // Also remove noscript element on error
        if (noscript && noscript.parentNode) {
          noscript.remove();
        }
        
        // Detect ad blocker patterns
        // Ad blockers often block googletagmanager.com
        const isAdBlocker = !window.dataLayer || window.dataLayer.length === 0;
        
        logger.warn('GTM script failed to load', {
          containerId,
          likelyAdBlocker: isAdBlocker,
        });

        resolve({
          success: false,
          error: isAdBlocker ? 'blocked' : 'network',
          message: isAdBlocker ? 'Script blocked (likely ad blocker)' : 'Network error loading script',
        });
      };

      document.head.appendChild(script);
    } catch (error) {
      logger.error('Error loading GTM:', error);
      resolve({
        success: false,
        error: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

/**
 * Remove scripts by category
 * 
 * @param category Cookie category to remove scripts for
 */
export function removeScript(category: CookieCategory): void {
  try {
    // Remove script tags
    const scripts = document.querySelectorAll(
      `script[data-cookie-category="${category}"]`
    );
    scripts.forEach((script) => {
      script.remove();
      logger.debug('Script removed:', script.getAttribute('src'));
    });

    // Remove noscript fallbacks
    const noscripts = document.querySelectorAll(
      `noscript iframe[data-cookie-category="${category}"]`
    );
    noscripts.forEach((iframe) => {
      const noscript = iframe.parentElement;
      if (noscript && noscript.tagName === 'NOSCRIPT') {
        noscript.remove();
        logger.debug('Noscript fallback removed');
      }
    });

    logger.debug(`All ${category} scripts removed`);
  } catch (error) {
    logger.error('Error removing scripts:', error);
  }
}

/**
 * Clear cookies by category
 * 
 * @param category Cookie category to clear cookies for
 */
export function clearCookies(category: CookieCategory): void {
  try {
    const cookiesToClear: string[] = [];

    if (category === 'analytics') {
      // GTM and Google Analytics cookies
      cookiesToClear.push('_ga', '_gid', '_gtm', '_gat', '_gat_gtag_');
    } else if (category === 'marketing') {
      // Marketing cookies
      cookiesToClear.push('_fbp', '_fbc');
    }

    // Clear cookies for current domain
    // Note: HttpOnly cookies cannot be cleared client-side (browser security restriction)
    // These require server-side clearing via Set-Cookie header with expires in the past
    cookiesToClear.forEach((cookieName) => {
      try {
        // Clear for current path
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        // Clear for root domain
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        // Clear for .domain (if applicable)
        const domainParts = window.location.hostname.split('.');
        if (domainParts.length > 1) {
          const rootDomain = '.' + domainParts.slice(-2).join('.');
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain};`;
        }
      } catch (error) {
        // Log warning if cookie clearing fails (e.g., HttpOnly cookies, invalid domain)
        logger.warn(`Failed to clear cookie: ${cookieName}`, error);
      }
    });

    logger.debug(`Cookies cleared for ${category} category`);
  } catch (error) {
    logger.error('Error clearing cookies:', error);
  }
}

/**
 * Clear localStorage data by category
 * 
 * @param category Cookie category to clear localStorage data for
 */
export function clearLocalStorageData(category: CookieCategory): void {
  try {
    const keysToRemove: string[] = [];

    if (category === 'analytics') {
      // Google Analytics localStorage keys
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith('_ga') ||
          key.startsWith('_gid') ||
          key.startsWith('_gtm') ||
          key.startsWith('gtm.')
        ) {
          keysToRemove.push(key);
        }
      });
    } else if (category === 'marketing') {
      // Marketing localStorage keys
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('_fbp') || key.startsWith('_fbc')) {
          keysToRemove.push(key);
        }
      });
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      logger.debug('localStorage key removed:', key);
    });

    logger.debug(`localStorage cleared for ${category} category`);
  } catch (error) {
    logger.error('Error clearing localStorage:', error);
  }
}

/**
 * Remove all scripts and clear all data for a category
 * Used when consent is withdrawn
 * 
 * @param category Cookie category to clean up
 */
export function cleanupCategory(category: CookieCategory): void {
  removeScript(category);
  clearCookies(category);
  clearLocalStorageData(category);
  logger.debug(`Complete cleanup done for ${category} category`);
}

