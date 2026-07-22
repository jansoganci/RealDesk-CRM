# Sprint 2 — Batch B: Dashboard Widgets (Expiring Alerts + Source Chart)

> **Audit Source:** `docs/sprint-audits.md` → Sprint 2 (Gaps #4 and #5)
> **Gap #4:** `getExpiringAgreements()` exists but no UI consumes it
> **Gap #5:** `getSourceBreakdown()` exists but no chart renders it
> **Project:** `/Users/jans/Projelerim/RealDesk-CRM/`

---

## Task B1: Expiring Agreements Widget

### Current State
`LeadsService.getExpiringAgreements()` (line 903) returns active agreements expiring within a threshold. `LeadsService.getExpiringSoon()` (line 932) returns the same for the user's agreements. Neither is called anywhere in the UI.

### What Needs to Change

#### B1a. Create `src/features/leads/hooks/useExpiringAgreements.ts`

New file — custom hook to fetch and manage expiring agreements:

```typescript
import { useCallback, useEffect, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { leadsService } from '@/lib/serviceProxy';
import type { BuyerAgentAgreement } from '@/services/leads.service';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 min

export function useExpiringAgreements(daysThreshold: number = 30) {
  const { currentOrg } = useOrg();
  const [agreements, setAgreements] = useState<BuyerAgentAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentOrg?.id) {
      setAgreements([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await leadsService.getExpiringAgreements(currentOrg.id, daysThreshold);
      setAgreements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expiring agreements');
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, daysThreshold]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!currentOrg?.id) return;
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [currentOrg?.id, refresh]);

  return { agreements, loading, error, refresh };
}
```

#### B1b. Create `src/features/leads/components/ExpiringAgreementsCard.tsx`

New component — compact dashboard card showing agreements expiring soon:

```typescript
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, ArrowRight, FileText } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { useExpiringAgreements } from '../hooks/useExpiringAgreements';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

export function ExpiringAgreementsCard() {
  const { t } = useTranslation('leads');
  const navigate = useNavigate();
  const { agreements, loading } = useExpiringAgreements(30);

  // Days until expiration badge color
  const getExpiryBadge = (expirationDate: string) => {
    const daysLeft = differenceInDays(new Date(expirationDate), new Date());
    if (daysLeft <= 7) return { variant: 'destructive' as const, label: `${daysLeft}d` };
    if (daysLeft <= 14) return { variant: 'warning' as const, label: `${daysLeft}d` };
    return { variant: 'default' as const, label: `${daysLeft}d` };
  };

  return (
    <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-sm font-semibold">
              {t('dashboard.expiringAgreements', 'Expiring Agreements')}
            </CardTitle>
          </div>
          {agreements.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {agreements.length} {t('dashboard.expiring', 'expiring')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : agreements.length === 0 ? (
          <p className={`text-sm ${COLORS.gray.text500}`}>
            {t('dashboard.noExpiringAgreements', 'No agreements expiring within 30 days.')}
          </p>
        ) : (
          <div className="space-y-2">
            {agreements.slice(0, 5).map((agreement) => {
              const badge = getExpiryBadge(agreement.expiration_date);
              return (
                <div
                  key={agreement.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/leads/${agreement.lead_id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {agreement.lead_id ? `Lead #${agreement.lead_id.slice(0, 8)}` : 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('dashboard.expiresOn', 'Expires {{date}}', {
                        date: format(new Date(agreement.expiration_date), 'MMM d, yyyy'),
                      })}
                    </p>
                  </div>
                  <Badge variant={badge.variant} className="ml-2 shrink-0 text-xs">
                    {badge.label}
                  </Badge>
                </div>
              );
            })}
            {agreements.length > 5 && (
              <Button
                variant="link"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate('/leads')}
              >
                {t('dashboard.viewAll', 'View all {{count}} expiring agreements', {
                  count: agreements.length,
                })}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### B1c. `src/features/dashboard/Dashboard.tsx`

**Add import:**
```typescript
import { ExpiringAgreementsCard } from '@/features/leads/components/ExpiringAgreementsCard';
```

**Add component after `<IncomeForecastCard />` (line 86):**
```tsx
<ExpiringAgreementsCard />
```

#### B1d. `src/hooks/useOrg.tsx`

Check if `useOrg` is properly imported. The existing hooks (useDailyBrief) import from `@/contexts/OrgContext`. Make sure `useOrg` returns `currentOrg` with `id`. The pattern is already used in useDailyBrief so it's fine.

#### B1e. `public/locales/en/leads.json`

Add these keys:
```json
{
  "dashboard": {
    "expiringAgreements": "Expiring Agreements",
    "expiring": "expiring",
    "noExpiringAgreements": "No agreements expiring within 30 days.",
    "expiresOn": "Expires {{date}}",
    "viewAll": "View all {{count}} expiring agreements"
  }
}
```

---

## Task B2: Lead Source Breakdown Chart

### Current State
`LeadsService.getSourceBreakdown()` (line 804) returns `Array<{ source: LeadSource; count: number }>` but no UI renders it.

Since the source breakdown is a lead-specific metric, it should live in the leads feature, not finance. But it also makes sense on the dashboard for an at-a-glance view.

### What Needs to Change

#### B2a. Create `src/features/leads/hooks/useLeadSourceBreakdown.ts`

New file:

```typescript
import { useCallback, useEffect, useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { leadsService } from '@/lib/serviceProxy';
import type { LeadSource } from '@/services/leads.service';

export interface SourceBreakdownItem {
  source: LeadSource;
  count: number;
  percentage: number;
}

export function useLeadSourceBreakdown() {
  const { currentOrg } = useOrg();
  const [data, setData] = useState<SourceBreakdownItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentOrg?.id) {
      setData([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const raw = await leadsService.getSourceBreakdown(currentOrg.id);
      const totalCount = raw.reduce((sum, item) => sum + item.count, 0);
      const enriched: SourceBreakdownItem[] = raw.map((item) => ({
        source: item.source,
        count: item.count,
        percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0,
      }));
      setData(enriched);
      setTotal(totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load source breakdown');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, total, loading, error, refresh };
}
```

#### B2b. Create `src/features/leads/components/LeadSourceBreakdownCard.tsx`

New component — pie/bar chart showing leads by source:

```typescript
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Users } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { useLeadSourceBreakdown } from '../hooks/useLeadSourceBreakdown';
import { cn } from '@/lib/utils';

const SOURCE_COLORS: Record<string, string> = {
  zillow: '#2563EB',        // blue-600
  realtor_com: '#DC2626',   // red-600
  referral: '#16A34A',      // green-600
  sign_call: '#D97706',     // amber-600
  social_media: '#7C3AED',  // violet-600
  cold_call: '#0891B2',     // cyan-600
  open_house: '#DB2777',    // pink-600
  other: '#6B7280',         // gray-500
};

const SOURCE_LABELS: Record<string, string> = {
  zillow: 'Zillow',
  realtor_com: 'Realtor.com',
  referral: 'Referral',
  sign_call: 'Sign Call',
  social_media: 'Social Media',
  cold_call: 'Cold Call',
  open_house: 'Open House',
  other: 'Other',
};

export function LeadSourceBreakdownCard() {
  const { t } = useTranslation('leads');
  const { data, total, loading } = useLeadSourceBreakdown();

  const chartData = data.map((item) => ({
    name: SOURCE_LABELS[item.source] || item.source,
    value: item.count,
    color: SOURCE_COLORS[item.source] || '#6B7280',
  }));

  return (
    <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-sm font-semibold">
              {t('dashboard.leadSources', 'Lead Sources')}
            </CardTitle>
          </div>
          {!loading && (
            <span className="text-xs text-muted-foreground">
              {t('dashboard.totalLeads', '{{count}} total', { count: total })}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : data.length === 0 ? (
          <p className={`text-sm ${COLORS.gray.text500}`}>
            {t('dashboard.noLeadData', 'No lead data available.')}
          </p>
        ) : (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `${value} (${data.find(d => d.count === value)?.percentage || 0}%)`,
                    'Leads',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend as simple grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 w-full">
              {data.slice(0, 8).map((item) => (
                <div key={item.source} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: SOURCE_COLORS[item.source] || '#6B7280' }}
                  />
                  <span className="text-muted-foreground">
                    {SOURCE_LABELS[item.source] || item.source}
                  </span>
                  <span className="font-medium ml-auto">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### B2c. `src/features/dashboard/Dashboard.tsx`

**Add import:**
```typescript
import { LeadSourceBreakdownCard } from '@/features/leads/components/LeadSourceBreakdownCard';
```

**Add component after `<ExpiringAgreementsCard />`:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <ExpiringAgreementsCard />
  <LeadSourceBreakdownCard />
</div>
```

**Replace the standalone `<ExpiringAgreementsCard />`** added in Task B1 with this grid layout.

#### B2d. `public/locales/en/leads.json`

Add keys:
```json
{
  "dashboard": {
    "leadSources": "Lead Sources",
    "totalLeads": "{{count}} total",
    "noLeadData": "No lead data available."
  }
}
```

---

## Total Files Changed (Batch B)

| File | Task | Type | Lines |
|------|------|------|-------|
| `src/features/leads/hooks/useExpiringAgreements.ts` | B1 | **NEW** | ~40 |
| `src/features/leads/components/ExpiringAgreementsCard.tsx` | B1 | **NEW** | ~105 |
| `src/features/leads/hooks/useLeadSourceBreakdown.ts` | B2 | **NEW** | ~55 |
| `src/features/leads/components/LeadSourceBreakdownCard.tsx` | B2 | **NEW** | ~120 |
| `src/features/dashboard/Dashboard.tsx` | B1+B2 | Modified | ~10 |
| `public/locales/en/leads.json` | B1+B2 | Modified | ~10 keys |

**Estimated time in Cursor:** ~25-30 minutes

---

## Verification

- Dashboard shows "Expiring Agreements" card with list of agreements expiring within 30 days
- Agreements expiring in ≤7 days show red badge, ≤14 days show amber badge
- Clicking an agreement navigates to the lead detail page
- Dashboard shows "Lead Sources" card with donut chart + source legend
- Both cards show loading skeletons while data loads
- Both cards show empty state when no data exists
- No TypeScript errors
