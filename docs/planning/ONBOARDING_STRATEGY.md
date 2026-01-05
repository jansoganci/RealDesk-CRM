# User Onboarding Strategy for Emlak CRM

**Date:** 2025-01-04  
**Status:** Planning  
**Target:** Turkish Real Estate CRM Market

---

## Part 1: Research & Strategy

### 1.1 Best Practices Analysis

#### Optimal Number of Steps
**Recommendation: 3-4 steps (under 2 minutes)**

Research shows:
- **3-4 steps** = optimal balance (completion rate ~70-80%)
- **5+ steps** = drop-off increases significantly
- **1-2 steps** = insufficient data for personalization

**For Emlak CRM:** We recommend **3 steps** (90-150 seconds):
1. Welcome + Goal Selection (30s)
2. Organization Setup + Preferences (45-60s) 
3. Quick Start Action (30-60s)

#### Time to Aha Moment
**Target: < 5 minutes from signup**

For a CRM, the "aha moment" is when users:
- See their first property/tenant/contract in the system
- Understand how the app saves them time
- Realize they can track everything in one place

**Strategy:** Guide users to add their first property DURING onboarding (not after).

#### Progressive Profiling vs. Upfront Questions

**Recommendation: Hybrid Approach**
- **Onboarding (must-have):** Organization name, primary goal, quick start action
- **Progressive (nice-to-have):** Team size, property count, deal volume (ask later via in-app prompts)

**Why:** Reduces friction while still collecting valuable segmentation data.

---

### 1.2 User Personas for Turkish Real Estate Market

#### Persona 1: Solo Real Estate Agent (Broker)
**Profile:**
- Individual broker working independently
- Manages 5-20 properties
- Uses Excel/WhatsApp/paper notes currently
- Primary need: Organization and time-saving

**Identifying Questions:**
- "How many properties do you manage?" → 1-20
- "Do you work with a team?" → No
- "What's your biggest challenge?" → "Keeping track of everything"

**Onboarding Path:** Quick setup → Add first property → Show contract creation

---

#### Persona 2: Small Agency (2-5 Agents)
**Profile:**
- Small real estate office
- 20-100 properties
- Owner + 2-4 agents
- Primary need: Team collaboration + client tracking

**Identifying Questions:**
- "How many properties do you manage?" → 20-100
- "Do you work with a team?" → Yes, 2-5 people
- "What's your biggest challenge?" → "Team coordination" or "Client follow-up"

**Onboarding Path:** Team setup → Invite members → Show shared dashboard

---

#### Persona 3: Medium Agency (5+ Agents)
**Profile:**
- Established agency
- 100+ properties
- Multiple locations/branches
- Primary need: Scalability, reporting, automation

**Identifying Questions:**
- "How many properties do you manage?" → 100+
- "Do you work with a team?" → Yes, 5+ people
- "What's your biggest challenge?" → "Reporting" or "Process automation"

**Onboarding Path:** Advanced features tour → Bulk import → Analytics setup

---

### 1.3 Data Collection Strategy

#### Critical for Onboarding (Must Have)

| Data Point | Why We Need It | How We Use It |
|------------|----------------|---------------|
| **Organization name** | Already collected ✓ | Display, personalization |
| **Primary use case** | Segment users, personalize experience | Show relevant features first |
| **Team size** | Determine collaboration features to highlight | Enable/disable team features |
| **Language preference** | User-level UI language | Show onboarding/app in user's preferred language |
| **Currency preference** | User-level currency display | Show all prices in user's preferred currency |
| **Quick start action** | Get user to "aha moment" fast | Guide to first property/contract |

#### Nice to Have (Progressive Profiling)

| Data Point | When to Ask | How to Collect |
|------------|-------------|----------------|
| **Number of properties** | After first property added | In-app prompt: "How many properties do you manage?" |
| **Average deal volume** | After first contract | Finance section: "What's your monthly rental income?" |
| **Current tools** | Exit survey or support chat | "What tools did you use before?" |
| **Geographic market** | Inferred from property addresses | Auto-detect from first property |
| **Years in business** | Profile completion | Optional profile field |

---

## Part 2: Onboarding Flow Design

### 2.1 Recommended 3-Step Flow

#### Step 1: Welcome + Goal Selection
**Time:** 30 seconds  
**Skip Allowed:** Yes (but show reminder in dashboard)

**Questions:**
```
"What brings you to Emlak CRM today?" (Single choice, required)

[ ] Organize my property listings
[ ] Track client relationships (tenants/owners)
[ ] Manage contracts and documents
[ ] Team collaboration and reporting
[ ] All of the above
```

