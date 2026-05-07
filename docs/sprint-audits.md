# RealDesk US — Sprint Audit Log

Audit date: 2026-05-07

---

## Sprint 1 — US Foundation
**Status:** ⚠️ Partial
**Completion Estimate: 75%**

---

### DB / Migrations

| Feature | Expected | Found | Status |
|---------|----------|-------|--------|
| US address fields on `properties` | `street_address, city, state, zip_code, mls_id, year_built` | All present — `0010_properties_us_address_fields.sql` | ✅ Complete |
| US bank fields on `property_owners` | `routing_number_encrypted, account_number_encrypted, tax_id` | All present — `0011_property_owners_us_bank_fields.sql` | ✅ Complete |
| AES-256-GCM encryption for bank fields | Encrypted columns only | Columns named `_encrypted`, encryption implemented | ✅ Complete |
| Indexes on `state`, `zip_code` | CREATE INDEX both columns | Both indexes created in `0010` | ✅ Complete |
| Turkish fields removed | TC kimlik, IBAN gone | Retained with "Sprint 8 removal" comments | ⚠️ Partial |

---

### Services

| Service | Expected | Found | Status |
|---------|----------|-------|--------|
| `phone.service.ts` | NANP 10-digit, `+1` E.164 normalization | Full implementation at `src/services/phone.service.ts` | ✅ Complete |
| `address.service.ts` | 50-state array, zip validation, US address parsing | Full implementation; all 50 states + DC | ✅ Complete |
| `encryption.service.ts` | AES-256-GCM encrypt/decrypt, routing/account/tax ID validation | Full implementation | ✅ Complete |
| `owners.service.ts` | Calls encrypt before store, decrypt on read | Integrated correctly with encryption service | ✅ Complete |
| `exchangeRates.service.ts` | USD as base currency, TRY removed | TRY still used as anchor currency in `src/services/finance/exchangeRates.service.ts` | ⚠️ Partial |
| Currency throughout services | USD-only, TRY stripped | TRY still present in 50+ locations across services and schemas | ⚠️ Partial |

---

### Components / UI

| Component | Expected | Found | Status |
|-----------|----------|-------|--------|
| `PropertyFormFields.tsx` | `street_address, state, zip_code, mls_id, year_built` inputs | Only shows generic `address`, `city`, `district` — US fields missing | ❌ Missing |
| `propertySchemas.ts` | Schema extended with all US fields | Schema still has `address/city/district` not `street_address/state/zip_code/mls_id/year_built` | ❌ Missing |
| `OwnerDialog.tsx` | `routing_number, account_number, tax_id` inputs | All present and wired to encryption service | ✅ Complete |
| Lease wizard address fields | `street_address, city, state, zip_code, year_built` | Implemented in lease wizard | ✅ Complete |
| Purchase wizard address fields | Same + `buyer_mailing_state, seller_mailing_state` | Implemented in purchase wizard | ✅ Complete |
| Lead form | `preferred_state` (2-char US code) | Implemented in `src/features/leads/schemas/lead-form.ts` | ✅ Complete |
| Inquiry form | Should unify to `preferred_state` | Still uses `preferred_city` / `preferred_district` (legacy) | ⚠️ Partial |
| Currency selectors | USD-only | TRY option still visible in property forms, `MarkAsSoldDialog`, contract forms, `quickAddSchema.ts` | ⚠️ Partial |

---

### Known Issues / Gaps

1. **Property dialog completely missing US address UI** — `PropertyFormFields.tsx` and `propertySchemas.ts` were never updated; the DB columns exist but are unreachable from the add/edit property form.
2. **TRY currency not removed** — 50+ references remain; key files: `propertySchemas.ts`, `contractForm.schema.ts`, `quickAddSchema.ts`, `MarkAsSoldDialog`, `exchangeRates.service.ts`.
3. **~40 remaining `: any` types** — concentrated in `AuthContext.tsx:397`, contract import flow, inquiry schema factories, property/tenant list render callbacks; strict mode is ON but violations persist.
4. **Inquiry vs. Lead location schema divergence** — `property_inquiries` uses `preferred_city/preferred_district`; leads use `preferred_state`; database has both but they're inconsistent.
5. **`numberToTurkishText()`** still called in `src/features/contracts/hooks/useContractPdfHandler.ts` — acceptable for legacy contracts only, but not yet gated.
6. **Phone validation not enforced in wizards** — `phone.service.ts` exists and works, but tenant phone fields in the lease/purchase wizards don't validate against NANP rules.

---

## Sprint 2 — Lead Pipeline
**Status:** ⚠️ Partial
**Completion Estimate: 85%**

---

### DB / Migrations

| Feature | Expected | Found | Status |
|---------|----------|-------|--------|
| `property_inquiries` US extension | `lead_source`, `preferred_state`, `pre_approved` columns | All added — `0005_sprint2_lead_pipeline.sql`, `0012` | ✅ Complete |
| Lead source enum | `zillow, realtor_com, referral, sign_call, social_media, cold_call, open_house, other` | Constraint added in `0005` lines 14-25 | ✅ Complete |
| Lead status enum | `new, contacted, qualified, active, matched, under_contract, closed_won, closed_lost, converted` | Constraint added in `0005` lines 30-42 | ✅ Complete |
| `buyer_agent_agreements` table | `id, org_id, lead_id, signed_date, expiration_date, commission_rate, commission_type, flat_fee_amount, pdf_url, status` | Full table — `0005` lines 51-93; `user_id` added in `0008` | ✅ Complete |
| Agreement status enum | `draft, sent, signed, active, expired, terminated` | Constraint added in `0008` line 73 | ✅ Complete |
| `showing_logs` table | `id, org_id, lead_id, property_id, showing_date, duration_minutes, feedback, interest_level` | Full table — `0005` lines 99-137; `feedback_enum` + `notes` added in `0008` | ✅ Complete |
| Showing feedback enum | `loved, interested, pass` | Constraint added in `0008` line 132 | ✅ Complete |
| Indexes | `org_id, lead_id, property_id, showing_date` for showings; `org_id, lead_id, expiration_date` for agreements | All created in `0005`, `user_id` indexes in `0008` | ✅ Complete |
| RLS — `buyer_agent_agreements` | SELECT/INSERT/UPDATE/DELETE scoped to `org_id` + `user_id` | Implemented in `0009` lines 8-44 | ✅ Complete |
| RLS — `showing_logs` | SELECT/INSERT/UPDATE/DELETE scoped to `org_id` + `user_id` | Implemented in `0009` lines 50-86 | ✅ Complete |
| `inquiry_matches` table | Auto-matching support | Pre-existing; used by `LeadsService` auto-matching logic | ✅ Complete |

