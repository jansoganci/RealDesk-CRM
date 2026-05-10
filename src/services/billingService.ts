import { supabase } from '../config/supabase';

/**
 * Subscription status from Stripe
 */
export type SubscriptionStatus =
  | 'active'      // Paying customer with active subscription
  | 'trialing'    // In trial period
  | 'past_due'    // Payment failed but subscription not canceled
  | 'canceled'    // Subscription canceled
  | 'incomplete'  // Initial payment failed
  | 'incomplete_expired'
  | 'unpaid';

/**
 * Gets subscription status for the current authenticated user.
 *
 * Checks Stripe subscription status and returns billing information.
 *
 * @returns Object with hasActiveAccess (boolean), status, and subscription details
 *
 * @example
 * ```typescript
 * const { hasActiveAccess, status, plan } = await getBillingStatus();
 * if (!hasActiveAccess) {
 *   // Redirect to paywall
 * }
 * ```
 */
export interface BillingStatusResponse {
  hasActiveAccess: boolean;
  status: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  plan: string | null;
  cancelAtPeriodEnd: boolean;
  isTrial: boolean;
  trialEndsAt: string | null;
}

export async function getBillingStatus(): Promise<BillingStatusResponse> {
  try {
    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      // No user logged in - return safe fallback
      return {
        hasActiveAccess: false,
        status: null,
        currentPeriodEnd: null,
        plan: null,
        cancelAtPeriodEnd: false,
        isTrial: false,
        trialEndsAt: null,
      };
    }

    // Start all requests in parallel
    const [rpcRes, subscriptionRes, billingRes] = await Promise.all([
      supabase.rpc('has_active_subscription', { check_user_id: user.id }),
      supabase.from('subscriptions')
        .select('status, current_period_end, stripe_product_id, cancel_at_period_end')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase.from('user_billing')
        .select('billing_status, trial_end')
        .eq('user_id', user.id)
        .maybeSingle()
    ]);

    const { data: _hasAccess, error: rpcError } = rpcRes;
    const { data: subscription, error: subscriptionError } = subscriptionRes;
    const { data: billingRecord, error: billingError } = billingRes;

    if (rpcError) {
      console.error('[Billing] RPC error', rpcError);
      // Treat RPC error as no access, but continue to fetch subscription
    }

    if (subscriptionError) {
      console.error('[Billing] Subscription fetch error', subscriptionError);
    }

    if (billingError) {
      console.error('[Billing] user_billing fetch error', billingError);
    }

    // Map product ID to plan name
    let plan: string | null = null;
    if (subscription?.stripe_product_id) {
      const planMap: Record<string, string> = {
        'prod_Tb2ymSnyVJOfP2': 'baslangic',
        'prod_Tb3N7MjWZ15hBM': 'profesyonel',
        'prod_Tb3lXZviFuPPL7': 'ofis_plus',
      };
      plan = planMap[subscription.stripe_product_id] || null;
    }

    const now = Date.now();
    let trialEndsAt: string | null = null;
    let trialActive = false;

    // Trial status derived ONLY from user_billing.trial_end (single source of truth)
    // If user_billing is missing or invalid, isTrial=false and trialEndsAt=null
    if (billingRecord?.trial_end) {
      const trialEndValue = billingRecord.trial_end;
      trialEndsAt = trialEndValue;
      const trialEndDate = new Date(trialEndValue).getTime();
      if (!Number.isNaN(trialEndDate) && trialEndDate > now) {
        const isInTrialStatus = !billingRecord.billing_status || billingRecord.billing_status === 'trial';
        trialActive = isInTrialStatus;
      }
    }
    // No fallback: if user_billing is missing/invalid, trialActive stays false and trialEndsAt stays null

    const hasActiveAccess = true; // TODO: Canlıya çıkınca aktifleştir: Boolean(hasAccess) || trialActive;

    // Return combined result
    return {
      hasActiveAccess,
      status: subscription?.status as SubscriptionStatus | null,
      currentPeriodEnd: subscription?.current_period_end || null,
      plan,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
      isTrial: trialActive,
      trialEndsAt,
    };
  } catch (error) {
    // Catch any unexpected errors - fail-safe: no trial, no access
    console.error('[Billing] Unexpected error', error);
    return {
      hasActiveAccess: false,
      status: null,
      currentPeriodEnd: null,
      plan: null,
      cancelAtPeriodEnd: false,
      isTrial: false,
      trialEndsAt: null,
    };
  }
}

/**
 * Get full subscription details for current user
 *
 * @returns Full subscription record or null if not found
 */
export async function getSubscriptionDetails() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[Billing] Error fetching subscription:', error);
    return null;
  }

  return data;
}
