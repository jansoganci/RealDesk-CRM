# Sprint 2: T2 (Lead UI) + T4 (Lead Schemas) — Implementation Complete

## Overview

Sprint 2 Lead Pipeline UI and validation schemas are now fully implemented. The app has been migrated from "Inquiries" to "Leads" with a 9-column Kanban board, lead detail sheet with tabs, and US market validation.

---

## T2: Lead Pipeline UI ✅

### Navigation & Routing

**Modified Files:**
- `src/components/layout/Sidebar.tsx` — Changed `inquiries` → `leads`, icon `Search` → `UserPlus`
- `src/config/constants.ts` — Added `ROUTES.LEADS = '/leads'`, deprecated `ROUTES.INQUIRIES`
- `src/App.tsx` — Added `<Navigate>` from `/inquiries` → `/leads`, new route for `Leads` component
- `public/locales/en/navigation.json` — `inquiries` → `leads`, `viewAllInquiries` → `viewAllLeads`
- `public/locales/tr/navigation.json` — Same for Turkish
- `public/robots.txt` — Added `Disallow: /leads`

### i18n (New Namespace)

**Created Files:**
- `public/locales/en/leads.json` — 160+ keys for leads UI (pipeline, detail, status, toasts)
- `public/locales/tr/leads.json` — Turkish translations

**Modified:**
- `src/i18n.ts` — Registered `leads` namespace (replaced `inquiries`)

**Deleted:**
- `public/locales/en/inquiries.json`
- `public/locales/tr/inquiries.json`

### Lead Pipeline (Kanban Board)

**Created Files:**
- `src/features/leads/Leads.tsx` — Main page with pipeline/list toggle
- `src/features/leads/hooks/useLeadsPipeline.ts` — Fetches `getLeadsPipeline(orgId)`
- `src/features/leads/components/LeadPipelineBoard.tsx` — 9-column horizontal scroll Kanban
- `src/features/leads/components/LeadKanbanCard.tsx` — Card component for each lead

**Pipeline Columns (9 total):**
1. New
2. Contacted
3. Qualified
4. Active
5. Matched
6. Under Contract
7. Closed Won
8. Closed Lost
9. Converted

### Lead Detail Sheet

**Created:**
- `src/features/leads/components/LeadDetailSheet.tsx` — Right sheet with 3 tabs

**Tabs:**
1. **Overview** — Lead info, status selector, edit/matches actions
2. **Agreements** — Buyer-agent agreement details (signed date, expiration, commission)
3. **Showings** — Property showing logs (date, property, interest, feedback)

**Features:**
- Inline status updates via `Select` (calls `updateLeadStatus`)
- Read-only for members (owner-only edits)
- Loads `getLeadWithDetails(leadId)` with all relations

### View Toggle

**Modes:**
- **Pipeline** (default) — Kanban board with horizontal scroll
- **List** — Table/card view (reuses existing `InquiryTableRow` / `InquiryCard`)

Toggle uses `ToggleGroup` with `LayoutGrid` / `List` icons.

### Status Badge Updates

**Modified:**
- `src/features/inquiries/utils/statusUtils.ts` — Added `getLeadStatusBadgeClasses` with 9 status colors
- `src/features/inquiries/components/InquiryTableRow.tsx` — Uses `leads` i18n, `getLeadStatusBadgeClasses`
- `src/features/inquiries/components/InquiryCard.tsx` — Same updates

**Status Colors:**
- `new` → Blue
- `contacted` → Yellow
- `qualified` → Purple
- `active` → Green
- `matched` → Blue
- `under_contract` → Orange
- `closed_won` → Emerald
- `closed_lost` → Red
- `converted` → Teal

### Backward Compatibility

**Kept:**
- `src/features/inquiries/` folder structure (hooks, components, dialogs)
- All existing inquiry hooks/components work with `leads` i18n
- `inquiriesService` still exported (proxies to `leadsService`)

**Deleted:**
- `src/features/inquiries/Inquiries.tsx` (replaced by `src/features/leads/Leads.tsx`)

---

## T4: Lead Form Schemas ✅

### Schema Files

