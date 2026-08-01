# Documentation index

Project documentation lives under `docs/`, grouped by **purpose** (reference, planning, implementation) and **lifecycle** (active vs archive). User-facing app copy is English-only in `public/locales/en/`; this tree is for engineers and product context.

**Repo entrypoints (outside `docs/`):** root `README.md`, `CLAUDE.md`, `AGENTS.md`, `CHANGELOG.md`.

---

## Directory map

| Path | Role |
|------|------|
| [`reference/`](reference/) | Architecture, API, ADRs, deployment, legal doc specs — **start here for code** |
| [`planning/`](planning/) | **In-flight plans only** — see [`planning/README.md`](planning/README.md) |
| [`implementation/`](implementation/) | Runbooks and guides for shipped or operable systems |
| [`research/`](research/) | US market and product workflow research |
| [`design/`](design/) | UI/design rulebook (`claude.md`) — referenced from root `CLAUDE.md` |
| [`security/`](security/) | Security incidents and encryption migration planning |
| [`content/`](content/) | Long-form drafts (not app source) |
| [`samples/`](samples/) | Sample PDFs, media, legal HTML — not production assets |
| [`archive/`](archive/) | Historical plans, audits, pre-US material — see [`archive/README.md`](archive/README.md) |

---

## Reference (`reference/`)

Core technical documentation:

| File | Topic |
|------|--------|
| [`CURRENT_ARCHITECTURE.md`](reference/CURRENT_ARCHITECTURE.md) | Current system architecture (**preferred** over legacy overview) |
| [`ARCHITECTURE.md`](reference/ARCHITECTURE.md) | Architecture overview and diagrams |
| [`API.md`](reference/API.md) | Service / API documentation |
| [`ADR-002-contract-engine-v2-architecture.md`](reference/ADR-002-contract-engine-v2-architecture.md) | Contract PDF engine v2 ADR |
| [`IMPL-SPEC-contract-pdf-engine-v2.md`](reference/IMPL-SPEC-contract-pdf-engine-v2.md) | Contract engine v2 implementation spec |
| [`DEPLOYMENT.md`](reference/DEPLOYMENT.md) | Deployment procedures |
| [`CONTRIBUTING.md`](reference/CONTRIBUTING.md) | Contribution guidelines |
| [`TECHNICAL_SUMMARY.md`](reference/TECHNICAL_SUMMARY.md) | Technical summary |
| [`USER_GUIDE_SUMMARY.md`](reference/USER_GUIDE_SUMMARY.md) | User guide summary |
| [`TEAM_PAGE_UNIFIED_VIEW.md`](reference/TEAM_PAGE_UNIFIED_VIEW.md) | Team page unified view spec |
| [`LEGAL_DOCUMENTS_README.md`](reference/LEGAL_DOCUMENTS_README.md) | Legal documents index |
| [`LEGAL_DOCUMENTS_GUIDE.md`](reference/LEGAL_DOCUMENTS_GUIDE.md) | Legal documents guide |
| [`LEGAL_PRODUCT_FIT_AUDIT.md`](reference/LEGAL_PRODUCT_FIT_AUDIT.md) | Legal product fit audit |
| [`PROMPT_FOR_LEGAL_DOCS_IMPLEMENTATION.md`](reference/PROMPT_FOR_LEGAL_DOCS_IMPLEMENTATION.md) | Legal docs implementation prompt |
| [`RPC_FUNCTIONS_SECURITY_AUDIT.md`](reference/RPC_FUNCTIONS_SECURITY_AUDIT.md) | RPC security audit |
| [`SECURITY_TESTS_QUICK_START.md`](reference/SECURITY_TESTS_QUICK_START.md) | Security tests quick start |

**Migrations:** SQL files use `supabase/migrations/0001_…`, `0002_…` (not timestamp names). Details in root [`CLAUDE.md`](../CLAUDE.md).

---

## Planning (`planning/`)

Only documents for **open** work belong here.

| File | Status |
|------|--------|
| [`COMMERCIAL_READINESS_PLAN.md`](planning/COMMERCIAL_READINESS_PLAN.md) | Active — security, billing, legal documents, communications, compliance, and quality release gates |
| [`TEAM_COMMISSION_KPI_PLAN.md`](planning/TEAM_COMMISSION_KPI_PLAN.md) | Active — team performance / commission KPIs |
| [`README.md`](planning/README.md) | How to add, update, and **close** plans |

**Closed plans:** [`archive/completed/planning/`](archive/completed/planning/) — manifest in [`INDEX.md`](archive/completed/planning/INDEX.md).

---

## Implementation (`implementation/`)

| File | Topic |
|------|--------|
| [`COOKIE_CONSENT_README.md`](implementation/COOKIE_CONSENT_README.md) | Cookie consent system |
| [`EMAIL_TEMPLATES.md`](implementation/EMAIL_TEMPLATES.md) | Email templates |
| [`INVITATION_QUICK_START.md`](implementation/INVITATION_QUICK_START.md) | Team invitations |
| [`RESEND_DEPLOYMENT_GUIDE.md`](implementation/RESEND_DEPLOYMENT_GUIDE.md) | Resend deployment |

---

## Research (`research/`)

| File | Topic |
|------|--------|
| [`RealDesk_Product_Workflow_Document.md`](research/RealDesk_Product_Workflow_Document.md) | Product workflow |
| [`us_real_estate_market_research.md`](research/us_real_estate_market_research.md) | US market research |
| [`real.estate.US.market.analysis.md`](research/real.estate.US.market.analysis.md) | US market analysis |
| [`US.MARKET.UPWORK.REAL.ESTATE.WORK.DESCRIPTION.txt`](research/US.MARKET.UPWORK.REAL.ESTATE.WORK.DESCRIPTION.txt) | Upwork / market context (text) |