---

### Services

| Service | Expected | Found | Status |
|---------|----------|-------|--------|
| `LeadsService.createLead()` | Create with `lead_source`, `preferred_state`, `pre_approved` | `src/services/leads.service.ts` lines 680-708 | ✅ Complete |
| `LeadsService.getLeadsPipeline()` | Kanban grouping by status | Lines 626-651; maps `LEAD_PIPELINE_COLUMNS` | ✅ Complete |
| `LeadsService.updateLeadStatus()` | Status update scoped to `user_id` | Lines 656-677 | ✅ Complete |
| `LeadsService.getLeadsBySource()` | Filter by `lead_source` | Lines 774-792 | ✅ Complete |
| `LeadsService.getSourceBreakdown()` | Aggregated counts per source | Lines 795-835 | ✅ Complete |
| `LeadsService.createBuyerAgentAgreement()` | Insert with all commission fields | Lines 842-868 | ✅ Complete |
| `LeadsService.getAgreementByLeadId()` | Latest agreement per lead | Lines 871-889 | ✅ Complete |
| `LeadsService.getExpiringAgreements()` | Agreements expiring within threshold (default 30d) | Lines 894-921 | ✅ Complete |
| `LeadsService.updateAgreementStatus()` | Status transitions | Lines 947-968 | ✅ Complete |
| `LeadsService.createShowingLog()` | Insert with `feedback_enum`, `interest_level` | Lines 975-1000 | ✅ Complete |
| `LeadsService.getShowingsByLeadId()` | All showings per lead | Lines 1003-1020 | ✅ Complete |
| `LeadsService.getShowingsByPropertyId()` | All showings per property | Lines 1023-1040 | ✅ Complete |
| `LeadsService.updateShowingFeedback()` | Update `loved/interested/pass` | Lines 1043-1067 | ✅ Complete |
| `LeadsService.getLeadWithDetails()` | Lead + latest agreement + showings + matches | Lines 713-767 | ✅ Complete |
| Auto-matching (`matchInquiryToProperty`) | Match by type, city, budget | Lines 321-414; triggers on property create/update | ✅ Complete |
| `ShowingLogsService` | Facade over `LeadsService` showing methods | `src/services/showingLogs.service.ts` | ✅ Complete |

---

### Components / UI

| Component | Expected | Found | Status |
|-----------|----------|-------|--------|
| `Leads.tsx` | Dual view (pipeline/list), add/edit/delete | `src/features/leads/Leads.tsx` 363 lines; view toggle lines 35-36, 223-243 | ✅ Complete |
| `LeadPipelineBoard.tsx` | Kanban with drag-and-drop between columns | `src/features/leads/components/LeadPipelineBoard.tsx` — static columns only, no DnD library installed | ⚠️ Partial |
| `LeadKanbanCard.tsx` | Card display in Kanban column | File exists | ✅ Complete |
| `LeadDetailSheet.tsx` | Side panel with overview/agreements/showings tabs | 303 lines; tabs at lines 140-144, 269-283 | ✅ Complete |
| `LeadDetailPage.tsx` | Full-page lead detail | File exists with same tab structure | ✅ Complete |
| `BuyerAgentAgreementDialog.tsx` | Agreement form with commission type selector | 342 lines; commission type conditional at lines 224-273 | ✅ Complete |
| `BuyerAgentAgreementList.tsx` | Display agreement with expiration badge, PDF link | 203 lines; expiration logic lines 28-77 | ✅ Complete |
| `ShowingLogDialog.tsx` | Showing form with property selector + feedback buttons | 344 lines; property combobox lines 170-240, feedback buttons lines 303-324 | ✅ Complete |
| `ShowingLogList.tsx` | Display showings with editable feedback badges | 147 lines; feedback badge mapping lines 29-49 | ✅ Complete |
| `LeadForm` Zod schema | `lead_source`, `preferred_state`, `pre_approved`, US state validation | `src/features/leads/schemas/lead-form.ts` lines 13-240 | ✅ Complete |
| `BuyerAgentAgreementForm` schema | Commission type conditional validation, expiration > signed refine | `src/features/leads/schemas/buyer-agent-agreement-form.ts` lines 46-113 | ✅ Complete |
| `ShowingLogForm` schema | Feedback enum, duration 1-480 min | `src/features/leads/schemas/showing-log-form.ts` lines 24-44 | ✅ Complete |
| `InquiryDialog.tsx` (legacy) | `lead_source` field | Still uses old `inquirySchema` — `lead_source` not captured | ⚠️ Partial |
| Agreement status workflow UI | Draft → Send → Sign → Active transitions | Status dropdown present; no action buttons to advance state | ⚠️ Partial |
| Lead source analytics | Dashboard chart showing source breakdown | `getSourceBreakdown()` exists but no UI consumes it | ❌ Missing |
| Expiration alerts / reminders | Dashboard widget or alert for expiring agreements | `getExpiringAgreements()` exists but not wired to any UI | ❌ Missing |

---

### Known Issues / Gaps

1. **Kanban drag-and-drop not implemented** — `LeadPipelineBoard.tsx` renders static columns only; no DnD library (`@dnd-kit`, `react-beautiful-dnd`) in `package.json`. Status changes require the detail sheet dropdown. Core Sprint 2 feature.
2. **No buyer-agent agreement enforcement before showings** — `ShowingLogDialog.tsx` does not check for an active agreement before allowing a showing to be created; NAR Aug 2024 compliance not enforced at the UI/service layer (`leads.service.ts` line 975).
3. **Agreement status workflow incomplete** — `BuyerAgentAgreementDialog.tsx` lines 299-322 shows a status dropdown but no transition buttons (Draft → Send, etc.); agreements can get stuck in `draft`.
4. **`getExpiringAgreements()` never called** — method exists at `leads.service.ts` line 894 but no dashboard, alert, or reminder component consumes it.
5. **`getSourceBreakdown()` never called** — method exists at `leads.service.ts` line 795 but no chart or report renders it.
6. **`InquiryDialog.tsx` (legacy) missing `lead_source`** — backward-compat dialog still in use; old `inquirySchema` has no `lead_source` field, so legacy inquiry creation path loses source tracking.
7. **Redundant showing feedback columns** — `feedback` (text), `feedback_enum` (enum), and `interest_level` all stored; added in `0008` but never consolidated; schema is confusing.
8. **`pre_approved` field not exposed in UI** — column exists in DB (`0005` line 11) and schema but no form input or display surfaces it.

---

## Sprint 3 — Deal Core
**Status:** ✅ Complete
**Completion Estimate: 100%**

---

### DB / Migrations

