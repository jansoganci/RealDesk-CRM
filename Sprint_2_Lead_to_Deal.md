

**SPRINT 2: LEAD TO DEAL**

RealDesk CRM — US Market

*Lead Pipeline \+ Buyer-Agent Agreement \+ Showing Log*

| Sprint | 2 of 8 — Lead to Deal |
| :---- | :---- |

| Duration | Weeks 3–4 (10 working days) |
| :---- | :---- |

| Goal | Transform the inquiry system into a full lead pipeline. Add buyer-agent agreement tracking and showing logs. This sprint creates the entry point for every deal. |
| :---- | :---- |

| Branch | feature/sprint-2-lead-pipeline |
| :---- | :---- |

| Depends On | Sprint 1 complete (US address, phone, currency, locale) |
| :---- | :---- |

| KEY DECISION: INQUIRY → LEAD EVOLUTION |
| :---- |

## **Why We Evolve Inquiries, Not Build Separate Leads**

The existing property\_inquiries table already has: name, phone, email, type (rental/sale), budget range, city/district preference, status tracking, and auto-matching to properties. Instead of creating a separate leads table and duplicating all this logic, we extend property\_inquiries with new fields and a richer status pipeline.

### **What Changes**

| Aspect | Current (Inquiry) | New (Lead Pipeline) |
| :---- | :---- | :---- |
| Status values | active → matched → contacted → closed | new → contacted → qualified → active → under\_contract → closed\_won → closed\_lost |
| Source tracking | None | lead\_source field: zillow, realtor\_com, referral, sign\_call, social\_media, cold\_call, open\_house, other |
| Sidebar label | Inquiries (Search icon) | Leads (UserPlus icon) |
| Route | /inquiries | /leads (keep /inquiries as redirect) |
| Buyer-Agent link | None | buyer\_agent\_agreement\_id FK (nullable) |
| Matching | Auto-match to properties | Keep auto-match, also allow manual match |
| UI | Simple list \+ dialog | Kanban board view \+ list view toggle |

* **No data migration needed** — existing inquiry rows keep working. Old statuses map: active→new, matched→active, contacted→contacted, closed→closed\_won

* **Auto-matching preserved** — the matchInquiryToProperty() algorithm stays, just runs on new lead entries too

* **Backward compatible** — /inquiries route redirects to /leads, old bookmarks still work

| SPRINT 2 TASK OVERVIEW |
| :---- |

| Task | What It Does | Files Created/Modified | Est. |
| :---- | :---- | :---- | :---- |
| T1: DB Migration | Add lead\_source, expand status enum, create buyer\_agent\_agreements \+ showing\_logs tables | 1 migration file | 3h |
| T2: Lead Service | Extend inquiries.service.ts with new statuses, source tracking, pipeline queries | inquiries.service.ts | 3h |
| T3: Lead Pipeline UI | Replace inquiry list with kanban \+ list view, lead detail panel | features/leads/ (new) | 5h |
| T4: Lead Form Schema | Extend Zod schema with source, new statuses, US phone/address | leads/schemas/ | 2h |
| T5: Buyer-Agent Agreement | Service \+ UI for agreement tracking inside lead detail | services/ \+ features/leads/ | 4h |
| T6: Showing Log | Service \+ UI for recording property showings per lead | services/ \+ features/leads/ | 3h |
| T7: Routing & Nav | Add routes, sidebar nav, redirects, i18n keys | constants, App, Sidebar | 2h |

| TOTAL: \~22 hours \= 3–4 days with Cursor Agent |
| :---- |

| TASK 1: DATABASE MIGRATION |
| :---- |

| Depends On | Sprint 1 migration applied |
| :---- | :---- |

| Creates | supabase/migrations/\[timestamp\]\_sprint2\_lead\_pipeline.sql |
| :---- | :---- |

| Estimated | 3 hours |
| :---- | :---- |

### **Cursor Prompt**

