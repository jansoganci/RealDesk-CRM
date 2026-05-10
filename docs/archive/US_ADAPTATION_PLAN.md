# Emlak CRM → US Market Adaptation Plan

> Generated: April 4, 2026
> Inputs: 3 market research docs + full codebase audit (32 services, 19 features, 94 migrations, 7 edge functions)

---

## SECTION 1: WHAT TO KEEP (unchanged)

### UI Infrastructure
- `src/components/ui/*` — 60+ Radix UI base components
- `src/components/layout/*` — MainLayout, Sidebar, Navbar, PageContainer
- `src/components/common/*` — EmptyState, ErrorBoundary, Skeletons
- `src/config/colors.ts` — design tokens, status badge helpers
- Tailwind config, dark mode system, Framer Motion animations

### Auth & Org
- `src/features/auth/*` — Login, Register, ForgotPassword, ResetPassword, AuthCallback
- `src/contexts/AuthContext.tsx` — session management (revise defaults only, see §2)
- `src/contexts/OrgContext.tsx` — multi-tenant org loading
- `src/contexts/BillingContext.tsx` — billing status gate
- `src/contexts/NotificationContext.tsx` — notification counts
- `src/features/organization/*` — TeamMembersList, AcceptInvite, member management
- `src/services/organization.service.ts` — org CRUD, invites, logo

### Properties Core
- `src/features/properties/Properties.tsx` — list/grid view
- `src/features/properties/PropertyTypeSelector.tsx` — rental/sale split
- `src/services/properties.service.ts` — CRUD, stats, soft delete
- `src/services/photos.service.ts` — photo upload, reorder, validation
- `src/features/properties/components/*` — cards, filters, photo gallery
- `properties` DB table structure (rental/sale split, status enums)
- `property_photos` DB table + storage bucket

### Owners
- `src/features/owners/Owners.tsx` — owner list
- `src/features/owners/OwnerDialog.tsx` — owner CRUD (no TC/IBAN in standalone dialog)
- `src/services/owners.service.ts` — CRUD, property counts

### Tenants
- `src/features/tenants/Tenants.tsx` — tenant list
- `src/features/tenants/EnhancedTenantDialog.tsx` — multi-step tenant creation
- `src/services/tenants.service.ts` — CRUD, stats (revise TC validation call only)

### Calendar
- `src/features/calendar/CalendarPage.tsx` — full calendar
- `src/services/meetings.service.ts` — CRUD, date range, upcoming
- `meetings` DB table

### Inquiries / Lead Matching
- `src/features/inquiries/*` — inquiry CRUD, type selector, match dialog
- `src/services/inquiries.service.ts` — auto-matching engine (city/district/budget)
- `property_inquiries` + `inquiry_matches` DB tables

### Finance Core
- `src/features/finance/*` — dashboard, analytics, transaction forms, charts
- `src/services/finance/transactions.service.ts` — CRUD, CSV export (revise default currency)
- `src/services/finance/categories.service.ts` — expense categories
- `src/services/finance/recurring.service.ts` — recurring expenses
- `src/services/finance/analytics.service.ts` — dashboards, ratios, trends
- `financial_transactions`, `expense_categories`, `recurring_expenses` DB tables

### Reminders
- `src/features/reminders/*` — reminder list and components
- `src/services/reminders.service.ts` — contract-end, rent-increase reminders

### Quick-Add
- `src/features/quick-add/*` — entity creation shortcut (revise currency defaults)

### Profile
- `src/features/profile/*` — settings, billing, user preferences
- `src/services/userPreferences.service.ts` — get/update preferences

### Billing / Stripe
- `src/features/billing/*` — PricingPage, BillingSubscribe
- `src/services/stripeCheckout.service.ts`
- `supabase/functions/create-checkout-session`
- `supabase/functions/create-portal-session`
- `supabase/functions/stripe-webhook`
- `user_billing`, Stripe tables

### Onboarding
- `src/features/onboarding/*` — 3-step onboarding flow (revise copy only)