**Created:**
- `src/features/leads/schemas/lead-form.ts` — Lead creation/update with US validation
- `src/features/leads/schemas/buyer-agent-agreement-form.ts` — Agreement validation
- `src/features/leads/schemas/showing-log-form.ts` — Showing log validation
- `src/features/leads/schemas/index.ts` — Central export
- `src/features/leads/schemas/README.md` — Usage documentation
- `src/features/leads/schemas/INTEGRATION_EXAMPLE.md` — React Hook Form examples
- `src/features/leads/schemas/__tests__/lead-form.test.ts` — Vitest unit tests

### Lead Form Schema (`lead-form.ts`)

**Exports:**
- `createLeadSchema` — Zod schema for lead creation
- `updateLeadSchema` — Zod schema for lead updates (includes `status` field)
- `LEAD_SOURCE_OPTIONS` — 8 lead sources (Zillow, Realtor.com, etc.)
- `LEAD_STATUS_OPTIONS` — 9 pipeline statuses
- `US_STATES` — 50 US states + DC with value/label pairs
- `CreateLeadFormData` / `UpdateLeadFormData` — TypeScript types

**Validation Rules:**
- **Phone**: US NANP validation via `isValidPhone()`, auto-formats to `(555) 123-4567`
- **Email**: Standard email format (optional)
- **State**: 2-letter uppercase code, validated against 51 US states
- **Budget**: Min cannot exceed max (cross-field validation)
- **Name**: 1-100 characters
- **Notes**: Max 1000 characters

**Transforms:**
- Phone: `formatPhoneForDisplay()` applied on valid input
- State: `.toUpperCase()` applied automatically

### Buyer-Agent Agreement Schema (`buyer-agent-agreement-form.ts`)

**Exports:**
- `createBuyerAgentAgreementSchema`
- `updateBuyerAgentAgreementSchema`
- `COMMISSION_TYPE_OPTIONS` — percentage, flat_fee, tiered
- `AGREEMENT_STATUS_OPTIONS` — active, expired, terminated

**Validation Rules:**
- **Commission Type**: If `percentage`, requires `commission_rate` (0-100%)
- **Commission Type**: If `flat_fee`, requires `flat_fee_amount` (positive)
- **Dates**: Expiration must be after signed date
- **PDF URL**: Valid URL format (optional)

### Showing Log Schema (`showing-log-form.ts`)

**Exports:**
- `createShowingLogSchema`
- `updateShowingLogSchema`
- `INTEREST_LEVEL_OPTIONS` — high, medium, low, none

**Validation Rules:**
- **Duration**: 1-480 minutes (8 hours max)
- **Feedback**: Max 1000 characters
- **Interest Level**: Enum validation
- **UUIDs**: Valid UUID format for `lead_id` and `property_id`

### Integration Pattern

All schemas follow the React Hook Form + Zod pattern from `contracts.service.ts`:

```typescript
const form = useForm<CreateLeadFormData>({
  resolver: zodResolver(createLeadSchema),
  defaultValues: { ... }
});
```

---

## Service Layer Updates

**Modified:**
- `src/services/leads.service.ts` — Exported `LEAD_PIPELINE_COLUMNS` constant
- `src/lib/serviceProxy.ts` — Exported `leadsService` and `handleServiceError`
- `src/lib/handleServiceError.ts` — Created shared error handler

---

## TypeScript Status

**Passing:**
- All new lead schemas compile without errors
- All lead UI components type-check correctly
- No linter errors in `src/features/leads/`

**Pre-existing Issues (not introduced by this work):**
- `src/components/calendar/AddMeetingDialog.tsx` — Missing `org_id` in meeting insert
- `src/contexts/NotificationContext.tsx` — Unused `orgLoading` variable
- `src/services/userPreferences.service.ts` — Type mismatch on line 96

---

## Files Summary

### Created (19 files)

**Service Layer:**
1. `src/lib/handleServiceError.ts`
2. `src/services/leads.service.ts`

**UI Components:**
3. `src/features/leads/Leads.tsx`
4. `src/features/leads/hooks/useLeadsPipeline.ts`
5. `src/features/leads/components/LeadPipelineBoard.tsx`
6. `src/features/leads/components/LeadKanbanCard.tsx`
7. `src/features/leads/components/LeadDetailSheet.tsx`

**Schemas:**
8. `src/features/leads/schemas/lead-form.ts`
9. `src/features/leads/schemas/buyer-agent-agreement-form.ts`
10. `src/features/leads/schemas/showing-log-form.ts`
11. `src/features/leads/schemas/index.ts`
12. `src/features/leads/schemas/README.md`
13. `src/features/leads/schemas/INTEGRATION_EXAMPLE.md`
14. `src/features/leads/schemas/__tests__/lead-form.test.ts`

