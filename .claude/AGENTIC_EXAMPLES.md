# Agentic System - Real-World Examples

This document shows **exactly** how to use the agentic system with real scenarios from your Real Estate CRM.

---

## 📝 Example 1: Complete Feature from Scratch

### User Request:
```
"I want to add a tenant credit scoring system where agents can track tenant
payment history and automatically calculate a reliability score from 0-100."
```

### How Orchestrator Responds:

```markdown
## 🤖 Analyzing Request

**Feature**: Tenant Credit Scoring System
**Complexity**: Medium (new table + calculations + UI)
**Agents required**: Architecture → Code → Product → Security → Automation

**Execution Plan**:
1. Architecture Agent: Create `tenant_credit_scores` table
2. Code Agent: Generate service with scoring algorithm
3. Code Agent: Build UI components (score display, history)
4. Product Agent: Add TR/EN translations
5. Security Agent: Audit RLS and scoring logic
6. Automation Agent: Deploy to database and git

**Estimated time**: 8-12 minutes
**Proceed? [Yes/No]**
```

### User: "Yes"

```markdown
## [Architecture Agent] 🏗️ Creating Database Schema

**Creating migration**: `20251117120000_create_tenant_credit_scores.sql`

**Schema design**:
```sql
CREATE TABLE IF NOT EXISTS tenant_credit_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  payment_history jsonb DEFAULT '[]'::jsonb,
  last_calculated_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Security**:
- ✅ RLS enabled
- ✅ All 4 policies created (SELECT, INSERT, UPDATE, DELETE)
- ✅ Index on user_id created
- ✅ Index on tenant_id created
- ✅ Foreign key with CASCADE delete
- ✅ Check constraint on score range
- ✅ Trigger for updated_at

**Validation**: ✅ PASSED

---

## [Code Agent] 💻 Generating Service Layer

**Creating**: `src/services/tenantCreditScores.service.ts`

**Service methods**:
- `getAll()`: Fetch all scores for authenticated user
- `getById(id)`: Get specific score record
- `getByTenantId(tenantId)`: Get score for a tenant
- `calculateScore(tenantId, paymentHistory)`: Calculate score from history
- `create(data)`: Create new score record (with user_id injection)
- `update(id, data)`: Update score
- `recalculate(tenantId)`: Recalculate score from latest payment data

**Scoring algorithm**:
```typescript
calculateScore(paymentHistory: PaymentRecord[]): number {
  if (paymentHistory.length === 0) return 50; // Neutral for new tenants

  const onTimePayments = paymentHistory.filter(p => p.paidOnTime).length;
  const totalPayments = paymentHistory.length;
  const onTimeRate = onTimePayments / totalPayments;

  // Base score from on-time rate (70% weight)
  let score = onTimeRate * 70;

  // Bonus for long payment history (20% weight)
  const historyBonus = Math.min(totalPayments / 24, 1) * 20; // Max 2 years
  score += historyBonus;

  // Penalty for late payments (10% weight)
  const latePenalty = paymentHistory.filter(p => p.daysLate > 30).length * 5;
  score = Math.max(0, score - latePenalty);

  return Math.min(100, Math.round(score));
}
```

**Validation**:
- ✅ TypeScript compiles
- ✅ Service exports singleton
- ✅ User_id injection in create()
- ✅ Added to serviceProxy.ts

---

## [Code Agent] 💻 Generating UI Components

**Component 1**: `src/features/tenants/components/CreditScoreCard.tsx`
- Mobile-first card design
- Score display with color coding:
  - 80-100: Green (excellent)
  - 60-79: Yellow (good)
  - 40-59: Orange (fair)
  - 0-39: Red (poor)
- Payment history timeline
- Recalculate button

**Component 2**: `src/features/tenants/components/CreditScoreHistory.tsx`
- Chart showing score over time
- Desktop: Line chart
- Mobile: Simplified list view

**Form**: `src/features/tenants/components/AddPaymentRecordDialog.tsx`
- React Hook Form + Zod validation
- Fields: amount, dueDate, paidDate, paidOnTime

**Validation**:
- ✅ Mobile-first responsive (cards on mobile)
- ✅ Design system colors used
- ✅ Touch targets 44px minimum
- ✅ Uses useTranslation() for all text

---

## [Product Agent] 🎨 Adding Translations