| Feature | Expected | Found | Status |
|---------|----------|-------|--------|
| `deals` table | `deal_type, deal_stage, client_role, financing, offer_price, closing_date, commission rates` | Full table — `0006_sprint3_deal_core_tables.sql` lines 8-81 | ✅ Complete |
| `deal_parties` table | 10 roles: buyer, seller, agents, lender, title_co, inspector, appraiser, attorney, other | `0006` lines 96-130 | ✅ Complete |
| `offer_negotiations` table | Negotiation session (status: active, accepted, rejected, withdrawn) | `0006` lines 136-156 | ✅ Complete |
| `offer_rounds` table | Immutable rounds, `round_number`, `parent_round_id` (self-ref counter-offer FK), 7 statuses + superseded | `0006` lines 161-225; `superseded` status added in `0030` | ✅ Complete |
| `offer_contingencies` table | 19 contingency types, 6 statuses, resolution types | `0006` lines 231-304 | ✅ Complete |
| `deal_milestones` table | 9 milestone types, `offset_basis`, `contingency_id` FK | `0006` lines 310-365 | ✅ Complete |
| `deal_amendments` table | 5 types: price_change, deadline_extension, repair_agreement, contingency_waiver, other | `0006` lines 370-396 | ✅ Complete |
| Milestone alert columns | `alert_sent_7d/3d/1d/today`, `last_nudge_sent_at`, document tracking | `0013` lines 3-15 | ✅ Complete |
| `notifications` table | 7 alert types: overdue, due_today, due_3d/7d, waiting_on_others, closing_soon, prerequisite_missing | `0014` lines 3-81 | ✅ Complete |
| RLS on all 7 tables | org-scoped SELECT/INSERT/UPDATE; soft-delete only | `0006` lines 426-516 | ✅ Complete |
| Triggers | `updated_at` auto-update, `org_id` immutability | `0006` lines 402-420 | ✅ Complete |

---

### Services

| Service | Expected | Found | Status |
|---------|----------|-------|--------|
| `DealsService` | `createDeal()`, `convertLeadToDeal()`, `getAll()`, `getById()`, `updateStage()`, `markMutualAcceptance()`, `markClosedWon()`, `markFellThrough()`, `softDelete()`, `getStats()` | All implemented — `src/services/deals.service.ts` | ✅ Complete |
| `OfferRoundsService` | `createFirstOffer()`, `addCounterOffer()`, `submitOffer()`, `markVerbalAccepted()`, `markMutualAcceptance()`, `markRejected()`, `markExpired()`, `getByDeal()`, `getActiveRound()` | All implemented — `src/services/offerRounds.service.ts` | ✅ Complete |
| `OfferContingenciesService` | `getByOfferRound()`, `getActiveByDeal()`, `resolveContingency()`, `waiveContingency()`, `getDefaultContingencies()` | All implemented — `src/services/offerContingencies.service.ts` | ✅ Complete |
| `DealPartiesService` | `getByDeal()`, `addParty()`, `updateParty()`, `removeParty()`, `getContactForMilestone()` | All implemented — `src/services/dealParties.service.ts` | ✅ Complete |
| `TimelineMilestonesService` | `generateTimelineMilestones()` (9-step, 20-milestone spec), `regenerateTimelineMilestones()`, `getByDeal()`, `updateMilestoneStatus()`, `addMilestoneNote()` | All implemented — `src/services/timelineMilestones.service.ts` | ✅ Complete |
| Service Proxy | All services registered | `src/lib/serviceProxy.ts` lines 44-78 | ✅ Complete |

---

### Components / UI

| Component | Expected | Found | Status |
|-----------|----------|-------|--------|
| `Deals.tsx` | Deal list with stage filter, search, stats | `src/features/deals/Deals.tsx` — stage filter, `activeDeals`, `closingsThisMonth`, `overdueMilestones` | ✅ Complete |
| `DealDetail.tsx` | 8-tab detail page | `src/features/deals/DealDetail.tsx` — tabs: overview, milestones, contingencies, offers, purchase (conditional), documents, parties, amendments | ✅ Complete |
| `DealCreationSheet.tsx` | Lead→Deal conversion with pre-fill; standalone creation | Lines 94-119 `buildDefaultsFromLead()`; line 164 `convertLeadToDeal()` | ✅ Complete |
| `DealOffersPanel.tsx` | Offer list, first offer, counter-offer flow, status actions | Full implementation with `CounterOfferModal` | ✅ Complete |
| `OfferRoundSheet.tsx` | First offer + counter-offer form | mode: `'first' \| 'counter'`; contingency defaults | ✅ Complete |
| `OfferHistoryTimeline.tsx` | Visual counter-offer genealogy via `parent_round_id` | Full implementation | ✅ Complete |
| `DealContingenciesPanel.tsx` | Active contingencies, resolution UI, milestone sync | `getActiveByDeal()` + resolution dialog + milestone sync | ✅ Complete |
| `TimelineTab.tsx` | 4-phase timeline, filter (all/overdue/my_action/pending/complete), custom milestone | Full implementation | ✅ Complete |
| `PartiesTab.tsx` | 10 roles, CRUD, auto-populate from lead + property snapshot | Lines 76-103 auto-population; full CRUD | ✅ Complete |
| `AmendmentsTab.tsx` | 5 types, effective_date, old/new value, milestone sync for deadline_extension | Full implementation; `useAmendmentsTab` milestone sync lines 82-88 | ✅ Complete |
| `DocumentsTab.tsx` | Upload/download via `deal-documents` storage bucket | Full implementation with org-scoped RLS | ✅ Complete |
| `AlertCenter.tsx` | Milestone alert dashboard (7 alert types) | Full implementation with dismiss/snooze/read state | ✅ Complete |
| Lead→Deal convert button | Visible when `status === 'active' && !deal_id` | `src/features/leads/LeadDetailPage.tsx` lines 103-113 | ✅ Complete |

---

### Known Issues / Gaps

None identified. Sprint 3 is fully implemented:
- Lead→Deal conversion has backref update, initial negotiation creation, and pre-fill from lead
- Counter-offer genealogy uses immutable `parent_round_id` with superseding logic in `offerRounds.service.ts` lines 234-240
- All 7 DB tables have consistent RLS and `updated_at` triggers
- 21 dedicated UI components cover all deal sub-features

---

## Sprint 4 — Transaction Timeline
**Status:** ⚠️ Partial
**Completion Estimate: 92%**

---

### DB / Migrations

