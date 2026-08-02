# Texas — Residential Purchase (research summary)

**Status:** Phase 1 research only · Not attorney-reviewed · Not a TREC promulgated form  
**Sources consulted:** Tex. Prop. Code §5.008 (seller’s disclosure); secondary descriptions of option period / earnest money practice; TREC form existence noted only as market context (do not copy).

## 1. Mandatory disclosures

| Topic | Understanding | Uncertainty |
|-------|---------------|-------------|
| Seller’s Disclosure of Property Condition (§5.008) | Most 1-dwelling residential sellers must give written notice on/before effective date; buyer may terminate within **7 days** after receiving late notice | Exemptions list incomplete here |
| HOA / POA | Membership / assessment notices under Prop. Code (e.g. §5.012 area) | Wizard gap |
| Public Improvement District | Statutory assessment notices when applicable | Wizard gap |
| Lead paint | Federal pre-1978 | Modeled partially |
| Lead / other environmental | Contractual + federal | — |

## 2. Earnest money / contingencies (practice)

| Topic | Understanding | Uncertainty |
|-------|---------------|-------------|
| Earnest money | Typically deposited with title/escrow per contract | Wizard has earnest fields |
| Option / termination period | Texas market often uses a paid **option period** with unrestricted termination (association/TREC practice) | **Not a free-standing statute creating option periods** — treat as negotiable contractual concept; do not copy TREC Paragraph 5 wording |
| Financing / appraisal | Contractual addenda in market practice | Map wizard financing fields |
| Inspection | Often tied to option period in TX practice | Wizard inspection fields exist |

## 3. Attorney custom

Texas residential resales commonly close with title companies; attorney not universally required. Parties may hire counsel.

## 4. Statute-driven presence

- Acknowledge §5.008 seller disclosure obligation and 7-day termination if notice late.
- Lead-paint when applicable.
- Explicitly state draft is **not** TREC One to Four Family Residential Contract.

## Data gaps

- No seller’s disclosure delivery date / acknowledgment fields.
- No option-fee amount field (TX-specific practice) — **GAP**: flag; can put conceptual option-period language using `offer_expiration_*` / inspection days imperfectly or note “attach separate option terms”.
- No HOA/PID fields.