**Turkish** (`public/locales/tr/tenants.json`):
```json
{
  "creditScore": "Kredi Skoru",
  "creditScoreHistory": "Kredi Skoru Geçmişi",
  "paymentHistory": "Ödeme Geçmişi",
  "score": "Skor",
  "excellent": "Mükemmel",
  "good": "İyi",
  "fair": "Orta",
  "poor": "Zayıf",
  "recalculateScore": "Skoru Yeniden Hesapla",
  "lastCalculated": "Son Hesaplama",
  "onTimePayments": "Zamanında Ödemeler",
  "latePayments": "Geç Ödemeler",
  "totalPayments": "Toplam Ödemeler"
}
```

**English** (`public/locales/en/tenants.json`):
```json
{
  "creditScore": "Credit Score",
  "creditScoreHistory": "Credit Score History",
  "paymentHistory": "Payment History",
  "score": "Score",
  "excellent": "Excellent",
  "good": "Good",
  "fair": "Fair",
  "poor": "Poor",
  "recalculateScore": "Recalculate Score",
  "lastCalculated": "Last Calculated",
  "onTimePayments": "On-Time Payments",
  "latePayments": "Late Payments",
  "totalPayments": "Total Payments"
}
```

**Validation**:
- ✅ Both TR and EN files updated
- ✅ Same keys in both files
- ✅ Proper Turkish translations (reviewed)

---

## [Security Agent] 🛡️ Security Audit

**Auditing**:
- Table: tenant_credit_scores
- Service: tenantCreditScores.service.ts
- Components: CreditScoreCard.tsx, CreditScoreHistory.tsx

**Findings**:
- ✅ RLS enabled on tenant_credit_scores
- ✅ SELECT policy: auth.uid() = user_id
- ✅ INSERT policy: auth.uid() = user_id (WITH CHECK)
- ✅ UPDATE policy: auth.uid() = user_id
- ✅ DELETE policy: auth.uid() = user_id
- ✅ Service injects user_id via getAuthenticatedUserId()
- ✅ Scoring algorithm has no injection vulnerabilities
- ✅ Payment history stored as JSONB (safe from SQL injection)
- ✅ No sensitive data in calculation logs

**Security Score**: 10/10
**Issues**: None
**Recommendations**: None

---

## [Automation Agent] ⚙️ Deploying

**Pre-deployment checks**:
- ✅ TypeScript: `npm run typecheck` (passed)
- ✅ ESLint: `npm run lint` (passed)
- ✅ Build: `npm run build` (passed)

**Database migration**:
- ✅ Applied: `supabase db push`
- ✅ Types generated: `supabase gen types typescript`
- ✅ Updated: `src/types/database.ts`

**Git workflow**:
- ✅ Branch created: `feature/tenant-credit-scoring`
- ✅ Files staged (8 files)
- ✅ Commit created: `[Agents] Add tenant credit scoring system`
- ✅ Pushed to remote

**Commit hash**: `f3a8b21`

---

## ✅ Task Completed

**Total time**: 9 minutes 34 seconds
**Time saved**: ~2 hours 50 minutes (compared to manual)

**Files created**:
1. `supabase/migrations/20251117120000_create_tenant_credit_scores.sql`
2. `src/services/tenantCreditScores.service.ts`
3. `src/types/index.ts` (updated with TenantCreditScore types)
4. `src/lib/serviceProxy.ts` (registered new service)
5. `src/features/tenants/components/CreditScoreCard.tsx`
6. `src/features/tenants/components/CreditScoreHistory.tsx`
7. `src/features/tenants/components/AddPaymentRecordDialog.tsx`
8. `public/locales/tr/tenants.json` (updated)
9. `public/locales/en/tenants.json` (updated)

**Next steps**:
1. Test locally: `npm run dev`
2. Navigate to Tenants page
3. Click on a tenant to see credit score
4. Add payment records to test calculation
5. Verify score updates automatically
6. Test on mobile (375px) and desktop (1024px+)
7. Create PR when satisfied

**Feature is ready to use!** 🎉
```

---

## 📝 Example 2: Quick Bug Fix

### User Request:
```
"The contracts table is missing an UPDATE policy for RLS"
```

### Orchestrator Response:

```markdown
## 🤖 Analyzing Request

**Task**: Security fix (missing RLS policy)
**Complexity**: Low
**Agents required**: Security → Automation

**Execution Plan**:
1. Security Agent: Audit contracts table
2. Security Agent: Generate fix
3. Automation Agent: Apply fix and commit

