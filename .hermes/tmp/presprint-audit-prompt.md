You are performing a pre-sprint analysis for RealDesk US. Sprints 1-6B are complete. You are preparing Sprint 7 (Rental + Compliance) and Sprint 8 (Go-to-Market).

Run ALL of the following commands and report findings for each section. This is a read-only audit — do NOT write code.

## SECTION A — Schema and Migration State

1. Run: ls supabase/migrations/ | sort | tail -30, then read the content of the last migration file
2. Run: grep -r 'applicant' supabase/migrations/ --include='*.sql' -l
3. Run: grep -r 'ccpa\|data_deletion\|deletion_request' supabase/migrations/ --include='*.sql' -l
4. Run: grep -r 'security_deposit' supabase/migrations/ --include='*.sql' -l

## SECTION B — Existing Service Coverage

5. Run: ls src/services/
6. Run: grep -r 'applicant\|screening\|deposit' src/services/ --include='*.ts' -l
7. Run: grep -r 'ccpa\|deletion\|opt.out\|privacy' src/services/ --include='*.ts' -l
8. Read src/lib/serviceProxy.ts and list all exported services

## SECTION C — Feature Directory State

9. Run: ls src/features/
10. Find landing page files: grep -r 'LandingPage\|Hero\|landing' src/ --include='*.tsx' -l
11. Search Turkish strings: grep -rn 'İstanbul\|Kadıköy\|Beşiktaş\|emlak\|kiralık\|satılık' src/ --include='*.tsx' --include='*.ts' -i

## SECTION D — i18n Audit

12. Run: ls public/locales/en/
13. For each JSON file in public/locales/en/, check if any values are empty, TODO, or identical to their key name
14. Check for Turkish in English locale: grep -r 'TODO\|FIXME\|tr\|Turkish\|Türkçe' public/locales/en/ --include='*.json' -l

## SECTION E — CCPA Requirements Check

15. Search for CCPA: grep -rn 'california\|ccpa\|privacy\|data.request\|delete.my' src/ --include='*.tsx' --include='*.ts' -i
16. Check RLS delete policies: grep -rn 'RLS\|row level' supabase/migrations/ --include='*.sql' | grep -i 'delet' | tail -10

## SECTION F — Landing Page State

17. Read the first 60 lines of the landing page Hero component
18. Check brand consistency: grep -rn 'RealDesk\|EmlakCRM\|Emlak CRM' src/ public/ --include='*.tsx' --include='*.ts' --include='*.html'

## SECTION G — QA Readiness

19. Run: npm run typecheck 2>&1 | tail -30
20. Run: npm run build 2>&1 | tail -30
21. Count debug statements: grep -rn 'console.log\|console.warn\|debugger' src/features/ --include='*.tsx' --include='*.ts' | grep -v 'node_modules' | wc -l

## OUTPUT FORMAT

For each section (A through G), respond with:
[SECTION X - Name]
- Finding per numbered step
- Status: Ready / Needs work / Blocker
- Recommended action (1 sentence)

At the end, produce a Sprint 7 and 8 Readiness Summary table.

This is a READ-ONLY audit. Do NOT write any implementation code.
