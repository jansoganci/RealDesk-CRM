# Sample Draft PDF Review — Read-Only Review Pass

Generated 2026-08-02 for manual review readiness. Source: `tmp/sample-drafts/` (10 files + manifest). No templates or generated files were modified.

## Cross-cutting issues (appear across multiple/all documents)


These are **sample-input artifacts, not necessarily template bugs** — but they make several of the 10 sample PDFs look wrong at a glance, so flagging for the review:

1. **ZIP code frozen at `85001` (Phoenix, AZ) regardless of state.** All 5 lease docs and all 5 purchase docs show `85001` in the property address, even for CA/TX/FL/NY properties. Only the AZ docs are actually correct. This is very likely a fixed sample-input value used when generating all 10 samples (not a per-state template defect), but it reads as a copy/paste leftover and should be regenerated with per-state realistic ZIPs before this batch is used for stakeholder review.
2. **Timezone/"Generated ... local time" frozen at Pacific Time / `America/Los_Angeles` regardless of state.** Every one of the 10 docs states `Time zone for notices and generated timestamps: America/Los_Angeles` and ends with `Generated 2:57 AM local time at the Property (Pacific Time)`. Only correct for CA; wrong for TX (Central), FL/NY (Eastern), and technically wrong for AZ too (Mountain, no DST — though same UTC offset as Pacific in summer). Same root cause as #1 — fixed sample input, but worth flagging since a TX lease that says all notices run on Pacific Time will look broken to a reviewer.
3. **Party name fields have a bare trailing em-dash concatenated directly onto the name, no space:** `Alex Landlord—`, `Taylor Tenant——` (double dash, all 5 leases), `Sam Seller—`, `Blake Buyer—` (all 5 purchase docs). Reads like an empty suffix/entity-type placeholder rendered inline instead of being omitted when blank. Present identically in all 10 docs — looks like a template string-interpolation issue, not a one-off content problem.
4. **Purchase docs only — dangling dash-period artifact in earnest money sentence:** `Earnest money: $10,000.00, due August 5, 2026 —. Escrow required: Yes.` The `—.` sits awkwardly mid-paragraph — looks like an empty optional qualifier (e.g. a due-date note) collapsed into stray punctuation. Present identically in all 5 purchase docs (CA/TX/FL/NY/AZ).
5. **Purchase docs only — double period typo:** `Personal property included (if described): None described..` Present identically in all 5 purchase docs.
6. **Purchase docs only (CA/TX/FL/NY, NOT AZ) — signature/date split across a page break:** `Seller signature` appears at the bottom of page 2 immediately followed by the per-page `Buyer's Initials ___  Seller's Initials ___` footer, then the corresponding `Date: _______________` line only appears at the top of page 3. So the Seller's signature line and its own date field are visually separated by the initials footer and a page break. AZ purchase doesn't show this (its slightly shorter §7 text shifts pagination), which is itself an inconsistency worth normalizing. Not seen in any of the 5 lease docs (their signature/date pairs stay together).