**Why:** 
- User benefit: Personalizes the experience
- Analytics: Segments users for feature prioritization

**UI Pattern:** Radio buttons with icons, large touch targets (mobile-friendly)

**Next Step Logic:**
- If "Organize properties" → Show property-focused tour
- If "Track clients" → Show tenant/owner management
- If "Contracts" → Show contract builder
- If "Team" → Show collaboration features
- If "All" → Show general dashboard tour

---

#### Step 2: Organization Setup + Preferences
**Time:** 45-60 seconds  
**Skip Allowed:** No (required for multi-tenant)

**Required Section: Organization Information**
```
"Let's set up your organization" (Pre-filled from signup, editable)

Organization Name: [Jans Emlak] (editable)
Team Size: (Single choice, required)
  [ ] Just me (solo agent)
  [ ] 2-5 people (small team)
  [ ] 6-20 people (medium team)
  [ ] 20+ people (large agency)
```

**Optional Section: Preferences (Tercihler)**
```
"Preferences (Optional)"
"Bu ayarları daha sonra profil sayfasından değiştirebilirsiniz"

Language: "Interface Language" / "Arayüz Dili"
  [Dropdown: Turkish (Türkçe) - selected by default | English]

Currency: "Currency" / "Para Birimi"
  [Dropdown: TRY - Turkish Lira (Türk Lirası) - selected by default | USD - US Dollar | EUR - Euro]
```

**Why:**
- User benefit: Ensures correct org name, enables team features, sets UI language/currency immediately
- Analytics: Team size = pricing tier recommendation, feature usage prediction
- Language/Currency: Allows English speakers to switch UI immediately, sets currency for all financial displays

**UI Pattern:** 
- Text input + radio buttons (required section)
- Optional section: Two dropdowns with subtle styling (lighter background/border)
- Pre-filled defaults: Turkish language, TRY currency
- Helper text: "You can change these later in profile settings"

**Note:** 
- Organization name is already set (from signup trigger), but allow editing here
- Language/currency preferences are saved to `user_preferences` table (user-level, not org-level)
- No database migration needed - uses existing `user_preferences` table

---

#### Step 3: Quick Start Action
**Time:** 30-60 seconds  
**Skip Allowed:** Yes (but show CTA in dashboard)

**Options (based on Step 1 selection):**

**If "Organize properties":**
```
"Add your first property to get started"
[Skip for now] [Add Property] → Navigate to /properties/new
```

**If "Track clients":**
```
"Add your first tenant or owner"
[Skip for now] [Add Tenant] [Add Owner] → Navigate to respective form
```

**If "Contracts":**
```
"Create your first contract"
[Skip for now] [Create Contract] → Navigate to /contracts/rent/create
```

**If "Team":**
```
"Invite your first team member"
[Skip for now] [Invite Member] → Show invite dialog
```

**If "All of the above":**
```
"Let's add your first property"
[Skip for now] [Add Property] → Navigate to /properties/new
```

**Why:**
- User benefit: Gets them to "aha moment" immediately
- Analytics: Tracks which path users take, completion rate

**UI Pattern:** Large CTA buttons, clear skip option

---

### 2.2 Aha Moment Strategy

**Recommendation: During Onboarding (Step 3)**

**Why:**
- Users are most engaged during onboarding
- Reduces "empty state anxiety"
- Shows immediate value

**Implementation:**
- Step 3 directly navigates to the relevant form
- After completion, show success message: "Great! You've added your first [property/tenant/contract]. Let's explore your dashboard."
- Auto-redirect to dashboard with celebration animation

**Alternative (if skipped):**
- Dashboard shows empty state with prominent CTA
- "Complete Setup" banner at top of dashboard
- Tooltips/spotlights on key features

---

### 2.3 Empty State vs. Sample Data

**Recommendation: Hybrid Approach**

**For New Users (onboarding incomplete):**
- Show onboarding flow (modal or dedicated route)
- After onboarding: Show empty state with guided CTAs

**For Users Who Skip:**
- Show empty state with "Getting Started" card
- Include sample data preview (non-interactive) showing what's possible
- "Try it yourself" CTA to add real data

**Sample Data Preview:**
- Show 2-3 example properties (clearly marked as "examples")
- "Add your first property to replace these examples"

**Why:**
- Sample data = shows potential, reduces blank page anxiety
- Empty state = encourages action, doesn't clutter interface
- Hybrid = best of both worlds

---

