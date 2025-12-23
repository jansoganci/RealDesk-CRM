import { supabase } from '../config/supabase';

export interface CreateCheckoutRequest {
  plan: 'baslangic' | 'profesyonel' | 'ofis_plus';
  interval: 'monthly' | 'yearly';
  currency: 'try' | 'usd';
}

export interface CreateCheckoutResponse {
  url: string;
  sessionId: string;
}

/**
 * Create Stripe Checkout Session
 * Calls Edge Function to generate checkout URL
 *
 * @param request - Checkout session parameters (plan, interval, currency)
 * @returns Promise with checkout URL and session ID
 * @throws Error if authentication fails or checkout creation fails
 */
export async function createCheckoutSession(
  request: CreateCheckoutRequest
): Promise<CreateCheckoutResponse> {
  try {
    // Check with Supabase server if user is real and email is confirmed
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Please log in to continue.');
    }

    // Check if email is confirmed
    const emailConfirmed = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined;

    if (!emailConfirmed) {
      throw new Error('Please confirm your email before subscribing. Check your inbox for the confirmation link.');
    }

    // Get fresh session token
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

    if (sessionError || !session) {
      throw new Error('Your session expired. Please log in again.');
    }

    // Now we can safely call the Edge Function
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        plan: request.plan,
        interval: request.interval,
        currency: request.currency,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error: ${response.status}`);
    }

    const data = await response.json();

    return {
      url: data.url,
      sessionId: data.sessionId,
    };
  } catch (error) {
    console.error('[StripeCheckout] Checkout session creation error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to create checkout session');
  }
}
