Do a read-only audit of these 6 remaining gaps for RealDesk US CRM and create a detailed markdown document. Do NOT modify any code.

## Gap 1: Sprint 7 and 8 not documented in sprint-audits.md
- Read docs/sprint-audits.md and check if Sprint 7 and 8 sections exist
- Document what Sprint 7 (screening, deposit-tracker, compliance) and Sprint 8 (brand cleanup, i18n, QA) achievements should be recorded

## Gap 2: CCPA anonymous users cannot submit requests
- Read src/services/ccpa.service.ts - check if submitRequest calls getAuthenticatedUserId
- Read src/features/compliance/CompliancePage.tsx and DataSubjectRequestForm.tsx
- Read the plan at docs/plans/2026-05-10_sprint7-ccpa-compliance-plan.md Section 3
- Document what changes are needed for public submission

## Gap 3: Register and Profile not linked to /privacy
- Read src/features/auth/Register.tsx - find privacy links
- Read src/features/profile/ - find any compliance links
- Read src/features/compliance/CompliancePage.tsx - what is at /privacy
- Document what links need updating

## Gap 4: PricingSection.tsx console.log
- Read src/features/billing/components/PricingSection.tsx
- Find the console.log lines
- Document which to remove vs keep

## Gap 5: ESLint errors - confirm these are pre-existing
- Run: npm run lint | tail -5
- Note total count

## Gap 6: Sprint 1 Scope B still deferred
- Check what Scope B items from Sprint 1 remain (TRY in profile, any types)
- Document current status

## Task: Draft Sprint 7 and 8 sections for sprint-audits.md
- Read the full structure of sprint-audits.md
- Draft what Sprint 7 and Sprint 8 sections should contain

## OUTPUT
Write findings to a file at docs/REMAINING_GAPS_ANALYSIS.md with:
- Executive summary
- Detailed findings per gap with file paths and line numbers
- Recommended actions (no code changes)
- Priority (P0/P1/P2) for each gap
- Draft Sprint 7 and 8 sections for sprint-audits.md
