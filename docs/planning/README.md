# Active planning

Only **in-flight or upcoming** feature plans live here. Everything else belongs in the archive.

## What stays here

- New plans while work is still open (design, implementation, or rollout not finished).
- One file per initiative is enough; split UX vs implementation only if both are actively edited.

## How to close a plan

When the work is **done, superseded, or abandoned**:

1. Move the markdown file to `docs/archive/completed/planning/`.
2. Add one row to `docs/archive/completed/planning/INDEX.md` (filename, closed date, one-line outcome).
3. If the plan replaced an older doc, note the successor in that row (link or filename).
4. Do **not** delete the file unless it duplicates another archived doc byte-for-byte.

Optional: if the plan spawned runbooks still in use, copy the operational sections into `docs/implementation/` or `docs/reference/` first, then archive the full plan.

## Current active plans

| File | Status |
|------|--------|
| `TEAM_COMMISSION_KPI_PLAN.md` | Active — team performance / commission KPIs |

## Related archive locations

| Location | Contents |
|----------|----------|
| `docs/archive/completed/planning/` | Closed product/engineering plans |
| `docs/archive/sprint-planning/` | Historical sprint `.docx` guides |
| `docs/archive/contracts/`, `refactoring/`, etc. | Pre-2026 docs filed from flat `archive/` root |

After a large docs pass, update `docs/README.md` (project index) and fix any links in root `README.md` / `CLAUDE.md`.
