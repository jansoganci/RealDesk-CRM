import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Filter, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrg } from '@/contexts/OrgContext';
import { dailyBriefService } from '@/lib/serviceProxy';
import { ROUTES } from '@/config/constants';
import { COLORS } from '@/config/colors';
import type { DailyBriefMilestoneItem } from '@/types';

type FilterValue = 'all' | 'overdue' | 'today' | 'this_week' | 'pending';

const FILTER_OPTIONS: { value: FilterValue; labelKey: string }[] = [
  { value: 'all', labelKey: 'timeline.filters.all' },
  { value: 'overdue', labelKey: 'timeline.filters.overdue' },
  { value: 'today', labelKey: 'timeline.filters.dueToday' },
  { value: 'this_week', labelKey: 'timeline.filters.thisWeek' },
  { value: 'pending', labelKey: 'timeline.filters.pending' },
];

export function TimelinePage() {
  const { t } = useTranslation('deals');
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const [milestones, setMilestones] = useState<DailyBriefMilestoneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!currentOrg?.id) return;
      setLoading(true);
      try {
        const data = await dailyBriefService.getDailyBriefData();
        setMilestones([
          ...data.overdue,
          ...data.dueToday,
          ...data.due3Days,
          ...data.due7Days,
        ]);
      } catch {
        setMilestones([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [currentOrg?.id]);

  const filtered = milestones
    .filter((m) => {
      if (filter === 'overdue') return m.daysUntilDue < 0;
      if (filter === 'today') return m.daysUntilDue === 0;
      if (filter === 'this_week') return m.daysUntilDue >= 1 && m.daysUntilDue <= 7;
      if (filter === 'pending') return m.daysUntilDue >= 0;
      return true;
    })
    .filter((m) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        m.milestoneTitle.toLowerCase().includes(q) ||
        m.dealName.toLowerCase().includes(q) ||
        m.propertyAddress.toLowerCase().includes(q)
      );
    });

  const getDayBadge = (days: number) => {
    if (days < 0)
      return {
        variant: 'destructive' as const,
        label: t('timeline.overdue', { days: Math.abs(days) }),
      };
    if (days === 0) return { variant: 'warning' as const, label: t('timeline.dueToday') };
    return { variant: 'default' as const, label: t('timeline.dueIn', { days }) };
  };

  return (
    <MainLayout title={t('timeline.pageTitle', 'Timeline')}>
      <PageContainer>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('timeline.searchPlaceholder', 'Search milestones...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className={`text-sm ${COLORS.gray.text500}`}>
                {t('timeline.empty', 'No milestones match your filters.')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((m) => {
              const badge = getDayBadge(m.daysUntilDue);
              return (
                <Card
                  key={m.milestoneId}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`${ROUTES.DEALS}/${m.dealId}`)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.milestoneTitle}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.dealName} — {m.propertyAddress}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.responsibleParty && (
                          <span className="text-xs text-muted-foreground">
                            {m.responsibleParty.replace('_', ' ')}
                          </span>
                        )}
                        <Badge variant={badge.variant} className="text-xs shrink-0">
                          {badge.label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}
