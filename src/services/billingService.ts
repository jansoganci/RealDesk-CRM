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

    const getFallbackTrialInfo = () => {
      if (!user.created_at) {
        return { isTrial: false, trialEndsAt: null };
      }

      const createdDate = new Date(user.created_at);
      if (Number.isNaN(createdDate.getTime())) {
        return { isTrial: false, trialEndsAt: null };
      }

      const fallbackEnd = new Date(createdDate);
      fallbackEnd.setDate(fallbackEnd.getDate() + 14);

      if (fallbackEnd.getTime() > Date.now()) {
        return { isTrial: true, trialEndsAt: fallbackEnd.toISOString() };
      }

      return { isTrial: false, trialEndsAt: fallbackEnd.toISOString() };
    };

    const fallbackTrialInfo = getFallbackTrialInfo();

    // Call RPC function to check if user has active subscription
    const { data: hasAccess, error: rpcError } = await supabase.rpc(
      'has_active_subscription',
      { check_user_id: user.id }
    );

    if (rpcError) {
      console.error('[Billing] RPC error', rpcError);
      // Treat RPC error as no access, but continue to fetch subscription
    }

    // Fetch subscription details
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('status, current_period_end, stripe_product_id, cancel_at_period_end')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subscriptionError) {
      console.error('[Billing] Subscription fetch error', subscriptionError);
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

    // Fetch trial/billing record for legacy credit-card-free trial tracking
    const { data: billingRecord, error: billingError } = await supabase
      .from('user_billing')
      .select('billing_status, trial_end')
      .eq('user_id', user.id)
      .maybeSingle();

    if (billingError) {
      console.error('[Billing] user_billing fetch error', billingError);
    }

    const now = Date.now();
    let trialEndsAt: string | null = null;
    let trialActive = false;

    if (billingRecord?.trial_end) {
      const trialEndValue = billingRecord.trial_end;
      trialEndsAt = trialEndValue;
      const trialEndDate = new Date(trialEndValue).getTime();
      if (!Number.isNaN(trialEndDate) && trialEndDate > now) {
        const isInTrialStatus = !billingRecord.billing_status || billingRecord.billing_status === 'trial';
        trialActive = isInTrialStatus;
      }
    } else if (billingError || !billingRecord) {
      trialActive = fallbackTrialInfo.isTrial;
      trialEndsAt = fallbackTrialInfo.trialEndsAt;
    }

    const hasActiveAccess = Boolean(hasAccess) || trialActive;

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
    // Catch any unexpected errors and return safe fallback
    console.error('[Billing] Unexpected error', error);
    return {
      hasActiveAccess: true,
      status: null,
      currentPeriodEnd: null,
      plan: null,
      cancelAtPeriodEnd: false,
      isTrial: true,
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
