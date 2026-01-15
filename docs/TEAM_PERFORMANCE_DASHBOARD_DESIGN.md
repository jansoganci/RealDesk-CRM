# Team Performance Dashboard - Design Specification

> "Simplicity is the ultimate sophistication." — Steve Jobs

---

## Executive Summary

A minimalist dashboard for organization owners to answer one question:
**"Is my team making me money?"**

Three metrics. One glance. Zero confusion.

---

## Part 1: Metric Curation (The Steve Jobs Decision)

### Original 5 Metrics Evaluated

| Metric | Verdict | Reasoning |
|--------|---------|-----------|
| Total Commission Earned | **KEEP** | THE metric. Direct answer to "Is this person valuable?" |
| Deals Closed | **KEEP** | Activity indicator. Shows productivity. |
| Active Contracts | **KEEP** | Responsibility scope. Current workload. |
| Properties Under Management | DEFER | Redundant. Derivable from contracts. |
| Reminder Completion Rate | DEFER | Quality metric, but second-order. V2 feature. |

### Final MVP Metrics (3 Only)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   1. COMMISSION EARNED     "Are they making us money?"      │
│                                                             │
│   2. DEALS CLOSED          "Are they productive?"           │
│                                                             │
│   3. ACTIVE CONTRACTS      "What are they responsible for?" │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Why 3?**
- Steve Jobs: "People think focus means saying yes. It means saying no."
- 3 metrics = scannable in 2 seconds
- 5 metrics = cognitive overload, eyes dart around
- Commission tells the money story
- Deals tells the activity story
- Contracts tells the responsibility story

Everything else is detail that distracts from the main story.

---

## Part 2: User Journey

### Entry Point

**Location:** Sidebar navigation (Owner-only visibility)

```
┌─────────────────┐
│ 📊 Dashboard    │
│ 👥 Owners       │
│ 🏠 Properties   │
│ 👤 Tenants      │
│ 📄 Contracts    │
│ ...             │
│ ─────────────── │
│ 📈 Team         │  ← Only visible to role='owner'
│ ⚙️  Profile     │
└─────────────────┘
```

**Why separate page, not dashboard card?**
- Privacy: Members shouldn't accidentally see peer performance
- Focus: Dashboard is for property/contract overview, not team management
- Steve Jobs: One thing per screen, done perfectly

### Visual Journey

```
OWNER LANDS ON TEAM PAGE
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   TEAM PERFORMANCE                        [This Month ▼]   │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │   ₺285K     │  │     14      │  │     47      │        │
│   │ Commission  │  │   Deals     │  │  Contracts  │        │
│   │   +12%      │  │   Closed    │  │   Active    │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│         ▲                                                   │
│         │                                                   │
│    FIRST THING OWNER SEES (largest, leftmost)              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   TEAM MEMBERS                                              │
│   ┌─────────────────────────────────────────────────────┐  │
│   │ Name          Commission    Deals    Contracts       │  │
│   ├─────────────────────────────────────────────────────┤  │
│   │ 🟢 Ahmet Y.   ₺142,500      8        24              │  │
│   │ 🟢 Fatma D.   ₺98,000       4        15              │  │
│   │ 🟡 Can Ö.     ₺44,500       2        8               │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Level | What | Interaction |
|-------|------|-------------|
| **0 clicks** | Team totals (3 cards) | Visible immediately |
| **0 clicks** | Member list with metrics | Visible immediately |
| **1 click** | Filter by time period | Dropdown |
| **Future (V2)** | Member detail drill-down | Click row |

### Questions Answered Without Clicking

1. "How much commission did my team earn?" → Top left card
2. "How many deals closed?" → Middle card
3. "Who's my top performer?" → First row in table (sorted by commission)
4. "Who needs coaching?" → Last row in table
5. "What's the trend?" → +/- percentage on commission card

### Exit Actions

After viewing, owner typically:
1. **Celebrate** → Top performer recognition
2. **Coach** → Schedule meeting with underperformer
3. **Plan** → Adjust team workload/territories
4. **Exit** → Return to daily operations

---

## Part 3: UI/UX Principles (Steve Jobs Minimalism)

### Visual Hierarchy

```
IMPORTANCE SCALE (Steve Jobs Priority)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. COMMISSION TOTAL      [████████████] Largest number, bold, left position
2. Team member names     [████████]     Clear, scannable
3. Deals/Contracts       [██████]       Supporting context
4. Time period filter    [███]          Functional, not prominent
5. Trend indicator       [██]           Subtle, informative
```

### Color Philosophy

**Monochromatic with semantic accents only:**

```css
/* Base palette - clean, professional */
--background: #FAFAFA;      /* Warm white */
--card: #FFFFFF;            /* Pure white */
--text-primary: #1A1A1A;    /* Near black */
--text-secondary: #6B7280;  /* Muted gray */
--border: #E5E7EB;          /* Subtle gray */

