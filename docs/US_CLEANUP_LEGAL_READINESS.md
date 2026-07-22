# RealDesk US Cleanup and Legal Readiness

Last updated: 2026-05-21

## Summary

RealDesk is now treated as a US-focused, English-only product. Public and user-facing surfaces should not expose the old Turkey-market brand, legal model, or currency choices.

This cleanup intentionally keeps some legacy internal fields and services for backwards compatibility with older contract data. Those are documented below and should not be exposed in new US flows.

## Residue Inventory

### Must Fix User-Facing Surface

These areas were updated as part of the cleanup:

- Public legal surface now contains only English files under `public/legal`.
- Public sitemap and robots now use `https://realdesk.app`.
- Auth, billing, common, dashboard, profile, quick-add, contracts, contracts sale, and deal locale copy no longer exposes the old Turkey-market brand or TRY/EUR options.
- Profile and finance currency selectors now expose USD only.
- Reminder cards and finance exports now default to USD/RealDesk.
- Landing about/contact metadata and contact email no longer reference the old domain.

### Allowed Legacy Internal

These remain for compatibility with older records and legacy contract generation/import:

- Legacy identity/bank encrypted columns and local variables around old rental contracts.
- Legacy contract PDF and text extraction services that parse older rental contract formats.
- Legacy number-to-text and font helpers used only by older PDF flows.
- Historical migrations and generated database types that describe existing columns.

New US onboarding, profile, finance, lead, deal, lease, and purchase flows should not introduce new writes to these legacy fields unless explicitly building a migration/compatibility bridge.

### Archive / Historical Docs

The `docs/archive` tree contains historical Turkey-market plans, audits, and implementation notes. Those files are not current product guidance. Use this file, `AGENTS.md`, and current US research docs as the source of truth for new work.

## Billing Go-Live Audit

Billing is not changed in this cleanup. Before production launch, decide and verify:

- Trial length and whether credit card is required.
- Active plan names, prices, annual/monthly intervals, and tax handling.
- Refund policy and cancellation effective date.
- Whether the current paywall gate should enforce `Boolean(hasAccess) || trialActive`.
- Stripe product/price IDs for US-only pricing.
- Whether mock invoice history should be replaced by Stripe invoice data or hidden.
- Customer portal support path for cancellation, payment method updates, and invoices.

Known technical risk:

- `src/services/billingService.ts` currently contains a production-gate TODO around `hasActiveAccess`.
- Stripe edge functions and pricing config should be audited before enabling strict access enforcement.

## Legal Research Checklist

Collect these answers before final legal documents are drafted:

- Legal entity name, formation state, registered address, support email, privacy email, and legal notice email.
- Governing law, dispute venue, and arbitration/class action preference.
- B2B-only vs consumer-accessible positioning.
- Plan names, prices, trial length, free tier limits, renewal terms, taxes, cancellation, and refunds.
- Uploaded data categories: contracts, leads, client contacts, applicants, property photos, deal documents, payment metadata, and logs.
- Data retention, account deletion, export, and CCPA/CPRA request handling.
- Processors/subprocessors: Supabase, Cloudflare, Stripe, Google Auth, GTM/Analytics, OCR.space, Resend/email provider, and any AI/OCR document processor.
- Hosting/database/storage regions and log retention.
- Real estate disclaimers: not legal advice, attorney review responsibility, state/local forms, fair housing, NAR rules, lead paint, licensing, and generated document status.

## V1, V1.5, and V2

- V1 means current MVP/core product. It includes US onboarding, lead/deal/timeline basics, lease and purchase workflows, screening/deposit/compliance basics, and USD-first operation.
- V1.5 means near-term enhancements that improve the core workflow but are not required for the current cleanup.
- V2 means larger integrations or product bets that require external APIs, deeper workflow design, or legal/commercial decisions.

Backlog examples:

- V1.5: speed-to-lead timer, buyer feedback summary, net sheet/closing cost calculators, tiered commission support, deeper state rules engine, maintenance request workflow.
- V2: Zillow/Realtor.com auto-import, MLS API/RESO integration, DocuSign/e-sign, email/SMS automation, TransUnion/Experian screening integration, AI follow-up, tenant portal, CMA generator, Schedule E export.

## Verification Commands

```bash
npm run check:translations
npm run build
rg -n "Emlak CRM|emlakcrm|TRY|EUR|KVKK|Türkiye|Turkey|Turkish|tapu" public/locales public/legal public/sitemap.xml public/robots.txt src/features src/components src/lib src/config -S
rg -n "TC|IBAN" public/locales public/legal public/sitemap.xml src/features src/components -S
```

The targeted runtime/public scans above should return no matches. Full-repo scans will still report historical docs, legacy services, generated types, and migrations; those are covered by the inventory sections above.