| Feature | Expected | Found | Status |
|---------|----------|-------|--------|
| `deal_milestones` base table | Core milestone storage | `0006_sprint3_deal_core_tables.sql` lines 371-421 | ✅ Complete |
| Alert tracking columns | `alert_sent_7d`, `alert_sent_3d`, `alert_sent_1d`, `alert_sent_today`, `last_nudge_sent_at` | `0013_sprint4_deal_milestones_alerts.sql` lines 1-16 | ✅ Complete |
| Document tracking columns | `document_required`, `document_path`, `document_uploaded_at` | `0013` lines 1-11 | ✅ Complete |
| Alert index | Index on `due_date, status, alert_sent_3d` for pending milestones | `0013` lines 13-16 | ✅ Complete |
| `notifications` table | Full alert storage, 7-type `alert_type` enum | `0014_sprint4_notifications_and_deal_documents.sql` lines 3-28 | ✅ Complete |
| Notifications RLS | SELECT/INSERT/UPDATE/DELETE with org + user isolation | `0014` lines 39-82 | ✅ Complete |
| `deal-documents` storage bucket | S3 bucket for milestone attachments with RLS | `0014` lines 83-146 | ✅ Complete |
| Notification indexes | Org/user/unread/deal filtering | `0014` lines 30-37 | ✅ Complete |
| Milestone status enum | `pending, in_progress, complete, overdue, waived` | `0006` — all 5 values | ✅ Complete |
| Alert type enum | `overdue, due_today, due_3d, due_7d, waiting_on_others, closing_soon, prerequisite_missing` | `0014` — all 7 types | ✅ Complete |

---

### Services

| Service | Expected | Found | Status |
|---------|----------|-------|--------|
| `timelineMilestones.service.ts` | Full milestone lifecycle | 676 lines — `src/services/timelineMilestones.service.ts` | ✅ Complete |
| `generateTimelineMilestones()` | Auto-generate ~20 milestones on offer acceptance; idempotent | Lines 273-372; 4 phases, 20 templates | ✅ Complete |
| `regenerateTimelineMilestones()` | Recalculate due dates when closing date changes | Lines 388-439 | ✅ Complete |
| `updateMilestoneStatus()` | `pending→in_progress→complete/waived`; sets `completed_at` | Lines 471-497 | ✅ Complete |
| `addMilestoneNote()` | Timestamped notes, append semantics | Lines 499-522 | ✅ Complete |
| `uploadMilestoneDocument()` | Upload to `deal-documents` bucket with RLS path | Lines 524-556 | ✅ Complete |
| `getMilestoneDocument()` | Signed URL retrieval (60s expiry) | Lines 558-572 | ✅ Complete |
| `addCustomMilestone()` | User-created milestones (no template constraints) | Lines 582-611 | ✅ Complete |
| `updateMilestoneDueDate()` | Change due date; reset all `alert_sent_*` flags | Lines 613-641 | ✅ Complete |
| `sendNudge()` | Set `last_nudge_sent_at`; return responsible party contact | Lines 643-675 | ✅ Complete |
| `notifications.service.ts` | Fetch/manage notifications | 166 lines — `src/services/notifications.service.ts` | ✅ Complete |
| `getUnread()` / `getAll()` | Active (non-dismissed, non-snoozed), priority sorted | Lines 26-64 | ✅ Complete |
| `markRead()` / `markAllRead()` | Set `is_read=true` single + bulk | Lines 66-101 | ✅ Complete |
| `dismiss()` / `snooze(id, hours)` | Permanent hide / snooze until future timestamp | Lines 103-142 | ✅ Complete |
| `getUnreadCount()` | Badge count | Lines 144-162 | ✅ Complete |
| `dailyBrief.service.ts` | Daily Brief orchestration | 307 lines — `src/services/dailyBrief.service.ts` | ✅ Complete |
| `getDailyBriefData()` | Orchestrate 6 data streams | Lines 97-121 | ✅ Complete |
| `getOverdueMilestones()` | Pending milestones with `due_date < today` on active deals | Lines 123-145 | ✅ Complete |
| `getDueSoon(days)` | Milestones due today through today+N | Lines 147-180 | ✅ Complete |
| `getWaitingOnOthers()` | `in_progress`, non-`buyer_agent`, no nudge >48h | Lines 182-238 | ✅ Complete |
| `getDealHealthCards()` | Phase progress, next milestone, overdue count per active deal | Lines 240-303 | ✅ Complete |
| `generate-alerts` edge function | Scheduled alert dispatch (deadline escalation + waiting + closing-soon) | `supabase/functions/generate-alerts/index.ts` 313 lines | ✅ Complete |

---

### Components / UI

| Component | Expected | Found | Status |
|-----------|----------|-------|--------|
| `Dashboard.tsx` | Daily Brief hub | `src/features/dashboard/Dashboard.tsx` lines 1-104 | ✅ Complete |
| `useDailyBrief.ts` | Fetch + auto-refresh every 5 min | `src/features/dashboard/hooks/useDailyBrief.ts` lines 1-62 | ✅ Complete |
| `DailyBriefHeader.tsx` | Greeting card with attention count + active deal count | `src/features/dashboard/components/DailyBriefHeader.tsx` | ✅ Complete |
| `OverdueZone.tsx` | Red card: overdue milestones with days-late badge | `src/features/dashboard/components/OverdueZone.tsx` lines 1-63 | ✅ Complete |
| `HorizonZone.tsx` | Amber card: due in 1-3 days | `src/features/dashboard/components/HorizonZone.tsx` lines 1-56 | ✅ Complete |
| `ThisWeek.tsx` | Milestones due in 4-7 days | `src/features/dashboard/components/ThisWeek.tsx` | ✅ Complete |
| `WaitingOnOthers.tsx` | Counterparty tracking, nudge status | `src/features/dashboard/components/WaitingOnOthers.tsx` lines 1-65 | ✅ Complete |
| `DealHealthCard.tsx` | Phase progress, next milestone, closing countdown | `src/features/dashboard/components/DealHealthCard.tsx` | ✅ Complete |
| `TimelineTab.tsx` | 4-phase layout in DealDetail; filter (all/overdue/my_action/pending/complete); add custom milestone | `src/features/deals/components/TimelineTab.tsx` lines 1-411 | ✅ Complete |
| `MilestoneCard.tsx` | Status badges, countdown, notes, document upload, contingency link | `src/features/deals/components/MilestoneCard.tsx` lines 1-267 | ✅ Complete |
| `PhaseHeader.tsx` | Phase title, completion count, health indicator, collapse toggle | `src/features/deals/components/PhaseHeader.tsx` | ✅ Complete |
| `ClosingCountdown.tsx` | Sticky countdown to `projected_close_date` | `src/features/deals/components/ClosingCountdown.tsx` | ✅ Complete |
| `useTimelineTab.ts` | Load milestones, setStatus, addNote, uploadDocument, createCustom | `src/features/deals/hooks/useTimelineTab.ts` lines 1-133 | ✅ Complete |
| `AlertCenter.tsx` | Navbar popover: unread badge, priority sort, snooze/dismiss/mark-read | `src/features/deals/components/AlertCenter.tsx` lines 1-128 | ✅ Complete |
| `useAlertCenter.ts` | Load + manage notifications | `src/features/deals/hooks/useAlertCenter.ts` lines 1-76 | ✅ Complete |
| `AlertCenter` in Navbar | Bell icon with badge | `src/components/layout/Navbar.tsx` line 4, 28 | ✅ Complete |
| Dedicated `/timeline` route | Org-wide timeline page (Sprint 4 spec) | Not found — timeline exists only as a tab inside `/deals/:id` | ❌ Missing |

