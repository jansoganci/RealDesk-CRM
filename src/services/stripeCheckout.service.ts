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
    console.log('💳 [StripeCheckout] Starting checkout session creation...', {
      plan: request.plan,
      interval: request.interval,
      currency: request.currency,
    });

    // STEP 1: Check with Supabase server if user is real and email is confirmed
    // This is important! We ask the server, not just check the browser cache
    console.log('🔍 [StripeCheckout] STEP 1: Calling getUser()...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log('🔍 [StripeCheckout] getUser() result:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      emailConfirmedAt: user?.email_confirmed_at,
      error: userError?.message,
    });

    if (userError || !user) {
      console.error('❌ [StripeCheckout] No valid user found');
      throw new Error('Please log in to continue.');
    }

    // STEP 2: Check if email is confirmed
    const emailConfirmed = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined;

    console.log('📧 [StripeCheckout] STEP 2: Email confirmation check:', {
      emailConfirmed,
      email_confirmed_at: user.email_confirmed_at,
    });

    if (!emailConfirmed) {
      console.error('❌ [StripeCheckout] Email not confirmed');
      throw new Error('Please confirm your email before subscribing. Check your inbox for the confirmation link.');
    }

    // STEP 3: Get fresh session token
    console.log('🔄 [StripeCheckout] STEP 3: Refreshing session...');
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

    console.log('🔄 [StripeCheckout] refreshSession() result:', {
      success: !sessionError && !!session,
      hasAccessToken: !!session?.access_token,
      accessTokenLength: session?.access_token?.length,
      expiresAt: session?.expires_at,
      error: sessionError?.message,
    });

    if (sessionError || !session) {
      console.error('❌ [StripeCheckout] Session refresh failed:', sessionError);
      throw new Error('Your session expired. Please log in again.');
    }

    // STEP 4: Now we can safely call the Edge Function
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;

    console.log('🚀 [StripeCheckout] STEP 4: Calling Edge Function...', {
      url,
      hasAuthHeader: true,
      tokenLength: session.access_token.length,
      tokenPrefix: session.access_token.substring(0, 20) + '...',
    });

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

    console.log('📨 [StripeCheckout] Edge Function response:', {
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ [StripeCheckout] Edge Function error response:', errorData);
      throw new Error(errorData.error || `HTTP error: ${response.status}`);
    }

    const data = await response.json();

    console.log('✅ [StripeCheckout] Success! Got checkout URL:', {
      hasUrl: !!data.url,
      hasSessionId: !!data.sessionId,
    });

    return {
      url: data.url,
      sessionId: data.sessionId,
    };
  } catch (error) {
    console.error('❌ [StripeCheckout] Checkout session creation error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to create checkout session');
  }
}
