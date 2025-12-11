/**
 * Google Tag Manager TypeScript Declarations
 */

interface GTMEventData {
  event: string;
  [key: string]: unknown;
}

interface Window {
  dataLayer: GTMEventData[];
}
