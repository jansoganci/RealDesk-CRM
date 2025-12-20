# Cookie Consent Implementation Guide

## Overview

This document provides comprehensive documentation for the cookie consent implementation in the Emlak CRM application. The system ensures full compliance with GDPR, KVKK, and CCPA/CPRA regulations by providing granular consent management, script blocking, and consent logging.

## Architecture

The cookie consent system consists of several key components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Cookie Consent System                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   UI Layer   │───▶│  Hook Layer  │───▶│ Storage Layer│ │
│  │              │    │              │    │              │ │
│  │ CookieNotice │    │useCookieConsent│   │localStorage  │ │
│  │Preferences   │    │              │    │sessionStorage│ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                   │                    │           │
│         │                   │                    │           │
│         ▼                   ▼                    ▼           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ Script Loader│    │  GTM Consent│    │   Database   │ │
│  │              │    │     Mode     │    │   Logger     │ │
│  │ loadGTM()    │    │initGTMConsent│   │logConsentToDB│ │
│  │loadScript()  │    │updateGTMConsent│ │              │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **UI Components** (`src/components/ui/`)
   - `cookie-notice.tsx` - Initial consent banner
   - `cookie-preferences.tsx` - Preferences modal
   - `cookie-settings-link.tsx` - Footer link to open preferences

2. **React Hook** (`src/hooks/useCookieConsent.ts`)
   - Manages consent state
   - Handles banner visibility
   - Coordinates script loading/unloading
   - Logs consent decisions

3. **Storage Layer** (`src/lib/cookieConsent.ts`)
   - localStorage persistence
   - sessionStorage for session IDs
   - Consent retrieval and validation

4. **Script Loader** (`src/lib/scriptLoader.ts`)
   - Dynamic script loading based on consent
   - Script removal on consent withdrawal
   - Cookie and localStorage cleanup

5. **GTM Integration** (`src/lib/gtmConsent.ts`)
   - Consent Mode v2 initialization
   - Consent updates for GTM

6. **Database Logger** (`src/lib/consentLogger.ts`)
   - Logs consent decisions to Supabase
   - Fire-and-forget pattern
   - Retry logic with exponential backoff

## Setup Instructions

### Prerequisites

The cookie consent system requires:

- Supabase database with `consent_logs` table (migration already run)
- React i18n configured with `cookie` namespace
- GTM Consent Mode v2 initialization in `main.tsx`

### Database Migration

The database migration has already been run. The `consent_logs` table structure:

```sql
CREATE TABLE public.consent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL,
  version TEXT NOT NULL,
  categories JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  user_agent TEXT,
  language TEXT NOT NULL CHECK (language IN ('tr', 'en')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### i18n Configuration

The `cookie` namespace is already added to `src/i18n.ts`. Translation files:

- `public/locales/tr/cookie.json` - Turkish translations
- `public/locales/en/cookie.json` - English translations

### GTM Consent Mode Initialization

GTM Consent Mode v2 is initialized in `src/main.tsx` before React renders:

```typescript
import { initGTMConsentMode } from './lib/gtmConsent';

// Initialize GTM Consent Mode v2 BEFORE React renders
initGTMConsentMode();
```

### Component Integration

The `CookieNotice` component is already integrated in `src/App.tsx`:

```typescript
import CookieNotice from './components/ui/cookie-notice';

