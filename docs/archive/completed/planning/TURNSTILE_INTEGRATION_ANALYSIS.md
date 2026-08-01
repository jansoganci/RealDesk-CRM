# 🔍 Cloudflare Turnstile Integration - Analysis Report

**Date:** 2026-02-09  
**Status:** ✅ Analysis Complete - Ready for Implementation

---

## 📋 Executive Summary

This document provides a comprehensive analysis of the current authentication flow and identifies all integration points for Cloudflare Turnstile CAPTCHA integration. The integration will add invisible CAPTCHA verification to Login and Register forms before authentication requests.

---

## 1. 🌍 Environment Variables

### Current Structure

**File Location:** `.env` (project root)

**Current Variables:**
```env
VITE_SUPABASE_URL=https://jglxczzxliaiigccavnb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
LEGACY_CLIENT_ENCRYPTION_KEY=[redacted-and-retired]
```

### Naming Convention
- **Pattern:** `VITE_` prefix for all frontend environment variables
- **Reason:** Vite requires `VITE_` prefix to expose variables to client-side code

### Integration Point

**Add to `.env`:**
```env
VITE_TURNSTILE_SITE_KEY=your-site-key-here
```

**Access in code:**
```typescript
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
```

**⚠️ Note:** The Secret Key is already added to Supabase Edge Functions secrets (as mentioned in context).

---

## 2. 📄 HTML Structure

### Current Structure

**File Location:** `index.html` (project root)

**Current `<head>` section:**
- Meta tags (viewport, theme-color, SEO)
- Preconnect/DNS-prefetch for Supabase
- Manifest and Apple touch icons
- No external scripts currently loaded

### Integration Point

**Add Turnstile script tag in `<head>`:**

```html
<!-- Cloudflare Turnstile -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

**Recommended location:** After meta tags, before closing `</head>` tag

**Why in `<head>`:**
- Ensures script loads early
- Available when React components mount
- Better for performance (async defer)

**Current `index.html` structure:**
```html
<head>
  <!-- Meta tags -->
  <!-- Preconnect -->
  <!-- Manifest -->
  <!-- Title -->
  <!-- SEO meta tags -->
  <!-- [ADD TURNSTILE SCRIPT HERE] -->
</head>
```

---

## 3. 🔐 Login Component Analysis

### File Location
`src/features/auth/Login.tsx`

### Current Form Submission Flow

**Line 41-73:** `onSubmit` function

```typescript
const onSubmit = async (data: LoginFormData) => {
  setLoading(true);
  try {
    localStorage.setItem("pending_login_method", "email");
    await signIn(data.email, data.password);  // ← AuthContext call
    
    // Session confirmation logic...
    toast.success(t('toast.loginSuccess'));
    navigate(redirect || ROUTES.DASHBOARD, { replace: true });
  } catch (error) {
    // Error handling...
  } finally {
    setLoading(false);
  }
};
```

### Key Integration Points

1. **Form Structure (Line 141-202):**
   - Uses `react-hook-form` with `Form` component
   - Submit button triggers `form.handleSubmit(onSubmit)`
   - Form fields: email, password

2. **Where `signIn()` is called:**
   - **Line 45:** `await signIn(data.email, data.password)`
   - Called directly from `onSubmit` handler
   - No token validation before this call

3. **Best Place to Integrate Turnstile:**

   **Option A: Invisible Widget (Recommended)**
   - Add `<div>` container before submit button (Line 188)
   - Render Turnstile widget invisibly
   - Capture token before calling `signIn()`
   - Pass token to `signIn()` function

   **Option B: Managed Mode**
   - Use Turnstile's managed mode (invisible for most users)
   - Widget auto-executes on form interaction
   - Capture token on form submit

4. **Token Capture Strategy:**

```typescript
// Add state for Turnstile token
const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