## Part 3: Technical Implementation

### 3.1 Database Schema

```sql
-- Add onboarding tracking to organizations table
ALTER TABLE organizations 
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN primary_use_case TEXT, -- 'properties', 'clients', 'contracts', 'team', 'all'
ADD COLUMN team_size_range TEXT, -- '1', '2-5', '6-20', '21+'
ADD COLUMN onboarding_skipped BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_skipped_at TIMESTAMPTZ;

-- Index for querying incomplete onboardings
CREATE INDEX idx_organizations_onboarding_completed 
ON organizations(onboarding_completed) 
WHERE onboarding_completed = FALSE;

-- Add onboarding step tracking (optional, for analytics)
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  action_taken TEXT, -- 'completed', 'skipped', 'abandoned'
  data JSONB, -- Store step responses
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_onboarding_events_org_id ON onboarding_events(org_id);
CREATE INDEX idx_onboarding_events_user_id ON onboarding_events(user_id);
```

### 3.2 UI Flow Options

#### Option A: Modal Overlay (Recommended for MVP)
**Pros:**
- Non-intrusive, can be dismissed
- Works on any page
- Easy to implement

**Cons:**
- Can be ignored/closed
- Less immersive

**Implementation:**
- Check `onboarding_completed = FALSE` on dashboard load
- Show modal overlay with multi-step form
- Progress indicator at top (Step 1 of 3)

---

#### Option B: Dedicated Route (`/onboarding`)
**Pros:**
- More immersive
- Can't accidentally navigate away
- Better for mobile

**Cons:**
- Requires route protection
- More complex navigation logic

**Implementation:**
- ProtectedRoute checks onboarding status
- Redirects to `/onboarding` if incomplete
- After completion, redirects to dashboard

---

#### Option C: Hybrid (Recommended for Production)
**Pros:**
- Best user experience
- Flexible

**Cons:**
- More complex to implement

**Implementation:**
- First visit: Show modal on dashboard
- If dismissed: Show banner "Complete Setup" → Click → Navigate to `/onboarding`
- After completion: Never show again

---

### 3.3 Skip & Resume Logic

**Skip Rules:**
- Step 1 (Goal Selection): Can skip → Default to "All of the above"
- Step 2 (Organization Setup): Cannot skip (required for org name)
- Step 3 (Quick Start): Can skip → Show CTA in dashboard

**Resume Logic:**
- If user skips Step 1 or 3, mark as `onboarding_skipped = TRUE`
- Show "Complete Setup" banner in dashboard
- Clicking banner resumes from last completed step

**Completion Tracking:**
```typescript
interface OnboardingState {
  step1Completed: boolean;
  step2Completed: boolean;
  step3Completed: boolean;
  primaryUseCase?: string;
  teamSizeRange?: string;
  language?: 'tr' | 'en'; // Saved to user_preferences
  currency?: 'TRY' | 'USD' | 'EUR'; // Saved to user_preferences
}
```

**Database Update:**
- After Step 2: `onboarding_completed = TRUE` (minimum viable onboarding)
- After Step 3: Mark as "fully onboarded" (optional, for analytics)

---

## Part 4: Recommendations & Deliverables

### 4.1 Final Onboarding Flow (3 Steps)

#### Step 1: Welcome + Goal Selection
```
Title: "Hoş geldiniz! Emlak CRM'ye ne için geldiniz?"
Subtitle: "Size en uygun deneyimi sunmak için birkaç soru soruyoruz"

Question: "Emlak CRM'yi ne için kullanacaksınız?"

Options:
[🏠] Emlak listelerimi organize etmek
[👥] Müşteri ilişkilerimi takip etmek (kiracı/sahip)
[📄] Sözleşme ve belgeleri yönetmek
[👨‍👩‍👧‍👦] Ekip işbirliği ve raporlama
[✨] Hepsi

[Atla] [Devam Et]
```

#### Step 2: Organization Setup + Preferences
```
Title: "Organizasyonunuzu ayarlayalım"
Subtitle: "Birkaç temel bilgi topluyoruz"

// Required Section
Section: "Organizasyon Bilgileri"

Organization Name: [Jans Emlak] (editable, pre-filled)
Team Size: "Ekip büyüklüğünüz?"
  [ ] Sadece ben (bireysel danışman)
  [ ] 2-5 kişi (küçük ekip)
  [ ] 6-20 kişi (orta ekip)
  [ ] 20+ kişi (büyük ofis)

// Optional Section (Collapsible or subtle styling)
Section: "Tercihler (Opsiyonel)"
Description: "Bu ayarları daha sonra profil sayfasından değiştirebilirsiniz"

Language: "Arayüz Dili"
  [Dropdown: Türkçe (selected by default) | English]

Currency: "Para Birimi"
  [Dropdown: TRY - Türk Lirası (selected by default) | USD - US Dollar | EUR - Euro]

[Geri] [Kaydet ve Devam Et]
```