---

### Known Issues / Gaps

1. **`responsible_party = 'other'` UI/DB mismatch** — `TimelineTab.tsx` line 379 allows users to set `responsible_party = 'other'` for custom milestones, but the DB constraint in `0006` lines 408-417 only permits `buyer, seller, buyer_agent, seller_agent, lender, title_co, inspector`. Any save with `'other'` will throw a DB error. Fix: add `'other'` to constraint via new migration, or remove from UI.
2. **No dedicated `/timeline` route** — Sprint 4 spec calls for a standalone timeline feature page; current implementation only surfaces it as the "milestones" tab inside `DealDetail`. Org-wide timeline view across all active deals is absent.
3. **`AlertCenter` hook has no polling** — `useAlertCenter.ts` fetches on mount only; `useDailyBrief.ts` polls every 5 min. Users will see stale notification badge until page refresh or re-mount.
4. **`generate-alerts` edge function has no cron schedule configured** — function exists at `supabase/functions/generate-alerts/index.ts` but no cron trigger was found in migrations or config; alerts will not fire automatically unless manually invoked or scheduled externally.

---

## Sprint 5 — Commission Calculator
**Status:** ✅ Complete
**Completion Estimate: 100%**

---

### DB / Migrations

| Feature | Expected | Found | Status |
|---------|----------|-------|--------|
| Broker settings columns in `user_preferences` | `broker_model, broker_split_pct, annual_cap_amount, cap_anniversary_date, franchise_fee_enabled, franchise_fee_pct, franchise_fee_cap, default_transaction_fee, eo_fee_type, eo_fee_amount, default_tc_fee, default_rental_commission_type, default_rental_commission_rate, default_rental_flat_fee` | All 14 columns — `0015` | ✅ Complete |
| `commissions` table extension | 24 waterfall tracking columns: `deal_id, commission_side, commission_type, commission_rate, sale_price, gross_commission, referral_fee_pct, referral_fee_amount, post_referral_gci, broker_split_pct, broker_dollar, capped_at_close, franchise_fee_amount, transaction_fee, eo_fee, tc_fee, other_fees, net_commission, closing_date` + `other_fees_notes` | All present — `0016`, `other_fees_notes` in `0020` | ✅ Complete |
| Commission side + type constraints | `commission_side IN ('listing','buyer','dual','rental_listing','rental_tenant')` / `commission_type IN ('percentage','flat_fee')` | Both constraints — `0016` | ✅ Complete |
| `rpc_record_commission_and_close_deal` RPC | Atomic: record commission + close deal + update property status + tag lead + create notification | Full SECURITY DEFINER function — `0017`, `0018`, `0019`; nullable `property_id` support | ✅ Complete |
| YTD query indexes | `commissions_user_ytd_idx (org_id, user_id, closing_date)`, `commissions_closing_date_idx`, `commissions_deal_id_idx` | All present — `0016` | ✅ Complete |
| RLS on `commissions` | Org-scoped SELECT/INSERT/UPDATE; DELETE blocked | Remediated permissive policies with `org_id + deleted_at` filters — `0016` | ✅ Complete |

---

### Services

| Service | Expected | Found | Status |
|---------|----------|-------|--------|
| `commissionCalculator.ts` (pure) | Waterfall logic: `calculateCommission()`, `calculateBrokerDollar()`, `calculateFranchiseFee()`, `resolveDealGCI()`, `calculateRentalCommission()` | All 5 functions — `src/services/commissionCalculator.ts` 198 lines | ✅ Complete |
| `commissions.service.ts` | `getYTDSummary()`, `getCapProgress()`, `getForecast()`, `recordCommission()`, `getCommissionHistory()`, `exportCSV()` + 13 more | 19 public methods — `src/services/commissions.service.ts` 845 lines | ✅ Complete |
| Cap reset calculation | `getCurrentCapYearStart()`, `getCapResetDate()` — handles custom anniversary vs calendar year | `commissions.service.ts` lines 30-56 | ✅ Complete |
| Broker settings fetch | `getBrokerSettings()` with YTD cap context | `commissions.service.ts` lines 58-123 | ✅ Complete |
| `userPreferences.service.ts` | `updateBrokerSettings()`, `getBrokerSettings()`, model-specific validation (e.g. `flat_fee_100pct` nullifies split %) | 252 lines — `src/services/userPreferences.service.ts` | ✅ Complete |
| Rental commission logic | `calculateRentalDealGCI()` with `one_month / annual_pct / flat_fee` types + co-agent split | `commissionCalculator.ts` lines 168-197 | ✅ Complete |

---

### Components / UI

