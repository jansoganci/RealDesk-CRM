# CLAUDE.md — RealDesk US Video Project

This is a **Remotion video project** for creating a product demo video for **RealDesk US** — a mobile-first Real Estate CRM for US solo agents and small teams.

---

## Video Goals

- **Type:** Sales demo — what a founder would show a prospect in a live call
- **Duration:** ~83 seconds (2490 frames @ 30fps)
- **Resolution:** 1920 × 1080, 16:9
- **Style:** Clean, professional, light mode
- **Narration:** Text callouts only — no voiceover, works silently
- **Target audience:** Solo US real estate agents and small teams (2–5 agents)
- **Opening hook:** "From first showing to closing — every deal in one place."

---

## Scene Plan

| # | Scene | Duration | Frames |
|---|-------|----------|--------|
| 1 | Intro — logo + tagline | 0–5s | 0–150 |
| 2 | Property Management | 5–22s | 150–660 |
| 3 | Lead / Inquiry Matching | 22–36s | 660–1080 |
| 4 | Deal Pipeline & Timeline | 36–55s | 1080–1650 |
| 5 | Commission Calculator | 55–70s | 1650–2100 |
| 6 | Outro + CTA | 70–83s | 2100–2490 |

---

## Brand Colors (exact hex — use these in all inline styles)

```ts
const BRAND = {
  primary:    '#2563EB',  // blue-600  — buttons, active nav, CTAs
  primaryDark:'#1d4ed8',  // blue-700  — hover states
  primaryBg:  '#eff6ff',  // blue-50   — light tinted backgrounds
  secondary:  '#059669',  // emerald-600 — success, match score, net income
  secondaryBg:'#ecfdf5',  // emerald-50
  warning:    '#D97706',  // amber-600 — occupied status
  danger:     '#dc2626',  // red-600   — overdue, empty status
  accent:     '#F97316',  // orange-500
  purple:     '#7c3aed',  // violet-700 — deal stage, under offer
  purpleBg:   '#f5f3ff',  // violet-50

  // Backgrounds
  appBg:      '#f9fafb',  // gray-50   — main app background
  cardBg:     '#ffffff',  // white     — card/panel background
  sidebarBg:  '#ffffff',  // white sidebar body
  sidebarHeader: '#2563EB', // blue-600 sidebar top bar

  // Borders
  border:     '#e5e7eb',  // gray-200

  // Text
  textPrimary:   '#111827', // gray-900
  textSecondary: '#4b5563', // gray-600
  textMuted:     '#6b7280', // gray-500
  textDisabled:  '#9ca3af', // gray-400

  // Status badges (solid, white text)
  statusEmpty:    '#f97316', // orange-500
  statusOccupied: '#3b82f6', // blue-500
  statusActive:   '#059669', // emerald-600
  statusInactive: '#4b5563', // gray-600
  statusUnderOffer: '#7c3aed', // violet-700
  statusSold:     '#059669', // emerald-600
  statusAvailable:'#059669', // emerald-600
};
```

---

## Typography

```ts
const FONTS = {
  family: 'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  heading: { fontWeight: 800, letterSpacing: '-0.02em', color: '#111827' },
  subheading: { fontWeight: 600, color: '#111827' },
  body: { fontWeight: 400, color: '#4b5563' },
  label: { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280' },
  code: { fontFamily: 'SF Mono, Menlo, monospace' },
};
```

Font sizes to use in video scenes: 42px (section title), 20px (subtitle), 14px (card heading), 12px (body/label), 10px (badge/tag).

---

## App UI Design Language

### Layout
- **Sidebar width:** 256px (fixed left)
- **Sidebar header:** `#2563EB` background, white bold text "RealDesk US", 72px tall
- **Sidebar nav items:** `rounded-xl` (12px), active = `#2563EB` bg + white text + subtle scale, inactive = `#374151` text on transparent
- **Main content area:** `#f9fafb` background, padded 20–24px

### Cards
- Background: `#ffffff`
- Border: `1px solid #e5e7eb`
- Border radius: `12px` (rounded-xl)
- Box shadow: `0 2px 8px rgba(0,0,0,0.05)` (standard), `0 8px 32px rgba(0,0,0,0.10)` (elevated)
- Padding: `20–24px`

### Buttons (primary)
- Background: `#2563EB`
- Text: white, 13px, font-weight 600
- Border radius: `8px`
- Padding: `8px 16px`

### Badges / Status pills
- Border radius: `9999px` (fully rounded)
- Padding: `3px 10px`
- Font size: 10–11px, font-weight 700
- Background is the status color at 15% opacity, text is the status color at full (e.g. `#2563eb` bg at 15%, text `#2563eb`) — OR solid background with white text for the app sidebar

### Sidebar Navigation Items (exact order from app)
1. Dashboard — grid icon
2. Owners — users icon
3. Properties — home icon
4. Tenants — user-check icon
5. Contracts — file-text icon
6. Calendar — calendar icon
7. Leads — user-plus icon
8. Deals — handshake icon
9. Reminders — bell icon
10. Finance — dollar-sign icon

Use emoji as icon stand-ins in mock UI: 📊 🏘️ 🏠 👥 📄 📅 🎯 🤝 🔔 💰