/* Semantic accents - used sparingly */
--accent-money: #059669;    /* Emerald - commission/positive */
--accent-activity: #2563EB; /* Blue - deals/neutral */
--accent-warning: #D97706;  /* Amber - needs attention */
```

**Color usage rules:**
- Commission numbers: Emerald (money = green)
- Deals/Contracts: Default text (neutral information)
- Trend up: Emerald
- Trend down: Amber (not red - less alarming)
- Everything else: Grayscale

### Typography

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   TEAM PERFORMANCE          ← text-sm, font-semibold, gray  │
│                                                             │
│   ₺285,000                  ← text-4xl, font-bold, emerald  │
│   Commission                ← text-sm, text-muted           │
│   +12% vs last month        ← text-xs, emerald              │
│                                                             │
│   Ahmet Yılmaz              ← text-sm, font-medium          │
│   ₺142,500                  ← text-sm, font-semibold        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Whitespace (Steve Loved Empty Space)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│     ← 24px padding                                               │
│                                                                  │
│         ┌─────────┐    ┌─────────┐    ┌─────────┐               │
│         │         │    │         │    │         │               │
│         │  Card   │    │  Card   │    │  Card   │               │
│         │         │    │         │    │         │               │
│         └─────────┘    └─────────┘    └─────────┘               │
│              ↑              ↑              ↑                     │
│              └──── 16px gap between cards ────┘                 │
│                                                                  │
│     ← 32px vertical space before table                          │
│                                                                  │
│         ┌───────────────────────────────────────┐               │
│         │                                       │               │
│         │            Team Table                 │               │
│         │                                       │               │
│         └───────────────────────────────────────┘               │
│                                                                  │
│     ← 24px padding                                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Interaction Design

| Element | Interaction | Animation |
|---------|-------------|-----------|
| Summary cards | Read-only | None (static = trustworthy) |
| Time period dropdown | Click to change | Subtle fade transition |
| Table rows | Hover highlight | `bg-gray-50` on hover |
| Table sorting | Click header | Arrow indicator |
| Member drill-down | V2 (not MVP) | — |

**Steve Jobs rule:** No gratuitous animations. Movement should convey meaning, not decoration.

### Mobile Responsive

```
DESKTOP (lg+)                    MOBILE (< md)
┌───────────────────────┐        ┌─────────────────┐
│ [Card] [Card] [Card]  │        │     [Card]      │
│                       │   →    │     [Card]      │
│ ┌───────────────────┐ │        │     [Card]      │
│ │ Full table        │ │        │ ┌─────────────┐ │
│ │ with all columns  │ │        │ │ Name + Comm │ │
│ └───────────────────┘ │        │ │ (2 col only)│ │
└───────────────────────┘        └─────────────────┘
```

Mobile shows:
- All 3 summary cards (stacked)
- Table with 2 columns only: Name, Commission
- Deals/Contracts hidden (secondary info)

---

## Part 4: Backend Architecture

### API Design (Single Endpoint)

```typescript
// One endpoint, one response, one purpose
GET /api/team-performance?period=this_month

