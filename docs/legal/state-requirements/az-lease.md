# Arizona — Residential Lease (research summary)

**Status:** Phase 1 research only · Not attorney-reviewed · Not an AAR form  
**Sources consulted:** A.R.S. §33-1321 (security deposits); ARLTA secondary summaries; §33-1375 (notice to terminate M2M); entry notice practice (~two days).

## 1. Mandatory disclosures

| Topic | Understanding | Uncertainty |
|-------|---------------|-------------|
| Move-in condition form | On move-in, landlord must provide signed lease, move-in damage form, and written notice tenant may attend move-out inspection (§33-1321(C)) | Process/document attach gap |
| Nonrefundable fees | Must be specified in writing | Wizard has some fee fields; “nonrefundable” labeling gap |
| ARLTA availability | Landlords often must notify that ARLTA is available | Exact current duty wording — confirm |
| Lead paint | Federal pre-1978 | Modeled |
| Bedbugs / pool / HOA | May be contractual or local | Flag |

## 2. Security deposit (vs `constants.ts`)

| Rule | Research | `constants.ts` | Action |
|------|----------|----------------|--------|
| Cap | **1.5×** monthly rent (§33-1321(A)) | `AZ: 1.5` | OK |
| Return | **14 days excluding Saturdays, Sundays, legal holidays** after termination + possession + tenant demand | `AZ: 14` | **Incomplete** — map stores calendar-ish 14; clause text must say **business days excluding weekends/holidays**. Consider expanding constants comment or helper later |
| Interest | Not generally required | N/A | OK |
| Dispute | Tenant dispute window after itemization (60 days concepts in statute) | N/A | Mention at high level |

## 3. Notice periods

| Topic | Understanding | Uncertainty |
|-------|---------------|-------------|
| Entry | Often **two days’** notice at reasonable times (ARLTA practice/statute area) | Confirm exact A.R.S. cite at implementation |
| M2M termination | **30 days** before next rent due (§33-1375(B) area) | Confirm |
| Landlord breach notice | Tenant 10-day cure concepts (§33-1361 area) | Summarize carefully |

## 4. Purchase N/A

See `az-purchase.md`.

## 5. Statute-driven presence

- Deposit cap 1.5× and 14 business-day return concepts.
- Move-in inspection / move-out inspection rights.
- Entry notice.

## Data gaps

- Move-in condition checklist attachment.
- Explicit nonrefundable fee schedule.
- `STATE_DEPOSIT_RETURN_DAYS.AZ` should be documented as “14 business days (excl. weekends/holidays)” not plain calendar days.