### Team Performance
- `src/features/team/*` — team analytics, summary cards

### Duplicate Check
- `src/services/duplicateCheck.service.ts` — name/data conflict detection (revise display strings)

### Infrastructure
- `src/lib/auth.ts` — getAuthenticatedUserId
- `src/lib/db.ts` — Supabase client helpers
- `src/lib/dates.ts` — date-fns utilities
- `src/lib/utils.ts` — cn() utility
- `src/lib/errors.ts` — error handling
- `src/lib/serviceProxy.ts` — service barrel exports (update exports)
- Cloudflare Pages deployment config
- Supabase RLS pattern (user_id / org_id scoping)
- `supabase/functions/send-invitation-email` — org invites

---

## SECTION 2: WHAT TO REVISE (Turkish → US adaptation)

### 2.1 Identity & Validation

| Current (TR) | Required (US) |
|---|---|
| `encryption.service.ts` → `isValidTC()` validates 11-digit TC Kimlik | Replace with SSN format validation (XXX-XX-XXXX) or remove — US agents rarely collect SSN. [ASSUMPTION: V1 does not collect SSN; replace TC field with optional "Tax ID / EIN" text field with no format enforcement] |
| `encryption.service.ts` → `isValidIBAN()` validates `TR` + 24 digits | Replace with US bank validation: routing number (9 digits, ABA check) + account number (4–17 digits) |
| `encryption.service.ts` → `hashTC()` SHA-256 for duplicate detection | Repurpose as `hashTaxId()` or remove if Tax ID not collected in V1 |
| `contractForm.schema.ts` → Zod schema requires `isValidTC`, `isValidIBAN` on owner/tenant | Replace validators; make Tax ID optional; replace IBAN with routing/account fields |

### 2.2 Currency & Financial Defaults

| Current (TR) | Required (US) |
|---|---|
| `finance/transactions.service.ts` → default `currency: 'TRY'` | Default to `'USD'` |
| `lib/currency.ts` → FX fallback `TRY: 42.30`; fetches TRY/EUR vs USD | Remove TRY-centric FX; support USD as base. [ASSUMPTION: V1 is USD-only, no FX needed] |
| `lib/localeDetection.ts` → Turkey geolocation → `tr` / `TRY` default | US geolocation → `en` / `USD` default; remove TR-biased detection |
| `features/dashboard/components/ExchangeRatesCard.tsx` → shows `usd_try`, `eur_try` | Remove or replace with US-relevant rates if needed. [ASSUMPTION: V1 removes FX card entirely] |
| `features/reminders/components/ReminderTableRow.tsx` → TRY-style compact formatter `.000 → K` | Replace with USD compact formatting (`$32K`) |
| `commissions.service.ts` → `MONTH_NAMES_TR` array (Ocak…Aralık) | Replace with English month names or use `Intl.DateTimeFormat('en-US')` |

### 2.3 Phone Formatting

| Current (TR) | Required (US) |
|---|---|
| `phone.service.ts` → normalizes to 10-digit Turkish mobile starting with `5`, displays `0539…`, handles `+90` | Replace with US phone: 10-digit NANP, `(XXX) XXX-XXXX` display, `+1` prefix |

### 2.4 Address Model

| Current (TR) | Required (US) |
|---|---|
| Contract form uses `mahalle`, `cadde_sokak`, `bina_no`, `daire_no`, `ilce`, `il` | Replace with US address: `street_address`, `unit` (apt/suite), `city`, `state` (dropdown, 50 states + DC), `zip_code` (5 or 9 digit) |
| `address.service.ts` → Turkish address normalization, matching | Rewrite for US address format; consider Google Places autocomplete integration |
| Property table uses `city` / `district` | Keep `city`; replace `district` with `state`; add `zip_code` column |
| Contract/tenant joins expose `il` / `ilce` | Rename to `state` / `city` or map accordingly |

### 2.5 Contract System

