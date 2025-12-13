/**
 * Stripe Client Initialization
 *
 * This file initializes the Stripe SDK for use in Edge Functions.
 * It uses the STRIPE_SECRET_KEY environment variable for authentication.
 *
 * IMPORTANT: Set the secret in Supabase:
 * supabase secrets set STRIPE_SECRET_KEY="sk_test_..." (or sk_live_...)
 */

// Import Stripe from npm (https://esm.sh for Deno compatibility)
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

/**
 * Get Stripe Secret Key from environment
 * Throws if not configured
 */
function getStripeSecretKey(): string {
  const key = Deno.env.get('STRIPE_SECRET_KEY');

  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY environment variable not set. ' +
      'Please run: supabase secrets set STRIPE_SECRET_KEY="sk_..."'
    );
  }

  if (!key.startsWith('sk_')) {
    throw new Error(
      'Invalid STRIPE_SECRET_KEY format. ' +
      'Secret key should start with "sk_test_" or "sk_live_"'
    );
  }

  return key;
}

/**
 * Initialize Stripe client
 * Singleton instance - initialized once and reused
 */
export const stripe = new Stripe(getStripeSecretKey(), {
  apiVersion: '2024-11-20.acacia', // Latest API version
  httpClient: Stripe.createFetchHttpClient(), // Use Deno's fetch
});

/**
 * Get Stripe Webhook Secret from environment
 * Used for webhook signature verification
 */
export function getWebhookSecret(): string {
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!secret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET environment variable not set. ' +
      'Please run: supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..."'
    );
  }

  if (!secret.startsWith('whsec_')) {
    throw new Error(
      'Invalid STRIPE_WEBHOOK_SECRET format. ' +
      'Webhook secret should start with "whsec_"'
    );
  }

  return secret;
}

/**
 * Helper: Verify webhook signature
 *
 * @param body - Raw request body (must be string, not parsed JSON)
 * @param signature - Stripe signature header value
 * @returns Verified Stripe event object
 * @throws Error if signature verification fails
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event {
  const webhookSecret = getWebhookSecret();

  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const error = err as Error;
    console.error('⚠️ Webhook signature verification failed:', error.message);
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

/**
 * Check if Stripe is running in test mode
 */
export function isTestMode(): boolean {
  const key = getStripeSecretKey();
  return key.startsWith('sk_test_');
}

/**
 * Log Stripe environment info (useful for debugging)
 */
export function logStripeEnvironment(): void {
  const testMode = isTestMode();
  console.log('🔧 Stripe Environment:', {
    mode: testMode ? 'TEST' : 'LIVE',
    apiVersion: stripe.getApiField('version'),
  });

  if (!testMode) {
    console.warn('⚠️ Running in LIVE mode - real charges will be made!');
  }
}
