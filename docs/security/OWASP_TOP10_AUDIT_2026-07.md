# OWASP Top 10 Audit — 2026-07-20

Full-codebase security review against the OWASP Top 10, run on branch `hermes/leads-us-date-format`. 16 findings, each verified against source (file:line cited) — not generic advice. Method: four parallel review passes (access control, injection, crypto/auth, config/dependencies), cross-checked before inclusion here.

**Summary: 3 critical, 2 high, 6 medium, 5 low.**

## Fix in this order

1. **Move PII encryption server-side.** The key that protects bank routing/account numbers and Tax IDs currently ships to every browser.
2. **Lock down the `contract-pdfs` storage bucket.** Any logged-in user, in any org, can currently read every org's signed lease and purchase-agreement PDFs.
3. **Run `npm audit fix`** for jsPDF and react-router — both have exploitable published CVEs matching how this app uses them.
4. **Add an auth check to the `generate-alerts` edge function** — it currently runs with service-role privileges for anyone holding the public anon key.
5. Everything else below, roughly in severity order.

---

## A01 — Broken Access Control

### 🔴 Critical — `contract-pdfs` bucket has no org/ownership scoping
`supabase/migrations/0032_create_contract_pdfs_bucket.sql:22-32`

The storage RLS policy for SELECT/INSERT/DELETE on this bucket is `bucket_id = 'contract-pdfs' AND auth.uid() IS NOT NULL` — any authenticated user, from any organization, satisfies it. The migration's own comment claims "org-level scoping is enforced at the service layer via getActiveOrgId()," but that's not real protection: the Storage REST API and the Supabase JS client talk to `storage.objects` directly, so any signed-in user can call `.list('contracts')` to enumerate every org's PDF filenames and `.download()` or `.createSignedUrl()` any of them, bypassing the app's service layer entirely.

Compare to the correctly-scoped `deal-documents` bucket added earlier (`supabase/migrations/0014`), which checks `split_part(name, '/', 1) IN (SELECT get_user_org_ids())`.

**Fix:** rewrite the three policies to path-scope by org id the same way `deal-documents` does, and re-key existing uploaded paths to include the org id prefix.

### 🟠 High — `generate-alerts` edge function has no authentication
`supabase/functions/generate-alerts/index.ts:264-312`

The handler validates no `Authorization` header and does no JWT/user lookup, yet queries `deal_milestones` across all orgs and writes `notifications` rows using the service-role client. Anyone with the public anon key — shipped in the frontend bundle by design — can invoke this endpoint directly, repeatedly, to insert spam notifications into any org or flip `alert_sent_*` flags to suppress real deadline alerts.

**Fix:** require a shared cron secret header, or restrict invocation to the service-role key only (cron-triggered, never client-callable).

### 🟡 Medium — Unapplied P2 REVOKEs leave trigger functions RPC-callable
`docs/security/SUPABASE_ADVISOR_REMEDIATION_PLAN.md` (P2, unapplied)

`auto_accept_org_invitations`, `create_commission_transaction`, `create_rental_commission`, `create_user_billing_on_signup`, `handle_new_user_org`, and `generate_invitation_token()` remain callable via PostgREST RPC by `anon`/`authenticated` roles, even though they're meant to run only as DB triggers. No caller in `src/` invokes them directly today, so this isn't exploited yet, but it's a live footgun — a small input-crafting effort could call these with attacker-chosen arguments.

**Fix:** fold the plan's own P2 REVOKEs into a `0045_` migration.

---

## A02 — Cryptographic Failures

### 🔴 Critical — The PII encryption key is shipped to the browser
`src/services/encryption.service.ts:20`

`getEncryptionKey()` reads `import.meta.env.VITE_ENCRYPTION_KEY`. Every `VITE_`-prefixed variable is inlined into the client JS bundle at build time — it is not a server secret, it sits in `dist/assets/*.js` for any visitor to read via devtools or `strings`. This key encrypts owner bank routing/account numbers and Tax IDs (consumed by `owners.service.ts`, `contractCreation.service.ts`, `contractUpdate.service.ts`). The AES-256-GCM implementation itself is correct — unique random IV per call, auth tag verified on decrypt — but a correct cipher with a globally-extractable static key gives no real confidentiality. Any authenticated user can pull an encrypted value from Supabase and decrypt it client-side with the same key everyone else's browser has.