| Component | Expected | Found | Status |
|-----------|----------|-------|--------|
| `BrokerSettingsForm.tsx` | Broker model, split %, cap, E&O, franchise, transaction, TC, rental defaults; live preview | 470+ lines — `src/features/profile/components/BrokerSettingsForm.tsx` | ✅ Complete |
| `BrokerSettingsSchema` | Zod with `superRefine` for model-specific rules | `src/features/profile/schemas/brokerSettingsSchema.ts` 47 lines | ✅ Complete |
| `CapProgressCard.tsx` | YTD $, cap %, remaining, deals/GCI to cap, reset date, expandable history | 84 lines — `src/features/profile/components/CapProgressCard.tsx` | ✅ Complete |
| `CommissionSheet.tsx` | Per-deal commission entry: side selector, type, referral, custom fees, closing date, waterfall preview | 427 lines — `src/features/deals/components/CommissionSheet.tsx` | ✅ Complete |
| `CommissionWaterfall.tsx` | GCI → post-referral → broker $ → fees → net flow display | 35 lines — `src/features/deals/components/CommissionWaterfall.tsx` | ✅ Complete |
| `CommissionSheetSchema` | Zod for commission form; validates `commission_type`, side, referral, closing date ≤ today | `src/features/deals/schemas/commissionSheetSchema.ts` 55 lines | ✅ Complete |
| `CommissionDashboard.tsx` | Unified view: YTD stats, sales/rental comparison, trends, history, cap tracker | 30 lines — `src/features/finance/components/CommissionDashboard.tsx` | ✅ Complete |
| `YTDStatsRow.tsx` | 5-card grid: GCI, net, deal count, avg per deal, cap % | `src/features/finance/components/YTDStatsRow.tsx` | ✅ Complete |
| `SalesVsRentalCard.tsx` | Side-by-side GCI/net: sales vs rental | `src/features/finance/components/SalesVsRentalCard.tsx` | ✅ Complete |
| `MonthlyGCIChart.tsx` | Line chart — GCI/net trend over year | 120+ lines — `src/features/finance/components/MonthlyGCIChart.tsx` | ✅ Complete |
| `CommissionHistoryTable.tsx` | Filterable (type, side, month), sortable, paginated, inline edit, CSV export | 500+ lines — `src/features/finance/components/CommissionHistoryTable.tsx` | ✅ Complete |
| `CommissionTrends.tsx` | Historical GCI/net Recharts visualization | 150+ lines — `src/features/finance/components/CommissionTrends.tsx` | ✅ Complete |
| `CommissionByPropertyType.tsx` | Pie/bar: rental vs sale breakdown | 180+ lines | ✅ Complete |
| `CommissionByClientType.tsx` | Breakdown by client segment | 150+ lines | ✅ Complete |
| `IncomeForecastCard.tsx` | Dashboard widget: committed this month, 90-day weighted, active deals | 53 lines — `src/features/dashboard/components/IncomeForecastCard.tsx` | ✅ Complete |
| `useYTDDashboard.ts` | Parallel fetch: `getYTDSummary()`, `getMonthlyCommissionData()`, `getCapProgress()` | `src/features/finance/hooks/useYTDDashboard.ts` 36 lines | ✅ Complete |
| `useCommissionForecast.ts` | Calls `commissionsService.getForecast()` | `src/features/dashboard/hooks/useCommissionForecast.ts` 35 lines | ✅ Complete |
| Commission page route | `/finance?tab=commission` or `/commission` | Integrated under `/finance` tab; linked from `IncomeForecastCard` | ✅ Complete |
| Broker settings in profile | `/profile` → BrokerSettingsForm | Integrated in `PreferencesSection` | ✅ Complete |

---

### Known Issues / Gaps

None identified. Sprint 5 is fully implemented:
- Waterfall covers all 7 deduction layers: referral → broker split → cap adjustment → franchise fee → transaction fee → E&O → TC fee
- Cap tracker handles both calendar-year and custom anniversary resets
- Dual-side commission supports listing, buyer, dual, rental_listing, and rental_tenant sides
- Atomic RPC (`rpc_record_commission_and_close_deal`) closes deal, updates property status, tags lead, and creates notification in one transaction
- Forecast uses weighted pipeline projection from active deals

---

## Sprint 6A — Lease Agreement Wizard
**Status:** ✅ Complete
**Completion Estimate: 100%**

---

### DB / Migrations

| Feature | Expected | Found | Status |
|---------|----------|-------|--------|
| `contracts` table extensions | `lease_type, after_term_action, termination_notice_days, contract_type, landlord_id, prior_contract_id, pdf_generated_at, wizard_completed` | All present with constraints — `0021` | ✅ Complete |
| `properties.year_built` | Idempotent integer (1600-2100) for lead paint detection | Added in `0021`; used in step 8 disclosure logic | ✅ Complete |
| `lease_details` table | 1:1 with `contracts`; 118 columns covering all 8 wizard steps | Full table — `0022_sprint6a_lease_details_and_amendments.sql` | ✅ Complete |
| Lead paint columns | `lead_paint_disclosure_required, lead_paint_known_hazards, lead_paint_hazard_description, lead_paint_records_available, lead_paint_records_description, lead_paint_pamphlet_delivered, lead_paint_pamphlet_delivery_method, lead_paint_pamphlet_delivery_date` | All 8 columns — `0022` lines 110-117 | ✅ Complete |
| `security_deposit_return_days` | Integer (1-90), default 21 days | `0022` line 50 | ✅ Complete |
| `lease_amendments` table | Rental amendment history | Created in `0022` | ✅ Complete |
| `rpc_create_lease_contract` | Atomic insert: `contracts` + `lease_details`; org/user/property validation | SECURITY DEFINER — `0024` | ✅ Complete |
| RLS on `lease_details` | SELECT/INSERT/UPDATE/DELETE scoped to `org_id + user_id` | All 4 policies — `0022` lines 174-195 | ✅ Complete |
| Indexes | `lease_details (org_id, property_state, user_id)`; `contracts (landlord_id, prior_contract_id)` | `0022` + `0029_sprint6a_lease_missing_indexes` | ✅ Complete |

---

### Services

| Service | Expected | Found | Status |
|---------|----------|-------|--------|
| `leaseAgreement.service.ts` | `createLeaseContract()` via RPC, `getLeaseDetailsByContractId()`, `updateLeaseDetails()`, `regeneratePdf()` | All implemented — `src/services/leaseAgreement.service.ts` | ✅ Complete |
| `leaseAgreementPdf.service.ts` | US Letter PDF: cover, terms summary, lead paint disclosure page, signature blocks for all parties | 381 lines — `src/services/leaseAgreementPdf.service.ts`; EPA/HUD lead warning from `src/templates/usLeasePdfStatutory.ts` | ✅ Complete |
| Statutory text (`usLeasePdfStatutory.ts`) | `LEAD_WARNING_STATEMENT_LEASE`, `LEAD_DISCLOSURE_CITATION` (42 U.S.C. § 4852d), `EPA_LEAD_PAMPHLET_TITLE` | All 3 constants exported | ✅ Complete |

---

### Components / UI

