You are performing a Sprint 8 (Go-to-Market) pre-launch audit for RealDesk US CRM. This is a READ-ONLY analysis — do NOT modify any files.

Run ALL of the following commands and report findings for each section.

SECTION A — Brand Consistency (EmlakCRM to RealDesk)
1. grep -rn 'EmlakCRM|Emlak CRM|emlakcrm|emlak_crm|EMLAK' src/ config/ --include='*.ts' --include='*.tsx' --include='*.json' -i
2. grep -rn 'EmlakCRM|Emlak CRM' public/ --include='*.html' --include='*.json' -i
3. grep -rn 'destek@|info@|support@' src/ public/ --include='*.tsx' --include='*.ts' --include='*.html' -i
4. grep -rn 'APP_NAME|appName|siteName' src/config/constants.ts
5. Find and read the PublicPricingPage.tsx

SECTION B — Turkish Content Audit
6. grep -rn 'Istanbul|Kadikoy|Besiktas|Ankara|Turkiye|Turkey|Turkish' src/ --include='*.ts' --include='*.tsx' -i | grep -v 'locale|date-fns|i18n' | head -20
7. grep -rn 'kiralik|satilik|emlak|daire|villa' src/ --include='*.tsx' --include='*.ts' -i | head -10
8. Check src/templates/ and src/services/contractPdf.service.ts for Turkish content

SECTION C — i18n Health
9. Count files: ls public/locales/en/*.json | wc -l
10. Check for duplicate keys in each JSON file

SECTION D — Build and QA Health
11. Run: npm run typecheck - output the final line
12. Run: npm run build - output the final 5 lines
13. Run: npm run check:translations - output summary
14. Count debug statements: grep -rn 'console.log|console.warn|debugger' src/features/ --include='*.tsx' --include='*.ts' | grep -v node_modules | wc -l

SECTION E — Demo Data
15. grep -rn 'demo@|test@|testuser|demo_user|123456|password123' src/ --include='*.tsx' --include='*.ts' | head -10
16. Read the first 80 lines of src/components/landing/Hero.tsx

OUTPUT
For each section, report findings, status (Ready/Needs work/Blocker), and recommended action. End with a Sprint 8 Readiness Summary table.