| Create a new Supabase migration file: supabase/migrations/\[timestamp\]\_sprint2\_lead\_pipeline.sql \#\# 1\. EXTEND property\_inquiries table (evolve into leads): ALTER TABLE property\_inquiries   ADD COLUMN IF NOT EXISTS lead\_source TEXT DEFAULT 'other',   ADD COLUMN IF NOT EXISTS lead\_score INTEGER DEFAULT 0,   ADD COLUMN IF NOT EXISTS budget\_min NUMERIC,   ADD COLUMN IF NOT EXISTS budget\_max NUMERIC,   ADD COLUMN IF NOT EXISTS preferred\_state TEXT,   ADD COLUMN IF NOT EXISTS preferred\_zip TEXT,   ADD COLUMN IF NOT EXISTS timeline TEXT,   ADD COLUMN IF NOT EXISTS pre\_approved BOOLEAN DEFAULT FALSE,   ADD COLUMN IF NOT EXISTS buyer\_agent\_agreement\_id UUID,   ADD COLUMN IF NOT EXISTS last\_contacted\_at TIMESTAMPTZ,   ADD COLUMN IF NOT EXISTS converted\_at TIMESTAMPTZ; \-- Update status constraint to support new pipeline stages \-- Current: active, matched, contacted, closed \-- New: new, contacted, qualified, active, under\_contract, \--       closed\_won, closed\_lost \-- Drop old constraint and add new one: ALTER TABLE property\_inquiries   DROP CONSTRAINT IF EXISTS valid\_inquiry\_status; ALTER TABLE property\_inquiries   ADD CONSTRAINT valid\_inquiry\_status   CHECK (status IN (     'new', 'contacted', 'qualified', 'active',     'under\_contract', 'closed\_won', 'closed\_lost',     \-- keep old values for backward compat during migration     'matched', 'closed'   )); \-- Change default from 'active' to 'new' ALTER TABLE property\_inquiries   ALTER COLUMN status SET DEFAULT 'new'; \-- Add lead\_source constraint ALTER TABLE property\_inquiries   ADD CONSTRAINT valid\_lead\_source   CHECK (lead\_source IN (     'zillow', 'realtor\_com', 'referral', 'sign\_call',     'social\_media', 'cold\_call', 'open\_house',     'website', 'other'   )); \-- Index for pipeline queries CREATE INDEX IF NOT EXISTS idx\_inquiries\_lead\_source   ON property\_inquiries(lead\_source); CREATE INDEX IF NOT EXISTS idx\_inquiries\_status\_org   ON property\_inquiries(status, org\_id); \#\# 2\. CREATE buyer\_agent\_agreements table: CREATE TABLE IF NOT EXISTS buyer\_agent\_agreements (   id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),   lead\_id UUID NOT NULL REFERENCES property\_inquiries(id) ON DELETE CASCADE,   commission\_rate NUMERIC(5,2) NOT NULL DEFAULT 2.5,   commission\_type TEXT NOT NULL DEFAULT 'percentage',   sign\_date DATE NOT NULL,   expiration\_date DATE NOT NULL,   scope TEXT,   exclusivity\_type TEXT NOT NULL DEFAULT 'exclusive',   status TEXT NOT NULL DEFAULT 'active',   notes TEXT,   user\_id UUID NOT NULL,   org\_id UUID NOT NULL,   created\_at TIMESTAMPTZ DEFAULT now(),   updated\_at TIMESTAMPTZ DEFAULT now(),   deleted\_at TIMESTAMPTZ,   CONSTRAINT valid\_baa\_commission\_type CHECK (     commission\_type IN ('percentage', 'flat\_fee', 'tiered')   ),   CONSTRAINT valid\_baa\_exclusivity CHECK (     exclusivity\_type IN ('exclusive', 'non\_exclusive')   ),   CONSTRAINT valid\_baa\_status CHECK (     status IN ('draft', 'sent', 'active', 'expired', 'renewed', 'terminated')   ),   CONSTRAINT valid\_baa\_dates CHECK (expiration\_date \> sign\_date) ); ALTER TABLE buyer\_agent\_agreements ENABLE ROW LEVEL SECURITY; CREATE POLICY "baa\_select" ON buyer\_agent\_agreements FOR SELECT   USING (org\_id \= (SELECT org\_id FROM profiles WHERE id \= auth.uid())); CREATE POLICY "baa\_insert" ON buyer\_agent\_agreements FOR INSERT   WITH CHECK (org\_id \= (SELECT org\_id FROM profiles WHERE id \= auth.uid())); CREATE POLICY "baa\_update" ON buyer\_agent\_agreements FOR UPDATE   USING (org\_id \= (SELECT org\_id FROM profiles WHERE id \= auth.uid())); CREATE POLICY "baa\_delete" ON buyer\_agent\_agreements FOR DELETE   USING (org\_id \= (SELECT org\_id FROM profiles WHERE id \= auth.uid())); \-- FK from property\_inquiries to buyer\_agent\_agreements ALTER TABLE property\_inquiries   ADD CONSTRAINT fk\_inquiry\_baa   FOREIGN KEY (buyer\_agent\_agreement\_id)   REFERENCES buyer\_agent\_agreements(id) ON DELETE SET NULL; \-- Trigger for updated\_at CREATE TRIGGER update\_baa\_updated\_at   BEFORE UPDATE ON buyer\_agent\_agreements   FOR EACH ROW EXECUTE FUNCTION update\_updated\_at\_column(); \#\# 3\. CREATE showing\_logs table: CREATE TABLE IF NOT EXISTS showing\_logs (   id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),   lead\_id UUID NOT NULL REFERENCES property\_inquiries(id) ON DELETE CASCADE,   property\_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,   showing\_date TIMESTAMPTZ NOT NULL,   feedback TEXT NOT NULL DEFAULT 'none',   notes TEXT,   user\_id UUID NOT NULL,   org\_id UUID NOT NULL,   created\_at TIMESTAMPTZ DEFAULT now(),   updated\_at TIMESTAMPTZ DEFAULT now(),   deleted\_at TIMESTAMPTZ,   CONSTRAINT valid\_showing\_feedback CHECK (     feedback IN ('loved', 'interested', 'maybe', 'pass', 'none')   ) ); ALTER TABLE showing\_logs ENABLE ROW LEVEL SECURITY; CREATE POLICY "showing\_select" ON showing\_logs FOR SELECT   USING (org\_id \= (SELECT org\_id FROM profiles WHERE id \= auth.uid())); CREATE POLICY "showing\_insert" ON showing\_logs FOR INSERT   WITH CHECK (org\_id \= (SELECT org\_id FROM profiles WHERE id \= auth.uid())); CREATE POLICY "showing\_update" ON showing\_logs FOR UPDATE   USING (org\_id \= (SELECT org\_id FROM profiles WHERE id \= auth.uid())); CREATE POLICY "showing\_delete" ON showing\_logs FOR DELETE   USING (org\_id \= (SELECT org\_id FROM profiles WHERE id \= auth.uid())); CREATE INDEX IF NOT EXISTS idx\_showing\_lead ON showing\_logs(lead\_id); CREATE INDEX IF NOT EXISTS idx\_showing\_property ON showing\_logs(property\_id); CREATE INDEX IF NOT EXISTS idx\_showing\_date ON showing\_logs(showing\_date); CREATE TRIGGER update\_showing\_updated\_at   BEFORE UPDATE ON showing\_logs   FOR EACH ROW EXECUTE FUNCTION update\_updated\_at\_column(); |
| :---- |

