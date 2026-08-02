# RealDesk Commercial Readiness Plan

**Status:** Active — Items 1–2, 4 (V1), 7–8 complete; Item 3 deferred; Item 5 is next  


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
| 4 | Legally usable lease/purchase documents | P0 | Large | V1 Complete — attorney review deferred | External legal/template input |
| 5 | E-signature integration | P1 | Large | Not started | Item 4 |
| 6 | Customer-facing email/SMS workflows | P1 | Large | Not started | Provider and consent decisions |
| 7 | Complete CCPA deletion flow | P2 | Medium | Complete | Item 1; reuse Item 2 security patterns |
| 8 | Global lint cleanup and CI gate | P2 | Large | Complete | None |

**Related completed (folded into Item 7):** CCPA anonymous public submit + status check (`/privacy?org=`, migration `0050`, Edge Functions) — done 2026-08-02; full deletion engine + prod smoke-test — done 2026-08-02.

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
- Follow-up: migrations `0047`–`0051` have since been added; the next new migration index is **`0052`**.

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

## 4. Legally usable lease and purchase documents — V1 COMPLETE (2026-08-02)

**Priority / effort:** P0 / Large  
**Status:** V1 Complete — attorney review deferred.  
**Original issue:** Lease and purchase PDFs identified themselves as summaries that must be used with jurisdiction-specific documents.

### Completed work

- Original, self-authored (not copied from any licensed/official source) draft lease and purchase agreement templates for five supported states: CA, TX, FL, NY, AZ (`src/templates/documentRegistry/`).
- State-aware statutory disclosure content researched per state and documented in `docs/legal/state-requirements/` (e.g. CA Megan’s Law, FL radon notice, NY bedbug disclosure history, per-state security deposit rules/timelines).
- Jurisdiction gating via `SUPPORTED_DOCUMENT_STATES` — wizard + hard backend guard; unsupported states are cleanly rejected (no silent generic document).
- Document provenance metadata (`template_id`, `template_version`, `jurisdiction`, `generated_at`, `source_transaction_id`) recorded per generation via migration `0052_contract_document_artifacts.sql` and `contract_document_artifacts`.
- Template-driven jsPDF rendering replaced the prior bare summary body; every PDF is labeled “RealDesk … (Draft)” and carries an honest not-attorney-reviewed disclaimer.
- Root-cause fixes for PDF formatting defects found in manual review (shared interpolation gluing stray dashes onto optional fields, double-period fallback typo, pagination that could split signature/heading blocks), covered by new regression tests (43 new tests).

### Verification

- Sample draft PDFs generated for all 5 states × lease + purchase (10 documents).
- Unsupported jurisdiction (e.g. Ohio) rejected without producing a document.
- Lint / typecheck / test / build used to verify the shipped path on the legal-documents feature branch.

### Deferred follow-ups (not blocking Item 4 V1 closure)

- No licensed attorney has reviewed the legal content of these templates. This is a conscious, documented V1 decision — not an oversight — made to enable demo/early-customer use while keeping cost and time-to-market low. Attorney review is required before any real paying customer relies on these documents for an actual transaction, and before adding any additional state beyond the current 5.
- Counsel approval and formal template licensing/provenance outside the generated PDF remain open until attorney review.
- Association/board form licensing (if product later requires official forms) is out of V1 scope.

### Blocks / unlocks

- **Blocks:** Completing a real transaction in RealDesk and the core product value proposition (full commercial reliance still needs attorney review).
- **Unlocks:** Demo/early-customer draft documents for CA/TX/FL/NY/AZ; path to e-signature after counsel sign-off.

### Acceptance criteria

- [x] Generated documents no longer describe themselves as summaries; they are explicit RealDesk drafts with attorney-disclaimer framing.
- [x] Every document records jurisdiction, template identity, template version, generation time, and source transaction (`contract_document_artifacts`).
- [x] Unsupported jurisdictions fail clearly instead of producing a generic legal document.
- [ ] Counsel approval and template licensing/provenance are recorded outside the generated PDF and linked from the implementation record — **deferred** (see Deferred follow-ups).
- [x] Automated regression/render coverage for supported templates and formatting fixes (43 new tests).

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

Scope decision (2026-08-02): SMS is out of scope for now — email only, using Resend (already integrated for org-invitation email). Item title/scope narrowed to 'Customer-facing email workflows' for the current implementation pass. SMS may be revisited as a separate future item.

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
**Status:** Complete (2026-08-02).

### Prerequisite — public request intake (2026-08-02)

- Anonymous submit + status check via `/privacy?org={orgId}`.
- Migration `0050_ccpa_public_submit_infrastructure.sql` (org-link RPC, rate limits, audit).
- Edge Functions: `submit-ccpa-request`, `check-ccpa-request-status` (`verify_jwt=false`, Turnstile, service-role insert).
- Client: `ccpa.service.ts` public paths no longer require login; admin `/compliance` unchanged.
- Manually verified: request `8e26d639-971c-4285-ba8d-0aeff7000575` inserted with `requested_by = null`.

### Deletion implementation + smoke-test (2026-08-02)

- Migration `0051_ccpa_deletion_progress.sql` applied to prod (`esmldgmwahhhplswmkui`): `deletion_progress`, `deletion_started_at`, status `processing`.
- Engine: `src/services/ccpaDeletion.ts` — all matching rows per table; anonymize vs retain with reasons.
- **Retain entirely:** `contract_instances_v2` + signed PDFs / buyer-agent agreements (legal document exception); report in `deletion_summary`.
- Admin resume via `/compliance` when status is `processing`.
- Tests: `src/services/__tests__/ccpaDeletion.test.ts`.
- **Prod smoke-test passed:** delete request `0d6b1f91-e0fe-4c7e-b3b2-48277f99b82f` → `completed`; summary `No matching records found for provided email`; all inventoried tables `done` in `deletion_progress`. Deployed to Cloudflare Pages (`realdesk-us`).

