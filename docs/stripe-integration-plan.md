# Stripe + Supabase Subscription Integration Plan

**Project:** Emlak CRM
**Backend:** Supabase Edge Functions (Deno)
**Auth:** Supabase Auth
**Billing Model:** SaaS Subscription
**Currencies:** TRY + USD
**Architecture:** One Product, Multiple Prices

---

## TABLE OF CONTENTS

1. [Stripe Dashboard Setup](#1-stripe-dashboard-setup)
2. [Supabase Edge Functions Architecture](#2-supabase-edge-functions-architecture)
3. [Database Schema Design](#3-database-schema-design)
4. [Webhook Event Handling Logic](#4-webhook-event-handling-logic)
5. [Currency Switching Scenario](#5-currency-switching-scenario)
6. [Frontend Interaction Flow](#6-frontend-interaction-flow)
7. [Implementation Checklist](#7-implementation-checklist)
8. [Common Gotchas](#8-common-gotchas)

---

## 1. STRIPE DASHBOARD SETUP

### 1.1 Create Product

**Steps:**
1. Navigate to **Products** → **Create Product**
2. Name: `Emlak CRM Pro` (or your plan name)
3. Description: Add customer-facing description
4. Click **Save product**
5. **Note the `prod_xxx` ID** - you'll need this

### 1.2 Create Prices

Create **4 prices** for one product:

#### Price 1: Monthly TRY
- **Pricing model:** Standard pricing
- **Price:** 299.00 TRY
- **Billing period:** Monthly
- **Price description:** "Monthly subscription (TRY)"
- **API ID:** `emlakcrm_monthly_try` (click "Show more options" → "Lookup key")
- Click **Add price**
- **Note the `price_xxx` ID**

#### Price 2: Monthly USD
- **Price:** 9.99 USD
- **Billing period:** Monthly
- **API ID:** `emlakcrm_monthly_usd`
- **Note the `price_xxx` ID**

#### Price 3: Yearly TRY
- **Price:** 2,990.00 TRY
- **Billing period:** Yearly
- **API ID:** `emlakcrm_yearly_try`
- **Note the `price_xxx` ID**

#### Price 4: Yearly USD
- **Price:** 99.00 USD
- **Billing period:** Yearly
- **API ID:** `emlakcrm_yearly_usd`
- **Note the `price_xxx` ID**

### 1.3 Add Metadata to Product

**Click on Product → Metadata → Add metadata:**

```
features: "unlimited_properties,advanced_analytics,priority_support"
plan_tier: "pro"
max_properties: "unlimited"
```

**Why:** Webhook handlers can read features from product metadata instead of hardcoding.

### 1.4 Add Metadata to Each Price (Optional but Recommended)

**For each price, add:**

```
display_name_tr: "Aylık Pro Plan" (or "Yıllık Pro Plan")
display_name_en: "Monthly Pro Plan" (or "Yearly Pro Plan")
plan: "pro"
interval: "monthly" (or "yearly")
currency: "try" (or "usd")
```

**Why:** Helps with debugging webhook events and allows dynamic UI labels.

### 1.5 Configure Checkout Settings

1. **Settings** → **Checkout and customer portal**
2. **Customer portal:** Enable "Customers can cancel subscriptions"
3. **Payment methods:** Enable "Card" (default)
4. **Save changes**

### 1.6 Get Stripe Keys

1. **Developers** → **API keys**
2. Copy **Publishable key** (`pk_test_xxx` or `pk_live_xxx`)
3. Copy **Secret key** (`sk_test_xxx` or `sk_live_xxx`)
4. **DO NOT commit these to git**

### 1.7 Create Webhook Endpoint (After Edge Function Deployed)

1. **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL:** `https://[your-project].supabase.co/functions/v1/stripe-webhook`
3. **Select events:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click **Add endpoint**
5. **Copy webhook signing secret** (`whsec_xxx`)

---

## 2. SUPABASE EDGE FUNCTIONS ARCHITECTURE

### 2.1 Edge Function Structure

```
supabase/functions/
├── create-checkout-session/
│   └── index.ts
├── stripe-webhook/
│   └── index.ts
├── _shared/
│   ├── stripe-prices.ts        # Price lookup config
│   ├── stripe-client.ts        # Stripe initialization
│   └── supabase-admin.ts       # Supabase admin client
```

### 2.2 Secrets Management

**Set via Supabase CLI:**

```bash
supabase secrets set STRIPE_SECRET_KEY="sk_xxx"
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_xxx"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJxxx"
```

**Access in functions:**

```typescript
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
```

### 2.3 Shared Config: `_shared/stripe-prices.ts`

**Structure:**

```typescript
export const STRIPE_CONFIG = {
  productId: 'prod_xxx', // Your actual product ID from Stripe
  prices: {
    monthly: {
      try: 'price_xxx', // Actual price ID for monthly TRY
      usd: 'price_xxx', // Actual price ID for monthly USD
    },
    yearly: {
      try: 'price_xxx', // Actual price ID for yearly TRY
      usd: 'price_xxx', // Actual price ID for yearly USD
    },
  },
} as const;

export function getPriceId(
  interval: 'monthly' | 'yearly',
  currency: 'try' | 'usd'
): string {
  const priceId = STRIPE_CONFIG.prices[interval][currency];
  if (!priceId) {
    throw new Error(`No price ID found for ${interval} ${currency}`);
  }
  return priceId;
}
```

**Why:** Single source of truth, type-safe, no hardcoding in handler logic.

### 2.4 Edge Function: `create-checkout-session`

**Purpose:** Create Stripe Checkout session for user

**Input (from frontend):**

```json
{
  "interval": "monthly",
  "currency": "try"
}
```

**Logic flow:**

1. Verify user is authenticated (JWT from Supabase Auth)
2. Get `user.id` from JWT
3. Look up price ID using `getPriceId(interval, currency)`
4. Check if user already has Stripe customer ID in database
5. If no customer ID: create Stripe customer with:
   - `email: user.email`
   - `metadata: { supabase_user_id: user.id }`
6. If yes: use existing customer ID
7. Create checkout session:
   - `mode: 'subscription'`
   - `line_items: [{ price: priceId, quantity: 1 }]`
   - `customer: stripeCustomerId`
   - `success_url: ${origin}/dashboard?checkout=success`
   - `cancel_url: ${origin}/billing?checkout=cancelled`
   - `metadata: { supabase_user_id: user.id }`
8. Return `{ url: session.url }`

**Error handling:**
- 401 if not authenticated
- 400 if invalid interval/currency
- 500 if Stripe API fails

**Expected request:**

```typescript
POST /functions/v1/create-checkout-session
Headers: {
  Authorization: "Bearer <supabase_jwt>"
}
Body: {
  "interval": "monthly",
  "currency": "try"
}
```

**Expected response:**

```json
{
  "url": "https://checkout.stripe.com/c/pay/xxx"
}
```

### 2.5 Edge Function: `stripe-webhook`

**Purpose:** Handle Stripe webhook events

**Logic flow:**

1. Verify webhook signature using `STRIPE_WEBHOOK_SECRET`
2. Parse event type
3. Route to appropriate handler function
4. Update Supabase database
5. Return 200 response (even if internal logic fails after verification)

**Handlers:** (detailed in section 4)
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Error handling:**
- 400 if signature verification fails
- Always return 200 after successful verification (Stripe retries otherwise)
- Log errors internally but don't block webhook

**Expected request from Stripe:**

```typescript
POST /functions/v1/stripe-webhook
Headers: {
  "stripe-signature": "t=xxx,v1=xxx"
}
Body: {
  // Stripe event object
}
```

---

## 3. DATABASE SCHEMA DESIGN

### 3.1 Table: `subscriptions`

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_product_id TEXT NOT NULL,        -- For feature checks
  stripe_price_id TEXT NOT NULL,          -- For display/analytics

  -- Subscription details
  status TEXT NOT NULL,                    -- active, canceled, past_due, etc.
  currency TEXT NOT NULL,                  -- try, usd
  interval TEXT NOT NULL,                  -- monthly, yearly
  amount INTEGER NOT NULL,                 -- Amount in smallest unit (kuruş/cents)

  -- Timestamps
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)  -- One subscription per user
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

**Field explanations:**

| Field | Type | Purpose |
|-------|------|---------|
| `stripe_customer_id` | TEXT | Stripe customer ID (cus_xxx) |
| `stripe_subscription_id` | TEXT | Stripe subscription ID (sub_xxx) - UNIQUE |
| `stripe_product_id` | TEXT | Stripe product ID (prod_xxx) - used for feature checks |
| `stripe_price_id` | TEXT | Stripe price ID (price_xxx) - for display/analytics |
| `status` | TEXT | Stripe subscription status: active, canceled, past_due, trialing, etc. |
| `currency` | TEXT | try or usd |
| `interval` | TEXT | monthly or yearly |
| `amount` | INTEGER | Price in smallest unit (299 TRY = 29900, $9.99 = 999) |
| `current_period_start` | TIMESTAMPTZ | Billing period start (Unix timestamp) |
| `current_period_end` | TIMESTAMPTZ | Billing period end (Unix timestamp) |
| `cancel_at_period_end` | BOOLEAN | TRUE if user canceled but subscription still active until period end |
| `canceled_at` | TIMESTAMPTZ | When subscription was canceled |

### 3.2 Table: `stripe_customers` (Optional but Recommended)

**Purpose:** Track Stripe customer mapping separate from subscriptions

```sql
CREATE TABLE stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_stripe_customers_user_id ON stripe_customers(user_id);
```

**Why:** Users can have a Stripe customer ID without an active subscription (e.g., trial ended, canceled).

### 3.3 RLS Policies

```sql
-- Users can read their own subscription
CREATE POLICY "Users can view own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert/update (webhooks)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Same for stripe_customers
CREATE POLICY "Users can view own customer record"
ON stripe_customers FOR SELECT
USING (auth.uid() = user_id);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
```

**Why:** Webhooks use service role key; frontend uses user JWT (read-only).

### 3.4 Helper Function: Check Active Subscription

```sql
CREATE OR REPLACE FUNCTION has_active_subscription(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = check_user_id
    AND status IN ('active', 'trialing')
    AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage in RLS:**

```sql
CREATE POLICY "Premium feature access"
ON properties FOR ALL
USING (
  user_id = auth.uid() AND
  has_active_subscription(auth.uid())
);
```

**Usage in frontend:**

```typescript
const { data } = await supabase.rpc('has_active_subscription', {
  check_user_id: user.id
});
// data = true/false
```

---

## 4. WEBHOOK EVENT HANDLING LOGIC

### 4.1 `checkout.session.completed`

**When it fires:** User completes checkout

**What to do:**

1. Verify `session.mode === 'subscription'`
2. Extract `session.subscription` (subscription ID)
3. Extract `session.customer` (customer ID)
4. Extract `session.metadata.supabase_user_id`
5. **Fetch full subscription object from Stripe** (session doesn't include full details):
   ```typescript
   const subscription = await stripe.subscriptions.retrieve(
     session.subscription as string,
     { expand: ['items.data.price.product'] }
   );
   ```
6. Extract from subscription:
   - `subscription.items.data[0].price.id` → `stripe_price_id`
   - `subscription.items.data[0].price.product.id` → `stripe_product_id`
   - `subscription.status` → `status`
   - `subscription.items.data[0].price.currency` → `currency`
   - `subscription.items.data[0].price.recurring.interval` → `interval`
   - `subscription.items.data[0].price.unit_amount` → `amount`
   - `subscription.current_period_start` → `current_period_start` (convert to timestamp)
   - `subscription.current_period_end` → `current_period_end`
7. **UPSERT into `subscriptions` table**:
   ```sql
   INSERT INTO subscriptions (...)
   VALUES (...)
   ON CONFLICT (stripe_subscription_id) DO UPDATE SET ...
   ```
8. **UPSERT into `stripe_customers` table**:
   ```sql
   INSERT INTO stripe_customers (user_id, stripe_customer_id, email)
   VALUES (...)
   ON CONFLICT (stripe_customer_id) DO UPDATE SET ...
   ```

**Why fetch subscription separately:** Checkout session doesn't include `product_id` or full subscription details.

**Pseudocode:**

```typescript
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return;

  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;
  const userId = session.metadata?.supabase_user_id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product']
  });

  const price = subscription.items.data[0].price;
  const product = price.product as Stripe.Product;

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    stripe_product_id: product.id,
    stripe_price_id: price.id,
    status: subscription.status,
    currency: price.currency,
    interval: price.recurring!.interval,
    amount: price.unit_amount!,
    current_period_start: new Date(subscription.current_period_start * 1000),
    current_period_end: new Date(subscription.current_period_end * 1000),
    cancel_at_period_end: subscription.cancel_at_period_end,
  }, {
    onConflict: 'stripe_subscription_id'
  });

  await supabase.from('stripe_customers').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    email: session.customer_details?.email,
  }, {
    onConflict: 'stripe_customer_id'
  });
}
```

### 4.2 `customer.subscription.created`

**When it fires:** Subscription created (can fire before `checkout.session.completed`)

**What to do:**

1. Extract subscription object from `event.data.object`
2. Get `subscription.metadata.supabase_user_id` (if exists)
3. If no metadata, look up user by `subscription.customer` in `stripe_customers` table
4. Same extraction logic as 4.1 step 6
5. UPSERT into `subscriptions` table

**Edge case:** If `checkout.session.completed` already created the row, this will just update it (idempotent).

**Pseudocode:**

```typescript
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  let userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    const { data } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('stripe_customer_id', subscription.customer as string)
      .single();
    userId = data?.user_id;
  }

  if (!userId) {
    console.error('No user_id found for subscription:', subscription.id);
    return;
  }

  const price = subscription.items.data[0].price;

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    stripe_product_id: price.product as string,
    stripe_price_id: price.id,
    status: subscription.status,
    currency: price.currency,
    interval: price.recurring!.interval,
    amount: price.unit_amount!,
    current_period_start: new Date(subscription.current_period_start * 1000),
    current_period_end: new Date(subscription.current_period_end * 1000),
    cancel_at_period_end: subscription.cancel_at_period_end,
  }, {
    onConflict: 'stripe_subscription_id'
  });
}
```

### 4.3 `customer.subscription.updated`

**When it fires:**
- Subscription renewed
- User changes plan (currency/interval switch)
- Subscription canceled (but still active until period end)
- Payment fails → status changes to `past_due`

**What to do:**

1. Extract subscription object
2. Check `event.data.previous_attributes` to see what changed
3. Update `subscriptions` table with new values:
   - `status`
   - `stripe_price_id` (if changed)
   - `currency` (if changed)
   - `interval` (if changed)
   - `amount` (if changed)
   - `current_period_end` (if renewed)
   - `cancel_at_period_end` (if user canceled)
   - `canceled_at` (if canceled)
4. **DO NOT change `stripe_product_id`** if user just switched currency (same product, different price)

**Important:** This is the most frequent event. Handle it correctly.

**Pseudocode:**

```typescript
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const price = subscription.items.data[0].price;

  await supabase
    .from('subscriptions')
    .update({
      stripe_price_id: price.id,
      status: subscription.status,
      currency: price.currency,
      interval: price.recurring!.interval,
      amount: price.unit_amount!,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      updated_at: new Date(),
    })
    .eq('stripe_subscription_id', subscription.id);
}
```

### 4.4 `customer.subscription.deleted`

**When it fires:** Subscription ends (period expired after cancellation, or immediate cancellation)

**What to do:**

1. Extract `subscription.id`
2. Update `subscriptions` table:
   - `status = 'canceled'`
   - `canceled_at = NOW()`
3. **DO NOT delete the row** (keep for analytics/history)

**Why not delete:** User might re-subscribe; you want to track lifetime value.

**Pseudocode:**

```typescript
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date(),
      updated_at: new Date(),
    })
    .eq('stripe_subscription_id', subscription.id);
}
```

### 4.5 `invoice.payment_succeeded`

**When it fires:**
- Initial subscription payment
- Recurring subscription payment
- Prorated charge (e.g., currency switch)

**What to do:**

1. Extract `invoice.subscription` (subscription ID)
2. If subscription ID exists:
   - Fetch subscription from Stripe
   - Update `subscriptions` table with latest `current_period_end` (renewal)
   - Ensure `status = 'active'`
3. **Optional:** Log payment in separate `payments` table for analytics

**Why:** Confirms payment succeeded; subscription remains active.

**Pseudocode:**

```typescript
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );

  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_end: new Date(subscription.current_period_end * 1000),
      updated_at: new Date(),
    })
    .eq('stripe_subscription_id', subscription.id);

  // Optional: Log payment
  await supabase.from('payments').insert({
    user_id: subscription.metadata?.supabase_user_id,
    stripe_invoice_id: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    created_at: new Date(),
  });
}
```

### 4.6 `invoice.payment_failed`

**When it fires:** Payment declined

**What to do:**

1. Extract `invoice.subscription`
2. Update `subscriptions` table:
   - `status = 'past_due'`
3. **Optional:** Send email to user (use Supabase Functions to trigger email service)

**Why:** User loses access when status is not 'active' or 'trialing'.

**Stripe behavior:** Automatically retries payment based on Smart Retries settings. If all retries fail, fires `customer.subscription.deleted`.

**Pseudocode:**

```typescript
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date(),
    })
    .eq('stripe_subscription_id', invoice.subscription as string);

  // Optional: Send email notification
  // await sendPaymentFailedEmail(userId);
}
```

---

## 5. CURRENCY SWITCHING SCENARIO

### 5.1 User Action: Switch from TRY → USD

**Frontend:**

1. User clicks "Switch to USD" in billing settings
2. Frontend calls Edge Function `create-checkout-session` with:
   ```json
   { "interval": "monthly", "currency": "usd" }
   ```
3. User redirects to Stripe Checkout
4. User confirms new subscription

### 5.2 Stripe Behavior

**Behind the scenes:**

1. Stripe **cancels** the old subscription (TRY)
2. Stripe **creates** a new subscription (USD)
3. Stripe **prorates** the unused time:
   - Credits remaining TRY amount
   - Charges proportional USD amount
4. Fires webhooks in sequence:
   - `customer.subscription.deleted` (old TRY subscription)
   - `checkout.session.completed` (new USD subscription)
   - `customer.subscription.created` (new USD subscription)
   - `invoice.payment_succeeded` (prorated payment)

**Result:** User has a new `stripe_subscription_id`, same `stripe_product_id`.

### 5.3 Backend Reaction

**In `customer.subscription.deleted` handler:**

1. Mark old subscription as `status = 'canceled'`
2. **DO NOT revoke access immediately** (user is switching, not canceling)

**In `checkout.session.completed` handler:**

1. Create new subscription row (or update if same `user_id` due to UNIQUE constraint)
2. New `stripe_subscription_id`
3. New `stripe_price_id`
4. Same `stripe_product_id` → **Access continues uninterrupted**

**Key insight:** Your RLS policies check `stripe_product_id = 'prod_xxx'`, NOT `price_id`, so currency switch doesn't break access.

### 5.4 What NOT to Do

❌ **Don't use `stripe.subscriptions.update()` to change price**
- Stripe treats multi-currency price changes as new subscriptions
- Use Checkout flow instead

❌ **Don't revoke access when old subscription is deleted**
- Check if user has a new active subscription first
- Or rely on `stripe_product_id` match, not subscription ID

❌ **Don't assume subscription IDs stay the same**
- Currency switch creates new subscription ID
- Always query by `user_id` + `stripe_product_id`

❌ **Don't ignore `invoice.payment_succeeded` for prorated charges**
- Ensure you're not double-charging or missing webhook

### 5.5 Alternative Approach: Customer Portal

**Let Stripe handle it:**

1. Use Stripe Customer Portal instead of custom checkout for switching
2. User clicks "Manage subscription" → redirects to Stripe-hosted portal
3. Stripe handles plan changes, currency switches, cancellations
4. Your webhook handlers remain the same

**Pros:**
- Less frontend code
- Stripe handles UX
- Automatic proration
- Hosted by Stripe (secure)

**Cons:**
- Less control over UI/UX
- User leaves your app

**Implementation:**

```typescript
// Edge function: create-portal-session
const session = await stripe.billingPortal.sessions.create({
  customer: stripeCustomerId,
  return_url: `${origin}/billing`,
});