function App() {
  return (
    <BrowserRouter>
      <GTMPageViewTracker />
      <CookieNotice /> {/* Cookie banner appears on all pages */}
      <Routes>
        {/* ... routes ... */}
      </Routes>
    </BrowserRouter>
  );
}
```

## Configuration

### Cookie Definitions

Cookie definitions are managed in `src/lib/cookieConfig.ts`:

```typescript
export const cookieDefinitions: CookieDefinitions = {
  essential: [
    {
      name: 'auth_token',
      purpose: 'User authentication and session management',
      duration: '7 days',
      thirdParty: false,
    },
    // ... more essential cookies
  ],
  analytics: [
    {
      name: '_ga',
      purpose: 'Google Analytics tracking (via GTM) - distinguishes users',
      duration: '2 years',
      thirdParty: true,
      provider: 'Google',
    },
    // ... more analytics cookies
  ],
  marketing: [
    // Currently no marketing cookies
  ],
};
```

### GTM Container ID

The GTM container ID is configured in `src/lib/cookieConfig.ts`:

```typescript
export const GTM_CONTAINER_ID = 'GTM-WJW5DW9V';
```

### Consent Version

The consent version tracks breaking changes to the consent structure:

```typescript
export const CONSENT_VERSION = 'v1.0';
```

**Important:** Increment this version when making breaking changes to the consent structure (e.g., adding new categories, changing consent format).

### Adding New Cookies

To add a new cookie:

1. **Add to `cookieConfig.ts`:**

```typescript
export const cookieDefinitions: CookieDefinitions = {
  // ... existing cookies
  analytics: [
    // ... existing analytics cookies
    {
      name: 'new_cookie_name',
      purpose: 'Description of purpose',
      duration: '30 days',
      thirdParty: true,
      provider: 'Provider Name',
    },
  ],
};
```

2. **Update cookie policy pages** (`public/legal/cookie-policy-*.html`)
3. **Add cleanup logic** in `src/lib/scriptLoader.ts` if needed

### Adding New Categories

To add a new cookie category (e.g., "Functional"):

1. **Update `ConsentCategories` interface** in `src/types/cookieConsent.ts`:

```typescript
export interface ConsentCategories {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean; // New category
}
```

2. **Update `cookieConfig.ts`** to include the new category
3. **Update `useCookieConsent` hook** to handle the new category
4. **Update UI components** (`cookie-preferences.tsx`) to show the new category
5. **Update translations** (`public/locales/*/cookie.json`)
6. **Update database migration** if needed (categories are stored as JSONB)
7. **Increment `CONSENT_VERSION`** in `cookieConfig.ts`

### Updating Consent Version

When making breaking changes to the consent structure:

1. Update `CONSENT_VERSION` in `src/lib/cookieConfig.ts`:

```typescript
export const CONSENT_VERSION = 'v2.0'; // Incremented version
```

2. Consider migrating existing consent data (if needed)
3. Update documentation

## API/Hook Usage

### useCookieConsent Hook

The `useCookieConsent` hook provides all consent management functionality:

```typescript
import { useCookieConsent } from '@/hooks/useCookieConsent';

function MyComponent() {
  const {
    consent,           // Current consent state
    hasConsent,        // Check if user consented to a category
    acceptAll,         // Accept all cookies
    rejectAll,         // Reject all optional cookies
    updateConsent,     // Update specific categories
    withdrawConsent,   // Withdraw all consent
    showBanner,        // Whether to show initial banner
    showPreferences,   // Whether to show preferences modal
    openPreferences,   // Open preferences modal
    closePreferences,  // Close preferences modal
  } = useCookieConsent();

  // Check if user has analytics consent
  if (hasConsent('analytics')) {
    // Load analytics scripts
  }

  return (
    <div>
      <button onClick={acceptAll}>Accept All</button>
      <button onClick={rejectAll}>Reject All</button>
      <button onClick={openPreferences}>Manage Preferences</button>
    </div>
  );
}
```

### Hook API Reference

#### `consent: ConsentCategories`

Current consent state for all categories:

```typescript
{
  essential: true,    // Always true
  analytics: false,   // User's choice
  marketing: false,  // User's choice
}
```

#### `hasConsent(category: keyof ConsentCategories): boolean`

Check if user has consented to a specific category:

```typescript
if (hasConsent('analytics')) {
  // User has analytics consent
}
```

#### `acceptAll(): void`

Accept all cookie categories (essential, analytics, marketing):

```typescript
acceptAll();
// Sets: { essential: true, analytics: true, marketing: true }
// Loads GTM and other scripts
// Logs consent to database
// Hides banner
```

#### `rejectAll(): void`

Reject all optional cookies (keeps essential as true):

```typescript
rejectAll();
// Sets: { essential: true, analytics: false, marketing: false }
// Removes scripts and clears cookies
// Logs consent to database
// Hides banner
```

#### `updateConsent(categories: Partial<ConsentCategories>): void`

Update specific consent categories:

```typescript
updateConsent({
  analytics: true,
  marketing: false,
});
// Only updates specified categories
// Loads/removes scripts accordingly
// Logs consent to database
```

#### `withdrawConsent(): void`

Withdraw all consent and remove all scripts/cookies/data:

```typescript
withdrawConsent();
// Sets: { essential: true, analytics: false, marketing: false }
// Removes all scripts
// Clears all cookies and localStorage
// Updates GTM Consent Mode to 'denied'
// Logs withdrawal to database
// Shows success toast
```

#### `showBanner: boolean`

Whether to show the initial consent banner (true if no consent exists).

#### `showPreferences: boolean`

Whether the preferences modal is open.

#### `openPreferences(): void`

Open the preferences modal.

#### `closePreferences(): void`

Close the preferences modal.

### Usage Examples

#### Example 1: Conditional Script Loading

```typescript
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { loadScript } from '@/lib/scriptLoader';

function MyComponent() {
  const { hasConsent } = useCookieConsent();

  useEffect(() => {
    if (hasConsent('analytics')) {
      loadScript('https://example.com/analytics.js', 'analytics');
    }
  }, [hasConsent]);
}
```

#### Example 2: Conditional Feature Rendering

```typescript
import { useCookieConsent } from '@/hooks/useCookieConsent';

function AnalyticsDashboard() {
  const { hasConsent } = useCookieConsent();

  if (!hasConsent('analytics')) {
    return (
      <div>
        <p>Analytics features require consent.</p>
        <button onClick={openPreferences}>Manage Preferences</button>
      </div>
    );
  }

  return <AnalyticsChart />;
}
```

#### Example 3: Consent Withdrawal Button

```typescript
import { useCookieConsent } from '@/hooks/useCookieConsent';

function SettingsPage() {
  const { withdrawConsent } = useCookieConsent();

  return (
    <div>
      <h2>Privacy Settings</h2>
      <button onClick={withdrawConsent}>
        Withdraw All Cookie Consent
      </button>
    </div>
  );
}
```

## Script Loading Patterns

### Loading Scripts Conditionally

Use `loadScript()` or `loadGTM()` to load scripts only after consent:

```typescript
import { loadScript, loadGTM } from '@/lib/scriptLoader';
import { GTM_CONTAINER_ID } from '@/lib/cookieConfig';
import { hasConsent } from '@/lib/cookieConsent';

// Load generic script
if (hasConsent('analytics')) {
  loadScript('https://example.com/script.js', 'analytics');
}

// Load GTM
if (hasConsent('analytics')) {
  loadGTM(GTM_CONTAINER_ID);
}
```

### Script Cleanup

Scripts are automatically removed when consent is withdrawn. To manually clean up:

```typescript
import { cleanupCategory } from '@/lib/scriptLoader';

// Remove all analytics scripts, cookies, and localStorage data
cleanupCategory('analytics');
```

### Best Practices

1. **Always check consent before loading scripts:**

```typescript
// ✅ Good
if (hasConsent('analytics')) {
  loadScript('https://example.com/script.js', 'analytics');
}

// ❌ Bad - violates GDPR/KVKK
loadScript('https://example.com/script.js', 'analytics');
```

2. **Use the hook for React components:**

```typescript
// ✅ Good - uses hook
const { hasConsent } = useCookieConsent();
if (hasConsent('analytics')) {
  // Load script
}

// ❌ Bad - direct import bypasses React state
import { hasConsent } from '@/lib/cookieConsent';
```

3. **Mark scripts with `data-cookie-category`:**

All scripts loaded via `loadScript()` are automatically marked with `data-cookie-category` attribute for easy removal.

4. **Handle script loading errors gracefully:**

```typescript
try {
  const script = loadScript('https://example.com/script.js', 'analytics');
  if (!script) {
    console.warn('Script blocked: no consent');
  }
} catch (error) {
  console.error('Failed to load script:', error);
}
```

## GTM Integration

### Consent Mode v2

GTM Consent Mode v2 is initialized in `src/main.tsx` before React renders:

```typescript
import { initGTMConsentMode } from './lib/gtmConsent';

initGTMConsentMode();
```

This sets default consent to `denied` for all categories, ensuring no cookies are set until user explicitly consents.

### Consent Updates

Consent is automatically updated when user accepts/rejects cookies:

```typescript
import { updateGTMConsent } from '@/lib/gtmConsent';

// Called automatically by useCookieConsent hook
updateGTMConsent({
  analytics: true,   // 'granted' or 'denied'
  marketing: false,   // 'granted' or 'denied'
});
```

### Event Tracking with Consent Checks

All GTM event tracking functions check for consent before firing:

```typescript
import { trackEvent, trackPageView, trackLogin } from '@/utils/gtm';

// Automatically checks consent before firing
trackEvent('custom_event', { param: 'value' });
trackPageView('/dashboard', 'Dashboard');
trackLogin('email');
```

If analytics consent is not granted, events are blocked and a debug message is logged.

### Dynamic GTM Loading

GTM is loaded dynamically only after analytics consent:

```typescript
import { loadGTM } from '@/lib/scriptLoader';
import { GTM_CONTAINER_ID } from '@/lib/cookieConfig';

// Load GTM only if consent granted
if (hasConsent('analytics')) {
  loadGTM(GTM_CONTAINER_ID);
}
```

The `useCookieConsent` hook automatically loads GTM when analytics consent is granted.

### GTM Cookies

GTM-related cookies (stored in Analytics category):

- `_ga` - Google Analytics (2 years)
- `_gid` - Google Analytics (24 hours)
- `_gtm` - Google Tag Manager (Session)

These cookies are automatically cleared when analytics consent is withdrawn.

## Database Logging

### Consent Logs Table

Consent decisions are logged to the `consent_logs` table in Supabase:

```sql
SELECT * FROM consent_logs
WHERE user_id = 'user-uuid'
ORDER BY timestamp DESC;
```

### Logging Behavior

Consent logging uses a **fire-and-forget** pattern:

- Logging failures don't block the UI
- Errors are logged to console but don't throw
- Retry logic with exponential backoff handles transient failures

### Logging Events

Consent is logged in the following scenarios:

1. **Initial consent** (Accept All / Reject All)
2. **Preference updates** (via preferences modal)
3. **Consent withdrawal** (via `withdrawConsent()`)
4. **GPC signal detection** (automatic rejection)

### Querying Consent Logs

Example queries:

```sql
-- Get all consent decisions for a user
SELECT * FROM consent_logs
WHERE user_id = 'user-uuid'
ORDER BY timestamp DESC;

-- Get consent decisions by language
SELECT language, COUNT(*) as count
FROM consent_logs
GROUP BY language;

-- Get consent acceptance rate
SELECT 
  categories->>'analytics' as analytics_consent,
  COUNT(*) as count
FROM consent_logs
GROUP BY categories->>'analytics';
```

### Data Retention

Consent logs are retained for compliance purposes. Consider implementing:

- Auto-deletion after 5 years (GDPR requirement)
- Anonymization of old records
- Regular cleanup of orphaned records

## Troubleshooting

### Banner Not Appearing

**Symptoms:** Cookie banner doesn't show on first visit.

**Possible Causes:**

1. Consent already exists in localStorage
2. GPC signal detected (auto-rejected)
3. Component not rendered in App.tsx

**Solutions:**

1. Clear localStorage:
```javascript
localStorage.removeItem('cookie-consent');
```

2. Check browser console for GPC detection
3. Verify `CookieNotice` is imported and rendered in `App.tsx`

### Scripts Not Loading

**Symptoms:** GTM or other scripts don't load after consent.

**Possible Causes:**

1. Consent not properly saved
2. Script loader error
3. Network issues

**Solutions:**

1. Check consent in localStorage:
```javascript
console.log(localStorage.getItem('cookie-consent'));
```

2. Check browser console for script loader errors
3. Verify consent category matches script category:
```typescript
// Script category must match consent category
loadScript('https://example.com/script.js', 'analytics'); // ✅
loadScript('https://example.com/script.js', 'marketing'); // ❌ Wrong category
```

### Consent Not Persisting

**Symptoms:** Consent banner reappears on page refresh.

**Possible Causes:**

1. localStorage quota exceeded
2. localStorage disabled
3. Storage key mismatch

**Solutions:**

1. Check localStorage quota:
```javascript
// Check storage usage
const storage = localStorage.getItem('cookie-consent');
console.log('Storage size:', new Blob([storage]).size);
```

2. Check if localStorage is available:
```javascript
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('localStorage available');
} catch (e) {
  console.error('localStorage not available:', e);
}
```

3. Verify storage key matches:
```typescript
// Should be 'cookie-consent'
const CONSENT_STORAGE_KEY = 'cookie-consent';
```

### GTM Events Not Firing

**Symptoms:** GTM events don't appear in GTM debugger.

**Possible Causes:**

1. Analytics consent not granted
2. GTM not loaded
3. Consent Mode blocking events

**Solutions:**

1. Check consent:
```typescript
import { hasConsent } from '@/lib/cookieConsent';
console.log('Analytics consent:', hasConsent('analytics'));
```

2. Verify GTM is loaded:
```javascript
console.log('GTM loaded:', !!document.querySelector('script[src*="googletagmanager.com"]'));
```

3. Check Consent Mode state:
```javascript
// In browser console
window.dataLayer.filter(e => e.event === 'consent');
```

### Database Logging Failures

**Symptoms:** Consent decisions not appearing in database.

**Possible Causes:**

1. Database connection issues
2. RLS policies blocking inserts
3. Network errors

**Solutions:**

1. Check browser console for errors:
```javascript
// Look for: [ConsentLogger] Failed to log consent to database
```

2. Verify RLS policies allow inserts:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'consent_logs';
```

3. Test database connection:
```typescript
import { supabase } from '@/config/supabase';
const { data, error } = await supabase.from('consent_logs').select('count');
console.log('DB connection:', error ? 'Failed' : 'OK');
```

## FAQ

### General Questions

**Q: How do I test the cookie consent system?**

A: Clear localStorage and refresh the page:
```javascript
localStorage.removeItem('cookie-consent');
location.reload();
```

**Q: Can I customize the banner design?**

A: Yes, edit `src/components/ui/cookie-notice.tsx`. Ensure you maintain GDPR/KVKK compliance (equal button prominence, no dark patterns).

**Q: How do I add a new language?**

A: 
1. Add translation file: `public/locales/[lang]/cookie.json`
2. Update `src/i18n.ts` to include the language
3. Update database migration to allow the language in CHECK constraint

**Q: What happens if localStorage is disabled?**

A: The system gracefully degrades - consent won't persist, but the banner will still appear. Consider showing a warning to users.

### Compliance Questions

**Q: Is this GDPR compliant?**

A: Yes, the implementation follows GDPR requirements:
- Consent before loading scripts
- Granular consent categories
- Easy consent withdrawal
- Consent logging
- No dark patterns (equal button prominence)

**Q: Is this KVKK compliant?**

A: Yes, the implementation follows KVKK requirements:
- Explicit consent required
- KVKK Aydınlatma Metni linked (Turkish)
- Consent logging
- User rights respected

**Q: What about CCPA/CPRA?**

A: The system supports CCPA/CPRA requirements:
- Do Not Sell opt-out (via Reject All)
- Consent withdrawal mechanism
- Clear disclosure of cookies

**Q: Do I need to update the cookie policy?**

A: Yes, whenever you add new cookies or change cookie purposes, update:
- `src/lib/cookieConfig.ts`
- `public/legal/cookie-policy-tr.html`
- `public/legal/cookie-policy-en.html`

### Technical Questions

**Q: Can I use this with other analytics tools?**

A: Yes, add your analytics script to the appropriate category in `cookieConfig.ts` and use `loadScript()` to load it conditionally.

**Q: How do I handle server-side rendering (SSR)?**

A: The system checks for `typeof window === 'undefined'` and gracefully handles SSR. Consent is client-side only.

**Q: What about third-party cookies?**

A: Third-party cookies are marked in `cookieConfig.ts` with `thirdParty: true` and `provider` field. They're listed in the cookie policy.

**Q: How do I migrate existing users?**

A: Existing users without consent will see the banner on their next visit. No migration needed - the system handles it automatically.

**Q: Can I disable consent logging?**

A: Consent logging is required for compliance. However, you can modify `logConsentToDatabase()` to add additional filtering or anonymization.

## Additional Resources

- [GDPR Guidelines](https://gdpr.eu/)
- [KVKK Official Site](https://www.kvkk.gov.tr/)
- [Google Tag Manager Consent Mode v2](https://developers.google.com/tag-platform/devguides/consent)
- [Cookie Implementation Plan](./cookie-implementation-plan.md)
- [Cookie Consent Audit Report](./COOKIE_CONSENT_AUDIT_REPORT.md)

## Support

For questions or issues:

1. Check this documentation
2. Review the troubleshooting section
3. Check browser console for errors
4. Review the audit report for compliance notes

---

**Last Updated:** December 2025  
**Version:** 1.0



