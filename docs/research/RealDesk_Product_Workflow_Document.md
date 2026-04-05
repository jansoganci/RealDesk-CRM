  
**PRODUCT WORKFLOW DOCUMENT**

RealDesk CRM — US Market V1

*From Lead to Closing: The Complete Agent Workflow*

| Version | 1.0 — April 2026 |
| :---- | :---- |

| Purpose | Map every step a US solo agent takes from first lead contact through closing and beyond, then define exactly what the product automates at each step. |
| :---- | :---- |

| Audience | Product development team, engineering leads, design |
| :---- | :---- |

| Status | Foundation document — drives sprint planning and feature prioritization |
| :---- | :---- |

# **Table of Contents**

**Part 1:** The Agent’s Day — How Time Is Actually Spent

**Part 2:** Sale Transaction Workflow (7 Phases)

**Part 3:** Rental Transaction Workflow (4 Phases)

**Part 4:** Ongoing Property Management Cycle

**Part 5:** VA Task Mapping — What We Automate

**Part 6:** Product Feature Map — Phase by Phase

**Part 7:** Data Model Requirements

**Part 8:** V1 Scope, Priorities & Critical Path

| PART 1: THE AGENT’S DAY |
| :---- |

## **How a Solo US Agent Spends Their Time**

A typical solo agent managing 8–15 active listings works 50–60 hours per week. Research shows over 80% of that time goes to non-revenue activities. The breakdown:

| Activity | Hours/Week | % of Time | Automation Potential |
| :---- | :---- | :---- | :---- |
| Lead follow-up (calls, texts, emails) | 10–15 | 20–25% | HIGH — auto-sequences, templates |
| Showing coordination & property tours | 8–12 | 15–20% | MEDIUM — calendar sync, auto-confirm |
| Transaction management (under contract) | 8–10 | 15–18% | VERY HIGH — timeline tracker |
| CRM data entry & organization | 5–8 | 10–15% | HIGH — smart forms, auto-capture |
| Document preparation & signatures | 4–6 | 8–10% | HIGH — templates \+ e-sign |
| Commission tracking & accounting | 2–4 | 4–7% | HIGH — auto-calculate |
| Marketing (social, listings, open houses) | 3–5 | 5–8% | LOW — outside our scope |
| Prospecting & networking | 3–5 | 5–8% | LOW — outside our scope |
| Actual client relationship building | 5–8 | 10–15% | NONE — this is the job |

| KEY INSIGHT: Our product targets the 65–70% of time that’s NOT client-facing. |
| :---- |

The agent’s core value is relationships, negotiation, and local market knowledge. Everything else is overhead we can reduce.

| PART 2: SALE TRANSACTION WORKFLOW |
| :---- |

A US residential sale transaction takes 30–60 days from accepted offer to closing. The full lifecycle from first lead contact can span 3–12 months. Below is every phase, what the agent does, and what our product handles.

| PHASE 1: LEAD CAPTURE & QUALIFICATION |
| :---- |

| Timeline | Day 0 — Ongoing |
| :---- | :---- |

| Parties | Agent, Prospect (buyer or seller) |
| :---- | :---- |

### **What Happens**

Leads arrive from multiple sources: Zillow/Realtor.com portals, referrals from past clients, open houses, social media ads, cold calling, sign calls (someone calls the number on a yard sign), and sphere of influence (friends, family, community). Speed to lead is critical — responding within 5 minutes yields 21x higher conversion than waiting 30 minutes.

### **Agent Actions**

1. Record lead info: name, phone, email, source, what they’re looking for, budget range, timeline, pre-approval status

2. Tag lead source for ROI tracking (which channel produces closings?)

3. Make initial contact within 5 minutes (call or text)

4. Qualify: Are they pre-approved for mortgage? Timeline to buy/sell? Motivation level?

5. If buyer: assess needs (location, beds/baths, price range, must-haves vs nice-to-haves)

6. If seller: schedule listing presentation, prepare CMA (Comparable Market Analysis)

7. Enter into follow-up sequence if not ready to act immediately

| PAIN POINT: Leads from 4–6 sources land in different places. No single inbox. |
| :---- |

### **What RealDesk Does**