return { url: session.url };
```

---

## 6. FRONTEND INTERACTION FLOW

### 6.1 Checkout Flow

**User Journey:**

1. User on `/billing` page
2. User sees plan options:
   - Monthly - 299 TRY
   - Monthly - $9.99
   - Yearly - 2,990 TRY
   - Yearly - $99
3. User clicks "Subscribe to Pro - Monthly - 299 TRY"
4. Frontend calls:
   ```typescript
   const response = await fetch(
     `${supabaseUrl}/functions/v1/create-checkout-session`,
     {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${session.access_token}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         interval: 'monthly',
         currency: 'try',
       }),
     }
   );

   const { url } = await response.json();
   ```
5. Backend returns:
   ```json
   { "url": "https://checkout.stripe.com/c/pay/xxx" }
   ```
6. Frontend redirects: `window.location.href = url`
7. User completes payment on Stripe hosted checkout
8. Stripe redirects to `success_url`: `/dashboard?checkout=success`
9. Frontend shows success message: "Subscription activated!"
10. **Backend webhook already updated database** (no frontend action needed)

### 6.2 Subscription Status Check

**On app load (e.g., ProtectedRoute component):**

```typescript
// Fetch user subscription
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('status, stripe_product_id, current_period_end, currency, interval, amount')
  .eq('user_id', user.id)
  .single();

