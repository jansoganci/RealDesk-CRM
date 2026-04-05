# Documentation Index

This directory contains all project documentation organized by purpose and status.

## 📁 Directory Structure

### `/reference/`
**Active reference documentation** - Core architecture, APIs, and guides:
- `ADR-002-contract-engine-v2-architecture.md` - Contract engine v2 ADR (rent vs v2 isolation)
- `API.md` - API documentation
- `ARCHITECTURE.md` - System architecture overview
- `CONTRIBUTING.md` - Contribution guidelines
- `DEPLOYMENT.md` - Deployment procedures
- `LEGAL_DOCUMENTS_*.md` - Legal document guides and templates

### `/planning/`
**Active planning documents** - Features and improvements being planned:
- `contracts-hub-and-sale-v2.md` - Contracts hub implementation plan
- `EXTRACTION_IMPLEMENTATION_PLAN.md` - Text extraction system plan
- `HYBRID_EXTRACTION_ANALYSIS.md` - Hybrid extraction analysis
- `stripe-integration-plan.md` - Stripe payment integration plan
- `BILLING_WORKFLOW_PLAN.md` - Billing and subscription workflow
- `STRIPE_*.md` - Stripe-related planning docs
- `*_optimization_plan.md` - Performance optimization plans
- `todos.md` - Active task list
- `onboarding-migration-analysis.md` - Onboarding data storage architecture review
- `agency-ekleme.md` - Agency onboarding notes (Turkish)

### `/implementation/`
**Active implementation guides** - Step-by-step guides for ongoing work:
- `EMAIL_TEMPLATES.md` - Email template documentation
- `COOKIE_CONSENT_README.md` - Cookie consent system guide

### `/research/`
**Market research and strategy** - Business and market analysis:
- `marketing-strategy-*.md` - Marketing strategy documents
- `real-estate-market-research.md` - Market research

### `/marketing/`
**Product narrative and analysis** (portfolio-style and stakeholder-facing):
- `EmlakCRM_Portfolio.md` - Executive overview (English)
- `EmlakCRM_Detayli_Analiz_Raporu.md` - Detailed product analysis (Turkish)

### `/content/`
**Long-form text drafts** (not app source):
- `duz-metin.txt` - Plain-text draft / export

### `/samples/`
**Reference assets** moved out of repo root (contracts, media, legal HTML samples):
- `contracts/` - Example PDFs for sale contract work
- `media/` - Images kept for reference (favicon variant, SEO, misc.)
- `legal/` - e.g. KVKK HTML sample drafts

### `/design/`
**Design documentation** - UI/UX design rules and guidelines:
- `claude.md` - Design rulebook and guidelines
- `EmlakCRM_Tasarim_Sistemi_Analizi.md` - Design system (colors, typography, components)

### `/security/`
**Security records** - Incident notes and remediation checklists:
- `SECURITY_INCIDENT_REPORT.md` - GitGuardian / secret rotation record

### `/archive/`
**Completed and historical documents** - See `/archive/README.md` for details

Notable archived items:
- `/archive/completed/DOCS_REORGANIZATION_REPORT.md` — one-time docs filing report
- `/archive/completed/ONBOARDING_DATA_PERSISTENCE_REPORT.md` — onboarding DB persistence investigation
- `/archive/completed/TEAM_PERFORMANCE_DASHBOARD_DESIGN.md` — team dashboard design spec
- `/archive/audits/i18n_AUDIT_REPORT.md` — i18n hardcoded-string audit snapshot

## 🚀 Quick Links

### For Developers
- Start with: `/reference/ARCHITECTURE.md`
- API docs: `/reference/API.md`
- Contributing: `/reference/CONTRIBUTING.md`

### For Planning
- Active plans: `/planning/`
- Research: `/research/`
- Marketing & narrative: `/marketing/`

### For Implementation
- Implementation guides: `/implementation/`
- Design rules: `/design/claude.md`

## 📝 Document Status

- **Active**: Documents in `/planning/`, `/implementation/`, `/reference/`
- **Archived**: Documents in `/archive/` (completed implementations)
- **Research**: Documents in `/research/` (ongoing research)

## 🔄 Maintenance

- Move completed implementations to `/archive/completed/`
- Move completed audits to `/archive/audits/`
- Keep active planning docs in `/planning/`
- Update this README when structure changes