### **Important Note on RLS**

Check how the existing RLS policies work on property\_inquiries. The current pattern may use auth.uid() \= user\_id directly or may use an org-based lookup. Match the SAME pattern for new tables. If the existing tables use a simpler pattern like USING (true) for authenticated users (as contracts does), use that same pattern for consistency.

### **Verification**

* supabase db push succeeds

* npm run gen:types regenerates database.types.ts with new tables and columns

* buyer\_agent\_agreements and showing\_logs appear in database.types.ts

* property\_inquiries has lead\_source, lead\_score, preferred\_state columns

| COMMIT: git commit \-m "feat(db): add lead pipeline, buyer-agent agreements, showing logs tables" |
| :---- |

| TASK 2: LEAD SERVICE (Extend Inquiries Service) |
| :---- |

| Depends On | T1 (migration applied, types regenerated) |
| :---- | :---- |

| Files | src/services/inquiries.service.ts (rename to leads.service.ts) |
| :---- | :---- |

| Estimated | 3 hours |
| :---- | :---- |

### **Strategy**

We rename inquiries.service.ts to leads.service.ts and extend the InquiriesService class to LeadsService. The old inquiriesService export stays as an alias for backward compatibility. All existing methods keep working.

### **Cursor Prompt**

| Evolve src/services/inquiries.service.ts into a lead pipeline service. Step 1: Copy the file to src/services/leads.service.ts Step 2: In the new file, rename the class from InquiriesService to LeadsService Step 3: Export both: export const leadsService \= new LeadsService();         Also: export const inquiriesService \= leadsService; // backward compat Step 4: Update src/services/inquiries.service.ts to just re-export:         export { leadsService as inquiriesService, leadsService } from "./leads.service"; Add these NEW methods to LeadsService (keep all existing methods): // ── Pipeline queries ── async getByStatus(status: string): Promise\<PropertyInquiry\[\]\>   \- Filter by status, ordered by updated\_at desc async getPipelineCounts(): Promise\<Record\<string, number\>\>   \- Return count per status: { new: 5, contacted: 3, qualified: 2, ... }   \- Single query with GROUP BY status async getRecentLeads(limit: number \= 10): Promise\<PropertyInquiry\[\]\>   \- Most recent leads, ordered by created\_at desc // ── Status transitions ── async updateStatus(id: string, newStatus: string): Promise\<void\>   \- Update status \+ updated\_at   \- If newStatus is "contacted", also set last\_contacted\_at \= now()   \- If newStatus is "closed\_won", set converted\_at \= now() // ── Source tracking ── async getBySource(source: string): Promise\<PropertyInquiry\[\]\>   \- Filter by lead\_source async getSourceStats(): Promise\<Record\<string, number\>\>   \- Count leads per source for ROI dashboard // ── Buyer-Agent Agreement link ── async linkAgreement(leadId: string, agreementId: string): Promise\<void\>   \- Update buyer\_agent\_agreement\_id on the lead Also update the create() method to accept lead\_source field. Default status should be "new" instead of "active". IMPORTANT: Keep ALL existing methods (getAll, getRentalInquiries, getSaleInquiries, getById, create, update, delete, checkMatchesForNewProperty, matchInquiryToProperty, createMatch, markAsContacted, etc.) They all still work — just add new methods alongside them. Follow the same patterns: getActiveOrgId(), getAuthenticatedUserId(), supabase.from(...), error handling with throw. |
| :---- |