| Feature | Description | Priority |
| :---- | :---- | :---- |
| Lead Entry Form | Quick-add form: name, phone, email, source (dropdown), type (buyer/seller/renter), budget, notes | V1 — SHIP |
| Lead Source Tracking | Dropdown: Zillow, Realtor.com, Referral, Sign Call, Social Media, Cold Call, Open House, Other | V1 — SHIP |
| Lead Status Pipeline | Stages: New → Contacted → Qualified → Active → Under Contract → Closed → Lost | V1 — SHIP |
| Speed-to-Lead Timer | Visual indicator showing time since lead came in, alert if \>15 min uncontacted | V1.5 |
| Auto-Import from Portals | Zillow/Realtor.com API lead import | V2 — BACKLOG |

| PHASE 2: BUYER-AGENT AGREEMENT (Post-NAR Settlement) |
| :---- |

| Timeline | Before any showing — legally required since August 2024 |
| :---- | :---- |

| Parties | Agent, Buyer |
| :---- | :---- |

| NEW REGULATION: This did not exist before August 2024\. No CRM handles it well yet. |
| :---- |

### **What Happens**

Before showing any property to a buyer, the agent must have a signed written agreement specifying the agent’s compensation. This is the single biggest structural change in US real estate in decades.

### **Agreement Contains**

* Commission rate or flat fee the buyer will pay the agent (average 2.43% as of 2025\)

* Agreement duration (typically 3–6 months)

* Geographic scope (specific neighborhoods, city, or entire state)

* Exclusivity: exclusive (buyer works only with this agent) or non-exclusive

* Services provided by the agent

* Conditions for termination

### **What RealDesk Does**

| Feature | Description | Priority |
| :---- | :---- | :---- |
| Agreement Tracker | Record: buyer name, sign date, expiration date, commission rate/structure, scope, exclusivity type | V1 — SHIP |
| Expiration Alerts | Auto-reminder 14 days and 7 days before agreement expires | V1 — SHIP |
| Agreement Status | Statuses: Draft → Sent → Signed → Active → Expired → Renewed | V1 — SHIP |
| Commission Pre-Calc | At agreement signing, calculate expected commission based on buyer’s budget range | V1 — SHIP |
| PDF Generation | Generate buyer-agent agreement PDF from template | V1.5 |
| DocuSign Integration | Send agreement for e-signature directly from CRM | V2 — BACKLOG |

| PHASE 3: PROPERTY SEARCH & SHOWINGS |
| :---- |

| Timeline | Day 1–30+ (can extend months for picky buyers) |
| :---- | :---- |

| Parties | Agent, Buyer, Listing Agents (for showing coordination) |
| :---- | :---- |

### **What Happens**

Agent searches MLS for matching properties, coordinates showings with listing agents, tours homes with buyer, collects feedback after each showing. Typically 3–10 showings per week during active search.

### **Agent Actions**

1. Search MLS based on buyer criteria (location, price, beds, baths, features)

2. Send matching listings to buyer (email or MLS portal link)

3. Coordinate showing times with listing agents

4. Tour properties with buyer, take notes, photos

5. Collect buyer feedback: interested, maybe, pass

6. Refine search criteria based on feedback

7. Track which properties were shown, buyer reaction, follow-up needed

### **What RealDesk Does**

| Feature | Description | Priority |
| :---- | :---- | :---- |
| Property-Buyer Matching | EXISTING: Auto-match inquiry criteria to listed properties (adapted from TR version) | V1 — SHIP |
| Showing Log | Record: property, date, buyer reaction (Loved / Interested / Pass), notes | V1 — SHIP |
| MLS ID Field | Text field to link property record to MLS listing number | V1 — SHIP |
| Showing Calendar | EXISTING: Calendar integration for scheduling showings (adapted from meetings feature) | V1 — SHIP |
| Buyer Feedback Summary | Dashboard showing all properties shown to a buyer with their reactions | V1.5 |

| PHASE 4: OFFER & NEGOTIATION |
| :---- |

| Timeline | Day X to X+3 (fast-paced, 1–3 rounds typical) |
| :---- | :---- |

