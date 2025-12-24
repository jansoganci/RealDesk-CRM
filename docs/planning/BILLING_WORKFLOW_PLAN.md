# Billing & Subscription Workflow Plan
## Emlak CRM - Micro SaaS Payment Integration

**Date:** 2025-01-27  
**Status:** Planning Document  
**Version:** 1.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Model Overview](#business-model-overview)
3. [Data Model Design](#data-model-design)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Routing & Access Gating](#routing--access-gating)
7. [i18n Translation Plan](#i18n-translation-plan)
8. [Implementation Phases](#implementation-phases)
9. [Stripe Integration Details](#stripe-integration-details)
10. [Security Considerations](#security-considerations)

---

## Executive Summary

This document outlines the complete billing and subscription workflow for Emlak CRM, transforming it from a free application to a paid SaaS product with:

- **14-day free trial** (no credit card required)
- **Stripe-powered subscriptions** (Monthly/Yearly plans)
- **Automatic paywall** when trial expires or subscription inactive
- **Customer Portal** for self-service subscription management
- **Future-ready architecture** for multiple tiers and quotas

**Key Decision:** Since the current architecture uses `user_id` for data isolation (single-tenant per user), billing will be tracked **per user account** rather than per agency. This simplifies the initial implementation while maintaining flexibility for future multi-tenant agency features.

---

## Business Model Overview

### Product Offering

**Single Product:** "Emlak CRM Pro"

- **Monthly Plan:** Recurring monthly subscription
- **Yearly Plan:** Discounted annual subscription (e.g., 20% off)

### Trial Model

- **14-day free trial** starts automatically on account creation
- **No credit card required** during trial
- **Full feature access** during trial period
- **Automatic conversion** to paid plan required after trial ends

### Billing Status Flow

```
New User Registration
    ↓
Trial Started (14 days)
    ↓
Trial Active → Dashboard Access
    ↓
Trial Expired → Paywall Shown
    ↓
User Subscribes → Active Subscription
    ↓
Subscription Active → Dashboard Access
    ↓
[Optional] Subscription Canceled → Access until period_end
    ↓
Subscription Expired → Paywall Shown
```

### Billing Status Enum

- `trial` - User is in 14-day free trial period
- `active` - User has active paid subscription
- `canceled` - Subscription canceled but still has access until period_end
- `expired` - Trial ended or subscription expired, no access
- `past_due` - Payment failed, grace period (optional)

---

## Data Model Design

### New Supabase Table: `user_billing`

**Location:** `supabase/migrations/[timestamp]_create_user_billing_table.sql`

```sql
CREATE TABLE public.user_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stripe Integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  
  -- Plan Information
  plan_id TEXT NOT NULL DEFAULT 'pro_monthly', -- 'pro_monthly' | 'pro_yearly'
  plan_name TEXT NOT NULL DEFAULT 'Pro Monthly',
  
  -- Billing Status
  billing_status TEXT NOT NULL DEFAULT 'trial', -- 'trial' | 'active' | 'canceled' | 'expired' | 'past_due'
  
  -- Trial Information
  trial_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  trial_used BOOLEAN DEFAULT false,
  
  -- Subscription Information
  subscription_start TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  
  -- Payment Information
  payment_method_type TEXT, -- 'card' | 'bank_account' | etc.
  last_payment_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_billing_user_id ON user_billing(user_id);
CREATE INDEX idx_user_billing_stripe_customer_id ON user_billing(stripe_customer_id);
CREATE INDEX idx_user_billing_stripe_subscription_id ON user_billing(stripe_subscription_id);
CREATE INDEX idx_user_billing_status ON user_billing(billing_status);
CREATE INDEX idx_user_billing_trial_end ON user_billing(trial_end);
CREATE INDEX idx_user_billing_period_end ON user_billing(current_period_end);

-- RLS Policies
ALTER TABLE user_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own billing"
  ON user_billing FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own billing"
  ON user_billing FOR UPDATE
  USING (auth.uid() = user_id);

-- Note: INSERT is handled by trigger/webhook, not directly by users
-- UPDATE is allowed for users to update cancel_at_period_end flag

-- Trigger to auto-create billing record on user signup
CREATE OR REPLACE FUNCTION create_user_billing_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_billing (user_id, trial_start, trial_end)
  VALUES (
    NEW.id,
    NOW(),
    NOW() + INTERVAL '14 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_user_billing
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_billing_on_signup();

-- Function to check if user has active access
CREATE OR REPLACE FUNCTION user_has_active_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  billing_record RECORD;
BEGIN
  SELECT * INTO billing_record
  FROM user_billing
  WHERE user_id = user_uuid;
  
  IF billing_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if trial is still active
  IF billing_record.billing_status = 'trial' AND billing_record.trial_end > NOW() THEN
    RETURN true;
  END IF;
  
  -- Check if subscription is active
  IF billing_record.billing_status = 'active' AND billing_record.current_period_end > NOW() THEN
    RETURN true;
  END IF;
  
  -- Check if canceled but still in period
  IF billing_record.billing_status = 'canceled' 
     AND billing_record.current_period_end > NOW() 
     AND billing_record.cancel_at_period_end = true THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Plan Configuration Table (Optional - Can be hardcoded initially)

```sql
CREATE TABLE public.billing_plans (
  id TEXT PRIMARY KEY, -- 'pro_monthly' | 'pro_yearly'
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL, -- Price per month (for yearly, divide by 12)
  currency TEXT DEFAULT 'TRY',
  interval TEXT NOT NULL, -- 'month' | 'year'
  stripe_price_id TEXT NOT NULL, -- Stripe Price ID
  stripe_product_id TEXT NOT NULL, -- Stripe Product ID
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial plans (inserted via migration)
INSERT INTO billing_plans (id, name, description, price_monthly, currency, interval, stripe_price_id, stripe_product_id, display_order)
VALUES
  ('pro_monthly', 'Pro Monthly', 'Monthly subscription', 99.00, 'TRY', 'month', 'price_monthly_id_here', 'prod_pro_id_here', 1),
  ('pro_yearly', 'Pro Yearly', 'Yearly subscription (save 20%)', 79.00, 'TRY', 'year', 'price_yearly_id_here', 'prod_pro_id_here', 2);
```

---

## Frontend Architecture

### New Feature Module: `src/features/billing/`

**Structure:**
```
src/features/billing/
├── Billing.tsx                    # Main billing page (/app/billing)
├── Paywall.tsx                    # Paywall page (/app/billing/subscribe)
├── Pricing.tsx                    # Public pricing page (/pricing)
├── components/
│   ├── BillingStatusCard.tsx     # Shows current plan & status
│   ├── PlanCard.tsx              # Reusable pricing card component
│   ├── TrialCountdown.tsx        # Shows days remaining in trial
│   └── SubscriptionActions.tsx   # Manage/Cancel buttons
├── hooks/
│   ├── useBillingData.ts         # Fetch billing status from Supabase
│   ├── useBillingActions.ts      # Stripe Checkout/Portal actions
│   └── useBillingAccess.ts       # Check if user has access (for gating)
└── types/
    └── billing.types.ts          # TypeScript types for billing
```

### New Routes

**Add to `src/config/constants.ts`:**
```typescript
export const ROUTES = {
  // ... existing routes
  PRICING: '/pricing',
  BILLING: '/billing',
  BILLING_SUBSCRIBE: '/billing/subscribe',
} as const;
```

**Add to `src/App.tsx`:**
```typescript
// Public route
<Route path={ROUTES.PRICING} element={<Pricing />} />

// Protected routes
<Route
  path={ROUTES.BILLING}
  element={
    <ProtectedRoute>
      <Billing />
    </ProtectedRoute>
  }
/>
<Route
  path={ROUTES.BILLING_SUBSCRIBE}
  element={
    <ProtectedRoute>
      <Paywall />
    </ProtectedRoute>
  }
/>
```

### Billing Service Layer

**New file:** `src/services/billing.service.ts`

```typescript
import { supabase } from '../config/supabase';
import { getAuthenticatedUserId } from '../lib/auth';

export interface UserBilling {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_id: string;
  plan_name: string;
  billing_status: 'trial' | 'active' | 'canceled' | 'expired' | 'past_due';
  trial_start: string;
  trial_end: string;
  trial_used: boolean;
  subscription_start: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  next_billing_date: string | null;
  created_at: string;
  updated_at: string;
}

class BillingService {
  async getBillingStatus(): Promise<UserBilling | null> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('user_billing')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No billing record found (shouldn't happen with trigger, but handle gracefully)
        return null;
      }
      throw error;
    }

    return data;
  }

  async hasActiveAccess(): Promise<boolean> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .rpc('user_has_active_access', { user_uuid: userId });

    if (error) throw error;
    return data === true;
  }

  async updateCancelAtPeriodEnd(cancelAtPeriodEnd: boolean): Promise<void> {
    const userId = await getAuthenticatedUserId();
    const { error } = await supabase
      .from('user_billing')
      .update({ cancel_at_period_end: cancelAtPeriodEnd })
      .eq('user_id', userId);

    if (error) throw error;
  }
}

export const billingService = new BillingService();
```

### Billing Context (Optional - for global access check)

**New file:** `src/contexts/BillingContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { billingService, UserBilling } from '../services/billing.service';

interface BillingContextType {
  billing: UserBilling | null;
  loading: boolean;
  hasAccess: boolean;
  refreshBilling: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider = ({ children }: { children: React.ReactNode }) => {
  const [billing, setBilling] = useState<UserBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const refreshBilling = async () => {
    try {
      const billingData = await billingService.getBillingStatus();
      setBilling(billingData);
      
      if (billingData) {
        const access = await billingService.hasActiveAccess();
        setHasAccess(access);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Failed to fetch billing status:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBilling();
  }, []);

  return (
    <BillingContext.Provider value={{ billing, loading, hasAccess, refreshBilling }}>
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within BillingProvider');
  }
  return context;
};
```

---

## Backend Architecture

### API Endpoints (Node.js/Express or Supabase Edge Functions)

**Option 1: Express Server** (if you have one)
**Option 2: Supabase Edge Functions** (recommended for serverless)

### Required Endpoints

#### 1. Create Checkout Session
**POST** `/api/billing/create-checkout-session`

**Request:**
```typescript
{
  planId: 'pro_monthly' | 'pro_yearly',
  successUrl: string, // e.g., `${window.location.origin}/billing?success=true`
  cancelUrl: string   // e.g., `${window.location.origin}/billing/subscribe?canceled=true`
}
```

**Response:**
```typescript
{
  sessionId: string, // Stripe Checkout Session ID
  url: string        // Redirect URL to Stripe Checkout
}
```

**Implementation:** `supabase/functions/create-checkout-session/index.ts`

#### 2. Create Portal Session
**POST** `/api/billing/create-portal-session`

**Request:**
```typescript
{
  returnUrl: string // e.g., `${window.location.origin}/billing`
}
```

**Response:**
```typescript
{
  url: string // Redirect URL to Stripe Customer Portal
}
```

**Implementation:** `supabase/functions/create-portal-session/index.ts`

#### 3. Stripe Webhook Handler
**POST** `/api/billing/webhook`

**Handles Stripe Events:**
- `checkout.session.completed` - User completed checkout
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription updated (plan change, cancel, etc.)
- `customer.subscription.deleted` - Subscription canceled/expired
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed

**Implementation:** `supabase/functions/stripe-webhook/index.ts`

**Webhook Logic:**
```typescript
// Pseudo-code
switch (event.type) {
  case 'checkout.session.completed':
    // Update user_billing with stripe_customer_id, subscription_id
    // Set billing_status = 'active'
    // Set subscription_start, current_period_start, current_period_end
    break;
    
  case 'customer.subscription.updated':
    // Update subscription details
    // Handle cancel_at_period_end flag
    break;
    
  case 'customer.subscription.deleted':
    // Set billing_status = 'expired'
    // Clear subscription dates
    break;
    
  case 'invoice.payment_failed':
    // Set billing_status = 'past_due'
    // Send notification email
    break;
}
```

### Stripe Configuration

**Environment Variables:**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Stripe Products Setup:**
1. Create Product: "Emlak CRM Pro"
2. Create Price: Monthly (recurring, monthly)
3. Create Price: Yearly (recurring, yearly, 20% discount)
4. Note the Price IDs for use in backend

---

## Routing & Access Gating

### Enhanced ProtectedRoute Component

**Update:** `src/components/common/ProtectedRoute.tsx`

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBilling } from '../../contexts/BillingContext'; // If using context
import { ROUTES } from '../../config/constants';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: billingLoading } = useBilling();
  const location = useLocation();

  // Wait for auth and billing checks
  if (authLoading || billingLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Redirect to paywall if no active access
  if (!hasAccess) {
    return <Navigate to={ROUTES.BILLING_SUBSCRIBE} replace />;
  }

  return <>{children}</>;
};
```

### Alternative: Billing Hook for Manual Checks

**New file:** `src/hooks/useBillingAccess.ts`

```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingService } from '../services/billing.service';
import { ROUTES } from '../config/constants';

export const useBillingAccess = (redirectIfNoAccess = true) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const access = await billingService.hasActiveAccess();
        setHasAccess(access);
        
        if (!access && redirectIfNoAccess) {
          navigate(ROUTES.BILLING_SUBSCRIBE, { replace: true });
        }
      } catch (error) {
        console.error('Billing access check failed:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [navigate, redirectIfNoAccess]);

  return { hasAccess, loading };
};
```

### Post-Login Billing Check

**Update:** `src/features/auth/Login.tsx` (after successful login)

```typescript
// After signIn success, before navigating to dashboard
const billingStatus = await billingService.getBillingStatus();
const hasAccess = await billingService.hasActiveAccess();

if (!hasAccess) {
  navigate(ROUTES.BILLING_SUBSCRIBE, { replace: true });
} else {
  navigate(ROUTES.DASHBOARD, { replace: true });
}
```

---

## i18n Translation Plan

### New Translation Namespace: `billing`

**File:** `public/locales/tr/billing.json`
**File:** `public/locales/en/billing.json`

### Translation Keys Structure

```json
{
  "pricing": {
    "title": "Fiyatlandırma",
    "subtitle": "Emlak CRM Pro ile işinizi büyütün",
    "monthly": "Aylık",
    "yearly": "Yıllık",
    "save": "Tasarruf",
    "perMonth": "/ay",
    "perYear": "/yıl",
    "trial": "14 gün ücretsiz deneme",
    "features": {
      "title": "Tüm özellikler dahil",
      "unlimitedProperties": "Sınırsız mülk",
      "unlimitedContracts": "Sınırsız sözleşme",
      "pdfGeneration": "PDF sözleşme oluşturma",
      "financialTracking": "Finansal takip",
      "calendar": "Takvim ve randevu yönetimi",
      "support": "E-posta desteği"
    },
    "cta": {
      "startTrial": "Ücretsiz Denemeyi Başlat",
      "subscribe": "Abone Ol"
    },
    "popular": "En Popüler"
  },
  "billing": {
    "title": "Faturalama ve Abonelik",
    "currentPlan": "Mevcut Plan",
    "billingStatus": "Faturalama Durumu",
    "status": {
      "trial": "Deneme Aşamasında",
      "active": "Aktif",
      "canceled": "İptal Edildi",
      "expired": "Süresi Doldu",
      "past_due": "Ödeme Bekleniyor"
    },
    "trial": {
      "title": "Ücretsiz Deneme",
      "daysRemaining": "{{days}} gün kaldı",
      "endsOn": "{{date}} tarihinde sona eriyor",
      "upgradePrompt": "Deneme süreniz bitmeden abone olun"
    },
    "subscription": {
      "title": "Abonelik Detayları",
      "started": "Başlangıç Tarihi",
      "nextBilling": "Sonraki Faturalama",
      "renewsOn": "{{date}} tarihinde yenilenecek",
      "cancelsOn": "{{date}} tarihinde iptal edilecek"
    },
    "actions": {
      "manageSubscription": "Aboneliği Yönet",
      "changePlan": "Planı Değiştir",
      "cancelSubscription": "Aboneliği İptal Et",
      "resumeSubscription": "Aboneliği Yeniden Başlat",
      "upgrade": "Yükselt"
    },
    "cancel": {
      "title": "Aboneliği İptal Et",
      "message": "Aboneliğiniz iptal edilecek ancak {{date}} tarihine kadar erişiminiz devam edecek.",
      "confirm": "İptal Etmeyi Onayla",
      "cancel": "Vazgeç"
    }
  },
  "paywall": {
    "title": "Abonelik Gerekli",
    "subtitle": "Devam etmek için bir plan seçin",
    "trialExpired": "Deneme süreniz sona erdi",
    "subscriptionExpired": "Aboneliğiniz sona erdi",
    "choosePlan": "Bir plan seçin",
    "restoreAccess": "Erişiminizi Geri Yükle"
  },
  "checkout": {
    "redirecting": "Stripe'a yönlendiriliyorsunuz...",
    "success": {
      "title": "Ödeme Başarılı",
      "message": "Aboneliğiniz aktif edildi. Hoş geldiniz!"
    },
    "canceled": {
      "title": "Ödeme İptal Edildi",
      "message": "Ödeme işlemi iptal edildi. İstediğiniz zaman tekrar deneyebilirsiniz."
    },
    "error": {
      "title": "Ödeme Hatası",
      "message": "Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin."
    }
  },
  "errors": {
    "billingNotFound": "Faturalama bilgisi bulunamadı",
    "stripeError": "Stripe hatası oluştu",
    "subscriptionFailed": "Abonelik oluşturulamadı",
    "paymentFailed": "Ödeme başarısız",
    "generic": "Bir hata oluştu. Lütfen tekrar deneyin."
  }
}
```

---

## Implementation Phases

### Phase 1: Data Model + Minimal Trial Gating
**Timeline:** Week 1-2

**Tasks:**
1. ✅ Create `user_billing` table migration
2. ✅ Create trigger to auto-create billing record on signup
3. ✅ Create `user_has_active_access()` RPC function
4. ✅ Create `billingService` in frontend
5. ✅ Update `ProtectedRoute` to check billing access
6. ✅ Add basic billing status check on login
7. ✅ Test trial period flow

**Deliverables:**
- Users automatically get 14-day trial on signup
- Trial expiration blocks dashboard access
- Basic paywall redirect works

---

### Phase 2: Stripe Checkout + Webhook
**Timeline:** Week 3-4

**Tasks:**
1. ✅ Set up Stripe account and products/prices
2. ✅ Create Supabase Edge Function: `create-checkout-session`
3. ✅ Create Supabase Edge Function: `stripe-webhook`
4. ✅ Create `Paywall.tsx` component with pricing cards
5. ✅ Integrate Stripe Checkout redirect flow
6. ✅ Handle webhook events (subscription created/updated/deleted)
7. ✅ Update `Billing.tsx` to show subscription status
8. ✅ Test complete subscription flow

**Deliverables:**
- Users can subscribe via Stripe Checkout
- Webhook updates billing status automatically
- Subscription status visible in billing page

---

### Phase 3: Customer Portal + Plan Switch
**Timeline:** Week 5

**Tasks:**
1. ✅ Create Supabase Edge Function: `create-portal-session`
2. ✅ Add "Manage Subscription" button to `Billing.tsx`
3. ✅ Integrate Stripe Customer Portal redirect
4. ✅ Handle plan changes via webhook
5. ✅ Add "Change Plan" UI (optional - can use Portal)
6. ✅ Test plan switching flow

**Deliverables:**
- Users can manage subscription via Stripe Portal
- Plan changes reflected in app
- Cancel/resume functionality works

---

### Phase 4: Public Pricing Page + Quota-Based Upgrades
**Timeline:** Week 6+

**Tasks:**
1. ✅ Create public `Pricing.tsx` page
2. ✅ Add pricing section to landing page
3. ✅ Link pricing page from header
4. ✅ Pre-fill plan selection in registration flow
5. ✅ Add quota checks (e.g., max properties, max users)
6. ✅ Show upgrade prompts when limits reached
7. ✅ Add usage meters to billing page

**Deliverables:**
- Public pricing page with plan comparison
- Quota enforcement with upgrade prompts
- Usage tracking and display

---

## Stripe Integration Details

### Stripe Checkout Flow

```typescript
// Frontend: src/features/billing/hooks/useBillingActions.ts
const handleSubscribe = async (planId: string) => {
  try {
    const response = await fetch('/api/billing/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl: `${window.location.origin}/billing/subscribe?canceled=true`,
      }),
    });
    
    const { url } = await response.json();
    window.location.href = url; // Redirect to Stripe Checkout
  } catch (error) {
    toast.error(t('billing:errors.subscriptionFailed'));
  }
};
```

### Stripe Customer Portal Flow

```typescript
const handleManageSubscription = async () => {
  try {
    const response = await fetch('/api/billing/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        returnUrl: `${window.location.origin}/billing`,
      }),
    });
    
    const { url } = await response.json();
    window.location.href = url; // Redirect to Stripe Portal
  } catch (error) {
    toast.error(t('billing:errors.stripeError'));
  }
};
```

### Webhook Event Handling

**Key Events to Handle:**

1. **`checkout.session.completed`**
   - User completed payment
   - Update `user_billing` with subscription details
   - Set `billing_status = 'active'`

2. **`customer.subscription.updated`**
   - Plan changed, canceled, resumed
   - Update subscription dates and status

3. **`customer.subscription.deleted`**
   - Subscription ended
   - Set `billing_status = 'expired'`

4. **`invoice.payment_failed`**
   - Payment declined
   - Set `billing_status = 'past_due'`
   - Send notification email

---

## Security Considerations

### 1. Webhook Security
- ✅ Verify Stripe webhook signatures
- ✅ Use `STRIPE_WEBHOOK_SECRET` to validate events
- ✅ Idempotency: Handle duplicate events gracefully

### 2. RLS Policies
- ✅ Users can only view/update their own billing records
- ✅ Webhook handler uses `SECURITY DEFINER` for admin access
- ✅ No direct user access to Stripe customer/subscription IDs

### 3. Access Control
- ✅ Billing status checked server-side (RPC function)
- ✅ Frontend checks are for UX only, not security
- ✅ All protected routes verify billing access

### 4. Data Privacy
- ✅ Stripe customer IDs stored securely
- ✅ No payment card data stored in Supabase
- ✅ PCI compliance handled by Stripe

---

## Future Enhancements

### Multi-Tier Plans
- Add "Basic", "Pro", "Enterprise" tiers
- Different feature sets per tier
- Upgrade/downgrade flows

### Usage-Based Billing
- Track API calls, storage, etc.
- Metered billing for heavy users
- Overage charges

### Agency/Organization Billing
- When multi-tenant agency model is added
- Billing per agency instead of per user
- Team member management

### Promotional Codes
- Discount codes for trials/extensions
- Referral program integration
- Seasonal promotions

---

## Notes

- **Current Architecture:** Single-tenant per user (no agency model yet)
- **Billing Model:** Per-user subscription (simplifies initial implementation)
- **Future Migration:** When agency model is added, billing can migrate to `agency_billing` table
- **Trial Extension:** Can be manually extended via admin panel or Stripe dashboard
- **Currency:** Initially TRY, can add USD/EUR later via Stripe multi-currency

---

**End of Document**

