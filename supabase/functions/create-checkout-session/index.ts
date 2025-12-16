import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { stripe } from '../_shared/stripe-client.ts';
import { getPriceId } from '../_shared/stripe-prices.ts';
import type { Plan, BillingInterval, Currency } from '../_shared/stripe-prices.ts';
import {
  supabaseAdmin,
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/supabase-admin.ts';

Deno.serve(async (req) => {
  console.log('🚀 [EdgeFunction] create-checkout-session invoked');
  console.log('📥 [EdgeFunction] Request method:', req.method);
  console.log('📥 [EdgeFunction] Request headers:', {
    hasAuthHeader: !!req.headers.get('Authorization'),
    authHeaderPrefix: req.headers.get('Authorization')?.substring(0, 20),
    contentType: req.headers.get('Content-Type'),
    origin: req.headers.get('origin'),
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ [EdgeFunction] CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify user is authenticated
    console.log('🔍 [EdgeFunction] STEP 1: Verifying user authentication...');

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

    console.log('✅ [EdgeFunction] User authenticated:', {
      userId: user.id,
      email: user.email,
      emailConfirmedAt: user.email_confirmed_at,
    });

    // 2. Parse request body
    const body = await req.json();
    const { plan, interval, currency } = body;

    console.log('📦 [EdgeFunction] STEP 2: Request body parsed:', {
      plan,
      interval,
      currency,
    });

    // 3. Validate input
    if (!plan || !interval || !currency) {
      return errorResponse(
        'Missing required fields: plan, interval, currency',
        400,
        corsHeaders
      );
    }

    // Validate plan
    const validPlans: Plan[] = ['baslangic', 'profesyonel', 'ofis_plus'];
    if (!validPlans.includes(plan as Plan)) {
      return errorResponse(
        `Invalid plan. Must be one of: ${validPlans.join(', ')}`,
        400,
        corsHeaders
      );
    }

    // Validate interval
    const validIntervals: BillingInterval[] = ['monthly', 'yearly'];
    if (!validIntervals.includes(interval as BillingInterval)) {
      return errorResponse(
        `Invalid interval. Must be one of: ${validIntervals.join(', ')}`,
        400,
        corsHeaders
      );
    }

    // Validate currency
    const validCurrencies: Currency[] = ['try', 'usd'];
    if (!validCurrencies.includes(currency as Currency)) {
      return errorResponse(
        `Invalid currency. Must be one of: ${validCurrencies.join(', ')}`,
        400,
        corsHeaders
      );
    }

    // 4. Get price ID from configuration
    const priceId = getPriceId(
      plan as Plan,
      interval as BillingInterval,
      currency as Currency
    );

    // 5. Check if user already has a Stripe customer ID
    console.log('💳 [EdgeFunction] STEP 5: Checking for existing Stripe customer...');
    const { data: existingCustomer } = await supabaseAdmin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('💳 [EdgeFunction] Existing customer check:', {
      hasExistingCustomer: !!existingCustomer,
      customerId: existingCustomer?.stripe_customer_id,
    });

    // Check if user has existing subscription
    console.log('📊 [EdgeFunction] Checking for existing subscriptions...');
    const { data: existingSubscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);

    console.log('📊 [EdgeFunction] Existing subscriptions:', {
      count: existingSubscriptions?.length || 0,
      subscriptions: existingSubscriptions,
    });

    let customerId: string;

    if (existingCustomer?.stripe_customer_id) {
      // Use existing customer
      console.log('✅ [EdgeFunction] Using existing Stripe customer');
      customerId = existingCustomer.stripe_customer_id;
    } else {
      // Create new Stripe customer
      console.log('🆕 [EdgeFunction] Creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;
      console.log('✅ [EdgeFunction] New Stripe customer created:', customerId);

      // Save to database
      await supabaseAdmin.from('stripe_customers').insert({
        user_id: user.id,
        stripe_customer_id: customerId,
        email: user.email,
      });
      console.log('💾 [EdgeFunction] Customer saved to database');
    }

    // 6. Get origin from request headers for redirect URLs
    const origin = req.headers.get('origin') || 'http://localhost:5173';
    console.log('🌐 [EdgeFunction] Origin:', origin);

    // 7. Create Stripe Checkout Session
    console.log('💰 [EdgeFunction] STEP 7: Creating Stripe Checkout Session...');
    console.log('💰 [EdgeFunction] Checkout session params:', {
      customerId,
      priceId,
      plan,
      interval,
      currency,
      locale: currency === 'try' ? 'tr' : 'en',
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?cancelled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan,
        interval,
        currency,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan,
        },
      },
      // Set locale based on currency (optional)
      locale: currency === 'try' ? 'tr' : 'en',
    });

    console.log('✅ [EdgeFunction] Stripe checkout session created:', {
      sessionId: session.id,
      hasUrl: !!session.url,
    });

    // 8. Return checkout URL
    console.log('📤 [EdgeFunction] STEP 8: Returning checkout URL to client');
    return jsonResponse(
      {
        url: session.url,
        sessionId: session.id,
      },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error('❌ [EdgeFunction] Error creating checkout session:', error);
    console.error('❌ [EdgeFunction] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create checkout session',
      500,
      corsHeaders
    );
  }
});