| Parties | Agent, Buyer, Listing Agent, Seller |
| :---- | :---- |

### **What Happens**

Buyer decides to make an offer. Agent prepares the Purchase Offer (state-specific forms). Seller accepts, rejects, or counters. Mutual acceptance triggers the “under contract” phase.

### **Purchase Offer Contains**

* Offer price

* Earnest Money Deposit (EMD) — typically 1–3% of purchase price, held in escrow

* Contingencies: inspection (7–10 days), financing (21–30 days), appraisal, sale of buyer’s home

* Proposed closing date (30–45 days from acceptance)

* Closing cost allocation (who pays what)

* Personal property inclusions (appliances, fixtures)

* Title insurance and home warranty decisions

* Expiration time for the offer (typically 24–48 hours)

### **What RealDesk Does**

| Feature | Description | Priority |
| :---- | :---- | :---- |
| Offer Record | Log: property, offer price, EMD amount, contingencies selected, closing date, status | V1 — SHIP |
| Offer Status Tracker | Statuses: Draft → Submitted → Countered → Accepted → Rejected → Expired | V1 — SHIP |
| Counter-Offer Log | Track each round: original terms, counter terms, final accepted terms | V1 — SHIP |
| Deal Transition | When offer accepted → auto-create Transaction Timeline (Phase 5\) with all deadlines | V1 — SHIP |
| Purchase Agreement PDF | Generate US purchase agreement from template with all offer terms | V1 — SHIP |
| Net Sheet Calculator | Estimate seller’s net proceeds or buyer’s total cost at given offer price | V1.5 |

| PHASE 5: UNDER CONTRACT — TRANSACTION TIMELINE |
| :---- |

| THIS IS THE KILLER FEATURE. This phase replaces a $1,200/mo Transaction Coordinator. |
| :---- |

| Timeline | 30–60 days (every day has deadlines) |
| :---- | :---- |

| Parties | Agent, Buyer, Seller, Listing Agent, Lender, Title Company, Inspector, Appraiser, Insurance Agent |
| :---- | :---- |

## **The Timeline: Every Milestone**

Once an offer is mutually accepted, a rigid timeline begins. Missing any deadline can kill the deal or cost the buyer their earnest money deposit. This is where 90% of transaction coordinator work happens.

| Day Range | Milestone | Who’s Responsible | What Happens If Missed |
| :---- | :---- | :---- | :---- |
| Day 0 | Mutual Acceptance | Both agents | N/A — this starts the clock |
| Day 0–3 | Earnest Money Deposit | Buyer | Breach of contract; seller can terminate |
| Day 0–3 | Open Escrow | Buyer’s agent | Delays entire timeline |
| Day 0–3 | Title Search Initiated | Title company | Delays closing |
| Day 1–10 | Home Inspection | Buyer (hires inspector) | Inspection contingency expires; buyer loses right to negotiate repairs |
| Day 5–12 | Inspection Negotiation | Both agents | If no agreement, buyer can walk (with EMD) or waive |
| Day 1–15 | HOA Document Review | Buyer | Contingency expires; buyer accepts HOA terms as-is |
| Day 7–21 | Appraisal Ordered | Lender | Delays financing; can push closing |
| Day 14–28 | Appraisal Completed | Appraiser | If low: renegotiate price, buyer covers gap, or deal dies |
| Day 1–30 | Mortgage Processing | Lender \+ Buyer | If denied: deal dies, buyer loses EMD if past contingency |
| Day 21–35 | Loan Commitment | Lender | Financing contingency deadline — most critical deadline |
| Day 25–40 | Title Report Clear | Title company | If liens found: delay to resolve or deal dies |
| Day 25–40 | Homeowner’s Insurance | Buyer | Lender won’t fund without proof of insurance |
| Day 28–42 | Closing Disclosure (CD) | Lender | Federal law: must be delivered 3 business days before closing |
| Day 29–44 | Final Walkthrough | Buyer \+ Agent | Last chance to verify repairs done, no new damage |
| Day 30–45 | Closing Day | All parties | Sign docs, transfer funds, record deed, hand over keys |

## **What RealDesk Does: Transaction Timeline Feature**