None of the above are legal-content problems — the state-specific statutory disclosure text (Megan's Law/TDS/NHD for CA, Property Code Ch. 92/flooding for TX, radon/§83.49 for FL, HSTPA/PCDS for NY, ARS 33-1321/33-422 for AZ) is correctly scoped per state in every document, with no leftover cross-state legal text. No lorem ipsum, "TODO", or literal `undefined`/`null` strings were found anywhere. Empty optional fields consistently render as an em-dash (`—`) or "None stated"/"None listed" — which is fine except for artifacts #3–#5 above where that pattern breaks down.

## Per-document review

### CA — Lease (`lease-CA.pdf`)

- **File size:** 14,830 bytes  
- **Pages:** 3  
- **Template ID:** `realdesk.lease.ca.v1` @ `1.0.0-draft`

**Checklist:**

- [x] Correct state name (`CA`) appears throughout — jurisdiction header, notice text, and state-specific disclosures section all correctly scoped to CA. No leftover text from another state's template.
- [x] "NOT ATTORNEY-REVIEWED" draft disclaimer present and prominent at top of page 1.
- [x] No lorem-ipsum / placeholder-lorem / TODO text found.
- [x] Section order complete, nothing cut off: Parties → Premises → Term → Rent → Security deposit → Use/rules → State disclosures → Notice periods → Default/remedies → Additional terms → Signatures. Doc ends cleanly on page 3 of 3 with generated-timestamp footer — not truncated.
- [x] File size (14,830 bytes) and page count (3 pages) reasonable — consistent with the other 4 leases, not suspiciously short or long.

**Flagged issues:**

- See cross-cutting issues #1 (ZIP) and #2 (timezone) above — this doc inherits both.
- See cross-cutting issue #3 (party-name trailing em-dash) above.

<details><summary>Full extracted text</summary>

```
--- [page 1] ---
RealDesk Residential Lease Agreement (Draft) — CA
IMPORTANT NOTICE — NOT ATTORNEY-REVIEWED. This document is a RealDesk Residential Lease Agreement (Draft) for
CA. It was generated by RealDesk based on information you provided and a general understanding of CA law. It has not been
reviewed by a licensed attorney. It is not an official state association form and is not a substitute for counsel-approved or
association-promulgated contracts. Consult a real estate attorney licensed in CA before relying on this document for a real
transaction.
Template: realdesk.lease.ca.v1 · Version: 1.0.0-draft · Jurisdiction: CA
1. Parties
This Residential Lease Agreement (the "Agreement") is entered into between Landlord Alex Landlord— and Tenant
Taylor Tenant——. Additional occupants (if any): None listed.
2. Premises
Landlord leases to Tenant the residential premises located at 100 Main St, Sample City, CA, 85001 (the
"Premises"), residence type: apartment. Bedrooms: 2. Bathrooms: 1. Year built (if known): 1990. Time zone for
notices and generated timestamps: America/Los_Angeles.
3. Term
Lease type: Standard (fixed term). The term begins on August 2, 2026 and ends on August 2, 2027. After the fixed
term (if any), the parties' selected after-term action is: terminate. Termination notice days (as entered): 30.
4. Rent and payment
Monthly rent is $1,500.00, due on day 1 of each month. Accepted payment methods: check. Late fee: None. NSF
fee: none stated. Prepaid rent (if any): None.
5. Security deposit
Security deposit enabled: No. Amount: —. Landlord intends to return any unused deposit within 21 days after
Tenant vacates, subject to lawful deductions and the CA rules summarized in the state disclosures below. Pet
deposit (if any): None stated.
6. Use, utilities, and house rules
Utilities Landlord covers: None listed. Other utility notes: —. Parking: Not included. Furnishings/appliances/common
areas: Unfurnished. Pets allowed: No (n/a). Subletting policy: with_consent. Smoking allowed: No. Renters
insurance required: No (minimum coverage if stated: —). Move-in inspection required: Yes.
7. CA disclosures and statutory notices
California-specific disclosures (draft).
Megan's Law notice: The California Department of Justice maintains a public database of registered sex offenders.
Information about registered sex offenders may be obtained by visiting the Megan's Law website operated by the
California Department of Justice (https://www.meganslaw.ca.gov) or by contacting local law enforcement. The
RealDesk Residential Lease Agreement (Draft) — CA · realdesk.lease.ca.v1 · Page 1 of 3
--- [page 2] ---
parties acknowledge that this notice is provided for informational purposes and that they should verify the current
statutory notice language under Civil Code section 2079.10a with counsel.
Mold and environmental conditions: Landlord should disclose known mold or other environmental conditions that
materially affect habitability and should provide any required state consumer information regarding mold. If such
materials were delivered separately, the parties should retain proof of delivery.
Asbestos: If Landlord has actual knowledge of asbestos-containing materials at the Premises, Landlord should
disclose that knowledge in writing before occupancy.
Security deposit: Under California Civil Code section 1950.5, Landlord generally must return any unused security
deposit and provide an itemized statement of deductions within twenty-one (21) calendar days after Tenant vacates.
Applicable caps on deposit amounts (commonly up to two months' rent for unfurnished units under current
statewide rules) must be observed. Local ordinances may impose additional requirements.
Lead-based paint: If the Premises were built before 1978, the federal lead-based paint disclosure and pamphlet
requirements apply and are addressed in a separate addendum when required by the data provided.
8. Notice periods
Notices: Unless a shorter time is required by emergency or statute, Landlord should give reasonable advance notice
before non-emergency entry. Month-to-month termination and rent-increase notices must follow California Civil
Code requirements (including section 1946.1 where applicable) and any local rent regulations. Tenant must give
notice to terminate as required by the lease type and applicable law.
9. Default and remedies
If either party fails to perform a material obligation under this Agreement, the other party may exercise remedies
available under applicable CA law and this Agreement, including notices to cure or quit where required, recovery of
unpaid rent, and lawful termination. Self-help eviction is prohibited. Nothing in this section limits non-waivable
statutory rights.
10. Additional terms
None stated.
Landlord signature
Date: _______________
Tenant signature
Date: _______________
RealDesk Residential Lease Agreement (Draft) — CA · realdesk.lease.ca.v1 · Page 2 of 3
--- [page 3] ---
Additional tenant signature (if any)
Date: _______________
Co-signer / guarantor signature (if any)
Date: _______________
Generated 2:57 AM local time at the Property (Pacific Time)
RealDesk Residential Lease Agreement (Draft) — CA · realdesk.lease.ca.v1 · Page 3 of 3
```
</details>

### TX — Lease (`lease-TX.pdf`)

- **File size:** 14,638 bytes  
- **Pages:** 3  
- **Template ID:** `realdesk.lease.tx.v1` @ `1.0.0-draft`

**Checklist:**

- [x] Correct state name (`TX`) appears throughout — jurisdiction header, notice text, and state-specific disclosures section all correctly scoped to TX. No leftover text from another state's template.
- [x] "NOT ATTORNEY-REVIEWED" draft disclaimer present and prominent at top of page 1.
- [x] No lorem-ipsum / placeholder-lorem / TODO text found.
- [x] Section order complete, nothing cut off: Parties → Premises → Term → Rent → Security deposit → Use/rules → State disclosures → Notice periods → Default/remedies → Additional terms → Signatures. Doc ends cleanly on page 3 of 3 with generated-timestamp footer — not truncated.
- [x] File size (14,638 bytes) and page count (3 pages) reasonable — consistent with the other 4 leases, not suspiciously short or long.

**Flagged issues:**

- See cross-cutting issues #1 (ZIP) and #2 (timezone) above — this doc inherits both.
- See cross-cutting issue #3 (party-name trailing em-dash) above.

<details><summary>Full extracted text</summary>

```
--- [page 1] ---
RealDesk Residential Lease Agreement (Draft) — TX
IMPORTANT NOTICE — NOT ATTORNEY-REVIEWED. This document is a RealDesk Residential Lease Agreement (Draft) for
TX. It was generated by RealDesk based on information you provided and a general understanding of TX law. It has not been
reviewed by a licensed attorney. It is not an official state association form and is not a substitute for counsel-approved or
association-promulgated contracts. Consult a real estate attorney licensed in TX before relying on this document for a real
transaction.
Template: realdesk.lease.tx.v1 · Version: 1.0.0-draft · Jurisdiction: TX
1. Parties
This Residential Lease Agreement (the "Agreement") is entered into between Landlord Alex Landlord— and Tenant
Taylor Tenant——. Additional occupants (if any): None listed.
2. Premises
Landlord leases to Tenant the residential premises located at 100 Main St, Sample City, TX, 85001 (the "Premises"),
residence type: apartment. Bedrooms: 2. Bathrooms: 1. Year built (if known): 1990. Time zone for notices and
generated timestamps: America/Los_Angeles.
3. Term
Lease type: Standard (fixed term). The term begins on August 2, 2026 and ends on August 2, 2027. After the fixed
term (if any), the parties' selected after-term action is: terminate. Termination notice days (as entered): 30.
4. Rent and payment
Monthly rent is $1,500.00, due on day 1 of each month. Accepted payment methods: check. Late fee: None. NSF
fee: none stated. Prepaid rent (if any): None.
5. Security deposit
Security deposit enabled: No. Amount: —. Landlord intends to return any unused deposit within 21 days after
Tenant vacates, subject to lawful deductions and the TX rules summarized in the state disclosures below. Pet
deposit (if any): None stated.
6. Use, utilities, and house rules
Utilities Landlord covers: None listed. Other utility notes: —. Parking: Not included. Furnishings/appliances/common
areas: Unfurnished. Pets allowed: No (n/a). Subletting policy: with_consent. Smoking allowed: No. Renters
insurance required: No (minimum coverage if stated: —). Move-in inspection required: Yes.
7. TX disclosures and statutory notices
Texas-specific disclosures (draft).
Owner and management identity: Landlord represents that the name and street address of the owner of the
Premises, or of the management company authorized to act on the owner's behalf, and the person authorized to
receive service of process, are as stated in the Parties section of this Agreement (Texas Property Code Chapter 92
RealDesk Residential Lease Agreement (Draft) — TX · realdesk.lease.tx.v1 · Page 1 of 3
--- [page 2] ---
requirements).
Flooding: Landlord should disclose known information regarding flood risk as required by Texas Property Code
section 92.0135. The parties should confirm the current statutory notice language with counsel and attach any
required flood disclosure.
Repairs and remedies: Tenant may have statutory repair and remedy rights under Texas Property Code Chapter 92.
Certain notices and remedy language must appear conspicuously in the lease; the parties should confirm the
current statutory wording with counsel. This draft does not replace those required conspicuous statements if
additional formatting is mandated.
Security deposit: Texas does not impose a statewide maximum security deposit amount. Landlord generally must
refund the deposit or provide an itemized accounting within thirty (30) days after Tenant surrenders the Premises.
Landlord's obligation to mail the refund/accounting may be delayed until Tenant provides a written forwarding
address, but Tenant does not forfeit the right to a refund by failing to provide an address.
Lead-based paint: Federal requirements apply to most pre-1978 housing and are addressed in a separate
addendum when required.
8. Notice periods
Notices: Non-emergency entry should be on reasonable notice. Termination of a month-to-month tenancy and other
notices must comply with Texas Property Code Chapter 92 and the written lease. Special statutory early-termination
rights (for example, certain military or family-violence situations) may apply regardless of lease language.
9. Default and remedies
If either party fails to perform a material obligation under this Agreement, the other party may exercise remedies
available under applicable TX law and this Agreement, including notices to cure or quit where required, recovery of
unpaid rent, and lawful termination. Self-help eviction is prohibited. Nothing in this section limits non-waivable
statutory rights.
10. Additional terms
None stated.
Landlord signature
Date: _______________
Tenant signature
Date: _______________
RealDesk Residential Lease Agreement (Draft) — TX · realdesk.lease.tx.v1 · Page 2 of 3
--- [page 3] ---
Additional tenant signature (if any)
Date: _______________
Co-signer / guarantor signature (if any)
Date: _______________
Generated 2:57 AM local time at the Property (Pacific Time)
RealDesk Residential Lease Agreement (Draft) — TX · realdesk.lease.tx.v1 · Page 3 of 3
```
</details>

### FL — Lease (`lease-FL.pdf`)

- **File size:** 14,035 bytes  
- **Pages:** 3  
- **Template ID:** `realdesk.lease.fl.v1` @ `1.0.0-draft`

**Checklist:**

- [x] Correct state name (`FL`) appears throughout — jurisdiction header, notice text, and state-specific disclosures section all correctly scoped to FL. No leftover text from another state's template.
- [x] "NOT ATTORNEY-REVIEWED" draft disclaimer present and prominent at top of page 1.
- [x] No lorem-ipsum / placeholder-lorem / TODO text found.
- [x] Section order complete, nothing cut off: Parties → Premises → Term → Rent → Security deposit → Use/rules → State disclosures → Notice periods → Default/remedies → Additional terms → Signatures. Doc ends cleanly on page 3 of 3 with generated-timestamp footer — not truncated.
- [x] File size (14,035 bytes) and page count (3 pages) reasonable — consistent with the other 4 leases, not suspiciously short or long.

**Flagged issues:**

- See cross-cutting issues #1 (ZIP) and #2 (timezone) above — this doc inherits both.
- See cross-cutting issue #3 (party-name trailing em-dash) above.

<details><summary>Full extracted text</summary>

```
--- [page 1] ---
RealDesk Residential Lease Agreement (Draft) — FL
IMPORTANT NOTICE — NOT ATTORNEY-REVIEWED. This document is a RealDesk Residential Lease Agreement (Draft) for
FL. It was generated by RealDesk based on information you provided and a general understanding of FL law. It has not been
reviewed by a licensed attorney. It is not an official state association form and is not a substitute for counsel-approved or
association-promulgated contracts. Consult a real estate attorney licensed in FL before relying on this document for a real
transaction.
Template: realdesk.lease.fl.v1 · Version: 1.0.0-draft · Jurisdiction: FL
1. Parties
This Residential Lease Agreement (the "Agreement") is entered into between Landlord Alex Landlord— and Tenant
Taylor Tenant——. Additional occupants (if any): None listed.
2. Premises
Landlord leases to Tenant the residential premises located at 100 Main St, Sample City, FL, 85001 (the "Premises"),
residence type: apartment. Bedrooms: 2. Bathrooms: 1. Year built (if known): 1990. Time zone for notices and
generated timestamps: America/Los_Angeles.
3. Term
Lease type: Standard (fixed term). The term begins on August 2, 2026 and ends on August 2, 2027. After the fixed
term (if any), the parties' selected after-term action is: terminate. Termination notice days (as entered): 30.
4. Rent and payment
Monthly rent is $1,500.00, due on day 1 of each month. Accepted payment methods: check. Late fee: None. NSF
fee: none stated. Prepaid rent (if any): None.
5. Security deposit
Security deposit enabled: No. Amount: —. Landlord intends to return any unused deposit within 21 days after
Tenant vacates, subject to lawful deductions and the FL rules summarized in the state disclosures below. Pet
deposit (if any): None stated.
6. Use, utilities, and house rules
Utilities Landlord covers: None listed. Other utility notes: —. Parking: Not included. Furnishings/appliances/common
areas: Unfurnished. Pets allowed: No (n/a). Subletting policy: with_consent. Smoking allowed: No. Renters
insurance required: No (minimum coverage if stated: —). Move-in inspection required: Yes.
7. FL disclosures and statutory notices
Florida-specific disclosures (draft).
RADON GAS: Radon is a naturally occurring radioactive gas that, when it has accumulated in a building in sufficient
quantities, may present health risks to persons who are exposed to it over time. Levels of radon that exceed federal
and state guidelines have been found in buildings in Florida. Additional information regarding radon and radon
RealDesk Residential Lease Agreement (Draft) — FL · realdesk.lease.fl.v1 · Page 1 of 3
--- [page 2] ---
testing may be obtained from your county health department.
Security deposit handling: Under Florida Statutes section 83.49, Landlord must hold advance rent and security
deposits in accordance with statute (separate account or surety bond options) and provide written notice of how the
deposit is held. Upon vacating, if Landlord makes no claim, the deposit generally must be returned within fifteen
(15) days; if Landlord intends to impose a claim, Landlord generally must give written notice within thirty (30) days
stating the reason for the claim.
Access: Except in emergencies, Landlord's entry should follow Florida Statutes section 83.53, including advance
notice (commonly at least twenty-four (24) hours) and entry at reasonable hours.
Lead-based paint: Federal requirements apply to most pre-1978 housing and are addressed in a separate
addendum when required.
8. Notice periods
Notices: Non-emergency entry generally requires at least twenty-four (24) hours' notice and should occur at
reasonable hours under Florida Statutes section 83.53. Month-to-month termination commonly requires at least
thirty (30) days' notice ending on a rental period boundary—confirm current statute and lease terms.
9. Default and remedies
If either party fails to perform a material obligation under this Agreement, the other party may exercise remedies
available under applicable FL law and this Agreement, including notices to cure or quit where required, recovery of
unpaid rent, and lawful termination. Self-help eviction is prohibited. Nothing in this section limits non-waivable
statutory rights.
10. Additional terms
None stated.
Landlord signature
Date: _______________
Tenant signature
Date: _______________
Additional tenant signature (if any)
RealDesk Residential Lease Agreement (Draft) — FL · realdesk.lease.fl.v1 · Page 2 of 3
--- [page 3] ---
Date: _______________
Co-signer / guarantor signature (if any)
Date: _______________
Generated 2:57 AM local time at the Property (Pacific Time)
RealDesk Residential Lease Agreement (Draft) — FL · realdesk.lease.fl.v1 · Page 3 of 3
```
</details>

### NY — Lease (`lease-NY.pdf`)

- **File size:** 13,887 bytes  
- **Pages:** 3  
- **Template ID:** `realdesk.lease.ny.v1` @ `1.0.0-draft`

**Checklist:**

- [x] Correct state name (`NY`) appears throughout — jurisdiction header, notice text, and state-specific disclosures section all correctly scoped to NY. No leftover text from another state's template.
- [x] "NOT ATTORNEY-REVIEWED" draft disclaimer present and prominent at top of page 1.
- [x] No lorem-ipsum / placeholder-lorem / TODO text found.
- [x] Section order complete, nothing cut off: Parties → Premises → Term → Rent → Security deposit → Use/rules → State disclosures → Notice periods → Default/remedies → Additional terms → Signatures. Doc ends cleanly on page 3 of 3 with generated-timestamp footer — not truncated.
- [x] File size (13,887 bytes) and page count (3 pages) reasonable — consistent with the other 4 leases, not suspiciously short or long.

**Flagged issues:**

- See cross-cutting issues #1 (ZIP) and #2 (timezone) above — this doc inherits both.
- See cross-cutting issue #3 (party-name trailing em-dash) above.

<details><summary>Full extracted text</summary>

```
--- [page 1] ---
RealDesk Residential Lease Agreement (Draft) — NY
IMPORTANT NOTICE — NOT ATTORNEY-REVIEWED. This document is a RealDesk Residential Lease Agreement (Draft) for
NY. It was generated by RealDesk based on information you provided and a general understanding of NY law. It has not been
reviewed by a licensed attorney. It is not an official state association form and is not a substitute for counsel-approved or
association-promulgated contracts. Consult a real estate attorney licensed in NY before relying on this document for a real
transaction.
Template: realdesk.lease.ny.v1 · Version: 1.0.0-draft · Jurisdiction: NY
1. Parties
This Residential Lease Agreement (the "Agreement") is entered into between Landlord Alex Landlord— and Tenant
Taylor Tenant——. Additional occupants (if any): None listed.
2. Premises
Landlord leases to Tenant the residential premises located at 100 Main St, Sample City, NY, 85001 (the "Premises"),
residence type: apartment. Bedrooms: 2. Bathrooms: 1. Year built (if known): 1990. Time zone for notices and
generated timestamps: America/Los_Angeles.
3. Term
Lease type: Standard (fixed term). The term begins on August 2, 2026 and ends on August 2, 2027. After the fixed
term (if any), the parties' selected after-term action is: terminate. Termination notice days (as entered): 30.
4. Rent and payment
Monthly rent is $1,500.00, due on day 1 of each month. Accepted payment methods: check. Late fee: None. NSF
fee: none stated. Prepaid rent (if any): None.
5. Security deposit
Security deposit enabled: No. Amount: —. Landlord intends to return any unused deposit within 21 days after
Tenant vacates, subject to lawful deductions and the NY rules summarized in the state disclosures below. Pet
deposit (if any): None stated.
6. Use, utilities, and house rules
Utilities Landlord covers: None listed. Other utility notes: —. Parking: Not included. Furnishings/appliances/common
areas: Unfurnished. Pets allowed: No (n/a). Subletting policy: with_consent. Smoking allowed: No. Renters
insurance required: No (minimum coverage if stated: —). Move-in inspection required: Yes.
7. NY disclosures and statutory notices
New York-specific disclosures (draft).
Security deposit: Under New York's Housing Stability and Tenant Protection Act framework, a security deposit for
covered residential tenancies is generally limited to one month's rent. Deposits typically must be returned with an
itemized statement within fourteen (14) days after Tenant vacates (confirm current statutory details with counsel).
RealDesk Residential Lease Agreement (Draft) — NY · realdesk.lease.ny.v1 · Page 1 of 3
--- [page 2] ---
For buildings with six or more dwelling units, interest-bearing account rules commonly apply.
Bedbugs: Especially for New York City multiple dwellings, landlords may be required to disclose bedbug infestation
history and to share annual reporting materials with tenants. The parties should complete any official bedbug
disclosure forms required for the Premises; this draft is not a substitute for those official forms.
Rent regulation: If the Premises are rent-stabilized or otherwise rent-regulated, additional statutory riders and
renewal rules apply and are not fully modeled in this draft. The parties must determine regulatory status and attach
required riders.
Lead-based paint: Federal requirements apply to most pre-1978 housing; New York City may impose additional
local lead rules. A federal lead addendum is included when required by the data provided.
8. Notice periods
Notices: Entry, termination, and rent-increase notices must comply with New York State law and, if applicable, New
York City codes and rent-regulation rules. Because local overlays can be decisive, the parties should confirm notice
periods with New York counsel.
9. Default and remedies
If either party fails to perform a material obligation under this Agreement, the other party may exercise remedies
available under applicable NY law and this Agreement, including notices to cure or quit where required, recovery of
unpaid rent, and lawful termination. Self-help eviction is prohibited. Nothing in this section limits non-waivable
statutory rights.
10. Additional terms
None stated.
Landlord signature
Date: _______________
Tenant signature
Date: _______________
Additional tenant signature (if any)
Date: _______________
RealDesk Residential Lease Agreement (Draft) — NY · realdesk.lease.ny.v1 · Page 2 of 3
--- [page 3] ---
Co-signer / guarantor signature (if any)
Date: _______________
Generated 2:57 AM local time at the Property (Pacific Time)
RealDesk Residential Lease Agreement (Draft) — NY · realdesk.lease.ny.v1 · Page 3 of 3
```
</details>

### AZ — Lease (`lease-AZ.pdf`)

- **File size:** 13,515 bytes  
- **Pages:** 3  
- **Template ID:** `realdesk.lease.az.v1` @ `1.0.0-draft`

**Checklist:**

- [x] Correct state name (`AZ`) appears throughout — jurisdiction header, notice text, and state-specific disclosures section all correctly scoped to AZ. No leftover text from another state's template.
- [x] "NOT ATTORNEY-REVIEWED" draft disclaimer present and prominent at top of page 1.
- [x] No lorem-ipsum / placeholder-lorem / TODO text found.
- [x] Section order complete, nothing cut off: Parties → Premises → Term → Rent → Security deposit → Use/rules → State disclosures → Notice periods → Default/remedies → Additional terms → Signatures. Doc ends cleanly on page 3 of 3 with generated-timestamp footer — not truncated.
- [x] File size (13,515 bytes) and page count (3 pages) reasonable — consistent with the other 4 leases, not suspiciously short or long.

**Flagged issues:**

- See cross-cutting issues #1 (ZIP) and #2 (timezone) above — this doc inherits both.
- See cross-cutting issue #3 (party-name trailing em-dash) above.

<details><summary>Full extracted text</summary>

```
--- [page 1] ---
RealDesk Residential Lease Agreement (Draft) — AZ
IMPORTANT NOTICE — NOT ATTORNEY-REVIEWED. This document is a RealDesk Residential Lease Agreement (Draft) for
AZ. It was generated by RealDesk based on information you provided and a general understanding of AZ law. It has not been
reviewed by a licensed attorney. It is not an official state association form and is not a substitute for counsel-approved or
association-promulgated contracts. Consult a real estate attorney licensed in AZ before relying on this document for a real
transaction.
Template: realdesk.lease.az.v1 · Version: 1.0.0-draft · Jurisdiction: AZ
1. Parties
This Residential Lease Agreement (the "Agreement") is entered into between Landlord Alex Landlord— and Tenant
Taylor Tenant——. Additional occupants (if any): None listed.
2. Premises
Landlord leases to Tenant the residential premises located at 100 Main St, Sample City, AZ, 85001 (the "Premises"),
residence type: apartment. Bedrooms: 2. Bathrooms: 1. Year built (if known): 1990. Time zone for notices and
generated timestamps: America/Los_Angeles.
3. Term
Lease type: Standard (fixed term). The term begins on August 2, 2026 and ends on August 2, 2027. After the fixed
term (if any), the parties' selected after-term action is: terminate. Termination notice days (as entered): 30.
4. Rent and payment
Monthly rent is $1,500.00, due on day 1 of each month. Accepted payment methods: check. Late fee: None. NSF
fee: none stated. Prepaid rent (if any): None.
5. Security deposit
Security deposit enabled: No. Amount: —. Landlord intends to return any unused deposit within 21 days after
Tenant vacates, subject to lawful deductions and the AZ rules summarized in the state disclosures below. Pet
deposit (if any): None stated.
6. Use, utilities, and house rules
Utilities Landlord covers: None listed. Other utility notes: —. Parking: Not included. Furnishings/appliances/common
areas: Unfurnished. Pets allowed: No (n/a). Subletting policy: with_consent. Smoking allowed: No. Renters
insurance required: No (minimum coverage if stated: —). Move-in inspection required: Yes.
7. AZ disclosures and statutory notices
Arizona-specific disclosures (draft).
Security deposit: Under Arizona Revised Statutes section 33-1321, a refundable security deposit generally may not
exceed one and one-half (1.5) months' rent. After termination of the tenancy, delivery of possession, and Tenant's
demand, Landlord generally must provide an itemized list of deductions and any amount due within fourteen (14)
RealDesk Residential Lease Agreement (Draft) — AZ · realdesk.lease.az.v1 · Page 1 of 3
--- [page 2] ---
days, excluding Saturdays, Sundays, and legal holidays.
Move-in / move-out inspection: On move-in, Landlord should furnish a signed copy of the lease, a move-in condition
form noting existing damage, and written notice that Tenant may be present at the move-out inspection.
Entry: Except in emergencies or as otherwise allowed by the Arizona Residential Landlord and Tenant Act, Landlord
should give advance notice before entry (commonly two days) and enter at reasonable times.
Lead-based paint: Federal requirements apply to most pre-1978 housing and are addressed in a separate
addendum when required.
8. Notice periods
Notices: Non-emergency entry should follow the Arizona Residential Landlord and Tenant Act (commonly two days'
advance notice). Either party generally may terminate a month-to-month tenancy with at least thirty (30) days'
written notice before the next rent due date, subject to the Act and the written lease.
9. Default and remedies
If either party fails to perform a material obligation under this Agreement, the other party may exercise remedies
available under applicable AZ law and this Agreement, including notices to cure or quit where required, recovery of
unpaid rent, and lawful termination. Self-help eviction is prohibited. Nothing in this section limits non-waivable
statutory rights.
10. Additional terms
None stated.
Landlord signature
Date: _______________
Tenant signature
Date: _______________
Additional tenant signature (if any)
Date: _______________
RealDesk Residential Lease Agreement (Draft) — AZ · realdesk.lease.az.v1 · Page 2 of 3
--- [page 3] ---
Co-signer / guarantor signature (if any)
Date: _______________
Generated 2:57 AM local time at the Property (Pacific Time)
RealDesk Residential Lease Agreement (Draft) — AZ · realdesk.lease.az.v1 · Page 3 of 3
```
</details>

### CA — Purchase (`purchase-CA.pdf`)

- **File size:** 14,969 bytes  
- **Pages:** 3  
- **Template ID:** `realdesk.purchase.ca.v1` @ `1.0.0-draft`

**Checklist:**

- [x] Correct state name (`CA`) appears throughout — jurisdiction header, notice text, and state-specific disclosures section all correctly scoped to CA. No leftover text from another state's template.
- [x] "NOT ATTORNEY-REVIEWED" draft disclaimer present and prominent at top of page 1.
- [x] No lorem-ipsum / placeholder-lorem / TODO text found.
- [x] Section order complete, nothing cut off: Parties → Property → Purchase price/earnest money → Financing → Closing → Contingencies → State disclosures → Default/remedies → Additional terms → Signatures. Doc ends cleanly on page 3 of 3 with generated-timestamp footer — not truncated.
- [x] File size (14,969 bytes) and page count (3 pages) reasonable — consistent with the other 4 purchase docs, not suspiciously short or long.

**Flagged issues:**

- See cross-cutting issues #1 (ZIP) and #2 (timezone) above — this doc inherits both.
- See cross-cutting issue #3 (party-name trailing em-dash) above.
- See cross-cutting issues #4 (earnest-money dangling dash-period) and #5 (double period on personal property line) above.
- See cross-cutting issue #6 (Seller signature/Date split across page break) above.

<details><summary>Full extracted text</summary>

```
--- [page 1] ---
RealDesk Residential Purchase Agreement (Draft) — CA
IMPORTANT NOTICE — NOT ATTORNEY-REVIEWED. This document is a RealDesk Residential Purchase Agreement (Draft)
for CA. It was generated by RealDesk based on information you provided and a general understanding of CA law. It has not
been reviewed by a licensed attorney. It is not an official state association form and is not a substitute for counsel-approved or
association-promulgated contracts. Consult a real estate attorney licensed in CA before relying on this document for a real
transaction.
Template: realdesk.purchase.ca.v1 · Version: 1.0.0-draft · Jurisdiction: CA
1. Parties
This Residential Purchase Agreement (the "Agreement") is made between Seller Sam Seller— and Buyer Blake
Buyer—. Buyer's agent (if any): —. Seller's agent (if any): —. Effective date (as entered): August 2, 2026.
2. Property
Seller agrees to sell and Buyer agrees to buy the real property located at 200 Oak Ave, Sample City, CA, 85001
(the "Property"), property type: single_family. Year built (if known): 2005. Tax parcel / other property info: —. Land
included: Yes. Mineral rights transferred: Yes. Personal property included (if described): None described..
3. Purchase price and earnest money
Purchase price: $425,000.00. Earnest money: $10,000.00, due August 5, 2026 —. Escrow required: Yes. If this
transaction fails for a reason entitling Buyer to return of earnest money under this Agreement, earnest money
should be returned within 5 days after proper demand, subject to escrow instructions.
4. Financing
Third-party / bank financing. Loan type: conventional. Pre-approval letter date: August 2, 2026. Seller notification
days (financing): 7. Contingent on sale of other property: No.
5. Closing
Closing date: September 16, 2026 at 12:00 PM. Title company / closing agent (if stated): —. Closing costs
responsibility: both. Governing law state selected by parties: CA.
6. Contingencies
Contingency periods in California transactions are negotiated. Widely used association forms often default around
seventeen (17) days for investigation, but that figure is market practice—not a statute. The periods stated in this
draft control only as private contract terms between the parties.
Inspection / due diligence: Disclosures deadline: August 12, 2026 5:00 PM; Contractor deadline: August 9, 2026
5:00 PM; Negotiation days: 5
Appraisal contingency: Yes; negotiation days: 5
Survey / title review: Survey — buyer notify days: 5; seller remedy days: 5. Title — buyer review days: 10; seller
remedy days: 5; type: —
Offer expiration: August 7, 2026 5:00 PM.
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — CA · realdesk.purchase.ca.v1 · Page 1 of 3
--- [page 2] ---
7. CA disclosures and transaction notices
California-specific disclosures (draft).
Transfer Disclosure Statement (TDS): For most sales of one-to-four unit residential property, Seller must complete
and deliver a statutory Transfer Disclosure Statement under Civil Code sections 1102 and following. This RealDesk
draft is not the TDS.
Natural Hazard Disclosure (NHD): Seller must provide required natural hazard disclosures under Civil Code
sections 1103 and following. Delivery is often handled through a third-party report. This draft is not the NHD.
Megan's Law: Information about registered sex offenders is available from the California Department of Justice
Megan's Law website (https://www.meganslaw.ca.gov). The parties should confirm the current Civil Code section
2079.10a notice language with counsel.
Agency, HOA, Mello-Roos, and compliance certificates: Separate disclosures and certifications (smoke/CO
detectors, water heater bracing, water-conserving plumbing, HOA documents, and community tax assessments)
may be required and are not fully collected in this draft.
Lead-based paint: Federal requirements for most pre-1978 housing apply and are addressed in a separate
addendum when required by the data provided.
8. Default and remedies
If Buyer defaults after contingencies are removed or waived, Seller may pursue remedies available under applicable
law and this Agreement, which may include retention of earnest money as liquidated damages if the parties have
validly so agreed, or other remedies not prohibited by law. If Seller defaults, Buyer may pursue remedies available
under applicable law, including return of earnest money and, where available, specific performance or damages.
The parties should confirm enforceability of any liquidated-damages term with counsel in CA.
9. Additional terms
None stated.
Buyer signature
Date: _______________
Additional buyer signature (if any)
Date: _______________
Seller signature
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — CA · realdesk.purchase.ca.v1 · Page 2 of 3
--- [page 3] ---
Date: _______________
Additional seller signature (if any)
Date: _______________
Generated 2:57 AM local time at the Property (Pacific Time)
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — CA · realdesk.purchase.ca.v1 · Page 3 of 3
```
</details>

### TX — Purchase (`purchase-TX.pdf`)

- **File size:** 14,883 bytes  
- **Pages:** 3  
- **Template ID:** `realdesk.purchase.tx.v1` @ `1.0.0-draft`

**Checklist:**

- [x] Correct state name (`TX`) appears throughout — jurisdiction header, notice text, and state-specific disclosures section all correctly scoped to TX. No leftover text from another state's template.
- [x] "NOT ATTORNEY-REVIEWED" draft disclaimer present and prominent at top of page 1.
- [x] No lorem-ipsum / placeholder-lorem / TODO text found.
- [x] Section order complete, nothing cut off: Parties → Property → Purchase price/earnest money → Financing → Closing → Contingencies → State disclosures → Default/remedies → Additional terms → Signatures. Doc ends cleanly on page 3 of 3 with generated-timestamp footer — not truncated.
- [x] File size (14,883 bytes) and page count (3 pages) reasonable — consistent with the other 4 purchase docs, not suspiciously short or long.

**Flagged issues:**

- See cross-cutting issues #1 (ZIP) and #2 (timezone) above — this doc inherits both.
- See cross-cutting issue #3 (party-name trailing em-dash) above.
- See cross-cutting issues #4 (earnest-money dangling dash-period) and #5 (double period on personal property line) above.
- See cross-cutting issue #6 (Seller signature/Date split across page break) above.

<details><summary>Full extracted text</summary>

```
--- [page 1] ---
RealDesk Residential Purchase Agreement (Draft) — TX
IMPORTANT NOTICE — NOT ATTORNEY-REVIEWED. This document is a RealDesk Residential Purchase Agreement (Draft)
for TX. It was generated by RealDesk based on information you provided and a general understanding of TX law. It has not been
reviewed by a licensed attorney. It is not an official state association form and is not a substitute for counsel-approved or
association-promulgated contracts. Consult a real estate attorney licensed in TX before relying on this document for a real
transaction.
Template: realdesk.purchase.tx.v1 · Version: 1.0.0-draft · Jurisdiction: TX
1. Parties
This Residential Purchase Agreement (the "Agreement") is made between Seller Sam Seller— and Buyer Blake
Buyer—. Buyer's agent (if any): —. Seller's agent (if any): —. Effective date (as entered): August 2, 2026.
2. Property
Seller agrees to sell and Buyer agrees to buy the real property located at 200 Oak Ave, Sample City, TX, 85001 (the
"Property"), property type: single_family. Year built (if known): 2005. Tax parcel / other property info: —. Land
included: Yes. Mineral rights transferred: Yes. Personal property included (if described): None described..
3. Purchase price and earnest money
Purchase price: $425,000.00. Earnest money: $10,000.00, due August 5, 2026 —. Escrow required: Yes. If this
transaction fails for a reason entitling Buyer to return of earnest money under this Agreement, earnest money
should be returned within 5 days after proper demand, subject to escrow instructions.
4. Financing
Third-party / bank financing. Loan type: conventional. Pre-approval letter date: August 2, 2026. Seller notification
days (financing): 7. Contingent on sale of other property: No.
5. Closing
Closing date: September 16, 2026 at 12:00 PM. Title company / closing agent (if stated): —. Closing costs
responsibility: both. Governing law state selected by parties: TX.
6. Contingencies
In Texas practice, Purchaser's primary flexibility window is often a negotiated option/termination period paired with
earnest money deposited with the escrow agent. Financing and appraisal protections, if any, are contractual.
Confirm timelines with Texas counsel; this draft is not a TREC form.
Inspection / due diligence: Disclosures deadline: August 12, 2026 5:00 PM; Contractor deadline: August 9, 2026
5:00 PM; Negotiation days: 5
Appraisal contingency: Yes; negotiation days: 5
Survey / title review: Survey — buyer notify days: 5; seller remedy days: 5. Title — buyer review days: 10; seller
remedy days: 5; type: —
Offer expiration: August 7, 2026 5:00 PM.
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — TX · realdesk.purchase.tx.v1 · Page 1 of 3
--- [page 2] ---
7. TX disclosures and transaction notices
Texas-specific disclosures (draft).
Seller's Disclosure of Property Condition: Under Texas Property Code section 5.008, most sellers of residential
property comprising not more than one dwelling unit must give the purchaser a written seller's disclosure notice on
or before the effective date of the contract. If the notice is delivered late, Purchaser may have a statutory right to
terminate within seven (7) days after receiving the notice. This RealDesk draft is not the section 5.008 notice.
HOA / public improvement districts: If the Property is subject to mandatory association membership or public
improvement district assessments, additional statutory notices may be required.
Option period (contractual practice): Texas residential contracts often include a negotiated option period during
which Purchaser may terminate for any reason in exchange for an option fee. This draft may describe inspection
and termination timing using the parties' negotiated fields; it is not a TREC promulgated contract and does not copy
TREC option-period language.
Lead-based paint: Federal requirements for most pre-1978 housing apply and are addressed in a separate
addendum when required.
8. Default and remedies
If Buyer defaults after contingencies are removed or waived, Seller may pursue remedies available under applicable
law and this Agreement, which may include retention of earnest money as liquidated damages if the parties have
validly so agreed, or other remedies not prohibited by law. If Seller defaults, Buyer may pursue remedies available
under applicable law, including return of earnest money and, where available, specific performance or damages.
The parties should confirm enforceability of any liquidated-damages term with counsel in TX.
9. Additional terms
None stated.
Buyer signature
Date: _______________
Additional buyer signature (if any)
Date: _______________
Seller signature
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — TX · realdesk.purchase.tx.v1 · Page 2 of 3
--- [page 3] ---
Date: _______________
Additional seller signature (if any)
Date: _______________
Generated 2:57 AM local time at the Property (Pacific Time)
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — TX · realdesk.purchase.tx.v1 · Page 3 of 3
```
</details>

### FL — Purchase (`purchase-FL.pdf`)

- **File size:** 14,699 bytes  
- **Pages:** 3  
- **Template ID:** `realdesk.purchase.fl.v1` @ `1.0.0-draft`

**Checklist:**

- [x] Correct state name (`FL`) appears throughout — jurisdiction header, notice text, and state-specific disclosures section all correctly scoped to FL. No leftover text from another state's template.
- [x] "NOT ATTORNEY-REVIEWED" draft disclaimer present and prominent at top of page 1.
- [x] No lorem-ipsum / placeholder-lorem / TODO text found.
- [x] Section order complete, nothing cut off: Parties → Property → Purchase price/earnest money → Financing → Closing → Contingencies → State disclosures → Default/remedies → Additional terms → Signatures. Doc ends cleanly on page 3 of 3 with generated-timestamp footer — not truncated.
- [x] File size (14,699 bytes) and page count (3 pages) reasonable — consistent with the other 4 purchase docs, not suspiciously short or long.

**Flagged issues:**

- See cross-cutting issues #1 (ZIP) and #2 (timezone) above — this doc inherits both.
- See cross-cutting issue #3 (party-name trailing em-dash) above.
- See cross-cutting issues #4 (earnest-money dangling dash-period) and #5 (double period on personal property line) above.
- See cross-cutting issue #6 (Seller signature/Date split across page break) above.

<details><summary>Full extracted text</summary>

```
--- [page 1] ---
RealDesk Residential Purchase Agreement (Draft) — FL
IMPORTANT NOTICE — NOT ATTORNEY-REVIEWED. This document is a RealDesk Residential Purchase Agreement (Draft)
for FL. It was generated by RealDesk based on information you provided and a general understanding of FL law. It has not been
reviewed by a licensed attorney. It is not an official state association form and is not a substitute for counsel-approved or
association-promulgated contracts. Consult a real estate attorney licensed in FL before relying on this document for a real
transaction.
Template: realdesk.purchase.fl.v1 · Version: 1.0.0-draft · Jurisdiction: FL
1. Parties
This Residential Purchase Agreement (the "Agreement") is made between Seller Sam Seller— and Buyer Blake
Buyer—. Buyer's agent (if any): —. Seller's agent (if any): —. Effective date (as entered): August 2, 2026.
2. Property
Seller agrees to sell and Buyer agrees to buy the real property located at 200 Oak Ave, Sample City, FL, 85001 (the
"Property"), property type: single_family. Year built (if known): 2005. Tax parcel / other property info: —. Land
included: Yes. Mineral rights transferred: Yes. Personal property included (if described): None described..
3. Purchase price and earnest money
Purchase price: $425,000.00. Earnest money: $10,000.00, due August 5, 2026 —. Escrow required: Yes. If this
transaction fails for a reason entitling Buyer to return of earnest money under this Agreement, earnest money
should be returned within 5 days after proper demand, subject to escrow instructions.
4. Financing
Third-party / bank financing. Loan type: conventional. Pre-approval letter date: August 2, 2026. Seller notification
days (financing): 7. Contingent on sale of other property: No.
5. Closing
Closing date: September 16, 2026 at 12:00 PM. Title company / closing agent (if stated): —. Closing costs
responsibility: both. Governing law state selected by parties: FL.
6. Contingencies
Florida contingency and escrow release rules are primarily contractual, layered on top of statutory disclosures.
Inspection and financing deadlines in this draft reflect the parties' negotiated fields.
Inspection / due diligence: Disclosures deadline: August 12, 2026 5:00 PM; Contractor deadline: August 9, 2026
5:00 PM; Negotiation days: 5
Appraisal contingency: Yes; negotiation days: 5
Survey / title review: Survey — buyer notify days: 5; seller remedy days: 5. Title — buyer review days: 10; seller
remedy days: 5; type: —
Offer expiration: August 7, 2026 5:00 PM.
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — FL · realdesk.purchase.fl.v1 · Page 1 of 3
--- [page 2] ---
7. FL disclosures and transaction notices
Florida-specific disclosures (draft).
RADON GAS: Radon is a naturally occurring radioactive gas that, when it has accumulated in a building in sufficient
quantities, may present health risks to persons who are exposed to it over time. Levels of radon that exceed federal
and state guidelines have been found in buildings in Florida. Additional information regarding radon and radon
testing may be obtained from your county health department.
Material latent defects: Under Florida case law (including Johnson v. Davis), Seller must disclose known facts that
materially affect the value of the property and are not readily observable. Selling "as is" does not eliminate that duty.
Flood, HOA, condominium, and coastal disclosures: Florida law may require flood disclosures, homeowners'
association disclosure summaries, condominium document packages with rescission rights, and coastal
construction control line notices when applicable. Those packages are not fully collected in this RealDesk draft and
must be handled separately when required.
Lead-based paint: Federal requirements for most pre-1978 housing apply and are addressed in a separate
addendum when required.
8. Default and remedies
If Buyer defaults after contingencies are removed or waived, Seller may pursue remedies available under applicable
law and this Agreement, which may include retention of earnest money as liquidated damages if the parties have
validly so agreed, or other remedies not prohibited by law. If Seller defaults, Buyer may pursue remedies available
under applicable law, including return of earnest money and, where available, specific performance or damages.
The parties should confirm enforceability of any liquidated-damages term with counsel in FL.
9. Additional terms
None stated.
Buyer signature
Date: _______________
Additional buyer signature (if any)
Date: _______________
Seller signature
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — FL · realdesk.purchase.fl.v1 · Page 2 of 3
--- [page 3] ---
Date: _______________
Additional seller signature (if any)
Date: _______________
Generated 2:57 AM local time at the Property (Pacific Time)
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — FL · realdesk.purchase.fl.v1 · Page 3 of 3
```
</details>

### NY — Purchase (`purchase-NY.pdf`)

- **File size:** 14,857 bytes  
- **Pages:** 3  
- **Template ID:** `realdesk.purchase.ny.v1` @ `1.0.0-draft`

**Checklist:**

- [x] Correct state name (`NY`) appears throughout — jurisdiction header, notice text, and state-specific disclosures section all correctly scoped to NY. No leftover text from another state's template.
- [x] "NOT ATTORNEY-REVIEWED" draft disclaimer present and prominent at top of page 1.
- [x] No lorem-ipsum / placeholder-lorem / TODO text found.
- [x] Section order complete, nothing cut off: Parties → Property → Purchase price/earnest money → Financing → Closing → Contingencies → State disclosures → Default/remedies → Additional terms → Signatures. Doc ends cleanly on page 3 of 3 with generated-timestamp footer — not truncated.
- [x] File size (14,857 bytes) and page count (3 pages) reasonable — consistent with the other 4 purchase docs, not suspiciously short or long.

**Flagged issues:**

- See cross-cutting issues #1 (ZIP) and #2 (timezone) above — this doc inherits both.
- See cross-cutting issue #3 (party-name trailing em-dash) above.
- See cross-cutting issues #4 (earnest-money dangling dash-period) and #5 (double period on personal property line) above.
- See cross-cutting issue #6 (Seller signature/Date split across page break) above.

<details><summary>Full extracted text</summary>

```
--- [page 1] ---
RealDesk Residential Purchase Agreement (Draft) — NY
IMPORTANT NOTICE — NOT ATTORNEY-REVIEWED. This document is a RealDesk Residential Purchase Agreement (Draft)
for NY. It was generated by RealDesk based on information you provided and a general understanding of NY law. It has not been
reviewed by a licensed attorney. It is not an official state association form and is not a substitute for counsel-approved or
association-promulgated contracts. Consult a real estate attorney licensed in NY before relying on this document for a real
transaction.
Template: realdesk.purchase.ny.v1 · Version: 1.0.0-draft · Jurisdiction: NY
1. Parties
This Residential Purchase Agreement (the "Agreement") is made between Seller Sam Seller— and Buyer Blake
Buyer—. Buyer's agent (if any): —. Seller's agent (if any): —. Effective date (as entered): August 2, 2026.
2. Property
Seller agrees to sell and Buyer agrees to buy the real property located at 200 Oak Ave, Sample City, NY, 85001 (the
"Property"), property type: single_family. Year built (if known): 2005. Tax parcel / other property info: —. Land
included: Yes. Mineral rights transferred: Yes. Personal property included (if described): None described..
3. Purchase price and earnest money
Purchase price: $425,000.00. Earnest money: $10,000.00, due August 5, 2026 —. Escrow required: Yes. If this
transaction fails for a reason entitling Buyer to return of earnest money under this Agreement, earnest money
should be returned within 5 days after proper demand, subject to escrow instructions.
4. Financing
Third-party / bank financing. Loan type: conventional. Pre-approval letter date: August 2, 2026. Seller notification
days (financing): 7. Contingent on sale of other property: No.
5. Closing
Closing date: September 16, 2026 at 12:00 PM. Title company / closing agent (if stated): —. Closing costs
responsibility: both. Governing law state selected by parties: NY.
6. Contingencies
In New York, inspection, mortgage, and title contingencies are commonly negotiated by attorneys as riders before
the contract is fully executed and delivered. Treat the contingency fields below as draft business terms pending
attorney revision.
Inspection / due diligence: Disclosures deadline: August 12, 2026 5:00 PM; Contractor deadline: August 9, 2026
5:00 PM; Negotiation days: 5
Appraisal contingency: Yes; negotiation days: 5
Survey / title review: Survey — buyer notify days: 5; seller remedy days: 5. Title — buyer review days: 10; seller
remedy days: 5; type: —
Offer expiration: August 7, 2026 5:00 PM.
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — NY · realdesk.purchase.ny.v1 · Page 1 of 3
--- [page 2] ---
7. NY disclosures and transaction notices
New York-specific disclosures (draft).
ATTORNEY INVOLVEMENT (IMPORTANT): New York residential purchase practice is commonly attorney-driven.
Contracts are often negotiated by counsel before they become binding. This RealDesk draft is not a substitute for a
New York attorney-prepared contract. Each party should have a New York-licensed real estate attorney review and,
if appropriate, revise these terms before relying on them.
Property Condition Disclosure Statement (PCDS): For covered one-to-four family residential property, Seller
generally must deliver a Property Condition Disclosure Statement under Real Property Law section 462 before
Purchaser signs a binding contract. This draft is not the PCDS. Condominium and cooperative transactions may
follow different rules.
Down payment escrow: Earnest money / down payments in New York are frequently held in escrow by Seller's
attorney or another agreed escrow agent. The parties should confirm the escrow holder and release conditions with
counsel.
Lead-based paint: Federal requirements for most pre-1978 housing apply and are addressed in a separate
addendum when required.
8. Default and remedies
If Buyer defaults after contingencies are removed or waived, Seller may pursue remedies available under applicable
law and this Agreement, which may include retention of earnest money as liquidated damages if the parties have
validly so agreed, or other remedies not prohibited by law. If Seller defaults, Buyer may pursue remedies available
under applicable law, including return of earnest money and, where available, specific performance or damages.
The parties should confirm enforceability of any liquidated-damages term with counsel in NY.
9. Additional terms
None stated.
Buyer signature
Date: _______________
Additional buyer signature (if any)
Date: _______________
Seller signature
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — NY · realdesk.purchase.ny.v1 · Page 2 of 3
--- [page 3] ---
Date: _______________
Additional seller signature (if any)
Date: _______________
Generated 2:57 AM local time at the Property (Pacific Time)
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — NY · realdesk.purchase.ny.v1 · Page 3 of 3
```
</details>

### AZ — Purchase (`purchase-AZ.pdf`)

- **File size:** 14,416 bytes  
- **Pages:** 3  
- **Template ID:** `realdesk.purchase.az.v1` @ `1.0.0-draft`

**Checklist:**

- [x] Correct state name (`AZ`) appears throughout — jurisdiction header, notice text, and state-specific disclosures section all correctly scoped to AZ. No leftover text from another state's template.
- [x] "NOT ATTORNEY-REVIEWED" draft disclaimer present and prominent at top of page 1.
- [x] No lorem-ipsum / placeholder-lorem / TODO text found.
- [x] Section order complete, nothing cut off: Parties → Property → Purchase price/earnest money → Financing → Closing → Contingencies → State disclosures → Default/remedies → Additional terms → Signatures. Doc ends cleanly on page 3 of 3 with generated-timestamp footer — not truncated.
- [x] File size (14,416 bytes) and page count (3 pages) reasonable — consistent with the other 4 purchase docs, not suspiciously short or long.

**Flagged issues:**

- See cross-cutting issues #1 (ZIP) and #2 (timezone) above — this doc inherits both.
- See cross-cutting issue #3 (party-name trailing em-dash) above.
- See cross-cutting issues #4 (earnest-money dangling dash-period) and #5 (double period on personal property line) above.
- Signature block (page 2) does NOT show the split described in issue #6 — Seller signature and Date stay together here, unlike CA/TX/FL/NY purchase docs. Flagging the inconsistency, not a defect in this file specifically.

<details><summary>Full extracted text</summary>

```
--- [page 1] ---
RealDesk Residential Purchase Agreement (Draft) — AZ
IMPORTANT NOTICE — NOT ATTORNEY-REVIEWED. This document is a RealDesk Residential Purchase Agreement (Draft)
for AZ. It was generated by RealDesk based on information you provided and a general understanding of AZ law. It has not been
reviewed by a licensed attorney. It is not an official state association form and is not a substitute for counsel-approved or
association-promulgated contracts. Consult a real estate attorney licensed in AZ before relying on this document for a real
transaction.
Template: realdesk.purchase.az.v1 · Version: 1.0.0-draft · Jurisdiction: AZ
1. Parties
This Residential Purchase Agreement (the "Agreement") is made between Seller Sam Seller— and Buyer Blake
Buyer—. Buyer's agent (if any): —. Seller's agent (if any): —. Effective date (as entered): August 2, 2026.
2. Property
Seller agrees to sell and Buyer agrees to buy the real property located at 200 Oak Ave, Sample City, AZ, 85001 (the
"Property"), property type: single_family. Year built (if known): 2005. Tax parcel / other property info: —. Land
included: Yes. Mineral rights transferred: Yes. Personal property included (if described): None described..
3. Purchase price and earnest money
Purchase price: $425,000.00. Earnest money: $10,000.00, due August 5, 2026 —. Escrow required: Yes. If this
transaction fails for a reason entitling Buyer to return of earnest money under this Agreement, earnest money
should be returned within 5 days after proper demand, subject to escrow instructions.
4. Financing
Third-party / bank financing. Loan type: conventional. Pre-approval letter date: August 2, 2026. Seller notification
days (financing): 7. Contingent on sale of other property: No.
5. Closing
Closing date: September 16, 2026 at 12:00 PM. Title company / closing agent (if stated): —. Closing costs
responsibility: both. Governing law state selected by parties: AZ.
6. Contingencies
Arizona residential contracts commonly include an inspection period and loan contingency negotiated by the parties
and handled through escrow. The deadlines below reflect wizard inputs and are not copied from any association
form.
Inspection / due diligence: Disclosures deadline: August 12, 2026 5:00 PM; Contractor deadline: August 9, 2026
5:00 PM; Negotiation days: 5
Appraisal contingency: Yes; negotiation days: 5
Survey / title review: Survey — buyer notify days: 5; seller remedy days: 5. Title — buyer review days: 10; seller
remedy days: 5; type: —
Offer expiration: August 7, 2026 5:00 PM.
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — AZ · realdesk.purchase.az.v1 · Page 1 of 3
--- [page 2] ---
7. AZ disclosures and transaction notices
Arizona-specific disclosures (draft).
Material facts: Seller must disclose known material facts about the Property. Market practice often uses a Seller's
Property Disclosure Statement; this RealDesk draft is not an Arizona Association of REALTORS® SPDS or
purchase contract.
Affidavit of Disclosure: For certain transfers of five or fewer parcels (other than subdivided land) in an
unincorporated area of a county, Arizona Revised Statutes section 33-422 may require a statutory Affidavit of
Disclosure with a buyer rescission window. The parties must determine whether that statute applies.
Inspection and loan contingencies: Timing is contractual. Use the inspection, appraisal, and financing fields
completed in the wizard; confirm customary Arizona escrow practices with the title/escrow company and counsel.
Lead-based paint: Federal requirements for most pre-1978 housing apply and are addressed in a separate
addendum when required.
8. Default and remedies
If Buyer defaults after contingencies are removed or waived, Seller may pursue remedies available under applicable
law and this Agreement, which may include retention of earnest money as liquidated damages if the parties have
validly so agreed, or other remedies not prohibited by law. If Seller defaults, Buyer may pursue remedies available
under applicable law, including return of earnest money and, where available, specific performance or damages.
The parties should confirm enforceability of any liquidated-damages term with counsel in AZ.
9. Additional terms
None stated.
Buyer signature
Date: _______________
Additional buyer signature (if any)
Date: _______________
Seller signature
Date: _______________
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — AZ · realdesk.purchase.az.v1 · Page 2 of 3
--- [page 3] ---
Additional seller signature (if any)
Date: _______________
Generated 2:57 AM local time at the Property (Pacific Time)
Buyer's Initials _______     Seller's Initials _______
RealDesk Residential Purchase Agreement (Draft) — AZ · realdesk.purchase.az.v1 · Page 3 of 3
```
</details>