| COMMIT: git commit \-m "feat(leads): evolve inquiry service into lead pipeline service" |
| :---- |

| TASK 3: LEAD PIPELINE UI |
| :---- |

| Depends On | T2 (lead service ready) |
| :---- | :---- |

| Creates | src/features/leads/ (new feature directory) |
| :---- | :---- |

| Estimated | 5 hours |
| :---- | :---- |

### **File Structure**

| src/features/leads/ ├── LeadsPage.tsx              \# Main page with view toggle ├── components/ │   ├── LeadPipeline.tsx       \# Kanban board view │   ├── LeadList.tsx           \# Table/list view │   ├── LeadCard.tsx           \# Card for kanban columns │   ├── LeadDetailPanel.tsx    \# Slide-over detail panel │   ├── LeadDialog.tsx         \# Create/edit lead dialog │   ├── LeadSourceBadge.tsx    \# Source indicator badge │   └── LeadStatusBadge.tsx    \# Status color badge ├── hooks/ │   └── useLeadsData.ts        \# Data fetching hook └── schemas/     └── leadForm.schema.ts     \# Zod validation |
| :---- |

### **Cursor Prompt**

| Create the leads feature module at src/features/leads/ @CLAUDE.md (follow feature architecture pattern) @src/features/inquiries/ (reference for existing inquiry UI patterns) @src/services/leads.service.ts (the service we just created) @src/config/colors.ts (design tokens) \#\# LeadsPage.tsx Main page component with: \- Header: "Leads" title \+ "Add Lead" button \+ view toggle (Kanban | List) \- Pipeline counts summary bar showing count per status \- Default view: Kanban (LeadPipeline component) \- Alt view: List (LeadList component) \- Use the data fetching pattern from CLAUDE.md (custom hook) \#\# LeadPipeline.tsx (Kanban Board) 7 columns, one per status:   New | Contacted | Qualified | Active | Under Contract | Closed Won | Closed Lost Each column: \- Column header with status name \+ count badge \- Column color: New=blue, Contacted=yellow, Qualified=purple,   Active=green, Under Contract=orange, Closed Won=emerald, Closed Lost=red \- List of LeadCard components \- Drop target for drag-and-drop (use onDragOver/onDrop HTML5)   When card dropped on new column \-\> call leadsService.updateStatus() \- Horizontal scroll on mobile \#\# LeadCard.tsx Compact card showing: \- Lead name (bold) \- Phone number (formatted with formatPhoneForDisplay) \- Lead type badge: "Buyer" or "Renter" (from inquiry\_type) \- Source badge (LeadSourceBadge) \- Budget range if set \- Preferred city/state if set \- Time since creation ("2d ago") \- Click opens LeadDetailPanel \- Draggable (HTML5 drag) \#\# LeadDetailPanel.tsx Slide-over panel (from right side) showing full lead info: \- Header: name, status badge, source badge \- Contact info: phone (click to call), email (click to mailto) \- Lead details: type, budget, location preference, timeline, pre-approved \- Status change dropdown (select new status) \- TAB: "Showings" \- list of showing\_logs for this lead (from T6) \- TAB: "Agreement" \- buyer-agent agreement if exists (from T5) \- TAB: "Matches" \- existing property matches (from inquiry system) \- TAB: "Notes" \- notes field, editable \- Edit button opens LeadDialog \#\# LeadDialog.tsx Modal for creating or editing a lead: \- React Hook Form \+ Zod (leadForm.schema.ts) \- Fields: name\*, phone\*, email, inquiry\_type (rental/sale),   lead\_source (dropdown), preferred\_city, preferred\_state (US\_STATES dropdown),   preferred\_zip, budget min/max, timeline, pre\_approved (checkbox), notes \- On create: calls leadsService.create() \- On edit: calls leadsService.update() \#\# LeadList.tsx Table view alternative to kanban: \- Columns: Name, Phone, Type, Source, Status, City/State, Budget, Created \- Sortable by any column \- Filterable by status, source, type \- Click row opens LeadDetailPanel \- Status column has inline dropdown to change status \#\# useLeadsData.ts hook Follow CLAUDE.md data fetching pattern: \- const { leads, pipelineCounts, loading, error, refresh } \= useLeadsData() \- Fetches leadsService.getAll() and leadsService.getPipelineCounts() STYLING: \- Use Tailwind classes from src/config/colors.ts \- Use cn() from src/lib/utils.ts for class merging \- Use existing UI components: Button, Badge, Dialog, Input, Select from ui/ \- Mobile-first: kanban scrolls horizontally, list stacks as cards \- Match the design aesthetic of existing pages (Properties, Contracts) |
| :---- |