This is the centerpiece of the product. When an offer is accepted, the system auto-generates a timeline with all milestones, deadlines, responsible parties, and status tracking.

| Feature | Description | Priority |
| :---- | :---- | :---- |
| Auto-Generated Timeline | Accept offer → system creates all milestones with calculated dates based on closing date and contingency periods | V1 — SHIP |
| Milestone Checklist | Each milestone: status (Pending/In Progress/Complete/Overdue/Waived), responsible party, due date, notes, attached documents | V1 — SHIP |
| Deadline Alerts | Push notification \+ email: 3 days before, 1 day before, and day-of for each deadline | V1 — SHIP |
| Overdue Escalation | Visual red alert when deadline passes without completion; daily reminder until resolved | V1 — SHIP |
| Document Checklist | Per-milestone document upload: inspection report, appraisal, commitment letter, CD, insurance binder, etc. | V1 — SHIP |
| Timeline Visual | Gantt-style or vertical timeline view showing all milestones, color-coded by status | V1 — SHIP |
| Progress Dashboard | Deal-level progress bar: X of Y milestones complete, days until closing, items needing attention | V1 — SHIP |
| Multi-Deal Overview | Dashboard showing all active transactions with their progress, next deadlines, overdue items | V1 — SHIP |
| Amendment Tracking | Log contract amendments (price changes, deadline extensions, repair agreements) with dates | V1 — SHIP |
| Party Contact Directory | Per-deal: buyer, seller, agents, lender, title company, inspector contacts with phone/email | V1 — SHIP |
| Closing Cost Calculator | Estimate total closing costs for buyer and seller based on deal terms | V1.5 |
| Email Notifications to Parties | Send status updates to lender, title co, etc. directly from timeline | V2 |

| PHASE 6: CLOSING & COMMISSION |
| :---- |

| Timeline | Closing day \+ 1–2 weeks post-closing |
| :---- | :---- |

## **Commission Structure (Post-NAR)**

Post-August 2024, commissions are no longer bundled. Each side is independently negotiated.

| Component | Typical Range | Paid By | Notes |
| :---- | :---- | :---- | :---- |
| Listing Agent Commission | 2.5–3.0% | Seller | Set in listing agreement |
| Buyer Agent Commission | 2.0–2.5% (avg 2.43%) | Buyer (can be negotiated) | Set in buyer-agent agreement |
| Broker Split | 20–30% of agent’s commission | Deducted internally | Varies by brokerage; cap structures common |
| Transaction Fee | $200–$500 flat | Agent or client | Some brokerages charge per deal |
| Referral Fee | 25–35% of commission | Referring agent | If lead came from referral |

## **What RealDesk Does: Dual-Side Commission Calculator**

| Feature | Description | Priority |
| :---- | :---- | :---- |
| Commission Input | Per deal: listing-side rate, buyer-side rate, type (percentage / flat fee / tiered), sale price | V1 — SHIP |
| Broker Split Calculator | Agent’s broker split percentage → net-to-agent calculation | V1 — SHIP |
| Referral Fee Deduction | If deal came from referral, deduct referral fee before net calculation | V1 — SHIP |
| Commission Forecast | Based on pipeline: expected commissions from pending deals by close date | V1 — SHIP |
| Year-to-Date Dashboard | Total GCI (Gross Commission Income), deals closed, average commission per deal | V1 — SHIP |
| Tiered Commission Support | E.g., 3% on first $500K, 2% above — for luxury market agents | V1.5 |

| PHASE 7: POST-CLOSING & RELATIONSHIP |
| :---- |

### **What Happens**

Deal is done but the relationship continues. Past clients are the \#1 source of referrals. Agent should maintain contact: closing gift, thank-you note, anniversary reminders, market updates.

### **What RealDesk Does**

| Feature | Description | Priority |
| :---- | :---- | :---- |
| Auto-Tag Past Client | When deal closes → lead status moves to “Past Client” automatically | V1 — SHIP |
| Anniversary Reminder | Auto-reminder on purchase anniversary (1 year, 2 years, etc.) | V1 — SHIP |
| Referral Tracking | Link new leads to the past client who referred them | V1 — SHIP |
| Automated Follow-Up Sequences | Drip campaigns: 30-day check-in, 6-month market update, annual anniversary | V2 |