// Modify onSubmit to wait for token
const onSubmit = async (data: LoginFormData) => {
  if (!turnstileToken) {
    toast.error('Please complete verification');
    return;
  }
  
  setLoading(true);
  try {
    await signIn(data.email, data.password, turnstileToken);
    // ... rest of flow
  }
};
```

### Current Form Structure
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField name="email" />
    <FormField name="password" />
    <Button type="submit">Sign In</Button>
  </form>
</Form>
```

**Recommended Integration:**
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField name="email" />
    <FormField name="password" />
    
    {/* Turnstile Widget - Invisible */}
    <div 
      id="turnstile-widget-login"
      className="cf-turnstile"
      data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
      data-callback="onTurnstileSuccess"
      data-size="invisible"
    />
    
    <Button type="submit">Sign In</Button>
  </form>
</Form>
```

---

## 4. 📝 Register Component Analysis

### File Location
`src/features/auth/Register.tsx`

### Current Form Submission Flow

**Line 48-82:** `onSubmit` function

```typescript
const onSubmit = async (data: RegisterFormData) => {
  // Validate terms acceptance
  if (!acceptTerms) {
    setTermsError(t('termsRequired'));
    return;
  }
  
  setLoading(true);
  try {
    localStorage.setItem("pending_login_method", "email");
    const result = await signUp(data.email, data.password);  // ← AuthContext call
    
    if (result.requiresEmailConfirmation) {
      setUserEmail(data.email);
      setEmailSent(true);
      toast.success(t('toast.emailConfirmationSent'));
    } else {
      toast.success(t('toast.signUpSuccess'));
      navigate(ROUTES.LOGIN, { replace: true });
    }
  } catch (error) {
    // Error handling...
  } finally {
    setLoading(false);
  }
};
```

### Key Integration Points

1. **Form Structure (Line 198-319):**
   - Uses `react-hook-form` with `Form` component
   - Submit button triggers `form.handleSubmit(onSubmit)`
   - Form fields: email, password, confirmPassword
   - Terms acceptance checkbox

2. **Where `signUp()` is called:**
   - **Line 59:** `const result = await signUp(data.email, data.password)`
   - Called directly from `onSubmit` handler
   - No token validation before this call

3. **Best Place to Integrate Turnstile:**

   **Same approach as Login:**
   - Add invisible Turnstile widget before submit button (Line 305)
   - Capture token before calling `signUp()`
   - Pass token to `signUp()` function

4. **Token Capture Strategy:**

```typescript
// Add state for Turnstile token
const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

// Modify onSubmit to wait for token
const onSubmit = async (data: RegisterFormData) => {
  if (!acceptTerms) {
    setTermsError(t('termsRequired'));
    return;
  }
  
  if (!turnstileToken) {
    toast.error('Please complete verification');
    return;
  }
  
  setLoading(true);
  try {
    const result = await signUp(data.email, data.password, turnstileToken);
    // ... rest of flow
  }
};
```

### Current Form Structure
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField name="email" />
    <FormField name="password" />
    <FormField name="confirmPassword" />
    {/* Terms checkbox */}
    <Button type="submit">Sign Up</Button>
  </form>
</Form>
```

**Recommended Integration:**
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField name="email" />
    <FormField name="password" />
    <FormField name="confirmPassword" />
    {/* Terms checkbox */}
    
    {/* Turnstile Widget - Invisible */}
    <div 
      id="turnstile-widget-register"
      className="cf-turnstile"
      data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
      data-callback="onTurnstileSuccess"
      data-size="invisible"
    />
    
    <Button type="submit">Sign Up</Button>
  </form>
