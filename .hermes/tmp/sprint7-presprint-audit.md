You are performing a pre-sprint analysis for RealDesk US. Sprints 1-6B are complete. You are preparing Sprint 7 (Rental + Compliance) and Sprint 8 (Go-to-Market). Run ALL commands below and report findings per section. This is a read-only audit — do NOT write code.

SECTION A:
1. Run 'ls supabase/migrations/ | sort | tail -30' then read the last migration file
2. Run 'grep -r "applicant" supabase/migrations/ --include="*.sql" -l'
3. Run 'grep -r "ccpa\|data_deletion\|deletion_request" supabase/migrations/ --include="*.sql" -l'
4. Run 'grep -r "security_deposit" supabase/migrations/ --include="*.sql" -l'

SECTION B:
5. Run 'ls src/services/'
6. Run 'grep -r "applicant\|screening\|deposit" src/services/ --include="*.ts" -l'
7. Run 'grep -r "ccpa\|deletion\|opt.out\|privacy" src/services/ --include="*.ts" -l'
8. Read src/lib/serviceProxy.ts and list all exported services

SECTION C:
9. Run 'ls src/features/'
10. Run 'grep -r "LandingPage\|Hero\|landing" src/ --include="*.tsx" -l'
11. Run 'grep -rn "İstanbul\|Kadıköy\|Beşiktaş\|emlak\|kiralık\|satılık" src/ --include="*.tsx" --include="*.ts" -i'

SECTION D:
12. Run 'ls public/locales/en/'
13. For each JSON in public/locales/en/, report if any values are empty/TODO/echo-key
14. Run 'grep -r "TODO\|FIXME\|Turkish\|Türkçe" public/locales/en/ --include="*.json" -l'

SECTION E:
15. Run 'grep -rn "california\|ccpa\|privacy\|data.request\|delete.my" src/ --include="*.tsx" --include="*.ts" -i'
16. Run 'grep -rn "RLS\|row level" supabase/migrations/ --include="*.sql" | grep -i "delet" | tail -10'

SECTION F:
17. Find and read first 60 lines of the landing page Hero component
18. Run 'grep -rn "RealDesk\|EmlakCRM\|Emlak CRM" src/ public/ --include="*.tsx" --include="*.ts" --include="*.html"'

SECTION G:
19. Run 'npm run typecheck 2>&1 | tail -30'
20. Run 'npm run build 2>&1 | tail -30'
21. Run 'grep -rn "console.log\|console.warn\|debugger" src/features/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | wc -l'

Report each section with findings, status (Ready/Needs work/Blocker), and recommended action. End with a Sprint 7 and 8 Readiness Summary table.
