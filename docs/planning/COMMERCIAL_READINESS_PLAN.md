# RealDesk Commercial Readiness Plan

**Status:** Active — Item 1 complete; Item 2 is next  
**Created:** 2026-08-01  
**Source:** `STATE_OF_REALDESK.md` gap list supplied during the 2026-08-01 audit  
**Goal:** Close the eight known gaps that prevent RealDesk from being safely and commercially deployable.

## Current baseline

The core CRM is implemented: leads, deals, milestones, properties, commissions, finance, contract wizards, screening, deposits, teams, dashboards, and the CCPA route. These areas are not refactoring targets for this plan.

Current verification baseline:

- `npm run lint`: fails with 203 errors and 59 warnings.
- `npm run typecheck`: passes.
- `npm run test`: passes, 104/104 tests.
- `npm run build`: passes.

## Execution rules

- Complete the work in the sequence below unless a documented blocker requires a change.
- Obtain explicit `APPROVE` before implementing each item, in accordance with the repository workflow.
- Do not edit or rename an applied migration. Preserve production history and add corrective migrations when required.
- Do not refactor working CRM modules unless a listed gap requires a narrowly scoped change.
- Every completed item must record its completion date, changed files/migrations, verification commands, rollout notes, and remaining risks in this document.
- New or modified files must introduce no new lint errors even before the global lint cleanup is complete.

## Status legend

| Status | Meaning |
|---|---|
| Not started | No implementation work has begun |
| In progress | Approved work is being implemented |
| Blocked | A named external or technical dependency prevents progress |
| Verification | Implementation is complete and acceptance checks are running |
| Complete | Acceptance criteria and rollout requirements are satisfied |

## Ordered roadmap

| Order | Gap | Priority | Effort | Status | Hard dependency |
|---:|---|---|---|---|---|
| 1 | Migration history safety | P2 | Small | Complete | None |
| 2 | Server-side encryption and data migration | P0 | Large | Not started | Item 1 |
| 3 | Billing enforcement | P0 | Medium | Not started | Independent of Item 2 |
| 4 | Legally usable lease/purchase documents | P0 | Large | Not started | External legal/template input |
| 5 | E-signature integration | P1 | Large | Not started | Item 4 |
| 6 | Customer-facing email/SMS workflows | P1 | Large | Not started | Provider and consent decisions |
| 7 | Complete CCPA deletion flow | P2 | Medium | Not started | Item 1; reuse Item 2 security patterns |
| 8 | Global lint cleanup and CI gate | P2 | Large | Not started | None |

Billing and encryption have no code dependency and may run in parallel when capacity permits. Both remain production gates: paid access must not be launched while sensitive financial data can be decrypted with a browser-exposed key.

## 1. Migration history safety

**Priority / effort:** P2 / Small  
**Why first:** Encryption and CCPA work may require schema changes. New migrations must not be added on top of an ambiguous history.

### Work

- Audited the local migration sequence and linked production migration tracking.
- Confirmed `0035` was never created and recorded it as an intentional gap.
- Recorded both `0039` files as manually applied production-history exceptions.
- Preserved both filenames to avoid diverging from the manually applied production state.
- Reserved `0047` as the next migration number and documented the exception in `CLAUDE.md`.

### Blocks / unlocks

- **Blocks:** Safe encryption and CCPA schema changes.
- **Unlocks:** Predictable local, staging, and production migration execution.

### Acceptance criteria

- [x] Local migration numbering and linked production tracking were audited.
- [x] `0035` and both `0039` files are explicitly documented in `CLAUDE.md`.
- [x] Applied SQL files were not renamed, edited, or deleted.
- [x] Future migrations are instructed not to reuse `0035` or `0039` and to start at `0047`.

## 2. Server-side encryption and data migration

**Priority / effort:** P0 / Large  
**Original issue:** `src/services/encryption.service.ts` read a client-exposed encryption key from the browser environment; server-side migration is now in progress.

### Sub-task: Fixed `tax_id_encrypted`/`tax_id_hash` column mismatch — COMPLETE