**Estimated time**: 2-3 minutes
**Proceed? [Yes/No]**
```

### User: "Yes"

```markdown
## [Security Agent] 🛡️ Auditing Contracts Table

**Table**: contracts
**RLS Status**: ✅ Enabled

**Policy Audit**:
- SELECT: ✅ Present
- INSERT: ✅ Present
- UPDATE: ❌ MISSING
- DELETE: ✅ Present

**Issue Found**: Missing UPDATE policy

**Auto-generated fix**:
```sql
CREATE POLICY "Users can update their own contracts"
  ON contracts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Applying fix...**

---

## [Automation Agent] ⚙️ Creating Migration

**Created**: `supabase/migrations/20251117130000_fix_contracts_update_policy.sql`

**Applied migration**: ✅ Success

**Git commit**:
- Message: `[Security] Fix missing UPDATE policy on contracts table`
- Hash: `a4d9c12`
- Pushed to: `fix/contracts-rls-policy`

---

## ✅ Fixed in 2 minutes

**What was done**:
- Identified missing UPDATE policy on contracts
- Created migration with fix
- Applied to database
- Committed and pushed to git

**Recommendation**:
Run `/review-rls` to check all other tables for similar issues

**Security Score after fix**: 10/10
```

---

## 📝 Example 3: Complex Multi-Table Feature

### User Request:
```
"Add a property showing scheduling system where agents can book property viewings
with potential buyers, send reminders, and track which properties get the most views"
```

### Orchestrator Response:

```markdown
## 🤖 Analyzing Request

**Feature**: Property Showing Scheduler
**Complexity**: High (multiple tables + business logic + analytics)
**Agents required**: Product (scope) → Architecture → Code → Product → Security → Automation

**Initial scoping**:
Consulting Product Agent for MVP definition...

---

## [Product Agent] 🎨 Feature Scoping

**Analyzing effort vs impact...**

**MVP Recommendation** (ship first):
- ✅ Schedule showing appointments
- ✅ Link to properties and potential buyers (inquiries)
- ✅ Basic reminder system (1 hour before)
- ✅ View showing history per property
- ✅ Count total showings per property

**Future Enhancements** (defer):
- ⏳ SMS/email reminders (requires external service)
- ⏳ Calendar sync (Google/Apple Calendar)
- ⏳ Advanced analytics (heatmaps, best times)
- ⏳ No-show tracking and scoring

**Execution Plan for MVP**:
1. Architecture: Create `property_showings` table
2. Code: Generate service with scheduling logic
3. Code: Build calendar UI for scheduling
4. Code: Add showing history to property details
5. Product: Add TR/EN translations
6. Security: Audit RLS and business logic
7. Automation: Deploy

**Estimated time**: 15-18 minutes
**Proceed with MVP? [Yes/No]**
```

### User: "Yes"

