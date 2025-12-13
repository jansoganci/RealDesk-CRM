import { stripe } from '../_shared/stripe-client.ts';
import { getPriceId } from '../_shared/stripe-prices.ts';
import type { Plan, BillingInterval, Currency } from '../_shared/stripe-prices.ts';
import {
  getUserFromRequest,
  supabaseAdmin,
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/supabase-admin.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify user is authenticated
    const user = await getUserFromRequest(req);

    // 2. Parse request body
    const body = await req.json();
    const { plan, interval, currency } = body;

    // 3. Validate input
    if (!plan || !interval || !currency) {
      return errorResponse(
        'Missing required fields: plan, interval, currency',
        400
      );
    }

    // Validate plan
    const validPlans: Plan[] = ['baslangic', 'profesyonel', 'ofis_plus'];
    if (!validPlans.includes(plan as Plan)) {
      return errorResponse(
        `Invalid plan. Must be one of: ${validPlans.join(', ')}`,
        400
      );
    }

    // Validate interval
    const validIntervals: BillingInterval[] = ['monthly', 'yearly'];
    if (!validIntervals.includes(interval as BillingInterval)) {
      return errorResponse(
        `Invalid interval. Must be one of: ${validIntervals.join(', ')}`,
        400
      );
    }

    // Validate currency
    const validCurrencies: Currency[] = ['try', 'usd'];
    if (!validCurrencies.includes(currency as Currency)) {
      return errorResponse(
        `Invalid currency. Must be one of: ${validCurrencies.join(', ')}`,
        400
      );
    }

    // 4. Get price ID from configuration
    const priceId = getPriceId(
      plan as Plan,
      interval as BillingInterval,
      currency as Currency
    );

    // 5. Check if user already has a Stripe customer ID
    const { data: existingCustomer } = await supabaseAdmin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId: string;

    if (existingCustomer?.stripe_customer_id) {
      // Use existing customer
      customerId = existingCustomer.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      // Save to database
      await supabaseAdmin.from('stripe_customers').insert({
        user_id: user.id,
        stripe_customer_id: customerId,
        email: user.email,
      });
    }

    // 6. Get origin from request headers for redirect URLs
    const origin = req.headers.get('origin') || 'http://localhost:5173';

    // 7. Create Stripe Checkout Session
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

    // 8. Return checkout URL
    return jsonResponse(
      {
        url: session.url,
        sessionId: session.id,
      },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);

    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create checkout session',
      500,
      corsHeaders
    );
  }
});
