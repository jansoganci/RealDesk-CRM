# California — Residential Purchase (research summary)

**Status:** Phase 1 research only · Not attorney-reviewed · Not an official / C.A.R. form  
**Sources consulted:** Cal. Civ. Code §§1102 et seq. (TDS), §§1103 et seq. (NHD); §2079.10a; federal lead paint; secondary market practice summaries (contingency day counts).

## 1. Mandatory disclosures

| Topic | Understanding | Uncertainty |
|-------|---------------|-------------|
| Transfer Disclosure Statement (TDS) | Statutory seller condition disclosure for most 1–4 unit residential sales; generally non-waivable | Delivery timing nuances; exemptions list incomplete without counsel |
| Natural Hazard Disclosure (NHD) | Statutory natural-hazard zones disclosure for covered residential sales | Often prepared by third-party vendors — process gap |
| Megan’s Law notice | Purchase contracts typically include statutory database notice | Use current statute wording |
| Federal lead paint | Pre-1978 + 10-day inspection opportunity (unless shortened/waived in writing) | Already partially modeled in wizard |
| Smoke/CO, water heater bracing, water-conserving plumbing | Compliance certifications often required in CA practice | **Wizard gap** — not collected |
| HOA / Mello-Roos / CFD | Community assessments disclosures when applicable | **Wizard gap** |
| Death on property / other | Limited special disclosure rules exist | Scope **UNCERTAIN** |

## 2. Security deposit N/A (purchase)

Earnest money is contractual/escrow practice, not “security deposit” statute map.

## 3. Contingencies / earnest money (practice norms — not all statutory)

| Topic | Typical market practice (UNCERTAIN as “law”) | Notes |
|-------|-----------------------------------------------|-------|
| Inspection / investigation | Often ~17 days after acceptance in widely used association forms | **Practice norm, not a statute day count** — treat as negotiable default suggestion only |
| Loan / appraisal | Often similar negotiated windows (~17–21 days in market practice) | Negotiable; wizard has financing fields |
| Earnest money | Held by escrow; release rules are contractual | Wizard: earnest amount/dates exist |
| Attorney review | CA is **not** primarily an “attorney-drafts-every-contract” state like NY custom | Agents commonly use association forms — RealDesk V1 is **not** those forms |

## 4. Attorney custom

Not an attorney-review-period state in the NJ sense. Parties may still hire counsel.

## 5. Statute-driven presence

- Acknowledge TDS/NHD obligations and that separate statutory forms must be delivered outside/alongside this draft.
- Megan’s Law notice (statute).
- Lead-paint section when year_built < 1978.
- Do **not** claim this draft is a C.A.R. RPA.

## Data gaps

- No TDS/NHD delivery tracking fields.
- No HOA/Mello-Roos fields.
- Contingency day fields exist partially (`inspection_*`, financing, appraisal) — map those; do not invent fixed “17 days” as law.
