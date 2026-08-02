import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface YearOverYearIndicatorProps {
  current: number;
  previous: number;
  className?: string;
}

export const YearOverYearIndicator = ({
  current,
  previous,
  className = ''
}: YearOverYearIndicatorProps) => {
  const { t } = useTranslation(['finance']);

  // Handle edge cases
  if (previous === 0 && current === 0) {
    return null; // No comparison if both are zero
  }

  if (previous === 0) {
    // Previous year had no data, show as new
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <TrendingUp className="h-4 w-4 text-success" />
        <span className="text-sm font-medium text-success">
          {t('finance:performance.new')}
        </span>
      </div>
    );
  }

  const change = ((current - previous) / previous) * 100;
  const isPositive = change >= 0;
  const changeAbs = Math.abs(change);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {isPositive ? (
        <TrendingUp className="h-4 w-4 text-success" />
      ) : (
        <TrendingDown className="h-4 w-4 text-destructive" />
      )}
      <span className={`text-sm font-medium ${
        isPositive ? 'text-success' : 'text-destructive'
      }`}>
        {isPositive ? '+' : ''}{changeAbs.toFixed(1)}%
      </span>
      <span className="text-xs text-muted-foreground">
        {t('finance:performance.vsLastYear')}
      </span>
    </div>
  );
};