**i18n:**
15. `public/locales/en/leads.json`
16. `public/locales/tr/leads.json`

**Documentation:**
17. `SPRINT_2_T2_T4_COMPLETE.md` (this file)

### Modified (15 files)

1. `src/App.tsx` — Added `/leads` route, redirect from `/inquiries`
2. `src/config/constants.ts` — Added `ROUTES.LEADS`
3. `src/components/layout/Sidebar.tsx` — Changed nav to "Leads" with `UserPlus` icon
4. `src/lib/serviceProxy.ts` — Exported `leadsService` and `handleServiceError`
5. `src/services/inquiries.service.ts` — Thin re-export proxy to `leads.service.ts`
6. `src/i18n.ts` — Registered `leads` namespace
7. `public/locales/en/navigation.json` — Updated nav labels
8. `public/locales/tr/navigation.json` — Updated nav labels
9. `public/robots.txt` — Added `/leads` to disallow list
10. `src/features/inquiries/utils/statusUtils.ts` — Added `getLeadStatusBadgeClasses`
11. `src/features/inquiries/components/InquiryTableRow.tsx` — Uses `leads` i18n, clickable name
12. `src/features/inquiries/components/InquiryCard.tsx` — Uses `leads` i18n, clickable name
13. `src/features/inquiries/hooks/useInquiriesData.ts` — Uses `leads` i18n
14. `src/features/inquiries/hooks/useInquiryActions.ts` — Uses `leads` i18n
15. `src/features/inquiries/InquiryDialog.tsx` — Uses `leads` i18n
16. `src/features/inquiries/InquiryMatchesDialog.tsx` — Uses `leads` i18n
17. `src/features/inquiries/inquirySchema.ts` — Added US phone validation, deprecation notice

### Deleted (3 files)

1. `src/features/inquiries/Inquiries.tsx` — Replaced by `src/features/leads/Leads.tsx`
2. `public/locales/en/inquiries.json` — Replaced by `leads.json`
3. `public/locales/tr/inquiries.json` — Replaced by `leads.json`

---

## Verification Checklist

### ✅ Sidebar

- [x] Label changed to "Leads"
- [x] Icon changed to `UserPlus`
- [x] Route points to `/leads`
- [x] Unread matches badge works on `leads` key

### ✅ Routes

- [x] `/leads` route exists and mounts `Leads` component
- [x] `/inquiries` redirects to `/leads` via `<Navigate replace />`
- [x] Protected route wraps `Leads` component

### ✅ Kanban Board

- [x] 9-column board (New → Converted)
- [x] Horizontal scroll on overflow
- [x] Uses `getLeadsPipeline(orgId)` from service
- [x] Empty state per column
- [x] Click card opens detail sheet

### ✅ Lead Detail Sheet

- [x] Right sheet with 3 tabs (Overview, Agreements, Showings)
- [x] Overview: Lead info + inline status selector + edit/matches buttons
- [x] Agreements: Shows buyer-agent agreement (signed, expires, commission)
- [x] Showings: Lists showing logs (date, property, interest, feedback)
- [x] Status updates call `updateLeadStatus(leadId, status, userId)`
- [x] Read-only for members

### ✅ View Toggle

- [x] Pipeline/List toggle with `ToggleGroup`
- [x] Default view: Pipeline
- [x] List view: Table + mobile cards (reuses existing components)

### ✅ Schemas

- [x] `createLeadSchema` with US phone + state validation
- [x] `updateLeadSchema` with status field
- [x] `createBuyerAgentAgreementSchema` with commission validation
- [x] `createShowingLogSchema` with duration + interest validation
- [x] All schemas export dropdown option arrays
- [x] Phone auto-formats to `(555) 123-4567`
- [x] State auto-uppercases to 2-letter code
- [x] Cross-field validation (min/max budgets, dates)

### ✅ i18n

- [x] `leads` namespace registered in `i18n.ts`
- [x] All UI strings use `useTranslation('leads')`
- [x] English + Turkish translations complete
- [x] Status labels for all 9 pipeline stages

### ✅ Backward Compatibility

- [x] `/inquiries` redirects to `/leads`
- [x] `inquiriesService` still exported (proxies to `leadsService`)
- [x] Existing inquiry components reused in list view
- [x] Old inquiry hooks work with new `leads` i18n