| COMMIT: git commit \-m "feat(leads): add lead pipeline UI with kanban and list views" |
| :---- |

| TASK 4: LEAD FORM SCHEMA (Zod) |
| :---- |

| Depends On | T1 (new columns exist in types) |
| :---- | :---- |

| Creates | src/features/leads/schemas/leadForm.schema.ts |
| :---- | :---- |

| Estimated | 2 hours |
| :---- | :---- |

### **Cursor Prompt**

| Create src/features/leads/schemas/leadForm.schema.ts Build on the existing inquiry schema pattern from: @src/features/inquiries/schemas/inquiryForm.schema.ts But with US-specific fields and the new lead pipeline fields. Import validators from serviceProxy:   import { isValidPhone, isValidState, isValidZipCode } from "@/lib/serviceProxy" Schema fields:   name: z.string().min(2).max(100) \-- required   phone: z.string().refine(isValidPhone) \-- required, US NANP   email: z.string().email().optional().or(z.literal(""))   inquiry\_type: z.enum(\["rental", "sale"\]) \-- required   lead\_source: z.enum(\[     "zillow", "realtor\_com", "referral", "sign\_call",     "social\_media", "cold\_call", "open\_house", "website", "other"   \]).default("other")   preferred\_city: z.string().optional()   preferred\_state: z.string().refine(v \=\> \!v || isValidState(v)).optional()   preferred\_zip: z.string().refine(v \=\> \!v || isValidZipCode(v)).optional()   budget\_min: z.number().positive().optional().nullable()   budget\_max: z.number().positive().optional().nullable()   timeline: z.string().optional() \-- "ASAP", "1-3 months", "3-6 months", "6+ months"   pre\_approved: z.boolean().default(false)   notes: z.string().optional() Also keep backward compat fields that map to existing columns:   min\_rent\_budget / max\_rent\_budget (for rental type)   min\_sale\_budget / max\_sale\_budget (for sale type) Export: getLeadSchema, LeadFormData type, leadFormDefaultValues Default values:   lead\_source: "other"   inquiry\_type: "rental"   pre\_approved: false   All others: empty string or null |
| :---- |

| COMMIT: git commit \-m "feat(leads): add lead form Zod schema with US validation" |
| :---- |

| TASK 5: BUYER-AGENT AGREEMENT TRACKER |
| :---- |

