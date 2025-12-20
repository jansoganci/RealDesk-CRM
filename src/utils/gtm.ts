/**
 * Google Tag Manager Utility Module
 * Provides typed helper functions for pushing events to dataLayer
 * 
 * All tracking functions check for analytics consent before firing events.
 */

import { hasConsent } from '@/lib/cookieConsent';

type GTMEventParams = Record<string, unknown>;

/**
 * Push a generic event to GTM dataLayer
 * 
 * Checks for analytics consent before firing. Events are blocked if consent not granted.
 */
export function trackEvent(eventName: string, params?: GTMEventParams): void {
  // Check consent before firing event
  if (!hasConsent('analytics')) {
    console.debug('GTM event blocked: no analytics consent', eventName);
    return;
  }

  // Ensure dataLayer exists
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params,
  });
}

/**
 * Track virtual pageview (used by GTMPageViewTracker)
 */
export function trackPageView(pagePath: string, pageTitle: string): void {
  trackEvent('virtualPageview', {
    pagePath,
    pageTitle,
  });
}

/**
 * Track successful login
 */
export function trackLogin(method: 'email' | 'google' | 'magic_link' = 'email'): void {
  trackEvent('login_success', {
    method,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track successful sign up
 */
export function trackSignUp(method: 'email' | 'google' = 'email'): void {
  trackEvent('sign_up', {
    method,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track property creation
 */
export function trackPropertyCreated(propertyId: string): void {
  trackEvent('property_created', {
    property_id: propertyId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track property update
 */
export function trackPropertyUpdated(propertyId: string): void {
  trackEvent('property_updated', {
    property_id: propertyId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track contract creation
 */
export function trackContractCreated(contractId: string): void {
  trackEvent('contract_created', {
    contract_id: contractId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track contract update
 */
export function trackContractUpdated(contractId: string): void {
  trackEvent('contract_updated', {
    contract_id: contractId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track tenant creation
 */
export function trackTenantCreated(tenantId: string): void {
  trackEvent('tenant_created', {
    tenant_id: tenantId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track owner creation
 */
export function trackOwnerCreated(ownerId: string): void {
  trackEvent('owner_created', {
    owner_id: ownerId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track subscription started
 */
export function trackSubscription(plan: string, interval: 'monthly' | 'yearly'): void {
  trackEvent('subscription_started', {
    plan,
    interval,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track reminder creation
 */
export function trackReminderCreated(reminderId: string): void {
  trackEvent('reminder_created', {
    reminder_id: reminderId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track inquiry creation
 */
export function trackInquiryCreated(inquiryId: string): void {
  trackEvent('inquiry_created', {
    inquiry_id: inquiryId,
    timestamp: new Date().toISOString(),
  });
}