#### Step 3: Quick Start
```
Title: "Hemen başlayalım!"
Subtitle: "İlk [property/tenant/contract]'ınızı ekleyerek başlayın"

[Şimdilik Atla] [İlk Emlağımı Ekle] → Navigate to form
```

---

### 4.2 Database Schema Changes

**Migration File:** `supabase/migrations/20250104000001_add_onboarding_tracking.sql`

```sql
-- Add onboarding columns to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS primary_use_case TEXT,
ADD COLUMN IF NOT EXISTS team_size_range TEXT,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_skipped_at TIMESTAMPTZ;

-- Create onboarding events table (for analytics)
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  action_taken TEXT NOT NULL, -- 'completed', 'skipped', 'abandoned'
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_org_id 
ON onboarding_events(org_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id 
ON onboarding_events(user_id);

CREATE INDEX IF NOT EXISTS idx_organizations_onboarding_completed 
ON organizations(onboarding_completed) 
WHERE onboarding_completed = FALSE;
```

**Note on Language/Currency Preferences:**
- **NO migration needed** for language/currency preferences ✅
- Uses existing `user_preferences` table (already has `language` and `currency` columns)
- Preferences are **user-level** (not org-level), allowing each user to have their own settings
- Onboarding saves preferences via `userPreferencesService.updatePreferences()`
- Defaults: `language = 'tr'`, `currency = 'TRY'` (pre-filled in Step 2)

---

### 4.3 Component Structure

```
src/features/onboarding/
├── OnboardingFlow.tsx (main container)
├── components/
│   ├── Step1GoalSelection.tsx
│   ├── Step2OrganizationSetup.tsx
│   ├── Step3QuickStart.tsx
│   ├── OnboardingProgress.tsx (progress indicator)
│   └── OnboardingModal.tsx (modal wrapper)
├── hooks/
│   ├── useOnboarding.ts (state management)
│   └── useOnboardingCompletion.ts (completion logic)
└── services/
    └── onboarding.service.ts (API calls)
```

---

### 4.4 Success Metrics

**Primary Metrics:**
- **Onboarding Completion Rate:** % of users who complete all 3 steps
- **Time to First Action:** Time from signup to first property/tenant/contract added
- **Time to Aha Moment:** Time from signup to first meaningful interaction

**Secondary Metrics:**
- **Step Drop-off Rate:** Where users abandon onboarding
- **Skip Rate:** % of users who skip steps
- **Resume Rate:** % of users who return to complete skipped steps

**Target Goals (MVP):**
- Completion Rate: > 60%
- Time to First Action: < 5 minutes
- Time to Aha Moment: < 10 minutes

---

### 4.5 Implementation Priority

#### MVP (Phase 1) - Must Have
1. ✅ Database schema (onboarding tracking)
2. ✅ Step 1: Goal Selection (basic)
3. ✅ Step 2: Organization Setup (name + team size + language/currency preferences)
4. ✅ Step 3: Quick Start (navigate to relevant form)
5. ✅ Modal overlay on dashboard
6. ✅ Skip logic
7. ✅ Completion tracking
8. ✅ **i18n support (Turkish + English)** - REQUIRED
9. ✅ Language/currency preference saving to `user_preferences`

**Timeline:** 1-2 weeks

---

#### Phase 2 - Nice to Have
1. ⬜ Analytics dashboard (onboarding events)
2. ⬜ Resume logic (complete skipped steps)
3. ⬜ Personalized tours based on goal selection
4. ⬜ Sample data preview
5. ⬜ Email follow-up for incomplete onboardings

**Timeline:** 2-3 weeks

---

#### Phase 3 - Future Enhancements
1. ⬜ A/B testing different flows
2. ⬜ Video tutorials embedded in onboarding
3. ⬜ Interactive product tours (tooltips/spotlights)
4. ⬜ Progressive profiling (ask more questions over time)
5. ⬜ AI-powered recommendations based on responses

**Timeline:** 1-2 months

---

## Next Steps

