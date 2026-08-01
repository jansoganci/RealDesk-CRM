# RealDesk Commercial Readiness Plan

**Status:** Active — Items 1–2 complete; Item 3 deferred; Item 8 lint baseline clean (CI gate follow-up); Item 4 is next  

**Created:** 2026-08-01  
**Updated:** 2026-08-02  
**Source:** `STATE_OF_REALDESK.md` gap list supplied during the 2026-08-01 audit  
**Goal:** Close the eight known gaps that prevent RealDesk from being safely and commercially deployable.

## Current baseline

The core CRM is implemented: leads, deals, milestones, properties, commissions, finance, contract wizards, screening, deposits, teams, dashboards, and the CCPA route. These areas are not refactoring targets for this plan.

Current verification baseline:

- `npm run lint`: passes (0 errors, 0 warnings).
- `npm run typecheck`: passes.
- `npm run test`: passes, 114/114 tests.
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
| 2 | Server-side encryption and data migration | P0 | Large | Complete | Item 1 |
| 3 | Billing enforcement | P0 | Medium | Deferred | Demo/feedback period (see §3) |
| 4 | Legally usable lease/purchase documents | P0 | Large | Not started | External legal/template input |
| 5 | E-signature integration | P1 | Large | Not started | Item 4 |
| 6 | Customer-facing email/SMS workflows | P1 | Large | Not started | Provider and consent decisions |
| 7 | Complete CCPA deletion flow | P2 | Medium | In progress | Item 1; reuse Item 2 security patterns |
| 8 | Global lint cleanup and CI gate | P2 | Large | Complete (CI follow-up) | None |

**Related completed (not a separate roadmap row):** CCPA anonymous public submit + status check (`/privacy?org=`, migration `0050`, Edge Functions `submit-ccpa-request` / `check-ccpa-request-status`) — done 2026-08-02. Item 7 remains open for the full deletion/inventory work only.

Billing and encryption have no code dependency and may run in parallel when capacity permits. Both remain production gates: paid access must not be launched while sensitive financial data can be decrypted with a browser-exposed key.

**Item 3 deferred until end of demo/feedback period.** Access stays open (`hasActiveAccess = true`) while demo accounts collect product feedback; enforce billing before any paid launch.

## 1. Migration history safety

**Priority / effort:** P2 / Small  
**Why first:** Encryption and CCPA work may require schema changes. New migrations must not be added on top of an ambiguous history.

### Work

- Audited the local migration sequence and linked production migration tracking.
- Confirmed `0035` was never created and recorded it as an intentional gap.
- Recorded both `0039` files as manually applied production-history exceptions.
- Preserved both filenames to avoid diverging from the manually applied production state.
- Reserved `0047` as the next migration number and documented the exception in `CLAUDE.md`.
- Follow-up: migrations `0047`–`0050` have since been added; the next new migration index is **`0051`**.

### Blocks / unlocks

- **Blocks:** Safe encryption and CCPA schema changes.
- **Unlocks:** Predictable local, staging, and production migration execution.

### Acceptance criteria

- [x] Local migration numbering and linked production tracking were audited.
- [x] `0035` and both `0039` files are explicitly documented in `CLAUDE.md`.
- [x] Applied SQL files were not renamed, edited, or deleted.
- [x] Future migrations are instructed not to reuse `0035` or `0039` and to start at `0047`.

## 2. Server-side encryption and data migration — COMPLETE (2026-08-01 / 2026-08-02)

**Priority / effort:** P0 / Large  
**Original issue:** `src/services/encryption.service.ts` read a client-exposed encryption key from the browser environment.

### Completed work

- Authenticated, organization-scoped Edge Functions: `batch-encrypt-fields`, `batch-decrypt-fields`, `hash-tax-id` (+ `_shared/sensitive-fields.ts`).
- Keys only in Supabase secrets (`FIELD_ENCRYPTION_KEY_V1` / `FIELD_ENCRYPTION_KEY_V2`); client path removed — `encryption.service.ts` is validation-only.
- Versioned ciphertext metadata (`v2:k2:…`) for future key rotation.
- Infra migrations: `0047_sensitive_field_security_infrastructure.sql`, `0048_sensitive_field_rate_limit_rpc.sql`, `0049_fix_create_contract_atomic_us_property_columns.sql`.
- Client calls via `sensitiveFields.service.ts`; contract create/update wired to server encrypt/hash.
- Sub-task complete: writers use existing `tc_encrypted` / `tc_hash` (not non-existent `tax_id_*` columns).
- Verified: typecheck + 104/104 tests; secrets present on RealDesk CRM project.

### Deferred follow-ups (not blocking Item 2 closure)

- Optional cosmetic rename `tc_*` → `tax_id_*` if product wants clearer US naming.
- Broader automated encryption security-test suite beyond current unit coverage.
- Any residual legacy ciphertext backfill, if discovered in a specific environment, as a one-off ops task.

### Acceptance criteria

