# Texas — Residential Lease (research summary)

**Status:** Phase 1 research only · Not attorney-reviewed · Not a TREC / Texas REALTORS® form  
**Sources consulted:** Tex. Prop. Code Ch. 92 (esp. §§92.103–92.109 deposits; §§92.201–.205 owner/agent identity; §92.0135 flood; §92.056 repair remedies; §92.019 late fees); Texas State Law Library guides; secondary summaries.

## 1. Mandatory disclosures

| Topic | Understanding | Uncertainty |
|-------|---------------|-------------|
| Owner / management identity | Lease must disclose name and street address of owner or management authorized to act, and person for service of process (§92.201 et seq.) | Continuing update duty on ownership change |
| Flood risk | Flood disclosure / notice under §92.0135 for residential tenancies | Exact statutory language — pull from code at implementation |
| Federal lead paint | Pre-1978 | Same as federal |
| Tenant repair remedies | Certain remedy language must appear conspicuously (bold/underlined) per §92.056(g) | Exact required phrasing from statute — **do not invent**; paraphrase + flag if full quote not embedded |
| Parking / towing | Rules if landlord tows (§92.0131 area) | Conditional |
| Early termination (military, family violence, etc.) | Specific statutory early-termination rights | Summarize at high level; cite need for counsel |

## 2. Security deposit rules (vs `constants.ts`)

| Rule | Research | `constants.ts` | Action |
|------|----------|----------------|--------|
| Cap | **No statewide statutory cap** | `TX: null` | OK |
| Return | **30 days** after surrender; itemized deductions; forwarding address may delay landlord obligation to mail (§92.107) but does not forfeit tenant rights | `TX: 30` | OK |
| Interest | Generally not required statewide | N/A | OK |
| Bad faith | Potential treble + $100 + fees (§92.109) | N/A | Mention in draft remedies note |

## 3. Notice periods

| Topic | Understanding | Uncertainty |
|-------|---------------|-------------|
| Entry | Reasonable notice for non-emergency; Texas practice often 24 hours but confirm | **UNCERTAIN** as hard rule |
| Termination M2M | Typically one rental period notice unless lease/statute says otherwise | Confirm Prop. Code cite |
| Rent increase | No statewide rent control; notice generally contractual / local | Flag |

## 4. Purchase N/A

See `tx-purchase.md`.

## 5. Statute-driven presence

- Owner/agent street address disclosure (wizard has landlord address fields — map them).
- Flood notice reference.
- Deposit return ~30 days + forwarding address concept.
- Late fee rules exist (§92.019 caps/timing) — wizard has late fee fields; validate against statute in future.

## Data gaps

- No dedicated “person authorized to receive service of process” field (may reuse landlord mailing).
- No flood-zone / prior flood knowledge fields for leases.
- Repair-remedy conspicuous language needs statutory text inclusion strategy.