</Form>
```

---

## 5. 🔑 AuthContext Analysis

### File Location
`src/contexts/AuthContext.tsx`

### Current Function Signatures

**Line 23:** `signIn` function signature
```typescript
signIn: (email: string, password: string) => Promise<void>;
```

**Line 24:** `signUp` function signature
```typescript
signUp: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>;
```

### Current Implementation

**Line 250-257:** `signIn` implementation
```typescript
const signIn = useCallback(async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
}, []);
```

**Line 259-273:** `signUp` implementation
```typescript
const signUp = useCallback(async (email: string, password: string) => {
  await supabase.auth.signOut();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/confirm-email`,
    },
  });
  
  if (error) throw error;
  const requiresEmailConfirmation = !data.session && !!data.user;
  return { requiresEmailConfirmation };
}, []);
```

### Required Modifications

**Option 1: Add Token Parameter (Recommended)**

Modify function signatures to accept optional Turnstile token:

```typescript
// Update interface (Line 23-24)
signIn: (email: string, password: string, turnstileToken?: string) => Promise<void>;
signUp: (email: string, password: string, turnstileToken?: string) => Promise<{ requiresEmailConfirmation: boolean }>;

// Update implementations
const signIn = useCallback(async (email: string, password: string, turnstileToken?: string) => {
  // Verify Turnstile token via Edge Function BEFORE auth
  if (turnstileToken) {
    await verifyTurnstileToken(turnstileToken);
  }
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
}, []);

const signUp = useCallback(async (email: string, password: string, turnstileToken?: string) => {
  // Verify Turnstile token via Edge Function BEFORE auth
  if (turnstileToken) {
    await verifyTurnstileToken(turnstileToken);
  }
  
  await supabase.auth.signOut();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/confirm-email`,
    },
  });
  
  if (error) throw error;
  const requiresEmailConfirmation = !data.session && !!data.user;
  return { requiresEmailConfirmation };
}, []);
```

**Option 2: Verify Token in Components**

Keep AuthContext functions unchanged, verify token in Login/Register components before calling `signIn()`/`signUp()`.

**Recommendation:** Option 1 is cleaner and ensures token verification happens consistently.

### Helper Function Needed

Add a helper function to call the Turnstile verification Edge Function:

```typescript
// Add to AuthContext.tsx or create separate service
async function verifyTurnstileToken(token: string): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const functionUrl = `${supabaseUrl}/functions/v1/verify-turnstile`;
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Verification failed' }));
    throw new Error(errorData.error || 'Turnstile verification failed');
  }
}
```

---

## 6. ⚡ Supabase Edge Functions

### Current Edge Functions

**Location:** `supabase/functions/`

**Existing Functions:**
1. `create-checkout-session/` - Stripe checkout
2. `create-portal-session/` - Stripe customer portal
3. `extract-contract-data-v2/` - PDF/DOCX text extraction
4. `extract-text/` - Text extraction (legacy?)
5. `fetch-exchange-rates/` - Currency exchange rates
6. `send-invitation-email/` - Email invitations via Resend
7. `stripe-webhook/` - Stripe webhook handler

**Shared Utilities:** `supabase/functions/_shared/`
- `supabase-admin.ts` - Admin client and helpers
- `resend-client.ts` - Email client
- `stripe-client.ts` - Stripe client
- `stripe-prices.ts` - Price configuration
- `email-templates.ts` - Email templates

### Auth Verification Function

**Status:** ❌ **DOES NOT EXIST**

**Need to Create:** `supabase/functions/verify-turnstile/`

### Recommended Function Structure

**File:** `supabase/functions/verify-turnstile/index.ts`

**Purpose:**
- Verify Turnstile token with Cloudflare API
- Use Secret Key from Supabase secrets
- Return success/error response

**Function Signature:**
```typescript
// Request
POST /functions/v1/verify-turnstile
Body: { token: string }

// Response (success)
{ success: true }

// Response (error)
{ error: string }
```

**Implementation Pattern:**
- Follow same pattern as `send-invitation-email`
- Use `corsHeaders` from `_shared/supabase-admin.ts`
- Call Cloudflare Turnstile API: `https://challenges.cloudflare.com/turnstile/v0/siteverify`
- Use `TURNSTILE_SECRET_KEY` from Deno.env