| PART 3: RENTAL TRANSACTION WORKFLOW |
| :---- |

Rental transactions are simpler than sales but still have distinct phases. Many solo agents manage both sales and rentals — this dual capability is our core differentiator.

| PHASE R1: LISTING & LEAD |
| :---- |

### **What Happens**

Landlord hires agent to find a tenant. Agent lists the property on MLS, Zillow, Apartments.com, Craigslist, Facebook Marketplace. Rental leads come in — pre-screening begins.

### **RealDesk Feature**

EXISTING from TR version: Property listing with rental type, inquiry capture, auto-matching. Adapted for US address format and USD.

| PHASE R2: APPLICATION & SCREENING |
| :---- |

### **What Happens**

* Tenant completes rental application (name, SSN for credit check, employment, income, references)

* Application fee: $25–75 (covers background \+ credit check)

* Agent/landlord runs: credit report, criminal background, eviction history, employment verification

* Income requirement: typically 3x monthly rent in gross income

* Decision: approve, deny (must provide adverse action notice if based on credit), or conditional approval

### **What RealDesk Does**

| Feature | Description | Priority |
| :---- | :---- | :---- |
| Applicant Tracker | Record applicant info, screening status (Pending/Approved/Denied), income verification status | V1 — SHIP |
| Screening Checklist | Checklist: credit check, background check, income verification, references, prior landlord contact | V1 — SHIP |
| Integrated Screening | API integration with TransUnion/Experian for in-app screening | V2 — BACKLOG |

| PHASE R3: LEASE AGREEMENT & MOVE-IN |
| :---- |

### **US Lease Must Include**

* Rent amount, due date, accepted payment methods

* Security deposit amount (state-specific limits: CA max 1 month, NY max 1 month, TX no limit)

* Late fee policy (grace period typically 3–5 days, then $25–50 or 5% of rent)

* Lead paint disclosure (federal requirement for pre-1978 buildings)

* Maintenance responsibilities (landlord vs tenant)

* Entry notice requirements (24–48 hours, state-specific)

* Lease term (typically 12 months)

* Pet policy (deposit, monthly pet rent, breed restrictions)

* Utilities responsibility (who pays water/electric/gas/trash)

* Subletting rules

* Move-out procedures and deposit return timeline (state-specific: 14–60 days)

### **What RealDesk Does**

| Feature | Description | Priority |
| :---- | :---- | :---- |
| US Lease PDF Generator | Generate residential lease from template with all required clauses. State-specific deposit limits auto-applied. | V1 — SHIP |
| Lead Paint Disclosure | Auto-include for pre-1978 properties (checkbox on property record for year built) | V1 — SHIP |
| Move-In Inspection | EXISTING: Photo documentation of property condition at move-in (from TR handover feature) | V1 — SHIP |
| Security Deposit Tracker | Track deposit amount, holding account, return deadline, deductions at move-out | V1 — SHIP |
| State Rules Engine | Based on property state: auto-set deposit limits, notice periods, return timelines | V1.5 |

| PHASE R4: RENTAL COMMISSION |
| :---- |

### **How Rental Commission Works**

| Market | Who Pays | Typical Amount |
| :---- | :---- | :---- |
| NYC | Tenant (broker fee) | 1 month rent or 12–15% annual rent |
| Major cities (LA, Chicago, etc.) | Landlord | 50–100% of 1 month rent |
| Smaller markets | Landlord | Flat fee $500–$2,000 |
| Property management ongoing | Landlord (monthly) | 8–12% of monthly rent |

RealDesk: Flexible commission input supporting percentage of annual rent, percentage of monthly rent, flat fee, and ongoing management fee. Already partially built in TR version — adapt for US structures.

| PART 4: ONGOING PROPERTY MANAGEMENT CYCLE |
| :---- |

For agents who also manage rental properties, there’s a monthly operational cycle. This is where the TR version’s rental infrastructure directly transfers.