- `contractCreation.service.ts` and `contractUpdate.service.ts` were writing to non-existent `tax_id_encrypted`/`tax_id_hash` columns; corrected to use the actual existing `tc_encrypted`/`tc_hash` columns (legacy naming, now holds US Tax ID/EIN data — rename deferred to the full encryption migration, tracked below).
- This was blocking contract creation for any owner with a Tax ID set (previously threw `Owner data incomplete: name and tc_hash required`).
- Verified: 104/104 tests passing, full manual trace of both create and update paths, typecheck passing, no remaining references to the old incorrect column names anywhere in `src/` or `supabase/`.
- Not yet done: live E2E write against a real staging/local DB (blocked by local Docker unavailability) — code path fully traced manually instead.
- Still open under Item 2: the actual server-side (Edge Function) encryption migration — key rotation deferred to end of full process per decision; `tc_encrypted`/`tc_hash` → `tax_id_encrypted`/`tax_id_hash` column rename deferred to happen alongside that migration, not done separately.

### Work

- Introduce authenticated, organization-scoped Edge Functions for encrypt and decrypt operations.
- Keep encryption keys exclusively in server-side secret storage; never return key material to the client.
- Define versioned ciphertext metadata so future key rotation is possible.
- Migrate existing encrypted routing numbers, account numbers, and tax IDs with resumable, idempotent processing.
- Remove the client encryption key and direct browser decryption path after migration verification.
- Define rollback, partial-migration, malformed-data, authorization-failure, and key-rotation behavior.

### Blocks / unlocks

- **Blocks:** Safe production use, storage of financial identifiers, and credible legal/security posture.
- **Unlocks:** Secure handling of sensitive fields and a reusable server-side security pattern for compliance work.

### Acceptance criteria

- No encryption key or equivalent secret is present in the browser bundle or client environment variables.
- Cross-organization encryption/decryption requests are denied.
- New and migrated records round-trip correctly through server-side encryption.
- Migration is idempotent, observable, and has a tested rollback/recovery procedure.
- Security tests, typecheck, tests, and build pass; changed files are lint-clean.

## 3. Billing enforcement

**Priority / effort:** P0 / Medium  
**Current issue:** `src/services/billingService.ts` hardcodes `hasActiveAccess` to `true`; protected routes enforce only authentication and onboarding.

### Work

- Derive access from authoritative trial and Stripe subscription state.
- Enforce access in the route layer and in privileged server/data operations where bypassing the UI would matter.
- Keep billing, account, checkout, portal, and sign-out paths available to blocked users.
- Define behavior for trial expiry, cancellation at period end, failed payment, webhook delay, Stripe outage, and missing billing records.
- Replace mock invoice/history presentation or clearly remove it from the production experience.

### Blocks / unlocks

- **Blocks:** Revenue and enforceable paid plans.
- **Unlocks:** Trial conversion, subscription gating, and commercial onboarding.

### Acceptance criteria

- Active trial and paid users can access entitled application routes.
- Expired, unpaid, or invalid accounts cannot access protected product functionality.
- Billing recovery routes remain accessible.
- Stripe webhook changes produce the expected access transition and are covered by tests.
- No client-only override can restore paid access.

## 4. Legally usable lease and purchase documents

**Priority / effort:** P0 / Large  
**Current issue:** Lease and purchase PDFs identify themselves as summaries that must be used with jurisdiction-specific documents.

### Work

- Obtain counsel-approved source forms and rules for the explicitly supported jurisdictions.
- Define supported states rather than implying nationwide legal coverage.
- Map wizard data into versioned, immutable templates while preserving source-template and jurisdiction metadata.
- Store the exact rendered version and inputs required to reproduce/audit a document.
- Prevent generation when required state-specific data or a supported template is unavailable.

### Blocks / unlocks

- **Blocks:** Completing a real transaction in RealDesk and the core product value proposition.
- **Unlocks:** E-signature, contract delivery, and end-to-end closing workflows.

### Acceptance criteria

- Generated documents no longer describe themselves as summaries.
- Every document records jurisdiction, template identity, template version, generation time, and source transaction.
- Unsupported jurisdictions fail clearly instead of producing a generic legal document.
- Counsel approval and template licensing/provenance are recorded outside the generated PDF and linked from the implementation record.
- Golden-file/render tests cover every supported template.

## 5. E-signature integration

**Priority / effort:** P1 / Large  
**Hard prerequisite:** Item 4. Do not integrate signing around legally insufficient summary PDFs.

### Work

- Select one e-signature provider that supports embedded or remote signing, webhooks, audit trails, and completed-document retrieval.
- Create envelopes from versioned RealDesk documents and define ordered signers/roles.
- Persist provider IDs, signing state, timestamps, failures, audit trail, and completed artifact paths.
- Verify webhook authenticity and make webhook processing idempotent.
- Handle declines, expiration, resend, cancellation, partial signatures, and provider outages.

### Blocks / unlocks