---

## Feature Descriptions (for callout text)

### Scene 2 — Property Management
- Manage rental and sale listings from one place
- US address fields: street, city, state (2-letter), ZIP, MLS ID, year built
- Status: Available · Under Offer · Sold (sale) | Empty · Occupied · Inactive (rental)
- Max 10 photos per property
- Key callouts: "Rental & sale properties", "MLS ID + US address fields", "Live status at a glance"

### Scene 3 — Lead / Inquiry Matching
- Leads come in from Zillow, Referral, Open House, Social, etc.
- Budget + criteria auto-scored against active listings
- Match percentage shown per property
- Leads progress through stages: New → Active → Showing → Offer → Closed
- Key callouts: "Track every lead source", "Auto-matched to your listings", "One click → schedule showing"

### Scene 4 — Deal Pipeline & Timeline
- Unified deal record from lead to closing
- When offer accepted → milestones auto-generated from closing date
- Milestones: Mutual Acceptance → Inspection → Financing Contingency → Title & Escrow → Final Walk-Through → Closing Day
- Deal parties directory: buyer, seller, lender, title company, inspector
- Post-NAR: buyer-agent agreement required before first showing
- Key callouts: "Auto milestones from closing date", "Every party, every deadline", "Document uploads per milestone"

### Scene 5 — Commission Calculator
- Dual-side: listing commission + buyer-side commission (post-NAR)
- Input: sale price + commission % per side
- Shows broker split → agent net
- Pipeline forecast + YTD total vs annual goal
- Key callouts: "Listing + buyer-side split", "Your exact net after broker split", "Annual pipeline forecast"

---

## Mock Data to Use (realistic US real estate)

### Properties
- 1842 Maple Ave, Austin TX 78701 — 3bd/2ba, 1,820 sqft — For Sale $485,000 — Available — MLS #7823401
- 504 Oak St #3B, Austin TX 78704 — 2bd/1ba, 980 sqft — Rental $2,400/mo — Occupied
- 2201 Lake View Dr, Round Rock TX 78664 — 4bd/3ba, 2,450 sqft — For Sale $620,000 — Under Offer — MLS #7901234
- 88 Congress Ave #12A, Austin TX 78701 — 1bd/1ba, 650 sqft — Rental $1,850/mo — Empty

### Leads
- Marcus & Priya Chen — via Zillow — Budget $450K–$550K — needs 3bd Austin — Stage: Active
- Tom Reeves — via Referral — Budget $350K–$420K — good school district — Stage: Showing
- Sarah Okafor — via Open House — Budget $600K+ — 4bd lake view — Stage: Offer

### Commission example (Scene 5)
- Property: 2201 Lake View Dr
- Sale price: $620,000
- Listing side: 2.8% = $17,360
- Buyer side: 2.5% = $15,500
- Total: $32,860
- Broker split: 15% = $4,929
- Agent net: $27,931
- YTD goal: $112,000 | Earned: $59,000 (53%)

### Deal milestones (Scene 4)
- Mutual Acceptance: Apr 2 ✓
- Inspection Period: Apr 5–12 ✓
- Financing Contingency: Apr 18 ✓
- Title & Escrow: Apr 22 ← ACTIVE
- Final Walk-Through: Apr 28
- Closing Day: Apr 30

---

## Animation Rules (Remotion)

- **NEVER use CSS transitions or animations** — Remotion won't render them
- **NEVER use Tailwind animation classes**
- Always use `useCurrentFrame()` + `interpolate()` for all motion
- Use `spring()` for entrance animations (damping: 14–18, stiffness: 90–120)
- Use `interpolate()` with `extrapolateLeft/Right: "clamp"` for opacity and translate
- Use `<Sequence from={N}>` to stagger scene elements
- All positioning: `position: absolute` or `display: flex` — no CSS Grid animations
- Easing: `Easing.bezier(0.16, 1, 0.3, 1)` for smooth ease-out feel
- Scene transitions: fade via opacity interpolate over 15 frames

---

## Remotion Composition (Root.tsx)

The main composition ID should be `RealDeskDemo` with:
- `durationInFrames`: 2490
- `fps`: 30
- `width`: 1920
- `height`: 1080
- `defaultProps`: none needed (all data is hardcoded for the demo)

---

## File Structure to Build

```
src/
├── Root.tsx                    — Register RealDeskDemo composition
├── RealDeskDemo.tsx            — Master composition, sequences all scenes
├── scenes/
│   ├── Intro.tsx
│   ├── PropertyManagement.tsx
│   ├── LeadMatching.tsx
│   ├── DealPipeline.tsx
│   ├── CommissionCalc.tsx
│   └── Outro.tsx
└── components/
    ├── MockBrowser.tsx         — App chrome: browser bar + sidebar + content area
    ├── Callout.tsx             — Animated pill callouts + section titles
    └── AnimatedNumber.tsx      — Counting number animation for commission scene
```

---

## CTA for Outro Scene

- Headline: "Your deals. Your pipeline. Your commission."
- Subline: "RealDesk — built for how agents actually work."
- CTA button: "Start free trial → realdesk.io"
- Brand mark: "R" in blue-600 rounded square + "RealDesk" wordmark
