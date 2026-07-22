/**
 * Cookie Configuration
 * 
 * Defines all cookies used in the application for privacy compliance.
 * This file must be kept up-to-date when adding new cookies.
 */

/**
 * Cookie Definition Interface
 */
export interface CookieDefinition {
  name: string;
  purpose: string;
  duration: string;
  thirdParty: boolean;
  provider?: string; // Required if thirdParty is true
}

/**
 * Cookie Definitions Type
 */
export type CookieDefinitions = {
  essential: CookieDefinition[];
  analytics: CookieDefinition[];
  marketing: CookieDefinition[];
};

/**
 * GTM Container ID
 * Used for Google Tag Manager script loading
 */
export const GTM_CONTAINER_ID = 'GTM-WJW5DW9V';

/**
 * Consent Version
 * Version of the consent banner implementation
 * Increment when making breaking changes to consent structure
 */
export const CONSENT_VERSION = 'v1.0';

/**
 * Consent Expiry Configuration
 * 
 * Feature flag: Enable consent expiry/refresh mechanism
 * When enabled, consent will expire after CONSENT_EXPIRY_DAYS and user will need to re-consent
 * 
 * Default: DISABLED (consent persists indefinitely until user withdraws)
 * To enable: Set to true and configure CONSENT_EXPIRY_DAYS
 * 
 * Note: Some DPAs recommend refreshing consent after 12 months (365 days)
 */
export const CONSENT_EXPIRY_ENABLED = false;

/**
 * Consent Expiry Duration (in days)
 * Only used when CONSENT_EXPIRY_ENABLED is true
 * 
 * Recommended values:
 * - 365 days (12 months) - Common DPA recommendation
 * - 730 days (24 months) - Longer retention period
 * 
 * Default: 365 days (12 months)
 */
export const CONSENT_EXPIRY_DAYS = 365;

/**
 * Cookie Definitions
 * 
 * All cookies used in the application, categorized by purpose.
 * Essential cookies are always active (no consent required).
 * Analytics and Marketing cookies require explicit user consent.
 */
export const cookieDefinitions: CookieDefinitions = {
  essential: [
    {
      name: 'auth_token',
      purpose: 'User authentication and session management',
      duration: '7 days',
      thirdParty: false,
    },
    {
      name: 'csrf_token',
      purpose: 'Security protection against CSRF attacks',
      duration: 'Session',
      thirdParty: false,
    },
  ],
  analytics: [
    {
      name: '_ga',
      purpose: 'Google Analytics tracking (via GTM) - distinguishes users',
      duration: '2 years',
      thirdParty: true,
      provider: 'Google',
    },
    {
      name: '_gid',
      purpose: 'Google Analytics tracking (via GTM) - distinguishes users',
      duration: '24 hours',
      thirdParty: true,
      provider: 'Google',
    },
    {
      name: '_gtm',
      purpose: 'Google Tag Manager container - manages tags and scripts',
      duration: 'Session',
      thirdParty: true,
      provider: 'Google',
    },
  ],
  marketing: [
    // Currently no marketing cookies are used
    // Add marketing cookies here when implemented
    // Example:
    // {
    //   name: '_fbp',
    //   purpose: 'Facebook Pixel tracking - conversion tracking and retargeting',
    //   duration: '90 days',
    //   thirdParty: true,
    //   provider: 'Meta',
    // },
  ],
};


