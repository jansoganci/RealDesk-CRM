# New York — Residential Lease (research summary)

**Status:** Phase 1 research only · Not attorney-reviewed · Not a DHCR / NYC official form  
**Sources consulted:** NYS Homes & Community Renewal lease/security deposit guidance; NYC HPD bedbug materials; Housing Stability & Tenant Protection Act (HSTPA) secondary summaries; Real Property Law references in secondary sources.

## 1. Mandatory disclosures

| Topic | Understanding | Uncertainty |
|-------|---------------|-------------|
| Bedbugs (NYC / multi-dwelling) | NYC: vacancy lease bedbug history disclosure (DBB-N style process); annual HPD reporting / receipt sharing for multiple dwellings | **Statewide vs NYC-only** split — flag; V1 should disclose that NYC buildings have extra duties |
| Lead paint | Federal + NYC local lead rules may add obligations | Local overlay **UNCERTAIN** depth |
| Window guards / sprinkler / cooking fires (NYC) | Common NYC lease riders | Local — flag as gap |
| Rent stabilization | Entire parallel regulatory regime if unit is regulated | **Major gap** — wizard does not capture regulated status |

## 2. Security deposit (vs `constants.ts`)

| Rule | Research | `constants.ts` | Action |
|------|----------|----------------|--------|
| Cap | Generally **1 month’s rent** (HSTPA) | `NY: 1` | OK |
| Return | Often cited as **14 days** with itemization (HSTPA / updates; secondary sources also mention 2025 refinements) | `NY: 14` | OK baseline; note possible statutory updates — **re-verify before production reliance** |
| Interest | Buildings with **6+ units**: interest-bearing account rules commonly apply | Not modeled | **GAP** — no unit-count / interest fields |
| Separate account | Deposit trust-account rules | Gap | Flag |

## 3. Notice periods

| Topic | Understanding | Uncertainty |
|-------|---------------|-------------|
| Entry | Reasonable notice; local codes may specify | **UNCERTAIN** statewide single hour rule |
| Termination / rent increase | Strongly affected by rent regulation and local law | Too complex for V1 completeness — disclose limitation |
| Good cause eviction (NYC / statewide expansions) | Evolving | **UNCERTAIN** — do not claim full compliance |

## 4. Purchase N/A

See `ny-purchase.md`.

## 5. Statute-driven presence

- Security deposit cap/return concepts.
- Bedbug disclosure obligation notice (especially NYC) — without copying official DBB-N form layout/text from copyrighted forms; describe obligation and require parties to complete official forms separately.
- Lead-paint when applicable.

## Data gaps

- NYC vs rest-of-state flag; bedbug history fields; unit count for interest rules; rent-regulated status.