// Check if user has active access
const hasAccess =
  subscription?.status === 'active' &&
  subscription?.stripe_product_id === 'prod_xxx' &&
  new Date(subscription.current_period_end) > new Date();

if (!hasAccess) {
  // Redirect to billing page
  navigate('/billing');
}
```

**Why:** RLS policies enforce this at database level, but frontend should show UI accordingly.

### 6.3 Display Subscription Details

**Billing page component:**

```typescript
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('user_id', user.id)
  .single();

// Display in UI:
// - Current plan: "Pro" (from stripe_product_id)
// - Billing cycle: "Monthly" or "Yearly" (from interval)
// - Price: "299 TRY" or "$9.99" (from amount + currency)
// - Next billing date: format(current_period_end)
// - Status: "Active", "Canceled", "Past Due" (from status)
// - Auto-renewal: !cancel_at_period_end

function formatPrice(amount: number, currency: string): string {
  const value = amount / 100; // Convert from kuruş/cents
  if (currency === 'try') {
    return `${value.toFixed(2)} TRY`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}
```

### 6.4 Manage Subscription (Cancel, Change Plan)

**Option 1: Stripe Customer Portal (Recommended)**

```typescript
// Frontend button: "Manage Subscription"
async function openCustomerPortal() {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/create-portal-session`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const { url } = await response.json();
  window.location.href = url;
}

// Edge function: create-portal-session
export async function createPortalSession(req: Request) {
  const user = await getUserFromRequest(req);

  const { data } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  const session = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${origin}/billing`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

**Option 2: Custom UI**

- **Cancel:** Call new edge function that uses `stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })`
- **Change plan:** Create new checkout session with different `interval` or `currency`

**Recommendation:** Use Customer Portal for simplicity and compliance.

### 6.5 Real-time Updates (Optional)

**If you want instant UI updates:**

```typescript
// Subscribe to subscription changes
const subscription = supabase
  .channel('subscription-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'subscriptions',
      filter: `user_id=eq.${user.id}`,
    },
    (payload) => {
      console.log('Subscription updated:', payload.new);
      // Update UI state with new subscription data
      setSubscription(payload.new);
    }
  )
  .subscribe();

// Cleanup
return () => {
  subscription.unsubscribe();
};
```

**Use case:** User on billing page while subscription renews → status updates live without page refresh.

---

## 7. IMPLEMENTATION CHECKLIST

### Phase 1: Stripe Setup
- [ ] Create Product in Stripe Dashboard
- [ ] Create Price: Monthly TRY (299.00 TRY)
- [ ] Create Price: Monthly USD ($9.99)
- [ ] Create Price: Yearly TRY (2,990.00 TRY)
- [ ] Create Price: Yearly USD ($99.00)
- [ ] Add metadata to Product (features, plan_tier, etc.)
- [ ] Add metadata to each Price (display names, etc.)
- [ ] Copy Product ID → save to `_shared/stripe-prices.ts`
- [ ] Copy all 4 Price IDs → save to `_shared/stripe-prices.ts`
- [ ] Copy Stripe Secret Key → save to Supabase secrets
- [ ] Copy Stripe Publishable Key → save to frontend .env

### Phase 2: Supabase Database
- [ ] Create migration file for `subscriptions` table
- [ ] Create migration file for `stripe_customers` table
- [ ] Add indexes on `subscriptions` table
- [ ] Set up RLS policies for `subscriptions`
- [ ] Set up RLS policies for `stripe_customers`
- [ ] Create helper function `has_active_subscription()`
- [ ] Run migration: `supabase db push`
- [ ] Test queries manually in Supabase SQL editor

### Phase 3: Edge Functions - Shared Files
- [ ] Create `supabase/functions/_shared/stripe-prices.ts`
- [ ] Add STRIPE_CONFIG with your actual Product ID
- [ ] Add all 4 Price IDs to STRIPE_CONFIG
- [ ] Create `getPriceId()` helper function
- [ ] Create `supabase/functions/_shared/stripe-client.ts`
- [ ] Create `supabase/functions/_shared/supabase-admin.ts`

### Phase 4: Edge Functions - Checkout
- [ ] Create `supabase/functions/create-checkout-session/index.ts`
- [ ] Implement user authentication check
- [ ] Implement price ID lookup
- [ ] Implement Stripe customer creation/lookup
- [ ] Implement Stripe checkout session creation
- [ ] Add error handling (401, 400, 500)
- [ ] Deploy function: `supabase functions deploy create-checkout-session`
- [ ] Test locally: `supabase functions serve`
- [ ] Test with curl or Postman

### Phase 5: Edge Functions - Webhook
- [ ] Create `supabase/functions/stripe-webhook/index.ts`
- [ ] Implement webhook signature verification
- [ ] Implement event router (switch/case on event.type)
- [ ] Implement `handleCheckoutSessionCompleted()`
- [ ] Implement `handleSubscriptionCreated()`
- [ ] Implement `handleSubscriptionUpdated()`
- [ ] Implement `handleSubscriptionDeleted()`
- [ ] Implement `handleInvoicePaymentSucceeded()`
- [ ] Implement `handleInvoicePaymentFailed()`
- [ ] Add comprehensive error logging
- [ ] Always return 200 after signature verification
- [ ] Deploy function: `supabase functions deploy stripe-webhook`

### Phase 6: Stripe Webhook Configuration
- [ ] Get deployed webhook URL from Supabase dashboard
- [ ] Add webhook endpoint in Stripe Dashboard
- [ ] Select all 6 events (checkout.session.completed, etc.)
- [ ] Copy webhook signing secret
- [ ] Set Supabase secret: `supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_xxx"`
- [ ] Test webhook with Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`
- [ ] Trigger test event: `stripe trigger checkout.session.completed`

### Phase 7: Frontend - Billing Page
- [ ] Create `/billing` page component
- [ ] Fetch user subscription status
- [ ] Display current plan details (if subscribed)
- [ ] Display plan options (monthly/yearly × TRY/USD)
- [ ] Implement checkout button handler
- [ ] Call `create-checkout-session` edge function
- [ ] Redirect to Stripe Checkout URL
- [ ] Handle `?checkout=success` query parameter
- [ ] Show success/error toast messages

### Phase 8: Frontend - Protected Routes
- [ ] Update `ProtectedRoute` component
- [ ] Add subscription status check
- [ ] Query `subscriptions` table by `user_id`
- [ ] Check `status === 'active'` AND `stripe_product_id === 'prod_xxx'`
- [ ] Redirect to `/billing` if no active subscription
- [ ] Show loading state while checking
- [ ] Handle edge cases (no subscription row, expired, etc.)

### Phase 9: Frontend - Customer Portal (Optional)
- [ ] Create `create-portal-session` edge function
- [ ] Implement Stripe Billing Portal session creation
- [ ] Add "Manage Subscription" button to billing page
- [ ] Call portal session endpoint
- [ ] Redirect to portal URL

### Phase 10: Testing
- [ ] **Test Case 1:** New user signup → subscribe monthly TRY → verify access granted
- [ ] **Test Case 2:** Subscribe yearly USD → verify correct price charged
- [ ] **Test Case 3:** Cancel subscription → verify access continues until period end
- [ ] **Test Case 4:** Wait for cancellation period to expire → verify access revoked
- [ ] **Test Case 5:** Switch from TRY to USD → verify access uninterrupted
- [ ] **Test Case 6:** Payment failure → verify status = 'past_due' → access revoked
- [ ] **Test Case 7:** Use test card `4000 0000 0000 0341` (decline) → verify invoice.payment_failed handled
- [ ] **Test Case 8:** Subscription renewal → verify `current_period_end` updated
- [ ] **Test Case 9:** Webhook retries (return 500 from webhook) → verify Stripe retries
- [ ] **Test Case 10:** Multiple rapid checkouts → verify no duplicate subscriptions

### Phase 11: Production Readiness
- [ ] Switch from Stripe test mode to live mode
- [ ] Update all Stripe keys (publishable, secret, webhook secret)
- [ ] Update Product ID and Price IDs in `stripe-prices.ts`
- [ ] Redeploy edge functions with production secrets
- [ ] Update webhook endpoint URL in Stripe Dashboard (live mode)
- [ ] Set up Stripe webhook monitoring/alerts
- [ ] Add error tracking (e.g., Sentry) to edge functions
- [ ] Set up backup/export of `subscriptions` table
- [ ] Document runbook for common issues
- [ ] Test production flow end-to-end

---

## 8. COMMON GOTCHAS

### 8.1 Webhook Signature Verification Fails

**Symptoms:**
- 400 error from webhook
- Stripe retries webhook repeatedly
- Error: "No signatures found matching the expected signature for payload"

**Causes:**
- Wrong `STRIPE_WEBHOOK_SECRET`
- Request body parsed as JSON before verification
- Missing `stripe-signature` header

**Solutions:**
- Use raw request body for verification (don't parse as JSON first)
- Verify you're using webhook secret (starts with `whsec_`), not API secret
- In Deno/Supabase Functions: `await req.text()` to get raw body

**Correct implementation:**

```typescript
const body = await req.text();
const signature = req.headers.get('stripe-signature')!;

const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
```

### 8.2 Subscription Not Found in `checkout.session.completed`

**Symptoms:**
- Database not updated after checkout
- Missing `stripe_product_id` or `stripe_price_id`

**Cause:**
- Checkout session object doesn't include full subscription details
- Trying to read `session.subscription.items.data` (doesn't exist)

**Solution:**
- Fetch subscription separately using `stripe.subscriptions.retrieve()`
- Expand `items.data.price.product` to get product ID

```typescript
const subscription = await stripe.subscriptions.retrieve(
  session.subscription as string,
  { expand: ['items.data.price.product'] }
);
```

### 8.3 User Has Multiple Subscription Rows

**Symptoms:**
- User subscribed twice, has 2 rows in database
- Duplicate charges
- Conflicting subscription statuses

**Cause:**
- No UNIQUE constraint on `user_id`
- Using INSERT instead of UPSERT

**Solution:**
- Add `UNIQUE(user_id)` constraint to `subscriptions` table
- Use UPSERT with `onConflict` parameter

```sql
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
```

```typescript
await supabase.from('subscriptions').upsert({
  // ... data
}, {
  onConflict: 'user_id'
});
```

### 8.4 Access Not Immediately Granted After Payment

**Symptoms:**
- User completes checkout, redirected to success page
- Still sees "Subscribe" button or access denied
- Subscription appears in database after 5-10 seconds

**Cause:**
- Webhook processing takes time (1-5 seconds typically)
- Frontend queries database before webhook completes

**Solutions:**

**Option 1: Poll database**
```typescript
async function waitForSubscription(userId: string, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .single();

    if (data?.status === 'active') {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}
```

**Option 2: Real-time subscription**
```typescript
const subscription = supabase
  .channel('subscription-changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'subscriptions',
    filter: `user_id=eq.${userId}`,
  }, () => {
    // Subscription created, reload page or update UI
  })
  .subscribe();
```

**Option 3: Show loading state**
```typescript
// On success page
if (searchParams.get('checkout') === 'success') {
  return <div>Processing your subscription... Please wait.</div>;
  // Auto-refresh after 3 seconds
}
```

### 8.5 Currency Switch Revokes Access

**Symptoms:**
- User switches from TRY to USD
- Access denied immediately
- User has to re-login or wait

**Cause:**
- Checking `subscription_id` instead of `product_id`
- Old subscription deleted before new one created
- RLS policy checks `stripe_subscription_id`

**Solution:**
- Always check `stripe_product_id` for feature access, not `subscription_id`

```sql
-- ❌ BAD
CREATE POLICY "Premium access"
ON properties FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = auth.uid()
    AND stripe_subscription_id IS NOT NULL
    AND status = 'active'
  )
);

