# RealDesk-CRM Agent Rules

## General Rules

- Every implementation starts with a plan — no exceptions
- Code-writing agents and review agents are always separate
- Implementation happens on isolated git branches only (hermes/*)
- Quick Fix bypass is disabled — even 1-line changes require PLAN_ONLY mode
- Default mode is PLAN_ONLY for all new tasks

## Agent Ownership

### UI Agent
Owns: `src/components/`, `src/components/ui/`, `src/components/layout/`, `src/components/common/`, `src/components/dashboard/`, `src/components/landing/`, `src/components/onboarding/`, `src/components/properties/`, `src/components/calendar/`, `src/components/templates/`
Responsibilities: React components, shadcn/ui + Radix preservation, Tailwind styling, Chart.js + Recharts, responsive layout, loading/empty/error states
Must NOT modify: `src/features/`, `src/services/`, `supabase/migrations/`, `src/types/database.ts`, route definitions in `App.tsx`

### API / Service Agent
Owns: `src/features/`, `src/services/`, `src/lib/serviceProxy.ts`
Responsibilities: Supabase client calls, service classes, feature-level data loading, context integration, error normalization, Zod schemas
Must NOT modify: UI components, migrations, auth contexts directly
Must coordinate with Auth Agent for permission-sensitive queries

### Schema / Database Agent
Owns: `supabase/migrations/`, `src/types/database.ts`
Responsibilities: SQL migrations, RLS policies, type generation (`npm run gen:types`), migration numbering (4-digit sequential)
Must check latest migration number before creating new migration
Must NOT modify: Application code, UI components
Database changes always require extra review

### Auth Agent
Owns: `src/contexts/AuthContext`, `src/features/auth/`, Supabase Auth integration, session management, route guards
Responsibilities: Login/logout flows, magic link, session lifecycle, role guards, auth-dependent routing
Must NOT modify: RLS changes without approval, migration files, UI components outside auth screens

### Tester Agent
Owns: Vitest test strategy, test file creation, test command execution
Responsibilities: Run `npm run test`, `npm run typecheck`, `npm run build`, `npm run lint`
Add focused tests for changed behavior. Prefer behavioral tests over implementation-detail tests.
Read-only by default — may write test files when explicitly instructed

### Reviewer Agent
Owns: Final implementation review, checklist enforcement, merge readiness assessment
Responsibilities: Validate against `.hermes/review-checklists.md`, confirm no boundary violations, confirm build/test/typecheck/lint status, require `APPROVE MERGE` before merge
Read-only — does not modify files

### Fixer Agent
Owns: Targeted fixes for confirmed issues, minimal patches, verification
Must not: broaden scope, redesign unrelated areas, hide architectural debt behind temporary patches
Only activated during fix loop

## Parallel Work Rules

- Max 3 agents running concurrently
- No two agents may write the same file in the same batch
- Use git worktrees for truly independent parallel work
- Shared files (`src/App.tsx`, `src/lib/serviceProxy.ts`, `src/config/constants.ts`) require single-owner coordination

## Review Requirements

- Reviewer agents are READ_ONLY by default
- Reviewer may run: `npm run typecheck`, `npm run build`, `npm run test`, `npm run lint`, file inspection, git diff
- Reviewer must NOT: edit any file, create new files, run destructive commands
- Reviewer returns findings with severity, file paths, and reproduction steps

## Handoff Requirements

1. Implementation agent completes assigned changes
2. Orchestrator checks `git diff --stat`
3. Reviewer inspects diff + relevant source files
4. Reviewer returns findings
5. Orchestrator creates fix packet if needed
6. Fixer agent applies targeted fixes
7. Max 2 fix rounds before escalation

## External State

Hermes workflow state is stored in `.hermes/hermes-state.json`. This file is runtime-only and must not be modified by sub-agents. Only the Orchestrator writes to it. Sub-agents should not read or write this file.
