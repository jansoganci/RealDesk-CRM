# Sprint 2 — Batch A: Agreement Enforcement + Status Workflow

> **Audit Source:** `docs/sprint-audits.md` → Sprint 2 (Gaps #2 and #3)
> **Project:** `/Users/jans/Projelerim/RealDesk-CRM/`

---

## Task A1: Agreement Enforcement Before Showings (NAR Aug 2024)

### Current State
`ShowingLogDialog.tsx` allows showing to be logged for ANY lead — no check for active buyer-agent agreement. NAR Aug 2024 rules require an active agreement before showing.

### Files to Change

#### A1a. `src/features/leads/components/ShowingLogDialog.tsx`

**Add imports (top, line 6 area):**
```typescript
import { AlertTriangle } from 'lucide-react';
import type { BuyerAgentAgreement } from '@/services/leads.service';
```

**Add state (after existing state declarations, around line 66):**
```typescript
const [activeAgreement, setActiveAgreement] = useState<BuyerAgentAgreement | null>(null);
const [checkingAgreement, setCheckingAgreement] = useState(false);
```

**Add agreement check useEffect (after properties load effect, after line 121):**
```typescript
// Check for active buyer-agent agreement when dialog opens
useEffect(() => {
  const checkAgreement = async () => {
    if (!open || existingShowing || !leadId) {
      setCheckingAgreement(false);
      return;
    }
    setCheckingAgreement(true);
    try {
      const agreement = await leadsService.getAgreementByLeadId(leadId);
      setActiveAgreement(agreement);
    } catch {
      setActiveAgreement(null);
    } finally {
      setCheckingAgreement(false);
    }
  };
  void checkAgreement();
}, [open, leadId, existingShowing]);
```

**Add warning banner (after DialogHeader, before `<Form>` — around line 167):**
```tsx
{/* Active agreement warning */}
{!existingShowing && !checkingAgreement && (!activeAgreement || activeAgreement.status !== 'active') && (
  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
    <div className="flex items-start gap-2">
      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-amber-800">
          {t('showings.noActiveAgreement', 'No Active Buyer-Agent Agreement')}
        </p>
        <p className="text-xs text-amber-700 mt-1">
          {activeAgreement
            ? t('showings.agreementNotActive', 'Agreement status: {{status}}. Only active agreements comply with NAR requirements.', { status: activeAgreement.status })
            : t('showings.agreementRequired', 'A signed buyer-agent agreement is required before showing properties.')}
        </p>
      </div>
    </div>
  </div>
)}
```

**Guard onSubmit (at start of function, before service call — around line 123):**
```typescript
// Check for active agreement (new showings only)
if (!existingShowing) {
  const agreement = await leadsService.getAgreementByLeadId(leadId);
  if (!agreement || agreement.status !== 'active') {
    toast.error(t('showings.agreementRequired', 'An active buyer-agent agreement is required to log showings.'));
    return;
  }
}
```

**Add i18n keys to `public/locales/en/leads.json`:**
```json
{
  "showings": {
    "noActiveAgreement": "No Active Buyer-Agent Agreement",
    "agreementNotActive": "Agreement status: {{status}}. Only active agreements comply with NAR requirements.",
    "agreementRequired": "A signed buyer-agent agreement is required before showing properties."
  }
}
```

### What DOESN'T Change
- `showing-log-form.ts` schema — no change
- `leads.service.ts` — `getAgreementByLeadId()` already exists (line 871)
- DB — no migration

### Verification
- Lead with NO agreement → amber warning + cannot submit
- Lead with draft/sent/signed agreement → amber warning + cannot submit
- Lead with active agreement → no warning + can submit
- Editing existing showing → no agreement check applied

---

## Task A2: Agreement Status Workflow

### Current State
`BuyerAgentAgreementDialog.tsx` lines 298-322 has a plain `<Select>` with all 6 statuses. User can jump to any status (e.g., straight to "active" from "draft"). Wrong behavior — agreements should follow transitions:

```
draft → sent → signed → active → expired
                              ↘ terminated
```

Additionally, `createBuyerAgentAgreement` only does INSERT. When editing, it creates a DUPLICATE record instead of updating. Need to add update capability.

### Files to Change

#### A2a. `src/services/leads.service.ts`

**Add `updateBuyerAgentAgreement` method (after `createBuyerAgentAgreement`, around line 865):**
```typescript
/**
 * Update an existing buyer-agent agreement.
 * Does NOT create a new record — use `createBuyerAgentAgreement` for new agreements.
 */
async updateBuyerAgentAgreement(
  agreementId: string,
  data: Partial<CreateAgreementInput>,
  userId: string
): Promise<BuyerAgentAgreement> {
  try {
    await this.assertUserMatches(userId);
    const orgId = await getActiveOrgId();

    const update: Record<string, unknown> = {};
    if (data.signed_date) update.signed_date = formatDateForDb(data.signed_date);
    if (data.expiration_date) update.expiration_date = formatDateForDb(data.expiration_date);
    if (data.commission_rate !== undefined) update.commission_rate = data.commission_rate;
    if (data.commission_type) update.commission_type = data.commission_type;
    if (data.flat_fee_amount !== undefined) update.flat_fee_amount = data.flat_fee_amount;
    if (data.pdf_url !== undefined) update.pdf_url = data.pdf_url;
    if (data.status) update.status = data.status;

    const { data: result, error } = await supabase
      .from('buyer_agent_agreements')
      .update(update)
      .eq('id', agreementId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return result as BuyerAgentAgreement;
  } catch (error) {
    throw handleServiceError(error, 'Failed to update buyer-agent agreement');
  }
}
```

#### A2b. `src/features/leads/components/BuyerAgentAgreementDialog.tsx`

**Update onSubmit (lines 113-141) to handle update vs create:**
```typescript
const onSubmit = async (data: CreateBuyerAgentAgreementFormData) => {
  if (!user?.id || !currentOrg?.id) {
    toast.error('Authentication required');
    return;
  }

  try {
    const serviceData = {
      ...data,
      commission_rate: data.commission_rate ?? undefined,
      flat_fee_amount: data.flat_fee_amount ?? undefined,
    };

    if (existingAgreement) {
      // UPDATE existing agreement
      await leadsService.updateBuyerAgentAgreement(
        existingAgreement.id,
        serviceData,
        user.id
      );
      toast.success(t('toasts.agreementUpdated', 'Agreement updated'));
    } else {
      // CREATE new agreement
      await leadsService.createBuyerAgentAgreement(serviceData, user.id, currentOrg.id);
      toast.success(t('toasts.agreementCreated', 'Agreement created'));
    }
    
    onOpenChange(false);
    onSuccess?.();
  } catch (error) {
    toast.error(
      existingAgreement
        ? t('toasts.agreementUpdateError', 'Failed to update agreement')
        : t('toasts.agreementCreateError', 'Failed to create agreement')
    );
    console.error(error);
  }
};
```

**Replace the status Select (lines 298-322) with action buttons:**

```tsx
{/* Current Status Badge */}
<div className="space-y-1">
  <Label>{t('agreements.status', 'Status')}</Label>
  <div>
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      status === 'draft' && 'bg-gray-100 text-gray-700 border border-gray-300',
      status === 'sent' && 'bg-blue-100 text-blue-700 border border-blue-300',
      status === 'signed' && 'bg-purple-100 text-purple-700 border border-purple-300',
      status === 'active' && 'bg-green-100 text-green-700 border border-green-300',
      status === 'expired' && 'bg-yellow-100 text-yellow-700 border border-yellow-300',
      status === 'terminated' && 'bg-red-100 text-red-700 border border-red-300',
    )}>
      {AGREEMENT_STATUS_OPTIONS.find(o => o.value === status)?.label || status}
    </span>
  </div>
</div>

{/* Transition Action Buttons */}
<div className="flex flex-wrap gap-2">
  {status === 'draft' && (
    <Button type="button" size="sm" variant="outline" onClick={() => form.setValue('status', 'sent')}>
      <Send className="h-4 w-4 mr-1" />
      {t('agreements.markAsSent', 'Mark as Sent')}
    </Button>
  )}
  {status === 'sent' && (
    <Button type="button" size="sm" variant="outline" onClick={() => form.setValue('status', 'signed')}>
      <FileSignature className="h-4 w-4 mr-1" />
      {t('agreements.markAsSigned', 'Mark as Signed')}
    </Button>
  )}
  {status === 'signed' && (
    <Button type="button" size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50" onClick={() => form.setValue('status', 'active')}>
      <CheckCircle className="h-4 w-4 mr-1" />
      {t('agreements.activate', 'Activate Agreement')}
    </Button>
  )}
  {status === 'active' && (
    <Button type="button" size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => form.setValue('status', 'terminated')}>
      <XCircle className="h-4 w-4 mr-1" />
      {t('agreements.terminate', 'Terminate Agreement')}
    </Button>
  )}
  {(status === 'active' || status === 'signed') && (
    <p className="text-xs text-muted-foreground mt-1 w-full">
      {t('agreements.saveToApply', 'Save the agreement to apply this status change.')}
    </p>
  )}
</div>
```

**Add imports (top of file):**
```typescript
import { Send, FileSignature, CheckCircle, XCircle } from 'lucide-react';  // Add to existing imports
```

**Add watch for status (near line 144, after commissionType watch):**
```typescript
const commissionType = form.watch('commission_type');
const status = form.watch('status');  // ADD THIS LINE
```

#### A2c. `src/lib/serviceProxy.ts`

Check if `updateBuyerAgentAgreement` needs to be exported from the proxy. Since `leadsService` is already exported from serviceProxy, and we're adding the method to the class, it should be auto-accessible. But verify:

The dialog imports `leadsService` from `@/lib/serviceProxy` (line 6). The new method is on the class, so no proxy change needed.

#### A2d. `public/locales/en/leads.json`

Add these keys:
```json
{
  "agreements": {
    "markAsSent": "Mark as Sent",
    "markAsSigned": "Mark as Signed",
    "activate": "Activate Agreement",
    "terminate": "Terminate Agreement",
    "saveToApply": "Save the agreement to apply this status change."
  }
}
```

### What DOESN'T Change
- Schema file (`buyer-agent-agreement-form.ts`) — status enum stays the same
- DB migration — no schema changes
- `BuyerAgentAgreementList.tsx` — if it shows status, it will auto-update

### Verification
- Create new agreement → status starts at "Draft" → shows Mark as Sent button
- Click "Mark as Sent" → status changes to "Sent" in form → save
- Re-open → status is "Sent" → shows "Mark as Signed" button
- Try to jump from Draft to Active directly → not possible (no button)
- Edit existing agreement → calls `updateBuyerAgentAgreement` not insert (no duplicate)
- Expired/Terminated are read-only (no transition buttons from them)

---

## Total Files Changed (Batch A)

| File | Task | Lines Changed |
|------|------|-------------|
| `src/features/leads/components/ShowingLogDialog.tsx` | A1 | ~30 new |
| `src/features/leads/components/BuyerAgentAgreementDialog.tsx` | A2 | ~80 changed |
| `src/services/leads.service.ts` | A2 | ~25 new (updateBuyerAgentAgreement) |
| `public/locales/en/leads.json` | A1+A2 | ~10 new keys |

**Estimated time in Cursor:** ~20-25 minutes