### Blocks / unlocks

- **Blocks:** Defensible privacy-request handling.
- **Unlocks:** Complete data-subject workflows and auditable compliance operations.

### Acceptance criteria

- [x] Automated tests cover multi-record / resume / retain paths (`ccpaDeletion.test.ts`).
- [x] Retained records have documented reasons (`contract_instances_v2`, PDFs, deposits).
- [x] Partial failures can resume via `deletion_progress` (status `processing`).
- [x] Admin receives table-level `deletion_summary` (prod smoke-test verified).

## 8. Global lint cleanup and CI gate — COMPLETE (2026-08-02)

**Priority / effort:** P2 / Large  
**Status:** Complete. Lint baseline is clean. CI workflow added at `.github/workflows/ci.yml` (lint + typecheck + test on push/PR to `main`).

### Work

- [x] Fixed errors in risk order: auth/security → contracts → billing/finance → services → feature UI → lib/ui → warnings.
- [x] Replaced `any`, empty interfaces, stale hook deps, and unnecessary escapes with correct types/logic across waves 0–7 on `feature/global-lint-cleanup`.
- [x] Avoided behavior-changing refactors; kept intentional mount-only side effects (e.g. finance recurring processor).
- [x] Added GitHub Actions workflow `.github/workflows/ci.yml` — runs on push/PR to `main` only (not a daily cron).
- [x] Lint step uses `--max-warnings 0` so any ESLint warning or error fails the job (red check).
- [x] `package.json` `lint` script aligned to `eslint . --max-warnings 0`.

### Blocks / unlocks

- **Blocks:** Nothing directly, but compounds regression risk in every new feature.
- **Unlocks:** Clean local lint baseline; automated quality check on every push/PR to `main`.

### Acceptance criteria

- [x] `npm run lint` passes with zero errors and zero warnings.
- [x] Typecheck, all tests, and build continue to pass.
- [x] CI rejects new lint failures (workflow fails on any lint error/warning via `--max-warnings 0`).
- [x] No broad functional behavior changes are bundled into lint-only commits.

### Completion notes (2026-08-02)

- Branch: `feature/global-lint-cleanup`
- Commits: `ae8435d` … `ad25e43` (waves 0–7)
- Tooling: parent agent + Composer subagents for contracts/finance/services/features/warnings; mechanical escape restore from stash after branch churn
- Verified 2026-08-02: `npm run lint` / `typecheck` / `test` (114/114) / `build` all pass
- CI workflow: `.github/workflows/ci.yml` — job `quality` runs `npm ci` → lint (`--max-warnings 0`) → typecheck → test
- Trigger: `push` and `pull_request` targeting `main` only (event-driven; no schedule)
- Note: Actions tab run appears only after this file is committed and pushed to GitHub. Merge-blocking requires separate branch protection (“Require status checks”) in repo settings.

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

RealDesk is commercially deployable only when Items 1–6 are complete, staging verification has passed, production migrations and secrets are confirmed, and no unresolved P0 security or legal-document finding remains. Items 7–8 are complete and must not silently regress while the release work proceeds.

## Progress log

| Date | Item | Status change | Evidence / notes |
|---|---|---|---|
| 2026-08-01 | Plan | Created | Eight audited gaps converted into an ordered execution plan. |
| 2026-08-01 | Item 1 — Migration history safety | Complete | Read-only audit completed; production manual-application exception documented in `CLAUDE.md`; no SQL files changed; next migration was `0047` (now superseded — next is `0051`). |
| 2026-08-01–02 | Item 2 — Server-side encryption | Complete | Edge encrypt/decrypt/hash, secrets-only keys, migrations `0047`–`0049`, client key removed; tax-id column write fix included. |
| 2026-08-02 | CCPA public submit (Item 7 prerequisite) | Complete | Migration `0050` + Edge Functions + `/privacy?org=` client; live anonymous submit verified. Item 7 deletion scope still open. |
| 2026-08-02 | Plan status sync | Updated | Roadmap table and headers aligned to code; next ordered item is Billing enforcement. |
| 2026-08-02 | Item 3 — Billing enforcement | Deferred | Item 3 deferred until end of demo/feedback period; keep access open for demo accounts; next focus Item 4 (legal documents). |
| 2026-08-02 | Item 7 — CCPA deletion flow | Complete | Migration `0051` on prod; engine + tests shipped; smoke-test delete `0d6b1f91-e0fe-4c7e-b3b2-48277f99b82f` → completed (all tables done; no matching CRM rows for test email). |
| 2026-08-02 | Item 8 — Global lint cleanup | Complete | Lint 0/0 on `feature/global-lint-cleanup` (waves 0–7). Re-verified: lint/typecheck/test (114/114)/build pass. CI workflow added (`.github/workflows/ci.yml`: lint+typecheck+test on push/PR to main; `--max-warnings 0`). Item 8 closed. |
| 2026-08-02 | Item 4 — Legally usable lease/purchase documents | V1 Complete — attorney review deferred | Original draft templates for CA/TX/FL/NY/AZ; state-requirements research docs; jurisdiction gating; migration `0052` artifact metadata; not-attorney-reviewed disclaimer on every PDF; formatting regression tests (43). Attorney review consciously deferred before paying-customer reliance or additional states. |