**No Authentication Required:**
- This function should be publicly accessible (no Authorization header)
- Token verification happens BEFORE user authentication
- Rate limiting should be handled by Cloudflare

---

## 7. 🔌 API Integration Points

### Current Edge Function Call Pattern

**Pattern Used Across Codebase:**

1. **Get Supabase URL:**
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
```

2. **Construct Function URL:**
```typescript
const functionUrl = `${supabaseUrl}/functions/v1/{function-name}`;
```

3. **Get Auth Token (if needed):**
```typescript
const { data: { session } } = await supabase.auth.getSession();
const authToken = session?.access_token;
```

4. **Make Fetch Request:**
```typescript
const response = await fetch(functionUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`, // If authenticated
    // 'apikey': supabaseAnonKey, // Sometimes included
  },
  body: JSON.stringify({ /* data */ }),
});
```

5. **Handle Response:**
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
  throw new Error(errorData.error || `HTTP error: ${response.status}`);
}

const data = await response.json();
```

### Examples from Codebase

**1. Exchange Rates Service** (`src/services/finance/exchangeRates.service.ts`)
- Line 90: Function URL construction
- Line 94-95: Session token retrieval
- Line 97-103: Headers with apikey and Authorization
- Line 109-113: Fetch call

**2. Stripe Checkout Service** (`src/services/stripeCheckout.service.ts`)
- Line 48: Function URL construction
- Line 41: Session refresh for fresh token
- Line 50-55: Headers with Authorization only
- Line 50-61: Fetch call

**3. Organization Service** (`src/services/organization.service.ts`)
- Line 168: Function URL construction
- Line 161: Session token retrieval
- Line 170-177: Fetch call with Authorization header

### Integration for Turnstile Verification

**Create Service Function:**

**File:** `src/services/turnstile.service.ts` (new file)

```typescript
/**
 * Turnstile Verification Service
 * Verifies Cloudflare Turnstile tokens via Supabase Edge Function
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

export interface VerifyTurnstileResponse {
  success: boolean;
  error?: string;
}

/**
 * Verify Turnstile token
 * Calls Edge Function which verifies token with Cloudflare API
 * 
 * @param token - Turnstile token from widget
 * @returns Promise<void> - Throws error if verification fails
 */
export async function verifyTurnstileToken(token: string): Promise<void> {
  if (!token) {
    throw new Error('Turnstile token is required');
  }

  const functionUrl = `${supabaseUrl}/functions/v1/verify-turnstile`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // No Authorization header - public endpoint
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Verification failed' }));
    throw new Error(errorData.error || `HTTP error: ${response.status}`);
  }

  const data: VerifyTurnstileResponse = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Turnstile verification failed');
  }
}
```

**Usage in AuthContext:**
```typescript
import { verifyTurnstileToken } from '../services/turnstile.service';

