# Cookie Consent Banner - Legal Compliance & Technical Requirements
## GDPR + KVKK + US Privacy Laws (2025)

---

## 🎯 PROJECT OVERVIEW

Build a React + TypeScript + Tailwind CSS cookie consent banner that is:
- Fully compliant with GDPR, KVKK, CCPA/CPRA
- Self-hosted (no third-party SaaS)
- Reusable across multiple projects
- Dark mode compatible
- Multi-language (TR + EN minimum)

---

## ✅ MANDATORY LEGAL REQUIREMENTS

### 1. Script Blocking (CRITICAL!)
- ⬜ **All non-essential scripts MUST be blocked until consent**
  - Google Analytics, Meta Pixel, Hotjar, Mixpanel, etc.
  - Scripts load ONLY after user clicks "Accept"
  - Implementation: Dynamic script injection after consent
  
```typescript
// Example structure
const loadScript = (src: string, category: 'analytics' | 'marketing') => {
  if (!hasConsent(category)) return;
  const script = document.createElement('script');
  script.src = src;
  script.setAttribute('data-cookie-category', category);
  document.head.appendChild(script);
};
```

### 1.1. GTM (Google Tag Manager) Handling – Required

⬜ **Remove GTM from index.html (CRITICAL)**

Hardcoded GTM in index.html is a GDPR/KVKK violation.

- GTM script MUST be removed from `index.html` `<head>` section
- GTM noscript fallback MUST be removed from `<body>` section
- GTM container ID (e.g., `GTM-WJW5DW9V`) must NOT be hardcoded in HTML

⬜ **GTM Consent Mode v2 (Mandatory)**

GTM requires Consent Mode v2 implementation before any script loads:

```typescript
// Initialize dataLayer and set default consent to denied
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// Set default consent state (BEFORE GTM loads)
gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied',
  'wait_for_update': 500
});
```

⬜ **Update consent mode on user action**

When user accepts/rejects, update GTM consent:

```typescript
// On Accept All
gtag('consent', 'update', {
  'analytics_storage': 'granted',
  'ad_storage': 'granted'
});

// On Reject All
gtag('consent', 'update', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied'
});

// On Custom Preferences
gtag('consent', 'update', {
  'analytics_storage': hasConsent('analytics') ? 'granted' : 'denied',
  'ad_storage': hasConsent('marketing') ? 'granted' : 'denied'
});
```

⬜ **Dynamic GTM loading after consent**

GTM script loads ONLY if analytics consent is granted:

```typescript
const loadGTM = (containerId: string) => {
  if (!hasConsent('analytics')) return;
  
  // Ensure dataLayer exists
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js'
  });
  
  // Load GTM script dynamically
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  script.async = true;
  script.setAttribute('data-cookie-category', 'analytics');
  document.head.appendChild(script);
  
  // Load noscript fallback
  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${containerId}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
};
```

⬜ **GTM utilities must check consent**

Existing `gtm.ts` utilities MUST check consent before firing events:

```typescript
// Example: Update trackEvent to check consent
export function trackEvent(eventName: string, params?: GTMEventParams): void {
  if (!hasConsent('analytics')) {
    console.debug('GTM event blocked: no analytics consent', eventName);
    return;
  }
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params,
  });
}
```

⬜ **GTM cookies category**

GTM cookies belong to Analytics category:
- `_ga`, `_gid` (Google Analytics via GTM)
- `_gtm` (Google Tag Manager)
- All GTM-related cookies are Analytics cookies (opt-in required)

### 2. Granular Consent Categories
- ⬜ **Essential cookies** (always on, no toggle)
  - Session management, security, load balancing
  - Example: auth tokens, CSRF tokens
  
- ⬜ **Analytics cookies** (opt-in required)
  - Google Tag Manager (GTM), Google Analytics, Plausible, Mixpanel
  - Usage tracking, performance monitoring
  - GTM cookies: `_ga`, `_gid`, `_gtm`
  
- ⬜ **Marketing cookies** (opt-in required)
  - Meta Pixel, Google Ads, retargeting pixels
  - Personalized ads, conversion tracking

### 3. Button Equality (Anti-Dark Pattern)
- ⬜ **"Accept All" and "Reject All" MUST be equal**
  - Same size, same visual weight
  - Same color prominence (no green Accept + gray Reject)
  - Same accessibility (no hidden Reject)
  - No multi-step for Reject (single click)

