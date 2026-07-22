# Sprint 2 — Batch E: Consolidate Redundant Showing Feedback Columns

> **Audit Source:** `docs/sprint-audits.md` → Sprint 2 (Gap #7)
> **Gap #7:** `feedback` (text), `feedback_enum` (enum), and `interest_level` (text) all stored redundantly
> **Project:** `/Users/jans/Projelerim/RealDesk-CRM/`

---

## Task E1: Clean up service layer

### `src/services/leads.service.ts`

**Remove `mapFeedbackToInterestLevel` method (lines 157-166):**
```typescript
// DELETE this entire method:
private mapFeedbackToInterestLevel(feedback: ShowingFeedback): InterestLevel {
  switch (feedback) {
    case 'loved':
      return 'high';
    case 'interested':
      return 'medium';
    case 'pass':
      return 'low';
    default:
      return 'low';
  }
}
```

**Simplify `createShowingLog` (lines 993-1003):**
```typescript
// Current — writes both feedback_enum AND interest_level:
const insert = {
  ...
  feedback_enum: data.feedback_enum ?? data.feedback,
  interest_level: data.interest_level ?? this.mapFeedbackToInterestLevel(data.feedback),
};

// Target — only feedback_enum:
const insert = {
  lead_id: data.lead_id,
  property_id: data.property_id,
  user_id: userId,
  org_id: orgId,
  showing_date: data.showing_date.toISOString(),
  duration_minutes: data.duration_minutes ?? null,
  feedback_enum: data.feedback ?? data.feedback_enum,
};
```

**Simplify `updateShowingFeedback` (around line 1062):**
```typescript
// Current:
feedback_enum: feedback,
interest_level: this.mapFeedbackToInterestLevel(feedback),

// Target:
feedback_enum: feedback,
```

**Also remove `interest_level` from the `CreateShowingLogInput` type definition (line 95):**
```typescript
// Remove this line:
interest_level?: InterestLevel;
```

And remove the `InterestLevel` type if it's no longer used elsewhere (or just leave the type definition for clean-up later).

---

## Task E2: Clean up UI layer

### `src/features/leads/components/ShowingLogDialog.tsx`

**Remove the `interest_level` mapping in `onSubmit` (lines 134-141):**
```typescript
// Current:
const mappedInterestLevel =
  data.feedback === 'loved' ? 'high' :
  data.feedback === 'interested' ? 'medium' : 'low';

const serviceData = {
  ...data,
  duration_minutes: data.duration_minutes ?? undefined,
  interest_level: mappedInterestLevel as 'high' | 'medium' | 'low' | 'none',
};
await leadsService.createShowingLog(serviceData, user.id, currentOrg.id);

// Target:
const serviceData = {
  ...data,
  duration_minutes: data.duration_minutes ?? undefined,
};
await leadsService.createShowingLog(serviceData, user.id, currentOrg.id);
```

**Remove `interest_level` from form.reset for existing showing (line 94):**
```typescript
// Remove this line:
interest_level: existingShowing.interest_level as any,
```

---

## Total Files Changed (Batch E)

| File | Lines Changed |
|------|-------------|
| `src/services/leads.service.ts` | ~10 removed (mapFeedbackToInterestLevel + interest_level refs) |
| `src/features/leads/components/ShowingLogDialog.tsx` | ~8 removed (mapping + interest_level refs) |

**Estimated time in Cursor:** ~5-10 minutes

---

## Verification

- Create new showing → DB stores `feedback_enum = 'interested'`, no `interest_level` written
- Edit existing showing feedback → works correctly using feedback_enum
- Existing DB records with `interest_level` still render via `feedback_enum` fallback
- ShowingLogList still shows correct feedback badges
- TypeScript: `npm run typecheck` → 0 errors