| Current (TR) | Required (US) |
|---|---|
| `contractPdf.service.ts` → generates full Turkish rental agreement (KİRA SÖZLEŞMESİ, 6098 Borçlar Kanunu, TÜFE references, İstanbul courts) | Rewrite for US lease agreement: state-specific terms, no statutory references baked in, English, USD. [ASSUMPTION: V1 ships a generic US residential lease template; state-specific addenda are backlog] |
| `templates/contractContent.ts` → `GENEL_SARTLAR`, `OZEL_SARTLAR`, `TAHLIYE_TAAHHUTNAMESI_TEXT` (Turkish civil code) | Replace entirely with US lease clauses (security deposit rules, late fee terms, habitability, lead paint disclosure) |
| `templates/saleContractContent.ts`, `salesContractContent.ts`, `salePdf.template.ts` → Turkish sale contract with T.C., ada/parsel, İstanbul courts | Replace with US purchase agreement template (earnest money, contingencies, closing costs, title insurance) |
| `contractPdfEngine.service.ts` → v2 PDF engine for sale/commission/showing | Revise templates; engine mechanics (jsPDF + storage upload) are reusable |
| `clauses.service.ts` → editable clauses per contract | Keep mechanism; replace default clause content with US equivalents |
| `lib/numberToText.ts` → spells numbers in Turkish (`yirmi iki bin`) | Replace with English number-to-words (`twenty-two thousand`) |
| `features/contracts/hooks/useContractPdfHandler.ts` → `date-fns locale: tr`, Turkish property type defaults (`Daire`, `Mesken`) | Switch to `locale: enUS`, English property type labels (`Apartment`, `Residential`) |
| PDF filename: `Kira_Sozlesmesi_*.pdf` | Rename to `Lease_Agreement_*.pdf` / `Purchase_Agreement_*.pdf` |

### 2.6 Commission Logic

| Current (TR) | Required (US) |
|---|---|
| `AuthContext.tsx` → default `commissionRate: 4.0` | Change to `3.0` (post-NAR settlement US average for listing side) |
| Commission model: single percentage of sale/rent | Extend to support: listing-side commission, buyer-side commission (now separately negotiated post-Aug 2024), flat fee option, tiered commission |
| No buyer-agent agreement tracking | Add `buyer_agent_agreements` table or field on contracts (see §4) |

### 2.7 Landing / Marketing

| Current (TR) | Required (US) |
|---|---|
| `LandingPage.tsx` → title "Emlak CRM \| Gayrimenkul…" | Rebrand for US: "RealDesk" or chosen US brand name |
| `components/landing/Hero.tsx` → hardcoded `İstanbul, Kadıköy · Kiralık`, `İstanbul, Beşiktaş · Satılık` | Replace with US demo data: `Austin, TX · For Rent`, `Miami, FL · For Sale` |
| All landing page copy → Turkish-market positioning | Rewrite for US positioning: "The CRM built for solo agents managing both sales and rentals" |

### 2.8 i18n

| Current (TR) | Required (US) |
|---|---|
| `public/locales/tr/*.json` (24 namespaces) — primary | Keep as reference; not needed for US V1 |
| `public/locales/en/*.json` (24 namespaces) — secondary | Audit and complete all English translations; make `en` the default and only locale for US V1 |
| i18next default language `tr` | Set to `en` |

### 2.9 OCR / Contract Import

| Current (TR) | Required (US) |
|---|---|
| `textExtraction.service.ts` → parses Turkish contract labels (`KİRACININ TELEFONU`, etc.) | Rewrite heuristics for US lease terms (`Tenant Phone`, `Landlord`, `Monthly Rent`, etc.) |
| `supabase/functions/extract-contract-data-v2` → OCR extraction | Keep the function; update parsing rules |

### 2.10 PDF Fonts

| Current (TR) | Required (US) |
|---|---|
| `pdfFonts.ts` → `addTurkishFonts()` embeds Roboto for İ, ı, Ş, ş, Ğ, ğ, etc. | Rename to `addCustomFonts()`; Roboto is fine for English but Turkish-specific glyph comment can be removed. Functionally unchanged. |

---

## SECTION 3: WHAT TO DELETE