```tsx
// Good example - Equal buttons
<div className="flex gap-4">
  <Button variant="outline" size="lg" onClick={handleRejectAll}>
    Reject All
  </Button>
  <Button variant="default" size="lg" onClick={handleAcceptAll}>
    Accept All
  </Button>
</div>

// BAD example - DO NOT DO THIS
<div className="flex gap-4">
  <Button variant="ghost" size="sm" onClick={handleRejectAll}>
    Reject
  </Button>
  <Button variant="default" size="lg" onClick={handleAcceptAll}>
    Accept All Cookies
  </Button>
</div>
```

### 4. Consent Logging (DB Required)

⬜ Store consent records for 5 years minimum

localStorage alone is NOT sufficient

Must persist to database (Supabase recommended)

```typescript
interface ConsentRecord {
  id: string;
  timestamp: Date;
  version: string; // "v1.0"
  categories: {
    essential: boolean; // always true
    analytics: boolean;
    marketing: boolean;
  };
  userId?: string; // if authenticated
  sessionId: string;
  userAgent: string;
  ipAddress?: string; // optional, privacy concern
  language: string; // "tr" | "en"
  changeHistory?: ConsentRecord[]; // track changes
}
```

⬜ **API endpoint for consent logging**

```json
POST /api/consent
{
  "timestamp": "2025-12-18T10:19:00Z",
  "version": "v1.0",
  "categories": { "analytics": true, "marketing": false },
  "sessionId": "abc123",
  "language": "tr"
}
```

### 5. Cookie Policy Documentation

⬜ Separate Cookie Policy page (not just Privacy Policy)

List ALL cookies used

Table format: Name | Purpose | Duration | Type | Third Party

Update when adding new cookies

⬜ Link in banner: "Learn more about cookies"

⬜ Link in footer: "Cookie Policy"

6. Consent Withdrawal (Easy Access)

⬜ Footer link: "Cookie Settings"

Must be visible on every page

Single click to open preferences modal

Direct category toggles (no multi-step)

⬜ Preferences modal

Same UI as initial banner

Show current selections

Save button applies immediately

⬜ **Consent withdrawal script removal (CRITICAL)**

When user withdraws consent, scripts MUST be removed:

```typescript
// Remove script tags
document.querySelectorAll('script[data-cookie-category]').forEach(script => {
  script.remove();
});

// Clear third-party cookies
const clearCookie = (name: string, domain?: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${domain ? ` domain=${domain};` : ''}`;
};

// Stop Google Analytics
if (window.gtag) {
  window.gtag('consent', 'update', {
    analytics_storage: 'denied',
    ad_storage: 'denied'
  });
}

// Clear localStorage analytics data
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('_ga') || key.startsWith('_gid') || key.startsWith('_fbp')) {
    localStorage.removeItem(key);
  }
});
```

### 7. No Implicit Consent

⬜ Scrolling ≠ consent (PROHIBITED)

⬜ Timeout ≠ consent (PROHIBITED)

⬜ Page navigation ≠ consent (PROHIBITED)

⬜ Only explicit button click = consent

8. No Cookie Walls

⬜ Site MUST work with all cookies rejected

Basic functionality accessible

Content not gated behind consent

No "Accept or leave" messaging

9. GPC (Global Privacy Control) Support

⬜ Respect browser GPC signal

```typescript
if (navigator.globalPrivacyControl) {
  // Automatically reject non-essential cookies
  setConsent({ analytics: false, marketing: false });
}
```

### 10. Multi-Language Support (i18n Integration)

⬜ Turkish (KVKK compliance)

KVKK Aydınlatma Metni link

Turkish cookie descriptions

⬜ English (GDPR compliance)

Privacy Policy link

English cookie descriptions

⬜ **Use existing react-i18next infrastructure**

Integration with app's i18n system:

```typescript
import { useTranslation } from 'react-i18next';

// In components
const { t, i18n } = useTranslation('cookie');

