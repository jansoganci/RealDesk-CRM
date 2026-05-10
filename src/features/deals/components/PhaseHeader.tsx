import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { COLORS } from '@/config/colors';
import { cn } from '@/lib/utils';

type PhaseHealth = 'clear' | 'action_needed' | 'overdue';

type PhaseHeaderProps = {
  phaseNumber: 1 | 2 | 3 | 4;
  phaseName: string;
  completedCount: number;
  totalCount: number;
  health: PhaseHealth;
  collapsed: boolean;
  onToggle: () => void;
};

function getHealthBadge(health: PhaseHealth): { label: string; className: string } {
  if (health === 'overdue') {
    return {
      label: 'Overdue',
      className: `${COLORS.danger.bgLight} ${COLORS.danger.textDark} border-red-200`,
    };
  }
  if (health === 'action_needed') {
    return {
      label: 'Action Needed',
      className: `${COLORS.warning.bgLight} ${COLORS.warning.textDark} border-amber-200`,
    };
  }
  return {
    label: 'Clear',
    className: `${COLORS.success.bgLight} ${COLORS.success.textDark} border-emerald-200`,
  };
}

export function PhaseHeader({
  phaseNumber,
  phaseName,
  completedCount,
  totalCount,
  health,
  collapsed,
  onToggle,
}: PhaseHeaderProps) {
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const badge = getHealthBadge(health);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Phase {phaseNumber}</Badge>
            <h3 className={cn('text-base font-semibold', COLORS.gray.text900, 'dark:text-slate-100')}>{phaseName}</h3>
            <Badge className={cn('border', badge.className)}>{badge.label}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-36">
              <Progress value={progress} />
            </div>
            <p className={cn('text-sm', COLORS.gray.text600, 'dark:text-slate-300')}>
              {completedCount} / {totalCount} complete
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          {collapsed ? 'Expand' : 'Collapse'}
        </Button>
      </div>
    </div>
  );
}