const signIn = useCallback(async (email: string, password: string, turnstileToken?: string) => {
  if (turnstileToken) {
    await verifyTurnstileToken(turnstileToken);
  }
  // ... rest of signIn logic
}, []);
```

---

## 8. 🎯 Integration Flow Summary

### Complete Flow Diagram

```
┌─────────────────┐
│  User Fills     │
│  Login/Register │
│  Form           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Clicks    │
│  Submit Button  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Turnstile      │
│  Widget Executes│
│  (Invisible)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Token Generated│
│  (Callback)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Component      │
│  Calls signIn() │
│  or signUp()    │
│  with token     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AuthContext    │
│  Calls          │
│  verifyTurnstile│
│  Token Service  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Service Calls  │
│  Edge Function  │
│  verify-turnstile│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Edge Function  │
│  Verifies Token │
│  with Cloudflare│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  If Valid:      │
│  Continue Auth  │
│  If Invalid:    │
│  Throw Error    │
└─────────────────┘
```

---

## 9. ⚠️ Potential Issues & Considerations

### 1. **Token Expiration**
- Turnstile tokens expire after 5 minutes
- **Solution:** Generate token right before form submission, not on page load

### 2. **Managed Mode Behavior**
- In managed mode, widget may not always execute automatically
- **Solution:** Use `turnstile.execute()` to manually trigger if needed

### 3. **Error Handling**
- What if Turnstile API is down?
- **Solution:** Consider fallback behavior or graceful degradation

### 4. **Rate Limiting**
- Edge Function should implement rate limiting
- **Solution:** Use Cloudflare's built-in rate limiting or Supabase Edge Function limits

### 5. **Google OAuth**
- Google sign-in bypasses Turnstile
- **Solution:** Consider adding Turnstile to OAuth flow or document that OAuth is trusted

### 6. **Development vs Production**
- Different Site Keys for dev/prod
- **Solution:** Use environment-specific keys in `.env` files

### 7. **TypeScript Types**
- Need to add Turnstile types
- **Solution:** Install `@types/cloudflare-turnstile` or create custom types

### 8. **Widget Reset**
- After failed login, widget needs reset
- **Solution:** Call `turnstile.reset()` on error

---

## 10. 📝 Implementation Checklist

### Phase 1: Environment Setup
- [ ] Add `VITE_TURNSTILE_SITE_KEY` to `.env`
- [ ] Verify `TURNSTILE_SECRET_KEY` is in Supabase secrets
- [ ] Add Turnstile script tag to `index.html`

### Phase 2: Edge Function
- [ ] Create `supabase/functions/verify-turnstile/index.ts`
- [ ] Implement Cloudflare API verification
- [ ] Add CORS headers
- [ ] Deploy function: `supabase functions deploy verify-turnstile`
- [ ] Test function with curl/Postman

### Phase 3: Frontend Service
- [ ] Create `src/services/turnstile.service.ts`
- [ ] Implement `verifyTurnstileToken()` function
- [ ] Add error handling

### Phase 4: AuthContext Updates
- [ ] Update `signIn()` signature to accept token
- [ ] Update `signUp()` signature to accept token
- [ ] Add token verification calls
- [ ] Update TypeScript interface

### Phase 5: Login Component
- [ ] Add Turnstile widget container
- [ ] Add token state management
- [ ] Add callback handler
- [ ] Update `onSubmit` to use token
- [ ] Add error handling for verification failures

### Phase 6: Register Component
- [ ] Add Turnstile widget container
- [ ] Add token state management
- [ ] Add callback handler
- [ ] Update `onSubmit` to use token
- [ ] Add error handling for verification failures

### Phase 7: Testing
- [ ] Test Login flow with valid token
- [ ] Test Login flow with invalid token
- [ ] Test Register flow with valid token
- [ ] Test Register flow with invalid token
- [ ] Test error scenarios
- [ ] Test widget reset on errors
- [ ] Test in development environment
- [ ] Test in production environment

---

## 11. 📚 References

### Cloudflare Turnstile Documentation
- [Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [Managed Mode](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Invisible Mode](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#invisible-mode)

### Supabase Edge Functions
- [Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Secrets Management](https://supabase.com/docs/guides/functions/secrets)

### Codebase Patterns
- Edge Function Pattern: `supabase/functions/send-invitation-email/index.ts`
- Service Pattern: `src/services/stripeCheckout.service.ts`
- Auth Pattern: `src/contexts/AuthContext.tsx`

---

## 12. 🎯 Next Steps

1. **Review this analysis** with the team
2. **Confirm integration approach** (managed vs invisible mode)
3. **Set up environment variables** (Site Key in `.env`, Secret Key verified in Supabase)
4. **Create Edge Function** following the pattern from existing functions
5. **Implement frontend integration** step by step
6. **Test thoroughly** in development before production deployment

---

**End of Analysis Report**
