# AGENTS.md — RealDesk-CRM

Instructions for **coding agents** (Cursor, Codex, Copilot, Claude Code). Humans start with [README.md](./README.md). Deep technical memory lives in [CLAUDE.md](./CLAUDE.md). Extended docs: [docs/README.md](./docs/README.md).

---

## Commands (run these to verify)

```bash
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # vitest run
npm run build        # tsc -b && vite build
npm run dev          # http://localhost:5173
npm run check:translations
npm run gen:types    # after schema changes → src/types/database.ts
```

Recommended order: **lint → typecheck → test → build**

---

## Project (one screen)

| | |
|---|---|
| **Product** | US real estate CRM for solo agents (properties, deals, contracts, finance, leads) |
| **Stack** | React 18.3, Vite 5.4, TypeScript 5.5 strict, Supabase, Tailwind, Radix/shadcn, Cloudflare Pages |
| **i18n** | English only — `public/locales/en/`; no hardcoded UI strings |
| **Services** | Import only from `src/lib/serviceProxy.ts` |
| **Migrations** | `supabase/migrations/0001_slug.sql`, `0002_…` — never edit applied files; see CLAUDE.md |

---

## Read before editing

1. `AGENTS.md` (this file)
2. `.hermes/project-rules.md`, `.hermes/agent-rules.md`, `.hermes/review-checklists.md` (when present)
3. `CLAUDE.md` — conventions, gotchas, feature/DB checklists
4. Task-relevant source under `src/` or `supabase/`

If rules conflict, prefer the **more specific** file. If still unclear, stop and ask.

**Role boundaries** (UI vs API vs schema vs auth): `.hermes/agent-rules.md`

---

## Safety (non-negotiable)

- **PLAN_ONLY by default** — implement only after explicit **APPROVE** (Hermes workflow).
- **APPROVE MERGE** required before merge.
- No unapproved **migrations**, **RLS**, or production deploy changes.
- Never commit or read `.env` / secrets in chat.
- Preserve user WIP — no reset/checkout of others’ work.
- No scope creep: no drive-by refactors, dependency bumps, or unrelated formatting.
- Strict TypeScript — no `any`, no `@ts-ignore`; named exports only.
- High-risk: commissions/billing, deal status transitions, auth, encryption of bank fields.
- Fix obvious OWASP issues **in files you touch**; report cross-cutting security issues before changing RLS/migrations.

---

## Git

- Use a **feature branch** unless the task is docs/analysis-only.
- Do **not** commit, push, merge, or force-push unless the user asks.
- After edits: list changed files, behavior changes, commands run / not run.

---

## Documentation map

| Need | Location |
|------|----------|
| Install, env, human overview | [README.md](./README.md) |
| Stack, migrations, patterns, gotchas | [CLAUDE.md](./CLAUDE.md) |
| Full docs index | [docs/README.md](./docs/README.md) |
| Architecture | [docs/reference/CURRENT_ARCHITECTURE.md](./docs/reference/CURRENT_ARCHITECTURE.md) |
| API / services | [docs/reference/API.md](./docs/reference/API.md) |
| Design rules | [docs/design/claude.md](./docs/design/claude.md) |
| Active plans | [docs/planning/](./docs/planning/) |
| Closed plans | [docs/archive/completed/planning/INDEX.md](./docs/archive/completed/planning/INDEX.md) |

---

## Hermes runtime (local only)

`.hermes/hermes-state.json` and `.hermes/hermes-state.lock` are gitignored workflow state — do not commit.
