# Stripe Integration - Next Steps

## ✅ COMPLETED

I've implemented the foundation for Stripe billing with **3 plans**:

### 1. Database Migration
**File:** `supabase/migrations/20251212_stripe_billing_tables.sql`

Created:
- `stripe_customers` table - Maps Supabase users to Stripe customers
- `subscriptions` table - Stores subscription data
- RLS policies - Users can view their own data, webhooks use service role
- Helper function `has_active_subscription()` - Check subscription status

### 2. Shared Configuration Files
**Directory:** `supabase/functions/_shared/`

Created:
- `stripe-prices.ts` - **Updated for 3 plans** (baslangic, profesyonel, ofis_plus)
- `stripe-client.ts` - Stripe SDK initialization
- `supabase-admin.ts` - Supabase admin client for webhooks

---

## 🎯 YOUR NEXT STEPS

### STEP 1: Create Stripe Products & Prices (30-45 minutes)

**You need to create 3 Products with 4 Prices each = 12 total Prices**

#### Product 1: Baslangic (Starter)

1. Go to https://dashboard.stripe.com/test/products
2. Click **"Add product"**
3. Fill in:
   - **Name:** Emlak CRM - Başlangıç / Starter
   - **Description:** Perfect for individual agents getting started
4. Click **"Save product"**
5. **COPY THE PRODUCT ID** (starts with `prod_`) → Save as "Baslangic Product ID"

**Now create 4 prices for Baslangic:**

**Price 1: Monthly TRY**
- Click **"Add another price"**
- **Price:** 199.00 (or your chosen price)
- **Currency:** TRY (Turkish Lira)
- **Billing period:** Monthly
- **Lookup key:** `baslangic_monthly_try`
- **COPY PRICE ID** → Save as "Baslangic Monthly TRY"

**Price 2: Monthly USD**
- **Price:** 6.99 (or your chosen price)
- **Currency:** USD
- **Billing period:** Monthly
- **Lookup key:** `baslangic_monthly_usd`
- **COPY PRICE ID** → Save as "Baslangic Monthly USD"

**Price 3: Yearly TRY**
- **Price:** 1990.00 (or your chosen price)
- **Currency:** TRY
- **Billing period:** Yearly
- **Lookup key:** `baslangic_yearly_try`
- **COPY PRICE ID** → Save as "Baslangic Yearly TRY"

**Price 4: Yearly USD**
- **Price:** 69.00 (or your chosen price)
- **Currency:** USD
- **Billing period:** Yearly
- **Lookup key:** `baslangic_yearly_usd`
- **COPY PRICE ID** → Save as "Baslangic Yearly USD"

---

#### Product 2: Profesyonel (Professional)

1. Click **"Add product"** again
2. Fill in:
   - **Name:** Emlak CRM - Profesyonel / Professional
   - **Description:** For growing agencies with advanced needs
3. Click **"Save product"**
4. **COPY THE PRODUCT ID** → Save as "Profesyonel Product ID"

**Create 4 prices for Profesyonel:**

**Price 1: Monthly TRY**
- **Price:** 499.00
- **Currency:** TRY
- **Billing period:** Monthly
- **Lookup key:** `profesyonel_monthly_try`
- **COPY PRICE ID**

**Price 2: Monthly USD**
- **Price:** 14.99
- **Currency:** USD
- **Billing period:** Monthly
- **Lookup key:** `profesyonel_monthly_usd`
- **COPY PRICE ID**

**Price 3: Yearly TRY**
- **Price:** 4990.00
- **Currency:** TRY
- **Billing period:** Yearly
- **Lookup key:** `profesyonel_yearly_try`
- **COPY PRICE ID**

**Price 4: Yearly USD**
- **Price:** 149.00
- **Currency:** USD
- **Billing period:** Yearly
- **Lookup key:** `profesyonel_yearly_usd`
- **COPY PRICE ID**

---

#### Product 3: Ofis Plus (Office Plus)

1. Click **"Add product"** again
2. Fill in:
   - **Name:** Emlak CRM - Ofis Plus / Office Plus
   - **Description:** Enterprise solution for large teams
3. Click **"Save product"**
4. **COPY THE PRODUCT ID** → Save as "Ofis Plus Product ID"

**Create 4 prices for Ofis Plus:**

**Price 1: Monthly TRY**
- **Price:** 999.00
- **Currency:** TRY
- **Billing period:** Monthly
- **Lookup key:** `ofis_plus_monthly_try`
- **COPY PRICE ID**

**Price 2: Monthly USD**
- **Price:** 29.99
- **Currency:** USD
- **Billing period:** Monthly
- **Lookup key:** `ofis_plus_monthly_usd`
- **COPY PRICE ID**

**Price 3: Yearly TRY**
- **Price:** 9990.00
- **Currency:** TRY
- **Billing period:** Yearly
- **Lookup key:** `ofis_plus_yearly_try`
- **COPY PRICE ID**

**Price 4: Yearly USD**
- **Price:** 299.00
- **Currency:** USD
- **Billing period:** Yearly
- **Lookup key:** `ofis_plus_yearly_usd`
- **COPY PRICE ID**

---

### STEP 2: Update Configuration with Real IDs (10 minutes)

**Edit:** `supabase/functions/_shared/stripe-prices.ts`

Replace all placeholder IDs with your actual IDs from Step 1:

