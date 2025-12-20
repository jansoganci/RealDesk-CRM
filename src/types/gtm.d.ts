/**
 * Google Tag Manager TypeScript Declarations
 */

interface GTMEventData {
  event: string;
  [key: string]: unknown;
}

/**
 * GTM Consent Mode v2 command
 */
type GTMConsentCommand = 'consent';

/**
 * GTM Consent Mode v2 action
 */
type GTMConsentAction = 'default' | 'update';

/**
 * GTM Consent Mode v2 parameters
 */
interface GTMConsentParams {
  analytics_storage?: 'granted' | 'denied';
  ad_storage?: 'granted' | 'denied';
  wait_for_update?: number;
}

/**
 * GTM gtag function signature
 */
declare function gtag(
  command: GTMConsentCommand,
  action: GTMConsentAction,
  params: GTMConsentParams
): void;

interface Window {
  dataLayer: GTMEventData[];
  gtag: typeof gtag;
}
