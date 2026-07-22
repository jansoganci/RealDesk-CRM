# Sprint 7 — CCPA Compliance Module Implementation Plan

> **Project:** RealDesk US CRM
> **Pattern:** Layer-by-layer (DB → Service → UI → i18n → Route)
> **Implementation:** Claude Code (`--model sonnet`, default effort)

---

## Background

CCPA (California Consumer Privacy Act) gives California residents 4 rights:
1. **Right to Know** — what data is collected, how it's used, who it's shared with
2. **Right to Delete** — request deletion of personal information
3. **Right to Opt-Out** — opt out of sale/sharing of personal information
4. **Right to Non-Discrimination** — no penalty for exercising rights

For RealDesk US (B2B SaaS for real estate agents), data subjects are primarily:
- **End customers** of the agent (tenants, buyers, sellers, leads) — their data is in the CRM
- **Agent users** themselves (less relevant — they control the data)

---

## 1. DATABASE — Migration

**File:** `supabase/migrations/0038_add_ccpa_data_subject_requests.sql`

**Table:** `data_subject_requests`
```sql
CREATE TABLE data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),

  -- Who is making the request
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT,
  relationship_to_org TEXT NOT NULL CHECK (relationship_to_org IN ('tenant', 'buyer', 'seller', 'lead', 'other')),
  relationship_description TEXT,

  -- Request details
  request_type TEXT NOT NULL CHECK (request_type IN ('know', 'delete', 'opt_out_sale', 'opt_out_share', 'correct')),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_review', 'verification_sent', 'completed', 'denied')),
  status_notes TEXT,
  verified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- For deletion requests: what was done
  deletion_summary TEXT,
  data_disclosed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

**RLS Policies:**
- Org admins can SELECT/UPDATE all requests for their org
- Authenticated users can INSERT requests
- Soft-delete only

**Triggers:** `updated_at` auto-update
**Indexes:** org_id, status, request_type, created_at

**Data inventory document** — A reference doc/JSON listing all PII collected by the CRM (for "Right to Know" responses). This is a static document, not a table.

---

## 2. SERVICE

**File:** `src/services/ccpa.service.ts`

**Class:** `CcpService`

**Methods:**

### For Data Subjects (end customers of agents):
- `submitRequest(data)` — Public-facing method to submit a know/delete/opt-out request
- `verifyRequest(token)` — Verify email-based request
- `getRequestStatus(token)` — Check status of submitted request

### For Org Admins (the agents themselves):
- `getRequests(orgId)` — List all CCPA requests for their org
- `getRequestById(id)` — Get request details
- `updateRequestStatus(id, status, notes)` — Process a request
- `completeKnowRequest(id)` — Generate data inventory response + mark complete
- `completeDeleteRequest(id)` — Execute data deletion + mark complete
- `completeOptOutRequest(id)` — Mark opt-out preferences

**Note:** Actual data deletion for CCPA delete requests is complex — it requires:
1. Anonymizing or deleting records in `property_inquiries`, `tenants`, `contracts`, `deals`, etc.
2. Leaving audit trail (the request itself)
3. Not deleting data that belongs to the agent (org), only the individual's personal data

For V1, we'll implement **soft-delete + anonymization** rather than hard delete from all tables.

**Proxy:** Register in `src/lib/serviceProxy.ts`

---

## 3. UI — Feature Folder

**Directory:** `src/features/compliance/`

### Public-Facing Pages (no auth required)

#### CompliancePage.tsx
Main CCPA landing page at `/privacy`:
- Overview of CCPA rights
- Three action cards: Know / Delete / Opt-Out
- Each card → opens request form

#### components/DataSubjectRequestForm.tsx
Multi-step form for submitting CCPA requests:
- Step 1: Select request type (know / delete / opt-out)
- Step 2: Identity info (name, email, phone, relationship)
- Step 3: Additional details (free text)
- Step 4: Confirmation + submit

#### components/RequestStatusCheck.tsx
Form to check existing request status by email + request ID.

### Admin Pages (auth required, accessible from sidebar)

#### ComplianceDashboard.tsx
For org admins — manage incoming CCPA requests:
- Table of all requests with status filters
- Click to view detail
- Process button (verify, complete, deny)

#### components/RequestDetailSheet.tsx
Side sheet showing:
- Requester info
- Request type + details
- Status timeline
- Actions: Verify, Complete (know), Execute Deletion (delete), Mark as Opted-Out (opt-out)
- Notes/status updates

#### schemas/ccpa.schema.ts
Zod schemas for request forms.

#### hooks/useCcpRequests.ts
Data fetching hook for admin request management.

#### index.ts
Barrel export.

---

## 4. RLS / DATA DELETION

For CCPA "Right to Delete" the actual data deletion flow:

1. Admin reviews request → approves
2. System identifies all records related to `requester_email` across:
   - `property_inquiries` (set `deleted_at`)
   - `tenants` (set `deleted_at`, anonymize name/email/phone)
   - `contracts` (anonymize tenant references)
   - `showing_logs`, `buyer_agent_agreements`, `inquiry_matches`
3. Anonymization: replace PII fields with `[redacted per CCPA request]`
4. The `data_subject_requests` record remains as audit trail
5. No hard DELETE from tables — soft-delete + anonymization

This is implemented as a service method (`executeDataDeletion()` in ccpaService), not as raw SQL.

---

## 5. i18n

**File:** `public/locales/en/compliance.json`

Keys needed: page title, request types, form fields, status labels, confirmation messages, admin actions.

Also update existing pages that have privacy links (Register.tsx, Profile section) to point to the new `/privacy` CCPA page.

---

## 6. ROUTE + NAV

- `ROUTES.CCPA: '/privacy'` in constants.ts (public, no ProtectedRoute)
- `ROUTES.CCPA_DASHBOARD: '/compliance'` in constants.ts (admin, ProtectedRoute)
- Public route in App.tsx (outside ProtectedRoute)
- Admin route in App.tsx (with ProtectedRoute)
- Nav item: `/compliance` in Sidebar (icon: `Shield`)

---

## 7. EXISTING CODE UPDATES

- Landing page Hero.tsx line 159: "CCPA COMPLIANT" text — already exists, no change needed
- Register.tsx: privacy policy link already exists — add link to `/privacy` CCPA page
- Profile section: add CCPA request form link
- Footer: add privacy link if missing

---

## 8. VERIFICATION

- `npm run typecheck` — 0 errors
- `npm run build` — success
- `npm run check:translations` — clean
- Public user can submit CCPA request without login
- Admin can view and process requests
- Test: submit request → admin sees it → process → status updates
