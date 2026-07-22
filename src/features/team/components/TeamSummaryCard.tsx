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
    default: 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700',
    primary:
      'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800',
    success:
      'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800',
  };

  const iconClasses = {
    default: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-800',
    primary: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/60',
    success:
      'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/60',
  };

  return (
    <Card className={cn('border', variantClasses[variant])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{title}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100 truncate">
              {displayValue}
            </p>
            {trend !== undefined && trend !== 0 && (
              <div className="mt-2 flex items-center gap-1">
                {trend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
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