- **Blocks:** Completing signatures without leaving RealDesk.
- **Unlocks:** End-to-end contract execution and signed-document archival.

### Acceptance criteria

- A supported document can be sent, signed, tracked, and archived from RealDesk.
- Completed PDFs and audit evidence are immutable and organization-scoped.
- Duplicate/out-of-order webhooks do not corrupt state.
- Declined, expired, failed, and cancelled envelopes have explicit recovery paths.

## 6. Customer-facing email and SMS workflows

**Priority / effort:** P1 / Large  
**Current issue:** Custom outbound email is limited to organization invitations; deadlines and follow-ups remain in-app.

### Work

- Implement transactional email and SMS delivery behind provider-neutral service interfaces.
- Cover lead follow-up, agent/client milestone notices, deadline escalation, and contract/signature delivery.
- Persist delivery attempts, provider IDs, status, retry count, final failure, and originating entity.
- Implement consent, opt-out/unsubscribe, quiet hours, channel preference, and required compliance text.
- Use idempotency and scheduled retries to prevent duplicate messages.

### Blocks / unlocks

- **Blocks:** Reliable communication outside the application.
- **Unlocks:** Follow-up automation, deadline escalation, contract delivery, and the future agentic layer.

### Acceptance criteria

- Approved workflow events generate the correct message once through permitted channels.
- Consent and opt-out rules are enforced before delivery.
- Delivery/failure state is visible and auditable.
- Retries are bounded and idempotent; permanent failures surface to the responsible user.

## 7. Complete CCPA deletion flow

**Priority / effort:** P2 / Medium  
**Current issue:** The current flow anonymizes at most one matching lead and one tenant and does not cover all personal-data locations.

### Work

- Create a personal-data inventory covering CRM, transaction, contract, document, communication, billing-reference, and audit tables.
- Separate deletable data from legally required retention and record the lawful retention reason.
- Process every matching record, not only the first lead or tenant.
- Support identity verification, discovery/export, anonymization/deletion, progress, failure recovery, and completion evidence.
- Keep the operation organization-scoped, idempotent, and auditable.

### Blocks / unlocks

- **Blocks:** Defensible privacy-request handling.
- **Unlocks:** Complete data-subject workflows and auditable compliance operations.

### Acceptance criteria

- Automated tests cover multiple records across every inventoried data location.
- Retained records have documented reasons and unnecessary PII is removed.
- Partial failures can resume without duplicating or skipping work.
- The requester/admin receives a table-level completion summary without exposing unrelated data.

## 8. Global lint cleanup and CI gate

**Priority / effort:** P2 / Large  
**Current issue:** Lint reports 203 errors and 59 warnings, including widespread explicit `any` usage.

### Work

- Fix errors in risk order: authentication/security, contracts, billing/finance, services, feature UI, then warnings.
- Replace `any`, unsafe casts, invalid interfaces, stale hook dependencies, and unnecessary escapes with correct types/logic.
- Avoid behavior-changing refactors unless separately approved and tested.
- Make lint a required CI check once the baseline reaches zero.

### Blocks / unlocks

- **Blocks:** Nothing directly, but compounds regression risk in every new feature.
- **Unlocks:** Enforced conventions, safer refactors, and a reliable CI quality gate.

### Acceptance criteria

- `npm run lint` passes with zero errors and zero warnings.
- Typecheck, all tests, and build continue to pass.
- CI rejects new lint failures.
- No broad functional behavior changes are bundled into lint-only commits.

## Hard dependency map

```text
Migration safety ──────┬──> Server-side encryption
                       └──> Complete CCPA deletion

Legal document system ────> E-signature

Email/SMS ─────────────────> Future agentic workflows

Server-side encryption ─┐
Billing enforcement ────┴──> Commercial production release
```

Global lint cleanup is not a hard prerequisite. Changed critical files must nevertheless be lint-clean throughout the roadmap.

## Release gate

RealDesk is commercially deployable only when Items 1–6 are complete, staging verification has passed, production migrations and secrets are confirmed, and no unresolved P0 security or legal-document finding remains. Items 7–8 may not silently regress while the release work proceeds and must be completed immediately after the commercial gate.

## Progress log

| Date | Item | Status change | Evidence / notes |
|---|---|---|---|
| 2026-08-01 | Plan | Created | Eight audited gaps converted into an ordered execution plan. |
| 2026-08-01 | Item 1 — Migration history safety | Complete | Read-only audit completed; production manual-application exception documented in `CLAUDE.md`; no SQL files changed; next migration is `0047`. |
