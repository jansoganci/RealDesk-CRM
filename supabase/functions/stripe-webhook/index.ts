import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { getPlanFromProductId } from '../_shared/stripe-prices.ts';
import { supabaseAdmin } from '../_shared/supabase-admin.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  try {
    // 1. Get raw request body and signature
    const signature = req.headers.get('stripe-signature');
    const rawBody = await req.text();

    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400,
      });
    }

    // 2. Verify webhook signature using Stripe's async method
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );

    console.log(`✅ Received event: ${event.type}`);

    // 3. Route to appropriate handler
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // 4. Always return 200 after successful verification
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Handle checkout.session.completed
 * Fires when user completes checkout
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.mode !== 'subscription') {
    console.log('ℹ️ Not a subscription checkout, skipping');
    return;
  }

  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;
  const userId = session.metadata?.supabase_user_id;

  if (!userId) {
    console.error('❌ No supabase_user_id in session metadata');
    return;
  }

  console.log(`📦 Processing checkout for user: ${userId}`);

  // Fetch full subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product'],
  });

  await upsertSubscription(subscription, userId);
}

/**
 * Handle customer.subscription.created
 * Fires when subscription is created
 */
async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  // Get user ID from metadata or lookup in stripe_customers table
  let userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    const { data } = await supabaseAdmin
      .from('stripe_customers')
      .select('user_id')
      .eq('stripe_customer_id', subscription.customer as string)
      .maybeSingle();

    userId = data?.user_id;
  }

  if (!userId) {
    console.error('❌ No user_id found for subscription:', subscription.id);
    return;
  }

  console.log(`📦 Creating subscription for user: ${userId}`);

  await upsertSubscription(subscription, userId);
}

/**
 * Handle customer.subscription.updated
 * Fires when subscription is renewed, changed, or canceled
 */
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log(`🔄 Updating subscription: ${subscription.id}`);

  // Find user by subscription ID
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();

  if (!data?.user_id) {
    console.error('❌ No user found for subscription:', subscription.id);
    return;
  }

  await upsertSubscription(subscription, data.user_id);
}

/**
 * Handle customer.subscription.deleted
 * Fires when subscription ends
 */
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log(`🗑️ Deleting subscription: ${subscription.id}`);

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

/**
 * Handle invoice.payment_succeeded
 * Fires when payment succeeds (initial or recurring)
 */
async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  if (!invoice.subscription) {
    console.log('ℹ️ Invoice not related to subscription, skipping');
    return;
  }

  console.log(`💰 Payment succeeded for invoice: ${invoice.id}`);

  // Fetch subscription to get updated period end
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );

  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();

  if (!data?.user_id) {
    console.error('❌ No user found for subscription:', subscription.id);
    return;
  }

  await upsertSubscription(subscription, data.user_id);
}

/**
 * Handle invoice.payment_failed
 * Fires when payment fails
 */
async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  if (!invoice.subscription) {
    console.log('ℹ️ Invoice not related to subscription, skipping');
    return;
  }

  console.log(`❌ Payment failed for invoice: ${invoice.id}`);

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', invoice.subscription as string);
}

/**
 * Upsert subscription data into database
 */
async function upsertSubscription(
  subscription: Stripe.Subscription,
  userId: string
) {
  const price = subscription.items.data[0]?.price;
  if (!price) {
    console.error('❌ No price found in subscription');
    return;
  }

  const product = price.product as Stripe.Product;
  const productId = typeof product === 'string' ? product : product.id;

  // Determine plan name from product ID
  const plan = getPlanFromProductId(productId);

  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    stripe_product_id: productId,
    stripe_price_id: price.id,
    status: subscription.status,
    currency: price.currency,
    interval: price.recurring?.interval || 'month',
    amount: price.unit_amount || 0,
    current_period_start: new Date(
      subscription.current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  console.log('💾 Upserting subscription:', {
    userId,
    subscriptionId: subscription.id,
    plan,
    status: subscription.status,
  });

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'stripe_subscription_id',
    });

  if (error) {
    console.error('❌ Error upserting subscription:', error);
    throw error;
  }

  console.log('✅ Subscription upserted successfully');
}
