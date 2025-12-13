/**
 * Stripe Product and Price Configuration
 *
 * Structure: 3 Products × 4 Prices each = 12 total prices
 *
 * Plans:
 * 1. baslangic (Starter)
 * 2. profesyonel (Professional)
 * 3. ofis_plus (Office Plus)
 *
 * Each plan has 4 prices:
 * - Monthly TRY
 * - Monthly USD
 * - Yearly TRY
 * - Yearly USD
 */

export const STRIPE_CONFIG = {
  plans: {
    baslangic: {
      productId: 'prod_Tb2ymSnyVJOfP2',
      prices: {
        monthly: {
          try: 'price_1SdqtX05RA5Scg6HGmArSnH5',
          usd: 'price_1Sdqtd05RA5Scg6HgDMECJ4C',
        },
        yearly: {
          try: 'price_1Sdqtm05RA5Scg6HsGseQgka',
          usd: 'price_1Sdqtr05RA5Scg6HItz5irkt',
        },
      },
    },
    profesyonel: {
      productId: 'prod_Tb3N7MjWZ15hBM',
      prices: {
        monthly: {
          try: 'price_1SdrK605RA5Scg6HWk544cgI',
          usd: 'price_1SdrKB05RA5Scg6Hs7yCZetq',
        },
        yearly: {
          try: 'price_1SdrKG05RA5Scg6HsbFV5RlL',
          usd: 'price_1SdrKK05RA5Scg6HMXZxI3K1',
        },
      },
    },
    ofis_plus: {
      productId: 'prod_Tb3lXZviFuPPL7',
      prices: {
        monthly: {
          try: 'price_1SdrfK05RA5Scg6H5zvoooW6',
          usd: 'price_1SdrfT05RA5Scg6H0PL5sSCP',
        },
        yearly: {
          try: 'price_1SdrfN05RA5Scg6HVrxJCjPY',
          usd: 'price_1SdrfX05RA5Scg6H4n0Ne7xT',
        },
      },
    },
  },
} as const;

/**
 * Type-safe plan names
 */
export type Plan = 'baslangic' | 'profesyonel' | 'ofis_plus';

/**
 * Type-safe interval values
 */
export type BillingInterval = 'monthly' | 'yearly';

/**
 * Type-safe currency values
 */
export type Currency = 'try' | 'usd';

/**
 * Get Stripe Price ID based on plan, billing interval, and currency
 *
 * @param plan - Plan name (baslangic, profesyonel, ofis_plus)
 * @param interval - Billing interval (monthly or yearly)
 * @param currency - Currency code (try or usd)
 * @returns Stripe Price ID
 * @throws Error if no price found for the given combination
 */
export function getPriceId(
  plan: Plan,
  interval: BillingInterval,
  currency: Currency
): string {
  const planConfig = STRIPE_CONFIG.plans[plan];

  if (!planConfig) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  const priceId = planConfig.prices[interval][currency];

  if (!priceId || priceId.startsWith('price_XXXX')) {
    throw new Error(
      `No valid price ID found for ${plan} ${interval} ${currency.toUpperCase()}. ` +
      `Please update STRIPE_CONFIG in _shared/stripe-prices.ts with your actual Stripe price IDs.`
    );
  }

  return priceId;
}

/**
 * Get Stripe Product ID for a specific plan
 * Used for feature access control checks
 *
 * @param plan - Plan name (baslangic, profesyonel, ofis_plus)
 * @returns Stripe Product ID
 * @throws Error if product ID not configured
 */
export function getProductId(plan: Plan): string {
  const planConfig = STRIPE_CONFIG.plans[plan];

  if (!planConfig) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  const productId = planConfig.productId;

  if (!productId || productId.startsWith('prod_XXXX')) {
    throw new Error(
      `Product ID not configured for plan: ${plan}. ` +
      `Please update STRIPE_CONFIG in _shared/stripe-prices.ts`
    );
  }

  return productId;
}

/**
 * Get plan name from Stripe Product ID
 * Used in webhook handlers to determine which plan a subscription belongs to
 *
 * @param productId - Stripe Product ID
 * @returns Plan name or null if not found
 */
export function getPlanFromProductId(productId: string): Plan | null {
  const plans: Plan[] = ['baslangic', 'profesyonel', 'ofis_plus'];

  for (const plan of plans) {
    if (STRIPE_CONFIG.plans[plan].productId === productId) {
      return plan;
    }
  }

  return null;
}

/**
 * Validate that all Stripe IDs have been configured
 * Call this on Edge Function initialization to fail fast
 *
 * @throws Error if any ID is still a placeholder
 */
export function validateStripeConfig(): void {
  const errors: string[] = [];
  const plans: Plan[] = ['baslangic', 'profesyonel', 'ofis_plus'];

  for (const plan of plans) {
    const planConfig = STRIPE_CONFIG.plans[plan];

    if (planConfig.productId.startsWith('prod_XXXX')) {
      errors.push(`${plan}: Product ID not configured`);
    }

    if (planConfig.prices.monthly.try.startsWith('price_XXXX')) {
      errors.push(`${plan}: Monthly TRY price ID not configured`);
    }

    if (planConfig.prices.monthly.usd.startsWith('price_XXXX')) {
      errors.push(`${plan}: Monthly USD price ID not configured`);
    }

    if (planConfig.prices.yearly.try.startsWith('price_XXXX')) {
      errors.push(`${plan}: Yearly TRY price ID not configured`);
    }

    if (planConfig.prices.yearly.usd.startsWith('price_XXXX')) {
      errors.push(`${plan}: Yearly USD price ID not configured`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Stripe configuration incomplete:\n- ${errors.join('\n- ')}\n\n` +
      `Please update supabase/functions/_shared/stripe-prices.ts with your actual Stripe IDs.`
    );
  }
}

/**
 * Price configuration structure
 */
export interface PriceConfig {
  plan: Plan;
  interval: BillingInterval;
  currency: Currency;
  priceId: string;
  productId: string;
}

/**
 * Get all price configurations
 * Useful for displaying pricing page
 *
 * @returns Array of all 12 price configurations
 */
export function getAllPrices(): PriceConfig[] {
  const plans: Plan[] = ['baslangic', 'profesyonel', 'ofis_plus'];
  const intervals: BillingInterval[] = ['monthly', 'yearly'];
  const currencies: Currency[] = ['try', 'usd'];
  const prices: PriceConfig[] = [];

  for (const plan of plans) {
    const planConfig = STRIPE_CONFIG.plans[plan];

    for (const interval of intervals) {
      for (const currency of currencies) {
        prices.push({
          plan,
          interval,
          currency,
          priceId: planConfig.prices[interval][currency],
          productId: planConfig.productId,
        });
      }
    }
  }

  return prices;
}

/**
 * Get all price configurations for a specific plan
 *
 * @param plan - Plan name
 * @returns Array of 4 price configurations for the plan
 */
export function getPricesForPlan(plan: Plan): PriceConfig[] {
  const planConfig = STRIPE_CONFIG.plans[plan];
  const intervals: BillingInterval[] = ['monthly', 'yearly'];
  const currencies: Currency[] = ['try', 'usd'];
  const prices: PriceConfig[] = [];

  for (const interval of intervals) {
    for (const currency of currencies) {
      prices.push({
        plan,
        interval,
        currency,
        priceId: planConfig.prices[interval][currency],
        productId: planConfig.productId,
      });
    }
  }

  return prices;
}
