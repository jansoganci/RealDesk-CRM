import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { stripe } from '../_shared/stripe-client.ts';
import {
  supabaseAdmin,
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/supabase-admin.ts';

/**
 * Create Stripe Customer Portal Session
 *
 * This Edge Function creates a Stripe Customer Portal session URL
 * where users can manage their subscription (cancel, upgrade, update payment method, etc.)
 *
 * POST /functions/v1/create-portal-session
 *
 * Headers:
 *   Authorization: Bearer <user_jwt_token>
 *
 * Returns:
 *   { url: string } - Stripe Customer Portal URL
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. Get Stripe customer ID from database
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (customerError || !customer) {
      console.error('[Portal] Customer not found for user:', user.id, 'Error:', customerError);
      return errorResponse(
        'No Stripe customer found. Please complete a subscription purchase first.',
        404,
        corsHeaders
      );
    }

    // 3. Validate customer ID exists
    if (!customer.stripe_customer_id) {
      console.error('[Portal] Customer record exists but stripe_customer_id is null for user:', user.id);
      return errorResponse(
        'Invalid customer record. Please contact support.',
        400,
        corsHeaders
      );
    }

    // 4. Get origin for redirect URL
    const origin = req.headers.get('origin') || 'http://localhost:5173';

    // 5. Create portal session
    console.log('[Portal] Creating session for customer:', customer.stripe_customer_id, 'with origin:', origin);

    let session;
    try {
      session = await stripe.billingPortal.sessions.create({
        customer: customer.stripe_customer_id,
        return_url: `${origin}/profile`,
      });
      console.log('[Portal] Session created successfully:', session.id);
    } catch (stripeError: any) {
      console.error('[Portal] Stripe API error:', stripeError);

      // Handle specific Stripe errors
      if (stripeError.type === 'StripeInvalidRequestError') {
        return errorResponse(
          `Stripe error: ${stripeError.message}. The customer ID may be invalid.`,
          400,
          corsHeaders
        );
      }

      throw stripeError; // Re-throw to be caught by outer catch
    }

    // 6. Return portal URL
    return jsonResponse(
      {
        url: session.url,
      },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error('[Portal] Error creating portal session:', error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error('[Portal] Error name:', error.name);
      console.error('[Portal] Error message:', error.message);
      console.error('[Portal] Error stack:', error.stack);
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create portal session',
      500,
      corsHeaders
    );
  }
});