| Monthly Task | What It Involves | RealDesk Feature | Status |
| :---- | :---- | :---- | :---- |
| Rent Collection | Track who paid, who’s late, send reminders | Payment tracking \+ late fee alerts | EXISTING — adapt |
| Maintenance Requests | Receive, prioritize, assign to vendor, track completion | Ticket system (NEW) | V1.5 |
| Vendor Coordination | Schedule repairs, get quotes, approve work | Vendor contact directory | V1 — SHIP |
| Landlord Reporting | Monthly P\&L per property for owner | Finance analytics (EXISTING) | EXISTING — adapt |
| Lease Renewals | 60–90 day notice, negotiate new terms, update lease | Renewal reminder \+ new lease gen | V1 — SHIP |
| Move-Out / Turnover | Inspection, deposit return, re-list property | Inspection checklist \+ auto re-list | V1 — SHIP |

| PART 5: VA TASK MAPPING — WHAT WE AUTOMATE |
| :---- |

Every feature we build should pass this test: “Does this replace something an agent currently pays a VA $800–$1,600/month to do?”

| VA Task | Monthly Cost | RealDesk Replacement | Cost Savings | V1? |
| :---- | :---- | :---- | :---- | :---- |
| CRM data entry | $200–400 | Smart forms \+ auto-capture | $200–400/mo | YES |
| Deadline tracking (under contract) | $300–500 | Transaction Timeline auto-alerts | $300–500/mo | YES |
| Document collection & organization | $150–300 | Per-milestone doc upload \+ checklist | $150–300/mo | YES |
| Commission tracking & reporting | $100–200 | Auto-calculate dual-side commissions | $100–200/mo | YES |
| Follow-up reminders | $100–200 | Automated reminder sequences | $100–200/mo | YES |
| Showing coordination | $100–200 | Calendar \+ showing log | $50–100/mo | PARTIAL |
| Cold calling / ISA | $400–800 | Not in scope (human task) | $0 | NO |
| MLS data entry | $100–200 | Not in scope (MLS-specific) | $0 | NO |
| Social media posting | $200–400 | Not in scope (marketing) | $0 | NO |

| TOTAL V1 VA COST DISPLACEMENT: $850–$1,600/month per agent |
| :---- |

At $29–$59/month subscription vs $850–$1,600/month VA cost, the ROI pitch writes itself.

| PART 6: COMPLETE FEATURE MAP BY PHASE |
| :---- |

Summary of every feature, organized by workflow phase and priority tier.

| Phase | Feature | Source | Priority | Complexity |
| :---- | :---- | :---- | :---- | :---- |
| 1\. Lead | Lead entry form with source tracking | NEW | V1 | S |
| 1\. Lead | Lead status pipeline (7 stages) | NEW | V1 | M |
| 1\. Lead | Speed-to-lead timer | NEW | V1.5 | S |
| 1\. Lead | Portal auto-import (Zillow etc.) | NEW | V2 | L |
| 2\. Agreement | Buyer-agent agreement tracker | NEW | V1 | M |
| 2\. Agreement | Expiration alerts (14d, 7d) | NEW | V1 | S |
| 2\. Agreement | Agreement PDF generation | NEW | V1.5 | M |
| 3\. Showings | Property-buyer matching | EXISTING | V1 | S |
| 3\. Showings | Showing log with feedback | NEW | V1 | S |
| 3\. Showings | MLS ID field on properties | NEW | V1 | S |
| 4\. Offer | Offer record & status tracker | NEW | V1 | M |
| 4\. Offer | Counter-offer log | NEW | V1 | S |
| 4\. Offer | Purchase agreement PDF | NEW | V1 | L |
| 4\. Offer | Auto-create timeline on acceptance | NEW | V1 | M |
| 5\. Timeline | Auto-generated milestone timeline | NEW | V1 | L |
| 5\. Timeline | Deadline alerts (3d, 1d, day-of) | NEW | V1 | M |
| 5\. Timeline | Document checklist per milestone | NEW | V1 | M |
| 5\. Timeline | Timeline visual (Gantt/vertical) | NEW | V1 | L |
| 5\. Timeline | Multi-deal overview dashboard | NEW | V1 | M |
| 5\. Timeline | Amendment tracking | NEW | V1 | S |
| 5\. Timeline | Party contact directory | NEW | V1 | S |
| 6\. Commission | Dual-side commission calculator | REVISE | V1 | M |
| 6\. Commission | Broker split \+ referral deduction | NEW | V1 | S |
| 6\. Commission | Commission forecast from pipeline | NEW | V1 | M |
| 6\. Commission | YTD GCI dashboard | REVISE | V1 | S |
| 7\. Post-Close | Past client auto-tag | NEW | V1 | S |
| 7\. Post-Close | Anniversary reminders | REVISE | V1 | S |
| 7\. Post-Close | Referral source tracking | NEW | V1 | S |
| R1. Listing | US property listing (address, MLS) | REVISE | V1 | M |
| R2. Screen | Applicant tracker \+ screening checklist | NEW | V1 | M |
| R3. Lease | US lease agreement PDF generator | NEW | V1 | L |
| R3. Lease | Lead paint disclosure (pre-1978) | NEW | V1 | S |
| R3. Lease | Security deposit tracker | NEW | V1 | S |
| R4. Comm. | Flexible rental commission input | REVISE | V1 | S |
| Infra | US address system (street/city/state/zip) | NEW | V1 | M |
| Infra | US phone formatting (NANP) | REVISE | V1 | S |
| Infra | US bank account fields (routing \+ account) | NEW | V1 | S |
| Infra | CCPA compliance module | NEW | V1 | M |
| Infra | English number-to-words for PDFs | NEW | V1 | S |
| Infra | English-only locale (remove TR default) | REVISE | V1 | S |