| Component | Expected | Found | Status |
|-----------|----------|-------|--------|
| `LeaseWizardPage.tsx` | Entry point; `OwnerOnlyRoute`; route `/contracts/rent/lease-wizard` | `src/features/contracts/leaseWizard/LeaseWizardPage.tsx`; routed in `App.tsx` line 168 | ✅ Complete |
| `LeaseWizard.tsx` | Progress bar, back/next nav, discard dialog, localStorage draft, PDF download, CRM save | 246 lines — full shell; draft on 500ms debounce, nav to detail on save | ✅ Complete |
| `useLeaseWizard.ts` | Form state, step nav, draft persistence, per-step + full-form validation, reset | 186 lines — `src/features/contracts/leaseWizard/hooks/useLeaseWizard.ts` | ✅ Complete |
| Step 1 — Property | Property select, address, residence type, `year_built`, timezone auto-calc from state | `Step1Property.tsx` — lead paint trigger at line 39, timezone calc lines 74-75 | ✅ Complete |
| Step 2 — Parties | Landlord, tenant 1, tenant 2 (toggle), additional occupants (dynamic array), co-signer (toggle + role: co_signer/guarantor) | `Step2Parties.tsx` 665 lines — tenant 2 lines 401-514, co-signer lines 564-662 | ✅ Complete |
| Step 3 — Lease Term | Lease type (standard/month-to-month), start/end dates, `after_term_action`, `termination_notice_days` | `Step3LeaseTerm.tsx` | ✅ Complete |
| Step 4 — Financials | Rent, deposit, `security_deposit_return_days`, late fees (none/fixed/interest), NSF, early move-in, prepaid rent, parking, amount-due-at-signing summary | `Step4Financials.tsx` 579 lines; `amountDueAtSigning` via `useMemo` lines 38-59 | ✅ Complete |
| Step 5 — Payment & Utilities | Payment methods (ACH/cash/check/credit/PayPal/Venmo/Zelle/other) with conditional handle/email fields; utilities landlord covers (checkbox array) | `Step5PaymentUtilities.tsx` | ✅ Complete |
| Step 6 — Property Details | Furnished, appliances, common areas, parking, move-in inspection | `Step6PropertyDetails.tsx` | ✅ Complete |
| Step 7 — Policies | Pets (count/types/weight/deposit/refundable), subletting (3 options), renters insurance + coverage amount, smoking | `Step7Policies.tsx` | ✅ Complete |
| Step 8 — Notices & Disclosures | Landlord/tenant notice address; lead paint section (auto-shown if `year_built < 1978`); hazards tri-state; pamphlet delivery method + date; `additional_terms` (max 2000 chars) | `Step8NoticesDisclosures.tsx` 326 lines; `showLeadPaintDisclosure()` lines 32-34; federal red alert banner lines 101-104 | ✅ Complete |
| Zod schemas (per step) | `LEASE_WIZARD_STEP_SCHEMAS[1-8]` with `superRefine` cross-field rules | `leaseWizardStepSchemas.ts` lines 17-415; step 8 requires `pamphlet_delivered` if pre-1978 (lines 366-402) | ✅ Complete |
| `leaseAgreementForm.schema.ts` | Full form Zod schema with all cross-field refinements | Lines 52-443; base shape + `superRefine` for complete 8-step validation | ✅ Complete |
| `leaseAgreementFormDefaults.ts` | All 60+ fields initialized; CA as default state; 21-day deposit return | Lines 13-140; deposit default line 69 | ✅ Complete |
| Co-tenant + co-signer | Schema fields, form defaults, step 2 UI, validation, PDF output | Fully wired across schema (lines 96-104), defaults (lines 55-63), `Step2Parties.tsx`, step schemas (lines 70-117), PDF service (lines 180-193) | ✅ Complete |
| Lead paint auto-detection | `year_built < 1978` → show federal disclosure, require `pamphlet_delivered` | `Step8NoticesDisclosures.tsx` lines 32-46 (detect) + 101-299 (UI); step 8 schema enforces (lines 366-402) | ✅ Complete |
| PDF download | Validate full form → `LeaseAgreementPdfService.generateBlob()` → browser download | `LeaseWizard.tsx` lines 83-99 | ✅ Complete |
| CRM save | Validate → `createLeaseContract()` RPC → upload PDF to `contract_pdfs` bucket → navigate to detail | `LeaseWizard.tsx` lines 101-151 | ✅ Complete |

---

### Known Issues / Gaps

1. **State-specific deposit return days not auto-populated** — the wizard defaults to 21 days (`leaseAgreementFormDefaults.ts` line 69) regardless of selected state; CA/NY/TX values (21/14/30 days) are not auto-filled when state changes in step 1. User must manually adjust. No DB or validation enforces the correct value.
2. **Deposit amount caps not enforced** — CA/NY/TX have statutory deposit caps (e.g. CA typically 1-2× rent). Wizard accepts any amount; no state-specific cap validation in step 4 schema.
3. **PDF outputs value summaries, not full clause language** — PDF renders structured field values (late fee amount, pet deposit, etc.) rather than full legal boilerplate text. Acceptable for MVP; clause language can be added via template layer later.
4. **`lead_paint_disclosure_required` not auto-set to `true`** — wizard detects pre-1978 and shows the section, but does not programmatically set the field; user must manually check `pamphlet_delivered`. Works per design (validation enforces it), but UX could auto-tick the flag.

---

## Sprint 6B — Purchase Agreement Wizard
**Status:** ✅ Complete
**Completion Estimate: 100%**

---

### DB / Migrations

| Feature | Expected | Found | Status |
|---------|----------|-------|--------|
| `contracts` purchase extensions | `effective_date, closing_date, purchase_price, earnest_money_amount, earnest_money_due_date, governing_law_state, deal_status, buyer_name_2, seller_name_2, seller_id` | All present — `0025_sprint6b_contracts_purchase_columns.sql` | ✅ Complete |
| `purchase_details` table | 120+ columns; 1:1 with `contracts`; all 9 wizard steps covered | Full table — `0026_sprint6b_purchase_details_and_offer_rounds.sql` lines 8-191 | ✅ Complete |
| Property type constraint | `single_family, condominium, pud, duplex, triplex, fourplex, other` | `0026` lines 129-140 | ✅ Complete |
| Financing type constraint | `all_cash, bank_financing, seller_financing` | `0026` lines 142-150 | ✅ Complete |
| Bank loan type constraint | `conventional, fha, va, other` | `0026` lines 166-171 | ✅ Complete |
| Title type constraint | `tenancy_in_common, joint_tenancy, tenancy_by_entirety` | `0026` lines 151-160 | ✅ Complete |
| FHA/VA addendum storage | `fha_addendum_uploaded, fha_addendum_path, va_addendum_uploaded, va_addendum_path` | `0026` lines 71-74 | ✅ Complete |
| Earnest money fields | `earnest_money_escrow_required, earnest_money_deadline_time, earnest_money_return_days` | `0026` lines 60-61, 109 | ✅ Complete |
| Contingency fields | `contingent_on_other_property, contingent_property_address, contingent_property_days` | `0026` lines 83-85 | ✅ Complete |
| Inspection contingency | `inspection_contractor_deadline_date/time, inspection_disclosures_deadline_date/time, inspection_negotiation_days` | `0026` lines 97-101 | ✅ Complete |
| Appraisal contingency | `appraisal_contingency, appraisal_negotiation_days` | `0026` lines 103-104 | ✅ Complete |
| Survey/title contingency | `survey_buyer_notification_days, survey_seller_remedy_days, mineral_rights_transferred, title_buyer_review_days, title_seller_remedy_days` | `0026` lines 91-95 | ✅ Complete |
| Lead paint columns | `lead_paint_disclosure_required` + 6 disclosure detail columns | `0026` lines 111-117 | ✅ Complete |
| Custom addendums | `custom_addendums` array (max 5) | `0026` line 119 | ✅ Complete |
| `tenant_id` nullable for purchase | DROP NOT NULL constraint | `0027_sprint6b_contracts_tenant_nullable_purchase.sql` | ✅ Complete |
| `rpc_create_purchase_contract` | Atomic: contracts + purchase_details + deal + offer_negotiations + offer_round + milestones; org owner check | Full SECURITY DEFINER — `0028_rpc_create_purchase_contract.sql` lines 3-394 | ✅ Complete |
| `offer_rounds.contract_id` FK | Links offer round back to purchase agreement | Added in `0026` line 240 | ✅ Complete |
| RLS on `purchase_details` | SELECT/INSERT/UPDATE/DELETE scoped to `org_id + user_id` | `0026` lines 212-233 | ✅ Complete |

