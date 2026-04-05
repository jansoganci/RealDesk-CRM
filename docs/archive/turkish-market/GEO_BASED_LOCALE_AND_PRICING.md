# Geo-Based Locale & Pricing Strategy

> Status: Planned — no implementation yet.
> Context: App is live and used by Turkish real estate agencies. Nothing should break.

---

## Problem

The app needs to serve two audiences:

- **Turkish visitors** → Turkish language + TRY pricing
- **International visitors** → English language + USD pricing

Currently the landing page defaults to Turkish and shows TRY prices for everyone.

---

## How It Works (Signal Hierarchy)

Three signals are used in order of reliability:

| Priority | Signal | Method | Accuracy | Cost |
|----------|--------|--------|----------|------|
| 1 | IP geolocation | `CF-IPCountry` header (Cloudflare) | High | Free |
| 2 | Browser language | `navigator.language` | Medium | Free |
| 3 | User preference | Explicit toggle saved to localStorage | Exact | Free |

IP sets the default. Browser language is the fallback if no cookie exists yet. User can always override manually.

---

## Infrastructure Advantage

The app is deployed on **Cloudflare Pages**. Cloudflare automatically injects a `CF-IPCountry` header into every request containing the 2-letter country code (`TR`, `US`, `DE`, etc.).

Geo-detection infrastructure already exists — it just isn't being used yet.

---

## Architecture

```
Request from visitor
       ↓
Cloudflare Pages Function  ← functions/_middleware.ts
  reads CF-IPCountry header
  sets cookie: geo=TR  or  geo=INTL
       ↓
React app boots
  reads cookie via GeoContext
  sets i18next language (tr or en)
  sets currency preference (TRY or USD)
       ↓
LandingPage renders
  PricingSection receives currency prop
  Turkish visitors see TRY prices
  Everyone else sees USD prices
```

---

## What Needs to Be Built

### 1. Cloudflare Pages Function — `functions/_middleware.ts`
- ~15 lines
- Reads `CF-IPCountry` from request headers
- Sets a cookie (`geo=TR` or `geo=INTL`)
- Runs at the edge before React loads
- Zero risk to the authenticated app

### 2. `GeoContext` — `src/contexts/GeoContext.tsx`
- Reads the `geo` cookie on mount
- Falls back to `navigator.language` if cookie is absent
- Exposes: `{ country, currency, isTurkish }`
- Only consumed by landing page components
- The authenticated app does not use this context

### 3. `PricingSection` — add `currency` prop
- The component already stores both `monthlyPriceTL` and `monthlyPriceUSD`
- Just needs a prop to decide which to display
- Default stays TRY — no change for existing logged-in users
- Only the public landing page passes the geo-derived currency

### 4. Wire `LandingPage` to `GeoContext`
- Pass `currency` from context to `PricingSection`
- Pass detected language to i18next initial language
- No changes to any authenticated routes

---

## What Must NOT Change

- Authenticated app routes — Turkish agencies use these daily, do not touch
- `PricingSection` behavior inside the app (billing page for logged-in users stays as-is)
- URL structure — no `/tr/` or `/en/` prefixes. Existing bookmarks, shared links, and SEO must not break
- No external IP geolocation APIs — `CF-IPCountry` is free and already available. Adding a third-party API adds latency and a new failure point

---

## Safe Rollout Order

Steps 1–2 can be deployed independently. Step 3 just enriches what step 1 reads. Each step is non-breaking.

```
Step 1 — Build GeoContext
         Reads cookie; falls back to browser language if no cookie.
         Deploy: nothing visible changes yet.

Step 2 — Add currency prop to PricingSection
         Non-breaking. Default stays TRY.
         Deploy: nothing visible changes yet.

Step 3 — Deploy Cloudflare Pages middleware
         Sets geo cookie at the edge.
         Deploy: cookie now available to GeoContext.

Step 4 — Wire LandingPage to GeoContext
         Landing page now shows correct language + currency per visitor.
         Deploy: Turkish visitors → TRY, everyone else → USD.

Step 5 — Test
         VPN to Turkey → must see TRY + Turkish
         VPN to US     → must see USD + English
         Manual toggle → must persist across page refresh
```

---

## Related Files (when implementation begins)

| File | Action |
|------|--------|
| `functions/_middleware.ts` | Create — Cloudflare Pages Function |
| `src/contexts/GeoContext.tsx` | Create — geo/currency context |
| `src/features/billing/components/PricingSection.tsx` | Edit — add `currency` prop |
| `src/features/landing/LandingPage.tsx` | Edit — consume GeoContext |
| `src/components/landing/LandingHeader.tsx` | Edit — optional language toggle UI |

---

## Related Documents

- `docs/PRICING_STRATEGY_2026.md` — pricing plan details
- `docs/archive/audits/i18n_AUDIT_REPORT.md` — i18n audit snapshot (archived)
- `CLAUDE.md` — environment variables, deployment commands
