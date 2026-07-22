# RealDesk Developer Conventions

> **Source:** `~/.hermes/skills/software-development/realdesk-developer/SKILL.md`  
> **Purpose:** Project-specific conventions for planning and implementing features.

## Project Conventions

### Feature Structure
```
src/features/[feature-name]/
├── [FeatureName].tsx          # Main page component
├── components/                 # Sub-components
├── hooks/                      # Custom hooks
├── schemas/                    # Zod validation schemas
├── utils/                      # Feature-specific utilities
└── index.ts                    # Barrel export (optional)
```

### Service Pattern
```typescript
// src/services/[feature-name].service.ts
class FeatureNameService {
  async getAll() { ... }
  async getById(id: string) { ... }
  async create(data: Input) { ... }
  async update(id: string, data: Partial<Input>) { ... }
  async softDelete(id: string) { ... }
}
export const featureNameService = new FeatureNameService();
```

**Rules:**
- Never import services directly — always through `src/lib/serviceProxy.ts`
- Services always call `getAuthenticatedUserId()` — never trust client-supplied IDs
- Methods throw on error (caller handles toast/error UI)

### Service Proxy Registration
After creating a new service, add to `src/lib/serviceProxy.ts`:
```typescript
export { featureNameService } from '@/services/[feature-name].service';
```

### Zod Schema Pattern
```typescript
import { z } from 'zod';
import type { TFunction } from 'i18next';

export const getFeatureSchema = (t: TFunction) => z.object({
  // fields...
});

export type FeatureFormData = z.infer<ReturnType<typeof getFeatureSchema>>;
```

### i18n Requirement
All user-facing strings MUST use `useTranslation('[namespace]')` with keys in `public/locales/en/[namespace].json`. New features get a new JSON file.

### Route Registration
1. Add constant to `src/config/constants.ts` (alphabetical order):
   ```typescript
   FEATURE: '/feature',
   FEATURE_DETAIL: '/feature/:id',
   ```
2. Add route in `src/App.tsx` with `<ProtectedRoute>`
3. Add nav item in `src/components/layout/Sidebar.tsx`

### Database Migration Pattern
- Name: `supabase/migrations/[NNNN]_description.sql` (4-digit zero-padded)
- Always add RLS policies for all 4 operations (SELECT, INSERT, UPDATE, DELETE)
- After migration: run `npm run gen:types`

---

## Layer-by-Layer Plan Order

1. **DATABASE / MIGRATION** — tables, storage, edge functions, RLS
2. **TYPES** — `src/types/index.ts`, `npm run gen:types`
3. **SERVICE** — class + proxy registration
4. **ZOD SCHEMA** — form validation
5. **UI COMPONENTS** — page + components + hooks + i18n
6. **ROUTE + NAV** — constants → App.tsx → Sidebar
7. **TESTS** — Vitest
8. **VERIFICATION** — typecheck + build + translations

---

## Commands

```bash
npm run dev              # Dev server
npm run typecheck        # TypeScript check
npm run build            # Production build
npm run test             # Vitest
npm run gen:types        # Regenerate Supabase types
npm run check:translations  # i18n audit
npm run lint             # ESLint

# Migration: create supabase/migrations/NNNN_description.sql
# Then: apply via Supabase SQL Editor → npm run gen:types
```