```typescript
export const STRIPE_CONFIG = {
  plans: {
    baslangic: {
      productId: 'prod_ABC123...', // ← Your Baslangic Product ID
      prices: {
        monthly: {
          try: 'price_XYZ789...', // ← Baslangic Monthly TRY Price ID
          usd: 'price_XYZ789...', // ← Baslangic Monthly USD Price ID
        },
        yearly: {
          try: 'price_XYZ789...', // ← Baslangic Yearly TRY Price ID
          usd: 'price_XYZ789...', // ← Baslangic Yearly USD Price ID
        },
      },
    },
    profesyonel: {
      productId: 'prod_DEF456...', // ← Your Profesyonel Product ID
      prices: {
        monthly: {
          try: 'price_UVW012...', // ← Profesyonel Monthly TRY Price ID
          usd: 'price_UVW012...', // ← Profesyonel Monthly USD Price ID
        },
        yearly: {
          try: 'price_UVW012...', // ← Profesyonel Yearly TRY Price ID
          usd: 'price_UVW012...', // ← Profesyonel Yearly USD Price ID
        },
      },
    },
    ofis_plus: {
      productId: 'prod_GHI789...', // ← Your Ofis Plus Product ID
      prices: {
        monthly: {
          try: 'price_RST345...', // ← Ofis Plus Monthly TRY Price ID
          usd: 'price_RST345...', // ← Ofis Plus Monthly USD Price ID
        },
        yearly: {
          try: 'price_RST345...', // ← Ofis Plus Yearly TRY Price ID
          usd: 'price_RST345...', // ← Ofis Plus Yearly USD Price ID
        },
      },
    },
  },
} as const;
```

**Save the file.**

---

### STEP 3: Apply Database Migration (2 minutes)

Run this command in your terminal:

```bash
supabase db push
```

This will:
- Create `stripe_customers` table
- Create `subscriptions` table
- Add indexes
- Set up RLS policies
- Create helper function

**Verify it worked:**

```bash
# Check tables exist
supabase db diff
```

---

### STEP 4: Set Supabase Secrets (5 minutes)

**Get your Stripe keys:**

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_`)
3. Copy your **Publishable key** (starts with `pk_test_`)

**Set secrets:**

```bash
# Stripe secret key (for Edge Functions)
supabase secrets set STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"

# Note: Webhook secret will be set later after deploying webhook function
```

**Set frontend environment variable:**

Edit `.env.local` (or `.env`):

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

---

## ✅ CHECKLIST

Before moving to the next phase, make sure:

- [ ] **Baslangic Product** created (Product ID copied)
- [ ] **Baslangic 4 Prices** created (All 4 Price IDs copied)
- [ ] **Profesyonel Product** created (Product ID copied)
- [ ] **Profesyonel 4 Prices** created (All 4 Price IDs copied)
- [ ] **Ofis Plus Product** created (Product ID copied)
- [ ] **Ofis Plus 4 Prices** created (All 4 Price IDs copied)
- [ ] **Total: 3 Products + 12 Prices** ✓
- [ ] `stripe-prices.ts` updated with all real IDs
- [ ] Database migration applied (`supabase db push`)
- [ ] Tables visible in Supabase Dashboard → Database
- [ ] `STRIPE_SECRET_KEY` secret set
- [ ] Frontend `.env` has publishable key

---

## 🚀 WHAT'S NEXT AFTER THIS?

Once you complete the above steps, we'll implement:

**Phase 4: Edge Functions**
1. `create-checkout-session` - Creates Stripe Checkout for users (supports plan parameter)
2. `stripe-webhook` - Handles subscription events from Stripe

**Phase 5: Webhook Configuration**
1. Deploy webhook function
2. Register endpoint in Stripe Dashboard
3. Set webhook secret

**Phase 6: Frontend**
1. Create billing/pricing page with 3 plan options
2. Add checkout flow (passes plan + interval + currency)
3. Update ProtectedRoute with subscription check

---

## 📞 READY TO CONTINUE?

Once you've completed Steps 1-4 above, let me know and I'll implement the Edge Functions!

**To verify everything is ready:**

```bash
# Check migration applied
supabase db diff

# Check secrets set
supabase secrets list

# Should show STRIPE_SECRET_KEY
```

---

## 🆘 TROUBLESHOOTING

### Migration fails with "relation already exists"

**Solution:** The table might already exist. Check with:

```bash
supabase db remote ls
```

If you see `stripe_customers` or `subscriptions`, they already exist. You can skip the migration or drop them first:

```sql
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;
```

### Can't find Stripe Product/Price IDs

**Solution:**
- Product ID: Click on the product → URL shows `products/prod_ABC123XYZ`
- Price ID: Click on a price → Click "⋮" menu → "Copy price ID"

### Secrets not setting

**Solution:** Make sure you're logged in to Supabase:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

---

## 📊 PRICING REFERENCE TABLE

Use this as a template when creating your Stripe Prices:

| Plan | Monthly TRY | Yearly TRY | Monthly USD | Yearly USD |
|------|-------------|------------|-------------|------------|
| Baslangic | 199 TRY | 1,990 TRY | $6.99 | $69 |
| Profesyonel | 499 TRY | 4,990 TRY | $14.99 | $149 |
| Ofis Plus | 999 TRY | 9,990 TRY | $29.99 | $299 |

**Note:** These are example prices. Adjust based on your actual pricing strategy.

---

## 📚 REFERENCE

- [Stripe Products](https://dashboard.stripe.com/test/products)
- [Stripe API Keys](https://dashboard.stripe.com/test/apikeys)
- [Supabase Dashboard](https://supabase.com/dashboard/project/_/database/tables)
- Full integration plan: `docs/stripe-integration-plan.md`