// Language detection
const currentLanguage = i18n.language; // 'tr' | 'en'
```

⬜ **Translation namespace structure**

Create new namespace: `cookie`

Files: `public/locales/{tr|en}/cookie.json`

```json
{
  "banner": {
    "title": "Çerezler Hakkında",
    "description": "Deneyiminizi iyileştirmek için çerezler kullanıyoruz.",
    "essentialInfo": "Temel çerezler her zaman aktiftir.",
    "optionalInfo": "İsteğe bağlı çerezler hizmetimizi geliştirmemize yardımcı olur.",
    "acceptAll": "Tümünü Kabul Et",
    "rejectAll": "Tümünü Reddet",
    "customize": "Özelleştir",
    "learnMore": "Çerezler hakkında daha fazla bilgi"
  },
  "preferences": {
    "title": "Çerez Tercihleri",
    "essential": {
      "title": "Temel Çerezler (Her Zaman Aktif)",
      "description": "Site işlevselliği, güvenlik ve kimlik doğrulama için gereklidir."
    },
    "analytics": {
      "title": "Analitik Çerezler",
      "description": "Ziyaretçilerin sitemizi nasıl kullandığını anlamamıza yardımcı olur."
    },
    "marketing": {
      "title": "Pazarlama Çerezleri",
      "description": "Kişiselleştirilmiş reklamlar ve yeniden hedefleme için kullanılır."
    },
    "save": "Tercihleri Kaydet",
    "cancel": "İptal",
    "saved": "Tercihler kaydedildi. Analitik çerezler devre dışı bırakıldı."
  },
  "footer": {
    "cookieSettings": "Çerez Ayarları"
  }
}
```

⬜ **Auto-detect language**

Use existing i18next LanguageDetector (already configured):

```typescript
// Language is automatically detected by i18next-browser-languagedetector
// Fallback to 'tr' (matches app's fallbackLng)
const language = i18n.language || 'tr';
```

### 11. KVKK-Specific Requirements

⬜ **"KVKK Aydınlatma Metni" link (separate from Privacy Policy)**

Link placement:
- In banner (Turkish version only): "KVKK Aydınlatma Metni" link
- In footer: Add alongside "Cookie Settings" and "Privacy Policy"
- Link format: `/legal/kvkk-aydinlatma-metni-tr.html` or integrate into Privacy Policy
- If integrated: Link to Privacy Policy with anchor `#kvkk-aydinlatma`

⬜ **Explicit Turkish text (mandatory)**

Display prominently in Turkish version only:
- Banner text: "Açık rızanız olmadan çerezler kullanılmayacaktır"
- Must be visible, not hidden in small print
- Place near consent buttons

⬜ **Hassas veri uyarısı yok ise: Standard consent flow**

If no sensitive data processing: Standard consent flow is sufficient

🚫 PROHIBITED (DO NOT IMPLEMENT)
Dark Patterns (Heavy Fines in 2025)

❌ Different button sizes (Accept big, Reject small)
❌ Different button colors (Accept green, Reject gray)
❌ Hidden Reject button (collapsed, small text)
❌ Multi-step Reject (Preferences > Categories > Save > Confirm)
❌ Pre-checked boxes (except Essential)
❌ Fear language ("Site won't work if you reject")
❌ Cookie walls ("Accept or leave")
❌ Scrolling implies consent
❌ Auto-accept after timeout
❌ Nudging ("99% of users accept")
❌ Analytics as "Essential" (only auth/security is essential)
❌ Legitimate interest for analytics (requires explicit consent)

🎨 UI/UX REQUIREMENTS

### Brand Color Specifications