```markdown
## [Architecture Agent] 🏗️ Creating Schema

**Table**: property_showings

```sql
CREATE TABLE IF NOT EXISTS property_showings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  inquiry_id uuid REFERENCES property_inquiries(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 30,
  client_name text NOT NULL,
  client_phone text,
  client_email text,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  notes text,
  reminder_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE property_showings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own showings"
  ON property_showings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own showings"
  ON property_showings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own showings"
  ON property_showings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own showings"
  ON property_showings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_showings_user_id ON property_showings(user_id);
CREATE INDEX idx_showings_property_id ON property_showings(property_id);
CREATE INDEX idx_showings_scheduled_at ON property_showings(scheduled_at);
CREATE INDEX idx_showings_status ON property_showings(status);

-- Trigger
CREATE TRIGGER update_showings_updated_at
  BEFORE UPDATE ON property_showings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Validation**: ✅ All security requirements met

---

## [Code Agent] 💻 Generating Service

**Creating**: `src/services/propertyShowings.service.ts`

**Methods**:
- `getAll()`: All showings for user
- `getUpcoming()`: Scheduled showings in future
- `getByPropertyId(propertyId)`: Showing history for property
- `create(data)`: Schedule new showing (injects user_id)
- `update(id, data)`: Update showing
- `cancel(id)`: Mark as cancelled
- `complete(id)`: Mark as completed
- `getShowingStats(propertyId)`: Count showings per property

**Business logic**:
```typescript
async sendReminders() {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  const upcomingShowings = await supabase
    .from('property_showings')
    .select('*')
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', oneHourFromNow.toISOString())
    .eq('status', 'scheduled')
    .is('reminder_sent_at', null);

  // Mark reminders as sent (actual SMS/email in future enhancement)
  for (const showing of upcomingShowings.data || []) {
    await this.update(showing.id, { reminder_sent_at: now.toISOString() });
  }
}
```

---

## [Code Agent] 💻 Generating UI

**Component 1**: `src/features/properties/components/ShowingCalendar.tsx`
- Full calendar view (uses react-day-picker)
- Click day to schedule showing
- Shows existing showings as dots on calendar
- Mobile: List view, Desktop: Calendar grid

**Component 2**: `src/features/properties/components/ScheduleShowingDialog.tsx`
- React Hook Form with Zod validation
- Fields: date, time, duration, client info
- Auto-links to inquiry if opened from inquiry page

**Component 3**: `src/features/properties/components/ShowingHistory.tsx`
- Table/cards showing all showings for a property
- Stats: Total showings, Completed, Cancelled, No-shows
- Desktop: Table with filters, Mobile: Cards

---

## [Product Agent] 🎨 Translations

**Added keys** (TR/EN):
- `showings.title`: "Gösterimler" / "Showings"
- `showings.schedule`: "Gösterim Planla" / "Schedule Showing"
- `showings.upcoming`: "Yaklaşan Gösterimler" / "Upcoming Showings"
- `showings.history`: "Gösterim Geçmişi" / "Showing History"
- `showings.status.scheduled`: "Planlandı" / "Scheduled"
- `showings.status.completed`: "Tamamlandı" / "Completed"
- `showings.status.cancelled`: "İptal Edildi" / "Cancelled"
- `showings.status.noShow`: "Gelmedi" / "No-show"
- `showings.stats.total`: "Toplam Gösterim" / "Total Showings"

---

## [Security Agent] 🛡️ Security Audit

**Audit Results**:
- ✅ RLS enabled with all 4 policies
- ✅ User_id injection in create()
- ✅ Client data not exposed across users
- ✅ Inquiry_id uses SET NULL on delete (safe)
- ✅ Status field has CHECK constraint
- ✅ No injection vulnerabilities in filters

**Security Score**: 10/10

---

## [Automation Agent] ⚙️ Deploying

**Deployment steps**:
1. ✅ Migration applied
2. ✅ Types generated
3. ✅ TypeScript: No errors
4. ✅ ESLint: No errors
5. ✅ Build: Success
6. ✅ Committed: `[Agents] Add property showing scheduling system`
7. ✅ Pushed to: `feature/property-showings`

---

## ✅ Task Completed

**Total time**: 16 minutes 42 seconds
**Time saved**: ~6 hours 45 minutes

**What was built**:
- Complete showing scheduling system
- Calendar UI for desktop and mobile
- Showing history and analytics
- Reminder system (foundation for future SMS/email)

**13 files created/modified**

**Next steps**:
1. Test scheduling a showing
2. View showing on calendar
3. Check showing history on property page
4. Future: Integrate SMS/email service for reminders
```

---

## 💬 More Example Commands

### Simple Requests:

```
"Add a field for property square meters"
→ Architecture (alter table) → Automation

"Fix the typo in the Turkish translation for 'contracts'"
→ Product → Automation

"Make the dashboard load faster"
→ Code (optimize queries) → Automation
```

### Medium Requests:

```
"Add file upload for tenant documents"
→ Architecture (storage bucket) → Code (upload service) → Product → Security → Automation

"Create a commission calculator for sales and rentals"
→ Code (calculator service + UI) → Product → Security → Automation
```

### Complex Requests:

```
"Build an automated property matching system that emails potential buyers when
a property matching their criteria becomes available"
→ Product (scope) → Architecture (matching algorithm) → Code (service + email)
→ Product (translations + email templates) → Security → Automation
```

---

## 🎯 Pro Tips

### Be Specific:
❌ "Add reporting"
✅ "Add a monthly commission report showing total earnings by property type"

### Let Orchestrator Scope:
"I want property analytics"
→ Product Agent will ask: "What metrics?" and suggest MVP vs future

### Request Audits:
"Review all my services for missing user_id injection"
→ Security Agent scans everything and generates fixes

### Chain Requests:
"Add tenant documents feature, then add a reminder system for expiring documents"
→ Orchestrator handles both in sequence

---

**Ready to try it?** Copy any example and see the agents in action!
