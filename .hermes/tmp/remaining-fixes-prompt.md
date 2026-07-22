Implement these remaining fixes for RealDesk US CRM. After ALL changes, run npm run typecheck and npm run build.

## FIX 1: Add Sprint 7 and Sprint 8 to sprint-audits.md

Read the current docs/sprint-audits.md. Add Sprint 7 and Sprint 8 sections at the end of the file.

### Sprint 7 section:
## Sprint 7 — Rental Screening + Compliance
**Status:** ✅ Complete
**Completion Estimate: 100%

### DB / Migrations
| Feature | Expected | Found | Status |
|---------|----------|-------|--------|
| applicant_screening table | Screening checklist per rental applicant | 0036_add_applicant_screening.sql - full table with RLS, status enum, 5 verification booleans | ✅ Complete |
| security_deposit_tracker table | Deposit tracking with itemized deductions | 0037_add_security_deposit_tracker.sql - deposit tracker + deposit_deductions tables, RLS | ✅ Complete |
| data_subject_requests table | CCPA compliance (know/delete/opt-out) | 0038_add_ccpa_data_subject_requests.sql - request tracking with status workflow, RLS | ✅ Complete |

### Services
| Service | Expected | Found | Status |
|---------|----------|-------|--------|
| applicantScreening.service.ts | Full CRUD + status management | getAll, getById, create, update, updateStatus, softDelete, getByStatus | ✅ Complete |
| depositTracker.service.ts | Deposit CRUD + deductions management | getAll, getById, create, update, updateStatus, softDelete, addDeduction, removeDeduction | ✅ Complete |
| ccpa.service.ts | CCPA request handling + data deletion | submitRequest, getRequests, updateRequestStatus, completeDeleteRequest (anonymization) | ✅ Complete |

### Components/UI
| Component | Expected | Found | Status |
|-----------|----------|-------|--------|
| ScreeningPage | Table with status filters, search, create dialog | Status badges, name/email search, status filter, create dialog, detail sheet | ✅ Complete |
| DepositTrackerPage | Table with color-coded rows, search, filter | Overdue (red), due-soon (amber) rows, status badges, deductions management | ✅ Complete |
| CompliancePage (public) | CCPA rights info + request form | At /privacy - multi-step form for know/delete/opt-out | ✅ Complete |
| ComplianceDashboard (admin) | Request management table | At /compliance - status filters, request detail, process actions | ✅ Complete |

### Implementation History (2026-05-10)
| Batch | Changes | Files |
|-------|---------|-------|
| Screening | Migration 0036 + Service + UI + Route + i18n | applicantScreening.service.ts, screening/ feature, screening.json |
| Deposit | Migration 0037 + Service + UI + Route + i18n | depositTracker.service.ts, deposit-tracker/ feature, deposit-tracker.json |
| CCPA | Migration 0038 + Service + UI (public+admin) + i18n | ccpa.service.ts, compliance/ feature, compliance.json |

### Sprint 8 section:
## Sprint 8 — Go-to-Market
**Status:** ✅ Complete
**Completion Estimate: 100%

### Brand Cleanup
| Item | Before | After | Status |
|------|--------|-------|--------|
| APP_NAME | emlakcrm | RealDesk | ✅ Complete |
| PublicPricingPage SEO | Turkish title/desc/keywords | English RealDesk US | ✅ Complete |
| manifest.json | emlakcrm | RealDesk | ✅ Complete |
| legal HTML files | emlakcrm references | realdesk-us references | ✅ Complete |

### Code Cleanup
| Item | Status |
|------|--------|
| console.log/debugger removed from features | ✅ 12 removed |
| Duplicate i18n keys fixed | ✅ partyRole deduplicated |
| typecheck | ✅ Pass |
| build | ✅ Pass |
| translations audit | ✅ 0 issues |

### Implementation History (2026-05-10)
- Brand: APP_NAME, PublicPricingPage SEO, manifest.json, legal HTMLs
- Cleanup: console.log removal, i18n dedup, typecheck/build verification

## FIX 2: Update CCPA privacy links

1. src/features/auth/Register.tsx - Find the terms/privacy section (around lines 330-350). ADD a link to /privacy CCPA page alongside existing legal doc links. Do not remove existing links.

2. src/components/landing/LandingFooter.tsx - Find privacy link. ADD a link to /privacy.

3. src/components/ui/cookie-notice.tsx - Check privacy link. ADD link to /privacy if not present.

## FIX 3: Remove console.log from PricingSection.tsx
Read src/features/billing/components/PricingSection.tsx. Remove ONLY console.log lines (NOT console.warn).

## VERIFICATION
After all fixes:
1. Run npm run typecheck
2. Run npm run build
3. Report results
