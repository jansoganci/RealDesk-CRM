import { ReactNode } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TeamSummaryCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: ReactNode;
  variant?: 'default' | 'primary' | 'success';
  formatValue?: (value: string | number) => string;
}

export function TeamSummaryCard({
  title,
  value,
  trend,
  icon,
  variant = 'default',
  formatValue,
}: TeamSummaryCardProps) {
  const displayValue = formatValue ? formatValue(value) : value;

  const variantClasses = {
    default: 'border-border bg-card',
    primary: 'border-primary/40 bg-primary/10',
    success: 'border-success/40 bg-success/15',
  };

  const iconClasses = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/15 text-primary',
    success: 'bg-success/15 text-success',
  };

  return (
    <Card className={cn('border', variantClasses[variant])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 truncate text-2xl font-semibold text-foreground">
              {displayValue}
            </p>
            {trend !== undefined && trend !== 0 && (
              <div className="mt-2 flex items-center gap-1">
                {trend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend > 0 ? 'text-success' : 'text-destructive'
                  )}
                >
                  {trend > 0 ? '+' : ''}
                  {trend}%
                </span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'flex-shrink-0 p-2 rounded-lg',
              iconClasses[variant]
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
