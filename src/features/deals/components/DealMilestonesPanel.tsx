import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { COLORS } from '@/config/colors';
import { dealsService, type DealWithRelations } from '@/lib/serviceProxy';
import type { DealMilestone } from '@/types';

function formatDue(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

function isActionableStatus(status: string): boolean {
  return ['pending', 'in_progress', 'overdue'].includes(status);
}

interface DealMilestonesPanelProps {
  deal: DealWithRelations;
  onRefresh: () => void | Promise<void>;
  readOnly?: boolean;
}

export function DealMilestonesPanel({
  deal,
  onRefresh,
  readOnly = false,
}: DealMilestonesPanelProps) {
  const { t } = useTranslation('deals');
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const milestones = useMemo(() => {
    const rows = deal.deal_milestones ?? [];
    return [...rows].sort((a, b) => a.due_date.localeCompare(b.due_date));
  }, [deal.deal_milestones]);

  const statusLabel = (s: string) =>
    t(`milestones.status.${s}`, { defaultValue: s });

  const run = async (milestoneId: string, status: DealMilestone['status']) => {
    if (readOnly) return;
    setBusyId(milestoneId);
    try {
      await dealsService.updateMilestoneStatus(milestoneId, status);
      toast({ title: t('milestones.toastUpdated') });
      await onRefresh();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t('milestones.toastError'),
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const renderMenu = (m: DealMilestone) => {
    if (readOnly || !isActionableStatus(m.status)) return null;
    const busy = busyId === m.id;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={busy}
            aria-label={t('milestones.actions')}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(m.status === 'pending' || m.status === 'overdue') && (
            <DropdownMenuItem
              onClick={() => void run(m.id, 'in_progress')}
            >
              {t('milestones.actionInProgress')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => void run(m.id, 'complete')}>
            {t('milestones.actionComplete')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void run(m.id, 'waived')}>
            {t('milestones.actionWaive')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <Card className="border-gray-200/80 dark:border-slate-700 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{t('detail.section.milestones')}</CardTitle>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <p className={`text-sm ${COLORS.muted.text} dark:text-slate-400`}>
            {t('detail.milestonesEmpty')}
          </p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('list.tableName')}</TableHead>
                    <TableHead>{t('detail.due')}</TableHead>
                    <TableHead>{t('list.tableStage')}</TableHead>
                    <TableHead className="w-[70px] text-right">
                      {t('milestones.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestones.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.title}</TableCell>
                      <TableCell>{formatDue(m.due_date)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {statusLabel(m.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{renderMenu(m)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="md:hidden space-y-3">
              {milestones.map((m) => (
                <li
                  key={m.id}
                  className="rounded-lg border border-gray-100 dark:border-slate-800 p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{m.title}</div>
                      <div className={`${COLORS.muted.text} dark:text-slate-400 mt-1`}>
                        {formatDue(m.due_date)} · {statusLabel(m.status)}
                      </div>
                    </div>
                    {renderMenu(m)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