| Depends On | T1 (table exists), T3 (LeadDetailPanel exists) |
| :---- | :---- |

| Creates | Service \+ UI components inside lead detail |
| :---- | :---- |

| Estimated | 4 hours |
| :---- | :---- |

### **Why This Matters**

Since August 2024, agents MUST have a signed buyer-agent agreement before showing any property. No CRM at our price point handles this. This is a regulatory differentiator.

### **Cursor Prompt**

| \#\# Part A: Service Create src/services/buyerAgentAgreements.service.ts Follow the service pattern from CLAUDE.md:   class BuyerAgentAgreementsService { ... }   export const buyerAgentAgreementsService \= new BuyerAgentAgreementsService(); Methods:   getByLeadId(leadId: string): Promise\<BuyerAgentAgreement | null\>   getAll(): Promise\<BuyerAgentAgreement\[\]\>   getExpiringSoon(days: number \= 14): Promise\<BuyerAgentAgreement\[\]\>     \- WHERE expiration\_date \<= NOW() \+ days AND status \= "active"   create(data): Promise\<BuyerAgentAgreement\>   update(id, data): Promise\<BuyerAgentAgreement\>   delete(id): Promise\<void\> Add types to src/types/index.ts:   export type BuyerAgentAgreement \= Database\["public"\]\["Tables"\]\["buyer\_agent\_agreements"\]\["Row"\]   export type BuyerAgentAgreementInsert \= ...   export type BuyerAgentAgreementUpdate \= ... Export from src/lib/serviceProxy.ts:   export { buyerAgentAgreementsService } from "../services/buyerAgentAgreements.service" \#\# Part B: UI (inside LeadDetailPanel) Add an "Agreement" tab to LeadDetailPanel.tsx If no agreement exists for this lead:   Show "No buyer-agent agreement" \+ "Create Agreement" button If agreement exists, show card with:   \- Status badge (Draft/Sent/Active/Expired/Renewed/Terminated)   \- Commission: "2.5% (exclusive)" or "$5,000 flat fee (non-exclusive)"   \- Sign date → Expiration date (with days remaining)   \- Scope description   \- Visual warning if expiring within 14 days (amber)   \- Visual error if expired (red)   \- Edit button to modify Agreement create/edit dialog:   \- commission\_rate: number input   \- commission\_type: select (percentage / flat\_fee / tiered)   \- sign\_date: date picker   \- expiration\_date: date picker (validate \> sign\_date)   \- exclusivity\_type: radio (exclusive / non\_exclusive)   \- scope: textarea ("Greater Austin area", "Travis County, TX")   \- notes: textarea   \- On save: create/update \+ link to lead via leadsService.linkAgreement() |
| :---- |

| COMMIT: git commit \-m "feat(agreements): add buyer-agent agreement tracker with expiration alerts" |
| :---- |

| TASK 6: SHOWING LOG |
| :---- |

| Depends On | T1 (table exists), T3 (LeadDetailPanel exists) |
| :---- | :---- |

| Creates | Service \+ UI components inside lead detail |
| :---- | :---- |

| Estimated | 3 hours |
| :---- | :---- |

### **Cursor Prompt**

| \#\# Part A: Service Create src/services/showingLogs.service.ts class ShowingLogsService { ... } export const showingLogsService \= new ShowingLogsService(); Methods:   getByLeadId(leadId: string): Promise\<ShowingLogWithProperty\[\]\>     \- Join with properties to get address, city, state     \- Order by showing\_date desc   getByPropertyId(propertyId: string): Promise\<ShowingLog\[\]\>   create(data): Promise\<ShowingLog\>   update(id, data): Promise\<ShowingLog\>   delete(id): Promise\<void\>   getShowingStats(): Promise\<{ total: number, loved: number,     interested: number, pass: number }\> Types in src/types/index.ts:   export type ShowingLog \= Database\["public"\]\["Tables"\]\["showing\_logs"\]\["Row"\]   export type ShowingLogInsert \= ...   export type ShowingLogUpdate \= ...   export interface ShowingLogWithProperty extends ShowingLog {     property?: Property;   } Export from serviceProxy.ts \#\# Part B: UI (inside LeadDetailPanel) Add a "Showings" tab to LeadDetailPanel.tsx Shows a timeline of property showings:   \- Each showing: property address, date/time, feedback badge, notes   \- Feedback badges: Loved (green heart), Interested (blue thumbs up),     Maybe (yellow ?), Pass (red X), None (gray)   \- "Log Showing" button opens dialog Showing create dialog:   \- property\_id: searchable select from user properties list   \- showing\_date: date+time picker   \- feedback: radio group (loved / interested / maybe / pass)   \- notes: textarea Show total showings count in lead card and detail panel header. |
| :---- |