**Fix:** move encrypt/decrypt into an edge function using a server-only secret (never `VITE_`-prefixed); the browser should never hold this key.

### 🟢 Low — Signed URL expiry is 4× longer than documented
`contracts.service.ts:348` · `contractPdfEngine.service.ts:192` · `timelineMilestones.service.ts:565`

CLAUDE.md documents "~15 min" expiry for signed PDF/photo URLs; the actual code passes `3600` (1 hour) in three places. Not independently exploitable, but a leaked or logged URL stays valid four times longer than the stated policy.

**Fix:** align code to the 15-minute policy or update the documented policy to match intent.

---

## A03 — Injection

### 🟡 Medium — Unescaped HTML injection in invitation emails
`supabase/functions/_shared/email-templates.ts:206,216,217,244,245`

`orgName`, `inviterName`, and `orgLogo` are interpolated directly into the HTML email body/attributes via template literals with no escaping, and no length/character validation exists on those fields at the frontend either. A user could set their org name or display name to `<img src=x onerror=...>` or inject a phishing link; every invited teammate who opens the email receives the injected markup. This doesn't touch the app's own DOM (no session-token exposure), but it is unescaped HTML reaching third parties over email — a phishing vector against invited users.

**Fix:** HTML-escape `orgName`/`inviterName` before interpolation; validate `orgLogo` is an `https://` URL from the trusted storage bucket.

---

## A05 — Security Misconfiguration

### 🟡 Medium — Wildcard CORS on every edge function, including billing
`supabase/functions/_shared/supabase-admin.ts:961` · `extract-contract-data-v2/index.ts:29` · `extract-text/index.ts`

`Access-Control-Allow-Origin: '*'` is set globally and inherited by `create-checkout-session`, `create-portal-session`, `send-invitation-email`, `generate-alerts`, and `fetch-exchange-rates`. These functions require a Bearer token rather than cookies, which limits the blast radius, but there's no defense-in-depth if a token is ever exposed to page JS via another bug (e.g. an XSS elsewhere) — any origin could then make authenticated requests to billing endpoints.

**Fix:** restrict `Allow-Origin` to the app's actual deployed origins.

### 🟡 Medium — No Content-Security-Policy header
`public/_headers`

`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security` are set, but there's no `Content-Security-Policy`. No confirmed exploit path today (no `dangerouslySetInnerHTML`/`eval` found anywhere in `src/`), but a CSP is the one missing layer that would contain a future XSS if one is introduced via a dependency.

**Fix:** add a CSP restricting `script-src`/`connect-src` to Supabase, Stripe, and the app's own origin.

---

## A06 — Vulnerable & Outdated Components

### 🔴 Critical — jsPDF, multiple CVEs, direct dependency
`package.json` — jspdf, jspdf-autotable

Resolved range includes published CVEs for Local File Inclusion / path traversal (GHSA-f8cm-6447-x5h2), PDF injection leading to arbitrary JS execution (GHSA-pqxr-3g65-p328), and PDF object injection (GHSA-9vjf-qc39-jprp). This app generates PDFs directly from deal/contract/commission data — if any field an agent or tenant controls flows into a PDF, this is a live vector, not theoretical.

**Fix:** `npm audit fix --force` and re-test PDF generation (this is a breaking upgrade).

### 🟠 High — react-router: open redirect, stored XSS, RCE-class CVEs
`package.json` — react-router, resolved 7.0.0–7.14.2

Direct dependency. Advisories include an open redirect (GHSA-9jcx-v3wj-wh4m), stored XSS via the redirect `Location` header (GHSA-f22v-gfqf-p8f3), and a turbo-stream deserialization RCE (GHSA-49rj-9fvp-4h2h).

