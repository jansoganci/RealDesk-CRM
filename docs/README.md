# Documentation Index

This directory contains all project documentation organized by purpose and status.

## Current Product Direction

RealDesk is a US-focused, English-only CRM for solo real estate agents. For the current cleanup/legal status, start with:

- `US_CLEANUP_LEGAL_READINESS.md` - US residue cleanup inventory, legal research checklist, billing go-live audit, and V1/V1.5/V2 definitions
- `sprint-audits.md` - Current sprint implementation audit
- `research/RealDesk_Product_Workflow_Document.md` - US product workflow map

Older non-US-market documents remain in `archive/` and some stale reference files for historical context only. They are not current product guidance.

## 📁 Directory Structure

### `/reference/`
**Active reference documentation** - Core architecture, APIs, and guides:
- `ADR-002-contract-engine-v2-architecture.md` - Contract engine v2 ADR (rent vs v2 isolation)
- `API.md` - API documentation
- `ARCHITECTURE.md` - System architecture overview
- `CONTRIBUTING.md` - Contribution guidelines
- `DEPLOYMENT.md` - Deployment procedures
- `LEGAL_DOCUMENTS_*.md` - Legal document guides and templates

### `/research/`
**Market research and strategy** - Business and market analysis:
- `RealDesk_Product_Workflow_Document.md` - Product workflow and V1/V1.5/V2 feature map
- `real.estate.US.market.analysis.md` - US market analysis
- `us_real_estate_market_research.md` - US market research notes

### `/samples/`
**Reference assets** moved out of repo root:
- `contracts/` - Example PDFs for sale contract work
- `media/` - Images kept for reference (favicon variant, SEO, misc.)

### `/design/`
**Design documentation** - UI/UX design rules and guidelines:
- `claude.md` - Design rulebook and guidelines

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
- **DB migrations naming:** root `CLAUDE.md` → *Database migrations (naming)* — files are `0001_…sql`, `0002_…sql`, … (not `YYYYMMDDHHmmss`).

### For Planning
- Research: `/research/`
- US cleanup/legal readiness: `/US_CLEANUP_LEGAL_READINESS.md`
- Design rules: `/design/claude.md`

## 📝 Document Status

- **Active**: Documents in `/reference/`, `/research/`, and top-level current status files
- **Archived**: Documents in `/archive/` (completed implementations)
- **Research**: Documents in `/research/` (ongoing research)

## 🔄 Maintenance

- Move completed implementations to `/archive/completed/`
- Move completed audits to `/archive/audits/`
- Update this README when structure changes