---

## Next Steps (Sprint 2 Remaining Tasks)

### T5: Buyer-Agent Agreement UI

- [ ] Create `BuyerAgentAgreementDialog.tsx` using `buyer-agent-agreement-form.ts` schema
- [ ] Add "Create Agreement" button in lead detail Overview tab
- [ ] Wire up `createBuyerAgentAgreement()` service method
- [ ] Add agreement list view in Agreements tab

### T6: Showing Log UI

- [ ] Create `ShowingLogDialog.tsx` using `showing-log-form.ts` schema
- [ ] Add "Record Showing" button in lead detail Overview tab
- [ ] Wire up `createShowingLog()` service method
- [ ] Add showing list with property links in Showings tab

### T7: Lead Source Analytics (Optional)

- [ ] Create dashboard widget using `getSourceBreakdown()`
- [ ] Add conversion funnel using `getLeadConversionStats()`

---

## Testing Recommendations

1. **Navigation**: Visit `/inquiries` → should redirect to `/leads`
2. **Sidebar**: Click "Leads" → should navigate to pipeline board
3. **Pipeline**: Verify all 9 columns render with correct labels
4. **Detail Sheet**: Click any lead card → sheet opens with 3 tabs
5. **Status Update**: Change status in Overview tab → should update and refresh pipeline
6. **View Toggle**: Switch between Pipeline/List → both views work
7. **Form Validation**: Try creating lead with invalid phone → should show error

---

## Known Issues

None introduced by this work. Pre-existing TypeScript errors in:
- `AddMeetingDialog.tsx` (missing `org_id`)
- `NotificationContext.tsx` (unused variable)
- `userPreferences.service.ts` (type mismatch)

---

## Architecture Notes

### Why 9 Columns Instead of 7?

The migration (`0005_sprint2_lead_pipeline.sql`) added 9 statuses to the CHECK constraint:
- `new`, `contacted`, `qualified`, `active`, `matched`, `under_contract`, `closed_won`, `closed_lost`, `converted`

Plus legacy statuses: `closed` (maps to `closed_lost` in UI)

To reduce to 7 columns, either:
1. Hide `matched` and `converted` columns in UI (filter in `LeadPipelineBoard.tsx`)
2. Merge statuses (e.g., `closed_won` + `closed_lost` → single "Closed" column)

### Service Proxy Pattern

All components import services from `@/lib/serviceProxy`, never directly:

```typescript
import { leadsService } from '@/lib/serviceProxy'; // ✅ Correct
import { leadsService } from '@/services/leads.service'; // ❌ Wrong
```

### i18n Namespace Strategy

- Old components (`InquiryDialog`, `InquiryTableRow`) now use `leads` namespace
- `inquiries` namespace deleted (no longer needed)
- All new lead UI uses `useTranslation('leads')`

---

## Files Ready for Git Commit

All files are ready. Suggested commit message:

```bash
git add .
git commit -m "feat(leads): implement lead pipeline UI with Kanban board and detail sheet

- Replace Inquiries with Leads in nav (UserPlus icon)
- Add 9-column Kanban board using getLeadsPipeline
- Add lead detail sheet with Overview/Agreements/Showings tabs
- Create Zod schemas for lead/agreement/showing forms with US validation
- Add leads i18n namespace (en + tr)
- Redirect /inquiries → /leads
- Keep backward compatibility via inquiriesService proxy

Sprint 2 T2 + T4 complete."
```

---

## Performance Notes

- Pipeline board uses horizontal scroll (no virtualization needed for <100 leads per column)
- Detail sheet lazy-loads `getLeadWithDetails` only when opened
- Status updates are optimistic (UI updates immediately, then syncs)
- View toggle state is local (not persisted to localStorage)

---

## Accessibility

- Kanban cards are keyboard-navigable (tabIndex + onKeyDown)
- Status selector has proper ARIA labels
- Sheet close button has screen-reader text
- Toggle group has aria-label on each button

---

**Implementation Date:** 2026-04-05  
**Sprint:** 2 of 8 (Lead to Deal)  
**Tasks Complete:** T1 (DB), T2 (Service + UI), T4 (Schemas)  
**Tasks Remaining:** T5 (Agreement UI), T6 (Showing UI), T7 (Analytics)