⬜ **Primary actions (Accept All, Save Preferences)**
  - Background: `bg-blue-600` (#2563EB) - matches app primary color
  - Hover: `hover:bg-blue-700`
  - Text: `text-white`
  - Shadow: `shadow-blue-600/30`

⬜ **Secondary actions (Reject All, Cancel)**
  - Background: `bg-white` or `bg-gray-100`
  - Border: `border-gray-300`
  - Text: `text-gray-900`
  - Hover: `hover:bg-gray-50`

⬜ **Equal button styling (anti-dark pattern)**
  - Both buttons: Same size (`size="lg"`), same padding, same font weight
  - Use `variant="outline"` for Reject, `variant="default"` for Accept
  - Both use `blue-600` for primary state (no green/gray distinction)
  - Same visual weight and prominence

⬜ **Accent colors (optional, use sparingly)**
  - Success indicators: `emerald-600` (#059669) - matches app secondary
  - Warning/Info: `orange-500` (#F97316) - matches app accent (only if needed)

⬜ **Dark mode support**
  - Respect `prefers-color-scheme` or app's theme system
  - Use CSS variables from `src/index.css` dark mode tokens
  - Test contrast in both light and dark modes

### Brand Language & Tone

⬜ **Messaging style (match app's professional tone)**
  - Clear, direct, no jargon
  - Professional but friendly
  - Turkish: Warm, respectful ("Açık rızanız olmadan...")
  - English: Professional, transparent

⬜ **Banner text examples**

Turkish:
```
Deneyiminizi iyileştirmek için çerezler kullanıyoruz.
Temel çerezler her zaman aktiftir. İsteğe bağlı çerezler hizmetimizi geliştirmemize yardımcı olur.
Açık rızanız olmadan çerezler kullanılmayacaktır.
```

English:
```
We use cookies to enhance your experience.
Essential cookies are always active. Optional cookies help us improve our service.
```

⬜ **Button labels**

Turkish:
- "Tümünü Kabul Et" | "Tümünü Reddet" | "Özelleştir"
- "Tercihleri Kaydet" | "İptal"

English:
- "Accept All" | "Reject All" | "Customize"
- "Save Preferences" | "Cancel"

### Banner Position

⬜ Bottom-center or center modal (most common)

⬜ Non-intrusive but visible

⬜ Responsive on mobile

**Banner Content (Minimal)**

```
We use cookies to enhance your experience.
Essential cookies are always active. Optional cookies help us improve our service.

[Cookie Policy] [Privacy Policy] [KVKK Aydınlatma Metni] (TR only)

[Reject All] [Customize] [Accept All]
```

**Preferences Modal (Detailed)**

```
Cookie Preferences

Essential Cookies (Always Active)
Required for site functionality, security, and authentication.

○ Analytics Cookies
Help us understand how visitors use our site.
[Toggle]

○ Marketing Cookies  
Used for personalized advertising and retargeting.
[Toggle]

[Cancel] [Save Preferences]
```

**Footer Persistent Link**

```
Footer: [...] | Cookie Settings | Privacy Policy | Cookie Policy | KVKK Aydınlatma Metni (TR only) | [...]
```
🔧 TECHNICAL IMPLEMENTATION
Tech Stack

React 18+ with TypeScript

Tailwind CSS for styling

Zustand or Context API for state management

localStorage for client-side persistence

API endpoint for server-side logging (Supabase)

### API Route Implementation (Vite + React Router)

⬜ **Implementation options for Vite app**

Option A: Supabase Edge Function (Recommended)
```typescript
// Supabase Edge Function: supabase/functions/consent/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { timestamp, version, categories, sessionId, userAgent, language } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  const { error } = await supabase
    .from('consent_logs')
    .insert({
      timestamp,
      version,
      categories,
      session_id: sessionId,
      user_agent: userAgent,
      language
    });
  
  return new Response(JSON.stringify({ success: !error }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

Option B: Direct Supabase Client Call
```typescript
// In component/hook
import { supabase } from '@/lib/supabase';

const logConsent = async (consent: ConsentRecord) => {
  const { error } = await supabase
    .from('consent_logs')
    .insert({
      timestamp: consent.timestamp,
      version: consent.version,
      categories: consent.categories,
      session_id: consent.sessionId,
      user_agent: consent.userAgent,
      language: consent.language,
      user_id: consent.userId || null
    });
  
  if (error) console.error('Consent logging failed:', error);
};
```

⬜ **Database table structure (Supabase)**

```sql
CREATE TABLE consent_logs (
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

-- Index for queries
CREATE INDEX idx_consent_logs_user_id ON consent_logs(user_id);
CREATE INDEX idx_consent_logs_session_id ON consent_logs(session_id);
CREATE INDEX idx_consent_logs_timestamp ON consent_logs(timestamp);

-- Enable RLS (Row Level Security)
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own consent logs
CREATE POLICY "Users can view own consent logs"
  ON consent_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Anyone can insert (for anonymous users)
CREATE POLICY "Anyone can insert consent logs"
  ON consent_logs FOR INSERT
  WITH CHECK (true);
```

### File Structure

```
/components/CookieConsent
  ├── CookieBanner.tsx         # Initial banner
  ├── CookiePreferences.tsx    # Settings modal
  ├── CookieSettings.tsx       # Footer trigger button
  ├── useCookieConsent.tsx     # Hook for state management
  └── cookieConfig.ts          # Cookie definitions

/lib
  ├── cookieConsent.ts         # Core logic
  └── scriptLoader.ts          # Dynamic script injection

/lib
  ├── cookieConsent.ts         # Core logic
  └── scriptLoader.ts          # Dynamic script injection

# Note: API route depends on chosen implementation
# Option A: supabase/functions/consent/index.ts (Edge Function)
# Option B: Direct Supabase client call (no separate route needed)
```

### Core Hook API

```typescript
const {
  consent,              // { analytics: boolean, marketing: boolean }
  hasConsent,           // (category: string) => boolean
  acceptAll,            // () => void
  rejectAll,            // () => void
  updateConsent,        // (categories) => void
  showBanner,           // boolean
  showPreferences,      // boolean
  openPreferences,      // () => void
  closePreferences,     // () => void
} = useCookieConsent();
```

### Script Loading Example

```typescript
// GTM loading (analytics category)
useEffect(() => {
  if (hasConsent('analytics')) {
    loadGTM('GTM-WJW5DW9V'); // Container ID from config
  }
}, [consent.analytics]);

// Google Analytics (if used separately)
useEffect(() => {
  if (hasConsent('analytics')) {
    loadGoogleAnalytics('G-XXXXXXXXXX');
  }
}, [consent.analytics]);

// Marketing scripts
useEffect(() => {
  if (hasConsent('marketing')) {
    loadMetaPixel('123456789');
  }
}, [consent.marketing]);
```

### Consent Persistence

```typescript
// 1. Save to localStorage (immediate)
localStorage.setItem('cookie-consent', JSON.stringify({
  version: 'v1.0',
  timestamp: new Date().toISOString(),
  categories: consent
}));

// 2. Save to database (durable)
await fetch('/api/consent', {
  method: 'POST',
  body: JSON.stringify({
    timestamp: new Date(),
    version: 'v1.0',
    categories: consent,
    sessionId: getSessionId(),
    language: getCurrentLanguage()
  })
});
```

### Integration with Existing Legal Documents

⬜ **Link to existing cookie policy**
  - Banner link: `/legal/cookie-policy-${i18n.language}.html`
  - Footer link: Already exists in `LegalDocumentsCard` component
  - Use `i18n.language` from react-i18next

⬜ **Privacy Policy link**
  - Banner: `/legal/privacy-policy-${i18n.language}.html`
  - Footer: Already exists in `LegalDocumentsCard` component

⬜ **KVKK Aydınlatma Metni**
  - Check if separate page needed or integrated into Privacy Policy
  - If separate: `/legal/kvkk-aydinlatma-metni-tr.html`
  - If integrated: Link to Privacy Policy with anchor `#kvkk-aydinlatma`
  - Display only in Turkish version (`i18n.language === 'tr'`)

⬜ **Footer integration**
  - Add "Cookie Settings" link to existing footer components
  - Match styling with existing footer links
  - Use same color scheme (blue-600 for links)

🧪 TESTING CHECKLIST
Functional Tests

⬜ Banner appears on first visit

⬜ Banner does NOT appear after consent given

⬜ "Accept All" enables all categories

⬜ "Reject All" disables optional categories

⬜ Custom preferences save correctly

⬜ Scripts load ONLY after consent

⬜ Scripts do NOT load if rejected

⬜ GTM does NOT load from index.html (removed)

⬜ GTM loads dynamically only after analytics consent

⬜ GTM Consent Mode v2 default state is 'denied'

⬜ GTM consent updates correctly on Accept/Reject

⬜ GTM events blocked when consent withdrawn

⬜ "Cookie Settings" reopens preferences

⬜ Preferences persist across sessions

⬜ Language switches correctly

Compliance Tests

⬜ Buttons are visually equal

⬜ No pre-checked boxes (except Essential)

⬜ Scrolling does NOT trigger consent

⬜ Timeout does NOT trigger consent

⬜ Consent logged to database

⬜ Consent record includes timestamp + version

⬜ GPC signal respected

⬜ Site works with all cookies rejected

⬜ Cookie Policy linked correctly

⬜ KVKK Aydınlatma Metni linked (Turkish)

Cross-Browser Tests

⬜ Chrome/Edge (Chromium)

⬜ Firefox

⬜ Safari (iOS + macOS)

⬜ Mobile browsers

Accessibility Tests

⬜ Keyboard navigation (Tab, Enter, Escape)

⬜ Screen reader compatible (ARIA labels)

⬜ Focus visible

⬜ Color contrast (WCAG AA)

📦 DELIVERABLES
React Components

<CookieBanner />

<CookiePreferences />

<CookieSettings /> (footer button)

Hook

useCookieConsent() - state management

API Route

POST /api/consent - logging endpoint

Documentation

README.md with setup instructions

Cookie Policy template (TR + EN)

KVKK Aydınlatma Metni template (TR)

Configuration File

cookieConfig.ts - define all cookies used

🌍 COOKIE DEFINITIONS (Example)

```typescript
export const cookieDefinitions = {
  essential: [
    {
      name: 'auth_token',
      purpose: 'User authentication',
      duration: '7 days',
      thirdParty: false
    },
    {
      name: 'csrf_token',
      purpose: 'Security protection',
      duration: 'Session',
      thirdParty: false
    }
  ],
  analytics: [
    {
      name: '_ga',
      purpose: 'Google Analytics tracking (via GTM)',
      duration: '2 years',
      thirdParty: true,
      provider: 'Google'
    },
    {
      name: '_gid',
      purpose: 'Google Analytics tracking (via GTM)',
      duration: '24 hours',
      thirdParty: true,
      provider: 'Google'
    },
    {
      name: '_gtm',
      purpose: 'Google Tag Manager container',
      duration: 'Session',
      thirdParty: true,
      provider: 'Google'
    }
  ],
  marketing: [
    {
      name: '_fbp',
      purpose: 'Facebook Pixel tracking',
      duration: '90 days',
      thirdParty: true,
      provider: 'Meta'
    }
  ]
};
```

🔒 PRIVACY CONSIDERATIONS
⬜ Minimize data collection: Don't log IP unless necessary

⬜ Anonymize user data: Use session IDs, not personal identifiers

⬜ Encrypt consent logs: Database encryption at rest

⬜ Data retention: Auto-delete logs after 5 years

⬜ GDPR Article 30: Maintain processing records

📚 LEGAL REFERENCES
GDPR: Article 6(1)(a), Article 7, Recital 32

KVKK: Madde 3, Madde 5, Madde 11

ePrivacy Directive: Article 5(3)

CCPA/CPRA: Section 1798.140

EDPB Guidelines 05/2020: Consent validity

Swedish DPA 2025 rulings: Dark pattern enforcement

🚀 IMPLEMENTATION PRIORITY
Phase 1: Core Functionality (MVP)

Banner UI component

Accept/Reject logic

localStorage persistence

Script blocking (GA, Meta Pixel)

Phase 2: Compliance Features

Database logging API (Supabase Edge Function or direct client)

Preferences modal

Footer settings link

Multi-language support (i18next integration)

KVKK Aydınlatma Metni link

Phase 3: Advanced Features

GPC support

Consent history tracking

Analytics on consent rates

Region-based display

✨ BONUS FEATURES (Optional)
⬜ A/B testing consent UI (measure acceptance rates)

⬜ Cookie scanner: Auto-detect cookies used on site

⬜ Consent dashboard: View acceptance rates over time

⬜ Export consent logs: CSV download for audits

⬜ Webhook support: Notify on consent changes

🎯 SUCCESS CRITERIA
✅ Passes all 11 mandatory legal requirements
✅ Zero dark patterns detected
✅ 100% accessibility (WCAG AA)
✅ Works offline (localStorage fallback)
✅ Reusable across projects (NPM package ready)
✅ Performance: < 5KB gzipped bundle size
✅ No external dependencies (except React/Tailwind)

📝 NOTES FOR IMPLEMENTATION

**Code Quality**
- Use TypeScript strict mode
- Follow React best practices (hooks, composition)
- Use Tailwind utility classes (no custom CSS)
- Reference `src/config/colors.ts` for color system

**Design System Integration**
- Use existing color tokens: `blue-600` primary, `emerald-600` secondary, `orange-500` accent
- Match app's button component styles from `@/components/ui/button`
- Use Inter font (already configured in app)
- Dark mode: Use CSS variables from `src/index.css` dark mode tokens

**i18n Integration**
- Use existing `react-i18next` setup (already configured)
- Create new namespace: `cookie` in `public/locales/{tr|en}/cookie.json`
- Use `useTranslation('cookie')` hook
- Language detection: Use existing `i18next-browser-languagedetector`

**Responsive Design**
- Mobile-first responsive design
- Test on real devices (not just DevTools)
- Banner should not block critical UI on mobile

**Edge Cases**
- VPN users (geolocation may be inaccurate)
- Ad blockers (scripts may not load even with consent)
- Incognito mode (localStorage may be restricted)
- Users with JavaScript disabled (graceful degradation)

**Performance**
- Lazy load consent components
- Minimize bundle size (< 5KB gzipped)
- No external dependencies (except React/Tailwind)

Document Version: v1.0
Last Updated: December 18, 2025
Compliance Standard: GDPR + KVKK + CCPA/CPRA (2025)