- [x] No encryption key or equivalent secret is present in the browser bundle or client environment variables.
- [x] Cross-organization encryption/decryption requests are denied (org-owner checks in Edge Functions).
- [x] New records round-trip through server-side encryption.
- [x] Rate-limit + audit infrastructure in place; service-role only for crypto tables.
- [x] Typecheck and tests pass for the shipped path.

## 3. Billing enforcement

**Priority / effort:** P0 / Medium  
**Status:** Deferred — Item 3 deferred until end of demo/feedback period.  
**Current issue:** `src/services/billingService.ts` hardcodes `hasActiveAccess` to `true`; protected routes enforce only authentication and onboarding. Intentional for now so demo users can try the product without a paywall.

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
**Current issue (resolved in code; apply migration before production use):** Deletion was capped at one lead/tenant with wrong lead column names. Full inventory handlers + resumable progress are implemented.

### Prerequisite already complete (2026-08-02) — public request intake

- Anonymous submit + status check via `/privacy?org={orgId}`.
- Migration `0050_ccpa_public_submit_infrastructure.sql` (org-link RPC, rate limits, audit).
- Edge Functions: `submit-ccpa-request`, `check-ccpa-request-status` (`verify_jwt=false`, Turnstile, service-role insert).
- Client: `ccpa.service.ts` public paths no longer require login; admin `/compliance` unchanged.
- Manually verified: request `8e26d639-971c-4285-ba8d-0aeff7000575` inserted with `requested_by = null`.

### Deletion implementation (2026-08-02) — apply migration `0051`

- Migration `0051_ccpa_deletion_progress.sql`: `deletion_progress`, `deletion_started_at`, status `processing`.
- Engine: `src/services/ccpaDeletion.ts` — all matching rows per table; anonymize vs retain with reasons.
- **Retain entirely:** `contract_instances_v2` + signed PDFs / buyer-agent agreements (legal document exception); report in `deletion_summary`.
- Admin resume via `/compliance` when status is `processing`.
- Tests: `src/services/__tests__/ccpaDeletion.test.ts`.

**Still required before marking Item 7 Complete:** apply `0051` to shared/prod DB; smoke-test one delete request end-to-end.

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
**Status:** Complete for lint baseline; CI enforcement still open (no `.github/workflows` in repo).

### Work

- [x] Fixed errors in risk order: auth/security → contracts → billing/finance → services → feature UI → lib/ui → warnings.
- [x] Replaced `any`, empty interfaces, stale hook deps, and unnecessary escapes with correct types/logic across waves 0–7 on `feature/global-lint-cleanup`.
- [x] Avoided behavior-changing refactors; kept intentional mount-only side effects (e.g. finance recurring processor).
- [ ] Make lint a required CI check — **follow-up**: repository has no GitHub Actions workflows yet.

### Blocks / unlocks

- **Blocks:** Nothing directly, but compounds regression risk in every new feature.
- **Unlocks:** Enforced conventions, safer refactors, and a reliable CI quality gate (after CI follow-up).

### Acceptance criteria

- [x] `npm run lint` passes with zero errors and zero warnings.
- [x] Typecheck, all tests, and build continue to pass.
- [ ] CI rejects new lint failures (no CI workflow present — remaining follow-up).
- [x] No broad functional behavior changes are bundled into lint-only commits.

### Completion notes (2026-08-02)

- Branch: `feature/global-lint-cleanup`
- Commits: `ae8435d` … `ad25e43` (waves 0–7)
- Tooling: parent agent + Composer subagents for contracts/finance/services/features/warnings; mechanical escape restore from stash after branch churn
- Remaining: add CI job running `npm run lint` (and preferably typecheck/test) as required check

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
| 2026-08-01 | Item 1 — Migration history safety | Complete | Read-only audit completed; production manual-application exception documented in `CLAUDE.md`; no SQL files changed; next migration was `0047` (now superseded — next is `0051`). |
| 2026-08-01–02 | Item 2 — Server-side encryption | Complete | Edge encrypt/decrypt/hash, secrets-only keys, migrations `0047`–`0049`, client key removed; tax-id column write fix included. |
| 2026-08-02 | CCPA public submit (Item 7 prerequisite) | Complete | Migration `0050` + Edge Functions + `/privacy?org=` client; live anonymous submit verified. Item 7 deletion scope still open. |
| 2026-08-02 | Plan status sync | Updated | Roadmap table and headers aligned to code; next ordered item is Billing enforcement. |
| 2026-08-02 | Item 3 — Billing enforcement | Deferred | Item 3 deferred until end of demo/feedback period; keep access open for demo accounts; next focus Item 4 (legal documents). |
| 2026-08-02 | Item 7 — CCPA deletion flow | In progress | Design approved (retain `contract_instances_v2` like PDFs). Migration `0051` + `ccpaDeletion.ts` + service rewrite + tests. Apply migration + smoke-test to close. |
| 2026-08-02 | Item 8 — Global lint cleanup | Complete (CI follow-up) | Lint 0/0 on `feature/global-lint-cleanup` (waves 0–7). typecheck/test/build pass. CI required-check still open (no workflows in repo). |