| PART 7: DATA MODEL REQUIREMENTS |
| :---- |

New tables and columns required for US V1. All tables follow existing RLS pattern (org\_id \+ user\_id scoping).

## **New Tables**

| Table | Purpose | Key Columns |
| :---- | :---- | :---- |
| deals | Unified deal record (lead → closing) | id, lead\_id, property\_id, deal\_type (sale/rental), status, offer\_price, closing\_date, listing\_agent\_commission, buyer\_agent\_commission, broker\_split\_pct |
| deal\_milestones | Transaction timeline milestones | id, deal\_id, milestone\_type (enum), due\_date, completed\_at, status, responsible\_party, notes |
| deal\_documents | Per-milestone document uploads | id, deal\_id, milestone\_id, file\_path, document\_type (enum), uploaded\_at |
| deal\_parties | Contact directory per deal | id, deal\_id, role (enum: buyer, seller, lender, title\_co, inspector, etc.), name, phone, email, company |
| deal\_amendments | Contract amendments log | id, deal\_id, amendment\_type, description, effective\_date, signed\_at |
| buyer\_agent\_agreements | Buyer-agent agreement tracker | id, buyer\_lead\_id, agent\_id, commission\_rate, commission\_type (pct/flat/tiered), sign\_date, expiration\_date, scope, exclusivity\_type, status |
| offers | Offer tracking with counter-offer history | id, deal\_id, property\_id, offer\_price, emd\_amount, contingencies (jsonb), closing\_date, status, counter\_of (self-ref) |
| showing\_logs | Property showing records | id, property\_id, lead\_id, showing\_date, feedback (loved/interested/pass), notes |
| applicant\_screenings | Rental applicant tracking | id, property\_id, applicant\_name, status, credit\_check, background\_check, income\_verified, decision, notes |

## **Column Revisions to Existing Tables**

| Table | Change | Details |
| :---- | :---- | :---- |
| properties | ADD state (text) | US state code (2-letter: CA, TX, NY) |
| properties | ADD zip\_code (text) | 5 or 9 digit US ZIP code |
| properties | ADD mls\_id (text) | MLS listing number (optional) |
| properties | ADD year\_built (integer) | For lead paint disclosure logic (pre-1978 flag) |
| properties | RENAME il → state, ilce → city | Turkish address → US address mapping |
| properties | DROP mahalle, cadde\_sokak, bina\_no, daire\_no | Turkish-specific address fields |
| properties | ADD street\_address (text) | Full street address line |
| properties | ADD unit (text) | Apartment/suite number |
| property\_owners | ADD routing\_number\_encrypted (text) | AES-256-GCM encrypted US routing number |
| property\_owners | ADD account\_number\_encrypted (text) | AES-256-GCM encrypted US bank account number |
| property\_owners | ADD tax\_id (text, optional) | Optional Tax ID / EIN (not SSN) |
| property\_owners | DROP tc\_encrypted, iban\_encrypted | Turkish identity fields |
| tenants | DROP tc\_encrypted, tc\_hash | Turkish identity fields |
| tenants | ADD street\_address, unit, city, state, zip\_code | US address fields |
| contracts | ADD deal\_id (uuid, FK) | Link to deals table for sale contracts |
| contracts | ADD deposit\_amount (numeric) | Security deposit tracking |
| contracts | ADD deposit\_return\_deadline (date) | State-specific deposit return date |