| Item | Reason |
|---|---|
| `src/templates/contractContent.ts` | Turkish rental contract text citing Borçlar Kanunu, TÜFE, İstanbul courts. No US equivalent — replaced entirely. |
| `src/templates/saleContractContent.ts` | Turkish sale contract text. Replaced entirely. |
| `src/templates/salesContractContent.ts` | Duplicate Turkish sale template with ada/parsel. Replaced entirely. |
| `src/templates/salePdf.template.ts` | Turkish sale PDF table labels (`T.C Kimlik No`). Replaced entirely. |
| `src/lib/numberToText.ts` | Turkish number-to-words only. Replace with English version. |
| `MONTH_NAMES_TR` in `commissions.service.ts` | Turkish month name array. Use `Intl` or English array. |
| `isValidTC()` in `encryption.service.ts` | 11-digit TC Kimlik validation. No US equivalent. |
| `isValidIBAN()` in `encryption.service.ts` | Turkish IBAN format (`^TR\d{24}$`). Replace with US bank validation. |
| `hashTC()` in `encryption.service.ts` | TC Kimlik hashing for duplicate detection. Remove or repurpose. |
| Turkish phone rules in `phone.service.ts` | `+90`, 10-digit starting with `5` rules. Replace with US NANP rules. |
| `il` / `ilce` address fields in DB and service joins | Turkish province/district naming. Migrate to `state` / `city`. |
| `mahalle`, `cadde_sokak`, `bina_no`, `daire_no` address fields | Turkish address granularity with no US equivalent. |
| `lib/localeDetection.ts` → Turkey geolocation bias | Default-to-TR logic. Replace with US defaults. |
| FX rate card on dashboard (`ExchangeRatesCard.tsx`) | TRY/USD/EUR cross-rate display. Not relevant for USD-only US product. |
| `supabase/functions/fetch-exchange-rates` | Fetches TRY exchange rates daily. Not needed for USD-only V1. |
| `finance/exchangeRates.service.ts` | TRY-centric FX cache, conversion, backfill. Not needed for USD-only V1. |
| `exchange_rates` DB table | Stores TRY-based exchange rates. Not needed for USD-only V1. |
| KVKK consent flows (if any remain in cookie/consent logic) | Turkish data protection law. Replace with US privacy (CCPA). |
| `duplicateCheck.service.ts` → hardcoded Turkish diff labels (`Telefon:`) | Replace with English labels. |
| Hardcoded Turkish demo data in `Hero.tsx` | İstanbul neighborhoods. Replace with US cities. |

---

## SECTION 4: WHAT TO BUILD (new, doesn't exist yet)

### Priority 1 — Required for US V1

| # | Feature | Why (from market research) | Complexity |
|---|---|---|---|
| 1 | **Transaction Timeline / Closing Tracker** | US deals have rigid timelines: offer → inspection (7–10 days) → appraisal → financing contingency → title search → closing. Transaction coordinators are the #1 outsourced role on Upwork. This is the single biggest automation opportunity. | L |
| 2 | **Buyer-Agent Agreement Tracker** | Post-NAR settlement (Aug 2024): buyers must sign written agreements before showings. Every deal now requires tracking agreement terms, expiration, commission rate negotiated. No existing CRM handles this well. | M |
| 3 | **Dual-Side Commission Calculator** | US commissions are now split-negotiated: listing-side (2.5–3%) and buyer-side (2.43% avg) are independent. Must support percentage, flat fee, and tiered structures per side. Current single-rate model is insufficient. | M |
| 4 | **US Lease Agreement PDF Generator** | Replace Turkish rental contract. Must include: security deposit terms (state-specific limits), late fee policy, lead paint disclosure (federal req for pre-1978), habitability clause, entry notice requirements. | L |
| 5 | **US Purchase Agreement PDF Generator** | Replace Turkish sale contract. Must include: earnest money, contingencies (inspection, financing, appraisal), closing cost allocation, title insurance, home warranty option. | L |
| 6 | **US Address System** | Street + Unit + City + State (dropdown) + ZIP. Google Places autocomplete integration for fast entry. Property-level address validation. | M |
| 7 | **US Phone Formatting** | NANP 10-digit format, `(XXX) XXX-XXXX` display, `+1` international prefix. | S |
| 8 | **US Bank Account Fields** | Replace IBAN with routing number (9-digit ABA) + account number for rent payment deposits. Encrypt at rest (reuse AES-GCM infra). | S |
| 9 | **CCPA Compliance Module** | California Consumer Privacy Act: data deletion requests, opt-out mechanism, privacy policy updates. 39M Californians = ~12% of US population. Non-negotiable for US launch. | M |
| 10 | **English Number-to-Words** | Replace Turkish `numberToText.ts` for lease/purchase agreement PDFs. | S |