-- ✅ GOOD
CREATE POLICY "Premium access"
ON properties FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = auth.uid()
    AND stripe_product_id = 'prod_xxx'
    AND status = 'active'
    AND current_period_end > NOW()
  )
);
```

### 8.6 Webhook Fires Twice, Creates Duplicate Rows

**Symptoms:**
- Database has duplicate subscription records
- Same `stripe_subscription_id` appears twice
- Errors about unique constraint violations

**Cause:**
- Not using UPSERT
- Webhook retries due to timeout
- Multiple webhook endpoints configured in Stripe

**Solutions:**
- Use `UPSERT` with unique constraint
- Return 200 immediately after processing (don't wait for slow operations)
- Check Stripe Dashboard for duplicate webhook endpoints
- Add idempotency key handling

```typescript
// ✅ GOOD - UPSERT handles duplicates
await supabase.from('subscriptions').upsert({
  stripe_subscription_id: subscription.id,
  // ... other fields
}, {
  onConflict: 'stripe_subscription_id'
});
```

### 8.7 User Sees Old Subscription Data After Renewal

**Symptoms:**
- Subscription renewed, but UI shows old period end date
- Database has correct data, but frontend doesn't

**Cause:**
- Frontend caching
- Not refetching data after webhook update
- Using stale data from initial page load

**Solutions:**

**Option 1: Disable caching**
```typescript
const { data } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle(); // Use maybeSingle to avoid cache
```

**Option 2: Force refetch**
```typescript
// On billing page mount
useEffect(() => {
  refetchSubscription();
}, []);
```

**Option 3: Real-time updates**
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('sub-updates')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'subscriptions',
    }, (payload) => {
      setSubscriptionData(payload.new);
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

### 8.8 Metadata Not Available in Webhook Events

**Symptoms:**
- `subscription.metadata.supabase_user_id` is undefined
- Can't link Stripe subscription to Supabase user

**Cause:**
- Forgot to set metadata when creating checkout session
- Metadata not passed correctly

**Solution:**
- Always set metadata in checkout session creation:

```typescript
const session = await stripe.checkout.sessions.create({
  // ... other params
  metadata: {
    supabase_user_id: user.id,
  },
  subscription_data: {
    metadata: {
      supabase_user_id: user.id,
    },
  },
});
```

**Note:** Set metadata in BOTH `metadata` (for session) and `subscription_data.metadata` (for subscription).

### 8.9 Test Webhooks Work But Production Webhooks Fail

**Symptoms:**
- Local testing with Stripe CLI works perfectly
- Production webhooks return 400 or don't fire

**Causes:**
- Different webhook secret (test vs live)
- Endpoint URL not updated in Stripe Dashboard live mode
- CORS issues (shouldn't affect webhooks but check)

**Solutions:**
- Verify webhook endpoint exists in **Live mode** Stripe Dashboard
- Use correct webhook secret for live mode (different from test mode)
- Check webhook logs in Stripe Dashboard → Developers → Webhooks → [endpoint] → Events

### 8.10 RLS Prevents Webhook from Updating Database

**Symptoms:**
- Webhook receives event successfully
- No errors in logs
- Database not updated

**Cause:**
- RLS policy blocks service role writes
- Using user JWT instead of service role key in webhook

**Solution:**
- Use service role key in webhook handler (bypasses RLS)

```typescript
// ✅ GOOD - Service role
const supabaseAdmin = createClient(
  supabaseUrl,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

await supabaseAdmin.from('subscriptions').upsert({ ... });
```

```typescript
// ❌ BAD - Anon key (subject to RLS)
const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
```

---

## FINAL NOTES

### Stripe Documentation References

- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Multi-currency pricing](https://stripe.com/docs/billing/prices-guide#multi-currency-pricing)

### Supabase Documentation References

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

### Recommended Next Steps After Implementation

1. **Add analytics tracking:**
   - Track subscription conversion rate
   - Track currency preference (TRY vs USD)
   - Track churn rate

2. **Add email notifications:**
   - Payment succeeded
   - Payment failed
   - Subscription canceled
   - Subscription renewed

3. **Add grace period:**
   - Allow 3-7 days access after payment failure
   - Send reminder emails during grace period

4. **Add usage-based billing (optional):**
   - Metered billing for premium features
   - Overage charges

5. **Add promo codes:**
   - Stripe Coupons
   - Trial periods

6. **Add team/multi-seat subscriptions:**
   - Per-seat pricing
   - Team management

---

**Document Version:** 1.0
**Last Updated:** 2025-12-12
**Author:** Senior Stripe + Supabase Architect