Response: {
  summary: {
    totalCommission: 285000,
    totalDeals: 14,
    activeContracts: 47,
    trend: {
      commission: +12,  // percentage vs previous period
    }
  },
  members: [
    {
      id: "uuid",
      name: "Ahmet Yılmaz",
      email: "ahmet@...",
      avatarUrl: "...",
      commission: 142500,
      deals: 8,
      activeContracts: 24,
      status: "active"
    },
    // ... sorted by commission DESC
  ],
  period: {
    start: "2026-01-01",
    end: "2026-01-31",
    label: "This Month"
  }
}
```

### RPC Function (Supabase)

```sql
-- Single RPC call, all data in one query
CREATE OR REPLACE FUNCTION get_team_performance(
  p_org_id UUID,
  p_start_date DATE DEFAULT date_trunc('month', CURRENT_DATE),
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_prev_start DATE;
  v_prev_end DATE;
BEGIN
  -- Calculate previous period for trend
  v_prev_start := p_start_date - (p_end_date - p_start_date + 1);
  v_prev_end := p_start_date - INTERVAL '1 day';

  SELECT json_build_object(
    'summary', (
      SELECT json_build_object(
        'totalCommission', COALESCE(SUM(c.amount), 0),
        'totalDeals', COUNT(DISTINCT c.id),
        'activeContracts', (
          SELECT COUNT(*) FROM contracts
          WHERE org_id = p_org_id
            AND status = 'Active'
            AND deleted_at IS NULL
        ),
        'trend', json_build_object(
          'commission', (
            -- Calculate % change from previous period
            SELECT CASE
              WHEN prev.total = 0 THEN 0
              ELSE ROUND(((curr.total - prev.total) / prev.total * 100)::numeric, 0)
            END
            FROM
              (SELECT COALESCE(SUM(amount), 0) as total
               FROM commissions
               WHERE org_id = p_org_id
                 AND created_at BETWEEN p_start_date AND p_end_date
                 AND deleted_at IS NULL) curr,
              (SELECT COALESCE(SUM(amount), 1) as total
               FROM commissions
               WHERE org_id = p_org_id
                 AND created_at BETWEEN v_prev_start AND v_prev_end
                 AND deleted_at IS NULL) prev
          )
        )
      )
      FROM commissions c
      WHERE c.org_id = p_org_id
        AND c.created_at BETWEEN p_start_date AND p_end_date
        AND c.deleted_at IS NULL
    ),
    'members', (
      SELECT COALESCE(json_agg(member_data ORDER BY member_data.commission DESC), '[]'::json)
      FROM (
        SELECT
          om.user_id as id,
          COALESCE(up.full_name, au.email) as name,
          au.email,
          au.raw_user_meta_data->>'avatar_url' as "avatarUrl",
          COALESCE(SUM(c.amount), 0) as commission,
          COUNT(DISTINCT c.id) as deals,
          (
            SELECT COUNT(*) FROM contracts ct
            WHERE ct.user_id = om.user_id
              AND ct.org_id = p_org_id
              AND ct.status = 'Active'
              AND ct.deleted_at IS NULL
          ) as "activeContracts",
          om.status
        FROM org_members om
        JOIN auth.users au ON au.id = om.user_id
        LEFT JOIN user_preferences up ON up.user_id = om.user_id
        LEFT JOIN commissions c ON c.user_id = om.user_id
          AND c.org_id = p_org_id
          AND c.created_at BETWEEN p_start_date AND p_end_date
          AND c.deleted_at IS NULL
        WHERE om.org_id = p_org_id
          AND om.status = 'active'
        GROUP BY om.user_id, om.status, up.full_name, au.email, au.raw_user_meta_data
      ) member_data
    ),
    'period', json_build_object(
      'start', p_start_date,
      'end', p_end_date,
      'label', CASE
        WHEN p_start_date = date_trunc('month', CURRENT_DATE) THEN 'This Month'
        WHEN p_start_date = date_trunc('month', CURRENT_DATE - INTERVAL '1 month') THEN 'Last Month'
        WHEN p_start_date = date_trunc('year', CURRENT_DATE) THEN 'This Year'
        ELSE to_char(p_start_date, 'Mon DD') || ' - ' || to_char(p_end_date, 'Mon DD')
      END
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
```

### RLS Policy (Owner-Only Access)

```sql
-- Only organization owners can view team performance
CREATE POLICY "team_performance_owner_only" ON org_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
        AND om.status = 'active'
    )
  );

-- The RPC function uses SECURITY DEFINER, so we check role inside:
-- Add this check at the start of get_team_performance function:
IF NOT EXISTS (
  SELECT 1 FROM org_members
  WHERE org_id = p_org_id
    AND user_id = auth.uid()
    AND role = 'owner'
    AND status = 'active'
) THEN
  RAISE EXCEPTION 'Access denied: Owner role required';
END IF;
```

### Performance Strategy

| Strategy | Implementation |
|----------|----------------|
| **Caching** | 5-minute cache in React Query |
| **Query optimization** | Single RPC call, no N+1 |
| **Indexing** | Indexes on `org_id`, `user_id`, `created_at` |
| **Target load time** | < 500ms |

---

## Part 5: Database Design

### No New Tables Required

All data exists in current schema:
- `org_members` - Team member list
- `commissions` - Revenue per member
- `contracts` - Deals and active contracts
- `user_preferences` - Member names
- `auth.users` - Email, avatar

### Indexes to Add

```sql
-- Optimize commission aggregation queries
CREATE INDEX IF NOT EXISTS idx_commissions_org_user_date
  ON commissions(org_id, user_id, created_at)
  WHERE deleted_at IS NULL;

-- Optimize active contracts count
CREATE INDEX IF NOT EXISTS idx_contracts_user_status
  ON contracts(user_id, status)
  WHERE deleted_at IS NULL AND status = 'Active';

-- Optimize org member lookups
CREATE INDEX IF NOT EXISTS idx_org_members_org_role
  ON org_members(org_id, role, status);
```

### Migration File

```sql
-- Migration: 20260115000000_add_team_performance_indexes.sql

-- Performance indexes for team dashboard
CREATE INDEX IF NOT EXISTS idx_commissions_org_user_date
  ON commissions(org_id, user_id, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_user_status
  ON contracts(user_id, status)
  WHERE deleted_at IS NULL AND status = 'Active';

CREATE INDEX IF NOT EXISTS idx_org_members_org_role
  ON org_members(org_id, role, status);

-- Grant execute on RPC function
GRANT EXECUTE ON FUNCTION get_team_performance TO authenticated;
```

---

## Part 6: Complete System Flow

### User Stories

```gherkin
Feature: Team Performance Dashboard

  # Access Control
  Scenario: Owner views team performance
    Given I am logged in as organization owner
    When I navigate to "Team" in sidebar
    Then I see the team performance dashboard
    And I see summary cards with totals
    And I see all team members with their metrics

  Scenario: Member cannot view team performance
    Given I am logged in as organization member
    Then I do not see "Team" in the sidebar
    And I cannot access /team route directly

  # Data Display
  Scenario: View current month performance
    Given I am on the team performance page
    When the page loads
    Then I see "This Month" selected by default
    And summary shows commission earned this month
    And members show deals closed this month

  Scenario: Change time period
    Given I am on the team performance page
    When I select "Last Month" from dropdown
    Then summary updates to show last month's data
    And member metrics update accordingly
```

### Component Structure (2 Components Only)

```
src/features/team/
├── TeamPerformance.tsx        # Main page component
├── components/
│   └── TeamSummaryCard.tsx    # Reusable summary card
├── hooks/
│   └── useTeamPerformance.ts  # Data fetching hook
└── types/
    └── team.types.ts          # TypeScript types
```

**Steve Jobs simplicity:** 2 components, 1 hook, 1 type file. Nothing more.

### Frontend Implementation

#### `TeamPerformance.tsx` (Main Page)

```tsx
import { useState } from 'react';
import { useTeamPerformance } from './hooks/useTeamPerformance';
import { TeamSummaryCard } from './components/TeamSummaryCard';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, FileText, Briefcase } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/config/colors';

type Period = 'this_month' | 'last_month' | 'this_quarter' | 'this_year';

export function TeamPerformance() {
  const { t } = useTranslation('team');
  const [period, setPeriod] = useState<Period>('this_month');
  const { data, isLoading } = useTeamPerformance(period);

  if (isLoading) {
    return <TeamPerformanceSkeleton />;
  }

  return (
    <MainLayout title={t('pageTitle')}>
      <PageContainer>
        {/* Header with period selector */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-slate-900">
            {t('pageTitle')}
          </h1>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">{t('periods.thisMonth')}</SelectItem>
              <SelectItem value="last_month">{t('periods.lastMonth')}</SelectItem>
              <SelectItem value="this_quarter">{t('periods.thisQuarter')}</SelectItem>
              <SelectItem value="this_year">{t('periods.thisYear')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards - 3 only */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <TeamSummaryCard
            title={t('metrics.commission')}
            value={formatCurrency(data.summary.totalCommission, 'TRY')}
            trend={data.summary.trend.commission}
            icon={<DollarSign className="h-5 w-5" />}
            variant="primary"
          />
          <TeamSummaryCard
            title={t('metrics.deals')}
            value={data.summary.totalDeals.toString()}
            icon={<FileText className="h-5 w-5" />}
          />
          <TeamSummaryCard
            title={t('metrics.activeContracts')}
            value={data.summary.activeContracts.toString()}
            icon={<Briefcase className="h-5 w-5" />}
          />
        </div>

        {/* Team Members Table */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-slate-700">
              {t('teamMembers')}
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data.members.map((member, index) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {member.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8 text-sm">
                  <div className="text-right">
                    <div className={`font-semibold ${COLORS.success.text}`}>
                      {formatCurrency(member.commission, 'TRY')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('metrics.commission')}
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="font-medium text-slate-700">
                      {member.deals}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('metrics.deals')}
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="font-medium text-slate-700">
                      {member.activeContracts}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('metrics.contracts')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </PageContainer>
    </MainLayout>
  );
}
```

#### `TeamSummaryCard.tsx`

```tsx
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamSummaryCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: React.ReactNode;
  variant?: 'default' | 'primary';
}

export function TeamSummaryCard({
  title,
  value,
  trend,
  icon,
  variant = 'default',
}: TeamSummaryCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          'p-2 rounded-lg',
          variant === 'primary'
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-slate-100 text-slate-600'
        )}>
          {icon}
        </div>
        <span className="text-sm text-gray-600">{title}</span>
      </div>
      <div className={cn(
        'text-2xl font-bold',
        variant === 'primary' ? 'text-emerald-600' : 'text-slate-900'
      )}>
        {value}
      </div>
      {trend !== undefined && (
        <div className={cn(
          'flex items-center gap-1 mt-1 text-xs',
          trend >= 0 ? 'text-emerald-600' : 'text-amber-600'
        )}>
          {trend >= 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{trend >= 0 ? '+' : ''}{trend}% vs last period</span>
        </div>
      )}
    </Card>
  );
}
```

#### `useTeamPerformance.ts` (Hook)

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrg } from '@/contexts/OrgContext';
import type { TeamPerformanceData } from '../types/team.types';

export function useTeamPerformance(period: string) {
  const { currentOrg } = useOrg();

  return useQuery({
    queryKey: ['team-performance', currentOrg?.id, period],
    queryFn: async (): Promise<TeamPerformanceData> => {
      const { startDate, endDate } = getPeriodDates(period);

      const { data, error } = await supabase.rpc('get_team_performance', {
        p_org_id: currentOrg!.id,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!currentOrg?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

function getPeriodDates(period: string): { startDate: string; endDate: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  switch (period) {
    case 'this_month':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        endDate: today,
      };
    case 'last_month':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        startDate: lastMonth.toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0],
      };
    case 'this_quarter':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return {
        startDate: quarterStart.toISOString().split('T')[0],
        endDate: today,
      };
    case 'this_year':
      return {
        startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: today,
      };
    default:
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        endDate: today,
      };
  }
}
```

#### `team.types.ts`

```typescript
export interface TeamMemberPerformance {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  commission: number;
  deals: number;
  activeContracts: number;
  status: 'active' | 'pending' | 'suspended';
}

export interface TeamPerformanceSummary {
  totalCommission: number;
  totalDeals: number;
  activeContracts: number;
  trend: {
    commission: number;
  };
}

export interface TeamPerformanceData {
  summary: TeamPerformanceSummary;
  members: TeamMemberPerformance[];
  period: {
    start: string;
    end: string;
    label: string;
  };
}
```

### Routing & Access Control

```tsx
// In App.tsx - add route (owner-only enforced at component level)
<Route
  path={ROUTES.TEAM}
  element={
    <ProtectedRoute>
      <TeamPerformance />
    </ProtectedRoute>
  }
/>

// In Sidebar.tsx - conditional rendering
{isOwner && (
  <NavLink to={ROUTES.TEAM} ...>
    <BarChart3 className="h-5 w-5" />
    <span>{t('team')}</span>
  </NavLink>
)}
```

### Translations

```json
// public/locales/en/team.json
{
  "pageTitle": "Team Performance",
  "teamMembers": "Team Members",
  "metrics": {
    "commission": "Commission",
    "deals": "Deals Closed",
    "activeContracts": "Active Contracts",
    "contracts": "Contracts"
  },
  "periods": {
    "thisMonth": "This Month",
    "lastMonth": "Last Month",
    "thisQuarter": "This Quarter",
    "thisYear": "This Year"
  },
  "empty": {
    "noMembers": "No team members yet",
    "noData": "No performance data for this period"
  }
}

// public/locales/tr/team.json
{
  "pageTitle": "Ekip Performansı",
  "teamMembers": "Ekip Üyeleri",
  "metrics": {
    "commission": "Komisyon",
    "deals": "Kapanan Anlaşmalar",
    "activeContracts": "Aktif Sözleşmeler",
    "contracts": "Sözleşmeler"
  },
  "periods": {
    "thisMonth": "Bu Ay",
    "lastMonth": "Geçen Ay",
    "thisQuarter": "Bu Çeyrek",
    "thisYear": "Bu Yıl"
  },
  "empty": {
    "noMembers": "Henüz ekip üyesi yok",
    "noData": "Bu dönem için performans verisi yok"
  }
}
```

---

## Implementation Checklist

### Phase 1: Database (Day 1)
- [ ] Create migration file with indexes
- [ ] Create `get_team_performance` RPC function
- [ ] Test RPC function in Supabase SQL editor
- [ ] Verify RLS enforcement

### Phase 2: Backend Service (Day 1-2)
- [ ] Create `team.types.ts`
- [ ] Create `useTeamPerformance.ts` hook
- [ ] Test API response format

### Phase 3: Frontend (Day 2-3)
- [ ] Create `TeamSummaryCard.tsx`
- [ ] Create `TeamPerformance.tsx`
- [ ] Add route to App.tsx
- [ ] Add sidebar link (owner-only)
- [ ] Add translations (EN/TR)

### Phase 4: Polish (Day 3)
- [ ] Loading skeleton
- [ ] Empty states
- [ ] Mobile responsive testing
- [ ] Error handling

### Effort Estimate

| Task | Effort |
|------|--------|
| Database (indexes + RPC) | 0.5 days |
| Types + Hook | 0.5 days |
| UI Components | 1 day |
| Integration + Testing | 0.5 days |
| Polish + Responsive | 0.5 days |
| **Total** | **3 days** |

---

## Version Roadmap

### V1 (MVP) - This Document
- 3 summary metrics
- Team member list sorted by commission
- Time period filter
- Owner-only access

### V1.1 (Enhancement)
- Add member drill-down (click row → detail view)
- Add reminder completion rate
- Export to CSV

### V2 (Advanced)
- Performance trends chart (line graph)
- Goal setting per member
- Comparison view (this month vs last)
- Leaderboard with badges

---

## Final Design Preview

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   TEAM PERFORMANCE                               [This Month ▼]     │
│                                                                     │
│   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐        │
│   │    ₺285K      │   │      14       │   │      47       │        │
│   │  Commission   │   │    Deals      │   │   Contracts   │        │
│   │   +12% ↑      │   │    Closed     │   │    Active     │        │
│   └───────────────┘   └───────────────┘   └───────────────┘        │
│                                                                     │
│   ─────────────────────────────────────────────────────────────    │
│                                                                     │
│   TEAM MEMBERS                                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                             │  │
│   │  (A)  Ahmet Yılmaz          ₺142,500      8        24      │  │
│   │       ahmet@example.com     Commission    Deals   Contracts │  │
│   │                                                             │  │
│   │  ─────────────────────────────────────────────────────────  │  │
│   │                                                             │  │
│   │  (F)  Fatma Demir           ₺98,000       4        15      │  │
│   │       fatma@example.com     Commission    Deals   Contracts │  │
│   │                                                             │  │
│   │  ─────────────────────────────────────────────────────────  │  │
│   │                                                             │  │
│   │  (C)  Can Öztürk            ₺44,500       2        8       │  │
│   │       can@example.com       Commission    Deals   Contracts │  │
│   │                                                             │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Steve Jobs would say: "Perfect. Ship it."
```

---

*Document Version: 1.0*
*Created: January 2026*
*Author: Claude (AI Assistant)*
*Philosophy: Less, but better.*