### Priority 2 — High-Value Differentiators (V1.5)

| # | Feature | Why (from market research) | Complexity |
|---|---|---|---|
| 11 | **MLS Integration (read-only)** | MLS is the central US listing database. At minimum: MLS ID field on properties, link to listing, manual sync. Full RESO Web API integration is V2+. Market research: MLS proficiency is required in every agent VA job listing. | M |
| 12 | **DocuSign / e-Signature Integration** | Physical signatures are near-extinct in US real estate. 90%+ of contracts use DocuSign or dotloop. Even basic "send for signature" via DocuSign API would be a major differentiator vs manual PDF workflow. | L |
| 13 | **Multi-LLC Entity Management** | #1 pain point from market research: investors hold properties in separate LLCs. Need entity-level P&L, per-LLC bank account tracking, consolidated reporting across entities. 72% find ROI tracking challenging with QuickBooks. | L |
| 14 | **Deal Analysis Calculator** | Wholesaling deal analyzer: ARV calculator, comp inputs, MAO (70% rule), repair estimator, GO/NO-GO status. Market research: this exact tool is the #1 requested build on Upwork for investors. | M |
| 15 | **Lead Source Tracking + ROI** | Track which lead source (Zillow, Realtor.com, Facebook, referral, cold call) produced each inquiry. Calculate cost-per-lead and marketing ROI. Market research: agents spend $500–$1,500/mo on leads with no attribution. | M |

### Priority 3 — Competitive Moat (V2+)

| # | Feature | Why (from market research) | Complexity |
|---|---|---|---|
| 16 | **AI-Powered Follow-Up Sequences** | REsimpli has 8 AI agents for voice/lead qualification. 39% of agencies use VAs ($800–$1,600/mo) primarily for follow-up calls. AI follow-up = highest VA cost displacement. | L |
| 17 | **Zillow/Realtor.com Lead Import** | Auto-import leads from major portals. Follow Up Boss's #1 strength. Every agent VA job listing requires this skill. | L |
| 18 | **Email/SMS Integration** | Gmail/Outlook sync + SMS tracking. 60%+ of agents cite integration as their biggest tech headache. | L |
| 19 | **Escrow Tracking** | Track earnest money deposits, escrow account balances, disbursement at closing. Unique to US market. | M |
| 20 | **Schedule E Tax Prep Export** | Generate IRS Schedule E data from financial records per property. Market research: this is the single most painful annual task for landlords with 5+ properties. | M |
| 21 | **Tenant Portal (Self-Service)** | Maintenance requests, rent payment status, lease documents. 70% of 1–4 unit landlords self-manage. Market research: after-hours emergencies and scattered communication are top pain points. | L |
| 22 | **Comparable Market Analysis (CMA) Generator** | Auto-pull comps, generate CMA reports for listings. Market research: deal analysis remains "stubbornly manual" — agents rebuild from scratch each time. | L |

---

## SECTION 5: V1 SCOPE RECOMMENDATION

### Target User
Solo US real estate agent managing 5–30 active listings across both sales and rentals. Post-NAR settlement, needs commission tracking more than ever. Currently paying $70–$150/mo across 3–5 disconnected tools.

