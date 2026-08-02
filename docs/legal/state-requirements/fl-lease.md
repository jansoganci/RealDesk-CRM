# Florida — Residential Lease (research summary)

**Status:** Phase 1 research only · Not attorney-reviewed · Not a Florida Supreme Court / Florida Realtors form  
**Sources consulted:** Fla. Stat. §83.49 (deposits); §83.53 (access); §404.056(5) (radon notice language); Fla. Stat. Ch. 83 Part II overviews.

## 1. Mandatory disclosures

| Topic | Understanding | Uncertainty |
|-------|---------------|-------------|
| Radon gas | §404.056(5) requires notification on rental agreements (>45-day non-transient) containing **specific statutory language** | Include statute’s required notice text (public law) in FL templates |
| Deposit holding method | §83.49: written notice how deposit held (account/bond); timing within 30 days of receipt (exceptions for small landlords) | Wizard **GAP**: deposit holding method / bank |
| Landlord address for notices | Name/address for notices (§83.50 area) | Map landlord mailing fields |
| Lead paint | Federal pre-1978 | Modeled |
| Flood | Evolving FL flood disclosure laws primarily discussed for sales; rental overlay **UNCERTAIN** | Flag |

## 2. Security deposit (vs `constants.ts`)

| Rule | Research | `constants.ts` | Action |
|------|----------|----------------|--------|
| Cap | No statewide cap | `FL: null` | OK |
| Return | **15 days** if no claim; if claim intended, written notice (certified mail / permitted email rules) within **30 days** | `FL: 15` | OK as “no claim” baseline; document 30-day claim-notice path in clause text |
| Interest | Depends on how held | N/A | Mention if interest-bearing account used — **data gap** |

## 3. Notice periods

| Topic | Understanding | Uncertainty |
|-------|---------------|-------------|
| Entry | At least **24 hours** notice; reasonable hours often **7:30 a.m.–8:00 p.m.** (§83.53) | Confirm current statute text at implementation |
| M2M termination | Commonly **30 days** notice | Confirm |
| Rent increase | No statewide rent control generally | Local tourist/short-term rules out of scope |

## 4. Purchase N/A

See `fl-purchase.md`.

## 5. Statute-driven presence

- Embed or attach §404.056(5) radon notice (required language).
- Deposit claim/return timeline per §83.49.
- Entry notice rules.

## Data gaps

- Deposit account type / institution / surety bond.
- Explicit radon acknowledgment checkbox (can still print statutory notice).