| COMMIT: git commit \-m "feat(showings): add showing log with property feedback tracking" |
| :---- |

| TASK 7: ROUTING, NAVIGATION & i18n |
| :---- |

| Depends On | T3 (LeadsPage component exists) |
| :---- | :---- |

| Files | constants.ts, App.tsx, Sidebar.tsx, locales/en/navigation.json |
| :---- | :---- |

| Estimated | 2 hours |
| :---- | :---- |

### **Cursor Prompt**

| Wire up the leads feature into the app routing and navigation. \#\# 1\. src/config/constants.ts — add to ROUTES:   LEADS: "/leads",   LEAD\_DETAIL: "/leads/:id", \#\# 2\. src/App.tsx — add routes:   import { LeadsPage } from "./features/leads/LeadsPage";   // Add inside \<Routes\>:   \<Route path={ROUTES.LEADS} element={\<ProtectedRoute\>\<LeadsPage /\>\</ProtectedRoute\>} /\>   // Add redirect from old inquiries route:   \<Route path="/inquiries" element={\<Navigate to={ROUTES.LEADS} replace /\>} /\> \#\# 3\. src/components/layout/Sidebar.tsx:   Import UserPlus from lucide-react   In navigationItems array, REPLACE the inquiries entry:     { key: "leads", href: ROUTES.LEADS, icon: UserPlus },   (Remove the old inquiries entry) \#\# 4\. public/locales/en/navigation.json:   Add: "leads": "Leads"   Add: "viewAllLeads": "View all leads"   Keep: "inquiries": "Inquiries" (for backward compat) \#\# 5\. NotificationContext — update badge:   In Sidebar.tsx, change the badge logic:   The unreadMatchesCount badge should now appear on "leads" key   instead of "inquiries" key:     item.key \=== "leads" && unreadMatchesCount \> 0 \#\# 6\. Keep the existing Inquiries feature:   Do NOT delete src/features/inquiries/.   The /inquiries route now redirects to /leads.   The old InquiriesService re-exports from leads.service.ts.   Everything still works for any code referencing the old module. |
| :---- |

| COMMIT: git commit \-m "feat(nav): add leads route, rename sidebar, redirect /inquiries" |
| :---- |

| SPRINT 2 COMPLETION CHECKLIST |
| :---- |

| ✓ | Criteria | How to Verify |
| :---- | :---- | :---- |
| □ | property\_inquiries has lead\_source, preferred\_state, pre\_approved columns | Check database.types.ts |
| □ | buyer\_agent\_agreements table exists with RLS | Check database.types.ts \+ Supabase dashboard |
| □ | showing\_logs table exists with RLS | Check database.types.ts |
| □ | Sidebar shows 'Leads' with UserPlus icon instead of 'Inquiries' | Open app, check sidebar |
| □ | /inquiries redirects to /leads | Navigate to /inquiries in browser |
| □ | Lead pipeline shows 7 columns in kanban view | Open leads page |
| □ | New lead can be created with source dropdown | Click 'Add Lead', fill form |
| □ | Lead status can be changed by drag-drop or dropdown | Drag a card between columns |
| □ | Lead detail panel opens with tabs | Click a lead card |
| □ | Buyer-agent agreement can be created from lead detail | Go to Agreement tab, create one |
| □ | Expiring agreement shows amber warning | Set expiration to 7 days from now |
| □ | Showing log can be created from lead detail | Go to Showings tab, log a showing |
| □ | Property matches still work from lead detail | Check Matches tab |
| □ | npm run typecheck: 0 errors | Run command |
| □ | npm run build: success | Run command |

## **What Sprint 3 Needs From This**

Sprint 3 (Deal Core) builds directly on the lead pipeline:

* When lead status changes to 'under\_contract', auto-create a Deal record

* Deal record references the lead (lead\_id FK) and the property

* Offer tracker records offer/counter-offer history per deal

* Transaction Timeline (Sprint 4\) auto-generates from accepted offer

* Commission calculator (Sprint 5\) pulls commission rate from buyer-agent agreement

*END OF SPRINT 2 DOCUMENT*