**Fix:** `npm audit fix` covers this within the non-breaking range.

### 🟡 Medium — Transitive dependency CVEs
DOMPurify, ws, minimatch, picomatch, postcss, yaml, i18next-http-backend — npm audit, transitive tree

Mostly ReDoS / DoS / path-traversal class and DOMPurify sanitizer-bypass advisories. DOMPurify's actual exposure depends on whether any sanitize-then-render pattern exists in `src/` — none was found in this pass, but it's worth a follow-up grep if that pattern gets introduced later.

**Fix:** `npm audit fix` resolves the rest without `--force`.

---

## A07 — Identification & Authentication Failures

### 🟢 Low — Turnstile captcha is soft-enforced on the client
`src/features/auth/Login.tsx:48`

`turnstileToken!` uses a non-null assertion; if the widget hasn't finished loading, `turnstileToken` is `undefined` and login proceeds anyway. Real protection depends on whether captcha enforcement is turned on in the Supabase Auth dashboard (outside this repo) — if it is, the server rejects missing tokens regardless; if it isn't, Turnstile is decorative.

**Fix:** confirm captcha enforcement is enabled in the Supabase project settings, and disable submit client-side until the widget is ready as defense-in-depth.

### 🟢 Low — `SKIP_AUTH_FOR_TESTING` flag exists in a production edge function
`supabase/functions/extract-contract-data-v2/index.ts:25`

Hardcoded `false` today, not currently exploitable — but there's no CI/lint guard preventing it from being flipped to `true` in a future deploy, which would disable auth on the OCR extraction endpoint entirely.

**Fix:** remove the flag, or gate it behind a build-time constant that's stripped from production bundles.

---

## A09 — Security Logging & Monitoring Failures

### 🟢 Low — PII logged in edge functions
`send-invitation-email/index.ts:66` · `create-checkout-session/index.ts:63` · `supabase-admin.ts:152`

`{ userId, email, emailConfirmedAt }` is logged on every request to the first two functions; `supabase-admin.ts` logs a 20-character token prefix on auth failure. Supabase edge function logs are retained and viewable by anyone with project log access — low severity, but avoidable.

**Fix:** drop PII fields from routine logs; log an opaque request id instead.

### 🟢 Low — Raw backend error messages surfaced to end users
`DocumentsTab.tsx:65,91` · `PricingSection.tsx:165`

`error.message` is rendered directly in toast descriptions whenever the caught value is an `Error` instance. No confirmed leak of SQL/internal detail today, but there's no sanitization layer, so a future Supabase or Stripe error containing table/constraint names would reach the browser UI unfiltered.

**Fix:** map known error codes to user-facing copy; fall back to a generic message rather than the raw error string.

---

## Verified clean

- No SQL injection vector anywhere — all DB access goes through the Supabase query builder or typed `rpc()` calls, no raw string concatenation found.
- No `dangerouslySetInnerHTML`, `innerHTML`, `eval()`, `new Function()`, or `child_process`/`exec` usage anywhere in `src/` or `supabase/`.
- No hardcoded secrets in tracked source; `.env` and variants are correctly gitignored; no `service_role` key usage found in client code.
- `stripe-webhook` correctly verifies signatures via `constructEventAsync` before processing any event.
- RLS is broadly sound — a prior remediation pass (`docs/security/SUPABASE_ADVISOR_REMEDIATION_PLAN.md`, migrations 0043/0044) already closed the P0 IDOR and enumeration issues Supabase Advisor flagged.
- Forms consistently validate through Zod + `zodResolver` before reaching the service layer; services derive `user_id` from `getAuthenticatedUserId()`, never from client-supplied values.
- No SSRF vector — every server-side `fetch()` target is hardcoded or env-configured, none built from user input.

---

*Method note: the `contract-pdfs` bucket finding was independently re-verified directly against `supabase/migrations/0032` and cross-checked against the correctly-scoped `0014` policy after an initial sub-review mis-attributed it — the finding itself is confirmed accurate.*
