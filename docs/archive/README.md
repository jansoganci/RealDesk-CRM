# Documentation Archive

Completed implementations, audits, historical planning, and pre-US market material. Not used for day-to-day development unless you need context.

## Top-level folders (themed)

| Folder | Contents |
|--------|----------|
| `contracts/` | Contract engine v1, rental/sale separation, duplicate handling |
| `legacy-import/` | Legacy contract import analysis, UX, implementation |
| `pdf-extraction/` | PDF buttons, extraction system, text integration, download fix |
| `refactoring/` | Feature-level refactoring plans and progress notes |
| `ui-accessibility/` | Color migration, skeleton loading, WCAG, legacy Turkish font checks |
| `infrastructure/` | Cloudflare deploy notes, migration fixes, production readiness |
| `sprint-planning/` | Sprint `.docx` planning guides (Word) |
| `turkish-market/` | Pre–US pivot marketing, pricing, EmlakCRM research |
| `org-migration/` | Organization / multi-tenant migration runbooks |

## Under `completed/`

| Folder | Contents |
|--------|----------|
| `completed/` (root) | One-off implementations, cookie/resend/onboarding fixes, doc reorganizations |
| `completed/planning/` | **Closed** plans moved from `docs/planning/` — see `INDEX.md` |
| `completed/resend/` | Resend-specific fix and deployment notes |

## `audits/`

Security, i18n, and reauthentication audit snapshots.

## When to archive

Move a document here when:

1. Implementation is complete and deployed (or explicitly wont-fix).
2. Audit findings are addressed or the audit is a historical snapshot.
3. The doc is no longer edited for active sprints.
4. You only need it for reference or compliance.

## Closing a plan from `docs/planning/`

See `docs/planning/README.md`. Short version: move file → `completed/planning/` → add a row to `completed/planning/INDEX.md`.

## Active vs archived

- **Active:** `docs/planning/` (in-flight plans only), `docs/implementation/`, `docs/reference/`, `docs/research/`
- **Archived:** everything under `docs/archive/`