### Pricing Position
$29/mo Starter · $59/mo Pro — positioned as "better than Follow Up Boss, cheaper than GoHighLevel, and it handles rentals too."

### What Ships in V1

**Keep (unchanged from Turkish version):**
- Auth + org + team management
- Property CRUD with photos (rental + sale split)
- Owner/tenant management
- Inquiry system with auto-matching
- Calendar/meetings
- Finance: transactions, categories, recurring expenses, analytics dashboard
- Reminders (contract end, rent increase)
- Quick-add shortcut
- Profile/settings
- Billing/Stripe subscription
- Onboarding flow

**Revise for US:**
- All currency defaults → USD (remove FX, remove exchange rate card)
- Phone → US NANP format
- Address → Street/City/State/ZIP model
- Commission → dual-side (listing + buyer), default 3%
- Identity → remove TC/IBAN; add routing/account number fields (encrypted)
- i18n → English-only, complete all translations
- Landing page → US branding, US demo data
- Locale detection → US defaults

**Build new for V1:**
1. Transaction Timeline / Closing Tracker (L) — **the killer feature**
2. Buyer-Agent Agreement Tracker (M) — **post-NAR must-have**
3. Dual-Side Commission Calculator (M)
4. US Lease Agreement PDF (L)
5. US Purchase Agreement PDF (L)
6. US Address System with state dropdown (M)
7. US Phone + Bank Account fields (S)
8. CCPA compliance basics (M)
9. English number-to-words for PDFs (S)

### What Goes to Backlog

| Feature | Why Deferred |
|---|---|
| MLS API integration | Complex, requires RESO certification, per-MLS agreements. V1 ships MLS ID text field only. |
| DocuSign integration | High value but large engineering effort. V1 generates downloadable PDFs. |
| Multi-LLC entity management | Highest pain point for investors, but V1 targets agents first. Phase into V1.5 when investor segment is validated. |
| Deal analysis calculator | Investor-specific. Agents don't wholesale. Add when expanding to investor persona. |
| Lead source tracking + ROI | Important but not blocking. V1 tracks inquiries; attribution layer comes in V1.5. |
| AI follow-up sequences | Differentiator but requires AI infrastructure. V2 feature. |
| Zillow/Realtor.com lead import | Portal API agreements needed. V2. |
| Email/SMS integration | Complex integration surface. V2. |
| Escrow tracking | Nice-to-have, not blocking for solo agents. V1.5. |
| Schedule E tax export | Tax season feature. Build for Q4 2026. |
| Tenant portal | Requires separate auth system for tenants. V2. |
| CMA generator | Requires comp data sources. V2. |

### V1 Engineering Estimate

| Category | Effort |
|---|---|
| Revisions (§2 items) | ~3–4 weeks |
| Transaction Timeline | ~2–3 weeks |
| Buyer-Agent Agreement Tracker | ~1 week |
| Dual-Side Commission Calculator | ~1 week |
| US Lease PDF | ~2 weeks |
| US Purchase Agreement PDF | ~2 weeks |
| US Address System | ~1 week |
| Phone + Bank + CCPA + number-to-words | ~1 week |
| Landing page rebrand | ~3–5 days |
| QA + i18n audit | ~1 week |
| **Total** | **~13–16 weeks (1 developer)** |

### Critical Path
`US Address System` → `Transaction Timeline` → `Lease/Purchase PDFs` → `Commission Calculator` → `Buyer-Agent Tracker` → `Landing rebrand` → `CCPA` → QA

The address system unblocks everything else (every feature touches addresses). Transaction Timeline is the primary differentiator that no competitor at this price point offers. PDFs are the primary retention mechanism (once an agent's contracts live in the system, switching costs are prohibitive — exactly what market research identifies as the winning moat strategy).

---

*[ASSUMPTION] flags used above:*
- *V1 does not collect SSN; uses optional "Tax ID / EIN" text field*
- *V1 is USD-only, no FX conversion needed*
- *V1 removes FX dashboard card entirely*
- *V1 ships a generic US residential lease template; state-specific addenda are backlog*