1. **Review & Approve:** Stakeholder review of this strategy
2. **Create Migration:** Database schema changes
3. **Build Components:** Start with MVP (3-step flow)
4. **Add Translations:** Turkish + English (onboarding flow + app-wide i18n)
5. **Test:** User testing with 5-10 beta users
6. **Iterate:** Based on completion rates and feedback

---

## Part 5: Internationalization (i18n) Support

### 5.1 Onboarding Flow i18n

**Status:** ✅ **FULL i18n SUPPORT REQUIRED**

The onboarding flow itself must support both Turkish and English languages.

**Implementation:**
- Onboarding components use `useTranslation('onboarding')` hook
- Translation files:
  - `public/locales/tr/onboarding.json`
  - `public/locales/en/onboarding.json`
- Language detection:
  - Use user's language preference from `user_preferences` table
  - If no preference exists, use browser language detection
  - Default to Turkish if language not supported

**Translation Keys Structure:**
```json
{
  "step1": {
    "title": "Hoş geldiniz! Emlak CRM'ye ne için geldiniz?",
    "subtitle": "Size en uygun deneyimi sunmak için birkaç soru soruyoruz",
    "question": "Emlak CRM'yi ne için kullanacaksınız?",
    "options": {
      "properties": "Emlak listelerimi organize etmek",
      "clients": "Müşteri ilişkilerimi takip etmek (kiracı/sahip)",
      "contracts": "Sözleşme ve belgeleri yönetmek",
      "team": "Ekip işbirliği ve raporlama",
      "all": "Hepsi"
    },
    "skip": "Atla",
    "continue": "Devam Et"
  },
  "step2": {
    "title": "Organizasyonunuzu ayarlayalım",
    "subtitle": "Birkaç temel bilgi topluyoruz",
    "organization": {
      "title": "Organizasyon Bilgileri",
      "name": "Organizasyon Adı",
      "teamSize": "Ekip büyüklüğünüz?",
      "teamSizeOptions": {
        "solo": "Sadece ben (bireysel danışman)",
        "small": "2-5 kişi (küçük ekip)",
        "medium": "6-20 kişi (orta ekip)",
        "large": "20+ kişi (büyük ofis)"
      }
    },
    "preferences": {
      "title": "Tercihler (Opsiyonel)",
      "description": "Bu ayarları daha sonra profil sayfasından değiştirebilirsiniz",
      "language": "Arayüz Dili",
      "currency": "Para Birimi",
      "languageOptions": {
        "tr": "Türkçe",
        "en": "English"
      },
      "currencyOptions": {
        "TRY": "TRY - Türk Lirası",
        "USD": "USD - US Dollar",
        "EUR": "EUR - Euro"
      }
    },
    "back": "Geri",
    "saveAndContinue": "Kaydet ve Devam Et"
  },
  "step3": {
    "title": "Hemen başlayalım!",
    "subtitle": "İlk {type}'ınızı ekleyerek başlayın",
    "skip": "Şimdilik Atla",
    "addProperty": "İlk Emlağımı Ekle",
    "addTenant": "İlk Kiracımı Ekle",
    "addOwner": "İlk Sahibimi Ekle",
    "createContract": "İlk Sözleşmemi Oluştur",
    "inviteMember": "İlk Üyemi Davet Et"
  },
  "progress": {
    "step": "Adım",
    "of": "/"
  }
}
```

**Component Implementation:**
```typescript
// In onboarding components
const { t, i18n } = useTranslation('onboarding');
const { language } = useAuth(); // Get user's language preference

// Use language preference for onboarding display
useEffect(() => {
  if (language && ['tr', 'en'].includes(language)) {
    i18n.changeLanguage(language);
  }
}, [language, i18n]);

// All text uses translation keys
<Title>{t('step2.title')}</Title>
<Subtitle>{t('step2.subtitle')}</Subtitle>
```

**Dynamic Language Switching:**
- If user changes language in Step 2 preferences → Update i18n immediately
- Onboarding flow re-renders in new language
- All subsequent steps show in selected language

---

## Notes

- **Mobile-First:** All components must be mobile-responsive (many Turkish agents use mobile)
- **Turkish Language:** All copy must be culturally appropriate and use real estate terminology
- **i18n Support:** ✅ **REQUIRED** - Onboarding flow must support Turkish and English
- **Performance:** Onboarding should load in < 1 second
- **Accessibility:** WCAG 2.1 AA compliance
- **Language/Currency Preferences:** User-level (stored in `user_preferences`), not org-level

---

**Document Status:** Ready for Implementation  
**Last Updated:** 2025-01-04  
**Updated:** Added Step 2 preferences section + Full i18n support