## **Milestone Type Enum**

The deal\_milestones.milestone\_type column uses this enum to define the standard US transaction timeline:

* mutual\_acceptance, earnest\_money\_deposit, open\_escrow, title\_search\_initiated

* home\_inspection, inspection\_negotiation, inspection\_resolution

* hoa\_document\_review

* appraisal\_ordered, appraisal\_completed, appraisal\_negotiation

* mortgage\_application, loan\_processing, loan\_commitment

* title\_report\_clear, homeowners\_insurance

* closing\_disclosure\_sent, closing\_disclosure\_review

* final\_walkthrough, closing\_day, post\_closing\_recording

| PART 8: V1 SCOPE, PRIORITIES & CRITICAL PATH |
| :---- |

## **Critical Path**

Each item unblocks the next. This is the build order:

1. **US Address System** (1 week) — Unblocks everything. Every feature touches addresses.

2. **US Phone \+ Bank Fields** (3 days) — Quick win, unblocks owner/tenant forms.

3. **Lead Pipeline \+ Source Tracking** (1 week) — Entry point for all deals.

4. **Buyer-Agent Agreement Tracker** (1 week) — Required before showings.

5. **Deal Record \+ Offer Tracker** (1.5 weeks) — Core deal object.

6. **Transaction Timeline** (2–3 weeks) — The killer feature. Largest build item.

7. **Dual-Side Commission Calculator** (1 week) — Revenue tracking.

8. **US Lease Agreement PDF** (2 weeks) — Rental side deliverable.

9. **US Purchase Agreement PDF** (2 weeks) — Sale side deliverable.

10. **Applicant Screening Tracker** (3 days) — Rental screening checklist.

11. **CCPA Compliance** (1 week) — Legal requirement for CA users.

12. **Landing Page Rebrand** (3–5 days) — Go-to-market.

13. **English i18n Audit** (3 days) — Complete all translations.

14. **QA & Integration Testing** (1 week) — End-to-end flows.

## **Timeline Summary**

| Sprint | Weeks | Deliverables |
| :---- | :---- | :---- |
| Sprint 1: Foundation | Weeks 1–2 | US Address System, Phone, Bank Fields, English locale default, Currency to USD |
| Sprint 2: Lead to Deal | Weeks 3–4 | Lead pipeline, Buyer-Agent Agreement tracker, Showing log |
| Sprint 3: Deal Core | Weeks 5–6 | Deal record, Offer tracker, Deal-to-Timeline auto-transition |
| Sprint 4: Timeline | Weeks 7–9 | Transaction Timeline (milestones, alerts, docs, visual, multi-deal dashboard) |
| Sprint 5: Commission | Week 10 | Dual-side calculator, broker split, forecast, YTD dashboard |
| Sprint 6: PDFs | Weeks 11–14 | US Lease Agreement \+ Purchase Agreement PDF generators |
| Sprint 7: Rental \+ Compliance | Week 15 | Applicant screening, deposit tracker, CCPA module |
| Sprint 8: Go-to-Market | Week 16 | Landing rebrand, i18n audit, QA, staging deploy |

## **Success Metrics**

* An agent can take a lead from first contact to closed deal entirely within RealDesk

* Transaction Timeline replaces the need for a separate TC tool or VA for deadline management

* Commission tracking handles both sides of post-NAR deals without spreadsheets

* Lease and purchase agreement PDFs are generated in under 30 seconds

* Zero Turkish-specific code remains in the US build

*END OF DOCUMENT*