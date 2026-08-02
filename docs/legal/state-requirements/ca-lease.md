# California — Residential Lease (research summary)

**Status:** Phase 1 research only · Not attorney-reviewed · Not an official form  
**Sources consulted:** Cal. Civ. Code §1950.5 (security deposits); secondary summaries of Civ. Code §§1940–1954.05, §2079.10a (Megan’s Law notice); federal lead-paint rule; CA Courts self-help deposit guide.

## 1. Mandatory disclosures

| Topic | Understanding | Uncertainty |
|-------|---------------|-------------|
| Federal lead paint | Pre-1978 housing: lead warning, pamphlet, known hazards/records disclosure | Confirm exceptions (zero-bedroom, housing for elderly, etc.) case-by-case |
| Megan’s Law / sex offender database | Leases commonly must include statutory notice pointing to public registry (Civ. Code §2079.10a) | Exact prescribed wording must come from current statute text at implementation; do not invent |
| Mold | Landlords often must provide state mold informational booklet / disclose known mold | Booklet delivery is a process gap (file attach) — wizard may not capture booklet acknowledgment |
| Asbestos | Disclosure when landlord has actual knowledge (often buildings ~pre-1981) | Scope/thresholds uncertain without counsel |
| Bedbugs / pests | Local ordinances may add requirements (esp. cities) | Statewide uniform lease clause uncertain |
| Prop 65 / smoking / smoking smoke | Local rules vary | Flag city overlays out of V1 scope |

## 2. Security deposit rules (vs `constants.ts`)

| Rule | Research | `constants.ts` | Action |
|------|----------|----------------|--------|
| Cap | Unfurnished generally max **2×** monthly rent (recent reforms); furnished may allow higher | `CA: 2` | OK for unfurnished default; note furnished exception as **UNCERTAIN / not modeled** |
| Return | Generally **21 calendar days** after vacancy + itemization | `CA: 21` | OK |
| Interest | Statewide interest generally **not** required; some cities (e.g. Berkeley) require interest | Not in map | Document city overlay gap |
| Itemization / receipts | Itemized deductions; receipts rules for larger deductions; move-out photo rules evolving (AB 2801 discussed in secondary sources) | N/A | Flag photo/receipt detail as **UNCERTAIN for V1 completeness** |

## 3. Notice periods (lease)

| Topic | Typical / statutory understanding | Uncertainty |
|-------|-----------------------------------|-------------|
| Entry | Reasonable notice; often treated as ~24 hours in practice for non-emergency | Exact statutory hours for all entry types — **UNCERTAIN**; do not hardcode “24 hours” as absolute without cite |
| Termination (fixed term) | Ends per lease; early termination special rules (military, DV, etc.) | Special early-termination statutes need counsel list |
| Month-to-month termination | Often **30 days** (or longer for longer tenancies under Civ. Code §1946.1) | Confirm current day counts by tenancy length |
| Rent increase | Statewide rent-control / AB 1482 may limit increases and require advance notice | Local rent control overlays — **out of V1 depth** |

## 4. Purchase N/A

See `ca-purchase.md`.

## 5. Statute-driven clause / disclosure presence

- Deposit handling / return timing references Civ. Code §1950.5 concepts.
- Megan’s Law database notice (statutory language from §2079.10a — public statute text).
- Lead-paint addendum when required (federal).
- Habitability / repair obligations exist under CA law — summarize originally; do not copy association lease forms.

## Data gaps (wizard)

- No field for mold booklet acknowledgment, asbestos knowledge, Megan’s Law acknowledgment checkbox, city rent-control jurisdiction.
- `security_deposit_return_days` exists and can default from `STATE_DEPOSIT_RETURN_DAYS.CA`.