Pre–US pivot marketing and portfolio narrative: [`archive/turkish-market/`](archive/turkish-market/) (not active product docs).

---

## Design (`design/`)

| File | Topic |
|------|--------|
| [`claude.md`](design/claude.md) | Design rulebook (colors, components, UX patterns) |

Legacy Turkish design system analysis: [`archive/turkish-market/EmlakCRM_Tasarim_Sistemi_Analizi.md`](archive/turkish-market/EmlakCRM_Tasarim_Sistemi_Analizi.md).

---

## Security (`security/`)

| File | Topic |
|------|--------|
| [`SECURITY_INCIDENT_REPORT.md`](security/SECURITY_INCIDENT_REPORT.md) | Incident record (e.g. secret rotation) |
| [`ENCRYPTION_MIGRATION_IMPLEMENTATION_PLAN.md`](security/ENCRYPTION_MIGRATION_IMPLEMENTATION_PLAN.md) | Encryption migration plan |
| [`SUPABASE_ADVISOR_REMEDIATION_PLAN.md`](security/SUPABASE_ADVISOR_REMEDIATION_PLAN.md) | Supabase Advisor findings remediation (RLS/IDOR fixes) |
| [`OWASP_TOP10_AUDIT_2026-07.md`](security/OWASP_TOP10_AUDIT_2026-07.md) | Full-codebase OWASP Top 10 audit — 3 critical/2 high open findings |

Audit snapshots: [`archive/audits/`](archive/audits/).

---

## Content & samples

- [`content/duz-metin.txt`](content/duz-metin.txt) — plain-text draft
- [`samples/contracts/`](samples/contracts/) — example contract PDFs
- [`samples/media/`](samples/media/) — reference images
- [`samples/legal/`](samples/legal/) — sample legal HTML (e.g. KVKK draft)

Production legal pages ship from [`public/legal/`](../public/legal/).

---

## Archive (`archive/`)

Historical and completed material. Full map: [`archive/README.md`](archive/README.md).

| Subfolder | Contents |
|-----------|----------|
| [`completed/`](archive/completed/) | Shipped fixes, one-off reports, cookie/onboarding/resend notes |
| [`completed/planning/`](archive/completed/planning/) | Closed engineering plans + [`INDEX.md`](archive/completed/planning/INDEX.md) |
| [`completed/resend/`](archive/completed/resend/) | Resend-specific closure docs |
| [`audits/`](archive/audits/) | Security, i18n, reauthentication audits |
| [`contracts/`](archive/contracts/) | Contract v1, rental/sale separation, tech specs |
| [`legacy-import/`](archive/legacy-import/) | Legacy contract import project |
| [`pdf-extraction/`](archive/pdf-extraction/) | PDF / text extraction history |
| [`refactoring/`](archive/refactoring/) | Module-level refactoring plans |
| [`ui-accessibility/`](archive/ui-accessibility/) | Color, skeleton, WCAG, legacy font checks |
| [`infrastructure/`](archive/infrastructure/) | Cloudflare, migration fixes, production readiness |
| [`org-migration/`](archive/org-migration/) | Organization / multi-tenant migration |
| [`sprint-planning/`](archive/sprint-planning/) | Sprint planning `.docx` guides |
| [`turkish-market/`](archive/turkish-market/) | Pre-US market, pricing, portfolio (Turkish/legacy) |

Notable one-offs in `archive/completed/`: [`DOCS_REORGANIZATION_REPORT.md`](archive/completed/DOCS_REORGANIZATION_REPORT.md), [`ONBOARDING_DATA_PERSISTENCE_REPORT.md`](archive/completed/ONBOARDING_DATA_PERSISTENCE_REPORT.md), [`TEAM_PERFORMANCE_DASHBOARD_DESIGN.md`](archive/completed/TEAM_PERFORMANCE_DASHBOARD_DESIGN.md).

---

## Quick start by role

**Developers**

1. [`reference/CURRENT_ARCHITECTURE.md`](reference/CURRENT_ARCHITECTURE.md) or [`reference/ARCHITECTURE.md`](reference/ARCHITECTURE.md)
2. [`reference/API.md`](reference/API.md)
3. [`design/claude.md`](design/claude.md)
4. Root [`CLAUDE.md`](../CLAUDE.md) for stack, RLS, and conventions

**Planning / product**

1. Active: [`planning/`](planning/)
2. Research: [`research/`](research/)
3. Closed plans: [`archive/completed/planning/INDEX.md`](archive/completed/planning/INDEX.md)

**Ops / email / compliance**

1. [`implementation/`](implementation/)
2. [`reference/DEPLOYMENT.md`](reference/DEPLOYMENT.md)
3. [`security/`](security/)

---

## Lifecycle & maintenance

| State | Location |
|-------|----------|
| Active reference | `reference/`, `implementation/`, `design/` |
| Active plan | `planning/` (+ row in `planning/README.md` table when added) |
| Closed plan | Move to `archive/completed/planning/` + update [`INDEX.md`](archive/completed/planning/INDEX.md) |
| Completed feature write-up | `archive/completed/` or themed folder under `archive/` |
| Audit snapshot | `archive/audits/` |
| Sprint Word guides | `archive/sprint-planning/` |

When the tree changes, update this file and fix links in root `README.md` / `CLAUDE.md` as needed.
