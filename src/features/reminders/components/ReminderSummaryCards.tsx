import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Shield, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { COLORS } from '@/config/colors';
import { useReminderMetrics } from '../hooks/useReminderMetrics';

/**
 * Reminder Summary Cards Component
 * Displays three summary cards at the top of the Reminders page
 * 
 * Cards:
 * - Total Active: All reminders with reminder enabled
 * - Critical: Reminders in critical zone (<= 30 days or overdue)
 * - Pending Actions: Critical reminders that haven't been contacted
 */

interface ReminderSummaryCardsProps {
  reminders: ReminderWithDetails[];
  loading?: boolean;
  onCardClick?: (tab: 'critical' | 'underWatch' | 'completed') => void;
  className?: string;
}

interface SummaryMetric {
  value: number;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function ReminderSummaryCards({
  reminders,
  loading = false,
  onCardClick,
  className,
}: ReminderSummaryCardsProps) {
  const { t } = useTranslation('reminders');

  // Calculate metrics using hook
  const { metrics } = useReminderMetrics({ reminders });

  // Build cards array from metrics
  const cards: SummaryMetric[] = [
    {
      value: metrics.totalActive,
      label: t('summary.totalActive'),
      description: t('summary.totalActiveDescription'),
      icon: <Shield className="h-5 w-5 text-white" />,
      iconColor: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700',
      trend: metrics.trends?.totalActive,
    },
    {
      value: metrics.critical,
      label: t('summary.critical'),
      description: t('summary.criticalDescription'),
      icon: <AlertCircle className="h-5 w-5 text-white" />,
      iconColor: 'bg-gradient-to-br from-red-500 via-red-600 to-red-700',
      trend: metrics.trends?.critical,
    },
    {
      value: metrics.pendingActions,
      label: t('summary.pendingActions'),
      description: t('summary.pendingActionsDescription'),
      icon: <CheckCircle2 className="h-5 w-5 text-white" />,
      iconColor: 'bg-secondary',
      trend: metrics.trends?.pendingActions,
    },
  ];

  if (loading) {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80"
          >
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <CardTitle className="flex-1">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-20 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const handleCardClick = (index: number) => {
    if (!onCardClick) return;
    
    // Map card index to tab
    switch (index) {
      case 0: // Total Active - could go to "Under Watch" or first available tab
        onCardClick('underWatch');
        break;
      case 1: // Critical
        onCardClick('critical');
        break;
      case 2: // Pending Actions
        onCardClick('critical');
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {cards.map((metric, index) => (
        <Card
          key={index}
          className={cn(
            'shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:-translate-y-1',
            'border-gray-200/50 backdrop-blur-sm bg-white/90',
            'dark:border-gray-700/50 dark:bg-gray-900/90',
            onCardClick && 'cursor-pointer',
            className
          )}
          onClick={() => handleCardClick(index)}
        >
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className={cn(
              'p-2.5 rounded-xl transition-transform duration-300',
              metric.iconColor,
              'shadow-lg'
            )}>
              {metric.icon}
            </div>
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {metric.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-slate-100 dark:to-slate-300">
              {metric.value}
            </div>
            <p
              className={cn(
                'text-xs mt-1.5 leading-relaxed',
                COLORS.gray.text600,
                'dark:text-gray-400'
              )}
            >
              {metric.description}
            </p>
            {metric.trend && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                {metric.trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={
                    metric.trend.isPositive
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }
                >
                  {metric.trend.value > 0 ? '+' : ''}{metric.trend.value}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