---

### Services

| Service | Expected | Found | Status |
|---------|----------|-------|--------|
| `purchaseAgreement.service.ts` | Full lifecycle: create, read, update, counter-offer, close, cancel | 906 lines — `src/services/purchaseAgreement.service.ts` | ✅ Complete |
| `createPurchaseContract()` | Atomic RPC call | Lines 198-220 | ✅ Complete |
| `syncPurchaseContractFromWizardComplete()` | Sync updated form to contract + purchase_details + deal | Lines 226-310 | ✅ Complete |
| `addCounterOffer()` | Create round N+1, supersede round N, regenerate PDF | Lines 398-462 | ✅ Complete |
| `uploadFHAAddendum()` / `uploadVAAddendum()` | Upload PDF to storage, set DB flags, mark `wizard_completed` | Lines 750-836 | ✅ Complete |
| `closeDeal()` / `cancelDeal()` | Update `deal_status`, set property to Sold/Available, create notification | Lines 599-687 | ✅ Complete |
| `regeneratePurchaseAgreementPdf()` | Re-render PDF from form (counter-offer flow) | Lines 851-868 | ✅ Complete |
| `purchaseAgreementPdf.service.ts` | Multi-page US Letter PDF: all sections + lead paint addendum + per-page initials footer + signature page | 540 lines — `src/services/purchaseAgreementPdf.service.ts` | ✅ Complete |
| `purchaseFormFromDb.ts` | Rebuild form object from DB rows for PDF regeneration | 157 lines — `src/services/purchaseFormFromDb.ts` | ✅ Complete |

---

### Components / UI

| Component | Expected | Found | Status |
|-----------|----------|-------|--------|
| `PurchaseWizard.tsx` | 9-step shell: progress bar, back/next nav, discard dialog, localStorage draft (500ms debounce), PDF download, save sequence | 260+ lines | ✅ Complete |
| `usePurchaseWizard.ts` | Form state, step nav, draft persistence, per-step + full-form validation | Draft save lines 15-46 | ✅ Complete |
| Step 1 — Property | Address, property type, `year_built`, land, timezone | `Step1Property.tsx` | ✅ Complete |
| Step 2 — Parties | Buyer 1-2, seller 1-2, mailing addresses, agents, title type, effective date | `Step2Parties.tsx` | ✅ Complete |
| Step 3 — Personal Property | Inclusions/exclusions description | `Step3PersonalProperty.tsx` | ✅ Complete |
| Step 4 — Earnest Money | Amount, due date/time, escrow flag, return days, purchase price, offer expiration | `Step4EarnestMoney.tsx` | ✅ Complete |
| Step 5 — Financing | 3 branches (all-cash / bank [conventional/FHA/VA/other] / seller financing) with branch-specific conditional fields; FHA/VA upload flags | `Step5Financing.tsx` | ✅ Complete |
| Step 6 — Closing | Closing date/time, costs allocation (buyer/seller/both), title company, title review/remedy days, survey days | `Step6Closing.tsx` | ✅ Complete |
| Step 7 — Conditions | Sale contingency, inspection deadlines, appraisal contingency, mineral rights, governing law | `Step7Conditions.tsx` | ✅ Complete |
| Step 8 — Legal & Defaults | Governing law state selector, offer expiration date/time | `PurchaseStep8Legal.tsx` | ✅ Complete |
| Step 9 — Disclosures & Review | Lead paint disclosure, FHA/VA addendum file uploads, custom addendums array, additional terms, full-form validation | `PurchaseStep9Disclosures.tsx` | ✅ Complete |
| `purchaseWizardStepSchemas.ts` | 9 per-step Zod schemas; `z.discriminatedUnion` for financing branch; cross-field date order validation | 447 lines; financing discriminator lines 435-447 | ✅ Complete |
| `purchaseAgreementForm.schema.ts` | Full form schema with cross-field date chain validation (effective → earnest → inspection → closing) | 470+ lines; date chain lines 274-315 | ✅ Complete |
| `purchaseAgreementFormDefaults.ts` | All 150+ fields initialized | 150+ lines | ✅ Complete |
| `PurchaseContractDetailPage.tsx` | Route `/contracts/purchase/:id` | `App.tsx` line 191 | ✅ Complete |
| `PurchaseWizardPage.tsx` | Route `/purchase-wizard` | `App.tsx` line 182 | ✅ Complete |
| FHA/VA wizard completion gating | If FHA/VA selected + no addendum file uploaded → `deal_status = 'incomplete'` | `PurchaseWizard.tsx` lines 175-207 | ✅ Complete |
| Counter-offer flow | Update price/terms → new offer round → regenerate PDF → re-upload versioned | `addCounterOffer()` + `regeneratePurchaseAgreementPdf()` | ✅ Complete |
| PDF versioned storage | `purchases/{org_id}/{contract_id}/v{offerNumber}_{timestamp}.pdf` | Versioned path in PDF upload logic | ✅ Complete |

---

### Known Issues / Gaps

None identified. Sprint 6B is fully implemented:
- RPC atomically creates contracts + purchase_details + deal + offer_negotiations + first offer_round + up to 6 seeded milestones in a single transaction
- FHA/VA addendum gating marks `deal_status = 'incomplete'` when file is missing, preventing a false "complete" state
- Counter-offer flow is wired end-to-end: new round creation → prior round superseded → PDF regenerated → re-uploaded with version suffix
- Per-page initials footer rendered on every PDF page; lead paint addendum conditionally appended
